#!/usr/bin/env node
/**
 * Fichas de merchandising (Stamina) de seritene.com → datos estáticos del clon.
 *
 * Descarga cada `https://seritene.com/producto/stamina/<id>/` (los 1.584 modelos de
 * public/sites/seritene/shop-data/merchandising.json), lee del payload RSC las props de
 * `ShopProduct` (producto, variantes, tarifas, embalaje), el JSON-LD y los metadatos, y escribe:
 *
 *   src/components/sites/seritene/merch/data/<id>.json   una ficha por modelo
 *
 * El servidor de Next las lee al generar cada página (src/components/sites/seritene/merch/serverData.ts),
 * así que no se publican como archivos: cada ficha va incrustada en el HTML de su página.
 * Las tarifas y el stock del día los pone scripts/refresh-merch-pricing.mjs (merch-pricing.json).
 *
 * Uso: node scripts/extract-merch-products.mjs --cache <dir> [--refresh] [--only 1000,1001]
 *   --cache    carpeta donde se guarda el HTML descargado (las repeticiones no vuelven a pedirlo)
 *   --refresh  vuelve a descargar aunque esté en la caché
 *   --only     solo esos modelos (útil para probar)
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readRscRows } from "./lib/seritene-rsc.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "public/sites/seritene/shop-data");
const OUT = join(ROOT, "src/components/sites/seritene/merch/data");
const ORIGIN = "https://seritene.com";
const CONCURRENCY = 4;

const args = process.argv.slice(2);
const arg = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null);
const cacheDir = arg("--cache");
if (!cacheDir) {
  console.error("Uso: node scripts/extract-merch-products.mjs --cache <dir> [--refresh] [--only 1000,1001]");
  process.exit(1);
}
const refresh = args.includes("--refresh");
mkdirSync(cacheDir, { recursive: true });

const merch = JSON.parse(readFileSync(join(DATA, "merchandising.json"), "utf8"));
const only = arg("--only")?.split(",");
const ids = only ?? merch.lists[""];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function download(id) {
  const file = join(cacheDir, `${id}.html`);
  if (!refresh && existsSync(file)) return file;
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(`${ORIGIN}/producto/stamina/${id}/`, {
        headers: { "user-agent": "Mozilla/5.0 (seritene-clone extractor)" },
        signal: AbortSignal.timeout(60_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      if (!html.includes("ShopProduct")) throw new Error("sin ShopProduct");
      writeFileSync(file, html);
      await sleep(150 + Math.random() * 250);
      return file;
    } catch (e) {
      if (attempt >= 4) throw new Error(`${id}: ${e.message}`);
      await sleep(2000 * attempt);
    }
  }
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

function parse(id, file) {
  const { rows, html } = readRscRows(file);
  let props = null;
  let jsonLd = null;
  let head = null;
  for (const value of rows.values()) {
    if (!props) props = findShopProduct(value);
    if (typeof value === "string" && value.includes('"BreadcrumbList"') && value.includes(`/producto/stamina/${id}/`)) jsonLd = value;
    if (typeof value === "string" && value.startsWith("<title>")) head = value;
  }
  // El JSON-LD de la ficha va a veces en una fila de texto y a veces en línea: se lee del HTML.
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    if (m[1].includes('"BreadcrumbList"') && m[1].includes(`/producto/stamina/${id}/`)) jsonLd = m[1];
  }
  if (!props) throw new Error(`${id}: sin props de ShopProduct`);
  if (!jsonLd) throw new Error(`${id}: sin JSON-LD`);
  head ??= html;
  const meta = (attr, name) => {
    const m = new RegExp(`<meta ${attr}="${name}" content="([^"]*)"`).exec(head);
    return m ? decodeEntities(m[1]) : "";
  };
  const title = decodeEntities(/<title>([^<]*)<\/title>/.exec(head)?.[1] ?? "");
  const { product, brand, warehouse, priceNotice } = unescape(props);
  if (brand !== "stamina") throw new Error(`${id}: marca ${brand}`);
  return {
    id,
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
    product,
  };
}

// --- Descarga (máx. 4 a la vez) -------------------------------------------------------------
let next = 0;
let done = 0;
const failed = [];
const started = Date.now();
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (next < ids.length) {
      const id = ids[next++];
      try {
        await download(id);
      } catch (e) {
        failed.push(id);
        console.warn(e.message);
      }
      if (++done % 100 === 0) console.log(`${done}/${ids.length} (${Math.round((Date.now() - started) / 1000)} s)`);
    }
  }),
);
if (failed.length) {
  console.error(`No se pudieron descargar ${failed.length} fichas: ${failed.join(", ")}`);
  process.exit(1);
}

// --- Extracción -----------------------------------------------------------------------------
if (!only) {
  rmSync(OUT, { recursive: true, force: true });
}
mkdirSync(OUT, { recursive: true });
let bytes = 0;
for (const id of ids) {
  const data = parse(id, join(cacheDir, `${id}.html`));
  const json = JSON.stringify(data);
  bytes += json.length;
  writeFileSync(join(OUT, `${id}.json`), json + "\n");
}
const count = readdirSync(OUT).length;

// Lista de modelos clonados para los enlaces locales (routes.ts → isLocalRoute), sin cargar los datos.
if (!only) {
  const models = readdirSync(OUT)
    .filter((f) => /^\d{4}\.json$/.test(f))
    .map((f) => f.slice(0, 4))
    .sort();
  writeFileSync(
    join(ROOT, "src/components/sites/seritene/merch/productIds.generated.ts"),
    `// Generado por scripts/extract-merch-products.mjs: modelos Stamina con ficha local (/producto/stamina/<id>/).\n` +
      `export const MERCH_PRODUCT_IDS = new Set<string>(\n  ${JSON.stringify(models.join(" "))}.split(" "),\n);\n`,
  );
}
console.log(`${ids.length} fichas → ${OUT} (${count} archivos, ${(bytes / 1024 / 1024).toFixed(1)} MB)`);
