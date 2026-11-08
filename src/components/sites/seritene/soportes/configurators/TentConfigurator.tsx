"use client";

import { useState } from "react";
import { Input } from "../form-controls";
import { OrderActions } from "../OrderActions";
import { ProductDelivery } from "../ProductDelivery";
import { deliveryLine, formatEuro, shippingFor } from "../order";
import type { TentProduct } from "../types";

function tentPrice(product: TentProduct, quantity: number) {
  if (!Number.isSafeInteger(quantity) || quantity < 1) return null;
  const total = product.unit * quantity;
  return Number.isSafeInteger(total) ? { unit: product.unit, total } : null;
}

export function TentConfigurator({ product }: { product: TentProduct }) {
  const [quantityText, setQuantityText] = useState("1");
  const [delivery, setDelivery] = useState(false);
  const quantity = Number(quantityText);
  const price = tentPrice(product, quantity);
  const shipping = shippingFor(price?.total, delivery);
  const message = [
    `Hola Seritene, quiero presupuesto para ${product.name}.`,
    `Cantidad: ${quantity}.`,
    "Pack completo: estructura de aluminio plegable de perfil hexagonal de 40 mm, techo impreso en poliéster impermeable de 260 g/m² y bolsa de nylon con ruedas.",
    price && shipping ? `Precio sin IGIC: ${formatEuro(price.unit)} / ud. Total sin IGIC: ${formatEuro(shipping.total)}.` : "",
    price ? deliveryLine(price.total, delivery) : "",
    "Quiero confirmar diseño, impuestos y plazo.",
  ]
    .filter(Boolean)
    .join("\n");

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
