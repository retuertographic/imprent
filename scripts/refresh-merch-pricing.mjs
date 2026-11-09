#!/usr/bin/env node
/**
 * Tarifas y stock del día de las fichas de merchandising (Stamina) → merch-pricing.json.
 *
 * En producción, cada ficha /producto/stamina/<id>/ pide al cargar:
 *   GET /api/gor?action=pricing&brand=stamina&modelList=<modelo>  → tarifa y embalaje por SKU
 *   GET /api/gor?action=stock&brand=stamina&modelList=<modelo>    → unidades por SKU
 * La API no admite CORS, así que el clon publica una foto diaria en
 *   public/sites/seritene/shop-data/merch-pricing.json
 * que lee src/components/sites/seritene/merch/loadPricing.ts.
 *
 * `modelList` admite hasta 6 modelos separados por «;» (con «,» responde «Selecciona entre uno y
 * seis modelos»). Con stock, un solo modelo sin datos deja todo el lote en `available: false`, así
 * que esos lotes se repiten modelo a modelo.
 *
 * A prueba de fallos: si producción no responde o falla más del 20 % de los modelos, se conserva
 * el archivo anterior y el script termina con código 0 y un aviso, para que el deploy siga con los
 * últimos datos buenos. Los modelos sueltos que fallen conservan sus datos anteriores.
 *
 * Uso: node scripts/refresh-merch-pricing.mjs [--only 1000,1001]
 *   SERITENE_ORIGIN=https://… cambia el servidor (p. ej. para simular una caída).
 */
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "public/sites/seritene/shop-data");
const OUT = join(DATA, "merch-pricing.json");
const ORIGIN = (process.env.SERITENE_ORIGIN || "https://seritene.com").replace(/\/$/, "");
const BATCH = 6;
const CONCURRENCY = 3;
const TIMEOUT = 30_000;
const RETRIES = 3;
const MAX_FAILED_SHARE = 0.2;

const args = process.argv.slice(2);
const only = args.includes("--only") ? args[args.indexOf("--only") + 1].split(",") : null;
const models = only ?? JSON.parse(readFileSync(join(DATA, "merchandising.json"), "utf8")).lists[""];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const modelOf = (code) => String(code).match(/\d{4}/)?.[0];
const started = Date.now();
let requests = 0;

/** GET /api/gor con reintentos; devuelve el JSON o lanza. */
async function gor(action, list) {
  const url = `${ORIGIN}/api/gor?action=${action}&brand=stamina&modelList=${list.join(";")}`;
  let lastError;
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      requests++;
      const res = await fetch(url, {
        headers: { accept: "application/json", "user-agent": "Mozilla/5.0 (seritene-clone pricing refresh)" },
        signal: AbortSignal.timeout(TIMEOUT),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json;
    } catch (e) {
      lastError = e;
      if (attempt < RETRIES) await sleep(1500 * attempt);
    }
  }
  throw new Error(`${action} ${list.join(";")}: ${lastError?.message}`);
}

/** Ejecuta las tareas con concurrencia limitada y una pequeña pausa entre peticiones. */
async function pool(tasks) {
  let next = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < tasks.length) {
        await tasks[next++]();
        await sleep(100 + Math.random() * 200);
      }
    }),
  );
}

const batches = [];
for (let i = 0; i < models.length; i += BATCH) batches.push(models.slice(i, i + BATCH));

/** Modelo → { sku: { tariff, packaging } } (solo modelos con respuesta). */
const pricing = new Map();
/** Modelo → { sku: unidades } (solo modelos con stock disponible). */
const stock = new Map();
const failed = { pricing: new Set(), stock: new Set() };
const errors = [];

function storePricing(list, json) {
  for (const m of list) pricing.set(m, {});
  for (const item of json.items ?? []) {
    const m = modelOf(item.code);
    if (!pricing.has(m)) continue;
    pricing.set(
      m,
      Object.fromEntries((item.variants ?? []).filter((v) => v.tariff).map((v) => [v.sku, { tariff: v.tariff, packaging: v.packaging ?? null }])),
    );
  }
}

async function pricingTask(list) {
  try {
    storePricing(list, await gor("pricing", list));
  } catch (e) {
    if (list.length === 1) {
      failed.pricing.add(list[0]);
      errors.push(e.message);
      return;
    }
    for (const m of list) await pricingTask([m]);
  }
}

