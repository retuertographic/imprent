"use client";

import { useState } from "react";
import { Input } from "../form-controls";
import { OrderActions } from "../OrderActions";
import { ProductDelivery } from "../ProductDelivery";
import { formatEuro } from "../order";
import { photocallOrder } from "../pricing";
import type { PhotocallProduct } from "../types";

export function PhotocallConfigurator({ product }: { product: PhotocallProduct }) {
  const [quantityText, setQuantityText] = useState("1");
  const [delivery, setDelivery] = useState(false);
  const quantity = Number(quantityText);
  const { price, shipping, message, valid } = photocallOrder(product, quantity, delivery);

  return (
    <div className="print-config">
      <div className="print-field">
        <label htmlFor="photocall-quantity">Cantidad</label>
        <Input
          id="photocall-quantity"
          type="number"
          min={1}
          step={1}
          value={quantityText}
          onChange={(e) => setQuantityText(e.target.value)}
          aria-invalid={!valid}
        />
        {!valid && <small>Introduce una cantidad entera válida de al menos 1 unidad.</small>}
      </div>
      <div className="print-total" aria-live="polite">
        <span>{product.unit === null ? "Presupuesto personalizado" : "Total del pedido · sin IGIC"}</span>
        <strong>{product.unit === null ? "Consultar precio" : price && shipping ? formatEuro(shipping.total) : "—"}</strong>
        {price && (
          <p>
            {quantity} unidades × {formatEuro(price.unit)} / ud.
          </p>
        )}
        {product.unit === null && <p>Indícanos las unidades y te confirmamos el importe.</p>}
      </div>
      {price && <ProductDelivery subtotal={price.total} selected={delivery} onChange={setDelivery} />}
      {valid ? (
        <OrderActions
          image={`/catalogue/photocall-seritene-${product.size.toLowerCase()}-small.webp`}
          name={product.name}
          message={message}
          quantity={quantity}
          subtotal={price?.total}
          delivery={delivery}
          reprice={{ kind: "photocall", slug: product.slug, delivery }}
        />
      ) : (
        <button className="brand-button print-request" disabled>
          Revisa la cantidad
        </button>
      )}
      <p className="print-conditions">
        Pack completo con impresión y bolsa. Precios sin IGIC. Diseño, impuestos y plazo se confirman en el presupuesto.
      </p>
    </div>
  );
}
