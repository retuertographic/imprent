import "../../styles/seritene/print.css";
import "../../styles/seritene/static-product.css";
import "../../styles/seritene/product-delivery.css";
import { printMetadata } from "@/components/sites/seritene/shop/metadata";
import { PrintProductPage } from "@/components/sites/seritene/shop/PrintPages";
import { getPrintProduct } from "@/components/sites/seritene/shop/printData";

const product = getPrintProduct("tripticos");

export const metadata = printMetadata(product);

export default function Page() {
  return <PrintProductPage product={product} />;
}
