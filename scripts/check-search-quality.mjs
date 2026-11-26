#!/usr/bin/env node
/**
 * Test de calidad del buscador (shop/searchIndex.ts, el mismo código que usa el navegador, con el
 * índice publicado). Ya no compara con producción: cada consulta lleva una expectativa razonada
 * sobre qué debería salir arriba («taza» → tazas, «sudadera niño» → sudaderas con tallas
 * infantiles…). También mide el tiempo de preparación del índice y de cada búsqueda.
 *
 * Uso: node scripts/check-search-quality.mjs [--verbose]
 *   --verbose  muestra los primeros resultados de cada consulta.
 * Sale con código 1 si alguna expectativa falla. No usa la red. Carga el TypeScript con jiti
 * (ya instalado como dependencia de eslint).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src/components/sites/seritene");
const jiti = createJiti(import.meta.url, { alias: { "@": join(ROOT, "src") } });
const { indexFromJson, searchCatalog, GUIDE_LIMIT } = await jiti.import(join(SRC, "shop/searchIndex.ts"));
const { normalizeText, hasKidsSizes, isWomenModel } = await jiti.import(join(SRC, "shop/textMatch.ts"));
const { searchHelp } = await jiti.import(join(SRC, "content.ts"));
const verbose = process.argv.includes("--verbose");

const raw = readFileSync(join(ROOT, "public/sites/seritene/shop-data/search-index.json"), "utf8");
const t0 = performance.now();
const index = indexFromJson(JSON.parse(raw));
const prepMs = performance.now() - t0;

/* ---------------------------------------------------------------- ayudas */

const text = (r) => normalizeText(r.description || r.detail);
/** Primera frase de la descripción, sin artículos ni adjetivos de relleno al principio. */
const summary = (r) => text(r).split(/[.\n]/)[0].replace(/^(la|el|un|una|elegante|practico|practica|original|set de \d+|set de)\s+/, "");
const name = (r) => normalizeText(r.name);
/** Qué es el producto: su nombre si es descriptivo (soportes, imprenta, JHK) o el principio de la descripción. */
const what = (r) => (/^(roly|stamina):/.test(r.id) ? summary(r) : `${name(r)} ${summary(r)}`);
const is = (re) => (r) => re.test(what(r));
const show = (r) => `${r.id} «${r.name}»`;
/** Infantil: tallas infantiles en Roly/JHK; en el resto, que el texto lo diga. */
const isKids = (r) => (/^(roly|jhk):/.test(r.id) ? hasKidsSizes(r.audience) : /\b(nin[oa]s?|infantil|kids?)\b/.test(`${name(r)} ${text(r)}`));
const isWomen = (r) => isWomenModel(r.audience) || /\b(mujer|woman|lady)\b/.test(`${name(r)} ${summary(r)}`);

const cases = [];
/** Registra una consulta con sus comprobaciones; cada una devuelve "" si pasa o el motivo del fallo. */
const check = (query, why, ...rules) => cases.push({ query, why, rules });

/** Los primeros n productos cumplen la condición. */
const top = (n, test, label) => (res) => {
  const list = res.products.slice(0, n);
  if (list.length < Math.min(n, 1)) return `sin productos (${label})`;
  const bad = list.filter((r) => !test(r));
  return bad.length ? `${bad.length}/${list.length} de los primeros no son ${label}: ${bad.slice(0, 3).map(show).join(", ")}` : "";
};
const first = (test, label) => (res) => (res.products[0] && test(res.products[0]) ? "" : `el primero no es ${label}: ${res.products[0] ? show(res.products[0]) : "—"}`);
const atLeast = (n) => (res) => (res.products.length >= n ? "" : `solo ${res.products.length} productos (se esperaban ≥ ${n})`);
const noProducts = (res) => (res.products.length || res.shortcuts.length ? `se esperaba «sin resultados» y salen ${res.products.length} productos` : "");
const shortcut = (path) => (res) => (res.shortcuts.some((r) => r.path === path) ? "" : `falta el acceso directo ${path} (hay: ${res.shortcuts.map((r) => r.path).join(", ") || "—"})`);
const sameAs = (other, n) => (res) => {
  const a = res.products.slice(0, n).map((r) => r.id).join();
  const b = searchCatalog(index, other).products.slice(0, n).map((r) => r.id).join();
  return a === b ? "" : `los primeros ${n} no coinciden con «${other}»`;
};
/** El producto `id` va detrás de todos los que cumplen `test`. */
const after = (id, test, label) => (res) => {
  const pos = res.products.findIndex((r) => r.id === id);
  const lastGood = res.products.reduce((last, r, i) => (test(r) ? i : last), -1);
  return pos >= 0 && pos < lastGood ? `${id} sale en #${pos + 1}, antes que ${label} (último en #${lastGood + 1})` : "";
};
const corrected = (to) => (res) => (res.corrected && res.suggestion === to && res.products.length ? "" : `se esperaba corrección a «${to}» (sugerencia: ${res.suggestion ?? "—"})`);

