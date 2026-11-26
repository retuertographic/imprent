"use client";
/* eslint-disable @next/next/no-img-element */

import { useDeferredValue, useState, type RefObject } from "react";
import { ArrowUpRight, MessageCircle, Search } from "lucide-react";
import { BASE_PATH, searchHelp } from "./content";
import { SiteLink } from "./SiteLink";
import { loadSearchIndex, productImage } from "./shop/catalog";
import { cardImageProps } from "./shop/imageSizes";
import { pageLabel, searchCatalog, type SearchIndex, type SearchRecord } from "./shop/searchIndex";

const LIST_ID = "ch-search-list";
const MAX_PRODUCTS = 5;
const MAX_SHORTCUTS = 2;
const MAX_GUIDES = 2;

type Option = { key: string; href: string; record?: SearchRecord; label?: string; group: "shortcut" | "product" | "guide" | "all" };

const optionId = (i: number) => `${LIST_ID}-${i}`;
/** Qué es el producto (primera frase de la descripción, corta). */
const blurb = (r: SearchRecord) => (r.description || r.detail).split(/[.\n]/)[0].slice(0, 70);

/**
 * Buscador de la cabecera con sugerencias mientras se escribe: categorías o servicios que
 * responden a la búsqueda, los primeros productos y, aparte, alguna guía. Enter sin elegir
 * opción abre /productos/?q= con todos los resultados. Navegable con flechas, Enter y Escape
 * (combobox ARIA con aria-activedescendant: el foco no sale del campo).
 */
