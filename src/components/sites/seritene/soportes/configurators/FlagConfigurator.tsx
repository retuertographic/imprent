"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { asset } from "../../content";
import { Input, NativeSelect, NativeSelectOption } from "../form-controls";
import { OrderActions } from "../OrderActions";
import { ProductDelivery } from "../ProductDelivery";
import { deliveryLine, formatEuro, formatNumber, shippingFor } from "../order";
import type { FlagProduct, FlagTier } from "../types";

type CatalogArt = { src: string; small: string; width: number; height: number; smallWidth: number };

/** Bases de bandera: recortes de /banderas-bases.png ya exportados a /catalogue (chunk `catalog-image`). */
const BASES: { id: string; name: string; description: string; art: CatalogArt }[] = [
  {
    id: "cruz",
    name: "Cruz",
    description: "Incluye flotador para llenar de agua y hacer de peso.",
    art: { src: "/catalogue/banderas-bases-14.webp", small: "/catalogue/banderas-bases-14-small.webp", width: 299, height: 428, smallWidth: 299 },
  },
  {
    id: "piqueta",
    name: "Piqueta",
    description: "Para clavar en un terreno compatible.",
    art: { src: "/catalogue/banderas-bases-15.webp", small: "/catalogue/banderas-bases-15-small.webp", width: 75, height: 453, smallWidth: 75 },
  },
  {
    id: "pared",
    name: "Pared",
    description: "Soporte de fijación a pared.",
    art: { src: "/catalogue/banderas-bases-16.webp", small: "/catalogue/banderas-bases-16-small.webp", width: 189, height: 321, smallWidth: 189 },
  },
  {
    id: "coche",
    name: "Coche",
    description: "Base para colocar bajo una rueda.",
    art: { src: "/catalogue/banderas-bases-17.webp", small: "/catalogue/banderas-bases-17-small.webp", width: 444, height: 220, smallWidth: 420 },
  },
];

/** Imagen pequeña de la bandera para el carrito (recortes de /banderas-*.png en producción). */
const FLAG_CART_IMAGES: Record<string, string> = {
  "/banderas-vela.png": "/catalogue/banderas-vela-12-small.webp",
  "/banderas-gota.png": "/catalogue/banderas-gota-13-small.webp",
};

type Pack = "complete" | "fabric";

function tiersFor(product: FlagProduct, sizeId: string): FlagTier[] {
  const size = product.sizes.find((s) => s.id === sizeId);
  return size ? (size.tiers ?? [{ min: 1, complete: size.complete, fabric: size.fabric }]) : [];
}

function flagPrice(product: FlagProduct, sizeId: string, pack: Pack, quantity: number) {
  if (!product.sizes.some((s) => s.id === sizeId) || !Number.isSafeInteger(quantity) || quantity < 1) return null;
  const tier = tiersFor(product, sizeId)
    .filter((t) => t.min <= quantity)
    .at(-1);
  if (!tier) return null;
  const unit = pack === "complete" ? tier.complete : tier.fabric;
  return Number.isSafeInteger(unit * quantity) ? { unit, total: unit * quantity } : null;
}

function BaseArt({ art, name }: { art: CatalogArt; name: string }) {
  return (
    <div className="catalog-art" style={{ aspectRatio: `${art.width}/${art.height}` }}>
      <img
        src={asset(art.src)}
        srcSet={art.smallWidth < art.width ? `${asset(art.small)} ${art.smallWidth}w, ${asset(art.src)} ${art.width}w` : undefined}
        sizes="(max-width:700px) 90vw, (max-width:1100px) 44vw, 30vw"
        alt={name}
        width={art.width}
        height={art.height}
        loading="lazy"
        fetchPriority="auto"
        decoding="async"
        style={{ position: "static", width: "100%", height: "100%", objectFit: "contain", maxWidth: "100%" }}
      />
    </div>
  );
}

