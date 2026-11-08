import "../../styles/seritene/print.css";
import "../../styles/seritene/static-product.css";
import { printMetadata } from "@/components/sites/seritene/shop/metadata";
import { PaperFanPage } from "@/components/sites/seritene/shop/PrintPages";
import { paperFan } from "@/components/sites/seritene/shop/printData";

export const metadata = printMetadata(paperFan);

export default function Page() {
  return <PaperFanPage />;
}
