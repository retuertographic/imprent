import "../styles/seritene/catalog-polish.css";
import { pageMetadata } from "@/components/sites/seritene/shop/metadata";
import { ProductsPage } from "@/components/sites/seritene/shop/ShopPage";

export const metadata = pageMetadata(
  "Productos personalizados en Tenerife",
  "Ropa Roly y merchandising Stamina. Elige tus productos y calcula cantidades y marcajes para tu proyecto en Tenerife y Canarias.",
  "/productos/",
);

export default function Page() {
  return <ProductsPage />;
}
