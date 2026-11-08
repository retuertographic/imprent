#!/usr/bin/env node
/**
 * Extrae del HTML servido por seritene.com los datos de las páginas de soportes publicitarios,
 * eventos y medallas, y genera:
 *   src/components/sites/seritene/soportes/data.generated.ts
 *   src/components/sites/seritene/eventos/data.generated.ts
 *
 * Uso: node scripts/extract-seritene-soportes-eventos.mjs <carpeta-html>
 * La carpeta contiene un HTML por ruta con "/" → "__" (p. ej. soportes-publicitarios__vela.html).
 * Si no se pasa carpeta, descarga cada página de https://seritene.com.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import {
  byClass,
  byType,
  children,
  find,
  findAll,
  hasClass,
  isNode,
  mainOf,
  metaOf,
  readRscRows,
  resolveTree,
  text,
} from "./lib/seritene-rsc.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_SOPORTES = join(ROOT, "src/components/sites/seritene/soportes/data.generated.ts");
const OUT_EVENTOS = join(ROOT, "src/components/sites/seritene/eventos/data.generated.ts");

const SUPPORT_MODELS = [
  "vela", "gota", "carpa-3x3", "carpa-3x4-5", "carpa-3x6", "photocall-3x3", "photocall-3x4", "photocall-3x5",
  "photocall-3x6", "roll-up-85x200", "roll-up-100x200", "roll-up-120x200", "roll-up-150x200", "carton-pluma",
  "imantado-impreso", "lona-impresa", "poster-impreso",
];
const SUPPORT_COLLECTIONS = ["banderas", "rollups", "photocalls", "carpas"];
const EVENT_COLLECTIONS = ["abanicos", "vasos", "placas", "pulseras"];
const EVENT_PRODUCTS = [
  "abanico-ab001", "abanico-ab002", "abanico-ab003", "abanico-ab004", "vaso-400-ml", "vaso-500-ml", "vaso-900-ml",
  "trofeo-metacrilato-5-mm",
];
const MEDALS = "/merchandising/medallas-personalizadas/";
const MEDAL_PRODUCT = "/merchandising/medallas-personalizadas/metacrilato-8-cm/";

const routes = [
  "/soportes-publicitarios/",
  ...SUPPORT_COLLECTIONS.map((s) => `/soportes-publicitarios/coleccion/${s}/`),
  ...SUPPORT_MODELS.map((s) => `/soportes-publicitarios/${s}/`),
  "/eventos/",
  ...EVENT_COLLECTIONS.map((s) => `/eventos/${s}/`),
  ...EVENT_PRODUCTS.map((s) => `/eventos/producto/${s}/`),
  MEDALS,
  MEDAL_PRODUCT,
];

const htmlDir = process.argv[2] ?? join(tmpdir(), "seritene-html");
const fileFor = (route) => join(htmlDir, route.replace(/^\/|\/$/g, "").replaceAll("/", "__") + ".html");

async function ensureHtml() {
  if (!existsSync(htmlDir)) mkdirSync(htmlDir, { recursive: true });
  for (const route of routes) {
    const file = fileFor(route);
    if (existsSync(file)) continue;
    const res = await fetch(`https://seritene.com${route}`);
    if (!res.ok) throw new Error(`${route}: HTTP ${res.status}`);
    writeFileSync(file, await res.text());
  }
}

/* ---------- helpers ---------- */

function load(route) {
  const { rows, refs, html } = readRscRows(fileFor(route));
  const main = mainOf(rows, refs);
  const ld = find(main, (n) => n.type === "script" && n.props.type === "application/ld+json");
  return { rows, refs, main, meta: metaOf(html), jsonLd: ld?.props.dangerouslySetInnerHTML?.__html ?? null };
}

function clientProps(route, name) {
  const { rows, refs } = readRscRows(fileFor(route));
  for (const v of rows.values()) {
    const tree = resolveTree(v, rows, refs);
    const node = find(tree, (n) => n.type === name);
    if (node) {
      const props = { ...node.props };
      delete props.children;
      return props;
    }
  }
  return null;
}

