/**
 * Cálculo de precios, envío y mensaje de WhatsApp de las fichas Fullprint.
 * Portado de los módulos de seritene.com (fullprint-products, order-request, fullprint-details).
 * Todos los importes van en céntimos.
 */
import { contact } from "../content";
import type { FullprintModel } from "./types";

export const formatEuros = (cents: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(cents / 100);

export const formatNumber = (n: number) => new Intl.NumberFormat("es-ES").format(n);

export type PriceResult = { baseUnit: number; extraUnit: number; unit: number; total: number };

/** Precio de una selección; `null` si la cantidad no tiene tramo o falta algún precio. */
export function calculatePrice(
  product: FullprintModel,
  variantId: string,
  quantity: number,
  extraIds: string[] = [],
  attachmentId = product.attachments?.[0]?.id,
  fabricId = product.fabrics?.[0]?.id,
): PriceResult | null {
  if (!Number.isSafeInteger(quantity) || quantity < 1) return null;
  const tier = product.variants
    .find((v) => v.id === variantId)
    ?.tiers.find((t) => quantity >= t.min && (t.max === null || quantity <= t.max));
  if (!tier) return null;

  const extras = [...new Set(extraIds)];
  if (extras.some((id) => !product.extras?.some((e) => e.id === id))) return null;

  const attachment = product.attachments?.find((a) => a.id === attachmentId);
  if (product.attachments && (!attachment || attachment.unit === null)) return null;

  const fabric = product.fabrics?.find((f) => f.id === fabricId);
  if (product.fabrics && !fabric) return null;

  const extraUnit =
    extras.reduce((sum, id) => sum + (product.extras?.find((e) => e.id === id)?.unit ?? 0), 0) +
    (attachment?.unit ?? 0) +
    (fabric?.unit ?? 0);
  const unit = tier.unit + extraUnit;
  const total = unit * quantity;
  return Number.isSafeInteger(total) ? { baseUnit: tier.unit, extraUnit, unit, total } : null;
}

/** Envío a domicilio: 6 €, gratis desde 199 €. */
export const SHIPPING_COST = 600;
export const FREE_SHIPPING_FROM = 19900;

export function withShipping(subtotal: number | null | undefined, delivery: boolean) {
  if (subtotal == null || !Number.isSafeInteger(subtotal) || subtotal < 0) return null;
  const shipping = !delivery || subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_COST;
  return { shipping, total: subtotal + shipping };
}

export function shippingLine(subtotal: number | null | undefined, delivery: boolean) {
  if (!delivery) return "Sin envío a domicilio.";
  const result = withShipping(subtotal, delivery);
  return result
    ? `Envío a domicilio: ${result.shipping === 0 ? "gratuito" : "6 €"}, incluido en el total.`
    : "Envío a domicilio: 6 €. Gratis en pedidos desde 199 €.";
}

export const whatsappUrl = (message: string) => `${contact.whatsapp}?text=${encodeURIComponent(message)}`;

export type Selection = {
  variantId: string;
  quantity: number;
  extraIds: string[];
  attachmentId?: string;
  fabricId?: string;
  cut: string;
  design: string;
  notes: string;
  delivery: boolean;
};

/** Mensaje de solicitud por WhatsApp, con el mismo formato que la web original. */
export function orderMessage(product: FullprintModel, s: Selection, price: PriceResult | null) {
  const variant = product.variants.find((v) => v.id === s.variantId) ?? product.variants[0];
  const attachment = product.attachments?.find((a) => a.id === s.attachmentId);
  const fabric = product.fabrics?.find((f) => f.id === s.fabricId);
  const extras = s.extraIds.map((id) => product.extras?.find((e) => e.id === id)?.label).join(", ");
  const total = withShipping(price?.total, s.delivery);
  return [
    `Hola Seritene, quiero presupuesto de ${product.name}.`,
    `Opción: ${variant.label}.`,
    `Cantidad: ${formatNumber(s.quantity)} unidades.`,
    attachment ? `Enganche: ${attachment.label}.` : "",
    attachment?.unit === null ? "Precio del enganche y total del pedido pendientes de confirmar." : "",
    product.cuts ? `Corte: ${variant.child ? "Niño" : s.cut}.` : "",
    fabric
      ? `Tejido: ${fabric.label} · ${fabric.weight} g/m² · ${fabric.composition}${fabric.unit > 0 ? ` (+${formatEuros(fabric.unit)} / ud.)` : ""}.`
      : "",
    extras ? `Extras: ${extras}.` : "Sin extras.",
    price && total
      ? `Precio de producto: ${formatEuros(price.unit)} / ud. Total: ${formatEuros(total.total)}.`
      : "Precio a confirmar.",
    `${s.design}.`,
    s.notes.trim() ? `Detalles: ${s.notes.trim()}` : "",
    shippingLine(price?.total, s.delivery),
    "Quiero confirmar diseño, impuestos y plazo.",
  ]
    .filter(Boolean)
    .join("\n");
}
