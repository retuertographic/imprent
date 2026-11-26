/**
 * Filtros y orden de los listados de categoría (/ropa/…, /merchandising/…). Lógica pura, compartida
 * por el servidor (que prepara las facetas al generar el sitio, ver catalogFacets.ts) y el navegador
 * (que filtra, cuenta y ordena). El estado vive en la URL: ?marca=roly&color=negro,azul&orden=precio-asc.
 */
import type { CardData } from "./types";

export type FacetId = "categoria" | "tipo" | "publico" | "marca" | "color" | "precio" | "disponibilidad" | "marcaje";

export type FacetOption = {
  id: string;
  label: string;
  /** Muestra de color (CSS) para las familias de color. */
  swatch?: string;
  /** Productos del listado completo con esta opción (sin filtros). */
  count: number;
};

export type FacetDef = {
  id: FacetId;
  label: string;
  /** "or": basta con una de las opciones marcadas; "and": tiene que cumplir todas (casillas sueltas). */
  mode: "or" | "and";
  options: FacetOption[];
};

export type SortId = "recomendados" | "precio-asc" | "precio-desc" | "novedades" | "nombre";

export const SORT_LABELS: Record<SortId, string> = {
  recomendados: "Recomendados",
  "precio-asc": "Precio: de menor a mayor",
  "precio-desc": "Precio: de mayor a menor",
  novedades: "Novedades primero",
  nombre: "Nombre (A-Z)",
};

/** Producto del listado con sus facetas («marca=roly», «color=negro»…) y si es novedad del proveedor. */
export type ListingItem = CardData & { f: string[]; n?: 1 };

/** Datos de un listado que descarga el navegador: /catalogo-datos/<listado>.json. */
export type ListingData = { version: 1; items: ListingItem[] };

/** Facetas y órdenes de un listado, calculados al generar el sitio y pasados al componente. */
export type ListingFacets = { listing: string; total: number; facets: FacetDef[]; sorts: SortId[] };

/** Nombre del archivo de datos de un listado: "ropa", "ropa-camisetas", "merchandising-tazas"… */
export const listingName = (group: string, slug?: string) => (slug ? `${group}-${slug}` : group);

export const token = (facet: FacetId, option: string) => `${facet}=${option}`;

/* ------------------------------------------------------------------------------------------------
 * Estado (URL)
 * ---------------------------------------------------------------------------------------------- */

export type FilterState = {
  selected: Partial<Record<FacetId, string[]>>;
  sort: SortId;
  /** Bloques de PAGE_SIZE visibles (?pagina=N). */
  pages: number;
};

export const PAGE_SIZE = 24;
export const EMPTY_STATE: FilterState = { selected: {}, sort: "recomendados", pages: 1 };

/** Lee el estado de la URL, descartando opciones o órdenes que no existen en el listado. */
export function parseState(params: URLSearchParams, facets: FacetDef[], sorts: SortId[]): FilterState {
  const selected: FilterState["selected"] = {};
  for (const facet of facets) {
    const raw = params.get(facet.id);
    if (!raw) continue;
    const valid = new Set(facet.options.map((o) => o.id));
    const values = [...new Set(raw.split(",").map((v) => v.trim().toLowerCase()))].filter((v) => valid.has(v));
    if (values.length) selected[facet.id] = values;
  }
  const sortParam = params.get("orden") as SortId | null;
  const sort = sortParam && sorts.includes(sortParam) ? sortParam : "recomendados";
  const requested = Number(params.get("pagina"));
  const pages = Number.isSafeInteger(requested) && requested > 1 ? Math.min(requested, 200) : 1;
  return { selected, sort, pages };
}

/** Parámetros de la URL para un estado (conserva los parámetros ajenos a los filtros). */
export function stateToSearch(state: FilterState, facets: FacetDef[], current = ""): string {
  const params = new URLSearchParams(current);
  for (const facet of facets) params.delete(facet.id);
  params.delete("orden");
  params.delete("pagina");
  for (const facet of facets) {
    const values = state.selected[facet.id];
    if (values?.length) params.set(facet.id, values.join(","));
  }
  if (state.sort !== "recomendados") params.set("orden", state.sort);
  if (state.pages > 1) params.set("pagina", String(state.pages));
  // URLSearchParams codifica las comas: se dejan legibles (?color=negro,azul).
  const search = params.toString().replace(/%2C/gi, ",");
  return search ? `?${search}` : "";
}

export const activeCount = (state: FilterState) =>
  Object.values(state.selected).reduce((n, values) => n + (values?.length ?? 0), 0);

/* ------------------------------------------------------------------------------------------------
 * Filtrado, recuento y orden
 * ---------------------------------------------------------------------------------------------- */

type Prepared = { item: ListingItem; tokens: Set<string>; index: number };

export const prepareItems = (items: ListingItem[]): Prepared[] =>
  items.map((item, index) => ({ item, tokens: new Set(item.f), index }));

