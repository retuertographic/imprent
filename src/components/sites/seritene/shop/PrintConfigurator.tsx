"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { formatCents } from "./catalog";
import { NativeOption, NativeSelect, ProductDelivery, TextInput } from "./FormControls";
import { OrderActions } from "./OrderActions";
import { formatUnits } from "../units";
import { DesignStep } from "../design/DesignStep";
import { OrderTimeline } from "../design/OrderTimeline";
import type { PrintSize } from "../design/designChoice";
import { useDesign } from "../design/useDesign";
import { flyerFormats, PRINT_MINIMUM, printOrder, printQuantityOptions, type PrintProduct } from "./printData";

const number = new Intl.NumberFormat("es-ES");
const fmt = (n: number) => number.format(n);

/** Medidas que da la propia ficha (formatos de flyer, trípticos, pulseras) para el aviso de resolución. */
const FLYER_SIZES: Record<string, [number, number, string]> = {
  a6: [105, 148, "A6 (10,5 × 14,8 cm)"],
  a5: [148, 210, "A5 (14,8 × 21 cm)"],
  a4: [210, 297, "A4 (21 × 29,7 cm)"],
  dl: [100, 210, "DL (10 × 21 cm)"],
};

function printSizeFor(slug: string, format: string | undefined): PrintSize | null {
  const flyer = slug === "flyers" && format ? FLYER_SIZES[format] : undefined;
  if (flyer) return { widthMm: flyer[0], heightMm: flyer[1], label: `un flyer ${flyer[2]}` };
  if (slug === "tripticos") return { widthMm: 210, heightMm: 300, label: "un tríptico de 21 × 30 cm" };
  if (slug === "pulseras-full-color") return { widthMm: 250, heightMm: 20, label: "una pulsera de 25 × 2 cm" };
  return null;
}

