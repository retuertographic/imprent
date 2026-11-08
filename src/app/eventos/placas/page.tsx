import type { Metadata } from "next";
import "../../styles/seritene/events.css";
import "../../styles/seritene/shop.css";
import "../../styles/seritene/static-product.css";
import { EventCollection } from "@/components/sites/seritene/eventos/EventPages";
import { eventCollections, eventJsonLd, eventMeta } from "@/components/sites/seritene/eventos/data.generated";

const ROUTE = "/eventos/placas/";

export const metadata: Metadata = { ...eventMeta[ROUTE], alternates: { canonical: ROUTE } };

export default function PlacasPage() {
  return <EventCollection data={eventCollections.placas} jsonLd={eventJsonLd[ROUTE]} />;
}
