"use client";

import type { InputHTMLAttributes, OptionHTMLAttributes, SelectHTMLAttributes } from "react";
import { Check, ChevronDown, Truck } from "lucide-react";
import { deliveryQuote } from "./order";

// Clases de los controles shadcn/ui que usa producción (ya compiladas en base.css).
const SELECT_CLASS =
  "h-9 w-full min-w-0 appearance-none rounded-md border border-input bg-transparent px-3 py-2 pr-9 text-sm shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed data-[size=sm]:h-8 data-[size=sm]:py-1 dark:bg-input/30 dark:hover:bg-input/50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40";
const INPUT_CLASS =
  "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40";
const CHECKBOX_CLASS =
  "peer size-4 shrink-0 rounded-[4px] border border-input shadow-xs transition-shadow outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:bg-input/30 dark:aria-invalid:ring-destructive/40 dark:data-[state=checked]:bg-primary";

export function NativeSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="group/native-select relative w-fit has-[select:disabled]:opacity-50" data-slot="native-select-wrapper">
      <select data-slot="native-select" data-size="default" className={SELECT_CLASS} {...props} />
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted-foreground opacity-50 select-none"
        aria-hidden="true"
        data-slot="native-select-icon"
      />
    </div>
  );
}

export function NativeOption(props: OptionHTMLAttributes<HTMLOptionElement>) {
  return <option data-slot="native-select-option" className="bg-[Canvas] text-[CanvasText]" {...props} />;
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input data-slot="input" className={INPUT_CLASS} {...props} />;
}

/** Casilla «Añadir envío a domicilio» (6 €, gratis desde 199 €). */
export function ProductDelivery({
  subtotal,
  selected,
  onChange,
}: {
  subtotal: number | null | undefined;
  selected: boolean;
  onChange: (value: boolean) => void;
}) {
  const quote = deliveryQuote(subtotal, selected);
  const state = selected ? "checked" : "unchecked";
  return (
    <label className={`product-delivery${selected ? " is-selected" : ""}`}>
      <button
        type="button"
        role="checkbox"
        aria-checked={selected}
        data-state={state}
        value="on"
        data-slot="checkbox"
        className={CHECKBOX_CLASS}
        aria-label="Añadir envío a domicilio"
        onClick={() => onChange(!selected)}
      >
        {selected && (
          <span data-state={state} data-slot="checkbox-indicator" className="grid place-content-center text-current transition-none" style={{ pointerEvents: "none" }}>
            <Check className="size-3.5" />
          </span>
        )}
      </button>
      <Truck size={22} aria-hidden="true" />
      <span className="product-delivery-copy">
        <strong>Añadir envío a domicilio</strong>
        <span>6 € · Gratis en pedidos desde 199 €.</span>
        <small aria-live="polite">
          {selected
            ? quote
              ? quote.shipping === 0
                ? "Tu pedido tiene envío gratuito."
                : "Envío de 6 € incluido en el total."
              : "Confirmaremos el envío según el importe del pedido."
            : "No se añaden gastos de envío."}
        </small>
      </span>
    </label>
  );
}
