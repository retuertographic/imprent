import type { Metadata } from "next";
import "../../../styles/seritene/static-product.css";
import { StaticProduct } from "@/components/sites/seritene/eventos/EventPages";
import { medalProduct } from "@/components/sites/seritene/eventos/data.generated";

export const metadata: Metadata = { ...medalProduct.meta, alternates: { canonical: medalProduct.route } };

export default function MedallaMetacrilatoPage() {
  return <StaticProduct product={medalProduct} />;
}
