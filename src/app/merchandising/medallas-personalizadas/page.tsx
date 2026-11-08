import type { Metadata } from "next";
import "../../styles/seritene/medallas.css";
import "../../styles/seritene/shop.css";
import "../../styles/seritene/static-product.css";
import { EventCollection } from "@/components/sites/seritene/eventos/EventPages";
import { eventJsonLd, eventMeta, medalCollection } from "@/components/sites/seritene/eventos/data.generated";

const ROUTE = "/merchandising/medallas-personalizadas/";

export const metadata: Metadata = { ...eventMeta[ROUTE], alternates: { canonical: ROUTE } };

export default function MedallasPage() {
  return <EventCollection data={medalCollection} jsonLd={eventJsonLd[ROUTE]} />;
}
