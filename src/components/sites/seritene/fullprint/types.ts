/** Tipos de los datos de Fullprint (ver `data.ts`, generado por scripts/extract-fullprint.mjs). */

export type PageMeta = { title: string; description: string };

/** Tramo de precio por cantidad; importes en céntimos. `max: null` = «o más». */
export type PriceTier = { min: number; max: number | null; unit: number };

export type Variant = { id: string; label: string; tiers: PriceTier[]; child?: boolean };

export type Fabric = {
  id: string;
  label: string;
  recommendedFor: string;
  weight: number;
  composition: string;
  unit: number;
};

export type Extra = { id: string; label: string; unit: number };

/** Enganche (llaveros). `unit: null` = precio a confirmar. */
export type Attachment = { id: string; label: string; unit: number | null };

export type Photo = {
  id: string;
  src: string;
  small: string;
  label: string;
  alt: string;
  width?: number;
  height?: number;
};

/** Ejemplo ficticio «de blanco a fullprint» que anima cada ficha. */
export type FullprintExample = {
  name: string;
  /** Uso del diseño ficticio, en minúsculas (p. ej. «equipo de running»). */
  use: string;
  accent: string;
  secondary: string;
  ink: string;
  shape: "standard" | "waist" | "wide" | "narrow" | "keychains";
  image: string;
};

export type FullprintModel = {
  slug: string;
  name: string;
  collection: string;
  line: string;
  description: string;
  specs: string[];
  art: { src: string; width: number; height: number; crop: number[] };
  photos?: Photo[];
  cuts?: boolean;
  fabrics?: Fabric[];
  extras?: Extra[];
  attachments?: Attachment[];
  note?: string;
  variantLabel?: string;
  variants: Variant[];
  example: FullprintExample;
  /** Imagen que se guarda en el carrito (ruta de seritene.com). */
  cartImage: string;
  meta: PageMeta;
  jsonLd: unknown;
};

export type CollectionRow = { slug: string; title: string; subtitle: string; from: string };

export type FullprintCollection = {
  slug: string;
  name: string;
  /** Portada: fondo, tinta, palabra e imagen. */
  bg: string;
  ink: string;
  word: string;
  image: string;
  summary: string;
  count: number;
  line: string;
  rows: CollectionRow[];
  meta: PageMeta;
  jsonLd: unknown;
};
