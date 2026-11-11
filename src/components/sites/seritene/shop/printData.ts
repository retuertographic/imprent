/** Productos de imprenta y sus tarifas (mismos datos y cálculo que producción). */
import { formatCents } from "./catalog";
import { deliveryLine, deliveryQuote } from "./order";

export type PrintPrice = { quantity: number; total: number };

export type PrintVariant = {
  id: string;
  label: string;
  format?: string;
  faces?: 1 | 2;
  laminated?: boolean;
  prices: PrintPrice[];
};

/** Tramo de precio unitario (céntimos) a partir de `min` unidades. */
export type PrintTier = { min: number; unit: number };

export type PrintArt = { src: string; small: string; width: number; height: number; smallWidth: number };

export type PrintProduct = {
  slug: string;
  name: string;
  punchline: string;
  description: string;
  metaTitle: string;
  specs: string[];
  art: PrintArt;
  variants: PrintVariant[];
  tiers: PrintTier[];
  /** Precio de la tarjeta del listado de /imprenta/. */
  priceLabel: string;
};

/** Precios en euros → total en céntimos por cantidad. */
const prices = (quantities: number[], euros: number[]): PrintPrice[] =>
  quantities.map((quantity, i) => ({ quantity, total: Math.round(euros[i] * 100) }));

const DEFAULT_QUANTITIES = [500, 1000, 2500, 5000, 10000];

export const flyerFormats = [
  { id: "a6", label: "A6 · 10,5 × 14,8 cm" },
  { id: "a5", label: "A5 · 14,8 × 21 cm" },
  { id: "a4", label: "A4 · 21 × 29,7 cm" },
  { id: "dl", label: "DL · 10 × 21 cm" },
];

const flyerVariants = (format: string, oneSide: number[], twoSides: number[], quantities = DEFAULT_QUANTITIES) =>
  ([1, 2] as const).map((faces) => ({
    id: `${format}-${faces}`,
    format,
    faces,
    label: `${flyerFormats.find((f) => f.id === format)?.label} · ${faces} ${faces === 1 ? "cara" : "caras"}`,
    prices: prices(quantities, faces === 1 ? oneSide : twoSides),
  }));

const art = (file: string, width: number, height: number, smallWidth: number): PrintArt => ({
  src: `/catalogue/${file}.webp`,
  small: `/catalogue/${file}-small.webp`,
  width,
  height,
  smallWidth,
});

const CARD_QUANTITIES = [250, 500, 1000, 2500, 5000, 10000];

