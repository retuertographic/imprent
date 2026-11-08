import "../../styles/seritene/catalog-polish.css";
import { ShopPage, shopMetadata } from "@/components/sites/seritene/shop/ShopPage";

export const metadata = shopMetadata("merchandising", "bolsas");

export default function Page() {
  return <ShopPage group="merchandising" slug="bolsas" />;
}
