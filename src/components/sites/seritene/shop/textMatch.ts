/**
 * Utilidades de texto para buscar y filtrar el catálogo (las usa el buscador, searchIndex.ts,
 * y pueden reutilizarlas los listados): normalización, palabras, plurales simples en español,
 * sinónimos del sector y palabras que piden un público (niño, mujer, hombre).
 */

/** Minúsculas y sin tildes (ñ → n). */
export const normalizeText = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/**
 * Expresiones que se escriben de varias formas y se unen en una palabra antes de partir el texto:
 * «roll up», «roll-up», «rollups» → rollup; «t-shirt» → tshirt; «full print» → fullprint.
 */
const COMPOUNDS: [RegExp, string][] = [
  [/\broll[\s-]*ups?\b/g, "rollup"],
  [/\bt[\s-]+shirts?\b/g, "tshirt"],
  [/\bfull[\s-]+print\b/g, "fullprint"],
  [/\btote[\s-]*bags?\b/g, "tote"],
  [/\bfoam[\s-]+board\b/g, "foamboard"],
  [/\bphoto[\s-]+call\b/g, "photocall"],
];

/** Palabras normalizadas de un texto (letras y cifras; «algodón150» → algodon 150). */
export function textWords(text: string): string[] {
  let t = normalizeText(text);
  for (const [re, to] of COMPOUNDS) t = t.replace(re, to);
  return t
    .replace(/([a-z]{3})(\d)/g, "$1 $2")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/**
 * Raíz de una palabra para comparar singular y plural: tazas → taza, pantalones → pantalon,
 * luces → luz, detalle/detalles → detall. Se aplica igual al texto y a la búsqueda, así que basta
 * con que sea consistente (no es una raíz gramatical). Las palabras cortas y con cifras no cambian.
 */
export function stem(word: string): string {
  if (word.length <= 3 || /\d/.test(word)) return word;
  if (word.endsWith("ces")) return word.slice(0, -3) + "z";
  if (word.endsWith("es") && word.length > 4) return word.slice(0, -2);
  if (word.endsWith("s") || word.endsWith("e")) return word.slice(0, -1);
  return word;
}

/**
 * Sinónimos útiles comprobados con el catálogo: buscar la clave también encuentra estas palabras
 * (como coincidencia casi exacta). Se escriben sin tildes; las raíces se calculan al cargar.
 */
const SYNONYM_LIST: Record<string, string[]> = {
  boli: ["boligrafo"],
  boligrafo: ["boli"],
  camiseta: ["tshirt"],
  tshirt: ["camiseta"],
  shirt: ["camiseta"],
  gorra: ["visera", "cap"],
  visera: ["gorra"],
  cap: ["gorra"],
  flyer: ["folleto"],
  folleto: ["flyer"],
  octavilla: ["flyer", "folleto"],
  taza: ["mug"],
  mug: ["taza"],
  bolsa: ["tote"],
  tote: ["bolsa"],
  backpack: ["mochila"],
  libreta: ["bloc"],
  cuaderno: ["libreta", "bloc"],
  notebook: ["libreta", "bloc"],
  keyring: ["llavero"],
  termo: ["termico", "termica"],
  laboral: ["trabajo"],
  trabajo: ["laboral"],
  workwear: ["laboral", "trabajo"],
  fullprint: ["sublimacion", "sublimado", "sublimada"],
  sublimacion: ["fullprint", "sublimado", "sublimada"],
  lona: ["pancarta", "banner"],
  pancarta: ["lona", "banner"],
  banner: ["lona", "pancarta"],
  foam: ["carton", "pluma"],
  deporte: ["deportivo", "deportiva", "sport"],
  deportivo: ["deporte", "deportiva", "sport"],
  deportiva: ["deporte", "deportivo", "sport"],
  organico: ["organica", "ecologico", "ecologica"],
  ecologico: ["organico", "organica", "ecologica"],
  reciclado: ["reciclada", "recycled", "rpet"],
  corto: ["corta"],
  corta: ["corto"],
  largo: ["larga"],
  larga: ["largo"],
  trofeo: ["copa"],
};

export const SYNONYMS: Map<string, string[]> = new Map(
  Object.entries(SYNONYM_LIST).map(([k, list]) => [stem(k), list.map(stem)]),
);

/** Palabras que equivalen a buscar varias («hoodie» = sudadera con capucha). */
export const PHRASES: Record<string, string[]> = { hoodie: ["sudadera", "capucha"] };

export type Audience = "kids" | "women" | "men";

/** Palabras (ya normalizadas) que piden un público concreto. */
const AUDIENCE_WORDS: Record<Audience, string[]> = {
  kids: ["nino", "nina", "ninos", "ninas", "infantil", "infantiles", "kids", "kid", "junior", "bebe", "bebes", "baby", "child", "children", "peque", "peques"],
  women: ["mujer", "mujeres", "chica", "chicas", "woman", "women", "lady", "ladies", "femenina", "femenino", "senora"],
  men: ["hombre", "hombres", "chico", "chicos", "caballero", "masculina", "masculino", "man", "men"],
};

const audienceByStem = new Map<string, Audience>();
for (const [audience, list] of Object.entries(AUDIENCE_WORDS) as [Audience, string[]][]) {
  for (const w of list) audienceByStem.set(stem(w), audience);
}

/** Público que pide una palabra de la búsqueda (ya normalizada), si pide alguno. */
export const audienceOfWord = (word: string): Audience | undefined => audienceByStem.get(stem(word));

/** Raíces de las palabras con las que el texto de un registro puede decir ese público. */
export const audienceStems = (audience: Audience) => [...new Set(AUDIENCE_WORDS[audience].map(stem))];

/**
 * Pistas de público de un modelo de ropa (campo `audience` del índice; ver
 * scripts/lib/search-hints.mjs): «k» tallas infantiles además de adulto, «K» solo infantiles,
 * «w» modelo de mujer.
 */
export const hasKidsSizes = (flags: string) => /k/i.test(flags);
export const isKidsOnly = (flags: string) => flags.includes("K");
export const isWomenModel = (flags: string) => flags.includes("w");

/** Encaja un modelo con el público pedido (solo para modelos con tallas conocidas: Roly y JHK). */
export function matchesAudience(flags: string, audience: Audience) {
  if (audience === "kids") return hasKidsSizes(flags);
  if (audience === "women") return isWomenModel(flags);
  return !isWomenModel(flags) && !isKidsOnly(flags);
}

/** Distancia de edición con trasposiciones (Damerau restringida); corta en max + 1. */
export function editDistance(a: string, b: string, max: number) {
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
