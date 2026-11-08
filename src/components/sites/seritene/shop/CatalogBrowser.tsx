"use client";

import { useEffect, useState } from "react";
import { BASE_PATH } from "../content";
import { SiteLink } from "../SiteLink";
import { loadGroup, pageItems, PER_PAGE } from "./catalog";
import { ProductSearch } from "./ProductSearch";
import { CardPlaceholder, MedalCard, ShopCard } from "./ShopCard";
import type { CardItem, ShopGroup } from "./types";

type Props = {
  group: ShopGroup;
  /** Id de la categoría ("" para el listado completo del grupo). */
  categoryId: string;
  /** Ruta base de la paginación (?pagina=N). */
  basePath: string;
  /** Productos de la primera página, pintados en el HTML estático. */
  initialItems: CardItem[];
  totalModels: number;
  /** Buscador global (/productos/): busca en todo el catálogo. */
  switcher?: boolean;
};

/**
 * Listado paginado de 50 en 50 como en producción. La página (?pagina=N) y la búsqueda (?q=)
 * se leen de la URL en el navegador, porque la web es estática.
 */
export function CatalogBrowser({ group, categoryId, basePath, initialItems, totalModels, switcher = false }: Props) {
  const brand = group === "ropa" ? "roly" : "stamina";
  const [page, setPage] = useState(0);
  const [items, setItems] = useState(initialItems);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [retry, setRetry] = useState(0);
  const pages = Math.ceil(totalModels / PER_PAGE);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q")?.slice(0, 100).trim() ?? "";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- estado que depende de la URL del navegador
    if (q.length >= 2) setQuery(q);
    const requested = Number(params.get("pagina"));
    if (Number.isSafeInteger(requested) && requested > 1) setPage(requested - 1);
  }, []);

  useEffect(() => {
    if (page === 0 && !retry) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga de la página pedida
    setLoading(true);
    setError("");
    loadGroup(group)
      .then((data) => {
        if (cancelled) return;
        setItems(pageItems(data, categoryId, page));
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setItems([]);
        setError(e instanceof Error ? e.message : "No hemos podido cargar los productos.");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [group, categoryId, page, retry]);

  const href = (n: number) => `${BASE_PATH}${basePath}${n > 0 ? `?pagina=${n + 1}` : ""}`;

  return (
    <section className="shop-browser" aria-label="Catálogo de productos">
      {query ? (
        <ProductSearch key={query} query={query} scope={switcher ? "all" : brand} />
      ) : (
        <>
          {loading && (
            <div className="shop-load-status" role="status">
              Preparando tus productos…
            </div>
          )}
          {error && (
            <div className="shop-notice" role="alert">
              <p>{error}</p>
              <button className="brand-button small" onClick={() => setRetry((n) => n + 1)}>
                Volver a intentar
              </button>
              <SiteLink href="/contacto/">Consultar con Seritene</SiteLink>
            </div>
          )}
          {!loading && !error && !items.length && (
            <div className="shop-notice">
              <h3>No hay modelos en esta selección.</h3>
              <p>Prueba otra categoría o consulta la referencia con nosotros.</p>
              <a href={href(0)}>Ver todos</a>
            </div>
          )}
          <div className="shop-grid">
            {group === "merchandising" && !categoryId && page === 0 && !loading && <MedalCard />}
            {loading
              ? [1, 2, 3].map((n) => <CardPlaceholder key={n} />)
              : items.map((item) => <ShopCard key={item.key} item={item} brand={brand} />)}
          </div>
          {totalModels > PER_PAGE && (
            <nav className="shop-pagination" aria-label="Paginación">
              {page > 0 ? (
                <a href={href(page - 1)} rel="prev">
                  Anterior
                </a>
              ) : (
                <span aria-disabled="true">Anterior</span>
              )}
              <span>
                Página {page + 1} de {pages} · {PER_PAGE} por página
              </span>
              {(page + 1) * PER_PAGE < totalModels ? (
                <a href={href(page + 1)} rel="next">
                  Siguiente
                </a>
              ) : (
                <span aria-disabled="true">Siguiente</span>
              )}
            </nav>
          )}
        </>
      )}
      <p className="shop-fineprint">
        Precios sin impuestos, transporte ni diseño gráfico. El marcaje se añade en la ficha. Disponibilidad y presupuesto
        sujetos a confirmación.
      </p>
    </section>
  );
}
