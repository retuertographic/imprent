"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { SiteLink } from "../SiteLink";
import { loadSearchIndex, PER_PAGE, productImage } from "./catalog";
import { searchIndex, type SearchRecord, type SearchScope } from "./searchIndex";

export type { SearchScope };

/** Texto de la tarjeta, como en producción: descripción completa (o el detalle) sin etiquetas. */
const cardText = (r: SearchRecord) => (r.description || r.detail).replace(/<[^>]*>/g, " ");

/**
 * Resultados de búsqueda (?q=). Producción los pide a /api/search; aquí se calculan en el
 * navegador con el índice estático (searchIndex.ts), con el mismo orden y los mismos totales.
 */
export function ProductSearch({ query, scope }: { query: string; scope: SearchScope }) {
  const [results, setResults] = useState<SearchRecord[] | null>(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    loadSearchIndex()
      .then((index) => {
        if (!cancelled) setResults(searchIndex(index, query, scope));
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo completar la búsqueda.");
      });
    return () => {
      cancelled = true;
    };
  }, [query, scope, retry]);

  const loading = !results && !error;
  const total = results?.length ?? 0;
  const slice = results?.slice(page * PER_PAGE, (page + 1) * PER_PAGE) ?? [];
  const pageHits = slice.filter((r) => r.kind === "page");
  const productHits = slice.filter((r) => r.kind !== "page");

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
            <SiteLink key={p.id} href={p.path}>
              <small>{p.brand}</small>
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
              <p className="search-product-detail">{cardText(item)}</p>
              <SiteLink className="shop-configure" href={item.path}>
                Ver opciones y precios
              </SiteLink>
            </div>
          </article>
        ))}
      </div>
      {total > PER_PAGE && (
        <nav className="shop-pagination" aria-label="Páginas de resultados">
          <button disabled={!page} onClick={() => setPage(page - 1)}>
            Anterior
          </button>
          <span>
            Página {page + 1} de {Math.ceil(total / PER_PAGE)}
          </span>
          <button disabled={(page + 1) * PER_PAGE >= total} onClick={() => setPage(page + 1)}>
            Siguiente
          </button>
        </nav>
      )}
    </section>
  );
}
