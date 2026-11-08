/** Tipos de las páginas de soportes publicitarios (y piezas compartidas con eventos). */
import type { CSSProperties } from "react";

export type PageMeta = { title: string; description: string };

/** Atributos de imagen tal como los sirve seritene.com (rutas relativas a /public/sites/seritene o URL absolutas). */
export type ImageData = {
  className?: string;
  src: string;
  srcSet?: string;
  sizes?: string;
  alt: string;
  width?: number;
  height?: number;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
  decoding?: "async" | "sync" | "auto";
  style?: CSSProperties;
};

export type BreadcrumbItem = { label: string; href?: string; current?: boolean };
export type BreadcrumbsData = { className: string; items: BreadcrumbItem[] };

export type SupportCardData = {
  href: string;
  id?: string;
  /** La imagen va envuelta en .support-collection-image (tarjetas de colección). */
  collectionImage: boolean;
  image: ImageData;
  category?: string;
  name: string;
  detail: string;
  description?: string;
  price?: { strong: string; small: string };
  action: string;
};

export type SupportSectionData = {
  className: string;
  id?: string;
  label: string;
  title: string;
  count: string;
  gridClassName: string;
  cards: SupportCardData[];
  note?: string;
};

export type EventsHeadingData = { eyebrow: string; title: string; em?: string; intro: string };

export type SupportLandingData = {
  heading: EventsHeadingData;
  section: SupportSectionData;
  help: { title: string; text: string; href: string; action: string };
};

export type SupportCollectionData = {
  breadcrumbs: BreadcrumbsData;
  back: { href: string; label: string };
  title: string;
  em: string;
  intro: string;
  section: SupportSectionData;
};

/* ---------- Productos con configurador (props del componente cliente en producción) ---------- */

export type FlagTier = { min: number; complete: number; fabric: number };
export type FlagSize = {
  id: string;
  width: number;
  height: number;
  /** Altura aproximada con soporte, en cm. */
  mounted: number;
  /** Precios en céntimos para 1 unidad. */
  complete: number;
  fabric: number;
  tiers?: FlagTier[];
};
export type FlagProduct = {
  slug: string;
  name: string;
  line: string;
  art: { src: string; width: number; height: number; crop: number[] };
  sizes: FlagSize[];
};

export type RollupProduct = { slug: string; name: string; width: number; height: number; prices: number[] };

export type PhotocallProduct = {
  slug: string;
  name: string;
  size: string;
  modules: string;
  width: number;
  height: number;
  /** Céntimos por unidad; null = presupuesto personalizado. */
  unit: number | null;
};

export type TentProduct = { slug: string; name: string; size: string; image: string; unit: number };

type ModelBase = { breadcrumbs: BreadcrumbsData };

export type SupportModelData = ModelBase &
  (
    | { configurator: "FlagConfigurator"; product: FlagProduct }
    | { configurator: "RollupConfigurator"; product: RollupProduct }
    | { configurator: "PhotocallConfigurator"; product: PhotocallProduct }
    | { configurator: "TentConfigurator"; product: TentProduct }
    | { configurator: "FoamConfigurator" | "MagnetConfigurator" | "BannerConfigurator" | "PosterConfigurator"; product: null }
  );
