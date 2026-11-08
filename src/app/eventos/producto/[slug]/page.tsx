import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../../../styles/seritene/static-product.css";
import { StaticProduct } from "@/components/sites/seritene/eventos/EventPages";
import { eventProducts } from "@/components/sites/seritene/eventos/data.generated";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(eventProducts).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = eventProducts[slug];
  return product ? { ...product.meta, alternates: { canonical: product.route } } : {};
}

export default async function EventProductPage({ params }: Props) {
  const { slug } = await params;
  const product = eventProducts[slug];
  if (!product) notFound();
  return <StaticProduct product={product} />;
}
