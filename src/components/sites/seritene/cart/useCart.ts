"use client";
import { useState, useSyncExternalStore } from "react";
import { CART_KEY, type Cart, EMPTY_CART, parseCart, readCart, subscribeCart, writeCart } from "./storage";

type Snapshot = { cart: Cart; error: string };

const LOAD_ERROR: Snapshot = {
  cart: EMPTY_CART,
  error: "Este navegador no permite guardar el carrito. Puedes solicitar el pedido directamente por WhatsApp.",
};

// useSyncExternalStore necesita la misma referencia mientras no cambie lo guardado.
let cached: { raw: string | null; snapshot: Snapshot } | undefined;

function getSnapshot(): Snapshot {
  let raw: string | null;
  try {
    raw = localStorage.getItem(CART_KEY);
  } catch {
    return LOAD_ERROR;
  }
  if (cached?.raw !== raw) cached = { raw, snapshot: { cart: parseCart(raw), error: "" } };
  return cached.snapshot;
}

const getServerSnapshot = () => null;

/**
 * Carrito en vivo (se actualiza al añadir desde otra ficha o desde otra pestaña).
 * `ready` es falso en el HTML estático y durante la hidratación.
 */
export function useCart() {
  const snapshot = useSyncExternalStore(subscribeCart, getSnapshot, getServerSnapshot);
  const [updateError, setUpdateError] = useState("");

  function update(change: (cart: Cart) => Cart) {
    try {
      writeCart(change(readCart()));
      setUpdateError("");
    } catch {
      setUpdateError("No se ha podido guardar el cambio. Revisa el almacenamiento de tu navegador.");
    }
  }

  return {
    cart: snapshot?.cart ?? EMPTY_CART,
    ready: snapshot !== null,
    error: snapshot?.error || updateError,
    update,
  };
}
