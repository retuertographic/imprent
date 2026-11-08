import "../styles/seritene/dtf.css";
import { DtfPage } from "@/components/sites/seritene/pages/DtfPage";
import { pageMetadata } from "@/components/sites/seritene/pages/meta";

export const metadata = pageMetadata(
  "/dtf-x-metros/",
  "DTF x metros en Tenerife · Monta tu plancha online",
  "Monta tus metros de DTF online con Seritene: planchas de 57 cm, medidas en centímetros, semitonos y descarga PNG transparente a 300 ppp.",
);

export default function Page() {
  return <DtfPage />;
}