export const printProducts: PrintProduct[] = [
  {
    slug: "flyers",
    name: "Flyers",
    punchline: "Que tu marca vuele.",
    description: "Promociones, aperturas y eventos. Tu mensaje a todo color, en el formato que necesitas.",
    metaTitle: "Flyers en Tenerife",
    specs: ["Papel de 135 g/m²", "Acabado brillo", "Impresión a todo color", "1 o 2 caras"],
    art: art("print-flyers-sheet-18", 470, 348, 420),
    variants: [
      ...flyerVariants("a6", [50, 60, 115, 180, 275], [70, 95, 145, 215, 320]),
      ...flyerVariants("a5", [75, 105, 175, 275, 440], [95, 130, 205, 305, 495]),
      ...flyerVariants("a4", [70, 105, 115, 270, 430], [105, 160, 220, 305, 560], [250, 500, 1000, 2500, 5000]),
      ...flyerVariants("dl", [65, 85, 130, 195, 290], [85, 130, 175, 245, 350]),
    ],
    tiers: [],
    priceLabel: "500 uds. · 50 €",
  },
  {
    slug: "dipticos",
    name: "Dípticos",
    punchline: "Ábrete a más ideas.",
    description: "Dos cuerpos para presentar tu carta, tus servicios o esa idea que merece un poco más de espacio.",
    metaTitle: "Dípticos en Tenerife",
    specs: ["Papel de 135 g/m²", "Acabado brillo", "Impresión a todo color", "Formato y plegado a consultar"],
    art: art("print-flyers-sheet-19", 402, 347, 402),
    variants: [],
    tiers: [],
    priceLabel: "Presupuesto a medida",
  },
  {
    slug: "tripticos",
    name: "Trípticos",
    punchline: "Tu historia, en tres actos.",
    description: "Despliega lo mejor de tu negocio en un folleto pensado para contar más.",
    metaTitle: "Trípticos en Tenerife",
    specs: ["Formato 21 × 30 cm", "Papel de 135 g/m²", "Acabado brillo", "Impresión a todo color"],
    art: art("print-flyers-sheet-20", 457, 348, 420),
    variants: [
      { id: "triptico", label: "21 × 30 cm · A todo color", prices: prices(DEFAULT_QUANTITIES, [180, 230, 270, 370, 620]) },
    ],
    tiers: [],
    priceLabel: "500 uds. · 180 €",
  },
  {
    slug: "tarjetas-de-visita",
    name: "Tarjetas de visita",
    punchline: "Mucho gusto. Mucha marca.",
    description: "La primera impresión cabe en una tarjeta. Elige caras y acabado; nosotros ponemos el color.",
    metaTitle: "Tarjetas de visita en Tenerife",
    specs: ["Papel satinado de 300 g/m²", "Impresión a todo color", "1 o 2 caras", "Plastificado opcional"],
    art: art("print-cards-sheet-21", 460, 276, 420),
    variants: [
      { id: "sin-1", label: "Sin plastificar · 1 cara", faces: 1, laminated: false, prices: prices(CARD_QUANTITIES, [43, 60, 85, 137, 190, 300]) },
      { id: "sin-2", label: "Sin plastificar · 2 caras", faces: 2, laminated: false, prices: prices(CARD_QUANTITIES, [52, 75, 105, 165, 230, 360]) },
      { id: "lam-1", label: "Plastificadas · 1 cara", faces: 1, laminated: true, prices: prices([250, 500, 1000], [55, 72, 105]) },
      { id: "lam-2", label: "Plastificadas · 2 caras", faces: 2, laminated: true, prices: prices([250, 500, 1000], [65, 84, 130]) },
    ],
    tiers: [],
    priceLabel: "250 uds. · 43 €",
  },
  {
    slug: "pulseras-sin-marcaje",
    name: "Pulseras sin marcaje",
    punchline: "Pasa. Estás en la lista.",
    description: "Control de acceso sencillo para tus eventos, con numeración individual y cierre adhesivo de seguridad.",
    metaTitle: "Pulseras sin marcaje en Tenerife",
    specs: ["25,8 × 2,7 cm", "Fibra sintética", "Varios colores a consultar", "Sin impresión"],
    art: art("print-events-sheet-22", 381, 218, 381),
    variants: [],
    tiers: [
      { min: 250, unit: 17 },
      { min: 500, unit: 14 },
      { min: 1000, unit: 13 },
      { min: 2500, unit: 10 },
      { min: 5000, unit: 8 },
      { min: 10000, unit: 6 },
    ],
    priceLabel: "250 uds. · 42,50 €",
  },
  {
    slug: "pulseras-full-color",
    name: "Pulseras full color",
    punchline: "Tu evento, en la muñeca.",
    description: "Fondo, textos y gráficos con tu identidad. Pulseras numeradas con cierre adhesivo de seguridad.",
    metaTitle: "Pulseras full color en Tenerife",
    specs: ["25 × 2 cm", "Personalización full color", "Numeración individual", "Cierre adhesivo de seguridad"],
    art: art("print-events-sheet-23", 346, 210, 346),
    variants: [],
    tiers: [
      { min: 250, unit: 27 },
      { min: 500, unit: 23 },
      { min: 1000, unit: 19 },
      { min: 2500, unit: 15 },
      { min: 5000, unit: 11 },
      { min: 10000, unit: 10 },
    ],
    priceLabel: "250 uds. · 67,50 €",
  },
];

/** Abanicos de papel: ficha estática (otra plantilla en producción). */
export const paperFan = {
  slug: "abanicos-de-papel",
  name: "Abanicos de papel",
  ref: "AB-PAPEL",
  punchline: "Aire fresco para tu marca.",
  description: "Tu diseño por ambas caras. Un detalle ligero para fiestas, bodas, festivales y días de mucho sol.",
  metaTitle: "Abanicos de papel en Tenerife",
  specs: ["Papel estucado de 350 g/m²", "Impresión full color", "Ambas caras incluidas"],
  art: art("print-events-sheet-24", 294, 221, 294),
  /** Precio unitario (céntimos) desde cada cantidad. */
  tiers: [
    { min: 250, unit: 105 },
    { min: 500, unit: 95 },
    { min: 1000, unit: 76 },
    { min: 2500, unit: 64 },
    { min: 5000, unit: 46 },
  ],
  priceLabel: "250 uds. · 262,50 €",
};

