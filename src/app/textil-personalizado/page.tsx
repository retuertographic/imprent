import { ServicePage, serviceMetadata } from "@/components/sites/seritene/pages/ServicePage";
import { textilPage } from "@/components/sites/seritene/pages/servicePages";

export const metadata = serviceMetadata(textilPage);

export default function Page() {
  return <ServicePage page={textilPage} />;
}
