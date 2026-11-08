/**
 * Solicitud de pedido por WhatsApp y carrito local (mismo formato y clave de almacenamiento que producción:
 * `seritene-cart-v1` en localStorage y el evento `seritene-cart-changed`).
 */
import { contact } from "../content";

export type CartItem = {
  id: string;
  name: string;
  path: string;
  image: string;
  quantity: number | null;
  subtotal: number | null;
  details: string;
  addedAt: number;
  expiresAt?: number;
};

export type Cart = { version: 1; items: CartItem[]; delivery: boolean };

const CART_KEY = "seritene-cart-v1";
export const CART_EVENT = "seritene-cart-changed";
const EMPTY: Cart = { version: 1, items: [], delivery: false };

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

function parseCart(raw: string | null): Cart {
  try {
    const data = JSON.parse(raw || "null") as Partial<Cart> | null;
    if (data?.version !== 1 || !Array.isArray(data.items)) return EMPTY;
    return {
      version: 1,
      items: data.items
        .filter(
          (e) =>
            e &&
            typeof e.id === "string" &&
            typeof e.name === "string" &&
            e.name.length <= 300 &&
            typeof e.details === "string" &&
            e.details.length <= 16000 &&
            typeof e.path === "string" &&
            /^\/(?!\/)/.test(e.path) &&
            typeof e.image === "string" &&
            (!e.image || /^\/(?!\/)|^https:\/\//.test(e.image)) &&
            (e.quantity === null || (Number.isSafeInteger(e.quantity) && e.quantity > 0)) &&
            (e.subtotal === null || (Number.isSafeInteger(e.subtotal) && e.subtotal >= 0)) &&
            Number.isFinite(e.addedAt),
        )
        .slice(0, 50),
      delivery: data.delivery === true,
    };
  } catch {
    return EMPTY;
  }
}

/** Quita del mensaje las líneas de envío e importes (el carrito los recalcula). */
export const cartDetails = (message: string) =>
  message
    .split("\n")
    .filter((line) => !/^Sin envío a domicilio\.|^Envío a domicilio:|^Transporte pendiente de confirmar\./.test(line))
    .map((line) => line.replace(/(?:Total del pedido|Total sin IGIC|Total de medallas sin IGIC|Total):\s*[\d.,\s]+€\.?/gi, "").trim())
    .filter(Boolean)
    .join("\n");

export const readCart = () => parseCart(localStorage.getItem(CART_KEY));

export function writeCart(cart: Cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event(CART_EVENT));
}
