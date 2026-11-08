"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { SiteLink } from "../SiteLink";
import { loadGroup, loadPages, PER_PAGE, productImage, productPath } from "./catalog";
import type { GroupData, SitePage } from "./types";

export type SearchScope = "all" | "roly" | "stamina";

type ProductResult = {
  id: string;
  name: string;
  path: string;
  image: string;
  description: string;
  brand: string;
};

type Results = { pages: SitePage[]; products: ProductResult[] };

const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const words = (text: string) => normalize(text).split(/[^a-z0-9ñ]+/).filter(Boolean);

/** Raíz sencilla: sin plural ni vocal final (camisetas → camiset, negra/negro → negr). */
const stem = (word: string) => {
  let w = word;
  if (w.length > 3 && w.endsWith("s")) w = w.slice(0, -1);
  if (w.length > 3 && /[aeo]$/.test(w)) w = w.slice(0, -1);
  return w;
};

/** Orden de los apartados con la misma relevancia. */
const LABEL_ORDER = ["CATEGORÍA", "APARTADO", "SERVICIO", "GUÍA"];

function search(query: string, groups: GroupData[], sitePages: SitePage[]): Results {
  const tokens = words(query);
  const stems = tokens.map(stem);

  // Productos: cada palabra buscada coincide (por raíz o como inicio) con alguna palabra de la ficha.
  const productMatches = (text: string) => {
    const list = words(text);
    const listStems = new Set(list.map(stem));
    return tokens.every((t, i) => listStems.has(stems[i]) || list.some((w) => w.startsWith(t)));
  };

  // Apartados y guías: inicio de palabra en el título o palabra exacta en el texto.
  const pages = sitePages
    .map((page) => {
      const title = words(page.name);
      const body = new Set(words(`${page.description} ${page.keywords}`));
      const inTitle = tokens.every((t) => title.some((w) => w.startsWith(t)));
      const anywhere = tokens.every((t) => title.some((w) => w.startsWith(t)) || body.has(t));
      return { page, score: inTitle ? 2 : anywhere ? 1 : 0 };
    })
    .filter((r) => r.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        LABEL_ORDER.indexOf(a.page.label) - LABEL_ORDER.indexOf(b.page.label) ||
        a.page.name.localeCompare(b.page.name, "es"),
    )
    .map((r) => r.page);

  const products: ProductResult[] = [];
  for (const group of groups) {
    for (const [key, p] of Object.entries(group.products)) {
      const brand = p.brand || group.brand;
      if (!productMatches(`${p.name} ${p.description} ${p.code} ${brand} ${p.keywords}`)) continue;
      products.push({
        id: `${brand}:${key}`,
        name: p.name,
        path: productPath(brand, p.code),
        image: p.image,
        description: p.description,
        brand: brand.toUpperCase(),
      });
    }
  }
  products.sort((a, b) => a.name.localeCompare(b.name, "es"));
  return { pages, products };
}

/** Resultados de búsqueda (?q=), calculados en el navegador con el catálogo estático. */
export function ProductSearch({ query, scope }: { query: string; scope: SearchScope }) {
  const [results, setResults] = useState<Results | null>(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const groups = scope === "all" ? [loadGroup("ropa"), loadGroup("merchandising")] : [loadGroup(scope === "roly" ? "ropa" : "merchandising")];
    const pagesPromise = scope === "all" ? loadPages() : Promise.resolve<SitePage[]>([]);
    Promise.all([Promise.all(groups), pagesPromise])
      .then(([data, sitePages]) => {
        if (!cancelled) setResults(search(query, data, sitePages));
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo completar la búsqueda.");
      });
    return () => {
      cancelled = true;
    };
  }, [query, scope, retry]);

  const loading = !results && !error;
  const total = results ? results.pages.length + results.products.length : 0;
  const slice = results ? [...results.pages, ...results.products].slice(page * PER_PAGE, (page + 1) * PER_PAGE) : [];
  const pageHits = slice.filter((item): item is SitePage => "label" in item);
  const productHits = slice.filter((item): item is ProductResult => "id" in item);

  const goTo = (next: number) => setPage(next);

  return (
    <section className="product-search-results" aria-label="Resultados de búsqueda">
      <div className="shop-results-line">
        <span>
          Resultados para «{query}»{results ? ` · ${total} coincidencias` : ""}
        </span>
      </div>
      {loading && (
        <p className="shop-loading" role="status">
          Buscando productos…
        </p>
      )}
      {error && (
        <div className="shop-notice" role="alert">
          <p>{error}</p>
          <button
            className="brand-button small"
            onClick={() => {
              setError("");
              setRetry((n) => n + 1);
            }}
          >
            Volver a intentar
          </button>
        </div>
      )}
      {results && total === 0 && (
        <div className="shop-notice">
          <h3>No encontramos resultados con esos detalles.</h3>
          <p>Prueba con menos palabras o con otra característica. Por ejemplo: «camiseta algodón» o «sudadera capucha».</p>
          <SiteLink href="/contacto/">Te ayudamos a encontrarlo</SiteLink>
        </div>
      )}
      {pageHits.length > 0 && (
        <nav className="search-site-pages" aria-label="Apartados y guías relacionados">
          {pageHits.map((p) => (
            <SiteLink key={p.path} href={p.path}>
              <small>{p.label}</small>
              <strong>{p.name}</strong>
              <span>{p.description}</span>
            </SiteLink>
          ))}
        </nav>
      )}
      <div className="shop-grid">
        {productHits.map((item) => (
          <article className="shop-card" key={item.id}>
            <SiteLink className="shop-card-photo" href={item.path}>
              {item.image ? (
                <img
                  src={productImage(item.image)}
                  alt={item.name}
                  width={500}
                  height={500}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span>Ver producto</span>
              )}
              <span className="shop-card-badge">Personalizable</span>
            </SiteLink>
            <div className="shop-card-info">
              <span className="shop-ref">{item.brand}</span>
              <h3>
                <SiteLink href={item.path}>{item.name}</SiteLink>
              </h3>
              <p className="search-product-detail">{item.description}</p>
              <SiteLink className="shop-configure" href={item.path}>
                Ver opciones y precios
              </SiteLink>
            </div>
          </article>
        ))}
      </div>
      {total > PER_PAGE && (
        <nav className="shop-pagination" aria-label="Páginas de resultados">
          <button disabled={!page} onClick={() => goTo(page - 1)}>
            Anterior
          </button>
          <span>
            Página {page + 1} de {Math.ceil(total / PER_PAGE)}
          </span>
          <button disabled={(page + 1) * PER_PAGE >= total} onClick={() => goTo(page + 1)}>
            Siguiente
          </button>
        </nav>
      )}
    </section>
  );
}
