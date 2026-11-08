import "../styles/seritene/team-page.css";
import { TeamPage } from "@/components/sites/seritene/pages/TeamPage";
import { pageMetadata } from "@/components/sites/seritene/pages/meta";

export const metadata = pageMetadata(
  "/sobre-nosotros/",
  "Nuestro equipo | Seritene Tenerife",
  "Conoce al equipo de Seritene: dirección, diseño, impresión, taller y confección. Personas detrás de tu textil personalizado en Tenerife y Canarias.",
  true,
);

export default function Page() {
  return <TeamPage />;
}
