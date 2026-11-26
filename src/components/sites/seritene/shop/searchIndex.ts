/**
 * Buscador de productos y apartados (?q=) que se calcula en el navegador.
 *
 * El índice completo viaja con la web (public/sites/seritene/shop-data/search-index.json,
 * generado por scripts/extract-search-index.mjs a partir de los registros de producción) y se
 * descarga la primera vez que alguien busca. Ya no imita el orden de producción: puntúa por
 * relevancia propia y lo comprueba un test de calidad (scripts/check-search-quality.mjs).
 *
 * Cómo puntúa:
 * - Texto normalizado (minúsculas, sin tildes, «roll up» = rollup) y palabras reducidas a su
 *   raíz para que singular y plural coincidan (textMatch.ts).
 * - Cada palabra del registro lleva el peso del campo más importante donde aparece:
 *     nombre 10 · tipo de producto (primera palabra de la descripción en los modelos del
 *     proveedor: «Taza de cerámica…» → taza) 10 · palabras siguientes del tipo 8 · referencia 10 ·
 *     resto de la primera frase 4 · palabras clave propias (soportes, imprenta…) 5 ·
 *     palabras clave del proveedor (colores, composición) 2 · resto de la descripción 1.
 * - Cada palabra buscada vale peso × calidad: exacta 1 · sinónimo 0,9 · prefijo 0,6 ·
 *   dentro de otra palabra 0,3 (y por debajo de 0,5 no cuenta).
 * - «niño», «mujer», «hombre» piden un público: en Roly y JHK se usa lo que dicen sus tallas y
 *   su nombre (campo `audience`, ver scripts/lib/search-hints.mjs); en el resto, el texto.
 * - Con varias palabras, solo entran los registros que las tienen todas (las palabras de
 *   relleno como «personalizada» o «Tenerife» suman, pero no son obligatorias). Si así salen
 *   pocos productos, se añaden aparte los que tienen alguna («related»).
 * - Si no sale nada, se prueba una corrección cercana («camseta» → camiseta).
 * - Los productos van por un lado; las categorías y servicios cuyo nombre responde a la
 *   búsqueda, por otro (accesos directos); y las guías y páginas informativas, en un bloque
 *   secundario limitado.
 * - Ámbitos: /ropa/ busca solo Roly y JHK; /merchandising/, solo Stamina; /productos/, todo.
 */
import {
  audienceOfWord,
  audienceStems,
  editDistance,
  isKidsOnly,
  matchesAudience,
  PHRASES,
  stem,
  SYNONYMS,
  textWords,
  type Audience,
} from "./textMatch";

export type SearchScope = "all" | "roly" | "stamina";

export type SearchRecord = {
  id: string;
  /** "page" para apartados y guías; "product" para todo lo demás. */
  kind: "page" | "product";
  name: string;
  path: string;
  /** Ruta de seritene.com ("/catalogue/…") o URL absoluta. */
  image: string;
  description: string;
  /** Texto de reserva de la tarjeta cuando no hay descripción. */
  detail: string;
  /** Etiqueta de la tarjeta (marca o tipo de apartado). */
  brand: string;
  keywords: string;
  /** Referencia del proveedor (p. ej. SU1031), también buscable. */
  code: string;
  /** Público según tallas y nombre (solo Roly y JHK): k infantil y adulto · K solo infantil · w mujer. */
  audience: string;
};

/** Registro compacto del JSON: [id, nombre, descripción, palabras clave, imagen, extras?]. */
export type CompactRecord = [string, string, string, string, string, CompactExtra?];
/** Campos que no se pueden deducir del id: p ruta, b etiqueta, t detalle, c referencia, a público. */
export type CompactExtra = { p?: string; b?: string; t?: string; c?: string; a?: string };
export type CompactIndex = { version: number; records: CompactRecord[] };

const CATALOG_BRANDS = new Set(["roly", "stamina", "jhk"]);
const GORFACTORY = "https://static.gorfactory.es/images/models/";

