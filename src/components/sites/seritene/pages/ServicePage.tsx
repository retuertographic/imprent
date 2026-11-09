/* eslint-disable @next/next/no-img-element */
import { Check, Plus } from "lucide-react";
import { asset } from "../content";
import { SiteLink } from "../SiteLink";
import { Breadcrumbs, FaqSection, pad2 } from "./common";
import { pageMetadata } from "./meta";
import type { ServicePageData } from "./servicePages";
import { TechniqueExplorer } from "./TechniqueExplorer";

export const serviceMetadata = (page: ServicePageData) => pageMetadata(page.path, page.metaTitle, page.metaDescription);

/** Plantilla común de las páginas de servicio. */
export function ServicePage({ page }: { page: ServicePageData }) {
  return (
    <main id="contenido" className="brand-main">
      <Breadcrumbs items={[{ label: page.crumb }]} />
      <section className={`service-hero wrap ${page.dark ? "service-hero-dark" : ""}`}>
        <div>
          <p className="eyebrow">{page.eyebrow}</p>
          <h1>
            <span>{page.title[0]}</span>
            <em>{page.title[1]}</em>
          </h1>
          <p>{page.intro}</p>
          <SiteLink className="brand-button" href="/contacto/">
            Pedir asesoramiento <Plus size={17} />
          </SiteLink>
        </div>
        <figure className={page.image.productMockup ? "service-product-mockup" : undefined}>
          <img src={asset(page.image.src)} alt={page.image.alt} width={1536} height={1024} fetchPriority="high" />
          <figcaption>Inspiración visual · Las opciones se adaptan a tu proyecto</figcaption>
        </figure>
      </section>
      <div className="wrap service-tags">
        {page.tags.map((tag) => (
          <span key={tag}>
            <Check size={16} />
            {tag}
          </span>
        ))}
      </div>
      <section className="wrap section-pad service-story">
        <div className="sticky-title">
          <p className="eyebrow">{page.storyEyebrow}</p>
          <h2>
            Hecho a la medida
            <br />
            de tu proyecto.
          </h2>
          <SiteLink className="text-cta" href={page.storyCta.href}>
            {page.storyCta.label}
          </SiteLink>
        </div>
        <div>
          {page.story.map((row, i) => (
            <details className="story-row" key={row.title}>
              <summary className="service-detail-toggle">
                <span>{pad2(i + 1)}</span>
                <h3>{row.title}</h3>
                <Plus size={20} />
              </summary>
              <p>{row.text}</p>
            </details>
          ))}
        </div>
      </section>
      {page.techniques && <TechniqueExplorer />}
      <FaqSection faqs={page.faqs} />
      <section className="wrap related-services">
        <p className="eyebrow">TU IDEA PUEDE SEGUIR CRECIENDO</p>
        <div>
          {page.related.map((link) => (
            <SiteLink key={link.href} href={link.href}>
              {link.label}
              <Plus size={20} />
            </SiteLink>
          ))}
        </div>
      </section>
    </main>
  );
}
