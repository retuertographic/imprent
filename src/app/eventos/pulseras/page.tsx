import type { Metadata } from "next";
import "../../styles/seritene/events.css";
import "../../styles/seritene/product-catalog.css";
import { EventCollection } from "@/components/sites/seritene/eventos/EventPages";
import { eventCollections, eventJsonLd, eventMeta } from "@/components/sites/seritene/eventos/data.generated";

const ROUTE = "/eventos/pulseras/";

export const metadata: Metadata = { ...eventMeta[ROUTE], alternates: { canonical: ROUTE } };

export default function PulserasPage() {
  return <EventCollection data={eventCollections.pulseras} jsonLd={eventJsonLd[ROUTE]} />;
}
