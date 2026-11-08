"use client";

import { Truck } from "lucide-react";
import { Checkbox } from "./form-controls";
import { shippingFor } from "./order";

type Props = {
  subtotal: number | null | undefined;
  selected: boolean;
  onChange: (selected: boolean) => void;
};

/** Casilla «Añadir envío a domicilio» (6 €, gratis desde 199 €). */
export function ProductDelivery({ subtotal, selected, onChange }: Props) {
  const result = shippingFor(subtotal, selected);
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
