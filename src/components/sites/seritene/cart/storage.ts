/**
 * Carrito local de seritene.com: `localStorage["seritene-cart-v1"]`, mismo formato y validación que el
 * chunk `order-request` de producción. Cada escritura emite `seritene-cart-changed` en `window`.
 *
 * `path` e `image` se guardan como rutas de la web original (`/fullprint/fitpro/`,
 * `/fullprint-examples/x.webp`): se resuelven con `SiteLink` / `asset()` al pintarlas, nunca al guardarlas.
 */
import { BASE_PATH } from "../content";

export type CartItem = {
  id: string;
  name: string;
  /** Ruta de la ficha en seritene.com, p. ej. `/imprenta/flyers/`. */
  path: string;
  /** Ruta raíz (`/catalogue/…`) o URL https; vacía si no hay imagen. */
  image: string;
  quantity: number | null;
  /** Céntimos sin envío ni impuestos; `null` = a consultar. */
  subtotal: number | null;
  details: string;
  addedAt: number;
  expiresAt?: number;
};

export type Cart = { version: 1; items: CartItem[]; delivery: boolean };

export const CART_KEY = "seritene-cart-v1";
export const CART_CHANGE_EVENT = "seritene-cart-changed";
export const CART_LIMIT = 50;
export const EMPTY_CART: Cart = { version: 1, items: [], delivery: false };

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

/** Interpreta el JSON guardado; descarta entradas no válidas y se queda con las 50 primeras. */
export function parseCart(raw: string | null): Cart {
  try {
    const parsed: unknown = JSON.parse(raw || "null");
    if (!parsed || typeof parsed !== "object") return EMPTY_CART;
    const cart = parsed as { version?: unknown; items?: unknown; delivery?: unknown };
    if (cart.version !== 1 || !Array.isArray(cart.items)) return EMPTY_CART;
    return { version: 1, items: cart.items.filter(isCartItem).slice(0, CART_LIMIT), delivery: cart.delivery === true };
  } catch {
    return EMPTY_CART;
  }
}

/** Lee el carrito (lanza si el navegador no permite localStorage). */
export const readCart = () => parseCart(localStorage.getItem(CART_KEY));

/** Guarda el carrito y avisa a los suscriptores (lanza si no se puede guardar). */
export function writeCart(cart: Cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event(CART_CHANGE_EVENT));
}

/** Escucha cambios del carrito en esta pestaña y en otras. Devuelve la función para dejar de escuchar. */
export function subscribeCart(onChange: () => void) {
  window.addEventListener(CART_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CART_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * Ruta de seritene.com de una ruta del clon: quita el prefijo de GitHub Pages (`/imprent/fullprint/fitpro/`
 * → `/fullprint/fitpro/`). Las rutas ya guardadas sin prefijo pasan tal cual.
 */
export function withoutBasePath(path: string) {
  if (!BASE_PATH || !path.startsWith(BASE_PATH + "/")) return path;
  return path.slice(BASE_PATH.length);
}

/** `path` que se guarda al añadir desde la ficha actual (sin prefijo, como en producción). */
export const currentProductPath = () => withoutBasePath(location.pathname);

/** Quita del mensaje de WhatsApp las líneas de envío y los totales: el carrito los recalcula. */
export function cartDetails(message: string) {
  return message
    .split("\n")
    .filter((line) => !/^Sin envío a domicilio\.|^Envío a domicilio:|^Transporte pendiente de confirmar\./.test(line))
    .map((line) =>
      line
        .replace(/(?:Total del pedido|Total sin IGIC|Total de medallas sin IGIC|Total):\s*[\d.,\s]+€\.?/gi, "")
        .trim(),
    )
    .filter(Boolean)
    .join("\n");
}
