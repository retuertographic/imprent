import "../../../styles/seritene/custom-catalog.css";
import "../../../styles/seritene/print.css";
import "../../../styles/seritene/collections.css";
import "../../../styles/seritene/fullprint-transformation.css";
import { notFound } from "next/navigation";
import { fullprintCollections, fullprintModels } from "@/components/sites/seritene/fullprint/data";
import {
  Breadcrumbs,
  FullprintCollectionPage,
  JsonLd,
  pageMetadata,
} from "@/components/sites/seritene/fullprint/FullprintPages";

type Props = { params: Promise<{ coleccion: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return fullprintCollections.map((c) => ({ coleccion: c.slug }));
}

const findCollection = (slug: string) => fullprintCollections.find((c) => c.slug === slug);

export async function generateMetadata({ params }: Props) {
  const { coleccion } = await params;
  const collection = findCollection(coleccion);
  return collection ? pageMetadata(collection.meta, `/fullprint/coleccion/${collection.slug}/`) : {};
}

export default async function FullprintCollectionRoute({ params }: Props) {
  const { coleccion } = await params;
  const collection = findCollection(coleccion);
  if (!collection) notFound();
  return (
    <main id="contenido" className="brand-main print-main custom-catalog fullprint-catalog">
      <JsonLd data={collection.jsonLd} />
      <Breadcrumbs
        trail={[
          ["Inicio", "/"],
          ["Fullprint", "/fullprint/"],
        ]}
        current={collection.name}
      />
      <FullprintCollectionPage
        collection={collection}
        models={fullprintModels.filter((m) => m.collection === collection.slug)}
      />
    </main>
  );
}
