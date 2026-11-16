#!/usr/bin/env node
/**
 * Fichas de producto de seritene.com (Stamina, Roly y JHK) → datos estáticos del clon.
 *
 * Descarga cada `https://seritene.com/producto/<marca>/<id>/`:
 *   stamina  1.584 modelos de public/sites/seritene/shop-data/merchandising.json
 *   roly       407 modelos de public/sites/seritene/shop-data/ropa.json (marca roly)
 *   jhk         12 códigos de public/sites/seritene/shop-data/ropa.json (marca jhk)
 * lee del payload RSC las props de `ShopProduct` (producto, variantes, tarifas, embalaje, contexto
 * de la ficha), el JSON-LD y los metadatos, y escribe:
 *
 *   src/components/sites/seritene/merch/data/<marca>/<id>.json   una ficha por modelo
 *   src/components/sites/seritene/merch/productIds.generated.ts  ids con ficha local (enlaces)
 *
 * El servidor de Next las lee al generar cada página (merch/serverData.ts), así que no se publican
 * como archivos: cada ficha va incrustada en el HTML de su página. Las tarifas y el stock del día los
 * pone scripts/refresh-merch-pricing.mjs (merch-pricing.json y roly-pricing.json). Las fotos de JHK
 * las sirve seritene.com (/images/jhk/…): se copian a public/sites/seritene/images/jhk/.
 *
 * Uso: node scripts/extract-merch-products.mjs --cache <dir> [--brand stamina,roly,jhk] [--refresh] [--only 1000,1001]
 *   --cache    carpeta donde se guarda el HTML descargado (las repeticiones no vuelven a pedirlo)
 *   --brand    marcas a extraer (por defecto, las tres)
 *   --refresh  vuelve a descargar aunque esté en la caché
 *   --only     solo esos modelos (con una sola marca; útil para probar)
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readRscRows } from "./lib/seritene-rsc.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "public/sites/seritene/shop-data");
const OUT = join(ROOT, "src/components/sites/seritene/merch/data");
const JHK_IMAGES = join(ROOT, "public/sites/seritene/images/jhk");
const ORIGIN = "https://seritene.com";
const CONCURRENCY = 4;
const BRANDS = ["stamina", "roly", "jhk"];

const args = process.argv.slice(2);
const arg = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null);
const cacheDir = arg("--cache");
if (!cacheDir) {
  console.error("Uso: node scripts/extract-merch-products.mjs --cache <dir> [--brand stamina,roly,jhk] [--refresh] [--only 1000,1001]");
  process.exit(1);
}
const refresh = args.includes("--refresh");
const brands = arg("--brand")?.split(",") ?? BRANDS;
if (brands.some((b) => !BRANDS.includes(b))) throw new Error(`Marca desconocida: ${brands.join(",")}`);
const only = arg("--only")?.split(",");
if (only && brands.length !== 1) throw new Error("--only necesita una sola marca (--brand)");

const merch = JSON.parse(readFileSync(join(DATA, "merchandising.json"), "utf8"));
const ropa = JSON.parse(readFileSync(join(DATA, "ropa.json"), "utf8"));
/** Ids de cada marca en el orden del listado de producción (modelo de 4 cifras; código en JHK). */
function brandIds(brand) {
  if (brand === "stamina") return merch.lists[""];
  return ropa.lists[""]
    .map((key) => ropa.products[key])
    .filter((p) => p?.brand === brand)
    .map((p) => (brand === "jhk" ? p.code : p.code.match(/\d{4}/)[0]));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchOk(url, type) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "user-agent": "Mozilla/5.0 (seritene-clone extractor)" },
        signal: AbortSignal.timeout(60_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return type === "text" ? await res.text() : Buffer.from(await res.arrayBuffer());
    } catch (e) {
      if (attempt >= 4) throw new Error(`${url}: ${e.message}`);
      await sleep(2000 * attempt);
    }
  }
}

