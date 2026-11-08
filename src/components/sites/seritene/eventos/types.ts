/** Tipos de las páginas de eventos y medallas. */
import type {
  BreadcrumbsData,
  EventsHeadingData,
  ImageData,
  PageMeta,
  SupportSectionData,
} from "../soportes/types";

export type { PageMeta };

export type ShopCardData = {
  href: string;
  photoClassName: string;
  image: ImageData;
  badge?: string;
  ref: string;
  heading: "h2" | "h3";
  name: string;
  description: string;
  small?: string;
  strong: string;
  action: string;
};

export type EventLandingData = {
  breadcrumbs: BreadcrumbsData;
  heading: EventsHeadingData;
  section: SupportSectionData;
};

export type EventCollectionData = {
  wrapClassName: string;
  breadcrumbs: BreadcrumbsData;
  heading: EventsHeadingData;
  products?: ShopCardData[];
  section?: SupportSectionData;
};

export type StaticProductData = {
  route: string;
  meta: PageMeta;
  jsonLd: string | null;
  breadcrumbs: BreadcrumbsData;
  gallery: { image: ImageData; caption: string }[];
  eyebrow: string;
  name: string;
  description: string;
  specs: string[];
  priceLead: string;
  priceDetail: string;
  table: { caption: string; head: string[]; rows: { label: string; cells: string[] }[] };
  priceNotes: string[];
  customization: string[];
  /** Props de OrderActions: solicitud por WhatsApp sin precio. */
  order: { name: string; message: string; image: string };
  footNote: string;
};
