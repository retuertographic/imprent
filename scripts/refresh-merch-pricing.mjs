#!/usr/bin/env node
/**
 * Tarifas y stock del día de las fichas de producto → un archivo por marca:
 *   stamina (merchandising, 1.584 modelos) → public/sites/seritene/shop-data/merch-pricing.json
 *   roly    (ropa, 407 modelos)            → public/sites/seritene/shop-data/roly-pricing.json
 * JHK no consulta la API en producción («Stock a consultar», tarifa manual en la ficha).
 *
 * En producción, cada ficha /producto/<marca>/<id>/ pide al cargar:
 *   GET /api/gor?action=pricing&brand=<marca>&modelList=<modelo>  → tarifa y embalaje por SKU
 *   GET /api/gor?action=stock&brand=<marca>&modelList=<modelo>    → unidades por SKU
 * y la tarifa de la respuesta sustituye a la de la ficha SKU a SKU (también cuando llega sin tarifa,
 * `available: false`: el precio queda «A confirmar»). La API no admite CORS, así que el clon publica
 * una foto diaria que lee src/components/sites/seritene/merch/loadPricing.ts.
 *
 * `modelList` admite hasta 6 modelos separados por «;» (con «,» responde «Selecciona entre uno y
 * seis modelos»). Con stock, un solo modelo sin datos deja todo el lote en `available: false`, así
 * que esos lotes se repiten modelo a modelo.
 *
 * A prueba de fallos (por marca, cada archivo por separado):
 * - Si producción no responde al primer lote (o falla más del 20 % y no hay archivo anterior), se
 *   conserva el archivo anterior y el script termina con código 0 y un aviso, para que el deploy
 *   siga con los últimos datos buenos.
 * - Los modelos que fallen, o que no se lleguen a pedir porque se agota el tiempo, conservan sus
 *   datos anteriores (quedan en `stale`).
 * - Con SEED_URL (la copia publicada de merch-pricing.json en GitHub Pages; la de cada marca se busca
 *   junto a ella), se parte de esa copia si es más reciente que la del repositorio: un deploy nunca
 *   publica precios más antiguos que los que ya había.
 * - REFRESH_BUDGET_MS (por defecto 22 min) limita la duración: al agotarse deja de pedir y guarda
 *   lo obtenido mezclado con lo anterior, antes de que GitHub Actions corte el paso. Los modelos que
 *   quedaron pendientes (`stale`) se piden primero la noche siguiente.
 *
 * Uso: node scripts/refresh-merch-pricing.mjs [--brand stamina,roly] [--only 1000,1001]
 *   SERITENE_ORIGIN=https://… cambia el servidor (p. ej. para simular una caída).
 *   SEED_URL=https://…/merch-pricing.json  REFRESH_BUDGET_MS=1440000
 */
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "public/sites/seritene/shop-data");
const ORIGIN = (process.env.SERITENE_ORIGIN || "https://seritene.com").replace(/\/$/, "");
const BATCH = 6;
const CONCURRENCY = 4;
const TIMEOUT = 30_000;
const RETRIES = 3;
const MAX_FAILED_SHARE = 0.2;
const BUDGET_MS = Number(process.env.REFRESH_BUDGET_MS) || 22 * 60_000;
const SEED_URL = process.env.SEED_URL;

const readJson = (file) => {
  try {
    return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : null;
  } catch {
    return null;
  }
};

const ropa = JSON.parse(readFileSync(join(DATA, "ropa.json"), "utf8"));
const BRANDS = {
  stamina: {
    file: "merch-pricing.json",
    models: () => JSON.parse(readFileSync(join(DATA, "merchandising.json"), "utf8")).lists[""],
  },
  roly: {
    file: "roly-pricing.json",
    models: () =>
      ropa.lists[""]
        .map((key) => ropa.products[key])
        .filter((p) => p?.brand === "roly")
        .map((p) => p.code.match(/\d{4}/)[0]),
  },
};

const args = process.argv.slice(2);
const arg = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null);
const only = arg("--only")?.split(",") ?? null;
const brandNames = arg("--brand")?.split(",") ?? Object.keys(BRANDS);
if (brandNames.some((b) => !BRANDS[b])) throw new Error(`Marca desconocida: ${brandNames.join(",")}`);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const modelOf = (code) => String(code).match(/\d{4}/)?.[0];
const started = Date.now();
const deadline = started + BUDGET_MS;
const outOfTime = () => Date.now() > deadline;
let requests = 0;
const warn = (msg) => console.log(process.env.GITHUB_ACTIONS ? `::warning::${msg}` : `AVISO: ${msg}`);
const isPricingFile = (d) => d?.version === 1 && typeof d.fetchedAt === "string" && d.pricing && d.stock;

