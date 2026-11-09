/**
 * Envío y solicitud de pedido por WhatsApp de los configuradores de imprenta.
 * El carrito local vive en `../cart/storage.ts`.
 */
import { contact } from "../content";

/** Envío: 6 €, gratis desde 199 € (importes en céntimos). */
export function deliveryQuote(subtotal: number | null | undefined, delivery: boolean) {
  if (subtotal == null || !Number.isSafeInteger(subtotal) || subtotal < 0) return null;
  const shipping = !delivery || subtotal >= 19900 ? 0 : 600;
  return { shipping, total: subtotal + shipping };
}

export function deliveryLine(subtotal: number | null | undefined, delivery: boolean) {
  if (!delivery) return "Sin envío a domicilio.";
  const quote = deliveryQuote(subtotal, delivery);
  return quote
    ? `Envío a domicilio: ${quote.shipping === 0 ? "gratuito" : "6 €"}, incluido en el total.`
    : "Envío a domicilio: 6 €. Gratis en pedidos desde 199 €.";
}

export const whatsappUrl = (message: string) => `${contact.whatsapp}?text=${encodeURIComponent(message)}`;
