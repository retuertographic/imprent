import { PoliticaPrivacidad } from "@/components/sites/seritene/pages/LegalPages";
import { pageMetadata } from "@/components/sites/seritene/pages/meta";

export const metadata = pageMetadata(
  "/politica-privacidad/",
  "Política de privacidad",
  "Información sobre los datos de tus consultas, formularios y configuradores de Seritene y cómo ejercer tus derechos.",
);

export default function Page() {
  return <PoliticaPrivacidad />;
}
