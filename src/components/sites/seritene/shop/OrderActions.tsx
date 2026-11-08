"use client";

import { useEffect, useState } from "react";
import { Check, MessageCircle, ShoppingCart } from "lucide-react";
import { SiteLink } from "../SiteLink";
import { cartDetails, readCart, whatsappUrl, writeCart } from "./order";

type Props = {
  name: string;
  /** Texto del mensaje de WhatsApp (una línea por dato). */
  message: string;
  quantity?: number | null;
  subtotal?: number | null;
  image?: string;
  delivery?: boolean;
  /** Ruta de la ficha en seritene.com que se guarda en el carrito. */
  path: string;
  /** Icono de WhatsApp en el botón principal (las fichas estáticas no lo llevan). */
  icons?: boolean;
};

/** Botones «Solicitar pedido» (WhatsApp) y «Añadir al carrito». */
export function OrderActions({ name, message, quantity = null, subtotal = null, image = "", delivery = false, path, icons = true }: Props) {
  const [added, setAdded] = useState("");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const signature = JSON.stringify([message, subtotal]);

  useEffect(() => setReady(true), []);
  useEffect(() => setAdded(""), [signature]);

  function add() {
    try {
      const cart = readCart();
      if (cart.items.length >= 50) {
        throw new Error("El carrito admite hasta 50 selecciones. Solicita este pedido antes de añadir más.");
      }
      writeCart({
        ...cart,
        delivery: cart.delivery || delivery,
        items: [
          ...cart.items,
          { id: crypto.randomUUID(), name, path, image, quantity, subtotal, details: cartDetails(message), addedAt: Date.now() },
        ],
      });
      setAdded(signature);
      setError("");
    } catch (e) {
      setError(
        e instanceof Error && e.message.startsWith("El carrito")
          ? e.message
          : "No se pudo guardar el producto. Puedes solicitarlo directamente por WhatsApp.",
      );
    }
  }

  const isAdded = added === signature;
  return (
    <div className="order-actions">
      <div className="order-actions-buttons">
        <a className="brand-button order-direct" href={whatsappUrl(message)} target="_blank" rel="noreferrer">
          {icons && <MessageCircle size={18} />}
          Solicitar pedido
        </a>
        <button type="button" className="brand-button order-add" onClick={add} disabled={!ready || isAdded}>
          {icons && (isAdded ? <Check size={18} /> : <ShoppingCart size={18} />)} {isAdded ? "Añadido al carrito" : "Añadir al carrito"}
        </button>
      </div>
      {isAdded && (
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