async function stockTask(list) {
  try {
    const json = await gor("stock", list);
    if (json.available && json.stocks) {
      for (const m of list) stock.set(m, {});
      for (const [sku, n] of Object.entries(json.stocks)) {
        const m = modelOf(sku);
        if (stock.has(m) && Number.isFinite(n)) stock.get(m)[sku] = n;
      }
    } else if (list.length > 1) {
      // Un modelo sin stock invalida el lote: se pide cada uno por separado.
      for (const m of list) await stockTask([m]);
    }
    // Un solo modelo sin stock disponible: «Consultar disponibilidad», como en producción.
  } catch (e) {
    if (list.length === 1) {
      failed.stock.add(list[0]);
      errors.push(e.message);
      return;
    }
    for (const m of list) await stockTask([m]);
  }
}

console.log(`Refrescando tarifas y stock de ${models.length} modelos en ${ORIGIN} (lotes de ${BATCH})…`);
// Si producción no contesta ni al primer lote, no se insiste con el resto.
await pricingTask(batches[0]);
const firstFailed = batches[0].every((m) => failed.pricing.has(m));
if (!firstFailed) {
  await pool([...batches.slice(1).map((b) => () => pricingTask(b)), ...batches.map((b) => () => stockTask(b))]);
}

const seconds = Math.round((Date.now() - started) / 1000);
const failedShare = Math.max(failed.pricing.size, failed.stock.size) / models.length;
const warn = (msg) => console.log(process.env.GITHUB_ACTIONS ? `::warning::${msg}` : `AVISO: ${msg}`);

if (firstFailed || failedShare > MAX_FAILED_SHARE) {
  warn(
    `No se han podido refrescar las tarifas (${failed.pricing.size} modelos sin tarifa, ${failed.stock.size} sin stock; ` +
      `${errors[0] ?? "sin respuesta"}). Se conserva ${existsSync(OUT) ? "el archivo anterior" : "la web sin archivo de tarifas"}.`,
  );
  process.exit(0);
}

// Modelos sueltos que han fallado: se conservan sus datos anteriores.
let previous = null;
try {
  previous = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : null;
} catch {
  previous = null;
}
const stale = new Set();
if (previous) {
  for (const m of failed.pricing) {
    if (!previous.pricing?.[m]) continue;
    pricing.set(m, decodeAll(previous, m));
    stale.add(m);
  }
  for (const m of failed.stock) {
    if (!previous.stock?.[m]) continue;
    stock.set(m, previous.stock[m]);
    stale.add(m);
  }
}
// --only: se mezcla con el resto del archivo anterior.
if (only && previous) {
  for (const m of Object.keys(previous.pricing ?? {})) if (!pricing.has(m)) pricing.set(m, decodeAll(previous, m));
  for (const m of Object.keys(previous.stock ?? {})) if (!stock.has(m) && !only.includes(m)) stock.set(m, previous.stock[m]);
}
function decodeAll(file, m) {
  return Object.fromEntries(
    Object.entries(file.pricing[m]).map(([sku, [t, p]]) => [sku, { tariff: file.tariffs[t], packaging: p < 0 ? null : file.packagings[p] }]),
  );
}

// Tarifas y embalajes se repiten mucho entre variantes: se guardan una vez y se referencian por índice.
const tariffs = [];
const packagings = [];
const tariffIndex = new Map();
const packagingIndex = new Map();
const intern = (value, list, index) => {
  if (value == null) return -1;
  const key = JSON.stringify(value);
  if (!index.has(key)) index.set(key, list.push(value) - 1);
  return index.get(key);
};
const sortKeys = (map) => [...map.keys()].sort();
const out = {
  version: 1,
  fetchedAt: new Date().toISOString(),
  source: `${ORIGIN}/api/gor`,
  stale: [...stale].sort(),
  tariffs,
  packagings,
  pricing: Object.fromEntries(
    sortKeys(pricing).map((m) => [
      m,
      Object.fromEntries(
        Object.entries(pricing.get(m)).map(([sku, v]) => [
          sku,
          [intern(v.tariff, tariffs, tariffIndex), intern(v.packaging, packagings, packagingIndex)],
        ]),
      ),
    ]),
  ),
  stock: Object.fromEntries(sortKeys(stock).map((m) => [m, stock.get(m)])),
};

const json = JSON.stringify(out);
writeFileSync(OUT + ".tmp", json + "\n");
renameSync(OUT + ".tmp", OUT);
const priced = Object.values(out.pricing).filter((v) => Object.keys(v).length).length;
console.log(
  `merch-pricing.json: ${priced}/${models.length} modelos con tarifa, ${Object.keys(out.stock).length} con stock, ` +
    `${failed.pricing.size + failed.stock.size} fallos (${stale.size} con datos anteriores), ` +
    `${requests} peticiones, ${seconds} s, ${(json.length / 1024).toFixed(0)} KB.`,
);
