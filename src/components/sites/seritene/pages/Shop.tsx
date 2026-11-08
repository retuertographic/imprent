/* eslint-disable @next/next/no-img-element */
import { asset, contact } from "../content";
import { SiteLink } from "../SiteLink";
import type { ShopItem } from "./catalogSnapshots";

const fineprint =
  "Precios sin impuestos, transporte ni diseño gráfico. El marcaje se añade en la ficha. Disponibilidad y presupuesto sujetos a confirmación.";

const imageSrc = (src: string) => (src.startsWith("/") ? asset(src) : src);

/**
 * Rejilla de productos con paginación. La web original la carga desde su API;
 * aquí se sirve una instantánea de la primera página y el resto enlaza al catálogo completo.
 */
export function ShopBrowser({ items, pages, nextHref }: { items: ShopItem[]; pages: number; nextHref: string }) {
  return (
    <section className="shop-browser" aria-label="Catálogo de productos">
      <div className="shop-grid">
        {items.map((item) => (
          <article className="shop-card" key={item.path}>
            <SiteLink className="shop-card-photo" data-brand={item.brand} href={item.path}>
              <img
                src={imageSrc(item.image)}
                alt={item.alt}
                width={500}
                height={500}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
              <span className="shop-card-badge">Tu logo aquí</span>
            </SiteLink>
            <div className="shop-card-info">
              <span className="shop-ref">{item.ref}</span>
              <h3>
                <SiteLink href={item.path}>{item.name}</SiteLink>
              </h3>
              <p className="shop-card-description">{item.description}</p>
              <div className="shop-card-bottom">
                <div>
                  <strong>{item.price}</strong>
                </div>
                <SiteLink href={item.path} className="shop-configure">
                  Ver opciones
                </SiteLink>
              </div>
            </div>
          </article>
        ))}
      </div>
      <nav className="shop-pagination" aria-label="Paginación">
        <span aria-disabled="true">Anterior</span>
        <span>Página 1 de {pages} · 50 por página</span>
        <SiteLink href={nextHref} rel="next">
          Siguiente
        </SiteLink>
      </nav>
      <p className="shop-fineprint">{fineprint}</p>
    </section>
  );
}

/** Bloque local «… con tu logo en Tenerife» con preguntas frecuentes. */
export function SeoLocal({ title, text }: { title: string; text: string }) {
  return (
    <section className="wrap seo-local">
      <div>
        <p className="eyebrow">SERITENE · TENERIFE Y CANARIAS</p>
        <h2>{title}</h2>
        <p>{text}</p>
        <p>
          Atendemos proyectos de Tenerife y consultas desde el resto de Canarias. Dinos tu municipio o isla y la fecha que
          necesitas para confirmar la entrega.
        </p>
      </div>
      <div>
        <details>
          <summary>¿Qué necesitas para pedir presupuesto?</summary>
          <p>
            Producto, unidades, diseño y fecha. En ropa, añade las tallas; para envíos, indica el destino. Puedes
            escribirnos al {contact.displayPhone} por WhatsApp.
          </p>
        </details>
        <details>
          <summary>¿Cuánto tarda el pedido?</summary>
          <p>
            El plazo depende del producto, la cantidad, la disponibilidad y la aprobación del diseño. Lo confirmamos
            contigo antes de producir; si tienes un evento, indícanos la fecha desde el principio.
          </p>
        </details>
        <details>
          <summary>¿Puedo aportar mi propio diseño?</summary>
          <p>
            Sí. Envíanos un PDF vectorial, SVG, AI o el archivo de mayor calidad que tengas. Revisamos si sirve para el
            soporte elegido. Si necesitas diseño o adaptación, se presupuesta aparte.
          </p>
        </details>
        <SiteLink className="text-cta" href="/contacto/">
          Preparar mi presupuesto
        </SiteLink>
      </div>
    </section>
  );
}
