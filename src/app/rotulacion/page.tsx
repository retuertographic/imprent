import { ServicePage, serviceMetadata } from "@/components/sites/seritene/pages/ServicePage";
import { rotulacionPage } from "@/components/sites/seritene/pages/servicePages";

export const metadata = serviceMetadata(rotulacionPage);

export default function Page() {
  return <ServicePage page={rotulacionPage} />;
}
