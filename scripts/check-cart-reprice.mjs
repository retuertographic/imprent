#!/usr/bin/env node
/**
 * Comprueba que cambiar la cantidad en el carrito da exactamente lo mismo que la ficha.
 *
 * Para cada tipo de producto: la selección «de la ficha» con cantidad N (mismas funciones puras que
 * usa cada configurador) frente a la misma selección añadida con cantidad M, guardada y leída con
 * `parseCart` (formato `seritene-cart-v1`) y recalculada a N con `loadRepricer` (código del carrito).
 * `quantity`, `subtotal`, `details` y `reprice` tienen que ser idénticos. También comprueba las
 * reglas (mínimos, múltiplos, máximos, cantidades de un desplegable) y las selecciones sin `reprice`.
 *
 * Uso: node scripts/check-cart-reprice.mjs   (sale con código 1 si algo no coincide)
 * Carga el TypeScript con jiti (ya instalado como dependencia de eslint); no añade dependencias.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src/components/sites/seritene");
const jiti = createJiti(import.meta.url, { alias: { "@": join(ROOT, "src") } });
const load = (path) => jiti.import(join(SRC, path));

// loadModelPricing() pide merch-pricing.json con fetch: aquí se sirve el archivo publicado.
globalThis.fetch = async (url) => {
  const file = join(ROOT, "public/sites/seritene", String(url).replace(/^.*\/sites\/seritene/, ""));
  const body = readFileSync(file, "utf8");
  return { ok: true, json: async () => JSON.parse(body) };
};

const { parseCart, cartDetails } = await load("cart/storage.ts");
const { loadRepricer, stepQuantity } = await load("cart/repricers.ts");
const { cartMessage, cartSummary } = await load("cart/order.ts");
const { fullprintModels } = await load("fullprint/data.ts");
const { fullprintOrder } = await load("fullprint/pricing.ts");
const { printProducts, printOrder } = await load("shop/printData.ts");
const { supportModels } = await load("soportes/data.generated.ts");
const soportes = await load("soportes/pricing.ts");
const { areaOrder, AREA_PRICING } = await load("soportes/areaPricing.ts");
const { eventProducts } = await load("eventos/data.generated.ts");
const { loadModelPricing } = await load("merch/loadPricing.ts");
const { merchOrder, withModelPricing } = await load("merch/order.ts");
const { choiceMarks, markingOptions } = await load("merch/pricing.ts");

let failures = 0;
const results = [];
const ok = (cond, label, extra = "") => {
  if (!cond) failures++;
  results.push(`${cond ? "OK  " : "FAIL"} ${label}${extra ? ` — ${extra}` : ""}`);
};

/** Lo que guarda «Añadir al carrito» en cada ficha. */
const added = (name, path, quantity, subtotal, message, reprice) => ({
  id: crypto.randomUUID(),
  name,
  path,
  image: "",
  quantity,
  subtotal,
  details: cartDetails(message),
  addedAt: Date.now(),
  reprice,
});

/** Guarda y vuelve a leer el carrito como lo haría otra pestaña. */
const roundTrip = (item) => parseCart(JSON.stringify({ version: 1, items: [item], delivery: false })).items[0];

/**
 * Añade con M, cambia a N en el carrito y compara con la ficha a N.
 * `page(q)` devuelve el elemento que crearía la ficha con cantidad q.
 */
async function compare(label, page, m, n, rows = null) {
  const fromPage = page(n);
  const stored = roundTrip(page(m));
  const repricer = await loadRepricer(stored.reprice);
  if (!repricer) return ok(false, label, "sin recálculo");
  const quantities = rows ?? [n];
  const changed = rows ? rows.findIndex((q, i) => q !== repricer.quantities(stored)[i]) : 0;
  const problem = repricer.check(quantities, Math.max(0, changed));
  if (problem) return ok(false, label, `rechazado: ${problem}`);
  const cart = { ...stored, ...repricer.apply(quantities) };
  const same = ["quantity", "subtotal", "details"].every((k) => cart[k] === fromPage[k]) &&
    JSON.stringify(cart.reprice) === JSON.stringify(fromPage.reprice);
  // El mensaje de WhatsApp del carrito también es el mismo.
  const msg = (item) => cartMessage({ version: 1, items: [{ ...item, id: "x", addedAt: 0 }], delivery: true });
  ok(
    same && msg(cart) === msg(fromPage),
    label,
    same ? `${m} → ${n}: ${fromPage.subtotal === null ? "A consultar" : (fromPage.subtotal / 100).toFixed(2) + " €"}` : `\n  ficha:   ${JSON.stringify(fromPage)}\n  carrito: ${JSON.stringify(cart)}`,
  );
  return { repricer, stored, cart };
}

