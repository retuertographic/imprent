/* eslint-disable @next/next/no-img-element */
import type { ReactNode } from "react";
import { SiteLink } from "../SiteLink";
import { AreaConfigurator, type AreaKind } from "./configurators/AreaConfigurator";
import { FlagConfigurator } from "./configurators/FlagConfigurator";
import { PhotocallConfigurator } from "./configurators/PhotocallConfigurator";
import { RollupConfigurator } from "./configurators/RollupConfigurator";
import { TentConfigurator } from "./configurators/TentConfigurator";
import { supportJsonLd, supportModels } from "./data.generated";
import { Breadcrumbs, JsonLd, src } from "./shared";
import type { FlagProduct, PhotocallProduct, RollupProduct, SupportModelData, TentProduct } from "./types";

const modelRoute = (slug: string) => `/soportes-publicitarios/${slug}/`;
const models = Object.values(supportModels);
const rollups = models.flatMap((m) => (m.configurator === "RollupConfigurator" ? [m.product] : []));
const photocalls = models.flatMap((m) => (m.configurator === "PhotocallConfigurator" ? [m.product] : []));
const tents = models.flatMap((m) => (m.configurator === "TentConfigurator" ? [m.product] : []));

const EYEBROW = "SOPORTES PUBLICITARIOS · TENERIFE Y CANARIAS";

/** Textos de cabecera de las calculadoras por superficie. */
const AREA_PAGES: Record<string, { kind: AreaKind; eyebrow: string; title: string; intro: string; label: string }> = {
  "carton-pluma": {
    kind: "foam",
    eyebrow: "CARTÓN PLUMA · IMPRESIÓN A TODO COLOR",
    title: "Cartón pluma impreso a medida",
    intro: "5 o 10 mm · Mate o brillo · Impresión a color incluida.",
    label: "Calcula tu cartón pluma",
  },
  "imantado-impreso": {
    kind: "magnet",
    eyebrow: "IMANTADOS · 0,5 MM · A TODO COLOR",
    title: "Imantado impreso a medida",
    intro:
      "Lámina de 0,5 mm con vinilo impreso. Mate o brillo. Para superficies metálicas compatibles; consulta su uso en tu vehículo.",
    label: "Calcula tu imantado",
  },
  "lona-impresa": {
    kind: "banner",
    eyebrow: "LONAS · 510 g/m² · OLLADOS INCLUIDOS",
    title: "Lona impresa con ollados",
    intro: "Lona de 510 g/m² · Impresión a color y ollados incluidos.",
    label: "Calcula tu lona",
  },
  "poster-impreso": {
    kind: "poster",
    eyebrow: "PÓSTERES · PAPEL 150 g/m² · IMPRESIÓN INCLUIDA",
    title: "Póster impreso a medida",
    intro: "Papel de 150 g/m² · Impresión UV a todo color incluida.",
    label: "Calcula tu póster",
  },
};

function ProductLayout({ visual, info }: { visual: ReactNode; info: ReactNode }) {
  return (
    <section className="wrap print-product-layout">
      <div className="print-product-visual">{visual}</div>
      <div className="print-product-info">{info}</div>
    </section>
  );
}

function SizeLinks({ label, current, items }: { label: string; current: string; items: { slug: string; label: string }[] }) {
  return (
    <div className="print-field">
      <span>{label}</span>
      <div className="print-choices">
        {items.map((item) => (
          <SiteLink
            key={item.slug}
            className="rollup-size"
            aria-current={item.slug === current ? "page" : undefined}
            href={modelRoute(item.slug)}
          >
            {item.label}
          </SiteLink>
        ))}
      </div>
    </div>
  );
}

function Specs({ items }: { items: string[] }) {
  return (
    <details className="product-info-details">
      <summary>Ficha técnica y qué incluye</summary>
      <ul className="rollup-specs">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </details>
  );
}

