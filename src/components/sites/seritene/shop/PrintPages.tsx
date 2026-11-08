/* eslint-disable @next/next/no-img-element */
import { ArrowLeft, ArrowUpRight, Check, Plus } from "lucide-react";
import { asset, ORIGIN } from "../content";
import { SiteLink } from "../SiteLink";
import { formatCents } from "./catalog";
import { OrderActions } from "./OrderActions";
import { paperFan, printLinks, printProducts, type PrintArt, type PrintProduct } from "./printData";
import { PrintConfigurator } from "./PrintConfigurator";
import { SeoLocal } from "./SeoLocal";

const PRINT_HELP_WA = "https://wa.me/34641782535?text=Hola%2C%20quiero%20consultar%20un%20trabajo%20de%20imprenta.";
const number = new Intl.NumberFormat("es-ES");

function ArtImage({ art, alt, priority = false }: { art: PrintArt; alt: string; priority?: boolean }) {
  const srcSet = art.smallWidth < art.width ? `${asset(art.small)} ${art.smallWidth}w, ${asset(art.src)} ${art.width}w` : undefined;
  return priority ? (
    <img
      src={asset(art.src)}
      srcSet={srcSet}
      sizes="(max-width:700px) 92vw, 48vw"
      alt={alt}
      loading="eager"
      fetchPriority="high"
      decoding="async"
      width={art.width}
      height={art.height}
      style={{ position: "static", width: "100%", height: "100%", objectFit: "contain", maxWidth: "100%" }}
    />
  ) : (
    <img src={asset(art.src)} alt={alt} width={art.width} height={art.height} loading="lazy" decoding="async" />
  );
}

/** Listado /imprenta/. */
export function ImprentaPage() {
  const cards = [...printProducts, paperFan];
  return (
    <main id="contenido" className="brand-main print-main shop-page">
      <nav className="wrap breadcrumbs" aria-label="Ruta de navegación">
        <SiteLink href="/">Inicio</SiteLink>
        <span>/</span>
        <span aria-current="page">Imprenta</span>
      </nav>
      <header className="wrap shop-heading">
        <div>
          <p className="eyebrow">IMPRENTA EN TENERIFE · SERITENE</p>
          <h1>
            Del papel
            <br />
            <em>al papelón.</em>
          </h1>
        </div>
        <p>Tu marca tiene mucho que contar. Dale color, dale forma, dale a imprimir.</p>
      </header>
      <section id="productos-imprenta" className="wrap shop-browser print-listing" aria-label="Productos de imprenta">
        <div className="shop-grid">
          {cards.map((p) => {
            const href = `/imprenta/${p.slug}/`;
            return (
              <article className="shop-card" key={p.slug}>
                <SiteLink className="shop-card-photo" href={href}>
                  <ArtImage art={p.art} alt={`${p.name}: ejemplo de acabado`} />
                </SiteLink>
                <div className="shop-card-info">
                  <h3>
                    <SiteLink href={href}>{p.name}</SiteLink>
                  </h3>
                  <p className="shop-card-description">{p.punchline}</p>
                  <div className="shop-card-bottom">
                    <div>
                      <strong>{p.priceLabel}</strong>
                    </div>
                    <SiteLink className="shop-configure" href={href}>
                      Ver opciones
                    </SiteLink>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        <p className="print-conditions">
          Pedido mínimo: 250 unidades. Diseño no incluido. Impuestos y transporte se confirman en el presupuesto. Imágenes de
          ejemplo.
        </p>
      </section>
      <section className="wrap print-help">
        <Plus size={44} aria-hidden="true" />
        <div>
          <h2>
            ¿Tienes otra idea
            <br />
            entre papeles?
          </h2>
          <p>Cuéntanos qué necesitas para tu negocio o evento en Tenerife y Canarias.</p>
        </div>
        <a className="brand-button" href={PRINT_HELP_WA}>
          Lo vemos juntos <ArrowUpRight size={19} aria-hidden="true" />
        </a>
      </section>
      <SeoLocal kind="imprenta" />
    </main>
  );
}

/** Ficha de imprenta con configurador. */
export function PrintProductPage({ product }: { product: PrintProduct }) {
  return (
    <main id="contenido" className="brand-main print-main">
      <nav className="wrap breadcrumbs" aria-label="Ruta de navegación">
        <SiteLink href="/">Inicio</SiteLink>
        <span>/</span>
        <SiteLink href="/imprenta/">Imprenta</SiteLink>
        <span>/</span>
        <span aria-current="page">{product.name}</span>
      </nav>
      <section className="wrap print-product-layout">
        <div className="print-product-visual">
          <SiteLink href="/imprenta/" className="print-back">
            <ArrowLeft size={16} aria-hidden="true" /> Toda la imprenta
          </SiteLink>
          <div className="print-product-photo">
            <div className="print-art" style={{ aspectRatio: `${product.art.width}/${product.art.height}` }}>
              <ArtImage art={product.art} alt={`${product.name}: ejemplo de acabado`} priority />
            </div>
            <span className="print-example">Ejemplo de acabado · Tu diseño irá aquí</span>
          </div>
          <div className="print-specs">
            {product.specs.map((spec) => (
              <span key={spec}>
                <Check size={15} aria-hidden="true" />
                {spec}
              </span>
            ))}
          </div>
        </div>
        <div className="print-product-info">
          <p className="eyebrow">IMPRENTA · TENERIFE Y CANARIAS</p>
          <h1>{product.name}</h1>
          <p className="print-description">{product.punchline}</p>
          <PrintConfigurator product={product} />
          <details className="product-info-details">
            <summary>Más sobre este producto</summary>
            <p>{product.description}</p>
          </details>
        </div>
      </section>
      <PrintRelated current={product.slug} />
    </main>
  );
}

function PrintRelated({ current }: { current: string }) {
  return (
    <section className="wrap print-related">
      <p className="eyebrow">SIGUE DÁNDOLE COLOR</p>
      <h2>Más ideas en papel.</h2>
      <div>
        {printLinks
          .filter((p) => p.slug !== current)
          .map((p) => (
            <SiteLink key={p.slug} href={`/imprenta/${p.slug}/`}>
              {p.name}
              <ArrowUpRight size={19} aria-hidden="true" />
            </SiteLink>
          ))}
      </div>
    </section>
  );
}

function paperFanJsonLd() {
  const p = paperFan;
  const url = (path: string) => new URL(path, ORIGIN).href;
  const crumbs = [
    ["Inicio", "/"],
    ["Eventos", "/eventos/"],
    ["Abanicos", "/eventos/abanicos/"],
    [p.name, `/imprenta/${p.slug}/`],
  ];
  return JSON.stringify([
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: crumbs.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: url(path) })),
    },
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: p.name,
      description: p.description,
      sku: p.ref,
      url: url(`/imprenta/${p.slug}/`),
      image: [url(p.art.src)],
      brand: { "@type": "Brand", name: "Seritene" },
    },
  ]).replace(/</g, "\\u003c");
}

