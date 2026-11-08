"use client";

import { useState, useSyncExternalStore } from "react";
import { Check, MessageCircle, ShoppingCart } from "lucide-react";
import { SiteLink } from "../SiteLink";
import { MAX_CART_ITEMS, cartDetails, readCart, whatsappUrl, writeCart } from "./order";

type Props = {
  name: string;
  /** Mensaje completo de WhatsApp (incluye totales y envío). */
  message: string;
  quantity?: number | null;
  subtotal?: number | null;
  /** Ruta de imagen del producto tal como la guarda el carrito de producción. */
  image?: string;
  delivery?: boolean;
  expiresAt?: number;
};

const noopSubscribe = () => () => {};

/** «Solicitar pedido» por WhatsApp y «Añadir al carrito» (localStorage). */
export function OrderActions({ name, message, quantity = null, subtotal = null, image = "", delivery = false, expiresAt }: Props) {
  const [addedKey, setAddedKey] = useState("");
  const [error, setError] = useState("");
  const key = JSON.stringify([message, subtotal]);
  const [lastKey, setLastKey] = useState(key);
  // El botón se habilita tras hidratar, como en producción.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  // Si cambia la selección, se puede volver a añadir.
  if (lastKey !== key) {
    setLastKey(key);
    setAddedKey("");
  }
  const added = addedKey === key;

  function addToCart() {
    try {
      const cart = readCart();
      if (cart.items.length >= MAX_CART_ITEMS) {
        throw new Error("El carrito admite hasta 50 selecciones. Solicita este pedido antes de añadir más.");
      }
      writeCart({
        ...cart,
        delivery: cart.delivery || delivery,
        items: [
          ...cart.items,
          {
            id: crypto.randomUUID(),
            name,
            path: location.pathname,
            image,
            quantity,
            subtotal,
            details: cartDetails(message),
            addedAt: Date.now(),
            expiresAt,
          },
        ],
      });
      setAddedKey(key);
      setError("");
    } catch (e) {
      setError(
        e instanceof Error && e.message.startsWith("El carrito")
          ? e.message
          : "No se pudo guardar el producto. Puedes solicitarlo directamente por WhatsApp.",
      );
    }
  }

  return (
    <div className="order-actions">
      <div className="order-actions-buttons">
        <a className="brand-button order-direct" href={whatsappUrl(message)} target="_blank" rel="noreferrer">
          <MessageCircle size={18} />
          Solicitar pedido
        </a>
        <button type="button" className="brand-button order-add" onClick={addToCart} disabled={!mounted || added}>
          {added ? <Check size={18} /> : <ShoppingCart size={18} />} {added ? "Añadido al carrito" : "Añadir al carrito"}
        </button>
      </div>
      {added && (
        <p className="order-added" role="status">
          Selección guardada. <SiteLink href="/carrito/">Ver carrito →</SiteLink>
        </p>
      )}
      {error && (
        <p className="order-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
