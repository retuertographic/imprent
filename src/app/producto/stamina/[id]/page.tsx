import "../../../styles/seritene/catalog-polish.css";
import "../../../styles/seritene/product-delivery.css";
import "../../../styles/seritene/shop-product.css";
import { notFound } from "next/navigation";
import { ShopProduct } from "@/components/sites/seritene/merch/ShopProduct";
import { getMerchProduct, merchMetadata, merchProductIds } from "@/components/sites/seritene/merch/serverData";

type Props = { params: Promise<{ id: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return merchProductIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const data = getMerchProduct(id);
  return data ? merchMetadata(data) : {};
}

export default async function MerchProductRoute({ params }: Props) {
  const { id } = await params;
  const data = getMerchProduct(id);
  if (!data) notFound();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(data.jsonLd).replace(/</g, "\\u003c") }}
      />
      <ShopProduct
        key={id}
        model={id}
        product={data.product}
        warehouse={data.warehouse}
        priceNotice={data.priceNotice}
      />
    </>
  );
}