/** Ruta y etiqueta por defecto según el id (las que el índice no guarda). */
function defaults(id: string) {
  const [prefix, rest] = [id.slice(0, id.indexOf(":")), id.slice(id.indexOf(":") + 1)];
  if (prefix === "page") return { kind: "page" as const, path: rest, brand: "" };
  if (CATALOG_BRANDS.has(prefix)) return { kind: "product" as const, path: `/producto/${prefix}/${rest}/`, brand: prefix.toUpperCase() };
  return { kind: "product" as const, path: "", brand: "" };
}

/** Convierte un registro del JSON en uno completo. */
export function expandRecord([id, name, description, keywords, image, extra = {}]: CompactRecord): SearchRecord {
  const d = defaults(id);
  return {
    id,
    kind: d.kind,
    name,
    path: extra.p ?? d.path,
    image: image.startsWith("@") ? GORFACTORY + image.slice(1) : image,
    description,
    detail: extra.t ?? "",
    brand: extra.b ?? d.brand,
    keywords,
    code: extra.c ?? "",
    audience: extra.a ?? "",
  };
}

/** Inverso de expandRecord (lo usa el script que genera el índice). */
export function compactRecord(r: SearchRecord): CompactRecord {
  const d = defaults(r.id);
  const extra: CompactExtra = {};
  if (r.path !== d.path) extra.p = r.path;
  if (r.brand !== d.brand) extra.b = r.brand;
  if (r.detail && !r.description) extra.t = r.detail;
  if (r.code) extra.c = r.code;
  if (r.audience) extra.a = r.audience;
  const image = r.image.startsWith(GORFACTORY) ? "@" + r.image.slice(GORFACTORY.length) : r.image;
  return Object.keys(extra).length ? [r.id, r.name, r.description, r.keywords, image, extra] : [r.id, r.name, r.description, r.keywords, image];
}

/* ---------------------------------------------------------------- índice */

const prefixOf = (id: string) => id.slice(0, id.indexOf(":"));
const isCatalog = (id: string) => CATALOG_BRANDS.has(prefixOf(id));
/** Modelos con tallas conocidas (su público sale de las tallas, no del texto). */
const isSized = (id: string) => prefixOf(id) === "roly" || prefixOf(id) === "jhk";
/** Registros de producto sin el pequeño empuje de los productos propios (proveedor, fullprint y copias de eventos). */
const NOT_BOOSTED = new Set([...CATALOG_BRANDS, "fullprint", "event"]);

/** Peso de cada campo (ver la cabecera). */
const WEIGHT = { name: 10, head: 10, head2: 8, code: 10, summary: 4, curated: 5, keywords: 2, description: 1 };

/** Palabras que no dicen qué es el producto al principio de una descripción («Elegante bolígrafo…»). */
const HEAD_SKIP = new Set(
  [
    "la", "el", "los", "las", "un", "una", "de", "del", "con", "y", "en", "nuevo", "nueva", "elegante", "practico", "practica",
    "original", "moderno", "moderna", "clasico", "clasica", "completo", "completa", "innovador", "innovadora", "exclusivo",
    "exclusiva", "bonito", "bonita", "gran", "mini", "set", "pack", "juego", "kit", "lote", "divertido", "divertida",
  ].map(stem),
);

export type SearchIndex = {
  records: SearchRecord[];
  /** Palabra (raíz) → [registro, peso, registro, peso…] con el mayor peso de cada registro. */
  postings: Map<string, number[]>;
  vocab: string[];
  /** Palabras que aparecen en campos importantes (peso ≥ 4) y cómo se escriben: base de las correcciones. */
  surface: Map<string, string>;
};

