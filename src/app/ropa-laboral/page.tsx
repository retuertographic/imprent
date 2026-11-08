import "../styles/seritene/catalog-polish.css";
import { RopaLaboralPage } from "@/components/sites/seritene/pages/CatalogPages";
import { pageMetadata } from "@/components/sites/seritene/pages/meta";

export const metadata = pageMetadata(
  "/ropa-laboral/",
  "Ropa laboral personalizada en Tenerife",
  "Ropa laboral personalizada para tu equipo. Consulta prendas y marcaje del logo para tu actividad.",
);

export default function Page() {
  return <RopaLaboralPage />;
}