/** Estado de cada marca durante el refresco. */
const runs = brandNames
  .map((name) => {
    const all = BRANDS[name].models();
    const models = only ? only.filter((m) => all.includes(m)) : all;
    const batches = [];
    for (let i = 0; i < models.length; i += BATCH) batches.push(models.slice(i, i + BATCH));
    return {
      name,
      out: join(DATA, BRANDS[name].file),
      models,
      batches,
      /** Modelo → { sku: { tariff, packaging } } (solo modelos con respuesta). */
      pricing: new Map(),
      /** Modelo → { sku: unidades } (solo modelos con stock disponible). */
      stock: new Map(),
      failed: { pricing: new Set(), stock: new Set() },
      /** Modelos cuyo stock ya se ha pedido (con o sin unidades disponibles). */
      stockDone: new Set(),
      errors: [],
      firstFailed: false,
    };
  })
  .filter((run) => run.models.length);

// Punto de partida: la copia publicada si es más reciente que la del repositorio.
if (SEED_URL && !only) {
  for (const run of runs) {
    const url = SEED_URL.replace(/merch-pricing\.json(?=$|\?)/, BRANDS[run.name].file);
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT) });
      const seed = res.ok ? await res.json() : null;
      const local = readJson(run.out);
      if (isPricingFile(seed) && (!isPricingFile(local) || Date.parse(seed.fetchedAt) > Date.parse(local.fetchedAt))) {
        writeFileSync(run.out, JSON.stringify(seed) + "\n");
        console.log(`${run.name}: partiendo de la copia publicada (${seed.fetchedAt}), más reciente que la del repositorio.`);
      } else {
        console.log(`${run.name}: se mantiene la copia del repositorio (${local?.fetchedAt ?? "sin archivo"}).`);
      }
    } catch (e) {
      warn(`${run.name}: no se pudo leer la copia publicada (${e.message}); se parte de la del repositorio.`);
    }
  }
}

// Los modelos que se quedaron sin refrescar la última vez (`stale`) van primero: si se vuelve a agotar
// el tiempo, cada noche se avanza por donde se dejó en lugar de repetir siempre los mismos.
for (const run of runs) {
  const stale = new Set(readJson(run.out)?.stale ?? []);
  if (!stale.size) continue;
  run.models = [...run.models.filter((m) => stale.has(m)), ...run.models.filter((m) => !stale.has(m))];
  run.batches = [];
  for (let i = 0; i < run.models.length; i += BATCH) run.batches.push(run.models.slice(i, i + BATCH));
}

