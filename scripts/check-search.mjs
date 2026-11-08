#!/usr/bin/env node
/**
 * Pasa cada consulta de scripts/fixtures/search-*.json (respuestas reales de
 * https://seritene.com/api/search) por el buscador local (shop/searchIndex.ts, el mismo código
 * que usa el navegador) con el índice publicado, y compara total y lista ordenada de ids.
 *
 * Uso: node scripts/check-search.mjs [--cache <dir>] [--verbose]
 *   --cache    además, comprueba todas las consultas completas guardadas en esa caché
 *              (la de extract-search-index.mjs / make-search-fixtures.mjs).
 *   --verbose  muestra cada diferencia con más detalle.
 * Sale con código 1 si alguna fixture no coincide, salvo las diferencias conocidas (abajo).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Node carga el .ts quitando los tipos; se silencia el aviso de «module type» que eso provoca.
process.removeAllListeners("warning");
process.on("warning", (w) => w.code !== "MODULE_TYPELESS_PACKAGE_JSON" && console.warn(w));
const { indexFromJson, searchIndex } = await import("../src/components/sites/seritene/shop/searchIndex.ts");

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Consultas que todavía no coinciden del todo, con el motivo (ver informe en el commit). */
const KNOWN = {
  "camiseta sin costuras\u0000all":
    "«sin X»: producción también incluye DRIBE («sin mangas… doble costura»), que no dice «sin costuras»; la regla de expresión no lo explica.",
  "deportivas\u0000all":
    "Plural de sinónimo: mismos 192 resultados y mismos 11 primeros; después producción antepone «deportivos» (prefijo) a «deportiva» (sinónimo exacto).",
};
const args = process.argv.slice(2);
const cacheDir = args.includes("--cache") ? args[args.indexOf("--cache") + 1] : null;
const verbose = args.includes("--verbose");

const started = performance.now();
const index = indexFromJson(JSON.parse(readFileSync(join(ROOT, "public/sites/seritene/shop-data/search-index.json"), "utf8")));
const loadMs = performance.now() - started;

/** Consultas completas (todas sus páginas) de la caché de la API. */
function cachedCases(dir) {
  const byQuery = new Map();
  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".json") || file === "records.json") continue;
    const params = new URLSearchParams(Buffer.from(file.slice(0, -5), "base64url").toString());
    if (params.get("cursor") !== "0") continue;
    const body = JSON.parse(readFileSync(join(dir, file), "utf8"));
    const key = `${params.get("q")}\u0000${params.get("scope")}`;
    if (!byQuery.has(key)) byQuery.set(key, { query: params.get("q"), scope: params.get("scope"), total: body.total, pages: {} });
    byQuery.get(key).pages[params.get("page")] = (body.items || []).map((i) => i.id);
  }
  const cases = [];
  for (const c of byQuery.values()) {
    const pages = Math.max(1, Math.ceil(c.total / 50));
    if (Array.from({ length: pages }, (_, i) => c.pages[i]).every(Boolean)) {
      cases.push({ query: c.query, scope: c.scope, total: c.total, ids: Array.from({ length: pages }, (_, i) => c.pages[i]).flat() });
    }
  }
  return cases;
}

function run(label, cases) {
  let totalOk = 0;
  let exact = 0;
  let worst = 0;
  const failures = [];
  let unexpected = 0;
  for (const c of cases) {
    const t0 = performance.now();
    const got = searchIndex(index, c.query, c.scope).map((r) => r.id);
    worst = Math.max(worst, performance.now() - t0);
    const sameTotal = got.length === c.total;
    const sameList = sameTotal && got.every((id, i) => id === c.ids[i]);
    totalOk += sameTotal;
    exact += sameList;
    if (!sameList) {
      const known = KNOWN[`${c.query}\u0000${c.scope}`];
      if (!known) unexpected++;
      let i = 0;
      while (i < c.ids.length && got[i] === c.ids[i]) i++;
      const expected = new Set(c.ids);
      const found = new Set(got);
      failures.push(
        `  ${known ? "[conocida] " : ""}«${c.query}» (${c.scope}): local ${got.length} / producción ${c.total}; primera diferencia en #${i + 1}: ${got[i] ?? "—"} ≠ ${c.ids[i] ?? "—"}` +
          (known ? `\n    ${known}` : "") +
          (verbose
            ? `\n    sobran: ${got.filter((id) => !expected.has(id)).join(", ") || "—"}\n    faltan: ${c.ids.filter((id) => !found.has(id)).join(", ") || "—"}`
            : ""),
      );
    }
  }
  const pct = (n) => `${((100 * n) / (cases.length || 1)).toFixed(1)}%`;
  console.log(`${label}: ${cases.length} consultas · total igual ${totalOk} (${pct(totalOk)}) · lista idéntica ${exact} (${pct(exact)}) · consulta más lenta ${worst.toFixed(1)} ms`);
  if (failures.length) console.log(failures.join("\n"));
  return unexpected;
}

const fixturesDir = join(ROOT, "scripts/fixtures");
const fixtures = readdirSync(fixturesDir)
  .filter((f) => f.startsWith("search-") && f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(join(fixturesDir, f), "utf8")));
console.log(`Índice: ${index.records.length} registros (preparado en ${loadMs.toFixed(0)} ms)`);
const failed = run("Fixtures", fixtures);
if (cacheDir && existsSync(cacheDir)) run("Caché de la API", cachedCases(cacheDir));
process.exit(failed ? 1 : 0);
