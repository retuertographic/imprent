"use client";
/* eslint-disable @next/next/no-img-element */
import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import { asset } from "../content";
import { SiteLink } from "../SiteLink";
import { Checkbox, Input, NativeSelect, NativeSelectOption, Textarea } from "./controls";
import { exampleSmallImage, FullprintTransformation } from "./FullprintTransformation";
import { OrderActions, ProductDelivery } from "./OrderActions";
import { calculatePrice, formatEuros, formatNumber, orderMessage, withShipping } from "./pricing";
import type { FullprintModel } from "./types";

const OWN_DESIGN = "Aporto mi diseño";
const HELP_DESIGN = "Necesito ayuda con el diseño";

type ConfiguratorProps = { product: FullprintModel; onAttachmentChange: (id: string) => void };

/** Configurador: variante, enganche, corte, tejido, cantidad, extras, diseño, notas, envío y pedido. */
function FullprintConfigurator({ product, onAttachmentChange }: ConfiguratorProps) {
  const firstVariant = product.variants[0];
  const [attachmentId, setAttachmentId] = useState(product.attachments?.[0]?.id);
  const [delivery, setDelivery] = useState(false);
  const [variantId, setVariantId] = useState(firstVariant.id);
  const [quantityText, setQuantityText] = useState(String(firstVariant.tiers[0].min));
  const [extraIds, setExtraIds] = useState<string[]>([]);
  const [fabricId, setFabricId] = useState(product.fabrics?.[0]?.id ?? "");
  const [cut, setCut] = useState("Hombre");
  const [design, setDesign] = useState(OWN_DESIGN);
  const [notes, setNotes] = useState("");

  const attachment = product.attachments?.find((a) => a.id === attachmentId);
  const fabric = product.fabrics?.find((f) => f.id === fabricId);
  const variant = product.variants.find((v) => v.id === variantId) ?? firstVariant;
  const quantity = Number(quantityText);
  const minimum = variant.tiers[0]?.min ?? firstVariant.tiers[0].min;
  const validQuantity = Number.isSafeInteger(quantity) && quantity >= minimum;
  const price = calculatePrice(product, variantId, quantity, extraIds, attachmentId, fabricId);
  const total = withShipping(price?.total, delivery);
  const message = orderMessage(
    product,
    { variantId, quantity, extraIds, attachmentId, fabricId, cut, design, notes, delivery },
    price,
  );

  return (
    <div className="print-config">
      <div className="print-field">
        <label htmlFor="fullprint-variant">
          {product.variantLabel ?? (product.cuts ? "Grupo de tallas" : product.attachments ? "Medida" : "Modelo y acabado")}
        </label>
        <NativeSelect id="fullprint-variant" value={variantId} onChange={(e) => setVariantId(e.target.value)}>
          {product.variants.map((v) => (
            <NativeSelectOption key={v.id} value={v.id}>
              {v.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        {product.note && <small>{product.note}</small>}
        {product.cuts && <small>Precio para este grupo de tallas. Para combinar grupos, consúltanos el presupuesto.</small>}
      </div>

      {product.attachments && (
        <fieldset className="print-field keychain-attachments">
          <legend>Elige el enganche</legend>
          <div className="keychain-attachment-options">
            {product.attachments.map((a) => (
              <button
                key={a.id}
                type="button"
                aria-pressed={attachmentId === a.id}
                onClick={() => {
                  setAttachmentId(a.id);
                  onAttachmentChange(a.id);
                }}
              >
                <span className="attachment-radio" aria-hidden="true" />
                <span>
                  <strong>{a.label}</strong>
                  <small>
                    {a.unit === null ? "Precio a confirmar" : a.unit === 0 ? "Incluida en el precio" : `+${formatEuros(a.unit)} / ud.`}
                  </small>
                </span>
              </button>
            ))}
          </div>
          {attachment?.unit === null && (
            <small className="attachment-price-note">
              Puedes solicitarlo con mosquetón. Te confirmamos su precio y el total antes de realizar el pedido.
            </small>
          )}
        </fieldset>
      )}

      {product.cuts && !variant.child && (
        <div className="print-field">
          <label htmlFor="fullprint-cut">Corte</label>
          <NativeSelect id="fullprint-cut" value={cut} onChange={(e) => setCut(e.target.value)}>
            {["Hombre", "Mujer"].map((c) => (
              <NativeSelectOption key={c}>{c}</NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
      )}

      {product.fabrics && (
        <fieldset className="print-field fullprint-fabrics">
          <legend>Elige tu tejido</legend>
          <div className="fabric-options">
            {product.fabrics.map((f) => (
              <button key={f.id} type="button" aria-pressed={fabricId === f.id} onClick={() => setFabricId(f.id)}>
                <span className={`fabric-swatch fabric-swatch--${f.id}`} aria-hidden="true" />
                <span className="fabric-option-copy">
                  <strong>{f.label}</strong>
                  <small>
                    {f.weight} g/m² · {f.composition}
                  </small>
                  <span className="fabric-supplement">{f.unit > 0 ? `+${formatEuros(f.unit)} / camiseta` : "Sin suplemento"}</span>
                </span>
                <span className="attachment-radio" aria-hidden="true" />
              </button>
            ))}
          </div>
          <small className="fabric-selection-note" aria-live="polite">
            {fabric?.unit
              ? `El suplemento de ${formatEuros(fabric.unit)} por camiseta ya está incluido en los precios y el total.`
              : "Elige el acabado que prefieras. Los tres tejidos 100% poliéster mantienen la tarifa base."}
          </small>
        </fieldset>
      )}

      {product.fabrics && (
        <details className="product-info-details fabric-guide">
          <summary>¿Qué tejido elegir?</summary>
          <dl>
            {product.fabrics.map((f) => (
              <div key={f.id}>
                <dt>{f.label}</dt>
                <dd>{f.recommendedFor}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}

      <div className="print-field">
        <label htmlFor="fullprint-quantity">Cantidad</label>
        <Input
          id="fullprint-quantity"
          type="number"
          min={minimum}
          step={1}
          value={quantityText}
          onChange={(e) => setQuantityText(e.target.value)}
          aria-invalid={!validQuantity}
          aria-describedby="fullprint-quantity-hint"
        />
        <small id="fullprint-quantity-hint">
          {validQuantity
            ? `Pedido mínimo: ${formatNumber(minimum)} unidades.`
            : `Introduce una cantidad entera de al menos ${formatNumber(minimum)} unidades.`}
        </small>
      </div>

      {variant.tiers.length > 0 && (
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
                  <th scope="col">Producto / ud.</th>
                </tr>
              </thead>
              <tbody>
                {variant.tiers.map((t) => (
                  <tr key={t.min} className={quantity >= t.min && (t.max === null || quantity <= t.max) ? "is-selected" : ""}>
                    <th scope="row">
                      <button type="button" onClick={() => setQuantityText(String(t.min))}>
                        {formatNumber(t.min)}
                        {t.max === null ? " o más" : t.max === t.min ? "" : `–${formatNumber(t.max)}`}
                      </button>
                    </th>
                    <td>{formatEuros(t.unit + (fabric?.unit ?? 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="print-conditions">
            {variant.label}
            {". "}
            {fabric && (
              <>
                Tejido {fabric.label.toLowerCase()} · {fabric.weight} g/m²{fabric.unit > 0 ? " (suplemento incluido)" : ""}
                {". "}
              </>
            )}
            {product.attachments
              ? "Tarifa con anilla incluida. El mosquetón se presupuesta aparte."
              : "Extras opcionales no incluidos en esta tabla."}{" "}
            Otras cantidades, a consultar.
          </p>
        </details>
      )}

      {!!product.extras?.length && (
        <fieldset className="print-field">
          <legend>¿Añadimos algo?</legend>
          <div className="custom-extras">
            {product.extras.map((extra) => (
              <label key={extra.id}>
                <Checkbox
                  checked={extraIds.includes(extra.id)}
                  onCheckedChange={(checked) =>
                    setExtraIds((ids) => (checked ? [...ids, extra.id] : ids.filter((id) => id !== extra.id)))
                  }
                />
                <span>{extra.label}</span>
                <strong>+{formatEuros(extra.unit)} / ud.</strong>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="print-field">
        <label htmlFor="fullprint-design">Tu diseño</label>
        <NativeSelect id="fullprint-design" value={design} onChange={(e) => setDesign(e.target.value)}>
          <NativeSelectOption>{OWN_DESIGN}</NativeSelectOption>
          <NativeSelectOption>{HELP_DESIGN}</NativeSelectOption>
        </NativeSelect>
        {design !== OWN_DESIGN && <small>El diseño se presupuesta aparte. Se cobra la primera vez si no lo aportas.</small>}
      </div>

      <details className="custom-notes">
        <summary>Añadir tallas, colores o detalles</summary>
        <label htmlFor="fullprint-notes" className="sr-only">
          Detalles de tu pedido
        </label>
        <Textarea
          id="fullprint-notes"
          placeholder="Ejemplo: 10 S, 15 M y 5 L. Fecha del evento y otros detalles…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={1000}
        />
      </details>

      <div className="print-total" aria-live="polite" aria-atomic="true">
        <span>Total del pedido</span>
        <strong>{price && total ? formatEuros(total.total) : validQuantity ? "A consultar" : "—"}</strong>
        {price ? (
          <p>
            {formatNumber(quantity)} unidades × {formatEuros(price.unit)} / ud.
          </p>
        ) : (
          validQuantity && <p>Confirmamos el precio para esta opción y cantidad.</p>
        )}
      </div>

      <ProductDelivery subtotal={price?.total} selected={delivery} onChange={setDelivery} />

      <p className="print-included">
        <Check size={15} /> Impresión fullprint incluida según la ficha
      </p>

      {validQuantity ? (
        <OrderActions
          name={product.name}
          message={message}
          quantity={quantity}
          subtotal={price?.total ?? null}
          delivery={delivery}
          image={product.cartImage}
        />
      ) : (
        <button type="button" disabled className="brand-button print-request">
          Revisa la cantidad
        </button>
      )}

      <p className="print-conditions">
        Diseño no incluido. Impuestos se confirman en el presupuesto. Revisamos archivos y plazo antes de producir.
      </p>
    </div>
  );
}

type DetailsProps = { product: FullprintModel; collection: { slug: string; name: string } };

/** Ficha de modelo Fullprint: galería («de blanco a fullprint» + fotos) e información con configurador. */
export function FullprintDetails({ product, collection }: DetailsProps) {
  const [view, setView] = useState("transformation");
  const photos = product.photos?.filter((p) => p.id !== "fullprint-cover") ?? [];
  const photo = photos.find((p) => p.id === view);
  const thumbCount = photos.length + 1;

  return (
    <section className="wrap print-product-layout">
      <div className="print-product-visual">
        <SiteLink className="print-back" href={`/fullprint/coleccion/${collection.slug}/`}>
          Volver a {collection.name.toLowerCase()}
        </SiteLink>
        <div className="fullprint-personalization-note">
          <span className="fullprint-personalizable">Personalizable al 100%</span>
          <p>Diseños de ejemplo · Lo fabricamos con tu diseño.</p>
        </div>
        <div className="fullprint-gallery">
          {photo ? (
            <div className="fullprint-gallery-main">
              <img
                key={photo.id}
                src={asset(photo.src)}
                srcSet={`${asset(photo.small)} 480w, ${asset(photo.src)} ${photo.width ?? 1200}w`}
                sizes="(max-width: 760px) 90vw, 45vw"
                width={photo.width ?? 1200}
                height={photo.height ?? 1200}
                alt={photo.alt}
                fetchPriority="high"
              />
              <span className="gallery-caption">{photo.label}</span>
            </div>
          ) : (
            <FullprintTransformation slug={product.slug} name={product.name} example={product.example} priority controls />
          )}
          {photos.length > 0 && (
            <div
              className={`fullprint-gallery-thumbs ${thumbCount > 4 ? "fullprint-gallery-thumbs--many" : thumbCount > 3 ? "fullprint-gallery-thumbs--four" : ""}`}
              aria-label="Fotos del producto"
            >
              <button type="button" aria-pressed={!photo} onClick={() => setView("transformation")}>
                <span className="fullprint-transformation-thumb">
                  <img src={asset(exampleSmallImage(product.example.image))} width={768} height={512} alt="" />
                </span>
                <span>De blanco a fullprint</span>
              </button>
              {photos.map((p) => (
                <button key={p.id} type="button" aria-pressed={p.id === photo?.id} onClick={() => setView(p.id)}>
                  <img src={asset(p.small)} width={480} height={480} alt="" />
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {product.slug === "camisetas" && (
          <details className="product-info-details fullprint-explainer">
            <summary>¿Cómo se hace una camiseta fullprint?</summary>
            <p>
              Imprimimos tu diseño en el tejido antes de confeccionar la prenda. Colores, dibujos y logos pueden recorrer el
              delantero, la espalda y las mangas.
            </p>
            <div className="fullprint-process">
              <span>
                <b>01</b>Tu diseño
              </span>
              <i aria-hidden="true">→</i>
              <span>
                <b>02</b>Impresión
              </span>
              <i aria-hidden="true">→</i>
              <span>
                <b>03</b>Confección
              </span>
            </div>
          </details>
        )}

        <div className="print-specs">
          {product.specs.map((spec) => (
            <span key={spec}>
              <Check size={15} />
              {spec}
            </span>
          ))}
        </div>

        {product.slug === "delantal-peto" && (
          <SiteLink className="print-back" href="/fullprint/mandil-corto/">
            ¿Prefieres un modelo de cintura? Ver mandil corto →
          </SiteLink>
        )}
        {product.slug === "mandil-corto" && (
          <SiteLink className="print-back" href="/fullprint/delantal-peto/">
            ¿Buscas un modelo con peto? Ver delantal de peto →
          </SiteLink>
        )}
      </div>

      <div className="print-product-info">
        <p className="eyebrow">FULLPRINT · {collection.name.toUpperCase()}</p>
        <h1>{product.name}</h1>
        <p className="print-description">{product.line}</p>
        <FullprintConfigurator product={product} onAttachmentChange={setView} />
        <details className="product-info-details">
          <summary>Más sobre este producto</summary>
          <p>{product.description}</p>
        </details>
      </div>
    </section>
  );
}
