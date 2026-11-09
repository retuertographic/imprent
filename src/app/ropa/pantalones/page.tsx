import "../../styles/seritene/catalog-polish.css";
import { ShopPage, shopMetadata } from "@/components/sites/seritene/shop/ShopPage";

export const metadata = shopMetadata("ropa", "pantalones");

export default function Page() {
  return <ShopPage group="ropa" slug="pantalones" />;
}
