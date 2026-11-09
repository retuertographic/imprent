import type { Metadata } from "next";
import { pageMetadata } from "./metadata";
import { ORIGIN } from "../content";
import { SiteLink } from "../SiteLink";
import { findCategory, pageItems, type ShopCategory } from "./catalog";
import { CatalogBrowser } from "./CatalogBrowser";
import { SeoLocal } from "./SeoLocal";
import { getGroupData } from "./serverData";
import type { ShopGroup } from "./types";

const categoryTitles: Record<string, string> = {
  camisetas: "Camisetas personalizadas",
  sudaderas: "Sudaderas personalizadas",
  polos: "Polos personalizados",
  pantalones: "Pantalones personalizados",
  abrigos: "Abrigos y chaquetas personalizados",
  deporte: "Ropa deportiva personalizada",
  laboral: "Ropa laboral personalizada",
  gorras: "Gorras personalizadas",
  bolsas: "Bolsas personalizadas",
  tazas: "Tazas personalizadas",
  botellas: "Botellas personalizadas",
  libretas: "Libretas personalizadas",
  boligrafos: "Bolígrafos personalizados",
  llaveros: "Llaveros personalizados",
  mochilas: "Mochilas personalizadas",
  tecnologia: "Regalos tecnológicos personalizados",
};

const categoryIntros: Record<string, string> = {
  camisetas:
    "Camisetas personalizadas en Tenerife para empresas, clubes y eventos. Elige modelo, tallas y colores; consulta serigrafía, DTF o sublimación y pide presupuesto.",
  sudaderas:
    "Sudaderas personalizadas en Tenerife para empresas y equipos. Compara modelos, tallas y colores y consulta impresión o bordado según el tejido y tu diseño.",
  polos:
    "Polos personalizados en Tenerife para empresas, hostelería y equipos. Elige tu modelo y consulta bordado o impresión para el logo de tu negocio.",
  deporte:
    "Ropa deportiva personalizada en Tenerife para clubes y eventos. Elige prendas de catálogo con tu logo o consulta nuestras equipaciones fullprint.",
  laboral:
    "Ropa laboral personalizada en Tenerife para tu equipo. Consulta prendas, tallas y marcaje del logo según el tejido y las necesidades de tu actividad.",
};

const groupTexts: Record<
  ShopGroup,
  { name: string; title: string; intro: string; metaTitle: string; metaDescription: string }
> = {
  ropa: {
    name: "Ropa",
    title: "Ropa personalizada",
    intro:
      "Camisetas, polos, sudaderas y ropa de trabajo para empresas, clubes y eventos. Elige tu prenda y consulta el marcaje que mejor encaja con tu diseño.",
    metaTitle: "Ropa personalizada en Tenerife",
    metaDescription:
      "Camisetas, sudaderas, polos y ropa laboral personalizada para empresas, clubes y eventos en Tenerife y Canarias.",
  },
  merchandising: {
    name: "Merchandising",
    title: "Merchandising personalizado",
    intro:
      "Bolsas, tazas, botellas y regalos de empresa con tu marca. Compara productos y consulta cantidades y personalización para tu proyecto.",
    metaTitle: "Merchandising y regalos personalizados en Tenerife",
    metaDescription:
      "Tazas, botellas, bolsas, libretas y regalos promocionales personalizados para empresas y eventos en Tenerife y Canarias.",
  },
};


export const categoryTitle = (c: ShopCategory) => categoryTitles[c.slug] || `${c.name} con tu logo`;
export const categoryIntro = (c: ShopCategory) =>
  categoryIntros[c.slug] ||
  `${categoryTitle(c)} en Tenerife para empresas, eventos y particulares. Compara modelos y consulta cantidades, diseño y presupuesto para Canarias.`;

/** Metadatos de un listado (mismo título y descripción que producción). */
export function shopMetadata(group: ShopGroup, slug?: string): Metadata {
  const category = slug ? findCategory(group, slug) : undefined;
  const path = category ? `/${group}/${category.slug}/` : `/${group}/`;
  const title = category ? `${categoryTitle(category)} en Tenerife` : groupTexts[group].metaTitle;
  const description = category ? categoryIntro(category) : groupTexts[group].metaDescription;
  return pageMetadata(title, description, path);
}

function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [{ name: "Inicio", path: "/" }, ...items].map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.name,
        item: new URL(item.path, ORIGIN).href,
      })),
    },
  ];
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** Listado de ropa o merchandising (grupo completo o una categoría). */
export function ShopPage({ group, slug }: { group: ShopGroup; slug?: string }) {
  const category = slug ? findCategory(group, slug) : undefined;
  if (slug && !category) throw new Error(`Categoría desconocida: ${group}/${slug}`);
  const data = getGroupData(group);
  const categoryId = category?.id ?? "";
  const texts = groupTexts[group];
  const path = category ? `/${group}/${category.slug}/` : `/${group}/`;
  return (
    <main id="contenido" className="brand-main shop-page">
      <div className="wrap">
        <nav className="breadcrumbs" aria-label="Ruta de navegación">
          <SiteLink href="/">Inicio</SiteLink>
          <span>/</span>
          <SiteLink href={`/${group}/`}>{texts.name}</SiteLink>
          {category && (
            <>
              <span>/</span>
              <span>{category.name}</span>
            </>
          )}
        </nav>
        <header className="shop-heading">
          <div>
            <p className="eyebrow">PERSONALIZADO EN TENERIFE · PARA TODAS LAS CANARIAS</p>
            <h1>
              {category ? categoryTitle(category) : texts.title}
              <br />
              <em>en Tenerife.</em>
            </h1>
          </div>
          <p>{category ? categoryIntro(category) : texts.intro}</p>
        </header>
        <CatalogBrowser
          group={group}
          categoryId={categoryId}
          basePath={path}
          initialItems={pageItems(data, categoryId, 0)}
          totalModels={data.lists[categoryId]?.length ?? 0}
        />
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: breadcrumbJsonLd([{ name: category?.name ?? (group === "ropa" ? "Ropa personalizada" : "Merchandising"), path }]),
        }}
      />
      <SeoLocal subject={category?.name} kind={group === "ropa" ? "textil" : "merchandising"} />
    </main>
  );
}

/** Buscador y catálogo general (/productos/). */
export function ProductsPage() {
  const data = getGroupData("ropa");
  return (
    <main id="contenido" className="brand-main shop-page">
      <div className="wrap">
        <header className="shop-heading">
          <div>
            <p className="eyebrow">ROLY + STAMINA · SERITENE</p>
            <h1>
              Un mundo de
              <br />
              <em>posibilidades.</em>
            </h1>
          </div>
          <p>Tu producto. Tu logo. Tu rollo.</p>
        </header>
        <CatalogBrowser
          group="ropa"
          categoryId=""
          basePath="/ropa/"
          initialItems={pageItems(data, "", 0)}
          totalModels={data.lists[""]?.length ?? 0}
          switcher
        />
      </div>
    </main>
  );
}
