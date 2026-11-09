/**
 * Fichas de merchandising (Stamina). Mismo formato que las props de `ShopProduct` en seritene.com;
 * los datos los genera scripts/extract-merch-products.mjs y las tarifas/stock del día
 * scripts/refresh-merch-pricing.mjs.
 */

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

/** Ficha completa: un JSON por modelo en public/sites/seritene/shop-data/merch-products/. */
export type MerchPageData = {
  id: string;
  meta: { title: string; description: string; robots: string; ogImage: string; ogImageAlt: string };
  jsonLd: unknown;
  warehouse: string;
  priceNotice: string;
  product: MerchProduct;
};

/**
 * merch-pricing.json: tarifas y stock del día para todos los modelos.
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
  /** Modelo (4 cifras) → SKU → [índice de tarifa, índice de embalaje]. Solo modelos con respuesta válida. */
  pricing: Record<string, Record<string, [number, number]>>;
  /** Modelo → SKU → unidades. Solo modelos con stock disponible (`available: true`). */
  stock: Record<string, Record<string, number>>;
};
