import type { Metadata } from "next";

/** Metadatos con el mismo formato que producción (canónica, Open Graph y Twitter). */
export function pageMetadata(title: string, description: string, path: string, absoluteTitle = false): Metadata {
  const fullTitle = absoluteTitle ? title : `${title} | Seritene`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    robots: { index: true, follow: true },
    alternates: { canonical: path },
    openGraph: { title: fullTitle, description, url: path, siteName: "Seritene", type: "website", locale: "es_ES" },
    twitter: { card: "summary", title: fullTitle, description },
  };
}

/** Fichas de imprenta: «<Producto> en Tenerife | Imprenta Seritene». */
export const printMetadata = (product: { slug: string; metaTitle: string; description: string }) =>
  pageMetadata(
    `${product.metaTitle} | Imprenta Seritene`,
    `${product.description} Consulta opciones y precios para tu pedido en Tenerife y Canarias.`,
    `/imprenta/${product.slug}/`,
    true,
  );