const IMG_KEYS = ["className", "src", "srcSet", "sizes", "alt", "width", "height", "loading", "fetchPriority", "decoding", "style"];
function img(n) {
  const out = {};
  for (const k of IMG_KEYS) if (n.props[k] !== undefined) out[k] = n.props[k];
  for (const k of ["width", "height"]) if (typeof out[k] === "string" && /^\d+$/.test(out[k])) out[k] = Number(out[k]);
  return out;
}

const textOf = (root, cls) => {
  const n = find(root, byClass(cls));
  return n ? text(n) : undefined;
};

function breadcrumbs(main) {
  const nav = find(main, byClass("breadcrumbs"));
  return {
    className: nav.props.className,
    items: children(nav)
      .filter((n) => isNode(n) && !(n.type === "span" && text(n) === "/"))
      .map((n) => (n.type === "a" ? { label: text(n), href: n.props.href } : { label: text(n), current: n.props["aria-current"] === "page" })),
  };
}

function supportCard(a) {
  const art = find(a, byClass("support-product-art"));
  const imageNode = find(art, byType("img"));
  const price = find(a, byClass("support-product-price"));
  const card = {
    href: a.props.href,
    ...(a.props.id ? { id: a.props.id } : {}),
    collectionImage: Boolean(find(art, byClass("support-collection-image"))),
    image: img(imageNode),
    ...(find(a, byClass("support-product-category")) ? { category: textOf(a, "support-product-category") } : {}),
    name: text(find(a, byType("h3"))),
    detail: textOf(a, "support-product-detail"),
    ...(find(a, byClass("support-product-description")) ? { description: textOf(a, "support-product-description") } : {}),
    ...(price
      ? { price: { strong: text(find(price, byType("strong"))), small: text(find(price, byType("small"))) } }
      : {}),
    action: text(children(find(a, byClass("support-product-action")))[0]),
  };
  return card;
}

function supportSection(section) {
  const results = find(section, byClass("support-results"));
  const grid = find(section, byClass("support-product-grid"));
  return {
    className: section.props.className,
    ...(section.props.id ? { id: section.props.id } : {}),
    label: section.props["aria-label"],
    title: text(find(results, byType("h2"))),
    count: text(find(results, byType("p"))).replace(/\s+/g, " "),
    gridClassName: grid.props.className,
    cards: findAll(grid, byClass("support-product")).map(supportCard),
    ...(find(section, byClass("support-product-note")) ? { note: textOf(section, "support-product-note") } : {}),
  };
}

function shopCard(article) {
  const photo = find(article, byClass("shop-card-photo"));
  const info = find(article, byClass("shop-card-info"));
  const heading = find(info, (n) => n.type === "h2" || n.type === "h3");
  const bottom = find(info, byClass("shop-card-bottom"));
  const small = find(bottom, byType("small"));
  const badge = find(photo, byClass("shop-card-badge"));
  return {
    href: photo.props.href,
    photoClassName: photo.props.className,
    image: img(find(photo, byType("img"))),
    ...(badge ? { badge: text(badge) } : {}),
    ref: text(find(info, byClass("shop-ref"))),
    heading: heading.type,
    name: text(heading),
    description: textOf(info, "shop-card-description"),
    ...(small ? { small: text(small) } : {}),
    strong: text(find(bottom, byType("strong"))),
    action: textOf(bottom, "shop-configure"),
  };
}

function eventsHeading(main) {
  const h = find(main, byClass("events-heading"));
  const h1 = find(h, byType("h1"));
  const em = find(h1, byType("em"));
  return {
    eyebrow: textOf(h, "eyebrow"),
    title: text(children(h1)[0]),
    ...(em ? { em: text(em) } : {}),
    intro: text(children(h).filter((n) => n.type === "p" && !hasClass(n, "eyebrow"))[0]),
  };
}

