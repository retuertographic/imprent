/**
 * Pedido de una ficha de merchandising: tarifa del día, cálculo, stock y mensaje de WhatsApp.
 * Funciones puras compartidas por `ShopProduct` y por el carrito (al cambiar cantidades), de modo
 * que ambos calculan exactamente lo mismo. Portado del chunk `shop-product` de seritene.com.
 */
import { deliveryLine, shippingFor } from "../soportes/order";
import type { ModelPricing } from "./loadPricing";
import { formatEuro, quoteOrder, type Marking, type OrderQuote } from "./pricing";
import type { MerchProduct, MerchVariant } from "./types";

const BRAND = "stamina";

/** Variantes con la tarifa, el embalaje y el stock del día (merch-pricing.json) sobre los datos de la ficha. */
export function withModelPricing<P extends { variants: MerchVariant[] }>(product: P, data: ModelPricing): P {
  return {
    ...product,
    variants: product.variants.map((v) => ({ ...v, ...data.pricing[v.sku], stock: data.stock[v.sku] ?? null })),
  };
}

/** Fila de la ficha: SKU y unidades tal como se escriben (texto en la ficha, número en el carrito). */
export type MerchRow = { sku: string; quantity: string | number };

export type MerchOrderInput = {
  product: Pick<MerchProduct, "name" | "code" | "variants">;
  rows: MerchRow[];
  marks: Marking[];
  askLogo: boolean;
  notes: string;
  delivery: boolean;
  pricingLoading?: boolean;
};

export const MERCH_QUANTITY_ERROR = "Introduce cantidades enteras: entre 1 y 5.000 unidades en total.";

/** Total de unidades de un SKU en todas las filas y aviso si supera el stock. */
export function stockStatus(product: Pick<MerchProduct, "variants">, rows: MerchRow[], sku: string) {
  const v = product.variants.find((x) => x.sku === sku);
  const total = rows.filter((r) => r.sku === sku).reduce((sum, r) => sum + Number(r.quantity), 0);
  return { variant: v, total, over: v?.stock != null && total > v.stock };
}

export const OVER_STOCK = "Cantidad superior al stock: consultar reposición.";

/** Cálculo completo y mensaje de la selección (mismo resultado en la ficha y en el carrito). */
export function merchOrder({ product: p, rows, marks, askLogo, notes, delivery, pricingLoading = false }: MerchOrderInput) {
  let quote: OrderQuote | null = null;
  let quantityError = "";
  try {
    quote = quoteOrder(
      p,
      rows.map((r) => ({ sku: r.sku, quantity: Number(r.quantity) })),
      marks,
    );
  } catch {
    quantityError = MERCH_QUANTITY_ERROR;
  }

  const money = (cents: number | null | undefined) => (cents == null ? "A confirmar" : formatEuro(cents));
  const subtotal = askLogo || pricingLoading ? null : (quote?.totalCents ?? null);
  const shipping = shippingFor(subtotal, delivery);
  const units =
    subtotal !== null && quote ? quote.lines.map((l) => (l.unitCents as number) + (quote.markingCents as number) / quote.quantity) : [];
  const minUnit = units.length ? Math.min(...units) : null;
  const maxUnit = units.length ? Math.max(...units) : null;
  const varies = minUnit !== maxUnit;
  const unitText = varies ? `${money(minUnit)} – ${money(maxUnit)}` : money(minUnit);

  const message = [
    `Hola, quiero presupuesto de ${p.name} (${BRAND.toUpperCase()} · ${p.code}).`,
    ...rows.map((r) => {
      const v = p.variants.find((x) => x.sku === r.sku);
      return `${r.quantity} uds. · ${v?.color} · ${v?.size || "Única"} · SKU ${r.sku}`;
    }),
    ...marks.map((m) => `Marcaje: ${m.position}, ${m.technique}, ${m.size}, mismo diseño en todas las unidades.`),
    ...(marks.length ? [`Total marcajes: ${money(quote?.markingCents)}.`] : []),
    ...(quote?.markingDiscount ? [`Descuento por varios marcajes textiles: ${quote.markingDiscount} %.`] : []),
    ...(quote?.issues || []),
    ...(marks.length
      ? []
      : [askLogo ? "Solicito asesoramiento para personalizar este artículo. Marcaje pendiente de presupuesto." : "Sin marcaje."]),
    `Precio unitario${varies ? " (según talla/color)" : ""}: ${unitText}. Total del pedido: ${money(shipping?.total)}.`,
    deliveryLine(subtotal, delivery),
    "Pendiente de confirmar disponibilidad, compatibilidad del marcaje, impuestos y diseño.",
    ...(notes.trim() ? [`Notas: ${notes.trim()}`] : []),
  ].join("\n");

  return { brand: BRAND, quote, quantityError, money, subtotal, shipping, varies, unitText, message };
}
