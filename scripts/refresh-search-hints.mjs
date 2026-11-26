#!/usr/bin/env node
/**
 * Actualiza las pistas de público (tallas infantiles, modelos de mujer) del índice del buscador
 * publicado (public/sites/seritene/shop-data/search-index.json) a partir de las fichas de
 * src/components/sites/seritene/merch/data/{roly,jhk}. No usa la red: ejecútalo cuando cambien
 * esas fichas. (extract-search-index.mjs ya las incluye al regenerar el índice completo.)
 *
 * Uso: node scripts/refresh-search-hints.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { refreshHints } from "./lib/search-index-build.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const file = join(ROOT, "public/sites/seritene/shop-data/search-index.json");
const before = readFileSync(file, "utf8");
const index = refreshHints(JSON.parse(before), ROOT);
const after = JSON.stringify(index);
const bytes = (s) => Buffer.byteLength(s);
writeFileSync(file, after);
const flagged = index.records.filter((r) => r[5]?.a).length;
console.log(`search-index.json: ${index.records.length} registros, ${flagged} con pistas de público · ${bytes(before)} → ${bytes(after)} bytes`);
