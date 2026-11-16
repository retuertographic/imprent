import "../../../styles/seritene/catalog-polish.css";
import "../../../styles/seritene/product-delivery.css";
import "../../../styles/seritene/shop-product.css";
import { merchProductRoute } from "@/components/sites/seritene/merch/MerchProductPage";

const route = merchProductRoute("roly");

export const dynamicParams = false;
export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