export function buildSearchIndex(records: SearchRecord[]): SearchIndex {
  const postings = new Map<string, number[]>();
  const surface = new Map<string, string>();
  records.forEach((r, i) => {
    const best = new Map<string, number>();
    const add = (list: string[], weight: number) => {
      for (const raw of list) {
        const w = stem(raw);
        if ((best.get(w) ?? 0) < weight) best.set(w, weight);
        if (weight >= WEIGHT.summary && !surface.has(w) && raw.length > 3 && !/\d/.test(raw)) surface.set(w, raw);
      }
    };
    const catalog = isCatalog(r.id);
    const text = r.description || r.detail;
    const cut = text.search(/[.\n]/);
    const first = textWords(cut < 0 ? text : text.slice(0, cut));
    add(textWords(r.name), WEIGHT.name);
    if (r.code) add([r.code.toLowerCase()], WEIGHT.code);
    if (catalog) {
      add([r.id.slice(r.id.indexOf(":") + 1).toLowerCase()], WEIGHT.code);
      const head = first.filter((w) => !HEAD_SKIP.has(stem(w)) && !/\d/.test(w)).slice(0, 3);
      add(head.slice(0, 1), WEIGHT.head);
      add(head.slice(1), WEIGHT.head2);
    }
    add(first, WEIGHT.summary);
    add(textWords(r.keywords), catalog || r.kind === "page" ? WEIGHT.keywords : WEIGHT.curated);
    if (cut >= 0) add(textWords(text.slice(cut)), WEIGHT.description);
    for (const [w, weight] of best) {
      let list = postings.get(w);
      if (!list) postings.set(w, (list = []));
      list.push(i, weight);
    }
  });
  return { records, postings, vocab: [...postings.keys()], surface };
}

export const indexFromJson = (json: CompactIndex) => buildSearchIndex(json.records.map(expandRecord));

/* -------------------------------------------------------------- consulta */

/** Palabras vacías: no cuentan. */
const STOPWORDS = new Set(["de", "con", "la", "el", "los", "las", "en", "para", "del", "un", "una", "por", "y", "o", "a", "al", "tu", "su", "mi", "que", "bag", "bags"]);

/** Palabras de relleno: suman si aparecen, pero no son obligatorias. */
const SOFT = new Set(
  [
    "personalizado", "personalizada", "personalizados", "personalizadas", "personalizar", "personalizable", "personalizables",
    "tenerife", "canarias", "comprar", "precio", "precios", "barato", "barata", "baratos", "baratas", "logo", "ropa", "online",
    "impreso", "impresa", "impresos", "impresas", "empresa", "empresas",
  ].map(stem),
);

type QueryTerm = {
  /** Palabra tal cual (normalizada) para reconstruir la búsqueda en las correcciones. */
  word: string;
  stem: string;
  alts: string[];
  optional: boolean;
  audience?: Audience;
};

type ParsedQuery = { terms: QueryTerm[]; words: string[]; without: string[] };

export function parseQuery(query: string): ParsedQuery {
  const list = textWords(query.replace(/([a-z])-(?=[a-z])/gi, "$1 ")).flatMap((w) => PHRASES[w] ?? [w]);
  const terms: QueryTerm[] = [];
  const without: string[] = [];
  const kept: string[] = [];
  list.forEach((word, i) => {
    if (word === "sin" && i + 1 < list.length) {
      without.push(stem(list[i + 1]));
      return;
    }
    if (STOPWORDS.has(word)) return;
    kept.push(word);
    const s = stem(word);
    const audience = audienceOfWord(word);
    if (terms.some((t) => t.stem === s)) return;
    terms.push({ word, stem: s, alts: SYNONYMS.get(s) ?? [], optional: SOFT.has(s), audience });
  });
  // Si todo es relleno («tenerife»), deja de serlo.
  if (terms.length && terms.every((t) => t.optional)) terms.forEach((t) => (t.optional = false));
  return { terms, words: kept, without };
}

/** Calidad de cada palabra del índice que responde a la palabra buscada. */
function matchWords(index: SearchIndex, t: QueryTerm) {
  const found = new Map<string, number>();
  const set = (w: string, q: number) => {
    if ((found.get(w) ?? 0) < q) found.set(w, q);
  };
  for (const w of index.vocab) {
    if (w === t.stem) set(w, 1);
    else if (t.stem.length >= 3 && w.startsWith(t.stem)) set(w, 0.6);
    else if (t.stem.length >= 4 && w.includes(t.stem)) set(w, 0.3);
  }
  for (const alt of t.alts) {
    if (index.postings.has(alt)) set(alt, 0.9);
    if (alt.length >= 4) for (const w of index.vocab) if (w !== alt && w.startsWith(alt)) set(w, 0.5);
  }
  return found;
}

