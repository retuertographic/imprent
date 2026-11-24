/**
 * Textos SEO de las fichas de proveedor (Stamina, Roly, JHK): tipo de producto con su género,
 * H1 («Camiseta personalizada Roly Assen»), <title> («… · Tenerife», ≤60 caracteres si es posible)
 * y meta description. Funciones puras: sin dependencias de Next ni del sistema de archivos.
 *
 * El tipo sale de la frase con la que producción abre el título de la ficha («Camiseta técnica de
 * manga corta · ASSEN ROLY CA0201») o del nombre en JHK; si no se reconoce, de la categoría de la
 * tienda y, en último caso, «Prenda» (ropa) o «Artículo» (merchandising).
 */
import type { Brand, MerchPageData } from "./types";

type Gender = "m" | "f";
export type ProductKind = {
  /** Sustantivo o sintagma con mayúscula inicial: «Camiseta», «Bloc de notas», «Auriculares». */
  noun: string;
  gender: Gender;
  plural: boolean;
  /** Clave en minúsculas para agrupar fichas del mismo tipo (productos relacionados). */
  key: string;
};

/** Sustantivo → género (y plural si acaba en «s» y es plural). Lista sacada de los títulos de las fichas. */
const F = "f";
const M = "m";
const NOUNS: Record<string, Gender> = {
  // Ropa y complementos textiles
  camiseta: F, sudadera: F, chaqueta: F, camisa: F, parka: F, bermuda: F, casaca: F, bata: F, falda: F,
  malla: F, braga: F, gorra: F, visera: F, chaquetilla: F, cazadora: F, blusa: F, zapatilla: F, bota: F,
  chancla: F, calceta: F, manopla: F, pañoleta: F, muñequera: F, mascarilla: F, bufanda: F,
  polo: M, pantalón: M, chaleco: M, gorro: M, sombrero: M, delantal: M, chubasquero: M, conjunto: M,
  chándal: M, pareo: M, body: M, top: M, poncho: M, cortavientos: M, bañador: M, peto: M, jersey: M,
  buzo: M, micropolar: M, pañuelo: M, calcetín: M, zueco: M, calzado: M, legging: M, forro: M,
  tejido: M, guante: M, babero: M, mandil: M, cinturón: M, uniforme: M, pijama: M, short: M,
  // Merchandising
  mochila: F, bolsa: F, taza: F, nevera: F, batería: F, libreta: F, memoria: F, multiherramienta: F,
  gafa: F, vela: F, alfombrilla: F, lámpara: F, fiambrera: F, tabla: F, navaja: F, caja: F, funda: F,
  riñonera: F, manta: F, carpeta: F, toalla: F, agenda: F, cinta: F, jarra: F, bandolera: F,
  calculadora: F, almohadilla: F, linterna: F, estación: F, medalla: F, botella: F, silla: F,
  máscara: F, pajita: F, colchoneta: F, pelota: F, barbacoa: F, báscula: F, pantalla: F, cartera: F,
  baraja: F, sombrilla: F, pizarra: F, cuchara: F, cubitera: F, petaca: F, coctelera: F, esterilla: F,
  lupa: F, maceta: F, bandeja: F, espátula: F, radio: F, comba: F, tapa: F, cantimplora: F, cesta: F,
  base: F, gota: F, hamaca: F, tarjeta: F, figura: F, pulsera: F, placa: F, brocha: F,
  bolígrafo: M, bidón: M, llavero: M, neceser: M, bloc: M, vaso: M, altavoz: M, cargador: M, cable: M,
  auricular: M, paraguas: M, estuche: M, lanyard: M, soporte: M, lápiz: M, bálsamo: M, tarjetero: M,
  bolso: M, sacacorchos: M, abridor: M, termo: M, parasol: M, identificador: M, puerto: M,
  ventilador: M, adorno: M, portatodo: M, trofeo: M, cepillo: M, reloj: M, portadocumentos: M,
  abanico: M, balón: M, dispositivo: M, trolley: M, calendario: M, lapicero: M, monedero: M,
  espejo: M, sobre: M, cutter: M, cenicero: M, tapón: M, peine: M, rascador: M, flexómetro: M,
  posavasos: M, parche: M, peluche: M, frisbee: M, collar: M, marcador: M, zapatillero: M, puzzle: M,
  enfriador: M, pastillero: M, paipai: M, calentador: M, cubo: M, nivel: M, ratón: M, medidor: M,
  organizador: M, portabotellas: M, roller: M, difusor: M, portalápices: M, candado: M, osito: M,
  saco: M, banderín: M, paño: M, rompecabezas: M, planificador: M, marcapáginas: M, ambientador: M,
  localizador: M, oso: M, árbol: M, portabocadillos: M, dispensador: M, escalímetro: M,
  destornillador: M, silbato: M, portanotas: M, ajustador: M, dominó: M, portafotos: M, bowl: M,
  shaker: M, anillo: M, imán: M, corazón: M, portasándwich: M, pelador: M, yoyó: M, adaptador: M,
  macetero: M, botellero: M, mosquetón: M, cuaderno: M, cuchillo: M, pin: M, hub: M, usb: M,
  cortapizzas: M, cubrevolante: M, set: M, juego: M, kit: M, par: M, pack: M, aplaudidor: M, cojín: M, cubierto: M, salvamanteles: M,
  portaminas: M, rotulador: M, subrayador: M, borrador: M, sacapuntas: M, clip: M, pendrive: M,
  antiestrés: M, dado: M, globo: M, sello: M, protector: M, maletín: M, portátil: M, avión: M,
};

