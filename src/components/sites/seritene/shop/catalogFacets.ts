/**
 * Facetas de los listados de categoría, calculadas al generar el sitio (solo servidor).
 *
 * Fuentes, todas datos reales del proveedor ya presentes en el repositorio:
 * - tarjeta del listado (shop-data/<grupo>.json): marca y precio «desde»;
 * - ficha del modelo (merch/data/<marca>/<id>.json): colores, tallas, categorías del proveedor,
 *   nombre, descripción y personalización disponible;
 * - tarifas y stock del día (shop-data/roly-pricing.json, merch-pricing.json): embalaje (pedido mínimo)
 *   y unidades por SKU. JHK no tiene tarifa ni stock del día: no entra en «Con stock» ni «Desde 1 unidad».
 * - listas de categorías de la web (shop-data/<grupo>.json → lists): faceta «Categoría».
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getMerchProduct } from "../merch/serverData";
import type { Brand, MerchPageData, MerchPricingFile } from "../merch/types";
import { findCategory, shopCategories } from "./catalog";
import {
  COLOR_FAMILIES,
  colorFamilies,
  isAdultSize,
  isKidsSize,
  listingName,
  normalizeText,
  priceBucket,
  priceBuckets,
  token,
  type FacetDef,
  type FacetId,
  type ListingData,
  type ListingFacets,
  type ListingItem,
  type SortId,
} from "./catalogFilters";
import { getGroupData } from "./serverData";
import type { CardData, CardItem, ShopGroup } from "./types";

const SHOP_DATA = join(process.cwd(), "public/sites/seritene/shop-data");
const PRICING_FILES: Partial<Record<Brand, string>> = { roly: "roly-pricing.json", stamina: "merch-pricing.json" };

const pricingCache = new Map<string, MerchPricingFile>();
function pricingFile(brand: Brand): MerchPricingFile | null {
  const file = PRICING_FILES[brand];
  if (!file) return null;
  let data = pricingCache.get(file);
  if (!data) {
    data = JSON.parse(readFileSync(join(SHOP_DATA, file), "utf8")) as MerchPricingFile;
    pricingCache.set(file, data);
  }
  return data;
}

const productCache = new Map<string, MerchPageData | null>();
function productData(item: CardItem): MerchPageData | null {
  const brand = item.brand as Brand;
  const id = brand === "jhk" ? item.code : item.key;
  const cacheKey = `${brand}/${id}`;
  if (!productCache.has(cacheKey)) productCache.set(cacheKey, getMerchProduct(id, brand));
  return productCache.get(cacheKey) ?? null;
}

/* ------------------------------------------------------------------------------------------------
 * Reglas por listado
 * ---------------------------------------------------------------------------------------------- */

type Rule = { id: string; label: string; test: (p: ProductText) => boolean };
type ProductText = { head: string; text: string; cats: Set<string> };

/** Primeras palabras de la descripción (o el nombre): dicen qué prenda u objeto es. */
const startsWith = (re: RegExp) => (p: ProductText) => re.test(p.head);
const mentions = (re: RegExp) => (p: ProductText) => re.test(p.text);
const inCategory = (...cats: string[]) => (p: ProductText) => cats.some((c) => p.cats.has(c));
const any =
  (...tests: ((p: ProductText) => boolean)[]) =>
  (p: ProductText) =>
    tests.some((t) => t(p));

const GARMENTS: Rule[] = [
  { id: "camisetas", label: "Camisetas y tops", test: startsWith(/\b(camiseta|top|body)\b/) },
  { id: "polos", label: "Polos", test: startsWith(/\bpolo\b/) },
  { id: "camisas", label: "Camisas y casacas", test: startsWith(/\b(camisa|blusa|casaca)\b/) },
  { id: "sudaderas", label: "Sudaderas y jerséis", test: startsWith(/\b(sudadera|jersey)\b/) },
  {
    id: "chaquetas",
    label: "Chaquetas y parkas",
    test: startsWith(/\b(chaqueta|parka|chubasquero|cortavientos|micropolar|cazadora|anorak|softshell)\b/),
  },
  { id: "chalecos", label: "Chalecos", test: startsWith(/\bchaleco\b/) },
  {
    id: "pantalones",
    label: "Pantalones y mallas",
    test: startsWith(/\b(pantalon|bermuda|malla|mallas|legging|leggings|short|falda|peto|buzo)\b/),
  },
  { id: "conjuntos", label: "Chándales y conjuntos", test: startsWith(/\b(conjunto|chandal)\b/) },
  { id: "batas", label: "Batas", test: startsWith(/\bbata\b/) },
  { id: "delantales", label: "Delantales", test: startsWith(/\b(delantal|mandil)\b/) },
  { id: "calzado", label: "Calzado y calcetines", test: startsWith(/\b(calzado|bota|botas|zapato|zueco|calcetas?|calcetines)\b/) },
];

