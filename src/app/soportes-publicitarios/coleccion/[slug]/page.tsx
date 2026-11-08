import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../../../styles/seritene/custom-catalog.css";
import "../../../styles/seritene/print.css";
import "../../../styles/seritene/product-catalog.css";
import { SiteLink } from "@/components/sites/seritene/SiteLink";
import { supportCollections, supportJsonLd, supportMeta } from "@/components/sites/seritene/soportes/data.generated";
import { Breadcrumbs, JsonLd, SupportProducts } from "@/components/sites/seritene/soportes/shared";

type Props = { params: Promise<{ slug: string }> };

const routeOf = (slug: string) => `/soportes-publicitarios/coleccion/${slug}/`;

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(supportCollections).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { ...supportMeta[routeOf(slug)], alternates: { canonical: routeOf(slug) } };
}

export default async function SupportCollectionPage({ params }: Props) {
  const { slug } = await params;
  const data = supportCollections[slug];
  if (!data) notFound();
  return (
    <main id="contenido" className="brand-main print-main custom-catalog support-shop">
      <JsonLd json={supportJsonLd[routeOf(slug)]} />
      <Breadcrumbs data={data.breadcrumbs} />
      <header className="support-hero">
        <div className="wrap support-shop-intro">
          <div>
            <SiteLink className="print-back" href={data.back.href}>
              {data.back.label}
            </SiteLink>
            <h1>
              {data.title}
              <em>{data.em}</em>
            </h1>
          </div>
          <p>{data.intro}</p>
        </div>
      </header>
      <SupportProducts section={data.section} />
    </main>
  );
}
