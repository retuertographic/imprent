import { ServicesDirectory } from "@/components/sites/seritene/pages/ServicesDirectory";
import { pageMetadata } from "@/components/sites/seritene/pages/meta";

export const metadata = pageMetadata(
  "/servicios/",
  "Servicios de personalización en Tenerife",
  "Textil personalizado, fullprint, merchandising, rotulación y diseño gráfico. Descubre los servicios de Seritene para Tenerife y Canarias.",
);

export default function Page() {
  return <ServicesDirectory />;
}
