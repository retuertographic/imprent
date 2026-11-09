/**
 * Fichas de merchandising para el servidor (solo al generar el HTML estático).
 * Un JSON por modelo en ./data/, generado por scripts/extract-merch-products.mjs.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import { getGroupData } from "../shop/serverData";
import type { MerchPageData } from "./types";

const DATA_DIR = join(process.cwd(), "src/components/sites/seritene/merch/data");

/** Modelos de 4 cifras de las 1.584 fichas Stamina, en el orden del listado de producción. */
export const merchProductIds = () => getGroupData("merchandising").lists[""];

export function getMerchProduct(id: string): MerchPageData | null {
  if (!/^\d{4}$/.test(id)) return null;
  try {
    return JSON.parse(readFileSync(join(DATA_DIR, `${id}.json`), "utf8")) as MerchPageData;
  } catch {
    return null;
  }
}

/** Metadatos de la ficha con el mismo formato que producción. */
export function merchMetadata(data: MerchPageData): Metadata {
  const { meta } = data;
  const path = `/producto/stamina/${data.id}/`;
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