export function FlagConfigurator({ product }: { product: FlagProduct }) {
  const [delivery, setDelivery] = useState(false);
  const [sizeId, setSizeId] = useState("S");
  const [pack, setPack] = useState<Pack>("complete");
  const [baseId, setBaseId] = useState("cruz");
  const [quantityText, setQuantityText] = useState("1");
  const size = product.sizes.find((s) => s.id === sizeId) ?? product.sizes[0];
  const quantity = Number(quantityText);
  const price = flagPrice(product, sizeId, pack, quantity);
  const complete = pack === "complete";
  const tiers = tiersFor(product, sizeId);
  const base = BASES.find((b) => b.id === baseId) ?? BASES[0];
  const shipping = shippingFor(price?.total, delivery);
  const message = [
    `Hola Seritene, quiero ${product.name}, tamaño ${sizeId}.`,
    `Cantidad: ${formatNumber(quantity)}.`,
    `Tela: ${size.width} × ${size.height} cm.`,
    complete
      ? `Conjunto completo, base ${base.name} y bolsa de transporte. Altura con soporte aproximada: ${size.mounted} cm.`
      : "Solo tela, sin soporte, base ni bolsa de transporte.",
    price && shipping ? `Precio: ${formatEuro(price.unit)} / ud. Total: ${formatEuro(shipping.total)}.` : "",
    deliveryLine(price?.total, delivery),
    "Quiero confirmar diseño, impuestos y plazo.",
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="print-config">
      <fieldset className="print-field">
        <legend>Tamaño</legend>
        <div className="print-choices">
          {product.sizes.map((s) => (
            <button key={s.id} type="button" aria-pressed={sizeId === s.id} onClick={() => setSizeId(s.id)}>
              {s.id}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="flag-measurements" aria-live="polite">
        <span>
          Tela{" "}
          <strong>
            {size.width} × {size.height} cm
          </strong>
        </span>
        <span>
          Altura con soporte <strong>≈ {(size.mounted / 100).toLocaleString("es-ES")} m</strong>
        </span>
      </div>
      <fieldset className="print-field">
        <legend>¿Qué necesitas?</legend>
        <div className="print-choices">
          <button type="button" aria-pressed={complete} onClick={() => setPack("complete")}>
            Conjunto completo
          </button>
          <button type="button" aria-pressed={!complete} onClick={() => setPack("fabric")}>
            Solo tela
          </button>
        </div>
        <small>
          {complete
            ? "Bandera + soporte + una base + bolsa de transporte."
            : "Solo la tela impresa. No incluye soporte, base ni bolsa de transporte."}
        </small>
      </fieldset>
      {complete && (
        <div className="print-field">
          <label htmlFor="flag-base">Base incluida</label>
          <NativeSelect id="flag-base" value={baseId} onChange={(e) => setBaseId(e.target.value)}>
            {BASES.map((b) => (
              <NativeSelectOption key={b.id} value={b.id}>
                {b.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <div className="flag-base-selected">
            <div>
              <BaseArt art={base.art} name={`Base ${base.name}`} />
            </div>
            <p>{base.description}</p>
          </div>
        </div>
      )}
      <div className="print-field">
        <label htmlFor="flag-quantity">Cantidad</label>
        <Input
          id="flag-quantity"
          type="number"
          min={1}
          step={1}
          value={quantityText}
          onChange={(e) => setQuantityText(e.target.value)}
          aria-invalid={!price}
        />
        {!price && <small>Introduce una cantidad entera de al menos 1 unidad.</small>}
      </div>
      {tiers.length > 1 && (
        <details className="print-tariffs quantity-tariffs">
          <summary>Ver precios por cantidad</summary>
          <p className="print-conditions">Cuantas más unidades, mejor precio. PVP por unidad sin IGIC · talla {sizeId}.</p>
          <div className="print-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Cantidad</th>
                  <th>Precio / ud.</th>
                </tr>
              </thead>
              <tbody>
                {tiers.map((t, i) => {
                  const next = tiers[i + 1]?.min;
                  return (
                    <tr key={t.min} className={quantity >= t.min && (!next || quantity < next) ? "is-selected" : ""}>
                      <th scope="row">
                        <button type="button" onClick={() => setQuantityText(String(t.min))}>
                          {next ? (next === t.min + 1 ? t.min : `${t.min}–${next - 1}`) : `${t.min}+`} uds.
                        </button>
                      </th>
                      <td>{formatEuro(complete ? t.complete : t.fabric)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </details>
      )}
      <div className="print-total" aria-live="polite" aria-atomic="true">
        <span>Total del pedido</span>
        <strong>{price && shipping ? formatEuro(shipping.total) : "—"}</strong>
        {price && (
          <p>
            {formatNumber(quantity)} unidades × {formatEuro(price.unit)} / ud. · {complete ? "Conjunto completo" : "Solo tela"} ·{" "}
            {sizeId}
          </p>
        )}
      </div>
      <ProductDelivery subtotal={price?.total} selected={delivery} onChange={setDelivery} />
      {price ? (
        <OrderActions
          image={FLAG_CART_IMAGES[product.art.src] ?? product.art.src}
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
        Precios sin IGIC. Impuestos y diseño se confirman en el presupuesto. Revisamos tu archivo y el plazo antes de producir.
      </p>
      <details className="print-tariffs">
        <summary>Comparar tamaños y precios · 1 unidad</summary>
        <div className="print-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tamaño</th>
                <th>Completo / ud.</th>
                <th>Tela / ud.</th>
              </tr>
            </thead>
            <tbody>
              {product.sizes.map((s) => (
                <tr key={s.id} className={s.id === sizeId ? "is-selected" : ""}>
                  <th scope="row">
                    <button type="button" onClick={() => setSizeId(s.id)}>
                      {s.id}
                    </button>
                  </th>
                  <td>{formatEuro(s.complete)}</td>
                  <td>{formatEuro(s.fabric)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
