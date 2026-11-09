import type { Metadata } from "next";
import "../styles/seritene/events.css";
import "../styles/seritene/product-catalog.css";
import { EventsHeading } from "@/components/sites/seritene/eventos/EventPages";
import { eventJsonLd, eventLanding, eventMeta } from "@/components/sites/seritene/eventos/data.generated";
import { Breadcrumbs, JsonLd, SupportProducts } from "@/components/sites/seritene/soportes/shared";

const ROUTE = "/eventos/";

export const metadata: Metadata = { ...eventMeta[ROUTE], alternates: { canonical: ROUTE } };

export default function EventosPage() {
  return (
    <main id="contenido" className="brand-main support-shop events-collection-page">
      <JsonLd json={eventJsonLd[ROUTE]} />
      <div className="wrap events-page">
        <Breadcrumbs data={eventLanding.breadcrumbs} />
        <EventsHeading heading={eventLanding.heading} />
        <SupportProducts section={eventLanding.section} />
      </div>
    </main>
  );
}
