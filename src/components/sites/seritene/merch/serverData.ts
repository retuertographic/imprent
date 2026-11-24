/**
 * Fichas de producto de proveedor para el servidor (solo al generar el HTML estático).
 * Un JSON por modelo en ./data/<marca>/, generado por scripts/extract-merch-products.mjs.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import { getGroupData } from "../shop/serverData";
import { productDescription, productTitle } from "./productSeo";
import type { Brand, MerchPageData } from "./types";

const DATA_DIR = join(process.cwd(), "src/components/sites/seritene/merch/data");

/** Ids de las fichas de una marca, en el orden del listado de producción (modelo de 4 cifras; código en JHK). */
export function merchProductIds(brand: Brand = "stamina"): string[] {
  if (brand === "stamina") return getGroupData("merchandising").lists[""];
  const ropa = getGroupData("ropa");
  return ropa.lists[""]
    .map((key) => ropa.products[key])
    .filter((p) => p?.brand === brand)
    .map((p) => (brand === "jhk" ? p.code : (p.code.match(/\d{4}/)?.[0] ?? p.code)));
}

const ID_PATTERN: Record<Brand, RegExp> = { stamina: /^\d{4}$/, roly: /^\d{4}$/, jhk: /^[A-Z0-9]{3,20}$/ };

export function getMerchProduct(id: string, brand: Brand = "stamina"): MerchPageData | null {
  if (!ID_PATTERN[brand].test(id)) return null;
  try {
    return JSON.parse(readFileSync(join(DATA_DIR, brand, `${id}.json`), "utf8")) as MerchPageData;
  } catch {
    return null;
  }
}

/**
 * Metadatos de la ficha con el formato de producción; título («Camiseta personalizada Roly Assen · Tenerife»)
 * y descripción propios (`productSeo`).
 */
export function merchMetadata(data: MerchPageData): Metadata {
  const meta = { ...data.meta, title: productTitle(data), description: productDescription(data) };
  const path = `/producto/${data.brand}/${data.id}/`;
  const images = meta.ogImage ? [{ url: meta.ogImage, alt: meta.ogImageAlt }] : undefined;
  return {
    title: { absolute: meta.title },
    description: meta.description,
    robots: { index: meta.robots.includes("noindex") ? false : true, follow: true },
    alternates: { canonical: path },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: path,
      siteName: "Seritene",
      type: "website",
      locale: "es_ES",
      images,
    },
    twitter: { card: "summary_large_image", title: meta.title, description: meta.description, images: meta.ogImage ? [meta.ogImage] : undefined },
  };
}
