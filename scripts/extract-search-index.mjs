#!/usr/bin/env node
/**
 * Recoge todos los registros del buscador de producción (https://seritene.com/api/search)
 * con sus campos completos y genera el índice estático que usa el buscador local:
 *
 *   public/sites/seritene/shop-data/search-index.json
 *
 * La API no admite CORS, así que el índice viaja con la web y la búsqueda se calcula en el
 * navegador (src/components/sites/seritene/shop/searchIndex.ts).
 *
 * Consulta la API con muchos términos (marcas, categorías, nombres y referencias de cada
 * producto de shop-data/*.json, palabras de los propios resultados…), pagina cada consulta y
 * deduplica por id hasta que ninguna consulta nueva aporta registros.
 *
 * Uso: node scripts/extract-search-index.mjs --cache <dir> [--refresh]
 *   --cache    carpeta donde se guardan las respuestas (las repeticiones no vuelven a pedirlas)
 *              y records.json con los registros completos.
 *   --refresh  ignora las respuestas guardadas.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createSearchClient } from "./lib/search-api.mjs";

// search-index-build.mjs carga shop/searchIndex.ts (Node quita los tipos); se silencia su aviso.
process.removeAllListeners("warning");
process.on("warning", (w) => w.code !== "MODULE_TYPELESS_PACKAGE_JSON" && console.warn(w));
const { buildIndex } = await import("./lib/search-index-build.mjs");

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "public/sites/seritene/shop-data");

const args = process.argv.slice(2);
const cacheDir = args.includes("--cache") ? args[args.indexOf("--cache") + 1] : null;
if (!cacheDir) {
  console.error("Uso: node scripts/extract-search-index.mjs --cache <dir> [--refresh]");
  process.exit(1);
}
const client = createSearchClient({ cacheDir, refresh: args.includes("--refresh") });

const shop = Object.fromEntries(
  ["ropa", "merchandising"].map((g) => [g, JSON.parse(readFileSync(join(DATA, `${g}.json`), "utf8"))]),
);

/** Términos generales con los que se empieza (marcas, categorías, materiales, colores…). */
const seeds = new Set([
  "roly", "stamina", "jhk", "fullprint", "imprenta", "rollup", "roll-up", "bandera", "photocall", "carpa",
  "carton", "pluma", "lona", "poster", "imantado", "flyer", "tarjeta", "diptico", "triptico", "folleto",
  "camiseta", "sudadera", "polo", "pantalon", "abrigo", "chaqueta", "deporte", "laboral", "gorra", "bolsa",
  "taza", "botella", "libreta", "boligrafo", "llavero", "mochila", "tecnologia", "regalo", "merchandising",
  "ropa", "pulsera", "abanico", "dtf", "evento", "vaso", "trofeo", "placa", "medalla", "serigrafia",
  "bordado", "diseño", "pedido", "cuidar", "rotulacion", "toalla", "delantal", "pañuelo", "bufanda",
  "lanyard", "tenerife", "empresa", "club", "blog", "guia", "contacto", "producto", "personalizado",
  "algodon", "poliester", "negro", "blanco", "azul", "rojo", "verde", "amarillo", "gris", "rosa",
  "naranja", "marino", "acero", "bambu", "papel", "plastico", "madera", "corcho", "metal", "vidrio",
  "soporte", "vela", "gota", "medida", "impresion", "cm", "ml", "talla", "mujer", "niño", "unisex",
]);
/** Palabras de un texto que merece la pena consultar (3+ letras). */
const tokens = (text) =>
  String(text || "")
    .toLowerCase()
    .normalize("NFC")
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length >= 3);

const shopProducts = Object.values(shop).flatMap((data) =>
  Object.entries(data.products).map(([key, p]) => ({ id: `${p.brand}:${key}`, key, name: p.name })),
);
const isCatalog = (id) => /^(roly|stamina|jhk):/.test(id);

const records = new Map();
const done = new Set();

/** Lanza un lote de consultas (todas sus páginas) y añade los registros nuevos. */
async function run(label, queries) {
  const batch = [...new Set(queries)].filter((q) => q.trim().length >= 2 && !done.has(q));
  batch.forEach((q) => done.add(q));
  const before = records.size;
  const fresh = [];
  const results = await Promise.all(
    batch.map((q) =>
      client.search(q).catch((error) => {
        console.warn(`«${q}»: ${error.message}`);
        done.delete(q);
        return { items: [] };
      }),
    ),
  );
  for (const { items } of results) {
    for (const item of items) {
      if (records.has(item.id)) continue;
      records.set(item.id, item);
      fresh.push(item);
    }
  }
  console.log(`${label}: ${batch.length} consultas, ${records.size - before} registros nuevos (${records.size} en total)`);
  return fresh;
}

// 1. Términos generales: cubren casi todo el catálogo con pocas peticiones.
await run("Términos generales", seeds);
// 2. Productos de tienda que aún faltan: se buscan por nombre y, si no, por referencia.
for (const field of ["name", "key"]) {
  const missing = shopProducts.filter((p) => !records.has(p.id)).map((p) => p[field].toLowerCase());
  if (missing.length) await run(`Productos pendientes (${field})`, missing);
}
// 3. Registros fuera del catálogo (fullprint, imprenta, soportes, apartados…): se consultan las
//    palabras de sus nombres hasta que no aparezcan registros nuevos.
let fresh = [...records.values()];
for (let round = 1; fresh.length && round <= 6; round++) {
  const words = fresh.filter((r) => !isCatalog(r.id)).flatMap((r) => tokens(r.name));
  fresh = await run(`Ronda de apartados ${round}`, words);
}

// Comprobación de cobertura frente al catálogo de las tiendas.
const ids = new Set(records.keys());
let missing = 0;
for (const data of Object.values(shop)) {
  for (const [key, p] of Object.entries(data.products)) {
    if (!ids.has(`${p.brand}:${key}`)) {
      missing++;
      console.warn(`Sin registro en el buscador: ${p.brand}:${key} ${p.name}`);
    }
  }
}
const byPrefix = {};
for (const id of ids) {
  const prefix = id.split(":")[0];
  byPrefix[prefix] = (byPrefix[prefix] || 0) + 1;
}
console.log("Registros por tipo:", byPrefix, `· productos de tienda sin registro: ${missing}`);

const raw = [...records.values()].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
writeFileSync(join(cacheDir, "records.json"), JSON.stringify(raw, null, 1));
const { index, missingImages } = buildIndex(raw, ROOT);
if (missingImages.length) console.log(`Imágenes que no están en public (se enlazan a producción): ${missingImages.join(", ")}`);
writeFileSync(join(DATA, "search-index.json"), JSON.stringify(index));
console.log(`search-index.json: ${index.records.length} registros · ${client.stats().requests} peticiones nuevas`);
