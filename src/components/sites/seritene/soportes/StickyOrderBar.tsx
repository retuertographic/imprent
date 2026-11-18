"use client";

import { useEffect, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { Check, ShoppingCart } from "lucide-react";
import { SiteLink } from "../SiteLink";

export type StickyOrder = {
  /** Total que se muestra en la barra («120,05 €», «A presupuestar»). */
  total: string;
  /** Detalle corto bajo el total («25 unidades»). */
  detail?: string;
  /**
   * Selector del panel de precio de la ficha: mientras se ve (o se ven los botones reales), la barra se oculta.
   * Se busca primero entre los antecesores de los botones y, si no, en la página.
   */
  panel?: string;
};

type Props = StickyOrder & {
  /** Contenedor de los botones reales («Solicitar pedido», «Añadir al carrito»). */
  actions: RefObject<HTMLElement | null>;
  onAdd: () => void;
  disabled: boolean;
  added: boolean;
  error?: string;
};

/**
 * Barra fija inferior en móvil (≤ 900 px) con el total y «Añadir al carrito» (mejora propia).
 * No tiene lógica propia: el botón llama a la misma acción que el botón real de la ficha.
 * Se oculta mientras el panel de precio o los botones reales están en pantalla. Mientras existe, el body
 * lleva `has-sticky-order` (y `sticky-order-visible` cuando se ve) para apartar los botones flotantes.
 */
export function StickyOrderBar({ total, detail, panel, actions, onAdd, disabled, added, error = "" }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const own = actions.current;
    if (!own || typeof IntersectionObserver === "undefined") return;
    const panelEl = panel ? (own.closest(panel) ?? document.querySelector(panel)) : null;
    const targets = panelEl ? [own, panelEl] : [own];
    const seen = new Map<Element, boolean>();
    const observer = new IntersectionObserver((entries) => {
      for (const e of entries) seen.set(e.target, e.isIntersecting);
      setVisible(![...seen.values()].some(Boolean));
    });
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [actions, panel]);

  useEffect(() => {
    const body = document.body.classList;
    body.add("has-sticky-order");
    return () => body.remove("has-sticky-order", "sticky-order-visible");
  }, []);

  useEffect(() => {
    document.body.classList.toggle("sticky-order-visible", visible);
  }, [visible]);

  // Portal al body: un antecesor con transform (animaciones de entrada) rompería el position: fixed.
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className={`sticky-order-bar${visible ? " is-visible" : ""}`} aria-hidden={!visible} inert={!visible}>
      <div className="sticky-order-total">
        <strong>{total}</strong>
        {detail && <span>{detail}</span>}
      </div>
      {added ? (
        <SiteLink href="/carrito/" className="brand-button sticky-order-button">
          <Check size={18} aria-hidden="true" /> Ver carrito
        </SiteLink>
      ) : (
        <button type="button" className="brand-button sticky-order-button" onClick={onAdd} disabled={disabled}>
          <ShoppingCart size={18} aria-hidden="true" /> Añadir al carrito
        </button>
      )}
      {error && (
        <p className="sticky-order-error" role="alert">
          {error}
        </p>
      )}
    </div>,
    document.body,
  );
}