function FlagPage({ product }: { product: FlagProduct }) {
  const base = `/catalogue/bandera-${product.slug}-v2`;
  return (
    <ProductLayout
      visual={
        <>
          <SiteLink href="/soportes-publicitarios/" className="print-back">
            Ver todos los soportes
          </SiteLink>
          <div className="custom-product-photo flag-detail-photo">
            <img
              src={src(`${base}.webp`)}
              srcSet={`${src(`${base}-small.webp`)} 480w, ${src(`${base}.webp`)} 1000w`}
              sizes="(max-width:600px) 90vw, 50vw"
              alt={`Bandera ${product.slug} con diseño limpio en verde, blanco y negro y un único logo discreto`}
              width={1000}
              height={1000}
              loading="eager"
              decoding="async"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
            <span className="print-example">Imagen orientativa · Consulta las medidas de cada tamaño</span>
          </div>
          <p className="print-conditions">Imprimimos tu diseño en la bandera. La imagen muestra una propuesta gráfica de ejemplo.</p>
        </>
      }
      info={
        <>
          <p className="eyebrow">{EYEBROW}</p>
          <h1>{product.name}</h1>
          <p className="print-punchline">{product.line}</p>
          <p className="print-description">Elige tamaño y conjunto. Si ya tienes soporte, puedes pedir únicamente la tela.</p>
          <FlagConfigurator product={product} />
        </>
      }
    />
  );
}

function RollupPage({ product }: { product: RollupProduct }) {
  const base = `/catalogue/rollup-${product.width}-v3`;
  return (
    <ProductLayout
      visual={
        <>
          <SiteLink href="/soportes-publicitarios/#rollups" className="print-back">
            Ver todos los roll-ups
          </SiteLink>
          <div className="custom-product-photo rollup-detail-art">
            <img
              className="rollup-mockup"
              src={src(`${base}.webp`)}
              srcSet={`${src(`${base}-small.webp`)} 480w, ${src(`${base}.webp`)} 1000w`}
              sizes="(max-width:600px) 90vw, (max-width:1000px) 45vw, 500px"
              alt={`Mockup realista de roll-up de ${product.width} × ${product.height} cm con diseño Seritene en verde, negro y blanco y estructura de aluminio`}
              width={1000}
              height={1000}
              loading="eager"
              decoding="async"
            />
          </div>
          <p className="print-conditions">Mockup orientativo. Personalizamos la gráfica con tu diseño.</p>
        </>
      }
      info={
        <>
          <p className="eyebrow">{EYEBROW}</p>
          <h1>{product.name}</h1>
          <p className="print-description">Impresión a color y bolsa de transporte incluidas.</p>
          <SizeLinks
            label="Elige tamaño"
            current={product.slug}
            items={rollups.map((r) => ({ slug: r.slug, label: `${r.width} × ${r.height} cm` }))}
          />
          <RollupConfigurator product={product} />
          <Specs
            items={[
              `Medidas: ${product.width} × ${product.height} cm.`,
              "Estructura de aluminio con mecanismo enrollable.",
              "Tejido Oxford de 200 g/m² e impresión por sublimación a todo color.",
              "Bolsa de transporte incluida.",
            ]}
          />
        </>
      }
    />
  );
}

function PhotocallPage({ product }: { product: PhotocallProduct }) {
  const base = `/catalogue/photocall-${product.size.toLowerCase()}-v2`;
  return (
    <ProductLayout
      visual={
        <>
          <SiteLink href="/soportes-publicitarios/#photocalls" className="print-back">
            Ver todos los photocalls
          </SiteLink>
          <div className="custom-product-photo photocall-detail-art">
            <img
              className="photocall-mockup"
              src={src(`${base}.webp`)}
              srcSet={`${src(`${base}-small.webp`)} 480w, ${src(`${base}.webp`)} 1000w`}
              sizes="(max-width:600px) 90vw, 50vw"
              alt={`Mockup de photocall ${product.size} con diseño Seritene y estructura plegable`}
              width={1000}
              height={1000}
              loading="eager"
              decoding="async"
            />
          </div>
          <p className="print-conditions">Mockup orientativo. Personalizamos la gráfica con tu diseño.</p>
        </>
      }
      info={
        <>
          <p className="eyebrow">PHOTOCALLS · PACK COMPLETO</p>
          <h1>
            {product.name} · {product.size}
          </h1>
          <p className="print-description">Estructura plegable, gráfica impresa y bolsa incluidas.</p>
          <SizeLinks
            label="Elige formato"
            current={product.slug}
            items={photocalls.map((p) => ({ slug: p.slug, label: `${p.size} · ${p.modules}` }))}
          />
          <PhotocallConfigurator product={product} />
          <Specs
            items={[
              `Gráfica: ${product.width} × ${product.height} cm.`,
              `Estructura plegable de ${product.modules} módulos.`,
              "Poliéster textil de 210 g/m² impreso.",
              "Bolsa de transporte de nylon incluida.",
            ]}
          />
        </>
      }
    />
  );
}