async function download(brand, id) {
  const dir = join(cacheDir, brand);
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${id}.html`);
  if (!refresh && existsSync(file)) return file;
  const html = await fetchOk(`${ORIGIN}/producto/${brand}/${id}/`, "text");
  if (!html.includes("ShopProduct")) throw new Error(`${brand}/${id}: sin ShopProduct`);
  writeFileSync(file, html);
  await sleep(150 + Math.random() * 250);
  return file;
}

/** Quita los escapes de cadenas RSC ("$$x" → "$x", "$undefined" → undefined). */
function unescape(value) {
  if (typeof value === "string") {
    if (value === "$undefined") return undefined;
    return value.startsWith("$$") ? value.slice(1) : value;
  }
  if (Array.isArray(value)) return value.map(unescape);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, unescape(v)]));
  }
  return value;
}

function findShopProduct(value) {
  if (Array.isArray(value)) {
    if (value[0] === "$" && value[3] && typeof value[3] === "object" && "product" in value[3] && "warehouse" in value[3]) {
      return value[3];
    }
    for (const v of value) {
      const found = findShopProduct(v);
      if (found) return found;
    }
  }
  return null;
}

const decodeEntities = (s) =>
  s.replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

function parse(brand, id, file) {
  const { rows, html } = readRscRows(file);
  const path = `/producto/${brand}/${id}/`;
  let props = null;
  let jsonLd = null;
  let head = null;
  for (const value of rows.values()) {
    if (!props) props = findShopProduct(value);
    if (typeof value === "string" && value.includes('"BreadcrumbList"') && value.includes(path)) jsonLd = value;
    if (typeof value === "string" && value.startsWith("<title>")) head = value;
  }
  // El JSON-LD de la ficha va a veces en una fila de texto y a veces en línea: se lee del HTML.
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    if (m[1].includes('"BreadcrumbList"') && m[1].includes(path)) jsonLd = m[1];
  }
  if (!props) throw new Error(`${brand}/${id}: sin props de ShopProduct`);
  if (!jsonLd) throw new Error(`${brand}/${id}: sin JSON-LD`);
  head ??= html;
  const meta = (attr, name) => {
    const m = new RegExp(`<meta ${attr}="${name}" content="([^"]*)"`).exec(head);
    return m ? decodeEntities(m[1]) : "";
  };
  const title = decodeEntities(/<title>([^<]*)<\/title>/.exec(head)?.[1] ?? "");
  const { product, brand: propBrand, warehouse, priceNotice, context } = unescape(props);
  if (propBrand !== brand) throw new Error(`${brand}/${id}: marca ${propBrand}`);
  // `colorCode`/`sizeCode` no los usa la ficha: fuera, para aligerar el HTML.
  const variants = product.variants.map((v) => {
    const copy = { ...v };
    delete copy.colorCode;
    delete copy.sizeCode;
    return copy;
  });
  return {
    id,
    brand,
    meta: {
      title,
      description: meta("name", "description"),
      robots: meta("name", "robots"),
      ogImage: meta("property", "og:image"),
      ogImageAlt: meta("property", "og:image:alt"),
    },
    jsonLd: JSON.parse(jsonLd),
    warehouse,
    priceNotice,
    ...(context ? { context } : {}),
    product: { ...product, variants },
  };
}

// --- Descarga (máx. 4 a la vez) -------------------------------------------------------------
const jobs = brands.flatMap((brand) => (only ?? brandIds(brand)).map((id) => ({ brand, id })));
let next = 0;
let done = 0;
const failed = [];
const started = Date.now();
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (next < jobs.length) {
      const { brand, id } = jobs[next++];
      try {
        await download(brand, id);
      } catch (e) {
        failed.push(`${brand}/${id}`);
        console.warn(e.message);
      }
      if (++done % 100 === 0) console.log(`${done}/${jobs.length} (${Math.round((Date.now() - started) / 1000)} s)`);
    }
  }),
);
if (failed.length) {
  console.error(`No se pudieron descargar ${failed.length} fichas: ${failed.join(", ")}`);
  process.exit(1);
}

// --- Extracción -----------------------------------------------------------------------------
const jhkImages = new Set();
for (const brand of brands) {
  const ids = only ?? brandIds(brand);
  const dir = join(OUT, brand);
  if (!only) rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  let bytes = 0;
  for (const id of ids) {
    const data = parse(brand, id, join(cacheDir, brand, `${id}.html`));
    if (brand === "jhk") {
      for (const img of [data.product.image, ...data.product.variants.map((v) => v.image)]) {
        if (img?.startsWith("/images/jhk/")) jhkImages.add(img);
      }
    }
    const json = JSON.stringify(data);
    bytes += json.length;
    writeFileSync(join(dir, `${id}.json`), json + "\n");
  }
  console.log(`${brand}: ${ids.length} fichas → ${dir} (${readdirSync(dir).length} archivos, ${(bytes / 1024 / 1024).toFixed(1)} MB)`);
}

// Fotos de JHK (seritene.com/images/jhk/…), las que falten.
if (jhkImages.size) {
  mkdirSync(JHK_IMAGES, { recursive: true });
  let added = 0;
  let bytes = 0;
  for (const img of jhkImages) {
    const file = join(JHK_IMAGES, img.slice("/images/jhk/".length));
    if (!existsSync(file)) {
      writeFileSync(file, await fetchOk(`${ORIGIN}${img}`, "buffer"));
      added++;
      await sleep(100);
    }
    bytes += readFileSync(file).length;
  }
  console.log(`jhk: ${jhkImages.size} fotos (${added} nuevas, ${(bytes / 1024 / 1024).toFixed(1)} MB) → ${JHK_IMAGES}`);
}

// Ids con ficha local para los enlaces (routes.ts → isLocalRoute), sin cargar los datos.
if (!only) {
  const listed = (brand) =>
    existsSync(join(OUT, brand))
      ? readdirSync(join(OUT, brand))
          .filter((f) => f.endsWith(".json"))
          .map((f) => f.slice(0, -5))
          .sort()
      : [];
  const set = (name, brand, path) =>
    `/** Ids con ficha local (${path}). */\nexport const ${name} = new Set<string>(\n  ${JSON.stringify(listed(brand).join(" "))}.split(" "),\n);\n`;
  writeFileSync(
    join(ROOT, "src/components/sites/seritene/merch/productIds.generated.ts"),
    `// Generado por scripts/extract-merch-products.mjs.\n` +
      set("MERCH_PRODUCT_IDS", "stamina", "/producto/stamina/<modelo>/") +
      set("ROLY_PRODUCT_IDS", "roly", "/producto/roly/<modelo>/") +
      set("JHK_PRODUCT_IDS", "jhk", "/producto/jhk/<código>/"),
  );
}