const SLEEVES: Rule[] = [
  { id: "manga-corta", label: "Manga corta", test: mentions(/\bmanga corta\b/) },
  { id: "manga-larga", label: "Manga larga", test: mentions(/\bmanga larga\b|\bl\/s\b/) },
  { id: "tirantes", label: "Tirantes o sin mangas", test: mentions(/\btirantes\b|\bsin mangas\b/) },
];

/** Tipo de producto por listado; un producto puede tener varios (o ninguno: «Otros»). */
const TYPE_RULES: Record<string, Rule[]> = {
  ropa: GARMENTS,
  "ropa-deporte": GARMENTS,
  "ropa-laboral": GARMENTS,
  "ropa-camisetas": SLEEVES,
  "ropa-polos": SLEEVES,
  "ropa-sudaderas": [
    { id: "capucha", label: "Con capucha", test: mentions(/\bcapucha\b/) },
    { id: "sin-capucha", label: "Sin capucha", test: (p) => !/\bcapucha\b/.test(p.text) },
    { id: "cremallera", label: "Con cremallera", test: mentions(/\bcremallera\b/) },
  ],
  "ropa-pantalones": [
    { id: "cortos", label: "Cortos y bermudas", test: mentions(/\b(bermuda|corto|cortos|short|pirata)\b/) },
    { id: "largos", label: "Largos", test: (p) => !/\b(bermuda|corto|cortos|short|pirata)\b/.test(p.text) },
  ],
  "ropa-abrigos": [
    { id: "chaquetas", label: "Chaquetas", test: startsWith(/\b(chaqueta|cazadora|softshell)\b/) },
    { id: "parkas", label: "Parkas", test: startsWith(/\bparka\b/) },
    { id: "chalecos", label: "Chalecos", test: startsWith(/\bchaleco\b/) },
    { id: "lluvia", label: "Chubasqueros y cortavientos", test: startsWith(/\b(chubasquero|cortavientos)\b/) },
    { id: "polares", label: "Sudaderas y polares", test: startsWith(/\b(sudadera|micropolar|polar)\b/) },
  ],
  "merchandising-tazas": [
    { id: "tazas", label: "Tazas", test: startsWith(/\btazas?\b/) },
    { id: "vasos", label: "Vasos", test: startsWith(/\bvasos?\b/) },
    { id: "jarras", label: "Jarras", test: startsWith(/\bjarras?\b/) },
  ],
  "merchandising-botellas": [
    { id: "bidones", label: "Bidones y botellas", test: (p) => !p.cats.has("thermos_flasks") },
    { id: "termos", label: "Termos", test: inCategory("thermos_flasks") },
  ],
  "merchandising-bolsas": [
    { id: "bolsas", label: "Bolsas", test: startsWith(/\b(bolsa|bolsas)\b/) },
    { id: "neceseres", label: "Neceseres", test: any(startsWith(/\bneceser\b/), inCategory("toliet_bag")) },
    { id: "bolsos", label: "Bolsos y monederos", test: startsWith(/\b(bolso|monedero)\b/) },
  ],
  "merchandising-libretas": [
    { id: "blocs", label: "Blocs de notas", test: startsWith(/\bbloc\b/) },
    { id: "libretas", label: "Libretas", test: startsWith(/\blibretas?\b/) },
    { id: "carpetas", label: "Carpetas", test: startsWith(/\bcarpetas?\b/) },
  ],
  "merchandising-boligrafos": [
    { id: "tactil", label: "Con puntero táctil", test: mentions(/\b(puntero|tactil|stylus)\b/) },
  ],
  "merchandising-gorras": [
    { id: "gorras", label: "Gorras", test: startsWith(/\bgorras?\b/) },
    { id: "gorros", label: "Gorros", test: startsWith(/\bgorros?\b/) },
  ],
  "merchandising-mochilas": [
    { id: "cuerdas", label: "Mochilas de cuerdas", test: any(inCategory("drawstring_bag"), mentions(/\bcuerdas\b/)) },
    {
      id: "portatil",
      label: "Para portátil",
      test: any(inCategory("executive_backpack", "writing_office_backp"), mentions(/\bportatil\b/)),
    },
    {
      id: "viaje",
      label: "Trolleys y bolsos de viaje",
      test: any(inCategory("trolley", "duffelbags"), startsWith(/\b(bolso|trolley|bandolera)\b/)),
    },
  ],
  "merchandising-tecnologia": [
    { id: "altavoces", label: "Altavoces", test: any(inCategory("speakers"), startsWith(/\baltavoz\b/)) },
    { id: "auriculares", label: "Auriculares", test: any(inCategory("earphones", "headphones"), startsWith(/\bauriculares\b/)) },
    { id: "inalambricos", label: "Cargadores inalámbricos", test: inCategory("wireless_charger") },
    { id: "baterias", label: "Baterías externas", test: any(inCategory("power_bank"), startsWith(/\bbateria\b/)) },
    {
      id: "cables",
      label: "Cables y adaptadores",
      test: any(inCategory("charging_cables", "usb_port", "travel_adaptors", "car_charger"), startsWith(/\b(cable|adaptador|puerto)\b/)),
    },
    { id: "usb", label: "Memorias USB", test: any(inCategory("usb_flash_drivers", "usb_stock"), startsWith(/\bmemoria\b/)) },
    {
      id: "accesorios",
      label: "Soportes y accesorios",
      test: any(inCategory("mobile_supports", "mouse_pad"), startsWith(/\b(soporte|alfombrilla|raton)\b/)),
    },
  ],
};

