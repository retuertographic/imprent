// Mismo orden que en la web original: hoja de la landing antes que las del catálogo.
import "../styles/seritene/fullprint.css";
import "../styles/seritene/custom-catalog.css";
import "../styles/seritene/print.css";
import "../styles/seritene/collections.css";
import { fullprintLanding } from "@/components/sites/seritene/fullprint/data";
import { Breadcrumbs, FullprintLanding, JsonLd, pageMetadata } from "@/components/sites/seritene/fullprint/FullprintPages";

export const metadata = pageMetadata(fullprintLanding.meta, "/fullprint/");

export default function FullprintPage() {
  return (
    <main id="contenido" className="brand-main print-main custom-catalog fullprint-catalog">
      <JsonLd data={fullprintLanding.jsonLd} />
      <Breadcrumbs trail={[["Inicio", "/"]]} current="Fullprint" />
      <FullprintLanding />
    </main>
  );
}
