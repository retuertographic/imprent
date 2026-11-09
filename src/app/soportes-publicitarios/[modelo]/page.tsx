import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../../styles/seritene/soportes.css";
import "../../styles/seritene/custom-catalog.css";
import "../../styles/seritene/print.css";
import "../../styles/seritene/fullprint-transformation.css";
import "../../styles/seritene/product-delivery.css";
import { SupportModelPage } from "@/components/sites/seritene/soportes/SupportModelPage";
import { supportMeta, supportModels } from "@/components/sites/seritene/soportes/data.generated";

type Props = { params: Promise<{ modelo: string }> };

const routeOf = (slug: string) => `/soportes-publicitarios/${slug}/`;

// /soportes-publicitarios/coleccion/* es una ruta estática propia: no forma parte de estos modelos.
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(supportModels).map((modelo) => ({ modelo }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { modelo } = await params;
  return { ...supportMeta[routeOf(modelo)], alternates: { canonical: routeOf(modelo) } };
}

export default async function SupportModelRoute({ params }: Props) {
  const { modelo } = await params;
  if (!supportModels[modelo]) notFound();
  return <SupportModelPage slug={modelo} />;
}
