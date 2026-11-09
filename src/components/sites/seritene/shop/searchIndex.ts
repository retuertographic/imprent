/**
 * Buscador de productos y apartados (?q=), igual que https://seritene.com/api/search.
 *
 * Producción calcula la búsqueda en el servidor; aquí el índice completo viaja con la web
 * (public/sites/seritene/shop-data/search-index.json, generado por
 * scripts/extract-search-index.mjs) y este módulo reproduce su emparejamiento y su orden.
 * Lo comprueba scripts/check-search.mjs contra respuestas reales guardadas en scripts/fixtures.
 *
 * Reglas deducidas de la API:
 * - Texto: minúsculas y sin tildes (ñ → n). Palabras = tramos de letras y cifras; una cifra
 *   pegada a 3+ letras se separa («algodón150» → algodon 150) y «200g/m²» → 200 g m.
 * - Consulta: el guion une palabras (t-shirt → tshirt) y se quitan las palabras vacías (de, la, con…). Si no queda ninguna, no hay
 *   resultados. Cada palabra restante tiene que encontrarse en el registro (Y lógico).
 * - Algunas palabras forman grupos (plurales de categorías, sinónimos: tote → bolsa,
 *   woman → mujer, deportiva → deporte…). Buscar cualquiera equivale a buscar el grupo.
 * - «sin X» exige además la expresión seguida en el texto.
 * - Cada palabra puntúa según dónde y cómo aparece; la nota del registro es la suma:
 *     nombre: igual 7 · sinónimo o palabra que empieza por ella 6 · parecida 5 (1 cambio) o 4,5 (2)
 *     referencia, palabras clave y descripción: igual 4 · empieza por ella 3 · parecida 2 o 1,5
 *   «Parecida» = distancia de edición (con trasposiciones) ≤ 1 para 4–7 letras y ≤ 2 para 8+;
 *   las palabras de 3 letras o con cifras solo cuentan si son iguales.
 * - Orden: nota de mayor a menor y, a igual nota, nombre en orden alfabético español.
 *   Apartados y productos se mezclan en la misma lista.
 * - Ámbitos: /ropa/ busca solo Roly y JHK; /merchandising/, solo Stamina; /productos/, todo.
 */

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
};

/** Registro compacto del JSON: [id, nombre, descripción, palabras clave, imagen, extras?]. */
export type CompactRecord = [string, string, string, string, string, CompactExtra?];
/** Campos que no se pueden deducir del id: p ruta, b etiqueta, t detalle, c referencia. */
export type CompactExtra = { p?: string; b?: string; t?: string; c?: string };
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
  const image = r.image.startsWith(GORFACTORY) ? "@" + r.image.slice(GORFACTORY.length) : r.image;
  return Object.keys(extra).length ? [r.id, r.name, r.description, r.keywords, image, extra] : [r.id, r.name, r.description, r.keywords, image];
}

/* ------------------------------------------------------------------ texto */

/** Palabras que no cuentan («bag» también se ignora: «tote bag» = «tote»). */
const STOPWORDS = new Set(["de", "con", "la", "el", "los", "las", "en", "para", "del", "un", "una", "por", "bag", "bags"]);

/** Palabras que equivalen a buscar varias. */
const PHRASES: Record<string, string[]> = { hoodie: ["sudadera", "capucha"] };

/**
 * Grupos de palabras equivalentes: clave → [formas exactas, sinónimos].
 * - La clave, las formas exactas y, en los registros, el plural de la clave (+s, +es) cuentan
 *   como la misma palabra.
 * - Los sinónimos también cuentan como coincidencia exacta y, como la clave, admiten prefijo
 *   y parecido; las formas exactas no (p. ej. «woman» no trae «roman»).
 * Buscar cualquier palabra del grupo equivale a buscar la clave.
 */
