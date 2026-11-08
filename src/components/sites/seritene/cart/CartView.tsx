"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Copy, Download, MessageCircle, ShoppingCart, Trash2 } from "lucide-react";
import { asset } from "../content";
import { SiteLink } from "../SiteLink";
import {
  LONG_MESSAGE,
  LONG_MESSAGE_TEXT,
  cartMessage,
  cartSummary,
  formatEuro,
  hasExpiredFiles,
  whatsappUrl,
} from "./order";
import { type CartItem, withoutBasePath } from "./storage";
import { useCart } from "./useCart";

/** Las imágenes guardadas son rutas de la web original (`/catalogue/…`): aquí se sirven desde `public/sites/seritene`. */
const itemImage = (src: string) => (src.startsWith("/") ? asset(src) : src);

/** Una selección del carrito, con enlace a su ficha y botón «Quitar». */
function CartLine({ item, onRemove }: { item: CartItem; onRemove: () => void }) {
  const productPath = withoutBasePath(item.path);
  return (
    <article className="cart-item">
      {item.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={itemImage(item.image)} alt={item.name} width="160" height="180" loading="lazy" />
      ) : (
        <div className="cart-image-placeholder">
          <ShoppingCart size={32} />
        </div>
      )}
      <div className="cart-item-copy">
        <SiteLink href={productPath}>
          <h2>{item.name}</h2>
        </SiteLink>
        <p>
          {item.quantity === null
            ? "Cantidad y opciones a confirmar"
            : `${item.quantity} ${item.quantity === 1 ? "unidad" : "unidades"}`}
        </p>
        <strong>{item.subtotal === null ? "A consultar" : formatEuro(item.subtotal)}</strong>
        <details>
          <summary>Ver selección</summary>
          <p className="cart-details">{item.details}</p>
        </details>
        <div className="cart-item-links">
          <SiteLink href={productPath}>Ver producto</SiteLink>
          <button type="button" onClick={onRemove}>
            <Trash2 size={15} /> Quitar
          </button>
        </div>
      </div>
    </article>
  );
}

/**
 * «Vaciar carrito» (mejora propia; producción solo permite quitar selecciones una a una).
 * Pide confirmación en línea para que un clic por error no borre el pedido.
 */
