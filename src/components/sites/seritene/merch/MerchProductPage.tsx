import { notFound } from "next/navigation";
import { productJsonLd } from "./productJsonLd";
import { productHeading } from "./productSeo";
import { RelatedProducts } from "./RelatedProducts";
import { relatedProducts } from "./relatedProducts";
import { ShopProduct } from "./ShopProduct";
import { getMerchProduct, merchMetadata, merchProductIds } from "./serverData";
import type { Brand } from "./types";

type Params = { params: Promise<{ id: string }> };

/**
 * Rutas /producto/<marca>/[id]/ (Stamina, Roly, JHK): parámetros estáticos, metadatos y página.
 * Cada `page.tsx` importa las hojas de estilo de la ficha (las mismas que carga producción).
 * El JSON-LD, el H1 y los productos relacionados se calculan aquí, en la build (`productJsonLd`,
 * `productSeo`, `relatedProducts`).
 */
export function merchProductRoute(brand: Brand) {
  return {
    generateStaticParams: () => merchProductIds(brand).map((id) => ({ id })),
    generateMetadata: async ({ params }: Params) => {
      const { id } = await params;
      const data = getMerchProduct(id, brand);
      return data ? merchMetadata(data) : {};
    },
    Page: async function MerchProductRoute({ params }: Params) {
      const { id } = await params;
      const data = getMerchProduct(id, brand);
      if (!data) notFound();
      const { related, combine } = relatedProducts(brand, id);
      return (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(data)).replace(/</g, "\\u003c") }}
          />
          <ShopProduct
            key={id}
            brand={brand}
            model={id}
            product={data.product}
            warehouse={data.warehouse}
            priceNotice={data.priceNotice}
            context={data.context}
            heading={productHeading(data)}
          >
            <RelatedProducts related={related} combine={combine} category={data.context?.category} />
          </ShopProduct>
        </>
      );
    },
  };
}