const GROUPS: Record<string, [string[], string[]]> = {
  abrigo: [["abrigos"], []],
  bolsa: [["bolsas", "tote"], []],
  boligrafo: [["boligrafos", "boli"], []],
  botella: [["botellas", "botela"], []],
  camiseta: [["camisetas", "shirt", "tshirt"], []],
  chaqueta: [["chaquetas"], []],
  corta: [["corto", "cortas", "cortos"], []],
  deporte: [["sport", "deportiva"], ["deportivo"]],
  fullprint: [["sublimada", "sublimado"], []],
  gorra: [["gorras", "cap"], []],
  guia: [["guias"], []],
  hombre: [["masculina"], []],
  laboral: [["trabajo"], []],
  lanyard: [["lanyards"], []],
  larga: [["largo", "largas", "largos"], []],
  libreta: [["libretas", "cuaderno"], []],
  llavero: [["llaveros"], []],
  mochila: [["mochilas"], []],
  mujer: [["woman", "femenina"], []],
  nino: [["ninos", "nina", "ninas", "infantil", "infantiles", "kids"], []],
  organico: [["organica", "ecologica"], ["ecologico"]],
  pantalon: [["pantalones"], []],
  poliester: [["polyester"], []],
  polo: [["polos"], []],
  pulsera: [["pulseras"], []],
  reciclado: [["reciclada", "recicladas", "recycled"], []],
  sudadera: [["sudaderas"], []],
  tarjeta: [["tarjetas"], []],
  taza: [["tazas", "mug"], []],
  tecnologia: [[], []],
  toalla: [["toallas"], []],
};

type Term = {
  /** Clave y formas exactas: coincidencia exacta en el nombre = 7. */
  alias: string[];
  /** Todo lo que cuenta como coincidencia exacta. */
  exact: string[];
  /** Palabras con las que se admite prefijo y parecido. */
  loose: string[];
  /** Términos de grupos cuya clave empieza por la palabra («full» → fullprint, sublimada…). */
  prefixGroups: string[];
  /** Palabra tal cual se escribió cuando llegó al grupo por su plural (ver score). */
  literal?: Term;
};

const groupByWord = new Map<string, Term>();
for (const [key, [forms, synonyms]] of Object.entries(GROUPS)) {
  // En los registros, el plural de la clave cuenta como la clave (reciclados → reciclado).
  const alias = [key, ...forms, key + "s", key + "es"];
  const term: Term = { alias, exact: [...alias, ...synonyms], loose: [key, ...synonyms], prefixGroups: [] };
  for (const word of [key, ...forms, ...synonyms]) groupByWord.set(word, term);
}

export const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export const words = (text: string) =>
  normalize(text)
    .replace(/([a-z]{3})(\d)/g, "$1 $2")
    .replace(/(\d)g\/m/g, "$1 g/m")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

function queryTerm(word: string): Term {
  const group = groupByWord.get(word);
  if (group) return group;
  const plain: Term = { alias: [word], exact: [word], loose: [word], prefixGroups: prefixTerms(word) };
  // También en plural: «deportivas» → deportiva → deporte.
  const singular = groupByWord.get(word.replace(/s$/, "")) ?? groupByWord.get(word.replace(/es$/, ""));
  return singular ? { ...singular, literal: plain } : plain;
}

function prefixTerms(word: string) {
  return word.length < 4 ? [] : Object.keys(GROUPS).filter((key) => key !== word && key.startsWith(word)).flatMap((key) => groupByWord.get(key)!.exact);
}

// En la consulta, el guion entre letras une la palabra («t-shirt» → tshirt, «roll-up» → rollup).
const queryWords = (query: string) =>
  words(normalize(query).replace(/([a-z])-(?=[a-z])/g, "$1"))
    .flatMap((w) => PHRASES[w] ?? [w])
    .filter((w) => !STOPWORDS.has(w));

/** Palabras de la consulta (vacía si solo hay palabras vacías). */
export const queryTerms = (query: string) => queryWords(query).map(queryTerm);

/**
 * «sin X» se busca como expresión: además de contener ambas palabras, el registro tiene que
 * decir «sin X» seguido (por eso «sin mangas» encuentra camisetas sin mangas, no cualquier
 * prenda con mangas que diga «sin» en otra parte).
 */
function withoutPhrases(query: string): Term[] {
  const list = queryWords(query);
  return list.flatMap((w, i) => (w === "sin" && i + 1 < list.length ? [queryTerm(list[i + 1])] : []));
}

const hasPhrase = (p: Prepared, t: Term) =>
  [p.name, ...p.other].some((list) => list.some((w, i) => w === "sin" && i + 1 < list.length && t.alias.includes(list[i + 1])));

/* ------------------------------------------------------------- parecido */

/** Cambios permitidos para que una palabra se considere parecida. */
const maxTypos = (word: string) => (/\d/.test(word) || word.length < 4 ? 0 : word.length >= 8 ? 2 : 1);

/** Distancia de edición con trasposiciones (Damerau restringida); corta en max + 1. */
function editDistance(a: string, b: string, max: number) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev2: number[] = [];
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  let prevMin = 0;
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      let v = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
      row.push(v);
      rowMin = Math.min(rowMin, v);
    }
    // Con trasposiciones, una fila puede apoyarse en la de dos pasos atrás.
    if (rowMin > max && prevMin > max) return max + 1;
    prevMin = rowMin;
    prev2 = prev;
    prev = row;
  }
  return prev[b.length];
}

