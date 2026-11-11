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
 * A prueba de fallos:
 * - Si producción no responde al primer lote (o falla más del 20 % y no hay archivo anterior), se
 *   conserva el archivo anterior y el script termina con código 0 y un aviso, para que el deploy
 *   siga con los últimos datos buenos.
 * - Los modelos que fallen, o que no se lleguen a pedir porque se agota el tiempo, conservan sus
 *   datos anteriores (quedan en `stale`).
 * - Con SEED_URL (la copia publicada en GitHub Pages), se parte de esa copia si es más reciente
 *   que la del repositorio: un deploy nunca publica precios más antiguos que los que ya había.
 * - REFRESH_BUDGET_MS (por defecto 22 min) limita la duración: al agotarse deja de pedir y guarda
 *   lo obtenido mezclado con lo anterior, antes de que GitHub Actions corte el paso.
 *
 * Uso: node scripts/refresh-merch-pricing.mjs [--only 1000,1001]
 *   SERITENE_ORIGIN=https://… cambia el servidor (p. ej. para simular una caída).
 *   SEED_URL=https://…/merch-pricing.json  REFRESH_BUDGET_MS=1440000
 */
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "public/sites/seritene/shop-data");
const OUT = join(DATA, "merch-pricing.json");
const ORIGIN = (process.env.SERITENE_ORIGIN || "https://seritene.com").replace(/\/$/, "");
const BATCH = 6;
const CONCURRENCY = 4;
const TIMEOUT = 30_000;
const RETRIES = 3;
const MAX_FAILED_SHARE = 0.2;
const BUDGET_MS = Number(process.env.REFRESH_BUDGET_MS) || 22 * 60_000;
const SEED_URL = process.env.SEED_URL;

const args = process.argv.slice(2);
const only = args.includes("--only") ? args[args.indexOf("--only") + 1].split(",") : null;
const models = only ?? JSON.parse(readFileSync(join(DATA, "merchandising.json"), "utf8")).lists[""];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const modelOf = (code) => String(code).match(/\d{4}/)?.[0];
const started = Date.now();
const deadline = started + BUDGET_MS;
const outOfTime = () => Date.now() > deadline;
let requests = 0;
const warn = (msg) => console.log(process.env.GITHUB_ACTIONS ? `::warning::${msg}` : `AVISO: ${msg}`);

const readJson = (file) => {
  try {
    return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : null;
  } catch {
    return null;
  }
};
const isPricingFile = (d) => d?.version === 1 && typeof d.fetchedAt === "string" && d.pricing && d.stock;

// Punto de partida: la copia publicada si es más reciente que la del repositorio.
if (SEED_URL && !only) {
  try {
    const res = await fetch(SEED_URL, { signal: AbortSignal.timeout(TIMEOUT) });
    const seed = res.ok ? await res.json() : null;
    const local = readJson(OUT);
    if (isPricingFile(seed) && (!isPricingFile(local) || Date.parse(seed.fetchedAt) > Date.parse(local.fetchedAt))) {
      writeFileSync(OUT, JSON.stringify(seed) + "\n");
      console.log(`Partiendo de la copia publicada (${seed.fetchedAt}), más reciente que la del repositorio.`);
    } else {
      console.log(`Se mantiene la copia del repositorio (${local?.fetchedAt ?? "sin archivo"}).`);
    }
  } catch (e) {
    warn(`No se pudo leer la copia publicada (${e.message}); se parte de la del repositorio.`);
  }
}

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
      while (next < tasks.length && !outOfTime()) {
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
/** Modelos cuyo stock ya se ha pedido (con o sin unidades disponibles). */
const stockDone = new Set();
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
  if (outOfTime()) {
    for (const m of list) failed.pricing.add(m);
    return;
  }
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
  if (outOfTime()) {
    for (const m of list) failed.stock.add(m);
    return;
  }
  try {
    const json = await gor("stock", list);
    if (json.available && json.stocks) {
      for (const m of list) stockDone.add(m);
      for (const m of list) stock.set(m, {});
      for (const [sku, n] of Object.entries(json.stocks)) {
        const m = modelOf(sku);
        if (stock.has(m) && Number.isFinite(n)) stock.get(m)[sku] = n;
      }
    } else if (list.length > 1) {
      // Un modelo sin stock invalida el lote: se pide cada uno por separado.
      for (const m of list) await stockTask([m]);
    } else {
      stockDone.add(list[0]);
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
  // Tarifa y stock de cada lote seguidos: si se agota el tiempo, lo descargado queda completo.
  await pool([
    () => stockTask(batches[0]),
    ...batches.slice(1).flatMap((b) => [() => pricingTask(b), () => stockTask(b)]),
  ]);
}

// Lo que no se llegó a pedir por falta de tiempo cuenta como fallido (conserva sus datos anteriores).
const timedOut = outOfTime();
if (!firstFailed) {
  for (const m of models) {
    if (!pricing.has(m) && !failed.pricing.has(m)) failed.pricing.add(m);
    if (!stockDone.has(m) && !failed.stock.has(m)) failed.stock.add(m);
  }
}
if (timedOut) warn(`Tiempo agotado (${Math.round(BUDGET_MS / 60000)} min): los modelos pendientes conservan sus datos anteriores.`);

const seconds = Math.round((Date.now() - started) / 1000);
const failedShare = Math.max(failed.pricing.size, failed.stock.size) / models.length;
const previousFile = readJson(OUT);

if (firstFailed || (failedShare > MAX_FAILED_SHARE && !isPricingFile(previousFile))) {
  warn(
    `No se han podido refrescar las tarifas (${failed.pricing.size} modelos sin tarifa, ${failed.stock.size} sin stock; ` +
      `${errors[0] ?? "sin respuesta"}). Se conserva ${existsSync(OUT) ? "el archivo anterior" : "la web sin archivo de tarifas"}.`,
  );
  process.exit(0);
}

// Modelos sueltos que han fallado: se conservan sus datos anteriores.
const previous = isPricingFile(previousFile) ? previousFile : null;
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