const TYPE_LABELS: Record<string, string> = {
  "ropa-camisetas": "Manga",
  "ropa-polos": "Manga",
  "ropa-sudaderas": "Estilo",
  "ropa-pantalones": "Largo",
  ropa: "Prenda",
  "ropa-deporte": "Prenda",
  "ropa-laboral": "Prenda",
};

/** Listados con «Otros» en el tipo (los productos que no encajan en ninguna opción). */
const TYPE_WITH_OTHERS = new Set([
  "ropa",
  "ropa-deporte",
  "ropa-laboral",
  "merchandising-tazas",
  "merchandising-bolsas",
  "merchandising-libretas",
  "merchandising-tecnologia",
]);

const BRAND_LABELS: Record<string, string> = { roly: "Roly", jhk: "JHK", stamina: "Stamina" };

const AUDIENCE = [
  { id: "hombre-unisex", label: "Hombre y unisex" },
  { id: "mujer", label: "Mujer" },
  { id: "infantil", label: "Infantil y bebé" },
];

const WOMAN = /\b(woman|women|lady|mujer|senora|femenin[ao])\b|entallad[ao]s? en (la )?cintura/;
const KIDS = /\b(kids?|child|children|nino|nina|ninos|infantil|bebe|baby)\b/;

const TECHNIQUES = [
  { id: "dtf", label: "DTF (precio en la ficha)" },
  { id: "dtf-uv", label: "DTF UV (precio en la ficha)" },
  { id: "consultar", label: "Bajo presupuesto" },
];

/* ------------------------------------------------------------------------------------------------
 * Cálculo
 * ---------------------------------------------------------------------------------------------- */

type Built = { facets: ListingFacets; data: ListingData };
const builtCache = new Map<string, Built>();

/** Todos los listados con archivo de datos: "ropa", "ropa-camisetas"… */
export const allListings = () => [
  "ropa",
  "merchandising",
  ...shopCategories.map((c) => listingName(c.group, c.slug)),
];

export function parseListing(name: string): { group: ShopGroup; slug?: string } | null {
  if (name === "ropa" || name === "merchandising") return { group: name };
  const category = shopCategories.find((c) => listingName(c.group, c.slug) === name);
  return category ? { group: category.group, slug: category.slug } : null;
}

