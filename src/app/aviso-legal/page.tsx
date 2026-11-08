import { AvisoLegal } from "@/components/sites/seritene/pages/LegalPages";
import { pageMetadata } from "@/components/sites/seritene/pages/meta";

export const metadata = pageMetadata(
  "/aviso-legal/",
  "Aviso legal",
  "Titular, contacto e información sobre el uso de la web de Seritene y sus solicitudes de presupuesto.",
);

export default function Page() {
  return <AvisoLegal />;
}