/* ---------------------------------------------------------------- índice */

type Prepared = { record: SearchRecord; name: string[]; other: string[][] };

export type SearchIndex = { records: Prepared[] };

export function buildSearchIndex(records: SearchRecord[]): SearchIndex {
  return {
    records: records.map((record) => ({
      record,
      name: words(record.name),
      other: [[...words(record.keywords), ...(record.code ? [normalize(record.code)] : [])], words(record.description)],
    })),
  };
}

export const indexFromJson = (json: CompactIndex) => buildSearchIndex(json.records.map(expandRecord));

/** Distancias ya calculadas para la consulta en curso (muchas palabras se repiten). */
type DistanceCache = Map<string, number>;

function distance(term: string, word: string, cache: DistanceCache) {
  const key = term + " " + word;
  let d = cache.get(key);
  if (d === undefined) {
    const max = maxTypos(term);
    d = editDistance(term, word, max);
    // Una palabra de un grupo también se compara por su clave (toallas → toalla).
    const group = groupByWord.get(word);
    const groupKey = group?.alias[0];
    if (groupKey && groupKey !== word) d = Math.min(d, editDistance(term, groupKey, max));
    if (d > max) d = Infinity;
    cache.set(key, d);
  }
  return d;
}

/** Menor distancia entre los términos y las palabras (Infinity si ninguna es parecida). */
function closest(terms: string[], lists: string[][], cache: DistanceCache) {
  let best = Infinity;
  for (const term of terms) {
    if (!maxTypos(term)) continue;
    for (const list of lists) for (const word of list) best = Math.min(best, distance(term, word, cache));
  }
  return best;
}

const has = (list: string[], term: string) => list.includes(term);
const extends_ = (list: string[], term: string) => term.length >= 4 && list.some((w) => w !== term && w.startsWith(term));

/** Puntos de una palabra de la consulta en un registro (0 = no aparece). */
function score(p: Prepared, t: Term, cache: DistanceCache): number {
  if (!t.literal) return groupScore(p, t, cache);
  // Plural de una palabra de grupo: la palabra escrita manda y el grupo cuenta un poco menos
  // («deportivas» pone antes lo que dice «deportivas» que lo que dice «deportiva»).
  const base = groupScore(p, t, cache);
  return base ? Math.max(groupScore(p, t.literal, cache), base - 0.01) : 0;
}

function groupScore(p: Prepared, t: Term, cache: DistanceCache): number {
  if (t.alias.some((x) => has(p.name, x))) return 7;
  if (t.exact.some((x) => has(p.name, x)) || t.loose.some((x) => extends_(p.name, x))) return 6;
  const inName = closest(t.loose, [p.name], cache);
  if (inName < Infinity) return inName === 1 ? 5 : 4.5;
  if (t.exact.some((x) => p.other.some((list) => has(list, x)))) return 4;
  if (t.loose.some((x) => p.other.some((list) => extends_(list, x)))) return 3;
  if (t.prefixGroups.some((x) => p.other.some((list) => has(list, x)))) return 3;
  const inOther = closest(t.loose, p.other, cache);
  if (inOther < Infinity) return inOther === 1 ? 2 : 1.5;
  return 0;
}

const inScope = (id: string, scope: SearchScope) => {
  if (scope === "all") return true;
  const prefix = id.slice(0, id.indexOf(":"));
  return scope === "roly" ? prefix === "roly" || prefix === "jhk" : prefix === "stamina";
};

const collator = new Intl.Collator("es", { sensitivity: "base" });

/** Resultados ordenados como en producción. */
export function searchIndex(index: SearchIndex, query: string, scope: SearchScope): SearchRecord[] {
  const terms = queryTerms(query);
  if (!terms.length) return [];
  const phrases = withoutPhrases(query);
  const cache: DistanceCache = new Map();
  const hits: { record: SearchRecord; total: number }[] = [];
  for (const p of index.records) {
    if (!inScope(p.record.id, scope) || !phrases.every((t) => hasPhrase(p, t))) continue;
    let total = 0;
    for (const t of terms) {
      const s = score(p, t, cache);
      if (!s) {
        total = 0;
        break;
      }
      total += s;
    }
    if (total) hits.push({ record: p.record, total });
  }
  hits.sort((a, b) => b.total - a.total || collator.compare(a.record.name, b.record.name));
  return hits.map((h) => h.record);
}
