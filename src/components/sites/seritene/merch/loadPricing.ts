/**
 * Tarifas y stock del día (public/sites/seritene/shop-data/merch-pricing.json, generado cada noche por
 * scripts/refresh-merch-pricing.mjs en el workflow de deploy). Sustituye a las llamadas
 * `/api/gor?action=pricing|stock` que hace producción, que no admiten CORS.
 */
import { asset } from "../content";
import type { MerchPricingFile, Packaging, Tariff } from "./types";

export type ModelPricing = {
  /** SKU → tarifa y embalaje del día (vacío si el modelo no tuvo respuesta: se usan los de la ficha). */
  pricing: Record<string, { tariff: Tariff; packaging: Packaging | null }>;
  /** SKU → unidades (vacío si no hay stock disponible: «Consultar disponibilidad»). */
  stock: Record<string, number>;
};

let filePromise: Promise<MerchPricingFile> | null = null;

function loadFile() {
  if (!filePromise) {
    filePromise = fetch(asset("/shop-data/merch-pricing.json")).then((res) => {
      if (!res.ok) throw new Error("merch-pricing");
      return res.json() as Promise<MerchPricingFile>;
    });
    filePromise.catch(() => {
      filePromise = null;
    });
  }
  return filePromise;
}

export async function loadModelPricing(model: string): Promise<ModelPricing> {
  const file = await loadFile();
  const pricing: ModelPricing["pricing"] = {};
  for (const [sku, [t, p]] of Object.entries(file.pricing[model] ?? {})) {
    pricing[sku] = { tariff: file.tariffs[t], packaging: p < 0 ? null : file.packagings[p] };
  }
  return { pricing, stock: file.stock[model] ?? {} };
}
