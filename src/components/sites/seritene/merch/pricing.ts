/**
 * Precio de las fichas de merchandising. Portado de los chunks de seritene.com
 * `catalog-polish` (tarifa por cantidad y resumen), `marking-prices` (marcajes) y `shop-product`
 * (descuento por cantidad, zonas de marcaje y cálculo del pedido). Importes en céntimos salvo
 * los precios de tarifa, que van en euros como en el proveedor.
 */
import type { MerchProduct, Packaging, Tariff } from "./types";

// --- catalog-polish ---------------------------------------------------------------------------

export type TierResult = { price: number | null; issue: string | null; tier: string };

/** Precio unitario de una variante según su tarifa, embalaje y cantidad (`groupQuantity` = rango compartido). */
export function tierPrice(
  tariff: Tariff | null | undefined,
  packaging: Packaging | null | undefined,
  quantity: number,
  groupQuantity: number = quantity,
): TierResult {
  const pending: TierResult = { price: null, issue: "Tarifa por cantidad pendiente de confirmar.", tier: "pending" };
  if (!tariff || tariff.version !== 2 || !packaging) return pending;
  if (tariff.basis === "manual-unit") {
    return tariff.unit !== null && tariff.unit > 0
      ? { price: tariff.unit, issue: null, tier: "manual-unit" }
      : { ...pending, issue: "Precio de esta talla y color a consultar." };
  }
  if (packaging.minimum !== null && quantity < packaging.minimum) {
    return { price: null, issue: "Mínimo " + packaging.minimum + " unidades por talla y color.", tier: "minimum" };
  }
  if (packaging.multiple !== null && quantity % packaging.multiple !== 0) {
    return {
      price: null,
      issue: "Este artículo se pide en múltiplos de " + packaging.multiple + " unidades por talla y color.",
      tier: "multiple",
    };
  }
  if (tariff.ranges.length) {
    if (!tariff.rangeMinimums || !tariff.rangeGroup) {
      return { ...pending, issue: "Tarifa de rangos del proveedor pendiente de verificar.", tier: "ranges-pending" };
    }
    const index = tariff.rangeMinimums.reduce((acc, min, i) => (groupQuantity >= min ? i : acc), 0);
    return { price: tariff.ranges[index] ?? null, issue: null, tier: "range-" + (index + 1) };
  }
  if (packaging.box !== null && quantity >= packaging.box) {
    return tariff.box === null ? pending : { price: tariff.box, issue: null, tier: "box" };
  }
  if (packaging.pack !== null && quantity >= packaging.pack) {
    return tariff.pack === null ? pending : { price: tariff.pack, issue: null, tier: "pack" };
  }
  return packaging.pack === null || packaging.box === null || tariff.unit === null
    ? pending
    : { price: tariff.unit, issue: null, tier: "unit" };
}

const plain = (s: string) =>
  s
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();

/** Frase de resumen bajo el título (primera frase, máx. 115 caracteres). */
export function productSummary(product: Pick<MerchProduct, "description" | "composition">) {
  const first =
    plain(product.description)
      .split(/(?:[.!?](?:\s|$)|\s\d+[.)]\s)/)[0]
      .trim() || plain(product.composition);
  return first.length > 115 ? first.slice(0, 112).replace(/\s+\S*$/, "") + "…" : first;
}

// --- marking-prices ---------------------------------------------------------------------------

const MARK_BREAKS = [5, 10, 25, 50, 100, 250, 500, 1000];
const DTF_PRICES: Record<string, number[]> = {
  A6: [300, 240, 150, 110, 90, 70, 65, 55],
  A5: [450, 355, 225, 160, 135, 105, 100, 85],
  A4: [600, 475, 300, 215, 180, 140, 130, 115],
  A3: [900, 715, 445, 325, 270, 210, 195, 170],
};
const UV_PRICES: Record<string, number[]> = {
  A1: [200, 120, 70, 50, 40, 30, 25, 23],
  A2: [450, 225, 130, 90, 75, 60, 50, 45],
  A3: [660, 330, 190, 130, 110, 85, 70, 65],
};

export const MARK_SIZES = [
  { code: "A6", label: "Hasta A6", dimensions: "10,5 × 14,8 cm", short: "Logo pequeño", width: 105, height: 148 },
  { code: "A5", label: "Hasta A5", dimensions: "14,8 × 21 cm", short: "Diseño mediano", width: 148, height: 210 },
  { code: "A4", label: "Hasta A4", dimensions: "21 × 29,7 cm", short: "Diseño grande", width: 210, height: 297 },
  { code: "A3", label: "Hasta A3", dimensions: "29,7 × 42 cm", short: "Máximo impacto", width: 297, height: 420 },
];

function markBreak(quantity: number) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000) {
    throw new RangeError("Indica entre 1 y 1.000 unidades enteras.");
  }
  return MARK_BREAKS.reduce((acc, min, i) => (quantity >= min ? i : acc), 0);
}