/** Puntos de una palabra buscada en cada registro (0 = no aparece o no basta). */
function termScores(index: SearchIndex, t: QueryTerm): Float64Array {
  const scores = new Float64Array(index.records.length);
  const apply = (words: Map<string, number>) => {
    for (const [w, q] of words) {
      const list = index.postings.get(w)!;
      for (let k = 0; k < list.length; k += 2) {
        const s = list[k + 1] * q;
        if (s >= 0.5 && s > scores[list[k]]) scores[list[k]] = s;
      }
    }
  };
  if (!t.audience) {
    apply(matchWords(index, t));
    return scores;
  }
  // Público: en Roly y JHK mandan las tallas y el nombre; en el resto, el texto.
  apply(new Map(audienceStems(t.audience).filter((w) => index.postings.has(w)).map((w) => [w, 1])));
  index.records.forEach((r, i) => {
    if (!isSized(r.id)) return;
    scores[i] = matchesAudience(r.audience, t.audience!) ? WEIGHT.name + (t.audience === "kids" && isKidsOnly(r.audience) ? 1 : 0) : 0;
  });
  return scores;
}

/** Dice «sin X» seguido (para «camiseta sin mangas»). */
function hasWithout(r: SearchRecord, s: string) {
  const list = textWords(`${r.name} ${r.description} ${r.keywords}`).map(stem);
  return list.some((w, i) => w === "sin" && list[i + 1] === s);
}

const inScope = (id: string, scope: SearchScope) => {
  if (scope === "all") return true;
  const prefix = prefixOf(id);
  return scope === "roly" ? prefix === "roly" || prefix === "jhk" : prefix === "stamina";
};

const collator = new Intl.Collator("es", { sensitivity: "base" });

/** Las guías del blog nunca van como acceso directo; el resto de apartados, si su nombre responde a la búsqueda. */
const isGuide = (r: SearchRecord) => r.brand === "GUÍA";

/** Etiqueta corta de un apartado según su tipo (para las tarjetas y las sugerencias). */
export const pageLabel = (brand: string) =>
  brand === "CATEGORÍA" ? "Categoría" : brand === "SERVICIO" ? "Servicio" : brand === "GUÍA" ? "Guía" : "Información";

export const GUIDE_LIMIT = 3;
const SHORTCUT_LIMIT = 3;
const RELATED_BELOW = 8;
const RELATED_LIMIT = 24;

export type SearchResults = {
  /** Búsqueda cuyos resultados se muestran (la corregida si `corrected`). */
  query: string;
  /** Productos que responden a todas las palabras, del más relevante al menos. */
  products: SearchRecord[];
  /** Productos que responden solo a parte de la búsqueda (cuando hay pocos completos). */
  related: SearchRecord[];
  /** Categorías y servicios cuyo nombre responde a la búsqueda. */
  shortcuts: SearchRecord[];
  /** Guías y páginas informativas (las primeras GUIDE_LIMIT). */
  guides: SearchRecord[];
  guideTotal: number;
  /** Corrección cercana («¿Quisiste decir…?»). */
  suggestion?: string;
  /** La búsqueda original no dio nada y se muestran los resultados de `suggestion`. */
  corrected?: boolean;
};

const empty = (query: string): SearchResults => ({ query, products: [], related: [], shortcuts: [], guides: [], guideTotal: 0 });

