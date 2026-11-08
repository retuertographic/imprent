/**
 * Utilidades del catálogo compartidas por servidor y cliente.
 * Los datos completos viven en public/sites/seritene/shop-data/*.json: el servidor los importa
 * para pintar la primera página y el cliente los descarga solo al paginar o buscar.
 */
import { asset } from "../content";
import type { CardItem, GroupData, ShopGroup, SitePage } from "./types";

export const PER_PAGE = 50;

export type ShopCategory = { group: ShopGroup; slug: string; name: string; id: string };

/** Igual que shop-categories en producción. */
export const shopCategories: ShopCategory[] = [
  { group: "ropa", slug: "camisetas", name: "Camisetas", id: "t_shirts" },
  { group: "ropa", slug: "sudaderas", name: "Sudaderas", id: "sud_cha" },
  { group: "ropa", slug: "polos", name: "Polos", id: "pol_s" },
  { group: "ropa", slug: "pantalones", name: "Pantalones", id: "pant_c" },
  { group: "ropa", slug: "abrigos", name: "Abrigos y chaquetas", id: "coats" },
  { group: "ropa", slug: "deporte", name: "Ropa deportiva", id: "sports" },
  { group: "ropa", slug: "laboral", name: "Ropa laboral", id: "workwear" },
  { group: "merchandising", slug: "bolsas", name: "Bolsas", id: "bags" },
  { group: "merchandising", slug: "gorras", name: "Gorras", id: "travel_caps" },
  { group: "merchandising", slug: "tazas", name: "Tazas", id: "mugs" },
  { group: "merchandising", slug: "botellas", name: "Botellas", id: "bottles" },
  { group: "merchandising", slug: "libretas", name: "Libretas", id: "notebooks" },
  { group: "merchandising", slug: "boligrafos", name: "Bolígrafos", id: "ball_pens" },
  { group: "merchandising", slug: "llaveros", name: "Llaveros", id: "keyrings" },
  { group: "merchandising", slug: "mochilas", name: "Mochilas", id: "bags_travel_backpack" },
  { group: "merchandising", slug: "tecnologia", name: "Tecnología", id: "technology" },
];

export const findCategory = (group: ShopGroup, slug: string) =>
  shopCategories.find((c) => c.group === group && c.slug === slug);

export const groupBrand = (group: ShopGroup) => (group === "ropa" ? "roly" : "stamina");

/** Ficha de producto en producción (no clonada). */
export const productPath = (brand: string, code: string) =>
  `/producto/${brand}/${brand === "jhk" ? code : code.match(/\d{4}/)?.[0] || code}/`;

/** Las imágenes propias de seritene.com están copiadas en public; las del proveedor se enlazan tal cual. */
export const productImage = (src: string) => (src.startsWith("/") ? asset(src) : src);

const euro = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
export const formatCents = (cents: number) => euro.format(cents / 100);

/** Productos de una página del listado, en el orden de producción. */
export function pageItems(data: GroupData, categoryId: string, page: number): CardItem[] {
  const models = data.lists[categoryId] ?? [];
  return models
    .slice(page * PER_PAGE, (page + 1) * PER_PAGE)
    .filter((key) => data.products[key])
    .map((key) => ({ key, ...data.products[key] }));
}

export const shopDataUrl = (file: ShopGroup | "pages") => asset(`/shop-data/${file}.json`);

const cache = new Map<string, Promise<unknown>>();
function loadJson<T>(url: string): Promise<T> {
  let promise = cache.get(url);
  if (!promise) {
    promise = fetch(url).then((res) => {
      if (!res.ok) throw new Error("No hemos podido cargar los productos.");
      return res.json();
    });
    promise.catch(() => cache.delete(url));
    cache.set(url, promise);
  }
  return promise as Promise<T>;
}

export const loadGroup = (group: ShopGroup) => loadJson<GroupData>(shopDataUrl(group));
export const loadPages = () => loadJson<SitePage[]>(shopDataUrl("pages"));