/* ------------------------------------------------------------- consultas */

check("lona", "el soporte Lona impresa delante de todo y la categoría de rotulación como acceso", first(is(/\blona/), "un producto de lona"), shortcut("/rotulacion/"));
check("lonas", "plural = singular", sameAs("lona", 3));
check("taza", "tazas arriba; la jarra de cristal ADAYA no es una taza", top(20, is(/^taza/), "tazas"), after("stamina:3986", is(/^taza/), "las tazas"), atLeast(50), shortcut("/merchandising/tazas/"));
check("tazas", "plural = singular", sameAs("taza", 20));
check("sudadera niño", "solo sudaderas con tallas infantiles", top(10, (r) => is(/sudadera/)(r) && isKids(r), "sudaderas infantiles"), atLeast(5));
check("sudaderas niña", "plural y femenino del público", top(10, (r) => is(/sudadera/)(r) && isKids(r), "sudaderas infantiles"));
check("camiseta infantil", "camisetas con tallas infantiles", top(15, (r) => is(/camiseta/)(r) && isKids(r), "camisetas infantiles"), atLeast(10));
check("camiseta kids", "«kids» = infantil", sameAs("camiseta infantil", 10));
check("camiseta mujer", "modelos de mujer", top(10, (r) => is(/camiseta/)(r) && isWomen(r), "camisetas de mujer"), atLeast(5));
check("polo chica", "«chica» pide modelos de mujer", top(5, (r) => is(/polo/)(r) && isWomen(r), "polos de mujer"));
check("camiseta", "camisetas", top(20, is(/camiseta/), "camisetas"), atLeast(50), shortcut("/ropa/camisetas/"));
check("camisetas", "plural = singular", sameAs("camiseta", 20));
check("polo", "polos", top(15, is(/^polo|\bpolo\b/), "polos"), shortcut("/ropa/polos/"));
check("sudadera", "sudaderas", top(15, is(/sudadera/), "sudaderas"), shortcut("/ropa/sudaderas/"));
check("sudadera con capucha", "sudaderas con capucha", top(8, is(/sudadera.*capucha|capucha.*sudadera/), "sudaderas con capucha"));
check("hoodie", "hoodie = sudadera con capucha", sameAs("sudadera con capucha", 8));
check("chaqueta", "chaquetas", top(10, is(/chaqueta/), "chaquetas"));
check("chaleco", "chalecos", top(8, is(/chaleco/), "chalecos"));
check("ropa laboral", "ropa de trabajo", top(10, (r) => /laboral|trabajo/.test(`${what(r)} ${normalizeText(r.keywords)}`), "ropa laboral"), shortcut("/ropa/laboral/"));
check("camiseta sin mangas", "«sin mangas» seguido", top(4, (r) => /sin mangas/.test(text(r)), "camisetas sin mangas"), (res) => (res.related.some((r) => !/sin mangas/.test(text(r))) ? "parciales con mangas" : ""));
check("bolsa", "bolsas", top(15, is(/bolsa|tote/), "bolsas"), shortcut("/merchandising/bolsas/"));
check("tote bag", "tote bag = bolsa", top(5, is(/bolsa|tote/), "bolsas"));
check("mochila", "mochilas", top(15, is(/mochila/), "mochilas"), shortcut("/merchandising/mochilas/"));
check("botella", "botellas", top(15, is(/botella/), "botellas"), shortcut("/merchandising/botellas/"));
check("termo", "termos y botellas térmicas", top(5, is(/termo|termic/), "termos"));
check("llavero", "llaveros", top(15, is(/llavero/), "llaveros"), shortcut("/merchandising/llaveros/"));
check("boli", "boli = bolígrafo", top(15, is(/boligrafo/), "bolígrafos"), shortcut("/merchandising/boligrafos/"));
check("bolígrafos", "plural con tilde = bolígrafo", sameAs("boligrafo", 15));
check("libreta", "libretas y blocs", top(10, is(/libreta|bloc|cuaderno/), "libretas"));
check("cuaderno", "cuaderno = libreta", top(10, is(/libreta|bloc|cuaderno/), "libretas"));
check("gorra", "gorras (los gorros van detrás)", top(15, is(/^gorra/), "gorras"), shortcut("/merchandising/gorras/"));
check("visera", "visera = gorra", top(10, is(/gorra|visera/), "gorras"));
check("bandera", "banderas publicitarias", top(2, (r) => r.id.startsWith("flag:"), "banderas"));
check("roll up", "roll-ups", top(4, (r) => r.id.startsWith("rollup:"), "roll-ups"), atLeast(4));
check("rollup", "«rollup» = «roll up»", sameAs("roll up", 4));
check("roll-up", "«roll-up» = «roll up»", sameAs("roll up", 4));
check("vinilo", "soportes con vinilo impreso", top(2, (r) => /vinilo/.test(`${text(r)} ${normalizeText(r.keywords)}`), "productos con vinilo"));
check("cartón pluma", "el soporte de cartón pluma", first((r) => r.id === "foam:carton-pluma", "cartón pluma"), (res) => (res.related.length ? `parciales sobrantes: ${res.related.slice(0, 3).map(show).join(", ")}` : ""));
check("tarjetas de visita", "el producto de imprenta", first((r) => r.id === "print:tarjetas-de-visita", "Tarjetas de visita"), shortcut("/imprenta/"));
check("flyer", "flyers", first((r) => r.id === "print:flyers", "Flyers"));
check("folleto", "folleto = flyer", first((r) => r.id === "print:flyers" || r.id === "print:tripticos", "flyers o trípticos"));
check("fullprint", "productos fullprint", top(10, (r) => r.id.startsWith("fullprint:"), "fullprint"), shortcut("/fullprint/"));
check("sublimación", "sublimación = fullprint", top(5, (r) => r.id.startsWith("fullprint:") || /sublima/.test(text(r)), "fullprint"));
check("dtf", "DTF por metros como acceso directo", shortcut("/dtf-x-metros/"));
check("pulseras evento", "pulseras para eventos", first(is(/pulsera/), "pulseras"));
check("medallas", "la medalla propia de Seritene primero", first((r) => r.id.startsWith("seritene:medalla"), "la medalla de metacrilato"), top(5, is(/medalla/), "medallas"));
check("trofeo", "trofeos", top(5, is(/trofeo/), "trofeos"), shortcut("/eventos/placas/"));
check("SU1087", "referencia del proveedor", first((r) => r.id === "roly:1087", "roly:1087"));
check("camseta", "errata: corrige a camiseta", corrected("camiseta"));
check("sudadra", "errata: corrige a sudadera", corrected("sudadera"));
check("xyzzy", "sin resultados: se muestran sugerencias", noProducts);
check("helicoptero teledirigido", "sin resultados claros: ningún producto", noProducts);

