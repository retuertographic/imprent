import type { Metadata } from "next";

/**
 * Metadatos de una página interior. `title` es la parte previa a « | Seritene» (la plantilla del
 * layout la añade); con `absolute` se usa el título completo tal cual (p. ej. «… | Seritene Tenerife»).
 */
export function pageMetadata(path: string, title: string, description: string, absolute = false): Metadata {
  const fullTitle = absolute ? title : `${title} | Seritene`;
  return {
    title: absolute ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: { title: fullTitle, description, url: path, type: "website", locale: "es_ES" },
  };
}
