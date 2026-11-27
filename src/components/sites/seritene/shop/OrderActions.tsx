"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ShoppingCart } from "lucide-react";
import { SiteLink } from "../SiteLink";
import { cartDetails, readCart, writeCart } from "../cart/storage";
import type { Reprice } from "../cart/reprice";
import { DesignSendNotes, OrderWhatsApp } from "../design/DesignSend";
import { withDesignLine } from "../design/designChoice";
import type { DesignState } from "../design/useDesign";
import { StickyOrderBar, type StickyOrder } from "../soportes/StickyOrderBar";

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
  /** Selección para recalcular en el carrito al cambiar la cantidad (mejora propia). */
  reprice?: Reprice;
  /** Barra fija inferior en móvil con el total y «Añadir al carrito» (mejora propia). */
  sticky?: StickyOrder;
  /** Paso «Tu diseño» (mejora propia): añade la línea de diseño y el envío del logo. */
  design?: DesignState | null;
};

/** Botones «Solicitar pedido» (WhatsApp) y «Añadir al carrito». */
export function OrderActions({ name, message, quantity = null, subtotal = null, image = "", delivery = false, path, icons = true, reprice, sticky, design }: Props) {
  const actionsRef = useRef<HTMLDivElement>(null);
  const [added, setAdded] = useState("");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [sendStatus, setSendStatus] = useState("");
  const choice = design?.choice ?? null;
  const fullMessage = withDesignLine(message, choice);
  const signature = JSON.stringify([message, subtotal, choice]);

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
          { id: crypto.randomUUID(), name, path, image, quantity, subtotal, details: cartDetails(message), addedAt: Date.now(), reprice, ...(choice ? { design: choice } : {}) },
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
    <div className="order-actions" ref={actionsRef}>
      <div className="order-actions-buttons">
        <OrderWhatsApp message={fullMessage} design={design} icons={icons} onStatus={setSendStatus} />
        <button type="button" className="brand-button order-add" onClick={add} disabled={!ready || isAdded}>
          {icons && (isAdded ? <Check size={18} /> : <ShoppingCart size={18} />)} {isAdded ? "Añadido al carrito" : "Añadir al carrito"}
        </button>
      </div>
      <DesignSendNotes message={fullMessage} name={name} design={design} status={sendStatus} onStatus={setSendStatus} />
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
      {sticky && ready && (
        <StickyOrderBar {...sticky} actions={actionsRef} onAdd={add} disabled={!ready} added={isAdded} error={error} />
      )}
    </div>
  );
}
