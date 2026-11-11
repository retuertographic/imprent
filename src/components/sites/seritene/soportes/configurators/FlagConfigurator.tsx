"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { asset } from "../../content";
import { Input, NativeSelect, NativeSelectOption } from "../form-controls";
import { OrderActions } from "../OrderActions";
import { ProductDelivery } from "../ProductDelivery";
import { formatEuro, formatNumber } from "../order";
import { FLAG_BASES, flagOrder, flagTiers, type CatalogArt, type FlagPack as Pack } from "../pricing";
import type { FlagProduct } from "../types";

/** Imagen pequeña de la bandera para el carrito (recortes de /banderas-*.png en producción). */
const FLAG_CART_IMAGES: Record<string, string> = {
  "/banderas-vela.png": "/catalogue/banderas-vela-12-small.webp",
  "/banderas-gota.png": "/catalogue/banderas-gota-13-small.webp",
};

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
  const quantity = Number(quantityText);
  const { size, price, complete, base, shipping, message } = flagOrder(product, { sizeId, pack, baseId, quantity, delivery });
  const tiers = flagTiers(product, sizeId);

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
            {FLAG_BASES.map((b) => (
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
          reprice={{ kind: "flag", slug: product.slug, sizeId, pack, baseId, delivery }}
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
