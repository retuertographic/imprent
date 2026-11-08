/**
 * Carrito local de seritene.com (localStorage `seritene-cart-v1`), mismo formato que la web original.
 * La página /carrito/ aún no está clonada: el enlace «Ver carrito» va a producción.
 */

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

const STORAGE_KEY = "seritene-cart-v1";
export const CART_CHANGE_EVENT = "seritene-cart-changed";
export const CART_LIMIT = 50;

const EMPTY: Cart = { version: 1, items: [], delivery: false };

const isItem = (e: unknown): e is CartItem => {
  if (!e || typeof e !== "object") return false;
  const i = e as Record<string, unknown>;
  return (
    typeof i.id === "string" &&
    typeof i.name === "string" &&
    i.name.length <= 300 &&
    typeof i.details === "string" &&
    i.details.length <= 16000 &&
    typeof i.path === "string" &&
    /^\/(?!\/)/.test(i.path) &&
    typeof i.image === "string" &&
    (!i.image || /^\/(?!\/)|^https:\/\//.test(i.image)) &&
    (i.quantity === null || (Number.isSafeInteger(i.quantity) && (i.quantity as number) > 0)) &&
    (i.subtotal === null || (Number.isSafeInteger(i.subtotal) && (i.subtotal as number) >= 0)) &&
    Number.isFinite(i.addedAt)
  );
};

function parseCart(raw: string | null): Cart {
  try {
    const data = JSON.parse(raw || "null") as { version?: unknown; items?: unknown; delivery?: unknown } | null;
    if (data?.version !== 1 || !Array.isArray(data.items)) return EMPTY;
    return { version: 1, items: data.items.filter(isItem).slice(0, CART_LIMIT), delivery: data.delivery === true };
  } catch {
    return EMPTY;
  }
}

export const readCart = () => parseCart(localStorage.getItem(STORAGE_KEY));

export function writeCart(cart: Cart) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event(CART_CHANGE_EVENT));
}

/** Quita del mensaje las líneas de envío y los totales (el carrito los recalcula). */
export function cartDetails(message: string) {
  return message
    .split("\n")
    .filter((line) => !/^Sin envío a domicilio\.|^Envío a domicilio:|^Transporte pendiente de confirmar\./.test(line))
    .map((line) =>
      line.replace(/(?:Total del pedido|Total sin IGIC|Total de medallas sin IGIC|Total):\s*[\d.,\s]+€\.?/gi, "").trim(),
    )
    .filter(Boolean)
    .join("\n");
}