function itemFacets(item: CardItem, listing: string, group: ShopGroup, isGroupListing: boolean) {
  const tokens: string[] = [];
  const add = (facet: FacetId, option: string) => tokens.push(token(facet, option));
  const data = productData(item);
  const product = data?.product;
  const english = item.brand === "jhk";
  const text = normalizeText(`${product?.name ?? item.name} ${product?.description ?? item.description}`);
  const head = normalizeText((product?.description ?? item.description).split(/\s+/).slice(0, 4).join(" ")) || normalizeText(item.name);
  const cats = new Set(product?.categories ?? []);
  const pt: ProductText = { head, text, cats };

  add("marca", item.brand);
  add("precio", priceBucket(item.fromPrice));

  // Categoría de la web (solo en /ropa/ y /merchandising/).
  if (isGroupListing) {
    const groupData = getGroupData(group);
    const memberOf = shopCategories.filter((c) => c.group === group && groupData.lists[c.id]?.includes(item.key));
    for (const c of memberOf) add("categoria", c.slug);
    if (!memberOf.length) add("categoria", "otros");
  }

  // Tipo de producto.
  const rules = TYPE_RULES[listing];
  if (rules) {
    const matched = rules.filter((r) => r.test(pt));
    for (const r of matched) add("tipo", r.id);
    if (!matched.length && TYPE_WITH_OTHERS.has(listing)) add("tipo", "otros");
  }

  // Público (solo ropa): tallas infantiles, nombre o descripción de mujer, tallas de adulto.
  if (group === "ropa" && product) {
    const kids = product.sizes.some(isKidsSize) || KIDS.test(text);
    const woman = WOMAN.test(text);
    const adult = product.sizes.some((s) => isAdultSize(s) || /^unica$/i.test(s.trim()));
    if (woman) add("publico", "mujer");
    if (kids) add("publico", "infantil");
    if (adult && !woman) add("publico", "hombre-unisex");
  }

  // Colores.
  const families = new Set((product?.colors ?? []).flatMap((c) => colorFamilies(c, english)));
  for (const f of families) add("color", f);

  // Disponibilidad: stock del día y pedido mínimo (embalaje), solo con tarifa del día.
  const pricing = pricingFile(item.brand as Brand);
  if (pricing && product) {
    const model = item.key;
    const stock = Object.values(pricing.stock[model] ?? {});
    if (stock.some((n) => n > 0)) add("disponibilidad", "stock");
    const minimums = Object.values(pricing.pricing[model] ?? {}).map(([, p]) => (p < 0 ? null : pricing.packagings[p]?.minimum ?? null));
    // Variantes sin embalaje del día: se usa el de la ficha, como hace la ficha.
    const fallback = product.variants.map((v) => v.packaging?.minimum ?? null);
    const known = (minimums.length ? minimums : fallback).filter((m): m is number => typeof m === "number");
    if (known.length && Math.min(...known) <= 1) add("disponibilidad", "minimo-1");
  }
  const novelty = cats.has("novelty") || cats.has("novelty_roly");
  if (novelty) add("disponibilidad", "novedad");

  // Personalización con precio en la ficha (DTF / DTF UV) o bajo presupuesto.
  const personalization = data?.context?.personalization ?? "";
  const technique = personalization.match(/esta ficha: ([^.]+)\./)?.[1]?.trim().toUpperCase();
  add("marcaje", technique === "DTF UV" ? "dtf-uv" : technique === "DTF" ? "dtf" : "consultar");

  return { tokens, novelty };
}

