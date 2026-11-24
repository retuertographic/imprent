#!/usr/bin/env node
/**
 * Copias pequeñas (WebP) de las fotos de producto para los listados y los colores de JHK
 * → public/sites/seritene/thumbs/ (commiteadas; las rutas las decide src/components/sites/seritene/shop/imageSizes.ts).
 *
 *   thumbs/{360,720}/gor/<foto>.webp    tarjeta de cada modelo Stamina/Roly (cabe en 360×360, ~4 KB,
 *                                       y en 720×720 sin ampliar, ~9 KB; la JPEG original pesa ~70 KB)
 *   thumbs/{360,720}/<ruta local>.webp  tarjeta de fotos propias de seritene.com (JHK, catálogo, fullprint…)
 *   thumbs/swatch/images/jhk/…    colores de las fichas JHK (120 px de alto; los de Stamina/Roly usan
 *                                 la versión `small` que ya publica el proveedor)
 *
 * Fotos de origen: las de las tarjetas de shop-data/ropa.json, merchandising.json, search-index.json y
 * pages/catalogSnapshots.ts, y las variantes JHK de merch/data/jhk. Incremental: solo descarga y genera las
 * que faltan, así que hay que ejecutarlo tras volver a extraer los catálogos (extract-shop-data,
 * extract-merch-products, extract-search-index) y commitear lo nuevo. El refresco nocturno de precios no
 * cambia fotos y no lo necesita.
 *
 * Uso: node scripts/make-product-thumbs.mjs [--check] [--prune] [--force]
 *   --check  sin red: falla si alguna foto de tarjeta no tiene copia (lo ejecuta `npm run check`).
 *   --prune  borra copias que ya no usa ninguna foto.
 *   --force  vuelve a generar todas.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  CARD_THUMBS,
  SWATCH_THUMB,
  cardThumbPath,
  firstImage,
  swatchThumbPath,
} from "../src/components/sites/seritene/shop/imageSizes.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(ROOT, "public/sites/seritene");
const DATA = join(PUBLIC, "shop-data");
const THUMBS = join(PUBLIC, "thumbs");
const args = new Set(process.argv.slice(2));

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));
const GORFACTORY = "https://static.gorfactory.es/images/models/";

/** Fotos de tarjeta: una por modelo y alguna más del buscador y los catálogos. */
function cardSources() {
  const out = new Set();
  for (const group of ["ropa", "merchandising"]) {
    for (const p of Object.values(readJson(join(DATA, `${group}.json`)).products)) if (p.image) out.add(p.image);
  }
  // search-index.json: [id, nombre, descripción, palabras clave, imagen («@» = GORFACTORY), extras?]
  for (const r of readJson(join(DATA, "search-index.json")).records) {
    const image = r[4];
    if (image) out.add(image.startsWith("@") ? GORFACTORY + image.slice(1) : image);
  }
  const snapshots = readFileSync(join(ROOT, "src/components/sites/seritene/pages/catalogSnapshots.ts"), "utf8");
  for (const m of snapshots.matchAll(/"image":\s*"([^"]+)"/g)) out.add(m[1]);
  return [...out].map(firstImage);
}

/** Fotos de las variantes JHK (locales), para los colores de la ficha. */
function swatchSources() {
  const out = new Set();
  const dir = join(ROOT, "src/components/sites/seritene/merch/data/jhk");
  for (const f of readdirSync(dir)) {
    const p = readJson(join(dir, f)).product;
    for (const src of [p.image, ...p.variants.map((v) => v.image)]) if (src) out.add(firstImage(src));
  }
  return [...out];
}

const jobs = new Map(); // destino → { src, box }
function addJob(thumb, src, box) {
  // Dos fotos distintas no pueden compartir copia (p. ej. el mismo nombre en dos carpetas del proveedor).
  const prev = jobs.get(thumb);
  if (prev && prev.src !== src) throw new Error(`Dos fotos para ${thumb}: ${prev.src} y ${src}`);
  jobs.set(thumb, { src, box });
}
for (const src of cardSources()) {
  for (const size of CARD_THUMBS) {
    const thumb = cardThumbPath(src, size);
    if (thumb) addJob(thumb, src, size);
  }
}
for (const src of swatchSources()) {
  const thumb = swatchThumbPath(src);
  if (thumb) addJob(thumb, src, SWATCH_THUMB);
}

const missing = [...jobs.keys()].filter((t) => args.has("--force") || !existsSync(join(PUBLIC, t)));

if (args.has("--check")) {
  if (missing.length) {
    console.error(`Faltan ${missing.length} copias de fotos de producto (p. ej. ${missing.slice(0, 3).join(", ")}).`);
    console.error("Genera las que faltan con: node scripts/make-product-thumbs.mjs");
    process.exit(1);
  }
  console.log(`Fotos de producto: ${jobs.size} copias presentes.`);
  process.exit(0);
}

async function readSource(src) {
  if (src.startsWith("/")) return readFileSync(join(PUBLIC, src));
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(src, { signal: AbortSignal.timeout(20000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (e) {
      if (attempt >= 3) throw e;
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
}

// Una descarga por foto para todos los tamaños que le falten.
const pending = new Map(); // origen → [destinos]
for (const thumb of missing) {
  const { src } = jobs.get(thumb);
  pending.set(src, [...(pending.get(src) ?? []), thumb]);
}
let done = 0;
const failed = [];
const queue = [...pending];
await Promise.all(
  Array.from({ length: 8 }, async () => {
    for (let job; (job = queue.shift()); ) {
      const [src, thumbs] = job;
      try {
        const input = await readSource(src);
        for (const thumb of thumbs) {
          const { box } = jobs.get(thumb);
          const webp = await sharp(input)
            .resize({ width: box, height: box, fit: "inside", withoutEnlargement: true })
            .webp({ quality: 78, effort: 6 })
            .toBuffer();
          const file = join(PUBLIC, thumb);
          mkdirSync(dirname(file), { recursive: true });
          writeFileSync(file, webp);
          if (++done % 500 === 0) console.log(`  ${done}/${missing.length}`);
        }
      } catch (e) {
        failed.push(`${src}: ${e.message}`);
      }
    }
  }),
);

/** Todas las copias que hay en disco. */
function listThumbs(dir = THUMBS) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const file = join(dir, name);
    return statSync(file).isDirectory() ? listThumbs(file) : [`/${relative(PUBLIC, file)}`];
  });
}
const orphans = listThumbs().filter((t) => !jobs.has(t));
if (orphans.length && args.has("--prune")) for (const t of orphans) unlinkSync(join(PUBLIC, t));

const bytes = listThumbs().reduce((sum, t) => sum + statSync(join(PUBLIC, t)).size, 0);
console.log(
  `Copias: ${jobs.size} (${done} nuevas, ${(bytes / 1048576).toFixed(1)} MB en thumbs/)` +
    (orphans.length ? `; ${orphans.length} sin uso${args.has("--prune") ? " borradas" : " (bórralas con --prune)"}` : ""),
);
if (failed.length) {
  console.error(`No se han podido generar ${failed.length}:\n  ${failed.slice(0, 10).join("\n  ")}`);
  process.exit(1);
}
