import "../../styles/seritene/catalog-polish.css";
import { ShopPage, shopMetadata } from "@/components/sites/seritene/shop/ShopPage";

export const metadata = shopMetadata("ropa", "camisetas");

export default function Page() {
  return <ShopPage group="ropa" slug="camisetas" />;
}