/** Sustantivos que solo existen en plural (o casi siempre se nombran así). */
const PLURALS = new Set(["auriculares", "gafas", "guantes", "leggings", "calcetines", "zapatillas", "chanclas", "tapones", "multiherramientas", "adornos", "calcetas", "cubiertos", "pantalones"]);

/** Sustantivos compuestos que se nombran juntos: primera palabra → sintagma. */
const COMPOUNDS: Record<string, RegExp> = {
  memoria: /^memoria usb\b/,
  puerto: /^puerto usb\b/,
  bloc: /^bloc de notas\b/,
  base: /^base de carga\b/,
  estación: /^estación meteorológica\b/,
  batería: /^batería externa\b/,
  calzado: /^calzado laboral\b/,
  usb: /^usb hub\b/,
};

/** Palabras que abren la frase pero no son el producto («El», «Práctica», «Fantástico»…). */
const SKIP = new Set([
  "el", "la", "los", "las", "un", "una", "y", "práctico", "práctica", "fantástico", "fantástica", "elegante",
  "original", "cómodo", "cómoda", "divertido", "divertida", "doble", "mini", "bonito", "bonita", "ligero",
  "ligera", "potente", "amplio", "amplia", "perfecto", "perfecta", "exclusivo", "exclusiva", "idóneo",
  "idónea", "diviértete", "con", "esta", "este", "nuevo", "nueva", "resistente", "moderno", "moderna",
  "clásico", "clásica", "sencillo", "sencilla", "completo", "completa",
]);

/** «Set», «Juego», «Kit», «Par», «Pack»: se nombran con su complemento («Set de cubiertos»). */
const COLLECTIVE = new Set(["set", "juego", "kit", "par", "pack"]);

/** Errores tipográficos de los datos del proveedor. */
const TYPOS: Record<string, string> = { bolígrado: "bolígrafo", gorro100: "gorro" };

/** Categoría de la tienda → tipo por defecto. */
const CATEGORY_KIND: Record<string, [string, Gender, boolean?]> = {
  Camisetas: ["Camiseta", F],
  Sudaderas: ["Sudadera", F],
  Polos: ["Polo", M],
  Pantalones: ["Pantalón", M],
  "Abrigos y chaquetas": ["Chaqueta", F],
  Bolsas: ["Bolsa", F],
  Gorras: ["Gorra", F],
  Tazas: ["Taza", F],
  Botellas: ["Botella", F],
  Libretas: ["Libreta", F],
  Bolígrafos: ["Bolígrafo", M],
  Llaveros: ["Llavero", M],
  Mochilas: ["Mochila", F],
};

const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase("es") + s.slice(1);
const words = (s: string) =>
  s
    .toLocaleLowerCase("es")
    .replace(/\bcorta pizzas\b/g, "cortapizzas")
    .replace(/\bcubre volante\b/g, "cubrevolante")
    .replace(/[/,:;.()·]+/g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/[^a-záéíóúüñ0-9-]/g, ""))
    .filter(Boolean);