/** GET /api/gor con reintentos; devuelve el JSON o lanza. */
async function gor(brand, action, list) {
  const url = `${ORIGIN}/api/gor?action=${action}&brand=${brand}&modelList=${list.join(";")}`;
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
  throw new Error(`${brand} ${action} ${list.join(";")}: ${lastError?.message}`);
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

/**
 * Producción sustituye la tarifa y el embalaje de cada SKU de la respuesta, aunque llegue sin tarifa
 * (precio «A confirmar»): esos SKU se guardan con `tariff: null`.
 */
function storePricing(run, list, json) {
  for (const m of list) run.pricing.set(m, {});
  for (const item of json.items ?? []) {
    const m = modelOf(item.code);
    if (!run.pricing.has(m)) continue;
    run.pricing.set(
      m,
      Object.fromEntries((item.variants ?? []).map((v) => [v.sku, { tariff: v.tariff ?? null, packaging: v.packaging ?? null }])),
    );
  }
}

async function pricingTask(run, list) {
  if (outOfTime()) {
    for (const m of list) run.failed.pricing.add(m);
    return;
  }
  try {
    storePricing(run, list, await gor(run.name, "pricing", list));
  } catch (e) {
    if (list.length === 1) {
      run.failed.pricing.add(list[0]);
      run.errors.push(e.message);
      return;
    }
    for (const m of list) await pricingTask(run, [m]);
  }
}

async function stockTask(run, list) {
  if (outOfTime()) {
    for (const m of list) run.failed.stock.add(m);
    return;
  }
  try {
    const json = await gor(run.name, "stock", list);
    if (json.available && json.stocks) {
      for (const m of list) run.stockDone.add(m);
      for (const m of list) run.stock.set(m, {});
      for (const [sku, n] of Object.entries(json.stocks)) {
        const m = modelOf(sku);
        if (run.stock.has(m) && Number.isFinite(n)) run.stock.get(m)[sku] = n;
      }
    } else if (list.length > 1) {
      // Un modelo sin stock invalida el lote: se pide cada uno por separado.
      for (const m of list) await stockTask(run, [m]);
    } else {
      // Un solo modelo sin stock disponible: «Consultar disponibilidad», como en producción.
      run.stockDone.add(list[0]);
    }
  } catch (e) {
    if (list.length === 1) {
      run.failed.stock.add(list[0]);
      run.errors.push(e.message);
      return;
    }
    for (const m of list) await stockTask(run, [m]);
  }
}

console.log(
  `Refrescando tarifas y stock en ${ORIGIN} (lotes de ${BATCH}): ` + runs.map((r) => `${r.name} ${r.models.length} modelos`).join(", ") + "…",
);
// Si producción no contesta ni al primer lote de una marca, no se insiste con el resto de esa marca.
for (const run of runs) {
  await pricingTask(run, run.batches[0]);
  run.firstFailed = run.batches[0].every((m) => run.failed.pricing.has(m));
}
// Tarifa y stock de cada lote seguidos: si se agota el tiempo, lo descargado queda completo.
// Las marcas se intercalan para que un corte por tiempo reparta lo pendiente entre todas.
const queues = runs
  .filter((run) => !run.firstFailed)
  .map((run) => [
    () => stockTask(run, run.batches[0]),
    ...run.batches.slice(1).flatMap((b) => [() => pricingTask(run, b), () => stockTask(run, b)]),
  ]);
const tasks = [];
for (let i = 0; queues.some((q) => i < q.length); i++) for (const q of queues) if (i < q.length) tasks.push(q[i]);
await pool(tasks);

const timedOut = outOfTime();
if (timedOut) warn(`Tiempo agotado (${Math.round(BUDGET_MS / 60000)} min): los modelos pendientes conservan sus datos anteriores.`);
const seconds = Math.round((Date.now() - started) / 1000);

for (const run of runs) save(run);
console.log(`${requests} peticiones en ${seconds} s.`);

function decodeAll(file, m) {
  return Object.fromEntries(
    Object.entries(file.pricing[m]).map(([sku, [t, p]]) => [
      sku,
      { tariff: t < 0 ? null : file.tariffs[t], packaging: p < 0 ? null : file.packagings[p] },
    ]),
  );
}

function save(run) {
  const { name, out, models, pricing, stock, failed, stockDone, errors, firstFailed } = run;
  // Lo que no se llegó a pedir por falta de tiempo cuenta como fallido (conserva sus datos anteriores).
  if (!firstFailed) {
    for (const m of models) {
      if (!pricing.has(m) && !failed.pricing.has(m)) failed.pricing.add(m);
      if (!stockDone.has(m) && !failed.stock.has(m)) failed.stock.add(m);
    }
  }
  const failedShare = Math.max(failed.pricing.size, failed.stock.size) / models.length;
  const previousFile = readJson(out);

  if (firstFailed || (failedShare > MAX_FAILED_SHARE && !isPricingFile(previousFile))) {
    warn(
      `${name}: no se han podido refrescar las tarifas (${failed.pricing.size} modelos sin tarifa, ${failed.stock.size} sin stock; ` +
        `${errors[0] ?? "sin respuesta"}). Se conserva ${existsSync(out) ? "el archivo anterior" : "la web sin archivo de tarifas"}.`,
    );
    return;
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
    for (const m of Object.keys(previous.stock ?? {})) if (!stock.has(m) && !models.includes(m)) stock.set(m, previous.stock[m]);
    for (const m of previous.stale ?? []) if (!models.includes(m)) stale.add(m);
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
  const data = {
    version: 1,
    fetchedAt: new Date().toISOString(),
    source: `${ORIGIN}/api/gor?brand=${name}`,
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

  const json = JSON.stringify(data);
  writeFileSync(out + ".tmp", json + "\n");
  renameSync(out + ".tmp", out);
  const priced = Object.values(data.pricing).filter((v) => Object.values(v).some(([t]) => t >= 0)).length;
  console.log(
    `${BRANDS[name].file}: ${models.length} modelos pedidos; en el archivo, ${priced} con tarifa y ${Object.keys(data.stock).length} con stock; ` +
      `${failed.pricing.size + failed.stock.size} fallos (${stale.size} con datos anteriores), ${(json.length / 1024).toFixed(0)} KB.`,
  );
}
