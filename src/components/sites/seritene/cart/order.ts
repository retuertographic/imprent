/**
 * Totales y mensaje de WhatsApp del carrito. Portado del chunk `order-request` de seritene.com.
 * Importes en céntimos.
 */
import { ORIGIN, contact } from "../content";
import { type Cart, withoutBasePath } from "./storage";

/** Envío a domicilio: 6 € por pedido, gratis desde 199 €. */
const FREE_SHIPPING_FROM = 19900;
const SHIPPING = 600;

export function shippingQuote(subtotal: number | null | undefined, delivery: boolean) {
  if (subtotal == null || !Number.isSafeInteger(subtotal) || subtotal < 0) return null;
  const shipping = !delivery || subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING;
  return { shipping, total: subtotal + shipping };
}

export type CartSummary = {
  /** Suma de las selecciones con precio. */
  known: number;
  /** Hay alguna selección «A consultar»: envío y total quedan a confirmar. */
  pending: boolean;
  shipping: number | null;
  total: number | null;
};

export function cartSummary(cart: Cart): CartSummary {
  const known = cart.items.reduce((sum, item) => sum + (item.subtotal ?? 0), 0);
  const pending = cart.items.some((item) => item.subtotal === null);
  const quote = shippingQuote(pending ? null : known, cart.delivery);
  return { known, pending, shipping: quote?.shipping ?? null, total: quote?.total ?? null };
}

/** 2500 → "25,00 €" */
export const formatEuro = (cents: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(cents / 100);

/** Resumen completo del pedido (texto de WhatsApp, «Copiar resumen» y «Descargar»). */
export function cartMessage(cart: Cart) {
  const summary = cartSummary(cart);
  return [
    "Hola Seritene, quiero solicitar este pedido:",
    ...cart.items.map(
      (item, index) =>
        `\n${index + 1}. ${item.name}\n${item.details}\n` +
        `Importe de esta selección: ${item.subtotal === null ? "A consultar" : formatEuro(item.subtotal)} (sin envío ni impuestos).\n` +
        `${ORIGIN}${withoutBasePath(item.path)}`,
    ),
    `\n${summary.pending ? "Subtotal de productos con precio" : "Subtotal"}: ${formatEuro(summary.known)}.`,
    ...(summary.pending ? ["Hay productos pendientes de presupuesto."] : []),
    cart.delivery
      ? `Envío: ${summary.shipping === null ? "a confirmar" : summary.shipping === 0 ? "gratuito" : formatEuro(summary.shipping)}.`
      : "Sin envío a domicilio.",
    `Total orientativo: ${summary.total === null ? "a confirmar" : formatEuro(summary.total)}. Sin impuestos.`,
    "Confirmar disponibilidad, precios, diseño y plazo antes de realizar el pedido.",
  ].join("\n");
}

/** Alguna selección lleva un archivo adjunto con fecha de caducidad ya pasada. */
export const hasExpiredFiles = (cart: Cart) =>
  cart.items.some((item) => Boolean(item.expiresAt) && (item.expiresAt as number) < Date.now());

/** Por encima de esta longitud el enlace de WhatsApp lleva un texto corto y se pide adjuntar el resumen. */
export const LONG_MESSAGE = 6000;
export const LONG_MESSAGE_TEXT =
  "Hola Seritene, quiero solicitar un pedido con varios productos. Os adjunto el resumen del carrito para confirmar presupuesto.";

export const whatsappUrl = (message: string) => `${contact.whatsapp}?text=${encodeURIComponent(message)}`;
