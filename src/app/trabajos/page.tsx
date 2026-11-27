import { MessageCircle, Plus } from "lucide-react";
import { GoogleReviews } from "@/components/sites/seritene/GoogleReviews";
import { Breadcrumbs, PageIntro } from "@/components/sites/seritene/pages/common";
import { pageMetadata } from "@/components/sites/seritene/pages/meta";
import { ORIGIN, whatsappLinks } from "@/components/sites/seritene/content";
import { SiteLink } from "@/components/sites/seritene/SiteLink";
import { WorkGallery } from "@/components/sites/seritene/WorkGallery";

const PATH = "/trabajos/";

export const metadata = pageMetadata(
  PATH,
  "Trabajos reales: textil, fullprint, trofeos y soportes",
  "Fotos de trabajos reales hechos en el taller de Seritene en La Orotava: camisetas fullprint, sudaderas, llaveros, lanyards, trofeos, roll-ups y banderas. Filtra por categoría.",
);

const jsonLd = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: `${ORIGIN}/` },
        { "@type": "ListItem", position: 2, name: "Trabajos reales", item: `${ORIGIN}${PATH}` },
      ],
    },
    {
      "@type": "CollectionPage",
      "@id": `${ORIGIN}${PATH}#gallery`,
      name: "Trabajos reales de Seritene",
      url: `${ORIGIN}${PATH}`,
      inLanguage: "es",
      isPartOf: { "@id": `${ORIGIN}/#website` },
      about: { "@id": `${ORIGIN}/#organization` },
    },
  ],
}).replace(/</g, "\\u003c");

export default function Page() {
  return (
    <main id="contenido" className="brand-main work-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <Breadcrumbs items={[{ label: "Trabajos reales" }]} />
      <PageIntro
        h1="Trabajos reales de Seritene"
        title={
          <>
            Del taller.
            <br />
            <em>A la calle.</em>
          </>
        }
      >
        Fotos de pedidos hechos en nuestro taller de La Orotava para empresas, clubes, comercios y eventos de Tenerife.
        Filtra por categoría y amplía cada foto para ver los detalles.
      </PageIntro>
      <section className="wrap work-page-gallery" aria-label="Galería de trabajos">
        <WorkGallery filterable />
      </section>
      <GoogleReviews />
      <section className="wrap work-page-cta">
        <div>
          <p className="eyebrow">¿TIENES ALGO PARECIDO EN MENTE?</p>
          <h2>Cuéntanos tu idea.</h2>
          <p>Te asesoramos sobre la prenda, el soporte y la técnica, y te preparamos un presupuesto.</p>
        </div>
        <div className="work-page-cta-actions">
          <a className="brand-button" href={whatsappLinks.idea} target="_blank" rel="noopener noreferrer">
            Escríbenos por WhatsApp <MessageCircle size={18} />
          </a>
          <SiteLink className="text-cta" href="/contacto/">
            Pedir asesoramiento <Plus size={16} />
          </SiteLink>
        </div>
      </section>
    </main>
  );
}
