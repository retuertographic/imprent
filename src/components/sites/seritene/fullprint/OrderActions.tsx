"use client";
import { Check, MessageCircle, ShoppingCart, Truck } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { SiteLink } from "../SiteLink";
import { CART_LIMIT, cartDetails, currentProductPath, readCart, writeCart } from "../cart/storage";
import { Checkbox } from "./controls";
import { whatsappUrl, withShipping } from "./pricing";
import type { Reprice } from "../cart/reprice";

const noopSubscribe = () => () => {};

type DeliveryProps = { subtotal: number | undefined; selected: boolean; onChange: (selected: boolean) => void };

/** Casilla «Añadir envío a domicilio». */
export function ProductDelivery({ subtotal, selected, onChange }: DeliveryProps) {
  const result = withShipping(subtotal, selected);
  return (
    <label className={`product-delivery${selected ? " is-selected" : ""}`}>
      <Checkbox checked={selected} onCheckedChange={onChange} aria-label="Añadir envío a domicilio" />
      <Truck size={22} aria-hidden="true" />
      <span className="product-delivery-copy">
        <strong>Añadir envío a domicilio</strong>
        <span>6 € · Gratis en pedidos desde 199 €.</span>
        <small aria-live="polite">
          {selected
            ? result
              ? result.shipping === 0
                ? "Tu pedido tiene envío gratuito."
                : "Envío de 6 € incluido en el total."
              : "Confirmaremos el envío según el importe del pedido."
            : "No se añaden gastos de envío."}
        </small>
      </span>
    </label>
  );
}

type OrderProps = {
  name: string;
  message: string;
  quantity: number | null;
  subtotal: number | null;
  image: string;
  delivery: boolean;
  /** Selección para recalcular en el carrito al cambiar la cantidad (mejora propia). */
  reprice?: Reprice;
};

/** «Solicitar pedido» por WhatsApp y «Añadir al carrito». */
export function OrderActions({ name, message, quantity, subtotal, image, delivery, reprice }: OrderProps) {
  const selectionKey = JSON.stringify([message, subtotal]);
  const [addedKey, setAddedKey] = useState("");
  const [error, setError] = useState("");
  // El carrito solo existe en el navegador: el botón se activa tras hidratar.
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  // Una selección distinta vuelve a permitir añadirla.
  const [prevKey, setPrevKey] = useState(selectionKey);
  if (prevKey !== selectionKey) {
    setPrevKey(selectionKey);
    setAddedKey("");
  }
  const added = addedKey === selectionKey;

  function add() {
    try {
      const cart = readCart();
      if (cart.items.length >= CART_LIMIT) {
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
            path: currentProductPath(),
            image,
            quantity,
            subtotal,
            details: cartDetails(message),
            addedAt: Date.now(),
            reprice,
          },
        ],
      });
      setAddedKey(selectionKey);
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
        <button type="button" className="brand-button order-add" onClick={add} disabled={!hydrated || added}>
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
