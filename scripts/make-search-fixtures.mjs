#!/usr/bin/env node
/**
 * Guarda como fixtures la respuesta del buscador de producción (lista completa de ids, en
 * orden, y total) para un conjunto variado de consultas. scripts/check-search.mjs compara
 * con ellas el buscador local.
 *
 * Uso: node scripts/make-search-fixtures.mjs --cache <dir> [--refresh]
 */
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createSearchClient } from "./lib/search-api.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "scripts/fixtures");

const args = process.argv.slice(2);
const cacheDir = args.includes("--cache") ? args[args.indexOf("--cache") + 1] : null;
const client = createSearchClient({ cacheDir, refresh: args.includes("--refresh") });

/** [consulta, ámbito]: "all" es /productos/, "roly" /ropa/ y "stamina" /merchandising/. */
export const FIXTURE_QUERIES = [
  ["taza", "all"],
  ["tazas", "all"],
  ["TAZA", "all"],
  ["camiseta", "all"],
  ["camisetas", "all"],
  ["camiseta negra", "all"],
  ["camisetas negras", "all"],
  ["negra camiseta", "all"],
  ["sudadera capucha", "all"],
  ["camiseta algodón", "all"],
  ["camiseta algodon", "all"],
  ["boligrafo", "all"],
  ["bolígrafos", "all"],
  ["polo", "all"],
  ["polo", "roly"],
  ["polo", "stamina"],
  ["botella", "stamina"],
  ["botella", "all"],
  ["botella acero", "all"],
  ["taza", "stamina"],
  ["camiseta", "roly"],
  ["3986", "all"],
  ["1031", "all"],
  ["SU1031", "all"],
  ["0450", "roly"],
  ["roly", "all"],
  ["stamina", "all"],
  ["jhk", "all"],
  ["fullprint", "all"],
  ["flyer", "all"],
  ["flyers", "all"],
  ["tarjetas de visita", "all"],
  ["roll-up", "all"],
  ["roll up", "all"],
  ["bandera", "all"],
  ["carpa", "all"],
  ["photocall", "all"],
  ["imprenta", "all"],
  ["azul marino", "all"],
  ["rojo", "stamina"],
  ["blanco", "roly"],
  ["verde", "all"],
  ["zzzz", "all"],
  ["qwerty", "all"],
  ["de", "all"],
  ["la taza", "all"],
  ["camseta", "all"],
  ["sudadra", "all"],
  ["mochla", "all"],
  ["gorra", "all"],
  ["gorras", "stamina"],
  ["mochila", "all"],
  ["llavero", "all"],
  ["libreta", "all"],
  ["tecnologia", "all"],
  ["tecnología", "all"],
  ["usb", "all"],
  ["paraguas", "all"],
  ["niño", "roly"],
  ["nino", "all"],
  ["mujer", "roly"],
  ["ESTAMBUL", "all"],
  ["kei", "all"],
  ["acero inoxidable", "stamina"],
  ["bolsa algodon", "all"],
  ["ropa laboral", "all"],
  ["regalo empresa", "all"],
  ["serigrafia", "all"],
  ["dtf", "all"],
  ["bordado", "all"],
  ["500 ml", "all"],
  ["vaso", "all"],
  ["pantalon", "roly"],
  ["chaqueta", "all"],
  ["blog", "all"],
  ["tenerife", "all"],
  // Sinónimos, plurales, prefijos, cifras y expresiones con «sin».
  ["mug", "all"],
  ["cap", "all"],
  ["boli", "all"],
  ["t-shirt", "all"],
  ["hoodie", "all"],
  ["kids", "all"],
  ["femenina", "all"],
  ["sport", "all"],
  ["deportivas", "all"],
  ["cuaderno", "all"],
  ["tote bag", "all"],
  ["taza a", "all"],
  ["taza the", "all"],
  ["notebook libreta", "all"],
  ["sin mangas", "all"],
  ["camiseta sin mangas", "all"],
  ["sudadera sin capucha", "all"],
  ["camiseta sin costuras", "all"],
  ["manga larga", "all"],
  ["algodon organico", "all"],
  ["reciclado", "all"],
  ["pantalones cortos", "all"],
  ["alta visibilidad", "all"],
  ["bateria externa", "all"],
  ["gorra niño", "all"],
  ["polo manga corta", "roly"],
  ["taza cristal", "stamina"],
  ["full", "all"],
  ["trípticos", "all"],
  ["talla", "all"],
  ["lonas", "all"],
  ["placas", "all"],
  ["regalos", "all"],
  ["metal", "all"],
  ["poster", "all"],
  ["200", "all"],
  ["usb 16gb", "all"],
];

export const fixtureName = (q, scope) =>
  `search-${scope}-${q.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/ +/g, "_").replace(/[^a-z0-9_]+/g, "-").replace(/^-|-$/g, "") || "x"}${/[A-Z]/.test(q) ? "-upper" : ""}${q !== q.normalize("NFD").replace(/[̀-ͯ]/g, "") ? "-accent" : ""}.json`;

if (import.meta.url === `file://${process.argv[1]}`) {
  mkdirSync(OUT, { recursive: true });
  for (const f of readdirSync(OUT)) if (f.startsWith("search-")) rmSync(join(OUT, f));
  const results = await Promise.all(
    FIXTURE_QUERIES.map(async ([q, scope]) => {
      const { total, items, error } = await client.search(q, scope);
      return { query: q, scope, total, ids: items.map((i) => i.id), ...(error ? { error } : {}) };
    }),
  );
  const names = new Set();
  for (const r of results) {
    const name = fixtureName(r.query, r.scope);
    if (names.has(name)) throw new Error(`Fixture duplicada: ${name}`);
    names.add(name);
    writeFileSync(join(OUT, name), JSON.stringify(r, null, 1) + "\n");
  }
  console.log(`${results.length} fixtures en scripts/fixtures/`);
}
