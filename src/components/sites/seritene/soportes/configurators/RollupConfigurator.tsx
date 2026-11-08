"use client";

import { useState } from "react";
import { Input } from "../form-controls";
import { OrderActions } from "../OrderActions";
import { ProductDelivery } from "../ProductDelivery";
import { deliveryLine, formatEuro, shippingFor } from "../order";
import type { RollupProduct } from "../types";

/** Tramos de cantidad: 1, 2, 3–4, 5–9 y 10+ (5 % de descuento por tramo). */
const TIERS = [1, 2, 3, 5, 10];

function rollupPrice(product: RollupProduct, quantity: number) {
  if (!Number.isSafeInteger(quantity) || quantity < 1) return null;
  const tier = TIERS.findLastIndex((min) => quantity >= min);
  const unit = product.prices[tier];
  const total = unit * quantity;
  return Number.isSafeInteger(total) ? { unit, total } : null;
}

const tierLabel = (min: number, next: number | undefined) =>
  next ? (next === min + 1 ? min : `${min}–${next - 1}`) : `${min}+`;

export function RollupConfigurator({ product }: { product: RollupProduct }) {
  const [quantityText, setQuantityText] = useState("1");
  const [delivery, setDelivery] = useState(false);
  const quantity = Number(quantityText);
  const price = rollupPrice(product, quantity);
  const shipping = shippingFor(price?.total, delivery);
  const message = [
    `Hola Seritene, quiero ${product.name}.`,
    `Cantidad: ${quantity}.`,
    "Aluminio enrollable, tejido Oxford 200 g/m² sublimado a todo color y bolsa de transporte.",
    price && shipping ? `Precio sin IGIC: ${formatEuro(price.unit)} / ud. Total sin IGIC: ${formatEuro(shipping.total)}.` : "",
    deliveryLine(price?.total, delivery),
    "Quiero confirmar diseño, impuestos y plazo.",
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="print-config">
      <div className="print-field">
        <label htmlFor="rollup-quantity">Cantidad</label>
        <Input
          id="rollup-quantity"
          type="number"
          min={1}
          step={1}
          value={quantityText}
          onChange={(e) => setQuantityText(e.target.value)}
          aria-invalid={!price}
        />
        {!price && <small>Introduce una cantidad entera de al menos 1 unidad.</small>}
      </div>
      <details className="print-tariffs quantity-tariffs">
        <summary>Ver descuentos por cantidad</summary>
        <p className="print-conditions">PVP por unidad sin IGIC. Mismo tamaño y configuración.</p>
        <div className="print-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cantidad</th>
                <th>Precio / ud.</th>
                <th>Descuento</th>
              </tr>
            </thead>
            <tbody>
              {TIERS.map((min, i) => {
                const next = TIERS[i + 1];
                return (
                  <tr key={min} className={quantity >= min && (!next || quantity < next) ? "is-selected" : ""}>
                    <th scope="row">
                      <button type="button" onClick={() => setQuantityText(String(min))}>
                        {tierLabel(min, next)} uds.
                      </button>
                    </th>
                    <td>{formatEuro(product.prices[i])}</td>
                    <td>{i * 5}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>
      <div className="print-total" aria-live="polite" aria-atomic="true">
        <span>Total del pedido · sin IGIC</span>
        <strong>{price && shipping ? formatEuro(shipping.total) : "—"}</strong>
        {price && (
          <p>
            {quantity} unidades × {formatEuro(price.unit)} / ud.
          </p>
        )}
      </div>
      <ProductDelivery subtotal={price?.total} selected={delivery} onChange={setDelivery} />
      {price ? (
        <OrderActions
          image={`/catalogue/rollup-seritene-${product.width}-v2-small.webp`}
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
        Precios sin IGIC. Impuestos, diseño y plazo se confirman en el presupuesto. Revisamos tu archivo antes de producir.
      </p>
    </div>
  );
}
