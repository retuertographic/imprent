"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { Check, Plus, Trash2, X } from "lucide-react";
import { SiteLink } from "../SiteLink";
import { OrderActions } from "../soportes/OrderActions";
import { ProductDelivery } from "../soportes/ProductDelivery";
import { Input, NativeSelect, NativeSelectOption } from "../soportes/form-controls";
import { deliveryLine, shippingFor } from "../soportes/order";
import { loadModelPricing, type ModelPricing } from "./loadPricing";
import {
  MARK_SIZES,
  choiceMarks,
  formatEuro,
  markingOptions,
  productSummary,
  quoteOrder,
  type Marking,
  type OrderQuote,
} from "./pricing";
import type { MerchProduct, MerchVariant } from "./types";

type Props = {
  /** Modelo de 4 cifras (clave de merch-pricing.json). */
  model: string;
  product: MerchProduct;
  warehouse: string;
  priceNotice?: string;
};

type Selection = { id: number; sku: string; quantity: string };

/**
 * Ficha de producto de merchandising (Stamina). Portado del componente `ShopProduct` de seritene.com
 * (chunk `shop-product`). Producción pide la tarifa y el stock a `/api/gor` al cargar; aquí salen de
 * merch-pricing.json, que el workflow de deploy refresca cada noche.
 */
