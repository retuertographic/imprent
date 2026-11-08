import type { Metadata } from "next";
import "../styles/seritene/custom-catalog.css";
import "../styles/seritene/events.css";
import "../styles/seritene/print.css";
import "../styles/seritene/product-catalog.css";
import { SiteLink } from "@/components/sites/seritene/SiteLink";
import { supportJsonLd, supportLanding, supportMeta } from "@/components/sites/seritene/soportes/data.generated";
import { JsonLd, SupportProducts } from "@/components/sites/seritene/soportes/shared";

const ROUTE = "/soportes-publicitarios/";

export const metadata: Metadata = {
  ...supportMeta[ROUTE],
  alternates: { canonical: ROUTE },
};

export default function SoportesPage() {
  const { heading, section, help } = supportLanding;
  return (
    <main id="contenido" className="brand-main print-main custom-catalog support-shop">
      <JsonLd json={supportJsonLd[ROUTE]} />
      <div className="wrap">
        <nav className="breadcrumbs" aria-label="Ruta de navegación">
          <SiteLink href="/">Inicio</SiteLink>
          <span>/</span>
          <span aria-current="page">Soportes publicitarios</span>
        </nav>
        <header className="events-heading">
          <p className="eyebrow">{heading.eyebrow}</p>
          <h1>
            {heading.title}
            <br />
            <em>{heading.em}</em>
          </h1>
          <p>{heading.intro}</p>
        </header>
      </div>
      <SupportProducts section={section} />
      <section className="wrap support-shop-help" id="ayuda-soportes">
        <div>
          <h2>{help.title}</h2>
          <p>{help.text}</p>
        </div>
        <SiteLink className="brand-button" href={help.href}>
          {help.action} <span aria-hidden="true">↗</span>
        </SiteLink>
      </section>
    </main>
  );
}
