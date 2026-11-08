"use client";
import { ShoppingCart } from "lucide-react";
import { useSyncExternalStore } from "react";
import { SiteLink } from "../SiteLink";
import { CART_CHANGE_EVENT, readCart } from "./cart";

function subscribe(onChange: () => void) {
  window.addEventListener(CART_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CART_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

const countItems = () => {
  try {
    return readCart().items.length;
  } catch {
    return 0;
  }
};

/**
 * Icono del carrito de la cabecera original (`.ch-icon.ch-cart`), con el número de selecciones.
 * Pensado para `SiteHeader` (dentro de `.ch-actions`, antes del botón del buscador).
 */
export function CartLink() {
  const count = useSyncExternalStore(subscribe, countItems, () => 0);
  return (
    <SiteLink
      className="ch-icon ch-cart"
      href="/carrito/"
      aria-label={`Carrito: ${count} ${count === 1 ? "selección" : "selecciones"}`}
    >
      <ShoppingCart size={21} />
      {count > 0 && <span>{count}</span>}
    </SiteLink>
  );
}