export function HeaderSearch({ open, inputRef }: { open: boolean; inputRef: RefObject<HTMLInputElement | null> }) {
  const [value, setValue] = useState("");
  const [index, setIndex] = useState<SearchIndex | null>(null);
  const [failed, setFailed] = useState(false);
  const [listOpen, setListOpen] = useState(true);
  const [active, setActive] = useState(-1);
  const deferred = useDeferredValue(value);

  /** El índice se descarga la primera vez que el campo recibe el foco (no al cargar la página). */
  const prepare = () => {
    if (index) return;
    setFailed(false);
    loadSearchIndex().then(setIndex, () => setFailed(true));
  };

  const query = deferred.trim();
  const results = index && query.length >= 2 ? searchCatalog(index, query) : null;
  const options: Option[] = [];
  if (results) {
    for (const r of results.shortcuts.slice(0, MAX_SHORTCUTS)) options.push({ key: r.id, href: r.path, record: r, group: "shortcut" });
    for (const r of results.products.slice(0, MAX_PRODUCTS)) options.push({ key: r.id, href: r.path, record: r, group: "product" });
    if (results.products.length) {
      const q = results.corrected ? results.query : query;
      options.push({
        key: "all",
        href: `/productos/?q=${encodeURIComponent(q)}`,
        label: `Ver los ${results.products.length} productos para «${q}»`,
        group: "all",
      });
    }
    for (const r of results.guides.slice(0, MAX_GUIDES)) options.push({ key: r.id, href: r.path, record: r, group: "guide" });
  }
  const showList = open && listOpen && query.length >= 2;
  const activeIndex = active < options.length ? active : -1;

  const choose = (i: number) => document.getElementById(optionId(i))?.click();

  const renderOption = (o: Option) => {
    const i = options.indexOf(o);
    const common = {
      id: optionId(i),
      role: "option",
      "aria-selected": i === activeIndex,
      tabIndex: -1,
      className: `ch-sugg ch-sugg-${o.group}${i === activeIndex ? " ch-sugg-active" : ""}`,
      onMouseEnter: () => setActive(i),
    };
    const r = o.record;
    if (o.group === "all") {
      return (
        <a key={o.key} {...common} href={`${BASE_PATH}${o.href}`}>
          <span>{o.label}</span>
          <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      );
    }
    return (
      <SiteLink key={o.key} {...common} href={o.href}>
        {o.group === "product" && (
          <span className="ch-sugg-thumb" aria-hidden="true">
            {r?.image ? <img {...cardImageProps(r.image, productImage)} sizes="48px" alt="" width={48} height={48} loading="lazy" referrerPolicy="no-referrer" /> : null}
          </span>
        )}
        <span className="ch-sugg-text">
          <strong>{r?.name}</strong>
          <small>{o.group === "product" ? blurb(r!) : pageLabel(r!.brand)}</small>
        </span>
      </SiteLink>
    );
  };

  // Mismo orden que `options` (el de las flechas): accesos, productos, «ver todos», guías.
  const groups: [Option["group"], string][] = [
    ["shortcut", "Categorías y servicios"],
    ["product", "Productos"],
    ["all", ""],
    ["guide", "Guías y artículos"],
  ];

  return (
    <form className={`ch-search${open ? " ch-search-open" : ""}`} action={`${BASE_PATH}/productos/`} role="search">
      <Search size={20} aria-hidden="true" />
      <input
        ref={inputRef}
        type="search"
        name="q"
        maxLength={100}
        placeholder="¿Qué quieres personalizar?"
        aria-label="Buscar productos"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={LIST_ID}
        aria-activedescendant={showList && activeIndex >= 0 ? optionId(activeIndex) : undefined}
        autoComplete="off"
        value={value}
        onFocus={prepare}
        onChange={(event) => {
          setValue(event.target.value);
          setActive(-1);
          setListOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            if (!options.length) return;
            event.preventDefault();
            setListOpen(true);
            // Recorre las opciones en bucle pasando por «ninguna» (-1, el texto escrito).
            const next = activeIndex + (event.key === "ArrowDown" ? 1 : -1);
            setActive(next >= options.length ? -1 : next < -1 ? options.length - 1 : next);
          } else if (event.key === "Enter" && showList && activeIndex >= 0) {
            event.preventDefault();
            choose(activeIndex);
          } else if (event.key === "Escape" && showList && value) {
            // Primer Escape: cierra las sugerencias; el segundo (sin sugerencias) cierra el buscador.
            event.preventDefault(); // sin esto, Chrome además borra el texto del campo de búsqueda
            event.stopPropagation();
            setListOpen(false);
            setActive(-1);
          }
        }}
      />
      <button type="submit" aria-label="Buscar productos">
        <ArrowUpRight size={20} />
      </button>
      <div className="ch-sugg-panel" hidden={!showList}>
        <div id={LIST_ID} role="listbox" aria-label="Sugerencias de búsqueda">
          {groups.map(([group, title]) => {
            const list = options.filter((o) => o.group === group);
            if (!list.length) return null;
            if (!title) return list.map(renderOption);
            return (
              <div key={group} role="group" aria-label={title} className="ch-sugg-group">
                <span className="ch-sugg-title" aria-hidden="true">
                  {title}
                </span>
                {list.map(renderOption)}
              </div>
            );
          })}
        </div>
        {showList && !index && !failed && (
          <p className="ch-sugg-note" role="status">
            Preparando el buscador…
          </p>
        )}
        {failed && <p className="ch-sugg-note">No se pudo cargar el buscador. Pulsa Enter para buscar.</p>}
        {results && results.corrected && results.suggestion && (
          <p className="ch-sugg-note">
            Sin resultados para «{query}». Mostramos «{results.suggestion}».
          </p>
        )}
        {results && !results.products.length && !results.shortcuts.length && (
          <div className="ch-sugg-empty">
            <p>
              No encontramos «{query}» en el catálogo.{" "}
              {results.suggestion && !results.corrected && (
                <button type="button" onClick={() => setValue(results.suggestion!)}>
                  ¿Quisiste decir «{results.suggestion}»?
                </button>
              )}
            </p>
            <a href={searchHelp.whatsapp + encodeURIComponent(query)} target="_blank" rel="noreferrer">
              <MessageCircle size={16} aria-hidden="true" /> Pídenoslo por WhatsApp
            </a>
          </div>
        )}
      </div>
    </form>
  );
}