function ClearCart({ count, onClear }: { count: number; onClear: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasConfirming = useRef(false);

  useEffect(() => {
    if (confirming) confirmRef.current?.focus();
    else if (wasConfirming.current) triggerRef.current?.focus();
    wasConfirming.current = confirming;
  }, [confirming]);

  if (!confirming) {
    return (
      <div className="cart-clear">
        <button type="button" ref={triggerRef} onClick={() => setConfirming(true)}>
          <Trash2 size={15} /> Vaciar carrito
        </button>
      </div>
    );
  }

  return (
    <div
      className="cart-clear cart-clear-confirm"
      role="group"
      aria-label="Confirmar vaciar carrito"
      onKeyDown={(event) => {
        if (event.key === "Escape") setConfirming(false);
      }}
    >
      <p>
        ¿Quitar {count === 1 ? "la selección" : `las ${count} selecciones`} del carrito?
      </p>
      <button type="button" className="cart-clear-yes" ref={confirmRef} onClick={onClear}>
        <Trash2 size={15} /> Sí, vaciar
      </button>
      <button type="button" onClick={() => setConfirming(false)}>
        Cancelar
      </button>
    </div>
  );
}

/** Página /carrito/ (portada del componente `CartView` de seritene.com). */
export function CartView() {
  const { cart, ready, error, update } = useCart();
  const [status, setStatus] = useState("");
  const [cleared, setCleared] = useState(false);
  const summary = cartSummary(cart);
  const message = cartMessage(cart);
  const isLong = message.length > LONG_MESSAGE;
  const hasExpired = hasExpiredFiles(cart);
  const whatsapp = whatsappUrl(isLong ? LONG_MESSAGE_TEXT : message);

  function download() {
    const url = URL.createObjectURL(new Blob([message], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "pedido-seritene.txt";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus("Resumen descargado. Puedes adjuntarlo en WhatsApp.");
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setStatus("Resumen copiado.");
    } catch {
      setStatus("No se pudo copiar. Descarga el resumen para adjuntarlo.");
    }
  }

  const count = cart.items.length;

  return (
    <main id="contenido" className="brand-main cart-page">
      <div className="wrap">
        <nav className="breadcrumbs" aria-label="Ruta de navegación">
          <Link href="/">Inicio</Link>
          <span>/</span>
          <span>Carrito</span>
        </nav>
        <header className="cart-heading">
          <div>
            <p className="eyebrow">TODO JUNTO, MÁS FÁCIL</p>
            <h1>Tu carrito.</h1>
            <p>Revisa tu selección y solicita el pedido por WhatsApp.</p>
          </div>
          <SiteLink href="/productos/">
            Seguir viendo productos <ArrowRight size={18} />
          </SiteLink>
        </header>
        {error && (
          <p role="alert" className="order-error">
            {error}
          </p>
        )}
        {!ready ? (
          <p role="status">Cargando tu carrito…</p>
        ) : count ? (
          <div className="cart-layout">
            <div className="cart-items">
              {cart.items.map((item) => (
                <CartLine
                  key={item.id}
                  item={item}
                  onRemove={() =>
                    update((current) => ({ ...current, items: current.items.filter((i) => i.id !== item.id) }))
                  }
                />
              ))}
              <ClearCart
                count={count}
                onClear={() => {
                  update((current) => ({ ...current, items: [] }));
                  setStatus("");
                  setCleared(true);
                }}
              />
            </div>
            <aside className="cart-summary">
              <p className="eyebrow">TU PEDIDO</p>
              <h2>
                {count} {count === 1 ? "selección" : "selecciones"}
              </h2>
              <dl>
                <div>
                  <dt>{summary.pending ? "Subtotal con precio" : "Productos"}</dt>
                  <dd>{formatEuro(summary.known)}</dd>
                </div>
                <div>
                  <dt>Envío</dt>
                  <dd>
                    {cart.delivery
                      ? summary.shipping === null
                        ? "A confirmar"
                        : summary.shipping === 0
                          ? "Gratis"
                          : formatEuro(summary.shipping)
                      : "No incluido"}
                  </dd>
                </div>
              </dl>
              <label className="cart-shipping">
                <input
                  type="checkbox"
                  checked={cart.delivery}
                  onChange={(event) => {
                    const delivery = event.target.checked;
                    update((current) => ({ ...current, delivery }));
                  }}
                />
                Quiero envío a domicilio
              </label>
              <p className="cart-small">6 € por pedido · Gratis desde 199 €.</p>
              <div className="cart-grand">
                <span>Total orientativo</span>
                <strong>{summary.total === null ? "A confirmar" : formatEuro(summary.total)}</strong>
              </div>
              {summary.pending && (
                <p>Hay productos pendientes de presupuesto. El subtotal solo suma los que tienen precio.</p>
              )}
              <p className="cart-small">
                Sin impuestos. Confirmamos precios, disponibilidad, diseño y plazo por WhatsApp. No se realiza ningún
                cobro.
              </p>
              {hasExpired && (
                <p className="order-error">Algún archivo adjunto ha caducado. Vuelve a enviarlo por WhatsApp.</p>
              )}
              {isLong && (
                <p>Tu selección es extensa. Descarga el resumen y adjúntalo en WhatsApp para enviarlo completo.</p>
              )}
              <a className="brand-button" href={whatsapp} target="_blank" rel="noreferrer">
                <MessageCircle size={19} />
                Solicitar pedido por WhatsApp
              </a>
              <div className="cart-export">
                <button type="button" onClick={copy}>
                  <Copy size={15} />
                  Copiar resumen
                </button>
                <button type="button" onClick={download}>
                  <Download size={15} />
                  Descargar
                </button>
              </div>
              <p role="status">{status}</p>
            </aside>
          </div>
        ) : (
          <section className="cart-empty">
            {cleared && (
              <p role="status" className="cart-cleared">
                Carrito vaciado.
              </p>
            )}
            <ShoppingCart size={48} />
            <h2>Tu próxima idea empieza aquí.</h2>
            <p>Añade productos desde sus fichas y reúne todo en un mismo pedido.</p>
            <SiteLink href="/productos/" className="brand-button">
              Explorar productos <ArrowRight size={18} />
            </SiteLink>
          </section>
        )}
      </div>
    </main>
  );
}
