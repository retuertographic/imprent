/* eslint-disable @next/next/no-img-element */
/** Piezas comunes de las páginas de soportes y eventos: migas, imágenes, tarjetas de colección y JSON-LD. */
import { ArrowUpRight } from "lucide-react";
import { asset } from "../content";
import { SiteLink } from "../SiteLink";
import type { BreadcrumbsData, ImageData, SupportCardData, SupportSectionData } from "./types";

/** Ruta de /public con basePath; URLs absolutas sin cambios. */
export const src = (path: string) => (path.startsWith("/") ? asset(path) : path);
const srcSet = (value: string) =>
  value
    .split(",")
    .map((part) => {
      const [url, ...rest] = part.trim().split(/\s+/);
      return [src(url), ...rest].join(" ");
    })
    .join(", ");

export function Img({ image }: { image: ImageData }) {
  const { src: path, srcSet: set, alt, ...rest } = image;
  return <img {...rest} alt={alt} src={src(path)} srcSet={set ? srcSet(set) : undefined} />;
}

export function Breadcrumbs({ data }: { data: BreadcrumbsData }) {
  return (
    <nav className={data.className} aria-label="Ruta de navegación">
      {data.items.map((item, i) => (
        <BreadcrumbItem key={i} item={item} first={i === 0} />
      ))}
    </nav>
  );
}

function BreadcrumbItem({ item, first }: { item: BreadcrumbsData["items"][number]; first: boolean }) {
  return (
    <>
      {!first && <span>/</span>}
      {item.href ? (
        <SiteLink href={item.href}>{item.label}</SiteLink>
      ) : (
        <span aria-current={item.current ? "page" : undefined}>{item.label}</span>
      )}
    </>
  );
}

export function SupportCard({ card }: { card: SupportCardData }) {
  return (
    <SiteLink className="support-product" href={card.href} id={card.id}>
      <div className="support-product-art">
        {card.collectionImage ? (
          <div className="support-collection-image">
            <Img image={card.image} />
          </div>
        ) : (
          <Img image={card.image} />
        )}
      </div>
      <div className="support-product-copy">
        {card.category && <span className="support-product-category">{card.category}</span>}
        <h3>{card.name}</h3>
        <p className="support-product-detail">{card.detail}</p>
        {card.description && <p className="support-product-description">{card.description}</p>}
        {card.price && (
          <div className="support-product-price">
            <strong>{card.price.strong}</strong>
            <small>{card.price.small}</small>
          </div>
        )}
        <span className="support-product-action">
          {card.action}
          <span aria-hidden="true">
            <ArrowUpRight size={16} />
          </span>
        </span>
      </div>
    </SiteLink>
  );
}

export function SupportProducts({ section }: { section: SupportSectionData }) {
  return (
    <section className={section.className} aria-label={section.label} id={section.id}>
      <div className="support-results">
        <h2>{section.title}</h2>
        <p>{section.count}</p>
      </div>
      <div className={section.gridClassName}>
        {section.cards.map((card) => (
          <SupportCard key={card.href} card={card} />
        ))}
      </div>
      {section.note && <p className="support-product-note">{section.note}</p>}
    </section>
  );
}

export function JsonLd({ json }: { json: string | null | undefined }) {
  if (!json) return null;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