function staticProduct(route) {
  const { main, meta, jsonLd } = load(route);
  const content = find(main, byClass("static-product-content"));
  const boxes = findAll(content, byClass("static-product-box"));
  const box = (title) => boxes.find((b) => text(find(b, byType("h2"))) === title);
  const specs = box("Características");
  const prices = box("Precios por cantidad");
  const custom = box("Personalización disponible");
  const table = find(prices, byType("table"));
  const order = clientProps(route, "OrderActions");
  return {
    route,
    meta,
    jsonLd,
    breadcrumbs: breadcrumbs(main),
    gallery: findAll(find(main, byClass("static-product-gallery")), byType("figure")).map((f) => ({
      image: img(find(f, byType("img"))),
      caption: text(find(f, byType("figcaption"))),
    })),
    eyebrow: text(find(content, byClass("eyebrow"))),
    name: text(find(content, byType("h1"))),
    description: textOf(content, "static-product-description"),
    specs: findAll(specs, byType("li")).map(text),
    priceLead: textOf(prices, "static-price-lead"),
    priceDetail: textOf(prices, "static-price-detail"),
    table: {
      caption: text(find(table, byType("caption"))),
      head: findAll(find(table, byType("thead")), byType("th")).map(text),
      rows: findAll(find(table, byType("tbody")), byType("tr")).map((tr) => ({
        label: text(find(tr, byType("th"))),
        cells: findAll(tr, byType("td")).map(text),
      })),
    },
    priceNotes: findAll(prices, byClass("static-price-note")).map(text),
    customization: findAll(custom, byType("p")).map(text),
    order: { name: order.name, message: order.message, image: order.image },
    footNote: text(children(content).filter((n) => hasClass(n, "static-price-note")).at(-1)),
  };
}

/* ---------- soportes ---------- */

function soportes() {
  const meta = {};
  const jsonLd = {};
  const landing = load("/soportes-publicitarios/");
  meta["/soportes-publicitarios/"] = landing.meta;
  jsonLd["/soportes-publicitarios/"] = landing.jsonLd;
  const landingHeading = eventsHeading(landing.main);
  const landingSection = supportSection(find(landing.main, byClass("support-products")));
  const help = find(landing.main, byClass("support-shop-help"));
  const landingHelp = {
    title: text(find(help, byType("h2"))),
    text: text(find(help, byType("p"))),
    href: find(help, byType("a")).props.href,
    action: text(children(find(help, byType("a")))[0]).trim(),
  };

  const collections = {};
  for (const slug of SUPPORT_COLLECTIONS) {
    const route = `/soportes-publicitarios/coleccion/${slug}/`;
    const page = load(route);
    meta[route] = page.meta;
    jsonLd[route] = page.jsonLd;
    const intro = find(page.main, byClass("support-shop-intro"));
    const h1 = find(intro, byType("h1"));
    collections[slug] = {
      breadcrumbs: breadcrumbs(page.main),
      back: { href: find(intro, byClass("print-back")).props.href, label: textOf(intro, "print-back") },
      title: text(children(h1)[0]),
      em: text(find(h1, byType("em"))),
      intro: text(children(intro).find((n) => n.type === "p")),
      section: supportSection(find(page.main, byClass("support-products"))),
    };
  }

  const models = {};
  for (const slug of SUPPORT_MODELS) {
    const route = `/soportes-publicitarios/${slug}/`;
    const page = load(route);
    meta[route] = page.meta;
    jsonLd[route] = page.jsonLd;
    const names = ["FlagConfigurator", "RollupConfigurator", "PhotocallConfigurator", "TentConfigurator", "FoamConfigurator", "MagnetConfigurator", "BannerConfigurator", "PosterConfigurator"];
    let configurator = null;
    let product = null;
    for (const name of names) {
      const props = clientProps(route, name);
      if (props) {
        configurator = name;
        product = props.product ?? null;
        break;
      }
    }
    models[slug] = { configurator, product, breadcrumbs: breadcrumbs(page.main) };
  }

  const banner = "// Generado por scripts/extract-seritene-soportes-eventos.mjs — no editar a mano.\n";
  const body = `${banner}import type { PageMeta, SupportCollectionData, SupportLandingData, SupportModelData } from "./types";

export const supportMeta: Record<string, PageMeta> = ${JSON.stringify(meta, null, 2)};

export const supportJsonLd: Record<string, string | null> = ${JSON.stringify(jsonLd, null, 2)};

export const supportLanding: SupportLandingData = ${JSON.stringify({ heading: landingHeading, section: landingSection, help: landingHelp }, null, 2)};

export const supportCollections: Record<string, SupportCollectionData> = ${JSON.stringify(collections, null, 2)};

export const supportModels: Record<string, SupportModelData> = ${JSON.stringify(models, null, 2)};
`;
  mkdirSync(dirname(OUT_SOPORTES), { recursive: true });
  writeFileSync(OUT_SOPORTES, body);
}

