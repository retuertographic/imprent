"use client";

import { Check, MessageCircle, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { contact } from "../content";
import { SiteLink } from "../SiteLink";
import { type CartItem, cartDetails, currentProductPath, readCart, writeCart } from "../cart/storage";

/** Botones «Solicitar pedido» (WhatsApp) y «Añadir al carrito». */
export function OrderActions({ name, message }: { name: string; message: string }) {
  const [ready, setReady] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setReady(true), []);

  function add() {
    try {
      const cart = readCart();
      if (cart.items.length >= 50)
        throw new Error("El carrito admite hasta 50 selecciones. Solicita este pedido antes de añadir más.");
      const item: CartItem = {
        id: crypto.randomUUID(),
        name,
        path: currentProductPath(),
        image: "",
        quantity: null,
        subtotal: null,
        details: cartDetails(message),
        addedAt: Date.now(),
      };
      writeCart({ ...cart, items: [...cart.items, item] });
      setAdded(true);
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
        <a
          className="brand-button order-direct"
          href={`${contact.whatsapp}?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noreferrer"
        >
          <MessageCircle size={18} />
          Solicitar pedido
        </a>
        <button type="button" className="brand-button order-add" onClick={add} disabled={!ready || added}>
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