function TentPage({ product }: { product: TentProduct }) {
  const base = `/catalogue/carpa-${product.image}-v3`;
  return (
    <ProductLayout
      visual={
        <>
          <SiteLink href="/soportes-publicitarios/#carpas" className="print-back">
            Ver todas las carpas
          </SiteLink>
          <div className="custom-product-photo tent-detail-art">
            <img
              className="tent-mockup"
              src={src(`${base}.webp`)}
              srcSet={`${src(`${base}-small.webp`)} 480w, ${src(`${base}.webp`)} 1000w`}
              sizes="(max-width:760px) 94vw, 50vw"
              alt={`Carpa ${product.size} con diseño Seritene: imagen orientativa`}
              width={1280}
              height={1280}
              loading="eager"
              decoding="async"
            />
          </div>
          <p className="print-conditions">Imagen orientativa. Personalizamos el techo con tu diseño.</p>
        </>
      }
      info={
        <>
          <p className="eyebrow">CARPAS PERSONALIZADAS · PACK COMPLETO</p>
          <h1>{product.name}</h1>
          <p className="print-description">Estructura, techo impreso y bolsa con ruedas incluidos.</p>
          <SizeLinks label="Elige medida" current={product.slug} items={tents.map((t) => ({ slug: t.slug, label: t.size }))} />
          <TentConfigurator product={product} />
          <Specs
            items={[
              `Medida de la carpa: ${product.size}.`,
              "Aluminio con perfil hexagonal de 40 mm.",
              "Estructura plegable y techo personalizado incluido.",
              "Poliéster impermeable de 260 g/m².",
              "Bolsa de transporte de nylon con ruedas.",
            ]}
          />
          <details className="product-info-details tent-accessories">
            <summary>Accesorios opcionales</summary>
            <p>
              Pared completa, media pared, pared con ventana o estor, techo de recambio y contrapesos. Consulta compatibilidad y
              presupuesto por separado.
            </p>
          </details>
        </>
      }
    />
  );
}

function AreaPage({ slug }: { slug: string }) {
  const page = AREA_PAGES[slug];
  return (
    <>
      <section className="wrap foam-intro">
        <p className="eyebrow">{page.eyebrow}</p>
        <h1>{page.title}</h1>
        <p>{page.intro}</p>
      </section>
      <section className="wrap foam-main" aria-label={page.label}>
        <AreaConfigurator kind={page.kind} />
      </section>
    </>
  );
}

function ModelBody({ slug, model }: { slug: string; model: SupportModelData }) {
  switch (model.configurator) {
    case "FlagConfigurator":
      return <FlagPage product={model.product} />;
    case "RollupConfigurator":
      return <RollupPage product={model.product} />;
    case "PhotocallConfigurator":
      return <PhotocallPage product={model.product} />;
    case "TentConfigurator":
      return <TentPage product={model.product} />;
    default:
      return <AreaPage slug={slug} />;
  }
}

/** Ficha de un soporte publicitario (bandera, roll-up, photocall, carpa o calculadora por superficie). */
export function SupportModelPage({ slug }: { slug: string }) {
  const model = supportModels[slug];
  return (
    <main id="contenido" className="brand-main print-main custom-catalog">
      <JsonLd json={supportJsonLd[modelRoute(slug)]} />
      <Breadcrumbs data={model.breadcrumbs} />
      <ModelBody slug={slug} model={model} />
    </main>
  );
}