const PLURAL_BASE: Record<string, string> = { calcetines: "calcetín", tapones: "tapón", pantalones: "pantalón" };

function singular(word: string): { base: string; plural: boolean } | null {
  if (word in NOUNS) return { base: word, plural: PLURALS.has(word) };
  if (PLURAL_BASE[word]) return { base: PLURAL_BASE[word], plural: true };
  if (PLURALS.has(word)) {
    for (const base of [word.slice(0, -1), word.slice(0, -2)]) if (base in NOUNS) return { base, plural: true };
  }
  return null;
}

/** Tipo a partir de una frase («Práctica mochila extensible» → Mochila, f). */
function kindFromPhrase(phrase: string): ProductKind | null {
  const list = words(phrase).map((w) => TYPOS[w.replace(/\d+%?$/, "")] ?? TYPOS[w] ?? w);
  for (let i = 0; i < Math.min(list.length, 4); i++) {
    const w = list[i];
    if (SKIP.has(w)) continue;
    const hit = singular(w);
    if (!hit) {
      // Primera palabra desconocida: no se busca más allá (evita tomar un complemento como tipo).
      if (i > 0 && !SKIP.has(list[i - 1])) return null;
      continue;
    }
    const rest = list.slice(i).join(" ");
    let noun = list[i];
    const compound = COMPOUNDS[hit.base]?.exec(rest);
    if (compound) noun = compound[0];
    else if (COLLECTIVE.has(hit.base) && list[i + 1] === "de" && list[i + 2]) {
      // «Set de 2 parasoles», «Juego de mesa»
      noun = list.slice(i, /^(?:\d+|dos|tres|cuatro|cinco|seis)$/.test(list[i + 2]) && list[i + 3] ? i + 4 : i + 3).join(" ");
    }
    noun = noun.replace(/\busb\b/g, "USB").replace(/\bhub\b/g, "HUB");
    return { noun: capitalize(noun), gender: NOUNS[hit.base], plural: hit.plural, key: hit.base };
  }
  return null;
}

/** Frase descriptiva con la que producción abre el título («Camiseta técnica de manga corta»). */
const typePhrase = (data: MerchPageData) =>
  data.brand === "jhk" ? data.product.name.split(" · ")[0] : data.meta.title.split(" · ")[0];

export function productKind(data: MerchPageData): ProductKind {
  const found = kindFromPhrase(typePhrase(data)) ?? kindFromPhrase(data.product.description);
  if (found) return found;
  const category = data.context?.category?.name;
  const fallback = category ? CATEGORY_KIND[category] : undefined;
  if (fallback) return { noun: fallback[0], gender: fallback[1], plural: false, key: fallback[0].toLocaleLowerCase("es") };
  return data.brand === "stamina"
    ? { noun: "Artículo", gender: "m", plural: false, key: "artículo" }
    : { noun: "Prenda", gender: "f", plural: false, key: "prenda" };
}

/** «personalizada», «personalizados»… */
export const personalized = (kind: Pick<ProductKind, "gender" | "plural">) =>
  `personalizad${kind.gender === "f" ? "a" : "o"}${kind.plural ? "s" : ""}`;

const BRAND_LABEL: Record<Brand, string> = { stamina: "Stamina", roly: "Roly", jhk: "JHK" };
export const brandLabel = (brand: Brand) => BRAND_LABEL[brand];

const ACRONYMS = new Set(["GSM", "USB", "HUB", "RPET", "LED", "UV", "PU", "PVC", "RFID", "3D", "XL", "XXL", "II", "III", "PET", "ECO", "TWS", "A4", "A5", "A6", "PP", "ABS", "EVA"]);

/** «ASSEN» → «Assen»; respeta siglas y nombres que ya vienen en mayúsculas y minúsculas. */
function modelCase(name: string) {
  return name
    .split(/(\s+|-)/)
    .map((w) => {
      if (!/[A-ZÁÉÍÓÚÑ]/.test(w) || /[a-záéíóúñ]/.test(w) || ACRONYMS.has(w) || /\d/.test(w)) return w;
      return w.charAt(0) + w.slice(1).toLocaleLowerCase("es");
    })
    .join("");
}

