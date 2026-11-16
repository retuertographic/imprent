/**
 * Fichas de producto de proveedor: merchandising (Stamina) y ropa (Roly, JHK). Mismo formato que las
 * props de `ShopProduct` en seritene.com; los datos los genera scripts/extract-merch-products.mjs y las
 * tarifas/stock del día scripts/refresh-merch-pricing.mjs.
 */

/** Marca del proveedor (segmento de la URL /producto/<marca>/<id>/). */
export type Brand = "stamina" | "roly" | "jhk";

/** Tarifa del proveedor (versión 2), tal como la devuelve `/api/gor?action=pricing`. */
export type Tariff = {
  version: number;
  basis?: string;
  rangeMinimums?: number[] | null;
  rangeGroup?: string | null;
  unit: number | null;
  pack: number | null;
  box: number | null;
  ranges: number[];
  limits?: number[] | null;
};

export type Packaging = {
  minimum: number | null;
  multiple: number | null;
  pack: number | null;
  box: number | null;
};

export type MerchVariant = {
  sku: string;
  color: string;
  size: string;
  image: string;
  colorCode?: string;
  sizeCode?: string;
  /** Ausente si producción no tenía la tarifa en caché: llega con merch-pricing.json. */
  packaging?: Packaging | null;
  price: number | null;
  stock: number | null;
  tariff?: Tariff | null;
};

export type MerchProduct = {
  code: string;
  name: string;
  description: string;
  composition: string;
  image: string;
  colors: string[];
  sizes: string[];
  categories: string[];
  fromPrice: number | null;
  stock: number | null;
  variants: MerchVariant[];
  pricingCheckedAt?: string;
};

/** Contexto de la ficha (categoría, guía de compra y enlaces), tal como lo envía producción. */
export type ProductContext = {
  category?: { name: string; path: string };
  buyingGuide?: string;
  personalization: string;
  local: string;
  links: { name: string; path: string }[];
};

/** Ficha completa: un JSON por modelo en merch/data/<marca>/<id>.json. */
export type MerchPageData = {
  /** Modelo de 4 cifras (Stamina, Roly) o código (JHK). */
  id: string;
  brand: Brand;
  meta: { title: string; description: string; robots: string; ogImage: string; ogImageAlt: string };
  jsonLd: unknown;
  warehouse: string;
  priceNotice: string;
  context?: ProductContext;
  product: MerchProduct;
};

/**
 * merch-pricing.json (Stamina) y roly-pricing.json: tarifas y stock del día para todos los modelos.
 * `tariffs` y `packagings` se guardan una sola vez y las variantes los referencian por índice.
 */
export type MerchPricingFile = {
  version: 1;
  fetchedAt: string;
  source?: string;
  /** Modelos que fallaron en el último refresco y conservan los datos anteriores. */
  stale?: string[];
  tariffs: Tariff[];
  packagings: Packaging[];
  /**
   * Modelo (4 cifras) → SKU → [índice de tarifa, índice de embalaje] (−1 = sin tarifa o sin embalaje:
   * producción la sustituye igualmente y el precio queda «A confirmar»). Solo modelos con respuesta válida.
   */
  pricing: Record<string, Record<string, [number, number]>>;
  /** Modelo → SKU → unidades. Solo modelos con stock disponible (`available: true`). */
  stock: Record<string, Record<string, number>>;
};
