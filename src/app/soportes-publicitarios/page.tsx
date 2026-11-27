import type { Metadata } from "next";
import "../styles/seritene/custom-catalog.css";
import "../styles/seritene/events.css";
import "../styles/seritene/print.css";
import "../styles/seritene/product-catalog.css";
import { SiteLink } from "@/components/sites/seritene/SiteLink";
import { supportJsonLd, supportLanding, supportMeta } from "@/components/sites/seritene/soportes/data.generated";
import { JsonLd, SupportProducts } from "@/components/sites/seritene/soportes/shared";
import { WorkShowcase } from "@/components/sites/seritene/WorkShowcase";
import type { SupportCardData } from "@/components/sites/seritene/soportes/types";

const ROUTE = "/soportes-publicitarios/";

export const metadata: Metadata = {
  ...supportMeta[ROUTE],
  alternates: { canonical: ROUTE },
};

// Las fotos de colección son PNG de 1254 px y ~2 MB (como en producción). Se sirven sus versiones WebP
// (1254 y 640 px, generadas con sharp desde los PNG) con srcSet. Siguen diferidas (lazy): el LCP de la
// página es el titular y precargarlas lo retrasa.
const COLLECTION_PNG = /^\/catalogue\/(coleccion-[a-z-]+)\.png$/;
const optimizeCard = (card: SupportCardData): SupportCardData => {
  const match = COLLECTION_PNG.exec(card.image.src);
  if (!match) return card;
  const base = `/catalogue/${match[1]}`;
  return {
    ...card,
    image: {
      ...card.image,
      src: `${base}.webp`,
      srcSet: `${base}-640.webp 640w, ${base}.webp 1254w`,
      sizes: "(max-width: 1000px) 46vw, 320px",
      width: 1254,
      height: 1254,
      loading: "lazy",
      decoding: "async",
    },
  };
};

export default function SoportesPage() {
  const { heading, section: rawSection, help } = supportLanding;
  const section = { ...rawSection, cards: rawSection.cards.map(optimizeCard) };
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
          {/* H1 descriptivo con la palabra clave; el lema conserva el aspecto del antiguo H1. */}
          <h1 className="eyebrow kw-kicker">Soportes publicitarios en Tenerife</h1>
          <p className="kw-slogan">
            {heading.title}
            <br />
            <em>{heading.em}</em>
          </p>
          <p>{heading.intro}</p>
        </header>
      </div>
      <SupportProducts section={section} />
      <WorkShowcase category="soportes" title="Soportes que ya están en la calle." />
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