// --- Fullprint ---------------------------------------------------------------------------------
{
  const product = fullprintModels.find((p) => p.slug === "camisetas");
  const sel = {
    kind: "fullprint", slug: product.slug, variantId: product.variants[1].id, extraIds: product.extras?.slice(0, 1).map((e) => e.id) ?? [],
    attachmentId: undefined, fabricId: product.fabrics?.[2]?.id ?? "", cut: "Mujer", design: "Necesito ayuda con el diseño", notes: "10 S, 5 M", delivery: true,
  };
  const page = (q) => {
    const o = fullprintOrder(product, { ...sel, quantity: q });
    return added(product.name, `/fullprint/${product.slug}/`, q, o.subtotal, o.message, JSON.parse(JSON.stringify(sel)));
  };
  const min = fullprintOrder(product, { ...sel, quantity: 0 }).minimum;
  const { repricer } = await compare(`fullprint ${product.slug} (tejido, extra, corte)`, page, min, 57);
  ok(repricer.check([min - 1], 0) !== null, "fullprint: por debajo del mínimo se rechaza", repricer.check([min - 1], 0));
  ok(repricer.check([12.5], 0) !== null, "fullprint: cantidad no entera se rechaza");
  ok(stepQuantity(repricer.rows[0].control, min, -1) === null, "fullprint: «−» desactivado en el mínimo");

  const keychain = fullprintModels.find((p) => p.slug === "llaveros");
  const pending = keychain.attachments.find((a) => a.unit === null);
  const ksel = { kind: "fullprint", slug: "llaveros", variantId: keychain.variants[0].id, extraIds: [], attachmentId: pending.id, cut: "Hombre", design: "Aporto mi diseño", notes: "", delivery: false };
  const kpage = (q) => {
    const o = fullprintOrder(keychain, { ...ksel, fabricId: "", quantity: q });
    return added(keychain.name, "/fullprint/llaveros/", q, o.subtotal, o.message, { ...ksel });
  };
  const kmin = keychain.variants[0].tiers[0].min;
  await compare("fullprint llaveros con mosquetón («A consultar»)", kpage, kmin, kmin * 3);
}

// --- Imprenta: flyers (desplegable), tarjetas, pulseras (tramos) y dípticos (a medida) -----------
async function print(slug, variantId, m, n, extra = {}) {
  const product = printProducts.find((p) => p.slug === slug);
  const sel = { kind: "print", slug, variantId, design: "help", customFormat: "", delivery: false, ...extra };
  const page = (q) => {
    const o = printOrder(product, { ...sel, quantity: q });
    return added(product.name, `/imprenta/${slug}/`, q, o.subtotal, o.message, { ...sel });
  };
  return compare(`imprenta ${slug}${variantId ? ` (${variantId})` : ""}`, page, m, n);
}
{
  const { repricer } = await print("flyers", "a5-2", 500, 2500);
  const control = repricer.rows[0].control;
  ok(control.type === "select" && control.options.map((o) => o.value).join() === "250,500,1000,2500,5000,10000", "flyers: desplegable con las cantidades de la ficha", control.options?.map((o) => o.label).join(" | "));
  ok(repricer.check([750], 0) !== null, "flyers: cantidad fuera de la lista se rechaza");
  await print("flyers", "a5-2", 500, 250);
  const cards = await print("tarjetas-de-visita", "lam-1", 250, 1000);
  ok(cards.repricer.rows[0].control.options.map((o) => o.value).join() === "250,500,1000", "tarjetas plastificadas: 250, 500 o 1.000");
  const bands = await print("pulseras-full-color", "", 250, 1234);
  ok(bands.repricer.check([249], 0) !== null, "pulseras: por debajo de 250 se rechaza");
  await print("pulseras-sin-marcaje", "", 300, 10000);
  await print("dipticos", "", 250, 800, { customFormat: "A4 plegado" });
}

