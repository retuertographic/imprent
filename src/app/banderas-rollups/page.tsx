import { ServicePage, serviceMetadata } from "@/components/sites/seritene/pages/ServicePage";
import { banderasPage } from "@/components/sites/seritene/pages/servicePages";

export const metadata = serviceMetadata(banderasPage);

export default function Page() {
  return <ServicePage page={banderasPage} />;
}
