/* eslint-disable @next/next/no-img-element */
import { asset } from "../content";
import { SiteLink } from "../SiteLink";
import { formatCents, productImage, productPath } from "./catalog";
import type { CardItem } from "./types";

/** Tarjeta de producto del listado (ropa y merchandising). */
export function ShopCard({ item, brand }: { item: CardItem; brand: string }) {
  const b = item.brand || brand;
  const href = productPath(b, item.code);
  const description = item.description || "Consulta los detalles y opciones de este producto.";
  return (
    <article className="shop-card">
      <SiteLink className="shop-card-photo" data-brand={b} href={href}>
        {item.image ? (
          <img
            src={productImage(item.image)}
            alt={`${item.name} · ${item.description}`}
            width={500}
            height={500}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span>Imagen pendiente</span>
        )}
        <span className="shop-card-badge">Tu logo aquí</span>
      </SiteLink>
      <div className="shop-card-info">
        <span className="shop-ref">
          {b.toUpperCase()} · {item.code}
        </span>
        <h3>
          <SiteLink href={href}>{item.name}</SiteLink>
        </h3>
        <p className="shop-card-description">{description}</p>
        <div className="shop-card-bottom">
          <div>
            <strong>{item.fromPrice === null ? "A presupuestar" : `Desde ${formatCents(Math.round(item.fromPrice * 100))}`}</strong>
          </div>
          <SiteLink href={href} className="shop-configure">
            Ver opciones
          </SiteLink>
        </div>
      </div>
    </article>
  );
}

const MEDAL_PATH = "/merchandising/medallas-personalizadas/metacrilato-8-cm/";

/** Tarjeta destacada de medallas: primera de la página 1 de /merchandising/. */
export function MedalCard() {
  return (
    <article className="shop-card">
      <SiteLink className="shop-card-photo medal-standard-photo" href={MEDAL_PATH}>
        <img
          src={asset("/medallas/running-cinta-lisa-v2.webp")}
          alt="Medalla de metacrilato personalizada con cinta"
          width={1024}
          height={1536}
          loading="eager"
          fetchPriority="high"
        />
        <span className="shop-card-badge">Impresión incluida</span>
      </SiteLink>
      <div className="shop-card-info">
        <span className="shop-ref">SERITENE · METACRILATO</span>
        <h3>
          <SiteLink href={MEDAL_PATH}>Medalla personalizada · Hasta 8 cm</SiteLink>
        </h3>
        <p className="shop-card-description">Corte a medida, impresión a color y montaje.</p>
        <div className="shop-card-bottom">
          <div>
            <strong>Desde {formatCents(155)}</strong>
          </div>
          <SiteLink className="shop-configure" href={MEDAL_PATH}>
            Ver opciones
          </SiteLink>
        </div>
      </div>
    </article>
  );
}

export function CardPlaceholder() {
  return (
    <div className="shop-card-placeholder" aria-hidden="true">
      <div />
      <span />
      <span />
    </div>
  );
}