export function ShopProduct({ model, product, warehouse, priceNotice = "" }: Props) {
  const brand = "stamina";
  const [stock, setStock] = useState<Record<string, number>>({});
  const [overrides, setOverrides] = useState<ModelPricing["pricing"]>({});
  const [pricingLoading, setPricingLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    loadModelPricing(model)
      .then((data) => {
        if (!alive) return;
        setOverrides(data.pricing);
        setStock(data.stock);
      })
      .catch(() => {})
      .finally(() => alive && setPricingLoading(false));
    return () => {
      alive = false;
    };
  }, [model]);

  const p: MerchProduct = {
    ...product,
    variants: product.variants.map((v) => ({ ...v, ...overrides[v.sku], stock: stock[v.sku] ?? null })),
  };

  const [delivery, setDelivery] = useState(false);
  const options = markingOptions(p);
  const [rows, setRows] = useState<Selection[]>([
    { id: 1, sku: p.variants[0]?.sku || "", quantity: options.kind === "placa" ? "5" : "1" },
  ]);
  const positions = [...new Map(options.choices.flatMap(choiceMarks).map((m) => [m.position, m])).values()];
  const [marks, setMarks] = useState<Marking[]>(options.kind === "placa" ? options.choices.flatMap(choiceMarks) : []);
  const [nextMarkId, setNextMarkId] = useState(100);
  const sizesFor = (m: Marking) =>
    m.technique === "DTF UV"
      ? [m.size]
      : /manga|pecho (izquierdo|derecho)|frontal/i.test(m.position) && options.kind === "gorra"
        ? ["A6"]
        : /manga/i.test(m.position)
          ? ["A6", "A5"]
          : ["A6", "A5", "A4", "A3"];
  const [askLogo, setAskLogo] = useState(false);
  const [nextRowId, setNextRowId] = useState(2);
  const [allColors, setAllColors] = useState(false);
  const [notes, setNotes] = useState("");

  const current = p.variants.find((v) => v.sku === rows[0]?.sku);
  let quote: OrderQuote | null = null;
  let quantityError = "";
  try {
    quote = quoteOrder(
      p,
      rows.map((r) => ({ sku: r.sku, quantity: Number(r.quantity) })),
      marks,
    );
  } catch {
    quantityError = "Introduce cantidades enteras: entre 1 y 5.000 unidades en total.";
  }

  const updateRow = (id: number, patch: Partial<Selection>) =>
    setRows((list) => list.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const money = (cents: number | null | undefined) => (cents == null ? "A confirmar" : formatEuro(cents));
  const subtotal = askLogo || pricingLoading ? null : (quote?.totalCents ?? null);
  const shipping = shippingFor(subtotal, delivery);
  const units = subtotal !== null && quote ? quote.lines.map((l) => (l.unitCents as number) + (quote.markingCents as number) / quote.quantity) : [];
  const minUnit = units.length ? Math.min(...units) : null;
  const maxUnit = units.length ? Math.max(...units) : null;
  const varies = minUnit !== maxUnit;
  const unitText = varies ? `${money(minUnit)} – ${money(maxUnit)}` : money(minUnit);

  const message = [
    `Hola, quiero presupuesto de ${p.name} (${brand.toUpperCase()} · ${p.code}).`,
    ...rows.map((r) => {
      const v = p.variants.find((x) => x.sku === r.sku);
      return `${r.quantity} uds. · ${v?.color} · ${v?.size || "Única"} · SKU ${r.sku}`;
    }),
    ...marks.map((m) => `Marcaje: ${m.position}, ${m.technique}, ${m.size}, mismo diseño en todas las unidades.`),
    ...(marks.length ? [`Total marcajes: ${money(quote?.markingCents)}.`] : []),
    ...(quote?.markingDiscount ? [`Descuento por varios marcajes textiles: ${quote.markingDiscount} %.`] : []),
    ...(quote?.issues || []),
    ...(marks.length
      ? []
      : [askLogo ? "Solicito asesoramiento para personalizar este artículo. Marcaje pendiente de presupuesto." : "Sin marcaje."]),
    `Precio unitario${varies ? " (según talla/color)" : ""}: ${unitText}. Total del pedido: ${money(shipping?.total)}.`,
    deliveryLine(subtotal, delivery),
    "Pendiente de confirmar disponibilidad, compatibilidad del marcaje, impuestos y diseño.",
    ...(notes.trim() ? [`Notas: ${notes.trim()}`] : []),
  ].join("\n");

  const selectColor = (rowId: number, color: string, from: MerchVariant | undefined) => {
    const v = p.variants.find((x) => x.color === color && x.size === from?.size) || p.variants.find((x) => x.color === color);
    if (v) updateRow(rowId, { sku: v.sku });
  };

  return (
    <main id="contenido" className="brand-main shop-product">
      <div className="wrap">
        <nav className="breadcrumbs" aria-label="Ruta de navegación">
          <SiteLink href="/">Inicio</SiteLink>
          <span>/</span>
          <SiteLink href="/merchandising/">Merchandising</SiteLink>
          <span>/</span>
          <span>{p.name}</span>
        </nav>
        {priceNotice && (
          <p className="shop-fineprint" role="status">
            {priceNotice}
          </p>
        )}
        <div className="shop-product-layout">
          <div className="shop-product-visual">
            <div className="shop-main-photo">
              {current?.image || p.image ? (
                <img
                  src={current?.image || p.image}
                  alt={`${p.name} · ${current?.color || ""}`}
                  width="700"
                  height="800"
                  fetchPriority="high"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span>Imagen no disponible</span>
              )}
              <span>Tu próximo favorito.</span>
            </div>
            <details className="shop-product-details product-info-details">
              <summary>Ficha técnica y composición</summary>
              <p>{p.description.replace(/<[^>]*>/g, " ")}</p>
              {p.composition && (
                <p>
                  <b>Composición</b>
                  <br />
                  {p.composition.replace(/<[^>]*>/g, " ")}
                </p>
              )}
            </details>
          </div>
          <div className="shop-product-options">
            <span className="eyebrow">
              {brand.toUpperCase()} · REF. {p.code}
            </span>
            <h1>{p.name}</h1>
            <p className="shop-product-summary">{productSummary(p)}</p>
            <section className="shop-step">
              <h2>
                <span>01</span> {options.kind === "placa" ? "Modelo y cantidad" : "Color, talla y cantidad"}
              </h2>
              <p className="shop-selected-color">
                Color: <strong>{current?.color || "Único"}</strong>
              </p>
              {p.colors.length > 1 && (
                <div className="shop-color-picker" aria-label="Colores disponibles">
                  {(allColors ? p.colors : p.colors.slice(0, 8)).map((color) => {
                    const selected = p.variants.some((v) => v.sku === rows[0]?.sku && v.color === color);
                    const image = p.variants.find((v) => v.color === color)?.image || p.image;
                    return (
                      <button
                        key={color}
                        type="button"
                        className={selected ? "shop-color-swatch is-selected" : "shop-color-swatch"}
                        aria-label={`Elegir color ${color}`}
                        aria-pressed={selected}
                        onClick={() => selectColor(rows[0].id, color, p.variants.find((v) => v.sku === rows[0]?.sku))}
                      >
                        <span>
                          {image && (
                            <img
                              src={image}
                              alt=""
                              aria-hidden="true"
                              width="60"
                              height="60"
                              loading="lazy"
                              decoding="async"
                              fetchPriority="low"
                            />
                          )}
                        </span>
                        <small>{color}</small>
                      </button>
                    );
                  })}
                </div>
              )}
              {p.colors.length > 8 && (
                <button type="button" className="shop-color-toggle" aria-expanded={allColors} onClick={() => setAllColors((v) => !v)}>
                  {allColors ? "Ver menos colores" : `Ver los ${p.colors.length} colores`}
                </button>
              )}
              {rows.map((row, index) => {
                const v = p.variants.find((x) => x.sku === row.sku);
                const formats = p.variants.filter((x) => x.color === v?.color);
                const total = rows.filter((r) => r.sku === row.sku).reduce((sum, r) => sum + Number(r.quantity), 0);
                const over = v?.stock != null && total > v.stock;
                return (
                  <div className="shop-variant-row" key={row.id}>
                    <div className="shop-variant-fields">
                      <label className={index === 0 ? "shop-color-select" : "shop-extra-color-select"}>
                        Color
                        <NativeSelect
                          aria-label={`Color de la selección ${index + 1}`}
                          value={v?.color || ""}
                          onChange={(e) => selectColor(row.id, e.target.value, v)}
                        >
                          {p.colors.length ? (
                            p.colors.map((c) => (
                              <NativeSelectOption key={c} value={c}>
                                {c}
                              </NativeSelectOption>
                            ))
                          ) : (
                            <NativeSelectOption value="">Único</NativeSelectOption>
                          )}
                        </NativeSelect>
                      </label>
                      <label>
                        Formato
                        <NativeSelect
                          aria-label={`Talla de la selección ${index + 1}`}
                          value={row.sku}
                          onChange={(e) => updateRow(row.id, { sku: e.target.value })}
                        >
                          {formats.map((f) => (
                            <NativeSelectOption key={f.sku} value={f.sku}>
                              {f.size?.startsWith("TALLA ÚNICA") ? "Único" : f.size || "Único"}
                            </NativeSelectOption>
                          ))}
                        </NativeSelect>
                      </label>
                      <label>
                        Unidades
                        <Input
                          aria-label={`Unidades de la selección ${index + 1}`}
                          type="number"
                          inputMode="numeric"
                          enterKeyHint="done"
                          min="1"
                          max="5000"
                          step="1"
                          value={row.quantity}
                          onChange={(e) => updateRow(row.id, { quantity: e.target.value })}
                        />
                      </label>
                      {rows.length > 1 && (
                        <button
                          className="shop-icon-button"
                          onClick={() => setRows((list) => list.filter((r) => r.id !== row.id))}
                          aria-label={`Quitar selección ${index + 1}`}
                        >
                          <Trash2 size={17} />
                        </button>
                      )}
                    </div>
                    <p className={over ? "shop-stock-warning" : "shop-stock"}>
                      {`${warehouse === "2040" ? "Stock Canarias" : "Stock proveedor"}: ${v?.stock == null ? "Consultar disponibilidad" : `${v.stock} uds.`}`}
                      {over ? " · Cantidad superior al stock: consultar reposición." : ""}
                    </p>
                  </div>
                );
              })}
              {p.variants.length > 1 && (
                <button
                  className="shop-add"
                  disabled={rows.length >= 30}
                  onClick={() => {
                    setRows((list) => [...list, { id: nextRowId, sku: p.variants[0].sku, quantity: "1" }]);
                    setNextRowId((n) => n + 1);
                  }}
                >
                  <Plus size={17} /> Añadir otra talla o color
                </button>
              )}
              {quantityError && (
                <p role="alert" className="shop-stock-warning">
                  {quantityError}
                </p>
              )}
            </section>
            <section className="shop-step shop-simple-markings">
              <details className="shop-marking-disclosure">
                <summary>
                  <span>
                    <b>02</b>
                    <strong>Personalización</strong>
                    <small>
                      {askLogo
                        ? "Marcaje a consultar"
                        : marks.length
                          ? marks.map((m) => m.position + " · " + m.size).join(" / ")
                          : "Sin logo · Abre para añadir tu marcaje"}
                    </small>
                  </span>
                  <Plus size={20} />
                </summary>
                <div className="shop-marking-content">
                  <p>Cada fila cuenta como un marcaje. Se aplica a todas las unidades.</p>
                  {marks.map((m, index) => (
                    <div className="shop-mark-row" key={m.id}>
                      <span className="shop-mark-number" aria-label={`Marcaje ${index + 1}`}>
                        {index + 1}
                      </span>
                      <label className="shop-mark-position">
                        Posición
                        <span className="shop-mark-position-control">
                          <NativeSelect
                            aria-label={`Zona del marcaje ${index + 1}`}
                            value={m.position}
                            onChange={(e) => {
                              const picked = positions.find((x) => x.position === e.target.value);
                              if (picked) setMarks((list) => list.map((x) => (x.id === m.id ? { ...picked, id: m.id } : x)));
                            }}
                          >
                            {positions.map((pos) => (
                              <NativeSelectOption
                                key={pos.position}
                                value={pos.position}
                                disabled={marks.some((x) => x.id !== m.id && x.position === pos.position)}
                              >
                                {pos.position}
                              </NativeSelectOption>
                            ))}
                          </NativeSelect>
                          <span className="shop-mark-position-value" aria-hidden="true">
                            {m.position}
                          </span>
                        </span>
                      </label>
                      <label className="shop-mark-size">
                        Tamaño
                        <span className="shop-mark-size-control">
                          <NativeSelect
                            aria-label={`Tamaño del marcaje ${index + 1}`}
                            value={m.size}
                            onChange={(e) => setMarks((list) => list.map((x) => (x.id === m.id ? { ...x, size: e.target.value } : x)))}
                          >
                            {sizesFor(m).map((s) => (
                              <NativeSelectOption key={s} value={s}>
                                {m.technique === "DTF UV" ? "Logo a color" : `${s} · hasta ${MARK_SIZES.find((x) => x.code === s)?.dimensions}`}
                              </NativeSelectOption>
                            ))}
                          </NativeSelect>
                          <span className="shop-mark-size-value" aria-hidden="true">
                            <strong>{m.technique === "DTF UV" ? "Logo a color" : m.size}</strong>
                            {m.technique !== "DTF UV" && <span>hasta {MARK_SIZES.find((x) => x.code === m.size)?.dimensions}</span>}
                          </span>
                        </span>
                      </label>
                      <div className="shop-mark-price">
                        <span>Precio / ud.</span>
                        <output aria-live="polite">{money(quote?.marks[index]?.unitCents)}</output>
                      </div>
                      <button
                        type="button"
                        className="shop-mark-remove"
                        aria-label={`Eliminar marcaje ${index + 1}`}
                        onClick={() => setMarks((list) => list.filter((x) => x.id !== m.id))}
                      >
                        <X size={17} />
                      </button>
                    </div>
                  ))}
                  {positions.length > marks.length && (
                    <button
                      type="button"
                      className="shop-add shop-mark-add"
                      onClick={() => {
                        const free = positions.find((pos) => !marks.some((x) => x.position === pos.position));
                        if (free) setMarks((list) => [...list, { ...free, id: nextMarkId }]);
                        setNextMarkId((n) => n + 1);
                        setAskLogo(false);
                      }}
                    >
                      <Plus size={17} /> Añadir otro marcaje
                    </button>
                  )}
                  {marks.length > 0 && (
                    <button type="button" className="shop-add" onClick={() => setMarks([])}>
                      Sin marcaje
                    </button>
                  )}
                  {!positions.length && (
                    <button type="button" className="shop-mark-choice" aria-pressed={askLogo} onClick={() => setAskLogo(!askLogo)}>
                      <span>
                        <strong>Lo quiero con mi logo</strong>
                        <small>Te proponemos el marcaje y confirmamos el precio</small>
                      </span>
                      <span className="shop-choice-check">{askLogo && <Check size={17} />}</span>
                    </button>
                  )}
                  {!!quote?.markingDiscount && (
                    <p className="shop-fineprint">
                      Precios por marcaje antes del descuento. {quote.markingDiscount} % de descuento aplicado a los marcajes textiles en
                      el total.
                    </p>
                  )}
                  {marks.length > 0 && (
                    <p className="shop-fineprint">
                      Impresión a color. Revisamos que el tamaño elegido encaje en la prenda antes de producir. Diseño gráfico no incluido.
                    </p>
                  )}
                  {marks.length > 0 && quote && marks.some((m) => m.technique === "DTF UV") && quote.quantity > 1000 && (
                    <p className="shop-stock-warning">Personalización para esta cantidad: consultar presupuesto.</p>
                  )}
                </div>
              </details>
            </section>
            <section className="shop-price-panel" aria-label="Resumen de precio">
              <div className="shop-summary-top">
                <span>TU PEDIDO</span>
                {quote && (
                  <strong>
                    {quote.quantity} {quote.quantity === 1 ? "unidad" : "unidades"}
                  </strong>
                )}
              </div>
              {pricingLoading ? (
                <p role="status">Actualizando precio…</p>
              ) : (
                quote?.issues.map((issue) => (
                  <p key={issue} className="shop-stock-warning">
                    {issue}
                  </p>
                ))
              )}
              <dl>
                <div>
                  <dt>
                    Precio unitario
                    {varies && <small>Según talla o color</small>}
                  </dt>
                  <dd>{unitText}</dd>
                </div>
              </dl>
              <div className="shop-total" aria-live="polite">
                <span>Total del pedido</span>
                <strong>{money(shipping?.total)}</strong>
              </div>
              <ProductDelivery subtotal={subtotal} selected={delivery} onChange={setDelivery} />
              <p>Sin impuestos ni diseño gráfico. No es un pedido confirmado.</p>
              <details className="product-notes">
                <summary>Añadir una nota al pedido</summary>
                <label>
                  <span className="sr-only">Notas del pedido</span>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    maxLength={700}
                    placeholder="Fecha, isla de entrega, otro acabado…"
                    rows={3}
                  />
                </label>
              </details>
              {quote ? (
                <OrderActions
                  name={p.name}
                  message={message}
                  quantity={quote.quantity}
                  subtotal={subtotal}
                  image={current?.image || p.image}
                  delivery={delivery}
                />
              ) : (
                <button className="brand-button" disabled>
                  Revisa las cantidades
                </button>
              )}
              <p>Se abre WhatsApp con tu selección.</p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
