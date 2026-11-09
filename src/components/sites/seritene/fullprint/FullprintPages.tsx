/* eslint-disable @next/next/no-img-element */
import { ArrowUpRight, Plus } from "lucide-react";
import type { Metadata } from "next";
import { Fragment, type CSSProperties } from "react";
import { asset, contact } from "../content";
import { SiteLink } from "../SiteLink";
import { fullprintCollections } from "./data";
import { FullprintTransformation } from "./FullprintTransformation";
import type { FullprintCollection, FullprintModel, PageMeta } from "./types";

/** Metadatos de página con los mismos campos que la web original. */
export function pageMetadata(meta: PageMeta, path: string): Metadata {
  const fullTitle = `${meta.title} | Seritene`;
  return {
    title: meta.title,
    description: meta.description,
    robots: { index: true, follow: true },
    alternates: { canonical: path },
    openGraph: {
      title: fullTitle,
      description: meta.description,
      url: path,
      siteName: "Seritene",
      type: "website",
      locale: "es_ES",
    },
    twitter: { card: "summary", title: fullTitle, description: meta.description },
  };
}

export function JsonLd({ data }: { data: unknown }) {
  if (!data) return null;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function Breadcrumbs({ trail, current }: { trail: [string, string][]; current: string }) {
  return (
    <nav className="wrap breadcrumbs" aria-label="Ruta de navegación">
      {trail.map(([name, href]) => (
        <Fragment key={href}>
          <SiteLink href={href}>{name}</SiteLink>
          <span>/</span>
        </Fragment>
      ))}
      <span aria-current="page">{current}</span>
    </nav>
  );
}

const small = (src: string) => src.replace(/\.webp$/, "-small.webp");

/** Portada ilustrada de una colección (landing y cabecera de colección). */
function CoverArt({ collection, hero = false }: { collection: FullprintCollection; hero?: boolean }) {
  const style = { "--cover-bg": collection.bg, "--cover-ink": collection.ink } as CSSProperties;
  return (
    <div className="fp-cover-art" style={style} aria-hidden="true">
      <span className="fp-cover-word">{collection.word}</span>
      <span className="fp-cover-ring" />
      <span className="fp-cover-dot" />
      <div className="fp-cover-product">
        <img
          src={asset(collection.image)}
          srcSet={`${asset(small(collection.image))} 768w, ${asset(collection.image)} 1536w`}
          sizes={hero ? "(max-width:700px) 90vw, 600px" : "(max-width:900px) 45vw, 24vw"}
          decoding="async"
          width={1536}
          height={1024}
          alt=""
          loading={hero ? "eager" : "lazy"}
        />
      </div>
      <span className="fp-cover-stamp">
        TU IDEA
        <br />A TODO COLOR
      </span>
    </div>
  );
}

export function FullprintLanding() {
  return (
    <>
      <section className="fp-story wrap" aria-labelledby="fp-story-title">
        <p className="fp-story-eyebrow">FULLPRINT · SERITENE</p>
        <h1 id="fp-story-title">
          Tu diseño.
          <br />
          <em>Por todo el tejido.</em>
        </h1>
        <p className="fp-story-description">Ropa, bolsas y complementos personalizados a todo color. Hecho en Tenerife.</p>
      </section>

      <section className="wrap fp-collections" id="colecciones" aria-labelledby="collections-title">
        <div className="fp-collections-heading">
          <div>
            <p className="eyebrow">ELIGE TU COLECCIÓN</p>
            <h2 id="collections-title">
              Una idea.
              <br />
              <em>Muchas formas de llevarla.</em>
            </h2>
          </div>
          <p>Empieza por una sección y encuentra el producto que encaja con tu proyecto.</p>
        </div>
        <div className="fp-collection-grid">
          {fullprintCollections.map((c, i) => (
            <SiteLink key={c.slug} className="fp-collection-cover" id={c.slug} href={`/fullprint/coleccion/${c.slug}/`}>
              <CoverArt collection={c} />
              <div className="fp-cover-copy">
                <div>
                  <span className="fp-cover-number">0{i + 1} / FULLPRINT</span>
                  <h3>{c.name}</h3>
                  <p>{c.summary}</p>
                </div>
                <span className="fp-cover-enter">
                  <ArrowUpRight size={16} />
                </span>
              </div>
              <span className="fp-cover-bottom">
                <span>Explorar {c.name.toLowerCase()}</span>
                <small>
                  {c.count} {c.count === 1 ? "producto" : "productos"}
                </small>
              </span>
            </SiteLink>
          ))}
        </div>
      </section>

      <section className="wrap seo-local">
        <div>
          <p className="eyebrow">SERITENE · TENERIFE Y CANARIAS</p>
          <h2>Fullprint a medida desde Tenerife</h2>
          <p>
            La impresión integral permite llevar tus colores a toda la prenda o al artículo. Elige tejido, formato y cantidades
            en cada ficha; la impresión indicada ya forma parte del precio.
          </p>
          <p>
            Atendemos proyectos de Tenerife y consultas desde el resto de Canarias. Dinos tu municipio o isla y la fecha que
            necesitas para confirmar la entrega.
          </p>
        </div>
        <div>
          <details>
            <summary>¿Qué necesitas para pedir presupuesto?</summary>
            <p>
              Producto, unidades, diseño y fecha. En ropa, añade las tallas; para envíos, indica el destino. Puedes escribirnos
              al {contact.displayPhone} por WhatsApp.
            </p>
          </details>
          <details>
            <summary>¿Cuánto tarda el pedido?</summary>
            <p>
              El plazo depende del producto, la cantidad, la disponibilidad y la aprobación del diseño. Lo confirmamos contigo
              antes de producir; si tienes un evento, indícanos la fecha desde el principio.
            </p>
          </details>
          <details>
            <summary>¿Puedo aportar mi propio diseño?</summary>
            <p>
              Sí. Envíanos un PDF vectorial, SVG, AI o el archivo de mayor calidad que tengas. Revisamos si sirve para el soporte
              elegido. Si necesitas diseño o adaptación, se presupuesta aparte.
            </p>
          </details>
          <SiteLink className="text-cta" href="/contacto/">
            Preparar mi presupuesto
          </SiteLink>
        </div>
      </section>

      <section className="kroma-feature wrap" id="kroma" aria-labelledby="kroma-title">
        <div className="kroma-feature-heading">
          <div>
            <p className="eyebrow">NUESTRA MARCA DEPORTIVA</p>
            <h2 id="kroma-title">
              Nuestro fullprint.
              <br />
              <em>Con nombre propio.</em>
            </h2>
          </div>
          <p>
            <strong>Kroma Sportswear.</strong> Nuestra marca de ropa deportiva personalizada para clubes, equipos y deportistas.
          </p>
        </div>
        <a
          className="kroma-showcase"
          href="https://kromasportswear.com/"
          aria-label="Visitar Kroma Sportswear, nuestra marca de ropa deportiva personalizada"
        >
          <picture className="kroma-showcase-photo">
            <source media="(max-width:600px)" srcSet={asset("/kroma-campaign-running.webp")} />
            <img
              src={asset("/kroma-campaign-football.webp")}
              alt="Imagen de campaña de Kroma: ropa deportiva negra y verde en acción"
              width={1536}
              height={1024}
              loading="lazy"
            />
          </picture>
          <div className="kroma-showcase-shade" aria-hidden="true" />
          <img
            className="kroma-showcase-logo"
            src={asset("/kroma-logo-official.png")}
            alt="Kroma Custom Sportswear"
            width={1024}
            height={214}
            loading="lazy"
          />
          <div className="kroma-showcase-copy">
            <span className="kroma-showcase-tag">DISEÑADA PARA TU EQUIPO</span>
            <p>
              VISTE TU
              <br />
              <em>IDENTIDAD.</em>
            </p>
            <span className="brand-button">
              Descubrir Kroma <Plus size={20} />
            </span>
            <span className="kroma-showcase-domain">kromasportswear.com</span>
          </div>
          <span className="kroma-showcase-footnote">ROPA DEPORTIVA PERSONALIZADA · FULLPRINT</span>
        </a>
      </section>
    </>
  );
}

export function FullprintCollectionPage({ collection, models }: { collection: FullprintCollection; models: FullprintModel[] }) {
  return (
    <>
      <section className="wrap fp-section-hero">
        <div>
          <SiteLink className="print-back" href="/fullprint/#colecciones">
            ← Todas las colecciones
          </SiteLink>
          <p className="eyebrow">FULLPRINT · A TU MANERA</p>
          <h1>
            {collection.name}
            <em>con tu identidad.</em>
          </h1>
          <p>{collection.line}</p>
          <a className="fp-section-cta" href="#productos">
            Ver {collection.count === 1 ? "el producto" : `los ${collection.count} productos`} ↓
          </a>
        </div>
        <CoverArt collection={collection} hero />
      </section>

      <section className="wrap collection-section" id="productos" aria-labelledby="products-title">
        <div className="print-section-heading">
          <h2 id="products-title">{collection.name} fullprint</h2>
        </div>
        <div className="fp-product-list">
          {collection.rows.map((row) => {
            const model = models.find((m) => m.slug === row.slug);
            return (
              <SiteLink key={row.slug} className="fp-product-row" href={`/fullprint/${row.slug}/`}>
                <div className="fp-list-image">
                  {model && (
                    <FullprintTransformation
                      slug={model.slug}
                      name={`${model.name}: ejemplo de personalización`}
                      example={model.example}
                      compact
                    />
                  )}
                </div>
                <div className="fp-list-info">
                  <h3>{row.title}</h3>
                  <p>{row.subtitle}</p>
                </div>
                <div className="fp-list-action">
                  <strong>{row.from}</strong>
                  <span>
                    Ver producto <span aria-hidden="true">↗</span>
                  </span>
                </div>
              </SiteLink>
            );
          })}
        </div>
      </section>

      <p className="wrap print-conditions">
        Impresión incluida según cada producto. Diseño no incluido. Impuestos y transporte se confirman en el presupuesto.
        Imágenes de ejemplo.
      </p>

      <nav className="wrap fp-other-collections" aria-label="Otras colecciones Fullprint">
        <p>Explora otra colección</p>
        {fullprintCollections
          .filter((c) => c.slug !== collection.slug)
          .map((c) => (
            <SiteLink key={c.slug} href={`/fullprint/coleccion/${c.slug}/`}>
              {c.name} ↗
            </SiteLink>
          ))}
      </nav>
    </>
  );
}
