import type { Metadata } from "next";
import { BASE_PATH } from "@/components/sites/seritene/content";
import { REDIRECTS } from "@/components/sites/seritene/routes";
import { SiteLink } from "@/components/sites/seritene/SiteLink";

// /ropa-laboral/ duplicaba /ropa/laboral/ (mismo contenido, ambas con canonical propia).
// La exportación estática no puede responder 301: se publica como página de redirección
// (meta refresh + canonical al destino + noindex). En producción debe ser un 301.
const TARGET = REDIRECTS["/ropa-laboral/"];

export const metadata: Metadata = {
  title: "Ropa laboral personalizada en Tenerife",
  alternates: { canonical: TARGET },
  robots: { index: false, follow: true },
};

export default function Page() {
  return (
    <main id="contenido" className="brand-main">
      {/* React 19 lleva <meta> al <head>. */}
      <meta httpEquiv="refresh" content={`0; url=${BASE_PATH}${TARGET}`} />
      <section className="wrap page-intro">
        <p className="eyebrow">ESTA PÁGINA HA CAMBIADO DE DIRECCIÓN</p>
        <h1>Ropa laboral personalizada en Tenerife</h1>
        <p>
          Te llevamos a la nueva página. Si no se abre sola, entra en{" "}
          <SiteLink href={TARGET} style={{ textDecoration: "underline" }}>
            Ropa laboral personalizada
          </SiteLink>
          .
        </p>
      </section>
    </main>
  );
}