// --- Soportes: roll-up, bandera, photocall, carpa ------------------------------------------------
async function support(slug, kind, fn, m, n, extra = {}) {
  const model = supportModels[slug];
  const sel = { kind, slug, delivery: false, ...extra };
  const page = (q) => {
    const o = fn(model.product, q, sel);
    return added(model.product.name, `/soportes-publicitarios/${slug}/`, q, o.subtotal, o.message, { ...sel });
  };
  return compare(`${kind} ${slug}`, page, m, n);
}
{
  const r = await support("roll-up-100x200", "rollup", (p, q, s) => soportes.rollupOrder(p, q, s.delivery), 1, 7);
  ok(r.repricer.check([0], 0) !== null, "roll-up: 0 se rechaza (borrar es «Quitar»)");
  await support("vela", "flag", (p, q, s) => soportes.flagOrder(p, { ...s, quantity: q }), 1, 12, { sizeId: "M", pack: "complete", baseId: "piqueta", delivery: true });
  await support("photocall-3x3", "photocall", (p, q, s) => soportes.photocallOrder(p, q, s.delivery), 1, 3);
  await support("carpa-3x3", "tent", (p, q, s) => soportes.tentOrder(p, q, s.delivery), 2, 1);
}

// --- Lona (por superficie) -----------------------------------------------------------------------
for (const [kind, w, h, m, n, options] of [
  ["banner", 200, 100, 1, 12, { thickness: 5, finish: "Mate" }],
  ["foam", 29.7, 42, 3, 40, { thickness: 10, finish: "Brillo" }],
]) {
  const sel = { kind: "area", area: kind, width: w, height: h, thickness: options.thickness, finish: options.finish, delivery: false };
  const page = (q) => {
    const o = areaOrder(kind, { width: w, height: h, quantity: q, options, delivery: false });
    return added(AREA_PRICING[kind].cart.name, "/soportes-publicitarios/lona-impresa/", q, o.subtotal, o.message, { ...sel });
  };
  await compare(`superficie ${kind} ${w}×${h}`, page, m, n);
}

// --- Merchandising -----------------------------------------------------------------------------
async function merch(model, rowsAdded, rowsChanged, marksFor = () => [], label) {
  const data = JSON.parse(readFileSync(join(SRC, `merch/data/${model}.json`), "utf8")).product;
  const today = await loadModelPricing(model);
  const p = withModelPricing(data, today);
  const marks = marksFor(p);
  const page = (rows) => {
    const o = merchOrder({ product: p, rows: rows.map((r) => ({ sku: r.sku, quantity: String(r.quantity) })), marks, askLogo: false, notes: "Entrega en La Laguna", delivery: false });
    const reprice = {
      kind: "merch", model, code: p.code, name: p.name,
      variants: data.variants.filter((v) => rows.some((r) => r.sku === v.sku)).map(({ sku, color, size, packaging, tariff }) => ({ sku, color, size, packaging, tariff })),
      rows: rows.map((r) => ({ sku: r.sku, quantity: r.quantity })), marks, askLogo: false, notes: "Entrega en La Laguna", delivery: false,
    };
    return added(p.name, `/producto/stamina/${model}/`, o.quote.quantity, o.subtotal, o.message, JSON.parse(JSON.stringify(reprice)));
  };
  const target = rowsChanged.map((q, i) => ({ sku: rowsAdded[i].sku, quantity: q }));
  const stored = roundTrip(page(rowsAdded));
  const repricer = await loadRepricer(stored.reprice);
  const fromPage = page(target);
  const changed = rowsChanged.findIndex((q, i) => q !== rowsAdded[i].quantity);
  const problem = repricer.check(rowsChanged, Math.max(0, changed));
  const cart = { ...stored, ...repricer.apply(rowsChanged) };
  const msg = (item) => cartMessage({ version: 1, items: [{ ...item, id: "x", addedAt: 0 }], delivery: true });
  const same =
    !problem &&
    ["quantity", "subtotal", "details"].every((k) => cart[k] === fromPage[k]) &&
    JSON.stringify(cart.reprice) === JSON.stringify(fromPage.reprice) &&
    msg(cart) === msg(fromPage);
  ok(
    same,
    `${label}: añadido con [${rowsAdded.map((r) => r.quantity)}] y cambiado a [${rowsChanged}]`,
    same ? `${(fromPage.subtotal / 100).toFixed(2)} €` : `${problem ?? ""}\n  ficha:   ${fromPage.details}\n  carrito: ${cart.details}`,
  );
  // El mismo recálculo (no se vuelve a preparar al editar) lee las cantidades de la selección guardada.
  ok(repricer.quantities(roundTrip(cart)).join() === rowsChanged.join(), `${label}: las cantidades se leen de la selección actualizada`);
  return { repricer, stored, p };
}
{
  // Una fila, tarifa por rangos (cambia de rango a partir de 500 uds.), con marcaje UV.
  const volen = JSON.parse(readFileSync(join(SRC, "merch/data/1000.json"), "utf8")).product;
  const single = await merch("1000", [{ sku: volen.variants[0].sku, quantity: 1 }], [600], (p) => markingOptions(p).choices.slice(0, 1).flatMap(choiceMarks), "merch 1000 una fila");
  ok(single.repricer.check([5001], 0) !== null, "merch: más de 5.000 uds. se rechaza", single.repricer.check([5001], 0));

  // Varias filas con embalaje de 10 en 10 (mínimo 10) y stock limitado.
  const baky = JSON.parse(readFileSync(join(SRC, "merch/data/1995.json"), "utf8")).product;
  const [blanco, amarillo, royal] = baky.variants;
  const multi = await merch(
    "1995",
    [{ sku: amarillo.sku, quantity: 10 }, { sku: royal.sku, quantity: 1 }, { sku: blanco.sku, quantity: 20 }],
    [70, 10, 20],
    (p) => markingOptions(p).choices.flatMap(choiceMarks),
    "merch 1995 varias filas (múltiplos de 10)",
  );
  const r = multi.repricer;
  ok(r.rows.every((row) => row.control.step === 10 && row.control.min === 10), "merch 1995: cada fila con mínimo 10 y múltiplos de 10", r.rows.map((x) => x.hint).join(" | "));
  ok(r.check([15, 10, 20], 0)?.includes("múltiplos de 10"), "merch 1995: cantidad no múltiplo se rechaza", r.check([15, 10, 20], 0));
  ok(r.check([10, 5, 20], 1)?.startsWith("Mínimo 10"), "merch 1995: por debajo del mínimo se rechaza", r.check([10, 5, 20], 1));
  ok(r.check([10, 1, 20], 0) === null, "merch 1995: se puede cambiar otra fila aunque una siga por debajo del mínimo");
  ok(stepQuantity(r.rows[1].control, 1, 1) === 10 && stepQuantity(r.rows[0].control, 70, -1) === 60, "merch 1995: «+»/«−» saltan a cantidades válidas");
  const warn = r.warnings([70, 10, 20]);
  ok(warn[0] && !warn[1] && warn[2], "merch 1995: aviso de stock (amarillo 70 > 60, blanco 20 > 0)", JSON.stringify(warn));
}