/** Abanicos de papel: ficha estática con tabla de precios por cantidad. */
export function PaperFanPage() {
  const p = paperFan;
  const best = p.tiers[p.tiers.length - 1];
  return (
    <main id="contenido" className="brand-main">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: paperFanJsonLd() }} />
      <div className="wrap static-product">
        <nav className="breadcrumbs" aria-label="Ruta de navegación">
          <SiteLink href="/">Inicio</SiteLink>
          <span>/</span>
          <SiteLink href="/eventos/">Eventos</SiteLink>
          <span>/</span>
          <SiteLink href="/eventos/abanicos/">Abanicos</SiteLink>
          <span>/</span>
          <span>{p.ref}</span>
        </nav>
        <div className="static-product-layout">
          <section className="static-product-gallery" aria-label="Fotografías del producto">
            <figure>
              <img src={asset(p.art.src)} alt="Abanico de papel impreso a todo color" width={1024} height={1024} loading="eager" />
              <figcaption>Diseño de ejemplo · Personalizable</figcaption>
            </figure>
          </section>
          <div className="static-product-content">
            <p className="eyebrow">SERITENE · {p.ref}</p>
            <h1>{p.name}</h1>
            <p className="static-product-description">{p.description}</p>
            <section className="static-product-box">
              <h2>Características</h2>
              <ul className="static-specs">
                {p.specs.map((s) => (
                  <li key={s}>
                    <Check size={16} aria-hidden="true" />
                    {s}
                  </li>
                ))}
              </ul>
            </section>
            <section className="static-product-box">
              <h2>Precios por cantidad</h2>
              <p className="static-price-lead">Desde {formatCents(best.unit)}/ud.</p>
              <p className="static-price-detail">{number.format(best.min)} uds. · Ambas caras incluidas</p>
              <div className="static-table-wrap" role="region" aria-label="Tabla de precios" tabIndex={0}>
                <table>
                  <caption>Precios unitarios sin impuestos</caption>
                  <thead>
                    <tr>
                      <th scope="col">Cantidad desde</th>
                      <th scope="col">Precio / ud.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.tiers.map((t) => (
                      <tr key={t.min}>
                        <th scope="row">{t.min}</th>
                        <td>{formatCents(t.unit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="static-price-note">Pedido mínimo: 250 unidades.</p>
              <p className="static-price-note">
                Precios por unidad sin impuestos. Consulta transporte, preparación y plazo en tu presupuesto.
              </p>
            </section>
            <section className="static-product-box">
              <h2>Personalización disponible</h2>
              <p>Impresión a todo color por ambas caras con el diseño de tu evento.</p>
            </section>
            <OrderActions
              name={p.name}
              message={`Hola Seritene, quiero solicitar presupuesto para ${p.name} (ref. ${p.ref}). Cantidad y opciones a confirmar.`}
              image={p.art.src}
              path={`/imprenta/${p.slug}/`}
            />
            <p className="static-price-note">Te atendemos por WhatsApp para confirmar diseño, cantidades y plazo.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
