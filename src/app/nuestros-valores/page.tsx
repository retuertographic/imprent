import { ValuesPage } from "@/components/sites/seritene/pages/ValuesPage";
import { pageMetadata } from "@/components/sites/seritene/pages/meta";

export const metadata = pageMetadata(
  "/nuestros-valores/",
  "Nuestros valores | Seritene Tenerife",
  "Cercanía, criterio, cuidado y creatividad en cada proyecto de personalización textil y promocional de Seritene.",
  true,
);

export default function Page() {
  return <ValuesPage />;
}