export function getPrintProduct(slug: string) {
  const product = printProducts.find((p) => p.slug === slug);
  if (!product) throw new Error(`Producto de imprenta desconocido: ${slug}`);
  return product;
}

/** Orden de las fichas en el listado y en «Más ideas en papel». */
export const printLinks = [...printProducts, paperFan].map(({ slug, name }) => ({ slug, name }));

export const PRINT_MINIMUM = 250;

/** Precio de una selección (igual que producción): null si no hay tarifa para esa cantidad. */
export function printQuote(product: PrintProduct, quantity: number, variantId: string) {
  if (!Number.isSafeInteger(quantity) || quantity < PRINT_MINIMUM) return null;
  if (product.variants.length) {
    const price = product.variants.find((v) => v.id === variantId)?.prices.find((p) => p.quantity === quantity);
    return price ? { total: price.total, unit: price.total / quantity } : null;
  }
  const tier = [...product.tiers].reverse().find((t) => quantity >= t.min);
  return !tier || !Number.isSafeInteger(tier.unit * quantity) ? null : { total: tier.unit * quantity, unit: tier.unit };
}

const printNumber = new Intl.NumberFormat("es-ES");

/** Cantidades del desplegable de una variante (250 «Consultar presupuesto» si no tiene tarifa para 250). */
export function printQuantityOptions(variant: PrintVariant) {
  return [
    ...(variant.prices.some((p) => p.quantity === PRINT_MINIMUM)
      ? []
      : [{ quantity: PRINT_MINIMUM, label: "250 unidades · Consultar presupuesto" }]),
    ...variant.prices.map((p) => ({
      quantity: p.quantity,
      label: `${printNumber.format(p.quantity)} unidades · ${formatCents(p.total)}`,
    })),
  ];
}

export type PrintSelection = { quantity: number; variantId: string; design: string; customFormat: string; delivery: boolean };

/**
 * Estado completo de una selección de imprenta (precio, si se puede pedir y mensaje de WhatsApp).
 * Lo usan `PrintConfigurator` y el carrito al cambiar la cantidad.
 */
export function printOrder(product: PrintProduct, s: PrintSelection) {
  const variant = product.variants.find((v) => v.id === s.variantId);
  const quote = printQuote(product, s.quantity, s.variantId);
  const custom = !product.variants.length && !product.tiers.length;
  const validQuantity = Number.isSafeInteger(s.quantity) && s.quantity >= PRINT_MINIMUM;
  const plainBracelets = product.slug === "pulseras-sin-marcaje";
  const minimum = product.tiers[0]?.min ?? PRINT_MINIMUM;
  const designLine = s.design === "ready" ? "Aporto mi diseño listo para imprimir" : "Necesito ayuda con el diseño";
  const withDelivery = deliveryQuote(quote?.total, s.delivery);
  const message = [
    `Hola Seritene, me interesan ${product.name}.`,
    `Cantidad: ${printNumber.format(s.quantity)} unidades.`,
    variant
      ? `Opciones: ${variant.label}.`
      : custom
        ? `Formato: ${s.customFormat.trim() || "Necesito asesoramiento"}.`
        : product.specs.join(" · "),
    quote && withDelivery ? `Total del pedido: ${formatCents(withDelivery.total)}.` : "Solicito presupuesto.",
    plainBracelets ? "Sin personalización. Color a confirmar." : `${designLine}.`,
    deliveryLine(quote?.total, s.delivery),
    "Quiero confirmar impuestos y plazo.",
  ].join("\n");
  const canOrder = validQuantity && (custom || !!quote || (!!variant && s.quantity === PRINT_MINIMUM));
  return {
    variant,
    quote,
    custom,
    validQuantity,
    plainBracelets,
    minimum,
    withDelivery,
    message,
    canOrder,
    subtotal: quote?.total ?? null,
  };
}
