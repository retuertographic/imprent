"use client";

import { useState } from "react";
import { Input } from "../form-controls";
import { OrderActions } from "../OrderActions";
import { ProductDelivery } from "../ProductDelivery";
import { formatEuro } from "../order";
import { tentOrder } from "../pricing";
import type { TentProduct } from "../types";

export function TentConfigurator({ product }: { product: TentProduct }) {
  const [quantityText, setQuantityText] = useState("1");
  const [delivery, setDelivery] = useState(false);
  const quantity = Number(quantityText);
  const { price, shipping, message } = tentOrder(product, quantity, delivery);

  return (
    <div className="print-config">
      <div className="print-field">
        <label htmlFor="tent-quantity">Cantidad</label>
        <Input
          id="tent-quantity"
          type="number"
          min={1}
          step={1}
          value={quantityText}
          onChange={(e) => setQuantityText(e.target.value)}
          aria-invalid={!price}
        />
        {!price && <small>Introduce una cantidad entera válida de al menos 1 unidad.</small>}
      </div>
      <div className="print-total" aria-live="polite">
        <span>Total del pedido · sin IGIC</span>
        <strong>{price && shipping ? formatEuro(shipping.total) : "—"}</strong>
        {price && (
          <p>
            {quantity} unidades × {formatEuro(price.unit)} / ud.
          </p>
        )}
      </div>
      {price && <ProductDelivery subtotal={price.total} selected={delivery} onChange={setDelivery} />}
      {price ? (
        <OrderActions
          image={`/catalogue/carpa-seritene-${product.image}-small.webp`}
          name={product.name}
          message={message}
          quantity={quantity}
          subtotal={price.total}
          delivery={delivery}
          reprice={{ kind: "tent", slug: product.slug, delivery }}
        />
      ) : (
        <button className="brand-button print-request" disabled>
          Revisa la cantidad
        </button>
      )}
      <p className="print-conditions">
        Pack con estructura, techo impreso y bolsa con ruedas. Precios sin IGIC. Cerramientos y contrapesos aparte. Diseño,
        impuestos y plazo se confirman en el presupuesto.
      </p>
    </div>
  );
}
