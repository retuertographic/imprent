"use client";

import { Check, MessageCircle, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { contact } from "../content";
import { SiteLink } from "../SiteLink";

/** Mismo almacenamiento que el carrito de seritene.com (`seritene-cart-v1`). */
const CART_KEY = "seritene-cart-v1";
const CART_EVENT = "seritene-cart-changed";

type CartItem = {
  id: string;
  name: string;
  path: string;
  image: string;
  quantity: number | null;
  subtotal: number | null;
  details: string;
  addedAt: number;
};
type Cart = { version: 1; items: CartItem[]; delivery: boolean };

function readCart(): Cart {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(CART_KEY) || "null");
    if (parsed && typeof parsed === "object" && "version" in parsed && parsed.version === 1) {
      const cart = parsed as Partial<Cart>;
      return { version: 1, items: Array.isArray(cart.items) ? cart.items : [], delivery: cart.delivery === true };
    }
  } catch {
    /* almacenamiento vacío o corrupto */
  }
  return { version: 1, items: [], delivery: false };
}

/** Quita del mensaje las líneas de envío y totales (se recalculan en el carrito). */
const cartDetails = (message: string) =>
  message
    .split("\n")
    .filter((line) => !/^Sin envío a domicilio\.|^Envío a domicilio:|^Transporte pendiente de confirmar\./.test(line))
    .map((line) => line.replace(/(?:Total del pedido|Total sin IGIC|Total de medallas sin IGIC|Total):\s*[\d.,\s]+€\.?/gi, "").trim())
    .filter(Boolean)
    .join("\n");

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
        path: location.pathname,
        image: "",
        quantity: null,
        subtotal: null,
        details: cartDetails(message),
        addedAt: Date.now(),
      };
      localStorage.setItem(CART_KEY, JSON.stringify({ ...cart, items: [...cart.items, item] }));
      window.dispatchEvent(new Event(CART_EVENT));
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
