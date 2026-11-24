/**
 * Productos relacionados y «Combínalo con» de las fichas de proveedor (solo servidor, al generar el HTML).
 *
 * Determinista: el orden depende solo de los datos (tipo de producto, categorías de la tienda y del
 * proveedor) y de un hash estable de los dos ids, que reparte los enlaces entre todo el catálogo en vez de
 * apuntar siempre a los primeros de cada categoría. Mismos datos → mismas tarjetas en cada build.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { shopCategories } from "../shop/catalog";
import { getGroupData } from "../shop/serverData";
import type { CardItem, ShopGroup } from "../shop/types";
import { merchProductIds } from "./serverData";
import { productKind } from "./productSeo";
import type { Brand, MerchPageData } from "./types";

const DATA_DIR = join(process.cwd(), "src/components/sites/seritene/merch/data");
const BRANDS: Brand[] = ["stamina", "roly", "jhk"];

/** Categorías del proveedor demasiado generales para relacionar productos. */
const BROAD = new Set(["", "stamina", "roly", "jhk", "other_products", "marketing", "novelty", "christmas", "summer", "winter", "sublimation", "outlet"]);

type Entry = {
  uid: string;
  brand: Brand;
  id: string;
  group: ShopGroup;
  kind: string;
  shop: string[];
  supplier: Set<string>;
  card: CardItem;
};

const groupOf = (brand: Brand): ShopGroup => (brand === "stamina" ? "merchandising" : "ropa");

let index: { entries: Entry[]; byUid: Map<string, Entry>; byShop: Map<string, Entry[]> } | null = null;

function buildIndex() {
  if (index) return index;
  const entries: Entry[] = [];
  for (const brand of BRANDS) {
    const group = groupOf(brand);
    const data = getGroupData(group);
    const membership = new Map<string, string[]>();
    for (const cat of shopCategories.filter((c) => c.group === group)) {
      for (const key of data.lists[cat.id] ?? []) membership.set(key, [...(membership.get(key) ?? []), cat.id]);
    }
    for (const id of merchProductIds(brand)) {
      const product = data.products[id];
      if (!product) continue;
      let page: MerchPageData;
      try {
        page = JSON.parse(readFileSync(join(DATA_DIR, brand, `${id}.json`), "utf8")) as MerchPageData;
      } catch {
        continue;
      }
      entries.push({
        uid: `${brand}/${id}`,
        brand,
        id,
        group,
        kind: productKind(page).key,
        shop: membership.get(id) ?? [],
        supplier: new Set(page.product.categories.filter((c) => !BROAD.has(c))),
        // Sin `keywords` (solo las usa el buscador): la tarjeta viaja en la carga RSC de cada ficha.
        card: { key: id, ...product, keywords: "" },
      });
    }
  }
  const byShop = new Map<string, Entry[]>();
  for (const e of entries) for (const cat of e.shop) byShop.set(cat, [...(byShop.get(cat) ?? []), e]);
  index = { entries, byUid: new Map(entries.map((e) => [e.uid, e])), byShop };
  return index;
}