function matchesFacet(p: Prepared, facet: FacetDef, values: string[] | undefined) {
  if (!values?.length) return true;
  return facet.mode === "and"
    ? values.every((v) => p.tokens.has(token(facet.id, v)))
    : values.some((v) => p.tokens.has(token(facet.id, v)));
}

function matchesAll(p: Prepared, facets: FacetDef[], state: FilterState, except?: FacetId) {
  return facets.every((facet) => facet.id === except || matchesFacet(p, facet, state.selected[facet.id]));
}

export const filterItems = (items: Prepared[], facets: FacetDef[], state: FilterState) =>
  items.filter((p) => matchesAll(p, facets, state));

/**
 * Recuento de cada opción con el resto de filtros aplicados (en las facetas «o», sin la propia faceta,
 * para que se vea cuántos productos se añadirían al marcarla).
 */
export function facetCounts(items: Prepared[], facets: FacetDef[], state: FilterState) {
  const counts: Partial<Record<FacetId, Record<string, number>>> = {};
  for (const facet of facets) {
    const pool = items.filter((p) => matchesAll(p, facets, state, facet.mode === "or" ? facet.id : undefined));
    const byOption: Record<string, number> = {};
    for (const option of facet.options) {
      const t = token(facet.id, option.id);
      let n = 0;
      for (const p of pool) if (p.tokens.has(t)) n++;
      byOption[option.id] = n;
    }
    counts[facet.id] = byOption;
  }
  return counts;
}

const collator = new Intl.Collator("es", { sensitivity: "base", numeric: true });

export function sortItems(items: Prepared[], sort: SortId): Prepared[] {
  const out = [...items];
  const price = (p: Prepared) => p.item.fromPrice;
  switch (sort) {
    case "precio-asc":
    case "precio-desc": {
      const dir = sort === "precio-asc" ? 1 : -1;
      // Los «a presupuestar» (sin precio) siempre al final.
      return out.sort((a, b) => {
        const pa = price(a);
        const pb = price(b);
        if (pa === null || pb === null) return pa === pb ? a.index - b.index : pa === null ? 1 : -1;
        return (pa - pb) * dir || a.index - b.index;
      });
    }
    case "novedades":
      return out.sort((a, b) => (b.item.n ?? 0) - (a.item.n ?? 0) || a.index - b.index);
    case "nombre":
      return out.sort((a, b) => collator.compare(a.item.name, b.item.name) || a.index - b.index);
    default:
      return out;
  }
}

/* ------------------------------------------------------------------------------------------------
 * Familias de color
 * ---------------------------------------------------------------------------------------------- */

export const COLOR_FAMILIES: { id: string; label: string; swatch: string }[] = [
  { id: "blanco", label: "Blanco", swatch: "#ffffff" },
  { id: "negro", label: "Negro", swatch: "#151515" },
  { id: "gris", label: "Gris", swatch: "#9a9c9e" },
  { id: "azul", label: "Azul", swatch: "#2457c5" },
  { id: "rojo", label: "Rojo", swatch: "#d22a2a" },
  { id: "verde", label: "Verde", swatch: "#2f9a3a" },
  { id: "amarillo", label: "Amarillo", swatch: "#f5d000" },
  { id: "naranja", label: "Naranja", swatch: "#f07c12" },
  { id: "rosa", label: "Rosa", swatch: "#ef7fb2" },
  { id: "morado", label: "Morado", swatch: "#7b3fa8" },
  { id: "marron", label: "Marrón y beige", swatch: "#b08a5e" },
  { id: "metalizado", label: "Plata y oro", swatch: "linear-gradient(135deg,#f4f4f4 0%,#a9a9a9 45%,#e0c46c 55%,#b8902d 100%)" },
  { id: "transparente", label: "Transparente", swatch: "repeating-conic-gradient(#e6e6e6 0 25%,#fff 0 50%) 0 0/8px 8px" },
  { id: "multicolor", label: "Multicolor", swatch: "conic-gradient(#d22a2a,#f5d000,#2f9a3a,#2457c5,#7b3fa8,#d22a2a)" },
];

