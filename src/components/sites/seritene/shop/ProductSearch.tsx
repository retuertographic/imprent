"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { ArrowUpRight, MessageCircle } from "lucide-react";
import { searchHelp } from "../content";
import { SiteLink } from "../SiteLink";
import { loadSearchIndex, PER_PAGE, productImage } from "./catalog";
import { cardImageProps } from "./imageSizes";
import { pageLabel, searchCatalog, type SearchRecord, type SearchResults, type SearchScope } from "./searchIndex";

export type { SearchScope };

/** Texto de la tarjeta: descripción completa (o el detalle) sin etiquetas. */
const cardText = (r: SearchRecord) => (r.description || r.detail).replace(/<[^>]*>/g, " ");

/** Pocos productos: se añade la ayuda (categorías populares y WhatsApp) debajo. */
const FEW = 4;

function ProductGrid({ items }: { items: SearchRecord[] }) {
  return (
    <div className="shop-grid">
      {items.map((item) => (
        <article className="shop-card" key={item.id}>
          <SiteLink className="shop-card-photo" href={item.path}>
            {item.image ? (
              <img
                {...cardImageProps(item.image, productImage)}
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
  );
}

/** Ayuda cuando no hay resultados o hay pocos: categorías populares, corrección y contacto. */
function SearchHelp({ empty, query }: { empty: boolean; query: string }) {
  return (
    <div className={`search-help${empty ? "" : " search-help-compact"}`}>
      {empty ? (
        <>
          <h3>No encontramos productos para «{query}».</h3>
          <p>Prueba con menos palabras o con el nombre del producto (por ejemplo, «camiseta», «taza» o «lona»), o empieza por una de estas categorías:</p>
        </>
      ) : (
        <h3>¿No es lo que buscabas? Mira también estas categorías:</h3>
      )}
      <ul className="search-help-popular">
        {searchHelp.popular.map((p) => (
          <li key={p.href}>
            <SiteLink href={p.href}>{p.label}</SiteLink>
          </li>
        ))}
      </ul>
      <p className="search-help-contact">
        Trabajamos con muchos más productos de los que ves en la web. Si no lo encuentras, pídenoslo:
        <a className="search-help-whatsapp" href={searchHelp.whatsapp + encodeURIComponent(query)} target="_blank" rel="noreferrer">
          <MessageCircle size={17} aria-hidden="true" /> Pedir por WhatsApp
        </a>
        <SiteLink href="/contacto/">o escríbenos</SiteLink>
      </p>
    </div>
  );
}

/**
 * Resultados de búsqueda (?q=), calculados en el navegador con el índice estático
 * (searchIndex.ts): primero accesos a categorías o servicios y los productos; después, aparte,
 * las guías y artículos relacionados.
 */
export function ProductSearch({ query: initialQuery, scope }: { query: string; scope: SearchScope }) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    loadSearchIndex()
      .then((index) => {
        if (!cancelled) setResults(searchCatalog(index, query, scope));
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo completar la búsqueda.");
      });
    return () => {
      cancelled = true;
    };
  }, [query, scope, retry]);

  /** Aplica la corrección sugerida sin recargar (y la deja en la URL). */
  const applySuggestion = (suggestion: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("q", suggestion);
    window.history.replaceState(window.history.state, "", url);
    setPage(0);
    setQuery(suggestion);
  };

  const loading = !results && !error;
  const products = results?.products ?? [];
  const total = products.length;
  const slice = products.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const lastPage = (page + 1) * PER_PAGE >= total;
  const shownQuery = results?.corrected ? results.query : query;
  const empty = Boolean(results && !total && !results.related.length && !results.shortcuts.length);

  return (
    <section className="product-search-results" aria-label="Resultados de búsqueda">
      <div className="shop-results-line">
        <span>
          Resultados para «{shownQuery}»{results ? ` · ${total} ${total === 1 ? "producto" : "productos"}` : ""}
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
      {results?.corrected && (
        <p className="search-correction" role="status">
          No encontramos nada para «{query}». Te mostramos los resultados de «{results.query}».
        </p>
      )}
      {results?.suggestion && !results.corrected && (
        <p className="search-correction">
          ¿Quisiste decir{" "}
          <button type="button" onClick={() => applySuggestion(results.suggestion!)}>
            «{results.suggestion}»
          </button>
          ?
        </p>
      )}
      {results && results.shortcuts.length > 0 && page === 0 && (
        <nav className="search-shortcuts" aria-label="Categorías y servicios">
          {results.shortcuts.map((p) => (
            <SiteLink key={p.id} href={p.path}>
              <small>{pageLabel(p.brand)}</small>
              <strong>{p.name}</strong>
              <ArrowUpRight size={18} aria-hidden="true" />
            </SiteLink>
          ))}
        </nav>
      )}
      {empty && <SearchHelp empty query={query} />}
      {slice.length > 0 && <ProductGrid items={slice} />}
      {total > PER_PAGE && (
        <nav className="shop-pagination" aria-label="Páginas de resultados">
          <button disabled={!page} onClick={() => setPage(page - 1)}>
            Anterior
          </button>
          <span>
            Página {page + 1} de {Math.ceil(total / PER_PAGE)}
          </span>
          <button disabled={lastPage} onClick={() => setPage(page + 1)}>
            Siguiente
          </button>
        </nav>
      )}
      {results && lastPage && results.related.length > 0 && (
        <section className="search-related" aria-labelledby="search-related-title">
          <h2 id="search-related-title">Coinciden con parte de tu búsqueda</h2>
          <ProductGrid items={results.related} />
        </section>
      )}
      {results && lastPage && !empty && total < FEW && <SearchHelp empty={false} query={query} />}
      {results && lastPage && results.guides.length > 0 && (
        <section className="search-guides" aria-labelledby="search-guides-title">
          <h2 id="search-guides-title">Guías y artículos</h2>
          <div className="search-guides-list">
            {results.guides.map((p) => (
              <SiteLink key={p.id} href={p.path}>
                <small>{pageLabel(p.brand)}</small>
                <strong>{p.name}</strong>
                <span>{p.description}</span>
              </SiteLink>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
