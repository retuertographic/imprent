#!/usr/bin/env node
/**
 * Extrae los datos de Fullprint (landing, colecciones y fichas de modelo) del HTML
 * renderizado en servidor de seritene.com y genera
 * `src/components/sites/seritene/fullprint/data.ts`.
 *
 * Uso:
 *   node scripts/extract-fullprint.mjs [carpeta-html]
 *
 * La carpeta contiene un .html por página con la ruta aplanada (`/` → `__`):
 * `fullprint.html`, `fullprint__coleccion__ropa.html`, `fullprint__fitpro.html`…
 * Si no se indica, se descargan las páginas de https://seritene.com a una carpeta temporal.
 *
 * Las fichas de modelo llevan sus datos (variantes, tarifas, tejidos, extras, fotos…)
 * en la carga RSC incrustada en el HTML; la landing y las colecciones se leen del marcado.
 */
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "src/components/sites/seritene/fullprint/data.ts");
const PUBLIC = join(ROOT, "public/sites/seritene");
const ORIGIN = "https://seritene.com";

const COLLECTIONS = ["ropa", "delantales", "bolsas", "complementos", "eventos", "toallas"];

const fileFor = (path) => `${path.replace(/^\/|\/$/g, "").replace(/\//g, "__") || "index"}.html`;

async function loadPages(paths) {
  let dir = process.argv[2];
  if (!dir) {
    dir = mkdtempSync(join(tmpdir(), "seritene-fullprint-"));
    console.log(`Descargando ${paths.length} páginas en ${dir}`);
  }
  const pages = new Map();
  for (const path of paths) {
    const file = join(dir, fileFor(path));
    if (!existsSync(file)) {
      const res = await fetch(ORIGIN + path);
      if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
      writeFileSync(file, await res.text());
    }
    pages.set(path, readFileSync(file, "utf8"));
  }
  return pages;
}

// ---------- utilidades de HTML ----------

const decode = (s) =>
  s
    .replace(/<!-- -->/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");

const text = (s) => decode(s.replace(/<!-- -->/g, "").replace(/<[^>]+>/g, "")).trim();

function must(re, s, label) {
  const m = re.exec(s);
  if (!m) throw new Error(`No encontrado: ${label}`);
  return m;
}

function mainOf(html) {
  const i = html.indexOf("<main");
  const j = html.indexOf("</main>");
  if (i < 0 || j < 0) throw new Error("Sin <main>");
  return html.slice(i, j + 7);
}

function metaOf(html, path) {
  const title = decode(must(/<title>([^<]*)<\/title>/, html, `title ${path}`)[1]);
  const description = decode(must(/<meta name="description" content="([^"]*)"/, html, `description ${path}`)[1]);
  const suffix = " | Seritene";
  if (!title.endsWith(suffix)) throw new Error(`Título inesperado en ${path}: ${title}`);
  return { title: title.slice(0, -suffix.length), description };
}

/** JSON-LD propio de la página (dentro de <main>). */
function jsonLdOf(html) {
  const m = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(mainOf(html));
  return m ? JSON.parse(m[1]) : null;
}

/** Concatena las filas RSC incrustadas en el HTML. */
function rscOf(html) {
  const re = /\.rsc\.push\(("(?:[^"\\]|\\.)*")\)<\/script>/g;
  let out = "";
  for (const m of html.matchAll(re)) out += JSON.parse(m[1]);
  return out;
}

/** Lee el objeto JSON que empieza en `start` respetando cadenas. */
function readJsonObject(s, start) {
  let depth = 0;
  let inString = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inString) {
      if (c === "\\") i++;
      else if (c === '"') inString = false;
    } else if (c === '"') inString = true;
    else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return JSON.parse(s.slice(start, i + 1));
  }
  throw new Error("Objeto JSON sin cerrar");
}