/* --------------------------------------------------------- comprobaciones */

let failed = 0;
let worst = 0;
let sum = 0;
for (const c of cases) {
  const t = performance.now();
  const res = searchCatalog(index, c.query);
  const ms = performance.now() - t;
  worst = Math.max(worst, ms);
  sum += ms;
  const problems = c.rules.map((rule) => rule(res)).filter(Boolean);
  if (res.guides.length > GUIDE_LIMIT) problems.push(`${res.guides.length} guías (máximo ${GUIDE_LIMIT})`);
  if ([...res.products, ...res.related].some((r) => r.kind === "page")) problems.push("hay apartados mezclados con los productos");
  if (problems.length) failed++;
  console.log(`${problems.length ? "✗" : "✓"} «${c.query}» — ${c.why}${problems.length ? `\n    ${problems.join("\n    ")}` : ""}`);
  if (verbose || problems.length) {
    const head = res.products.slice(0, 5).map((r, i) => `      ${i + 1}. ${show(r)}`);
    console.log([`    ${res.products.length} productos · ${res.shortcuts.length} accesos · ${res.guideTotal} guías`, ...head].join("\n"));
  }
}

// Ayuda de «sin resultados»: cada sugerencia lleva a algo que existe en el índice.
const paths = new Set(index.records.map((r) => r.path));
const deadHelp = searchHelp.popular.filter((p) => !paths.has(p.href));
if (deadHelp.length) {
  failed++;
  console.log(`✗ Sugerencias de «sin resultados» sin página en el índice: ${deadHelp.map((p) => p.href).join(", ")}`);
} else console.log(`✓ Sugerencias de «sin resultados»: ${searchHelp.popular.length} enlaces válidos`);

console.log(
  `\n${cases.length - failed}/${cases.length} consultas correctas · índice ${(raw.length / 1024).toFixed(0)} KB preparado en ${prepMs.toFixed(0)} ms · ` +
    `búsqueda media ${(sum / cases.length).toFixed(1)} ms, la más lenta ${worst.toFixed(1)} ms`,
);
process.exit(failed ? 1 : 0);