/** FNV-1a de 32 bits: orden estable entre builds y plataformas. */
function hash(text: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Tipo de producto → categoría de la tienda, para las fichas que no están en ningún listado de categoría. */
const KIND_CATEGORY: Record<string, string> = {
  camiseta: "t_shirts", sudadera: "sud_cha", polo: "pol_s", pantalón: "pant_c", bermuda: "pant_c",
  chaqueta: "coats", parka: "coats", chaleco: "coats", cortavientos: "coats", chubasquero: "coats",
  mochila: "bags_travel_backpack", bolsa: "bags", neceser: "bags", bolso: "bags", riñonera: "bags",
  gorra: "travel_caps", gorro: "travel_caps", sombrero: "travel_caps", visera: "travel_caps",
  taza: "mugs", vaso: "mugs", jarra: "mugs", bidón: "bottles", botella: "bottles", termo: "bottles",
  libreta: "notebooks", bloc: "notebooks", agenda: "notebooks", cuaderno: "notebooks",
  bolígrafo: "ball_pens", lápiz: "ball_pens", lapicero: "ball_pens", llavero: "keyrings", lanyard: "keyrings",
  altavoz: "technology", batería: "technology", cargador: "technology", cable: "technology",
  auricular: "technology", memoria: "technology", puerto: "technology",
};

/** Categoría → categorías complementarias («Combínalo con»), en orden de preferencia. */
const COMPLEMENTS: Record<string, string[]> = {
  t_shirts: ["sud_cha", "travel_caps", "bags"],
  sud_cha: ["t_shirts", "travel_caps", "bags_travel_backpack"],
  pol_s: ["pant_c", "coats", "travel_caps"],
  pant_c: ["pol_s", "t_shirts", "coats"],
  coats: ["sud_cha", "pant_c", "travel_caps"],
  sports: ["bottles", "bags_travel_backpack", "travel_caps"],
  workwear: ["pant_c", "pol_s", "coats"],
  bags: ["t_shirts", "bottles", "notebooks"],
  travel_caps: ["t_shirts", "sud_cha", "bags"],
  mugs: ["notebooks", "ball_pens", "bottles"],
  bottles: ["bags_travel_backpack", "bags", "mugs"],
  notebooks: ["ball_pens", "mugs", "bags"],
  ball_pens: ["notebooks", "keyrings", "mugs"],
  keyrings: ["ball_pens", "bags", "notebooks"],
  bags_travel_backpack: ["bottles", "travel_caps", "technology"],
  technology: ["notebooks", "ball_pens", "bags_travel_backpack"],
};

const COMBINE_COUNTS = [2, 1, 1];
export const RELATED_COUNT = 4;

/** Tarjeta completa (foto y precio) primero: a igualdad de relevancia, se prefiere. */
const completeness = (e: Entry) => (e.card.image ? 0 : 2) + (e.card.fromPrice === null ? 1 : 0);

function relatedFor(self: Entry, entries: Entry[]): Entry[] {
  const scored: { e: Entry; score: number; tie: number }[] = [];
  for (const e of entries) {
    if (e.uid === self.uid || e.group !== self.group) continue;
    const sameKind = e.kind === self.kind && !["artículo", "prenda"].includes(e.kind);
    const sharedShop = e.shop.some((c) => self.shop.includes(c));
    let sharedSupplier = 0;
    for (const c of e.supplier) if (self.supplier.has(c)) sharedSupplier++;
    const score = (sameKind ? 4 : 0) + (sharedShop ? 2 : 0) + Math.min(2, sharedSupplier);
    if (score < 2) continue;
    scored.push({ e, score: score * 4 - completeness(e), tie: hash(`${self.uid}>${e.uid}`) });
  }
  scored.sort((a, b) => b.score - a.score || a.tie - b.tie);
  return scored.slice(0, RELATED_COUNT).map((x) => x.e);
}

function primaryCategory(self: Entry) {
  const ordered = shopCategories.map((c) => c.id).filter((id) => self.shop.includes(id));
  return ordered[0] ?? KIND_CATEGORY[self.kind];
}

function combineFor(self: Entry, exclude: Set<string>, byShop: Map<string, Entry[]>): Entry[] {
  const category = primaryCategory(self);
  const targets = category ? COMPLEMENTS[category] : undefined;
  if (!targets) return [];
  const picked: Entry[] = [];
  const taken = new Set([...exclude, self.uid]);
  let carry = 0;
  targets.forEach((cat, i) => {
    const want = COMBINE_COUNTS[i] + carry;
    const pool = (byShop.get(cat) ?? [])
      .filter((e) => !taken.has(e.uid))
      .map((e) => ({ e, rank: completeness(e), tie: hash(`${self.uid}+${cat}>${e.uid}`) }))
      .sort((a, b) => a.rank - b.rank || a.tie - b.tie)
      .slice(0, want)
      .map((x) => x.e);
    pool.forEach((e) => taken.add(e.uid));
    picked.push(...pool);
    carry = want - pool.length;
  });
  return picked;
}

/** Relacionados (mismo tipo o categoría) y complementarios de una ficha. Vacíos si no hay suficientes. */
export function relatedProducts(brand: Brand, id: string): { related: CardItem[]; combine: CardItem[] } {
  const { entries, byUid, byShop } = buildIndex();
  const self = byUid.get(`${brand}/${id}`);
  if (!self) return { related: [], combine: [] };
  const related = relatedFor(self, entries);
  const combine = combineFor(self, new Set(related.map((e) => e.uid)), byShop);
  return {
    related: related.length >= 2 ? related.map((e) => e.card) : [],
    combine: combine.length >= 2 ? combine.map((e) => e.card) : [],
  };
}