/** Bloque `.fp-transform` (ejemplo de diseño) incrustado en el marcado. */
function exampleOf(fragment, label) {
  const m = must(
    /<div class="fp-transform[^"]*" data-paused="false" data-shape="([a-z]+)" style="--fp-accent:(#[0-9a-f]+);--fp-secondary:(#[0-9a-f]+);--fp-ink:(#[0-9a-f]+)"><div class="fp-transform-square" role="img" aria-label="([^"]*)">[\s\S]*?<img src="([^"]+)"[\s\S]*?<small>([^<]*)<\/small>/,
    fragment,
    `ejemplo ${label}`,
  );
  const [, shape, accent, secondary, ink, ariaLabel, src, name] = m;
  const use = /Diseño ficticio para (.*)\.$/.exec(decode(ariaLabel))?.[1] ?? "";
  return { name: decode(name), use, accent, secondary, ink, shape, image: src };
}

// ---------- extracción ----------

function extractLanding(html) {
  const main = mainOf(html);
  const covers = [...main.matchAll(/<a class="fp-collection-cover" id="([a-z]+)"[\s\S]*?<\/a>/g)].map(([block, slug]) => ({
    slug,
    bg: must(/--cover-bg:(#[0-9a-f]+)/, block, "cover-bg")[1],
    ink: must(/--cover-ink:(#[0-9a-f]+)/, block, "cover-ink")[1],
    word: text(must(/<span class="fp-cover-word">([^<]*)<\/span>/, block, "word")[1]),
    image: must(/<div class="fp-cover-product"><img src="([^"]+)"/, block, "image")[1],
    name: text(must(/<h3>([^<]*)<\/h3>/, block, "h3")[1]),
    summary: text(must(/<\/h3><p>([\s\S]*?)<\/p>/, block, "p")[1]),
    count: Number(text(must(/<small>([\s\S]*?)<\/small>/, block, "count")[1]).split(/\s/)[0]),
  }));
  if (covers.length !== COLLECTIONS.length) throw new Error("Landing: colecciones inesperadas");
  return covers;
}

function extractCollection(html, slug) {
  const main = mainOf(html);
  const rows = [...main.matchAll(/<a class="fp-product-row" href="\/fullprint\/([a-z-]+)\/">([\s\S]*?)<\/a>/g)].map(
    ([, product, block]) => ({
      slug: product,
      title: text(must(/<h3>([\s\S]*?)<\/h3>/, block, "h3")[1]),
      subtitle: text(must(/<div class="fp-list-info"><h3>[\s\S]*?<\/h3><p>([\s\S]*?)<\/p>/, block, "p")[1]),
      from: text(must(/<strong>([\s\S]*?)<\/strong>/, block, "desde")[1]),
    }),
  );
  return {
    slug,
    line: text(must(/<\/h1><p>([\s\S]*?)<\/p>/, main, `línea ${slug}`)[1]),
    rows,
  };
}

function extractModel(html, slug) {
  const rsc = rscOf(html);
  const start = rsc.indexOf('{"product":{"slug"');
  if (start < 0) throw new Error(`${slug}: sin datos de producto`);
  const { product, collection } = readJsonObject(rsc, start);
  if (product.slug !== slug) throw new Error(`${slug}: slug distinto (${product.slug})`);
  if (JSON.stringify(product).includes('"$')) throw new Error(`${slug}: referencias RSC sin resolver`);
  return { product, collection, example: exampleOf(mainOf(html), slug) };
}

/**
 * Imagen que la ficha guarda en el carrito: primera foto, recorte optimizado del arte
 * (tabla del módulo catalog-image de la web) o el arte original.
 */
async function cartImageResolver(html) {
  const chunk = /\/_next\/static\/chunks\/catalog-image-[\w-]+\.js/.exec(html)?.[0];
  const crops = new Map();
  if (chunk) {
    const res = await fetch(ORIGIN + chunk);
    if (res.ok) {
      const js = await res.text();
      for (const m of js.matchAll(/"([^"]+)":\{src:`[^`]+`,small:`([^`]+)`/g)) crops.set(m[1], m[2]);
    }
  }
  if (!crops.size) console.warn("Sin tabla de recortes (catalog-image): el carrito usará el arte original.");
  return (product) => product.photos?.[0]?.src || crops.get([product.art.src, ...product.art.crop].join(":")) || product.art.src;
}

// ---------- comprobaciones de recursos ----------

function collectImages(value, out = new Set()) {
  if (typeof value === "string" && /^\/[^/].*\.(webp|png|jpe?g|svg)$/.test(value)) out.add(value);
  else if (Array.isArray(value)) value.forEach((v) => collectImages(v, out));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => collectImages(v, out));
  return out;
}

const smallOf = (src) => src.replace(/\.webp$/, "-small.webp");

// ---------- principal ----------

const landingPath = "/fullprint/";
const collectionPaths = COLLECTIONS.map((c) => `/fullprint/coleccion/${c}/`);

const first = await loadPages([landingPath, ...collectionPaths]);
const covers = extractLanding(first.get(landingPath));
const collections = COLLECTIONS.map((slug) => {
  const html = first.get(`/fullprint/coleccion/${slug}/`);
  const cover = covers.find((c) => c.slug === slug);
  return {
    ...cover,
    ...extractCollection(html, slug),
    meta: metaOf(html, slug),
    jsonLd: jsonLdOf(html),
  };
});

const modelSlugs = collections.flatMap((c) => c.rows.map((r) => r.slug));
const modelPages = await loadPages(modelSlugs.map((s) => `/fullprint/${s}/`));
const cartImage = await cartImageResolver(modelPages.get(`/fullprint/${modelSlugs[0]}/`));
const models = modelSlugs.map((slug) => {
  const html = modelPages.get(`/fullprint/${slug}/`);
  const model = extractModel(html, slug);
  return { ...model, cartImage: cartImage(model.product), meta: metaOf(html, slug), jsonLd: jsonLdOf(html) };
});

// La línea de colección de cada ficha debe coincidir con la de la colección.
for (const m of models) {
  const c = collections.find((c) => c.slug === m.collection.slug);
  if (!c || c.line !== m.collection.line || c.name !== m.collection.name) {
    throw new Error(`${m.product.slug}: colección incoherente`);
  }
}

const landing = { meta: metaOf(first.get(landingPath), "landing"), jsonLd: jsonLdOf(first.get(landingPath)) };

// `cartImage` es una ruta de seritene.com que solo lee el carrito de producción: no se publica aquí.
const images = collectImages({ collections, models: models.map((m) => ({ ...m, cartImage: undefined })) });
for (const m of models) {
  images.add(smallOf(m.example.image));
  for (const p of m.product.photos ?? []) images.add(p.small);
}
for (const c of collections) images.add(smallOf(c.image));
const missing = [...images].filter((src) => !existsSync(join(PUBLIC, src)));
if (missing.length) console.warn(`Recursos que faltan en public/sites/seritene:\n  ${missing.join("\n  ")}`);

const json = (v) => JSON.stringify(v, null, 2);
const output = `/* Generado por scripts/extract-fullprint.mjs a partir de seritene.com. No editar a mano. */
import type { FullprintCollection, FullprintModel, PageMeta } from "./types";

export const fullprintLanding: { meta: PageMeta; jsonLd: unknown } = ${json(landing)};

export const fullprintCollections: FullprintCollection[] = ${json(collections)};

export const fullprintModels: FullprintModel[] = ${json(
  models.map(({ product, example, cartImage, meta, jsonLd, collection }) => ({
    ...product,
    collection: collection.slug,
    example,
    cartImage,
    meta,
    jsonLd,
  })),
)};
`;
writeFileSync(OUT, output);
console.log(`Escrito ${OUT}: ${collections.length} colecciones, ${models.length} modelos, ${images.size} imágenes (${missing.length} faltan).`);
