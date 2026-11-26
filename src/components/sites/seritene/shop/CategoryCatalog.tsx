"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Popover } from "@base-ui/react/popover";
import { ChevronDown, MessageCircle, SlidersHorizontal, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { BASE_PATH, contact } from "../content";
import { SiteLink } from "../SiteLink";
import {
  activeCount,
  EMPTY_STATE,
  facetCounts,
  filterItems,
  PAGE_SIZE,
  parseState,
  prepareItems,
  sortItems,
  SORT_LABELS,
  stateToSearch,
  type FacetDef,
  type FacetId,
  type FilterState,
  type ListingData,
  type ListingFacets,
  type SortId,
} from "./catalogFilters";
import { ProductSearch } from "./ProductSearch";
import { MedalCard, ShopCard, cardImagePriority } from "./ShopCard";
import type { CardData, CardItem, ShopGroup } from "./types";

type Props = {
  group: ShopGroup;
  /** Hay categoría (false en /ropa/ y /merchandising/). */
  isCategory: boolean;
  /** Primeros productos en el orden de producción: se pintan en el HTML estático (SEO, sin JavaScript). */
  initialItems: CardItem[];
  facets: ListingFacets;
};

type Prepared = ReturnType<typeof prepareItems>[number];

const fmt = new Intl.NumberFormat("es-ES");
const productsLabel = (n: number) => `${fmt.format(n)} ${n === 1 ? "producto" : "productos"}`;

/** Lee los parámetros con useSearchParams (dentro de Suspense para no sacar la rejilla del HTML estático). */
function UrlParams({ onChange }: { onChange: (search: string) => void }) {
  const search = useSearchParams().toString();
  useEffect(() => onChange(search), [search, onChange]);
  return null;
}

const dataCache = new Map<string, Promise<ListingData>>();
function loadListing(listing: string) {
  let promise = dataCache.get(listing);
  if (!promise) {
    promise = fetch(`${BASE_PATH}/catalogo-datos/${listing}.json`).then((res) => {
      if (!res.ok) throw new Error("No hemos podido cargar los filtros.");
      return res.json() as Promise<ListingData>;
    });
    promise.catch(() => dataCache.delete(listing));
    dataCache.set(listing, promise);
  }
  return promise;
}

/**
 * Listado de categoría con filtros, orden y «Ver más». El HTML estático lleva los primeros productos en
 * el orden de producción; al hidratar se descargan los datos del listado (/catalogo-datos/…json) y se
 * aplican los filtros de la URL (?marca=roly&color=negro&orden=precio-asc&pagina=2).
 */
export function CategoryCatalog({ group, isCategory, initialItems, facets: listing }: Props) {
  const brand = group === "ropa" ? "roly" : "stamina";
  const { facets, sorts, total } = listing;
  const [search, setSearch] = useState<string | null>(null);
  const [data, setData] = useState<Prepared[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [retry, setRetry] = useState(0);
  const [wantData, setWantData] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  /** En la hoja móvil, el primer cambio crea una entrada del historial y los siguientes la sustituyen. */
  const sheetPushed = useRef(false);
  /** Estado recién elegido, mientras la URL nueva llega a useSearchParams (las casillas no parpadean). */
  const [optimistic, setOptimistic] = useState<FilterState | null>(null);
  const onUrl = useCallback((value: string) => {
    setSearch(value);
    setOptimistic(null);
  }, []);

  const hydrated = search !== null;
  const params = useMemo(() => new URLSearchParams(search ?? ""), [search]);
  const query = (params.get("q") ?? "").slice(0, 100).trim();
  const urlState: FilterState = useMemo(
    () => (hydrated ? parseState(params, facets, sorts) : EMPTY_STATE),
    [hydrated, params, facets, sorts],
  );
  const state = optimistic ?? urlState;
  const filtersOn = activeCount(state) > 0;
  const isDefault = !filtersOn && state.sort === "recomendados";
  const needsData = hydrated && (!isDefault || state.pages * PAGE_SIZE > initialItems.length || wantData);

  // Descarga de los datos del listado: enseguida si la URL trae filtros; si no, cuando el navegador
  // esté libre (para tener recuentos al abrir un filtro sin retrasar la carga de la página).
  useEffect(() => {
    if (!hydrated || data) return;
    if (needsData) {
      let cancelled = false;
      loadListing(listing.listing)
        .then((d) => {
          if (!cancelled) setData(prepareItems(d.items));
        })
        .catch((e: unknown) => {
          if (!cancelled) setLoadError(e instanceof Error ? e.message : "No hemos podido cargar los filtros.");
        });
      return () => {
        cancelled = true;
      };
    }
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(() => setWantData(true), { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(() => setWantData(true), 1500);
    return () => clearTimeout(id);
  }, [hydrated, data, needsData, listing.listing, retry]);

  const commit = useCallback(
    (next: FilterState, mode: "push" | "replace" = "push") => {
      const url = `${window.location.pathname}${stateToSearch(next, facets, window.location.search)}${window.location.hash}`;
      let how = mode;
      if (sheetOpen && mode === "push") {
        how = sheetPushed.current ? "replace" : "push";
        sheetPushed.current = true;
      }
      setOptimistic(next);
      if (how === "push") window.history.pushState(null, "", url);
      else window.history.replaceState(null, "", url);
    },
    [facets, sheetOpen],
  );

  const toggle = (facet: FacetId, option: string) => {
    const current = state.selected[facet] ?? [];
    const values = current.includes(option) ? current.filter((v) => v !== option) : [...current, option];
    commit({ ...state, selected: { ...state.selected, [facet]: values }, pages: 1 });
  };
  const remove = (facet: FacetId, option: string) => {
    const values = (state.selected[facet] ?? []).filter((v) => v !== option);
    commit({ ...state, selected: { ...state.selected, [facet]: values }, pages: 1 });
  };
  const clearAll = () => commit({ ...state, selected: {}, pages: 1 });
  const setSort = (sort: SortId) => commit({ ...state, sort, pages: 1 });

  // Resultados.
  const filtered = useMemo(() => (data ? filterItems(data, facets, state) : null), [data, facets, state]);
  const sorted = useMemo(() => (filtered ? sortItems(filtered, state.sort) : null), [filtered, state.sort]);
  const counts = useMemo(() => (data ? facetCounts(data, facets, state) : null), [data, facets, state]);
  const initialPrepared = useMemo(() => initialItems.map((item, index) => ({ item, index })), [initialItems]);
  const pending = hydrated && !isDefault && !sorted && !loadError;
  const list: { item: CardData; index: number }[] = sorted ?? initialPrepared;
  const resultTotal = sorted ? sorted.length : total;
  const limit = hydrated ? state.pages * PAGE_SIZE : initialItems.length;
  const visible = list.slice(0, limit);
  const remaining = resultTotal - Math.min(limit, resultTotal);

  const optionCount = (facet: FacetDef, option: string) =>
    counts?.[facet.id]?.[option] ?? (filtersOn ? null : (facet.options.find((o) => o.id === option)?.count ?? 0));

  const chips = facets.flatMap((facet) =>
    (state.selected[facet.id] ?? []).map((value) => ({
      facet,
      value,
      label: facet.options.find((o) => o.id === value)?.label ?? value,
    })),
  );

  // Sugerencias del estado vacío: qué filtro quitar para volver a ver productos.
  const suggestions = useMemo(() => {
    if (!data || !sorted || sorted.length) return [];
    return chips
      .map((chip) => {
        const without = {
          ...state,
          selected: { ...state.selected, [chip.facet.id]: (state.selected[chip.facet.id] ?? []).filter((v) => v !== chip.value) },
        };
        return { chip, count: filterItems(data, facets, without).length };
      })
      .filter((s) => s.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [data, sorted, chips, state, facets]);

  const showMore = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    commit({ ...state, pages: state.pages + 1 }, "replace");
  };

  const showMedal = group === "merchandising" && !isCategory && isDefault;
  const statusText = pending ? "Aplicando filtros…" : productsLabel(resultTotal);

  if (query.length >= 2) {
    return (
      <section className="shop-browser" aria-label="Catálogo de productos">
        <ProductSearch key={query} query={query} scope={brand} />
        <Fineprint />
        <Suspense fallback={null}>
          <UrlParams onChange={onUrl} />
        </Suspense>
      </section>
    );
  }

  const sortSelect = (
    <label className="cf-sort">
      <span>Ordenar por</span>
      <select value={state.sort} onChange={(e) => setSort(e.target.value as SortId)}>
        {sorts.map((s) => (
          <option key={s} value={s}>
            {SORT_LABELS[s]}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <section className="shop-browser" aria-label="Catálogo de productos">
      <Suspense fallback={null}>
        <UrlParams onChange={onUrl} />
      </Suspense>

      <div className="cf-toolbar">
        <div className="cf-bar" role="group" aria-label="Filtros">
          {facets.map((facet) => {
            const selected = state.selected[facet.id] ?? [];
            return (
              <Popover.Root key={facet.id} onOpenChange={(open) => open && setWantData(true)}>
                <Popover.Trigger className={`cf-trigger${selected.length ? " is-active" : ""}`}>
                  {facet.label}
                  {selected.length > 0 && (
                    <span className="cf-badge" aria-label={`${selected.length} seleccionados`}>
                      {selected.length}
                    </span>
                  )}
                  <ChevronDown size={16} aria-hidden="true" />
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Positioner sideOffset={8} align="start" collisionPadding={16} className="cf-positioner">
                    <Popover.Popup className="cf-popup">
                      <Popover.Title className="cf-popup-title">{facet.label}</Popover.Title>
                      <FacetOptions
                        facet={facet}
                        selected={selected}
                        count={(o) => optionCount(facet, o)}
                        onToggle={(o) => toggle(facet.id, o)}
                      />
                      {selected.length > 0 && (
                        <button
                          type="button"
                          className="cf-link"
                          onClick={() => commit({ ...state, selected: { ...state.selected, [facet.id]: [] }, pages: 1 })}
                        >
                          Quitar {facet.label.toLowerCase()}
                        </button>
                      )}
                    </Popover.Popup>
                  </Popover.Positioner>
                </Popover.Portal>
              </Popover.Root>
            );
          })}
        </div>

        <Dialog.Root
          open={sheetOpen}
          onOpenChange={(open) => {
            setSheetOpen(open);
            sheetPushed.current = false;
            if (open) setWantData(true);
          }}
        >
          <Dialog.Trigger className="cf-mobile-trigger">
            <SlidersHorizontal size={18} aria-hidden="true" />
            Filtrar y ordenar
            {activeCount(state) > 0 && <span className="cf-badge">{activeCount(state)}</span>}
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Backdrop className="cf-backdrop" />
            <Dialog.Popup className="cf-sheet">
              <div className="cf-sheet-head">
                <Dialog.Title className="cf-sheet-title">Filtrar y ordenar</Dialog.Title>
                <Dialog.Close className="cf-close" aria-label="Cerrar filtros">
                  <X size={22} aria-hidden="true" />
                </Dialog.Close>
              </div>
              <div className="cf-sheet-body">
                <fieldset className="cf-group">
                  <legend>Ordenar por</legend>
                  {sorts.map((s) => (
                    <label key={s} className="cf-option">
                      <input type="radio" name="cf-orden" checked={state.sort === s} onChange={() => setSort(s)} />
                      <span className="cf-option-label">{SORT_LABELS[s]}</span>
                    </label>
                  ))}
                </fieldset>
                {facets.map((facet) => (
                  <fieldset key={facet.id} className="cf-group">
                    <legend>{facet.label}</legend>
                    <FacetOptions
                      facet={facet}
                      selected={state.selected[facet.id] ?? []}
                      count={(o) => optionCount(facet, o)}
                      onToggle={(o) => toggle(facet.id, o)}
                    />
                  </fieldset>
                ))}
              </div>
              <div className="cf-sheet-foot">
                <button type="button" className="cf-clear" onClick={clearAll} disabled={!filtersOn}>
                  Borrar todo
                </button>
                <Dialog.Close className="brand-button cf-apply">
                  {pending ? "Aplicando filtros…" : `Ver ${productsLabel(resultTotal)}`}
                </Dialog.Close>
              </div>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>

        <p className="cf-count" aria-live="polite" aria-atomic="true">
          {statusText}
        </p>
        {sortSelect}
      </div>

      {chips.length > 0 && (
        <div className="cf-chips" aria-label="Filtros activos">
          {chips.map(({ facet, value, label }) => (
            <button
              type="button"
              key={`${facet.id}=${value}`}
              className="cf-chip"
              onClick={() => remove(facet.id, value)}
              aria-label={`Quitar filtro ${facet.label}: ${label}`}
            >
              <span>
                {facet.label}: {label}
              </span>
              <X size={14} aria-hidden="true" />
            </button>
          ))}
          <button type="button" className="cf-link" onClick={clearAll}>
            Borrar todo
          </button>
        </div>
      )}

      {loadError && (
        <div className="shop-notice" role="alert">
          <p>{loadError} Se muestran los productos sin filtrar.</p>
          <button
            className="brand-button small"
            onClick={() => {
              setLoadError("");
              setRetry((n) => n + 1);
            }}
          >
            Volver a intentar
          </button>
        </div>
      )}

      {sorted && !sorted.length ? (
        <div className="shop-notice cf-empty">
          <h3>Ningún producto cumple todos estos filtros.</h3>
          {suggestions.length > 0 ? (
            <>
              <p>Prueba a quitar uno:</p>
              <div className="cf-suggestions">
                {suggestions.map(({ chip, count }) => (
                  <button
                    type="button"
                    key={`${chip.facet.id}=${chip.value}`}
                    className="cf-chip"
                    onClick={() => remove(chip.facet.id, chip.value)}
                  >
                    Quitar {chip.facet.label.toLowerCase()}: {chip.label} ({productsLabel(count)})
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p>Prueba con menos filtros.</p>
          )}
          <p>
            <button type="button" className="cf-link" onClick={clearAll}>
              Borrar todos los filtros
            </button>
          </p>
          <p>¿Buscas algo concreto? Te ayudamos a encontrar la referencia, el color o la talla que necesitas.</p>
          <div className="cf-empty-actions">
            <a
              className="brand-button small"
              href={`${contact.whatsapp}?text=${encodeURIComponent("Hola Seritene, estoy buscando un producto que no encuentro en la web:")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle size={16} aria-hidden="true" /> Preguntar por WhatsApp
            </a>
            <SiteLink href="/contacto/">Escribirnos</SiteLink>
          </div>
        </div>
      ) : (
        <div className={`shop-grid${pending ? " cf-pending" : ""}`} aria-busy={pending || undefined}>
          {showMedal && <MedalCard />}
          {visible.map(({ item }, i) => (
            <ShopCard key={item.key} item={item} brand={brand} priority={cardImagePriority(i + (showMedal ? 1 : 0))} />
          ))}
        </div>
      )}

      {remaining > 0 && !pending && (
        <div className="cf-more">
          <p>
            Viendo {fmt.format(visible.length)} de {productsLabel(resultTotal)}
          </p>
          <a
            className="brand-button cf-more-button"
            href={stateToSearch({ ...state, pages: state.pages + 1 }, facets, search ?? "") || "?pagina=2"}
            onClick={showMore}
          >
            Ver {Math.min(PAGE_SIZE, remaining)} más
          </a>
        </div>
      )}

      <Fineprint />
    </section>
  );
}

function FacetOptions({
  facet,
  selected,
  count,
  onToggle,
}: {
  facet: FacetDef;
  selected: string[];
  count: (option: string) => number | null;
  onToggle: (option: string) => void;
}) {
  return (
    <ul className={`cf-options${facet.id === "color" ? " is-colors" : ""}`}>
      {facet.options.map((option) => {
        const n = count(option.id);
        const checked = selected.includes(option.id);
        const disabled = !checked && n === 0;
        return (
          <li key={option.id}>
            <label className={`cf-option${disabled ? " is-disabled" : ""}`}>
              <input type="checkbox" checked={checked} disabled={disabled} onChange={() => onToggle(option.id)} />
              {option.swatch && <span className="cf-swatch" style={{ background: option.swatch }} aria-hidden="true" />}
              <span className="cf-option-label">{option.label}</span>
              {n !== null && <span className="cf-option-count">{fmt.format(n)}</span>}
            </label>
          </li>
        );
      })}
    </ul>
  );
}

function Fineprint() {
  return (
    <p className="shop-fineprint">
      Precios sin IGIC, transporte ni diseño gráfico. El marcaje se añade en la ficha. Disponibilidad y presupuesto
      sujetos a confirmación.
    </p>
  );
}
