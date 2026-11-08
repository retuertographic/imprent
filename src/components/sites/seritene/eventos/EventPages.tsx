/** Plantillas de las páginas de eventos y medallas: colecciones, tarjetas de tienda y fichas estáticas. */
import { Check } from "lucide-react";
import { SiteLink } from "../SiteLink";
import { OrderActions } from "../soportes/OrderActions";
import { Breadcrumbs, Img, JsonLd, SupportProducts } from "../soportes/shared";
import type { EventsHeadingData } from "../soportes/types";
import type { EventCollectionData, ShopCardData, StaticProductData } from "./types";

export function EventsHeading({ heading }: { heading: EventsHeadingData }) {
  return (
    <header className="events-heading">
      <p className="eyebrow">{heading.eyebrow}</p>
      <h1>
        {heading.title}
        {heading.em && (
          <>
            <br />
            <em>{heading.em}</em>
          </>
        )}
      </h1>
      <p>{heading.intro}</p>
    </header>
  );
}

export function ShopCard({ card }: { card: ShopCardData }) {
  const Heading = card.heading;
  return (
    <article className="shop-card">
      <SiteLink className={card.photoClassName} href={card.href}>
        <Img image={card.image} />
        {card.badge && <span className="shop-card-badge">{card.badge}</span>}
      </SiteLink>
      <div className="shop-card-info">
        <span className="shop-ref">{card.ref}</span>
        <Heading>
          <SiteLink href={card.href}>{card.name}</SiteLink>
        </Heading>
        <p className="shop-card-description">{card.description}</p>
        <div className="shop-card-bottom">
          <div>
            {card.small && <small>{card.small}</small>}
            <strong>{card.strong}</strong>
          </div>
          <SiteLink className="shop-configure" href={card.href}>
            {card.action}
          </SiteLink>
        </div>
      </div>
    </article>
  );
}

/** Colección de eventos: tarjetas de producto y, si la hay, rejilla de colecciones relacionadas. */
export function EventCollection({ data, jsonLd }: { data: EventCollectionData; jsonLd?: string | null }) {
  return (
    <main id="contenido" className="brand-main">
      <JsonLd json={jsonLd} />
      <div className={data.wrapClassName}>
        <Breadcrumbs data={data.breadcrumbs} />
        <EventsHeading heading={data.heading} />
        {data.products && (
          <div className="shop-grid event-product-list">
            {data.products.map((card) => (
              <ShopCard key={card.href} card={card} />
            ))}
          </div>
        )}
        {data.section && <SupportProducts section={data.section} />}
      </div>
    </main>
  );
}

/** Ficha de producto con tabla de precios y solicitud por WhatsApp. */
export function StaticProduct({ product }: { product: StaticProductData }) {
  return (
    <main id="contenido" className="brand-main">
      <JsonLd json={product.jsonLd} />
      <div className="wrap static-product">
        <Breadcrumbs data={product.breadcrumbs} />
        <div className="static-product-layout">
          <section className="static-product-gallery" aria-label="Fotografías del producto">
            {product.gallery.map(({ image, caption }) => (
              <figure key={image.src}>
                <Img image={image} />
                <figcaption>{caption}</figcaption>
              </figure>
            ))}
          </section>
          <div className="static-product-content">
            <p className="eyebrow">{product.eyebrow}</p>
            <h1>{product.name}</h1>
            <p className="static-product-description">{product.description}</p>
            <section className="static-product-box">
              <h2>Características</h2>
              <ul className="static-specs">
                {product.specs.map((spec) => (
                  <li key={spec}>
                    <Check size={16} aria-hidden="true" />
                    {spec}
                  </li>
                ))}
              </ul>
            </section>
            <section className="static-product-box">
              <h2>Precios por cantidad</h2>
              <p className="static-price-lead">{product.priceLead}</p>
              <p className="static-price-detail">{product.priceDetail}</p>
              <div className="static-table-wrap" role="region" aria-label="Tabla de precios" tabIndex={0}>
                <table>
                  <caption>{product.table.caption}</caption>
                  <thead>
                    <tr>
                      {product.table.head.map((h) => (
                        <th key={h} scope="col">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {product.table.rows.map((row) => (
                      <tr key={row.label}>
                        <th scope="row">{row.label}</th>
                        {row.cells.map((cell, i) => (
                          <td key={i}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {product.priceNotes.map((note) => (
                <p key={note} className="static-price-note">
                  {note}
                </p>
              ))}
            </section>
            <section className="static-product-box">
              <h2>Personalización disponible</h2>
              {product.customization.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </section>
            <OrderActions name={product.order.name} message={product.order.message} image={product.order.image} />
            <p className="static-price-note">{product.footNote}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