/** Configurador de imprenta: formato, caras, acabado, cantidad, diseño y envío (lógica de producción). */
export function PrintConfigurator({ product }: { product: PrintProduct }) {
  const [delivery, setDelivery] = useState(false);
  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? "");
  const [quantityText, setQuantityText] = useState(String(PRINT_MINIMUM));
  // Paso «Tu diseño» (mejora propia): sustituye al desplegable; el valor de producción sigue siendo "ready" / "help".
  const designStep = useDesign("logo");
  const design = designStep.option === "logo" ? "ready" : "help";
  const [customFormat, setCustomFormat] = useState("");

  const quantity = Number(quantityText);
  const { variant, quote, custom, plainBracelets, minimum, withDelivery, message, canOrder } = printOrder(product, {
    quantity,
    variantId,
    design,
    customFormat,
    delivery,
  });

  const selectVariant = (id: string) => {
    const next = product.variants.find((v) => v.id === id);
    if (!next) return;
    setVariantId(id);
    if (quantity !== PRINT_MINIMUM && !next.prices.some((p) => p.quantity === quantity)) {
      setQuantityText(String(next.prices[0].quantity));
    }
  };

  return (
    <div className="print-config">
      <p className="print-conditions">Pedido mínimo: {fmt(PRINT_MINIMUM)} unidades.</p>

      {product.slug === "flyers" && (
        <div className="print-field">
          <label htmlFor="print-format">Formato</label>
          <NativeSelect id="print-format" value={variant?.format} onChange={(e) => selectVariant(`${e.target.value}-${variant?.faces}`)}>
            {flyerFormats.map((f) => (
              <NativeOption key={f.id} value={f.id}>
                {f.label}
              </NativeOption>
            ))}
          </NativeSelect>
        </div>
      )}

      {variant?.faces && (
        <fieldset className="print-field">
          <legend>¿Por cuántas caras?</legend>
          <div className="print-choices">
            {([1, 2] as const).map((faces) => (
              <button
                key={faces}
                type="button"
                aria-pressed={variant.faces === faces}
                onClick={() =>
                  selectVariant(product.slug === "flyers" ? `${variant.format}-${faces}` : `${variant.laminated ? "lam" : "sin"}-${faces}`)
                }
              >
                {faces} {faces === 1 ? "cara" : "caras"}
                {variant.faces === faces && <Check size={14} />}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {product.slug === "tarjetas-de-visita" && (
        <fieldset className="print-field">
          <legend>Acabado</legend>
          <div className="print-choices">
            {[false, true].map((laminated) => (
              <button
                key={String(laminated)}
                type="button"
                aria-pressed={variant?.laminated === laminated}
                onClick={() => selectVariant(`${laminated ? "lam" : "sin"}-${variant?.faces}`)}
              >
                {laminated ? "Plastificadas" : "Sin plastificar"}
                {variant?.laminated === laminated && <Check size={14} />}
              </button>
            ))}
          </div>
          {variant?.laminated && <small>Disponibles en 250, 500 o 1.000 unidades.</small>}
        </fieldset>
      )}

      {custom && (
        <div className="print-field">
          <label htmlFor="print-custom-format">
            Formato o medidas <span>(opcional)</span>
          </label>
          <TextInput
            id="print-custom-format"
            value={customFormat}
            onChange={(e) => setCustomFormat(e.target.value)}
            placeholder="Cuéntanos cómo lo imaginas"
            maxLength={180}
          />
        </div>
      )}

      <div className="print-field">
        <label htmlFor="print-quantity">Cantidad</label>
        {variant ? (
          <NativeSelect id="print-quantity" value={quantityText} onChange={(e) => setQuantityText(e.target.value)}>
            {printQuantityOptions(variant).map((o) => (
              <NativeOption key={o.quantity} value={o.quantity}>
                {o.label}
              </NativeOption>
            ))}
          </NativeSelect>
        ) : (
          <TextInput
            id="print-quantity"
            type="number"
            min={minimum}
            step={1}
            value={quantityText}
            onChange={(e) => setQuantityText(e.target.value)}
            aria-invalid={!canOrder}
            aria-describedby={canOrder ? undefined : "print-quantity-error"}
          />
        )}
        {!canOrder && (
          <small id="print-quantity-error" className="print-error">
            Introduce una cantidad entera de al menos {fmt(minimum)} unidades.
          </small>
        )}
      </div>

      {!custom && (
        <details className="print-tariffs quantity-tariffs">
          <summary>
            <span>Ver precios por cantidad</span>
            <ChevronDown size={21} aria-hidden="true" />
          </summary>
          <div className="print-table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Cantidad</th>
                  <th scope="col">{variant ? "Precio total" : "Precio / ud."}</th>
                </tr>
              </thead>
              <tbody>
                {variant
                  ? variant.prices.map((p) => (
                      <tr key={p.quantity} className={quantity === p.quantity ? "is-selected" : ""}>
                        <th scope="row">
                          <button type="button" onClick={() => setQuantityText(String(p.quantity))}>
                            {fmt(p.quantity)} uds.
                          </button>
                        </th>
                        <td>{formatCents(p.total)}</td>
                      </tr>
                    ))
                  : product.tiers.map((tier, i) => {
                      const next = product.tiers[i + 1];
                      return (
                        <tr key={tier.min} className={quantity >= tier.min && (!next || quantity < next.min) ? "is-selected" : ""}>
                          <th scope="row">
                            <button type="button" onClick={() => setQuantityText(String(tier.min))}>
                              {fmt(tier.min)}
                              {next ? `–${fmt(next.min - 1)}` : " o más"}
                            </button>
                          </th>
                          <td>{formatCents(tier.unit)}</td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>
          <p className="print-conditions">{variant ? variant.label : "El precio del tramo se aplica a todas las unidades del pedido."}</p>
        </details>
      )}

      {!plainBracelets && (
        <DesignStep
          className="print-field"
          design={designStep}
          printSize={printSizeFor(product.slug, variant?.format)}
          serviceNote="Te presupuestamos el diseño aparte. Se cobra la primera vez si no lo aportas."
        />
      )}

      <div className="print-total" aria-live="polite" aria-atomic="true">
        <span>{custom ? "Lo preparamos para ti" : "Total del pedido"}</span>
        <strong>{custom ? "A presupuestar" : quote && withDelivery ? formatCents(withDelivery.total) : canOrder ? "A presupuestar" : "—"}</strong>
        {quote && (
          <p>
            {formatUnits(quantity)}
            {product.tiers.length > 0 ? ` × ${formatCents(quote.unit)} / ud.` : ""}
            {variant ? ` · ${variant.label}` : ""}
          </p>
        )}
      </div>

      <ProductDelivery subtotal={quote?.total} selected={delivery} onChange={setDelivery} />

      {!plainBracelets && (
        <p className="print-included">
          <Check size={15} /> {custom ? "Impresión según presupuesto" : "Impresión incluida en la opción elegida"}
        </p>
      )}

      {canOrder ? (
        <OrderActions
          name={product.name}
          message={message}
          quantity={quantity}
          subtotal={quote?.total ?? null}
          delivery={delivery}
          image={product.art.small || product.art.src}
          path={`/imprenta/${product.slug}/`}
          reprice={{ kind: "print", slug: product.slug, variantId, design, customFormat, delivery }}
          design={plainBracelets ? null : designStep}
          sticky={{
            total: !custom && quote && withDelivery ? formatCents(withDelivery.total) : "A presupuestar",
            detail: formatUnits(quantity),
            panel: ".print-total",
          }}
        />
      ) : (
        <button type="button" className="brand-button print-request" disabled>
          Revisa la cantidad
        </button>
      )}

      <p className="print-conditions">
        {plainBracelets ? "" : "Diseño no incluido. "}
        Impuestos se confirman en el presupuesto. Revisamos archivos y plazo contigo antes de producir.
      </p>

      <OrderTimeline />
    </div>
  );
}
