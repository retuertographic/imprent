/**
 * Solicitud de pedido: envío, formato de precios y enlace de WhatsApp (el carrito está en `../cart/storage`).
 * Portado de los chunks de producción `order-request` y `fullprint-products` de seritene.com.
 * Los importes van en céntimos.
 */
import { contact } from "../content";

/** Pedidos desde 199 € tienen envío gratuito; si no, 6 €. */
const FREE_SHIPPING_FROM = 19900;
const SHIPPING = 600;

export function shippingFor(subtotal: number | null | undefined, delivery: boolean) {
  if (subtotal == null || !Number.isSafeInteger(subtotal) || subtotal < 0) return null;
  const shipping = !delivery || subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING;
  return { shipping, total: subtotal + shipping };
}

/** Línea de envío que se añade al mensaje de WhatsApp. */
export function deliveryLine(subtotal: number | null | undefined, delivery: boolean) {
  if (!delivery) return "Sin envío a domicilio.";
  const result = shippingFor(subtotal, delivery);
  return result
    ? `Envío a domicilio: ${result.shipping === 0 ? "gratuito" : "6 €"}, incluido en el total.`
    : "Envío a domicilio: 6 €. Gratis en pedidos desde 199 €.";
}

const euroFormat = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
const numberFormat = new Intl.NumberFormat("es-ES");

/** 11925 → "119,25 €" */
export const formatEuro = (cents: number) => euroFormat.format(cents / 100);
/** 1000 → "1000" (es-ES no agrupa por debajo de 10.000) */
export const formatNumber = (n: number) => numberFormat.format(n);

export const whatsappUrl = (message: string) => `${contact.whatsapp}?text=${encodeURIComponent(message)}`;
