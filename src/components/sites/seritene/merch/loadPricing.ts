/**
 * Tarifas y stock del día (public/sites/seritene/shop-data/merch-pricing.json para Stamina y
 * roly-pricing.json para Roly, generados cada noche por scripts/refresh-merch-pricing.mjs en el
 * workflow de deploy). Sustituyen a las llamadas `/api/gor?action=pricing|stock` que hace producción,
 * que no admiten CORS. JHK no las hace en producción: sin tarifa del día ni stock.
 */
import { asset } from "../content";
import type { Brand, MerchPricingFile, Packaging, Tariff } from "./types";

export type ModelPricing = {
  /**
   * SKU → tarifa y embalaje del día (vacío si el modelo no tuvo respuesta: se usan los de la ficha).
   * `tariff: null` cuando la respuesta llegó sin tarifa: como en producción, sustituye a la de la ficha.
   */
  pricing: Record<string, { tariff: Tariff | null; packaging: Packaging | null }>;
  /** SKU → unidades (vacío si no hay stock disponible: «Consultar disponibilidad»). */
  stock: Record<string, number>;
};

const FILES: Partial<Record<Brand, string>> = {
  stamina: "/shop-data/merch-pricing.json",
  roly: "/shop-data/roly-pricing.json",
};

/** ¿Pide producción tarifa y stock al cargar la ficha? (JHK no). */
export const hasDailyPricing = (brand: Brand) => brand in FILES;

const files = new Map<string, Promise<MerchPricingFile>>();

function loadFile(path: string) {
  let promise = files.get(path);
  if (!promise) {
    promise = fetch(asset(path)).then((res) => {
      if (!res.ok) throw new Error("merch-pricing");
      return res.json() as Promise<MerchPricingFile>;
    });
    promise.catch(() => files.delete(path));
    files.set(path, promise);
  }
  return promise;
}

export async function loadModelPricing(model: string, brand: Brand = "stamina"): Promise<ModelPricing> {
  const path = FILES[brand];
  if (!path) return { pricing: {}, stock: {} };
  const file = await loadFile(path);
  const pricing: ModelPricing["pricing"] = {};
  for (const [sku, [t, p]] of Object.entries(file.pricing[model] ?? {})) {
    pricing[sku] = { tariff: t < 0 ? null : file.tariffs[t], packaging: p < 0 ? null : file.packagings[p] };
  }
  return { pricing, stock: file.stock[model] ?? {} };
}