function build(name: string): Built {
  const cached = builtCache.get(name);
  if (cached) return cached;
  const parsed = parseListing(name);
  if (!parsed) throw new Error(`Listado desconocido: ${name}`);
  const { group, slug } = parsed;
  const category = slug ? findCategory(group, slug) : undefined;
  const categoryId = category?.id ?? "";
  const groupData = getGroupData(group);
  const keys = groupData.lists[categoryId] ?? [];
  const cards: CardItem[] = keys.filter((k) => groupData.products[k]).map((key) => ({ key, ...groupData.products[key] }));

  const items: ListingItem[] = cards.map((card) => {
    const { tokens, novelty } = itemFacets(card, name, group, !slug);
    // Las palabras clave son del buscador: no hacen falta en el listado.
    const data: CardData = { key: card.key, brand: card.brand, code: card.code, name: card.name, description: card.description, image: card.image, fromPrice: card.fromPrice };
    return novelty ? { ...data, f: tokens, n: 1 } : { ...data, f: tokens };
  });

  const counts = new Map<string, number>();
  for (const item of items) for (const t of item.f) counts.set(t, (counts.get(t) ?? 0) + 1);
  const option = (facet: FacetId, id: string, label: string, swatch?: string) => ({
    id,
    label,
    count: counts.get(token(facet, id)) ?? 0,
    ...(swatch ? { swatch } : {}),
  });

  const total = items.length;
  const candidates: FacetDef[] = [];
  if (!slug) {
    candidates.push({
      id: "categoria",
      label: "Categoría",
      mode: "or",
      options: [
        ...shopCategories.filter((c) => c.group === group).map((c) => option("categoria", c.slug, c.name)),
        option("categoria", "otros", group === "ropa" ? "Otras prendas" : "Otros productos"),
      ],
    });
  }
  const rules = TYPE_RULES[name];
  if (rules) {
    candidates.push({
      id: "tipo",
      label: TYPE_LABELS[name] ?? "Tipo",
      mode: "or",
      options: [...rules.map((r) => option("tipo", r.id, r.label)), option("tipo", "otros", "Otros")],
    });
  }
  candidates.push({
    id: "publico",
    label: "Público",
    mode: "or",
    options: AUDIENCE.map((a) => option("publico", a.id, a.label)),
  });
  candidates.push({
    id: "marca",
    label: "Marca",
    mode: "or",
    options: Object.entries(BRAND_LABELS).map(([id, label]) => option("marca", id, label)),
  });
  candidates.push({
    id: "color",
    label: "Color",
    mode: "or",
    options: COLOR_FAMILIES.map((c) => option("color", c.id, c.label, c.swatch)),
  });
  candidates.push({
    id: "precio",
    label: "Precio desde",
    mode: "or",
    options: priceBuckets().map((b) => option("precio", b.id, b.label)),
  });
  // «Desde 1 unidad» solo si en el listado hay algún modelo con pedido mínimo mayor.
  const hasHigherMinimum = items.some((i) => PRICING_FILES[i.brand as Brand] && !i.f.includes(token("disponibilidad", "minimo-1")));
  candidates.push({
    id: "disponibilidad",
    label: "Disponibilidad",
    mode: "and",
    options: [
      option("disponibilidad", "stock", "Con stock ahora"),
      ...(hasHigherMinimum ? [option("disponibilidad", "minimo-1", "Pedido desde 1 unidad")] : []),
      option("disponibilidad", "novedad", "Novedad del proveedor"),
    ],
  });
  candidates.push({
    id: "marcaje",
    label: "Personalización",
    mode: "or",
    options: TECHNIQUES.map((t) => option("marcaje", t.id, t.label)),
  });

  // Solo opciones con productos; y solo facetas que de verdad separan productos.
  const facets = candidates
    .map((f) => ({ ...f, options: f.options.filter((o) => o.count > 0) }))
    .filter((f) =>
      f.mode === "and"
        ? f.options.some((o) => o.count < total)
        : f.options.length >= 2 || (f.options.length === 1 && f.options[0].count < total),
    )
    .map((f) => (f.mode === "and" ? { ...f, options: f.options.filter((o) => o.count < total) } : f));

  const sorts: SortId[] = ["recomendados", "precio-asc", "precio-desc"];
  if (items.some((i) => i.n)) sorts.push("novedades");
  sorts.push("nombre");

  const built: Built = { facets: { listing: name, total, facets, sorts }, data: { version: 1, items } };
  builtCache.set(name, built);
  return built;
}

/** Facetas y órdenes del listado (para las props del componente). */
export const getListingFacets = (group: ShopGroup, slug?: string) => build(listingName(group, slug)).facets;

/** Datos completos del listado (para /catalogo-datos/<listado>.json). */
export const getListingData = (name: string) => build(name).data;