// --- Productos sin cantidad en la ficha: vaso de evento y DTF por metros ----------------------------
{
  const vaso = eventProducts["vaso-400-ml"] ?? Object.values(eventProducts).find((e) => e.order.name.includes("400 ml"));
  const dtfMessage = readFileSync(join(SRC, "pages/DtfPage.tsx"), "utf8").match(/const orderMessage =\s*"([^"]+)"/)[1];
  for (const [label, item] of [
    ["vaso evento", added(vaso.order.name, "/eventos/producto/vaso-400-ml/", null, null, vaso.order.message, undefined)],
    ["DTF por metros", added("DTF por metros", "/dtf-x-metros/", null, null, dtfMessage, undefined)],
  ]) {
    const back = roundTrip(item);
    ok(back && back.quantity === null && back.subtotal === null && back.reprice === undefined && back.details === item.details,
      `${label}: la ficha no tiene cantidad ni precio (quantity null, «A consultar»); se conserva sin control`);
  }
}

// --- Compatibilidad: selecciones antiguas y `reprice` dañado --------------------------------------
{
  const old = { id: "a", name: "Flyers", path: "/imprenta/flyers/", image: "", quantity: 500, subtotal: 5000, details: "x", addedAt: 1 };
  const bad = { ...old, id: "b", reprice: { kind: "print", slug: 3 } };
  const cart = parseCart(JSON.stringify({ version: 1, items: [old, bad], delivery: true }));
  ok(cart.items.length === 2 && cart.items.every((i) => i.reprice === undefined), "selecciones sin `reprice` (o con uno dañado) se conservan");
  ok(cartSummary(cart).total === 10600, "totales: 2 × 50 € con envío (menos de 199 €) = 106 €", String(cartSummary(cart).total));
}

console.log(results.join("\n"));
console.log(`\n${results.length - failures}/${results.length} comprobaciones correctas.`);
process.exit(failures ? 1 : 0);
