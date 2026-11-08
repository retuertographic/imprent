import { SiteMapPage } from "@/components/sites/seritene/pages/SiteMapPage";
import { pageMetadata } from "@/components/sites/seritene/pages/meta";

export const metadata = pageMetadata(
  "/mapa-web/",
  "Mapa web",
  "Todos los servicios, catálogos y guías de Seritene.",
);

export default function Page() {
  return <SiteMapPage />;
}