/* ---------- eventos ---------- */

function eventos() {
  const meta = {};
  const jsonLd = {};
  const landing = load("/eventos/");
  meta["/eventos/"] = landing.meta;
  jsonLd["/eventos/"] = landing.jsonLd;
  const landingData = {
    breadcrumbs: breadcrumbs(landing.main),
    heading: eventsHeading(landing.main),
    section: supportSection(find(landing.main, byClass("support-products"))),
  };

  const collections = {};
  for (const slug of EVENT_COLLECTIONS) {
    const route = `/eventos/${slug}/`;
    const page = load(route);
    meta[route] = page.meta;
    jsonLd[route] = page.jsonLd;
    const wrap = children(page.main).find((n) => hasClass(n, "wrap"));
    const list = find(page.main, byClass("event-product-list"));
    const support = find(page.main, byClass("support-products"));
    collections[slug] = {
      wrapClassName: wrap.props.className,
      breadcrumbs: breadcrumbs(page.main),
      heading: eventsHeading(page.main),
      ...(list ? { products: findAll(list, byClass("shop-card")).map(shopCard) } : {}),
      ...(support ? { section: supportSection(support) } : {}),
    };
  }

  const medalsPage = load(MEDALS);
  meta[MEDALS] = medalsPage.meta;
  jsonLd[MEDALS] = medalsPage.jsonLd;
  const medals = {
    wrapClassName: children(medalsPage.main).find((n) => hasClass(n, "wrap")).props.className,
    breadcrumbs: breadcrumbs(medalsPage.main),
    heading: eventsHeading(medalsPage.main),
    products: findAll(find(medalsPage.main, byClass("event-product-list")), byClass("shop-card")).map(shopCard),
  };

  const products = {};
  for (const slug of EVENT_PRODUCTS) {
    const p = staticProduct(`/eventos/producto/${slug}/`);
    meta[p.route] = p.meta;
    products[slug] = p;
  }
  const medalProduct = staticProduct(MEDAL_PRODUCT);
  meta[MEDAL_PRODUCT] = medalProduct.meta;

  const banner = "// Generado por scripts/extract-seritene-soportes-eventos.mjs — no editar a mano.\n";
  const body = `${banner}import type { EventCollectionData, EventLandingData, PageMeta, StaticProductData } from "./types";

export const eventMeta: Record<string, PageMeta> = ${JSON.stringify(meta, null, 2)};

export const eventJsonLd: Record<string, string | null> = ${JSON.stringify(jsonLd, null, 2)};

export const eventLanding: EventLandingData = ${JSON.stringify(landingData, null, 2)};

export const eventCollections: Record<string, EventCollectionData> = ${JSON.stringify(collections, null, 2)};

export const medalCollection: EventCollectionData = ${JSON.stringify(medals, null, 2)};

export const eventProducts: Record<string, StaticProductData> = ${JSON.stringify(products, null, 2)};

export const medalProduct: StaticProductData = ${JSON.stringify(medalProduct, null, 2)};
`;
  mkdirSync(dirname(OUT_EVENTOS), { recursive: true });
  writeFileSync(OUT_EVENTOS, body);
}

await ensureHtml();
soportes();
eventos();
console.log("Datos generados:\n " + OUT_SOPORTES + "\n " + OUT_EVENTOS);