/** Palabra del nombre del color (sin tildes, en mayúsculas) → familia. */
const COLOR_WORDS: Record<string, string> = {};
const addWords = (family: string, words: string) => {
  for (const w of words.split(" ")) COLOR_WORDS[w] = family;
};
addWords("blanco", "BLANCO BLANCA WHITE");
addWords("negro", "NEGRO NEGRA BLACK");
addWords("gris", "GRIS GREY GRAY PLOMO MELANGE GRAPHITE GRAFITO CHARCOAL ZINC ASH ANTRACITA EBANO SILVER HEATHER");
addWords(
  "azul",
  "AZUL ROYAL MARINO CELESTE TURQUESA DENIM VAQUERO NAVY BLUE TEAL AQUA AZZURE PETROL INDIGO AGUAMARINA AQUAMARINE KLEIN TURQUOISE AZULINA",
);
addWords("rojo", "ROJO RED GRANATE BURGUNDY CARDINAL BURDEOS BORGONA CEREZA");
addWords(
  "verde",
  "VERDE GREEN LIMA LIME PISTACHO KAKI KHAKI ARMY MOSS MINT MENTA OLIVA OLIVE ALOE APPLE KIWI CAQUI JADE PISTACHIO",
);
addWords("amarillo", "AMARILLO YELLOW MOSTAZA MUSTARD OCHER OCRE GOLD LEMON LIMON");
addWords("naranja", "NARANJA ORANGE CORAL APRICOT TEJA CALABAZA BRICK PAPAYA PEACH TANGERINE");
addWords("rosa", "ROSA PINK FUCSIA FUCHSIA ROSETON AZALEA MAUVE MALVA RASPBERRY FRAMBUESA");
addWords("morado", "MORADO PURPURA PURPLE LILA LAVANDA LAVENDER VIOLETA VIOLET BERENJENA UVA IRIS ORCHID ORQUIDEA");
addWords(
  "marron",
  "MARRON BROWN CHOCOLATE MOCHA CAMEL BEIGE ARENA SAND CRUDO NATURAL KRAFT BAMBU MADERA CORCHO NUDE IVORY CREAM ANGORA CAFE TOSTADO CARAMELO CUERO WOOD MOCA NOGAL ALMENDRA",
);
addWords("metalizado", "PLATA ORO DORADO COBRE BRONCE CROMADO PLATEADO");
addWords("transparente", "TRANSPARENTE TRANSPARENT");
addWords("multicolor", "MULTICOLOR MULTI");

const plain = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase();

/**
 * Familias de un color del proveedor. En los nombres en español la palabra principal va delante
 * («ROJO CIRUELA», «ROSA DORADO»); en los de JHK, en inglés, detrás («Canary Red», «Petrol Blue»).
 * Los bicolores («MARINO/AMARILLO FLUOR») cuentan en las dos familias. Devuelve [] si el nombre no es
 * un color (formas o motivos como «REDONDO» o «ESTRELLA»).
 */
export function colorFamilies(name: string, english = false): string[] {
  const out = new Set<string>();
  for (const part of plain(name).split(/[/+]| Y /)) {
    const words = part.split(/[^A-Z]+/).filter(Boolean);
    const families = words.map((w) => COLOR_WORDS[w]).filter((f): f is string => Boolean(f));
    const family = english ? families.at(-1) : families[0];
    if (family) out.add(family);
  }
  return [...out];
}

/* ------------------------------------------------------------------------------------------------
 * Precio
 * ---------------------------------------------------------------------------------------------- */

const PRICE_BOUNDS = [1, 2, 5, 10, 20, 50];
const euro = (n: number) => `${n} €`;

/** Tramo de precio «desde»: "menos-2", "2-5", "mas-50"… o "presupuesto". */
export function priceBucket(price: number | null, bounds = PRICE_BOUNDS): string {
  if (price === null) return "presupuesto";
  if (price < bounds[0]) return `menos-${bounds[0]}`;
  for (let i = 1; i < bounds.length; i++) if (price < bounds[i]) return `${bounds[i - 1]}-${bounds[i]}`;
  return `mas-${bounds.at(-1)}`;
}

/** Tramos en orden, con su texto. */
export function priceBuckets(bounds = PRICE_BOUNDS): { id: string; label: string }[] {
  return [
    { id: `menos-${bounds[0]}`, label: `Menos de ${euro(bounds[0])}` },
    ...bounds.slice(1).map((b, i) => ({ id: `${bounds[i]}-${b}`, label: `De ${bounds[i]} a ${euro(b)}` })),
    { id: `mas-${bounds.at(-1)}`, label: `${euro(bounds.at(-1) ?? 0)} o más` },
    { id: "presupuesto", label: "A presupuestar" },
  ];
}

/* ------------------------------------------------------------------------------------------------
 * Texto (público y tipo de producto)
 * ---------------------------------------------------------------------------------------------- */

/** Minúsculas sin tildes, para buscar palabras en nombres y descripciones. */
export const normalizeText = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** ¿Es una talla infantil? (3/4, 5/6, 12-14, 4, 8, 16, «6 meses», «2 años», «talla única infantil», kids). */
export function isKidsSize(size: string): boolean {
  const s = normalizeText(size).trim();
  if (/^\d{1,2}\s*\/\s*\d{1,2}$/.test(s)) return true;
  const range = s.match(/^(\d{1,2})\s*-\s*(\d{1,2})$/);
  if (range) return Number(range[2]) <= 16;
  if (/^\d{1,2}$/.test(s)) return Number(s) <= 16;
  return /mes(es)?\b|\banos?\b|infantil|kids?\b|nino/.test(s);
}

/** ¿Es una talla de adulto? (letras S…5XL, numeración de adulto o talla única de adulto). */
export function isAdultSize(size: string): boolean {
  const s = normalizeText(size).trim();
  if (/^((\d?x{0,4}[sml]|\d?xl)(-|$))+$/.test(s)) return true;
  if (/^\d{2}$/.test(s)) return Number(s) >= 30;
  return /adulto/.test(s);
}
