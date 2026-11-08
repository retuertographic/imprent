import "../styles/seritene/catalog-polish.css";
import { CatalogosPage } from "@/components/sites/seritene/pages/CatalogPages";
import { pageMetadata } from "@/components/sites/seritene/pages/meta";

export const metadata = pageMetadata(
  "/catalogos/",
  "Catálogos de textil y productos personalizados",
  "Encuentra prendas Roly, ideas fullprint y productos promocionales. Consulta a Seritene para personalizarlos en Tenerife y Canarias.",
);

export default function Page() {
  return <CatalogosPage />;
}