function run(index: SearchIndex, query: string, scope: SearchScope): SearchResults {
  const { terms, without } = parseQuery(query);
  if (!terms.length) return empty(query);
  const scores = terms.map((t) => termScores(index, t));
  const required = terms.filter((t) => !t.optional).length;
  const hasKidsTerm = terms.some((t) => t.audience === "kids");

  type Hit = { record: SearchRecord; total: number; coverage: number; nameHits: number };
  const full: Hit[] = [];
  const partial: Hit[] = [];
  index.records.forEach((record, i) => {
    if (!inScope(record.id, scope) || (scope !== "all" && record.kind === "page")) return;
    let total = 0;
    let coverage = 0;
    let need = required;
    let nameHits = 0;
    terms.forEach((t, k) => {
      const s = scores[k][i];
      // Los apartados no tienen público: «sudadera niño» también lleva a la categoría Sudaderas.
      if (t.audience && record.kind === "page" && !t.optional) {
        need--;
        return;
      }
      if (!s) return;
      total += s;
      if (!t.optional) coverage++;
      if (s >= 9) nameHits++;
    });
    if (!total) return;
    if (!hasKidsTerm && isKidsOnly(record.audience)) total *= 0.9;
    // A igualdad, antes los productos propios con configurador (soportes, imprenta, medallas).
    if (record.kind === "product" && !NOT_BOOSTED.has(prefixOf(record.id))) total += 0.5;
    const hit = { record, total, coverage, nameHits };
    if (coverage >= need && without.every((s) => hasWithout(record, s))) full.push(hit);
    // Parciales: solo si alguna palabra responde al nombre o al tipo de producto.
    else if (coverage > 0 && nameHits > 0 && record.kind === "product" && without.every((s) => hasWithout(record, s))) partial.push(hit);
  });

  const byScore = (a: Hit, b: Hit) => b.total - a.total || collator.compare(a.record.name, b.record.name);
  full.sort(byScore);
  const products = full.filter((h) => h.record.kind === "product");
  const pages = full.filter((h) => h.record.kind === "page");
  const nameTerms = terms.filter((t) => !t.optional && !t.audience).length;
  const shortcuts = pages.filter((h) => !isGuide(h.record) && nameTerms > 0 && h.nameHits >= nameTerms).slice(0, SHORTCUT_LIMIT);
  const shortcutIds = new Set(shortcuts.map((h) => h.record.id));
  const guides = pages.filter((h) => !shortcutIds.has(h.record.id) && h.total / terms.length >= 2);
  const related =
    products.length < RELATED_BELOW && required > 1
      ? partial.sort((a, b) => b.coverage - a.coverage || byScore(a, b)).slice(0, RELATED_LIMIT).map((h) => h.record)
      : [];
  return {
    query,
    products: products.map((h) => h.record),
    related,
    shortcuts: shortcuts.map((h) => h.record),
    guides: guides.slice(0, GUIDE_LIMIT).map((h) => h.record),
    guideTotal: guides.length,
  };
}

/* ------------------------------------------------------------ correcciones */

/** Cambios permitidos para considerar una palabra un error de tecleo. */
const maxTypos = (word: string) => (/\d/.test(word) || word.length < 4 ? 0 : word.length >= 8 ? 2 : 1);

/** ¿La palabra buscada responde a algo con peso? (si no, se busca una corrección). */
function isKnown(index: SearchIndex, t: QueryTerm) {
  if (t.audience) return true;
  for (const [w, q] of matchWords(index, t)) {
    const list = index.postings.get(w)!;
    for (let k = 1; k < list.length; k += 2) if (list[k] * q >= WEIGHT.summary * 0.6) return true;
  }
  return false;
}

/** Búsqueda corregida con las palabras más parecidas del catálogo, o undefined si no hay ninguna clara. */
export function suggestCorrection(index: SearchIndex, query: string): string | undefined {
  const { terms, words } = parseQuery(query);
  let changed = false;
  const fixed = words.map((word) => {
    const t = terms.find((x) => x.word === word);
    if (!t || isKnown(index, t)) return word;
    const max = maxTypos(t.stem);
    if (!max) return word;
    let best: { word: string; d: number; df: number } | undefined;
    for (const [w, display] of index.surface) {
      const d = editDistance(t.stem, w, max);
      if (d > max) continue;
      const df = index.postings.get(w)!.length;
      if (!best || d < best.d || (d === best.d && df > best.df)) best = { word: display, d, df };
    }
    if (!best) return word;
    changed = true;
    return best.word;
  });
  return changed ? fixed.join(" ") : undefined;
}

/** Busca en el índice: productos, accesos directos, guías y, si hace falta, una corrección. */
export function searchCatalog(index: SearchIndex, query: string, scope: SearchScope = "all"): SearchResults {
  const results = run(index, query, scope);
  if (results.products.length >= 3) return results;
  const suggestion = suggestCorrection(index, query);
  if (!suggestion) return results;
  const fixed = run(index, suggestion, scope);
  if (fixed.products.length <= results.products.length) return results;
  if (!results.products.length && !results.shortcuts.length) return { ...fixed, suggestion, corrected: true };
  return { ...results, suggestion };
}
