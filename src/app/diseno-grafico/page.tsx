import { ServicePage, serviceMetadata } from "@/components/sites/seritene/pages/ServicePage";
import { disenoPage } from "@/components/sites/seritene/pages/servicePages";

export const metadata = serviceMetadata(disenoPage);

export default function Page() {
  return <ServicePage page={disenoPage} />;
}
