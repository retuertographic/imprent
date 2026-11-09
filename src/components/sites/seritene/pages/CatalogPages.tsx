/* eslint-disable @next/next/no-img-element */
import { asset } from "../content";
import { SiteLink } from "../SiteLink";
import { catalogosItems, ropaLaboralItems } from "./catalogSnapshots";
import { Breadcrumbs, FaqSection, PageIntro } from "./common";
import { SeoLocal, ShopBrowser } from "./Shop";

/** /catalogos/ */
export function CatalogosPage() {
  return (
    <main id="contenido" className="brand-main">
      <Breadcrumbs items={[{ label: "Catálogos" }]} />
      <PageIntro eyebrow="ENCUENTRA EL PUNTO DE PARTIDA" title="Tantas formas de ser tú.">
        Explora prendas y soportes. La disponibilidad, la personalización y el precio final se confirman para cada pedido.
      </PageIntro>
      <section className="wrap">
        <ShopBrowser items={catalogosItems} pages={9} nextHref="/ropa/?pagina=2" />
      </section>
      <section className="wrap catalog-destinations">
        <SiteLink href="/productos/" className="catalog-cover light">
          <img src={asset("/seritene-hero-textile.webp")} alt="Textil personalizado de ejemplo" width={1536} height={1024} />
          <div>
            <span>CATÁLOGO · PERSONALIZACIÓN</span>
            <h2>
              Elige.
              <br />
              Personaliza.
              <br />
              Prueba.
            </h2>
            <p>Explora ropa Roly y merchandising Stamina. Elige cantidades, colores y marcajes.</p>
            <b>Abrir configurador</b>
          </div>
        </SiteLink>
        <a
          href="https://www.roly.eu/es/icatalog/urlcatroly"
          target="_blank"
          rel="noreferrer"
          className="catalog-cover catalog-roly"
        >
          <div>
            <span>CATÁLOGO OFICIAL EXTERNO</span>
            <h2>ROLY</h2>
            <p>
              Textil para publicidad, deporte y trabajo. Consulta las colecciones oficiales y envíanos las referencias que
              te interesen.
            </p>
            <b>Ver catálogos de Roly</b>
          </div>
          <span className="catalog-stamp">
            TEXTIL
            <br />
            SPORT
            <br />
            WORKWEAR
          </span>
        </a>
        <SiteLink href="/fullprint/" className="catalog-cover catalog-fullprint">
          <div>
            <span>FABRICACIÓN PROPIA</span>
            <h2>
              Tu diseño.
              <br />
              Al completo.
            </h2>
            <p>Descubre el fullprint y prepara una equipación con identidad propia.</p>
            <b>Explorar fullprint</b>
          </div>
        </SiteLink>
        <SiteLink href="/merchandising/" className="catalog-cover dark">
          <img
            src={asset("/seritene-hero-dark.webp")}
            alt="Regalos promocionales ilustrativos"
            loading="lazy"
            width={1536}
            height={1024}
          />
          <div>
            <span>REGALOS PERSONALIZADOS</span>
            <h2>
              Detalles
              <br />
              que se quedan.
            </h2>
            <b>Explorar merchandising</b>
          </div>
        </SiteLink>
      </section>
      <FaqSection
        faqs={[
          {
            q: "¿Los productos del configurador son reales?",
            a: "Sí. El catálogo muestra modelos de Roly y Stamina con sus variantes. Puedes configurar cantidades y marcajes. Confirmamos disponibilidad, compatibilidad de la personalización y presupuesto antes de producir.",
          },
          {
            q: "Ya tengo una referencia de Roly, ¿qué hago?",
            a: "Envíanos la referencia, color, tallas, cantidad y el diseño. Confirmaremos disponibilidad, técnica y presupuesto.",
          },
        ]}
      />
    </main>
  );
}

/** /ropa-laboral/ */
export function RopaLaboralPage() {
  return (
    <main id="contenido" className="brand-main shop-page">
      <div className="wrap">
        <Breadcrumbs
          className="breadcrumbs"
          items={[{ label: "Ropa", href: "/ropa/" }, { label: "Ropa laboral", plain: true }]}
        />
        <header className="shop-heading">
          <div>
            <p className="eyebrow">PERSONALIZADO EN TENERIFE · PARA TODAS LAS CANARIAS</p>
            <h1>
              Ropa laboral personalizada
              <br />
              <em>en Tenerife.</em>
            </h1>
          </div>
          <p>
            Ropa laboral personalizada en Tenerife para tu equipo. Consulta prendas, tallas y marcaje del logo según el
            tejido y las necesidades de tu actividad.
          </p>
        </header>
        <ShopBrowser items={ropaLaboralItems} pages={5} nextHref="/ropa/laboral/?pagina=2" />
      </div>
      <SeoLocal
        title="Ropa laboral con tu logo en Tenerife"
        text="Prendas para vestir a tu equipo en su actividad diaria. Indica el puesto y el uso; las necesidades de protección requieren comprobar las características de la referencia elegida."
      />
    </main>
  );
}
