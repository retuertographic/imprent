import type { Metadata } from "next";
import "../../styles/seritene/events.css";
import "../../styles/seritene/product-catalog.css";
import "../../styles/seritene/static-product.css";
import "../../styles/seritene/shop.css";
import { EventCollection } from "@/components/sites/seritene/eventos/EventPages";
import { eventCollections, eventJsonLd, eventMeta } from "@/components/sites/seritene/eventos/data.generated";

const ROUTE = "/eventos/abanicos/";

export const metadata: Metadata = { ...eventMeta[ROUTE], alternates: { canonical: ROUTE } };

export default function AbanicosPage() {
  return <EventCollection data={eventCollections.abanicos} jsonLd={eventJsonLd[ROUTE]} />;
}
