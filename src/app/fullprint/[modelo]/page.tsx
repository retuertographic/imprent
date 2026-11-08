import "../../styles/seritene/custom-catalog.css";
import "../../styles/seritene/print.css";
import "../../styles/seritene/fullprint-transformation.css";
import "../../styles/seritene/product-delivery.css";
import { notFound } from "next/navigation";
import { fullprintCollections, fullprintModels } from "@/components/sites/seritene/fullprint/data";
import { FullprintDetails } from "@/components/sites/seritene/fullprint/FullprintDetails";
import { Breadcrumbs, JsonLd, pageMetadata } from "@/components/sites/seritene/fullprint/FullprintPages";

type Props = { params: Promise<{ modelo: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return fullprintModels.map((m) => ({ modelo: m.slug }));
}

const findModel = (slug: string) => fullprintModels.find((m) => m.slug === slug);

export async function generateMetadata({ params }: Props) {
  const { modelo } = await params;
  const model = findModel(modelo);
  return model ? pageMetadata(model.meta, `/fullprint/${model.slug}/`) : {};
}

export default async function FullprintModelRoute({ params }: Props) {
  const { modelo } = await params;
  const model = findModel(modelo);
  const collection = fullprintCollections.find((c) => c.slug === model?.collection);
  if (!model || !collection) notFound();
  return (
    <main id="contenido" className="brand-main print-main custom-catalog">
      <JsonLd data={model.jsonLd} />
      <Breadcrumbs
        trail={[
          ["Inicio", "/"],
          ["Fullprint", "/fullprint/"],
          [collection.name, `/fullprint/coleccion/${collection.slug}/`],
        ]}
        current={model.name}
      />
      <FullprintDetails product={model} collection={{ slug: collection.slug, name: collection.name }} />
    </main>
  );
}