function markUnitCents(technique: string, size: string, quantity: number) {
  const table = (technique === "DTF UV" ? UV_PRICES : DTF_PRICES)[size];
  if (!table) throw new RangeError("Ese tamaño no corresponde a esta técnica.");
  return table[markBreak(technique === "DTF UV" ? quantity : Math.min(quantity, 1000))];
}

/** 130 → "1,30 €" */
export const formatEuro = (cents: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(cents / 100);

/** Descuento por varios marcajes textiles (DTF) en la misma prenda. */
const multiMarkDiscount = (count: number) => (count < 2 ? 0 : count === 2 ? 15 : count === 3 ? 20 : count === 4 ? 25 : 30);

export type Marking = { id: number; position: string; technique: string; size: string };

export function markingTotals<T extends Marking>(quantity: number, marks: T[]) {
  const priced = marks.map((m) => ({
    ...m,
    unitCents:
      Number.isSafeInteger(quantity) && quantity >= 1 && (m.technique !== "DTF UV" || quantity <= 1000)
        ? markUnitCents(m.technique, m.size, quantity)
        : null,
  }));
  const textile = priced.filter((m) => m.technique !== "DTF UV");
  const discount = multiMarkDiscount(textile.length);
  const textileCents = textile.reduce((sum, m) => sum + (m.unitCents || 0), 0);
  const uvCents = priced.filter((m) => m.technique === "DTF UV").reduce((sum, m) => sum + (m.unitCents || 0), 0);
  return {
    marks: priced,
    discount,
    totalCents: priced.some((m) => m.unitCents === null)
      ? null
      : Math.round((textileCents * quantity * (100 - discount)) / 100) + uvCents * quantity,
  };
}

// --- shop-product: descuento por cantidad y pedido -------------------------------------------

const QUANTITY_DISCOUNTS = [
  { min: 1, max: 4, discount: 0 },
  { min: 5, max: 9, discount: 5 },
  { min: 10, max: 24, discount: 7 },
  { min: 25, max: 49, discount: 9 },
  { min: 50, max: 99, discount: 11 },
  { min: 100, max: 249, discount: 13 },
  { min: 250, max: 499, discount: 15 },
  { min: 500, max: 999, discount: 17 },
  { min: 1000, max: 2499, discount: 18 },
  { min: 2500, max: 5000, discount: 19 },
];

function quantityDiscount(quantity: number) {
  const row = QUANTITY_DISCOUNTS.find((r) => quantity >= r.min && quantity <= r.max);
  if (!row || !Number.isInteger(quantity)) throw new RangeError("Indica entre 1 y 5.000 unidades enteras.");
  return row;
}

function orderTotals<T extends Marking>(lines: { quantity: number; price: number | null }[], marks: T[]) {
  if (!lines.length || lines.some((l) => !Number.isInteger(l.quantity) || l.quantity < 1)) {
    throw new RangeError("Revisa las cantidades.");
  }
  const quantity = lines.reduce((sum, l) => sum + l.quantity, 0);
  const { discount } = quantityDiscount(quantity);
  const priced = lines.map((l) => ({
    ...l,
    unitCents: l.price === null ? null : Math.round((Math.round(l.price * 100) * (100 - discount)) / 100),
  }));
  const productCents = priced.some((l) => l.unitCents === null)
    ? null
    : priced.reduce((sum, l) => sum + (l.unitCents as number) * l.quantity, 0);
  const marking = markingTotals(quantity, marks);
  const markingCents = marking.totalCents;
  return {
    quantity,
    discount,
    markingDiscount: marking.discount,
    lines: priced,
    marks: marking.marks,
    productCents,
    markingCents,
    totalCents: productCents === null || markingCents === null ? null : productCents + markingCents,
  };
}

export type OrderQuote = ReturnType<typeof orderTotals> & { issues: string[] };

/** Cálculo completo del pedido; lanza RangeError si las cantidades no son válidas. */
export function quoteOrder<T extends Marking>(
  product: MerchProduct,
  selections: { sku: string; quantity: number }[],
  marks: T[],
): OrderQuote {
  const perSku = new Map<string, number>();
  for (const s of selections) {
    if (!product.variants.some((v) => v.sku === s.sku)) throw new RangeError("Variante no válida.");
    perSku.set(s.sku, (perSku.get(s.sku) || 0) + s.quantity);
  }
  const perGroup = new Map<string, number>();
  for (const s of selections) {
    const group = product.variants.find((v) => v.sku === s.sku)?.tariff?.rangeGroup;
    if (group) perGroup.set(group, (perGroup.get(group) || 0) + s.quantity);
  }
  const issues: string[] = [];
  const quote = orderTotals(
    selections.map((s) => {
      const v = product.variants.find((x) => x.sku === s.sku)!;
      const group = v.tariff?.rangeGroup;
      const tier = tierPrice(v.tariff, v.packaging, perSku.get(s.sku)!, group ? perGroup.get(group) : undefined);
      if (tier.issue) issues.push([v.color, v.size, tier.issue].filter(Boolean).join(" · "));
      return { quantity: s.quantity, price: tier.price };
    }),
    marks,
  );
  if (quote.lines.some((l) => l.price !== null && l.unitCents !== null && l.unitCents + 1e-5 < (l.price * 100) / 1.8)) {
    throw new RangeError("Revisar rentabilidad.");
  }
  return { ...quote, issues: [...new Set(issues)] };
}

// --- shop-product: zonas de marcaje -----------------------------------------------------------

export type MarkChoice = {
  id: number;
  zone: string;
  label: string;
  detail: string;
  marking: Marking;
};

function choice(id: number, zone: string, label: string, position: string, size: string, technique = "DTF"): MarkChoice {
  return {
    id,
    zone,
    label,
    detail: technique === "DTF UV" ? "Logo a color" : "Estampado a color",
    marking: { id, position, technique, size },
  };
}

const chestLeft = () => choice(1, "chest-left", "Pecho izquierdo", "Pecho izquierdo", "A6");
const chestRight = () => choice(2, "chest-right", "Pecho derecho", "Pecho derecho", "A6");
const chestBoth = () => choice(5, "chest-both", "Ambos pechos", "Pecho izquierdo + derecho", "A6");
const back = () => choice(3, "back", "Diseño en la espalda", "Espalda", "A4");
const sleeveLeft = () => choice(4, "sleeve-left", "Manga izquierda", "Manga izquierda", "A6");
const sleeveRight = () => choice(6, "sleeve-right", "Manga derecha", "Manga derecha", "A6");
const sleevesBoth = () => choice(7, "sleeves-both", "Ambas mangas", "Manga izquierda + derecha", "A6");
const uvOneSide = (kind: string) => ({
  kind,
  choices: [choice(1, "front", "Logo en una cara", "Cara principal", "A1", "DTF UV")],
});

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Tamaño UV de los artículos de tecnología según sus medidas. */
function techSize(text: string) {
  const t = fold(text.toLowerCase()).replace(/<[^>]*>/g, " ");
  if (
    /\b(?:usb|pendrive|auriculares?|cables?|adaptador|localizador)\b/.test(t) &&
    !/\b(?:altavoz|bateria|power\s?bank|cargador)\b/.test(t)
  ) {
    return "A1";
  }
  const m = t.match(
    /(?:medidas|dimensiones)(?: del producto)?\s*:?\s*(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)(?:\s*[x×]\s*(\d+(?:[.,]\d+)?))?\s*(cm|mm)\b/,
  );
  if (m) {
    const dims = m
      .slice(1, 4)
      .filter(Boolean)
      .map((d) => Number(d.replace(",", ".")) / (m[4] === "mm" ? 10 : 1))
      .sort((a, b) => b - a);
    return dims[1] <= 4 ? "A1" : dims[1] >= 12 ? "A3" : "A2";
  }
  return /\b(?:altavoz|bateria|power\s?bank|cargador|raton|reloj|estacion)\b/.test(t) ? "A2" : "A1";
}

/** Marcajes concretos de una zona (las zonas dobles cuentan como dos marcajes). */
export function choiceMarks(c: MarkChoice): Marking[] {
  const positions: Record<string, string[]> = {
    "chest-both": ["Pecho izquierdo", "Pecho derecho"],
    "sleeves-both": ["Manga izquierda", "Manga derecha"],
    "bag-both": ["Cara principal", "Cara posterior"],
  };
  return (positions[c.zone] || [c.marking.position]).map((position, i) => ({
    ...c.marking,
    id: c.id * 10 + i,
    position,
  }));
}

/** Tipo de artículo y zonas de marcaje disponibles. */
export function markingOptions(product: Pick<MerchProduct, "categories" | "name" | "description" | "code">): {
  kind: string;
  choices: MarkChoice[];
} {
  const cats = new Set(product.categories.map((c) => c.toLowerCase()));
  const has = (...names: string[]) => names.some((n) => cats.has(n));
  const text = fold(`${product.name} ${product.description}`.toLocaleLowerCase("es")).replace(/<[^>]*>/g, " ");
  const head = fold(`${product.name} ${product.description.replace(/<[^>]*>/g, " ").split(/[.!?]/)[0]}`.toLowerCase());
  const is = (names: string[], re: RegExp) => has(...names) || (!cats.size && re.test(text));

  if (has("trophies") && /^PR170[3-8]$/.test(product.code)) {
    return { kind: "placa", choices: [choice(1, "front", "Diseño en la cara principal", "Cara principal de la placa", "A3", "DTF UV")] };
  }
  if (is(["gor", "travel_caps", "flipflop_caps"], /\bgorra\b/)) {
    return { kind: "gorra", choices: [choice(1, "front", "Logo frontal", "Frontal de la gorra", "A6")] };
  }
  if (is(["keyrings"], /\bllavero\b/)) return uvOneSide("llavero");
  if (is(["ball_pens", "pencils"], /\bboligrafo\b|\blapiz\b/)) {
    return { kind: "escritura", choices: [choice(1, "body", "Logo en el cuerpo", "Cuerpo", "A1", "DTF UV")] };
  }
  const garment = (large = false) => [
    chestLeft(),
    chestRight(),
    chestBoth(),
    ...(large ? [choice(8, "front-large", "Diseño grande delante", "Delantera", "A4")] : []),
    back(),
    sleeveLeft(),
    sleeveRight(),
    sleevesBoth(),
  ];
  if (
    has(
      "pant_c",
      "pd",
      "lo_pant",
      "sh_pant",
      "serviciospantalones_",
      "serviciospantalones",
      "horecapantalon",
      "sanitarypantalon",
      "foodpantalon",
      "industrypantalon",
    ) ||
    /\b(?:pantalon(?:es)?|bermudas?|leggings?|mallas|shorts?)\b/.test(head)
  ) {
    return {
      kind: "pantalon",
      choices: [
        choice(1, "left", "Logo en pernera izquierda", "Pernera izquierda · zona del muslo", "A6"),
        choice(2, "right", "Logo en pernera derecha", "Pernera derecha · zona del muslo", "A6"),
      ],
    };
  }
  if (
    has("coats", "industrytshirts", "industrypolos", "industryjackets", "industrymonos") ||
    /\b(?:chaquetas?|abrigos?|chalecos?|polares?|cortavientos|camisas?|softshell|parkas?|monos?|buzos?)\b/.test(head)
  ) {
    const sleeveless = /\bchalecos?\b|sin mangas/.test(head);
    return { kind: "prenda-superior", choices: garment(true).filter((c) => !sleeveless || !c.zone.startsWith("sleeve")) };
  }
  if (is(["sud_cha", "swe", "swe_h", "swe_sh", "winter_sweatshirts", "serviciossudaderas"], /\bsudadera\b/)) {
    return { kind: "sudadera", choices: garment(true) };
  }
  if (is(["pol_s", "pmc", "pol_w", "sp_polshi", "serviciospolos"], /\bpolo\b/)) return { kind: "polo", choices: garment(true) };
  if (is(["t_shirts", "cam", "cam_w", "cat", "sp_tshi"], /\bcamiseta\b/)) {
    return { kind: "camiseta", choices: garment(true).filter((c) => !(has("cat") && c.zone.includes("sleeve"))) };
  }
  if (is(["mugs", "submugs"], /\btaza\b/)) {
    return { kind: "taza", choices: [choice(1, "front", "Logo en una cara", "Cara principal", "A3", "DTF UV")] };
  }
  if (is(["bottles", "sports_bottles", "glass_bottles", "thermos_flasks", "bottles_thermos_flas"], /\bbotella\b|\bbidon\b|\btermo\b/)) {
    return { kind: "botella", choices: [choice(1, "front", "Logo en el frontal", "Frontal", "A3", "DTF UV")] };
  }
  if (is(["notebooks", "diaries_calendars", "office_accessories_n"], /\blibreta\b|\bagenda\b|\bbloc\b/)) {
    return { kind: "libreta", choices: [choice(1, "cover", "Logo en la portada", "Portada", "A2", "DTF UV")] };
  }
  if (has("bags", "sub_bags") || /\b(?:bolsa|totebag|tote bag)\b/.test(head)) {
    return {
      kind: "bolsa",
      choices: [
        choice(1, "bag-front", "Logo en una cara", "Cara principal", "A4"),
        choice(2, "bag-both", "Logo en las dos caras", "Cara principal + posterior", "A4"),
      ],
    };
  }
  if (is(["drawstring_bag", "bags_travel_backpack", "subbackpacks", "moc", "executive_backpack"], /\bmochila\b/)) {
    return { kind: "mochila", choices: [choice(1, "front", "Logo frontal", "Frontal", "A6")] };
  }
  if (
    has("technology") ||
    /\b(?:altavoz|auriculares?|cargador|power\s?bank|bateria externa|pendrive|memoria usb|raton|hub usb|localizador)\b/.test(head)
  ) {
    const c = choice(1, "body", "Logo en el exterior", "Superficie exterior", techSize(`${product.name} ${product.description}`), "DTF UV");
    c.detail = "Logo a color · ajustado al espacio disponible";
    return { kind: "tecnologia", choices: [c] };
  }
  return { kind: "consultar", choices: [] };
}
