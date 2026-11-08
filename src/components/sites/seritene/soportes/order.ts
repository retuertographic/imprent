/**
 * Solicitud de pedido: envío, formato de precios, carrito local y enlace de WhatsApp.
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

/* ---------- Carrito (localStorage, mismo formato que producción) ---------- */

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
const CART_EVENT = "seritene-cart-changed";
export const MAX_CART_ITEMS = 50;
const EMPTY_CART: Cart = { version: 1, items: [], delivery: false };

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const e = value as Record<string, unknown>;
  return (
    typeof e.id === "string" &&
    typeof e.name === "string" &&
    e.name.length <= 300 &&
    typeof e.details === "string" &&
    e.details.length <= 16000 &&
    typeof e.path === "string" &&
    /^\/(?!\/)/.test(e.path) &&
    typeof e.image === "string" &&
    (!e.image || /^\/(?!\/)|^https:\/\//.test(e.image)) &&
    (e.quantity === null || (Number.isSafeInteger(e.quantity) && (e.quantity as number) > 0)) &&
    (e.subtotal === null || (Number.isSafeInteger(e.subtotal) && (e.subtotal as number) >= 0)) &&
    Number.isFinite(e.addedAt)
  );
}

function parseCart(raw: string | null): Cart {
  try {
    const parsed: unknown = JSON.parse(raw || "null");
    if (!parsed || typeof parsed !== "object") return EMPTY_CART;
    const cart = parsed as { version?: unknown; items?: unknown; delivery?: unknown };
    if (cart.version !== 1 || !Array.isArray(cart.items)) return EMPTY_CART;
    return { version: 1, items: cart.items.filter(isCartItem).slice(0, MAX_CART_ITEMS), delivery: cart.delivery === true };
  } catch {
    return EMPTY_CART;
  }
}

export const readCart = () => parseCart(localStorage.getItem(CART_KEY));

export function writeCart(cart: Cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event(CART_EVENT));
}

/** Quita del mensaje las líneas de envío y los totales: el carrito los recalcula. */
export function cartDetails(message: string) {
  return message
    .split("\n")
    .filter((line) => !/^Sin envío a domicilio\.|^Envío a domicilio:|^Transporte pendiente de confirmar\./.test(line))
    .map((line) => line.replace(/(?:Total del pedido|Total sin IGIC|Total de medallas sin IGIC|Total):\s*[\d.,\s]+€\.?/gi, "").trim())
    .filter(Boolean)
    .join("\n");
}