/** Nombre del modelo sin la marca ni el tipo: «Assen», «Cropped mujer» (JHK). */
export function modelName(data: MerchPageData, kind: ProductKind = productKind(data)) {
  if (data.brand !== "jhk") return modelCase(data.product.name.trim());
  const name = data.product.name.split(" · ")[0].trim();
  const first = name.split(/\s+/)[0];
  const rest = first.toLocaleLowerCase("es") === kind.noun.toLocaleLowerCase("es") ? name.slice(first.length).trim() : name;
  return rest || data.product.code;
}

export type ProductHeading = {
  /** «Camiseta personalizada» */
  kind: string;
  /** «Roly Assen» */
  model: string;
  /** H1 completo: «Camiseta personalizada Roly Assen». */
  text: string;
};

export function productHeading(data: MerchPageData): ProductHeading {
  const kind = productKind(data);
  const label = `${kind.noun} ${personalized(kind)}`;
  const model = `${brandLabel(data.brand)} ${modelName(data, kind)}`;
  return { kind: label, model, text: `${label} ${model}` };
}

const TITLE_MAX = 60;

/** <title>: «Camiseta personalizada Roly Assen · Tenerife»; si pasa de 60, sin marca y, si hace falta, sin Tenerife. */
export function productTitle(data: MerchPageData) {
  const kind = productKind(data);
  const label = `${kind.noun} ${personalized(kind)}`;
  const model = modelName(data, kind);
  const brand = brandLabel(data.brand);
  const fit = [`${label} ${brand} ${model} · Tenerife`, `${label} ${model} · Tenerife`].find((t) => t.length <= TITLE_MAX);
  if (fit) return fit;
  // Nombre de modelo muy largo («Spun Poliester + Elastano 200 GSM»): se recorta por palabras, dejando al menos dos.
  const parts = model.split(/\s+/);
  while (parts.length > 2) {
    parts.pop();
    const t = `${label} ${parts.join(" ").replace(/\s*[+&/-]$/, "")} · Tenerife`;
    if (t.length <= TITLE_MAX) return t;
  }
  return [`${label} ${brand} ${model}`, `${label} ${model}`].find((t) => t.length <= TITLE_MAX) ?? `${label} ${model}`;
}

const plain = (s: string) => s.replace(/<[^>]*>/g, " ").replace(/·/g, " ").replace(/\s+/g, " ").trim();

/** Primera frase de la descripción, sin el punto final. */
function firstSentence(text: string) {
  return plain(text).split(/(?<=[a-záéíóúñ0-9)])\.(?:\s|$)/i)[0].replace(/[.\s]+$/, "").trim();
}

const DESCRIPTION_MAX = 158;

/** Recorta por palabras con «…» si no cabe. */
function clip(text: string, max: number) {
  if (text.length <= max) return text;
  let cut = text.slice(0, max - 1).replace(/[\s,;:]+\S*$/, "");
  // Sin preposiciones ni artículos colgando antes de los puntos suspensivos («…con el frontal de…»).
  while (/\s(?:de|del|con|el|la|los|las|en|y|e|o|para|a|al|un|una|su|sus|por|que|sin)$/i.test(cut)) cut = cut.replace(/\s\S+$/, "");
  return cut.replace(/[\s,;:]+$/, "") + "…";
}

/** Meta description: H1, referencia, primera frase de la descripción, colores, tallas y entrega. */
export function productDescription(data: MerchPageData) {
  const { product } = data;
  const heading = productHeading(data).text;
  const sentence = firstSentence(product.description) || firstSentence(product.composition);
  const sizes = product.sizes.filter((s) => !/^(?:talla )?[uú]nica\b/i.test(s.trim()));
  const colors = product.colors.length;
  const head = `${heading} (ref. ${product.code}).`;
  const variety =
    colors > 1 || sizes.length > 1
      ? [colors > 1 ? `${colors} colores` : "", sizes.length > 1 ? `${sizes.length} tallas` : ""].filter(Boolean).join(" y ") + "."
      : "";
  const tail = "Precio por cantidad. Taller en Tenerife, entrega en Canarias.";
  const fixed = [head, variety, tail].filter(Boolean).join(" ");
  const room = DESCRIPTION_MAX - fixed.length - 1;
  if (!sentence || room < 30) return fixed.length <= DESCRIPTION_MAX ? fixed : `${head} ${tail}`;
  const middle = clip(`${sentence}.`, room);
  return [head, middle, variety, tail].filter(Boolean).join(" ");
}
