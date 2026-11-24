"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState, type ReactNode } from "react";
import { Check, Plus, Trash2, X } from "lucide-react";
import { asset } from "../content";
import { SiteLink } from "../SiteLink";
import { OrderActions } from "../soportes/OrderActions";
import { ProductDelivery } from "../soportes/ProductDelivery";
import { Input, NativeSelect, NativeSelectOption } from "../soportes/form-controls";
import { hasDailyPricing, loadModelPricing, type ModelPricing } from "./loadPricing";
import { merchOrder, OVER_STOCK, stockStatus, withModelPricing } from "./order";
import { MARK_SIZES, choiceMarks, markGroups, markingOptions, productSummary, volumeTiers, type Marking } from "./pricing";
import type { ProductHeading } from "./productSeo";
import { VolumeTiers } from "./VolumeTiers";
import type { Brand, MerchProduct, MerchVariant, ProductContext } from "./types";

type Props = {
  brand: Brand;
  /** Modelo de 4 cifras (clave de merch-pricing.json / roly-pricing.json); código en JHK. */
  model: string;
  product: MerchProduct;
  warehouse: string;
  priceNotice?: string;
  context?: ProductContext;
  /** H1 SEO («Camiseta personalizada» + «Roly Assen»); sin él, el nombre del modelo como en producción. */
  heading?: ProductHeading;
  /** Bloques de servidor al final de la ficha (productos relacionados). */
  children?: ReactNode;
};

type Selection = { id: number; sku: string; quantity: string };

/**
 * Las fotos de JHK son rutas de seritene.com (`/images/jhk/…`, copiadas en public/sites/seritene/):
 * se resuelven al pintarlas y se guardan tal cual en el carrito, como en producción.
 */
const imageSrc = (src: string) => (src.startsWith("/") ? asset(src) : src);

/** Tipos de artículo (de `markingOptions`) que son prendas: «talla» y «prenda»; el resto, «variante» y «producto». */
const GARMENT_KINDS = new Set(["camiseta", "polo", "sudadera", "prenda-superior", "pantalon", "conjunto", "gorra"]);

/** Talla o variante real (no «TALLA ÚNICA ADULTO», «UNICA»…). */
const realSize = (size: string | null | undefined) => !!size && !/^(?:talla )?[uú]nica\b/i.test(size.trim());

/** Técnica de marcaje tal como se explica al cliente. */
const TECHNIQUES: Record<string, string> = {
  DTF: "DTF: impresión a todo color, rentable desde 1 unidad",
  "DTF UV": "DTF UV: logo a todo color para superficies rígidas",
};

/**
 * Ficha de producto de proveedor: merchandising (Stamina) y ropa (Roly, JHK). Portado del componente
 * `ShopProduct` de seritene.com (chunk `shop-product`). Producción pide la tarifa y el stock a `/api/gor`
 * al cargar (salvo JHK); aquí salen de merch-pricing.json / roly-pricing.json, que el workflow de deploy
 * refresca cada noche.
 */
export function ShopProduct({ brand: brandProp, model, product, warehouse, priceNotice = "", context, heading, children }: Props) {
  const daily = hasDailyPricing(brandProp);
  const [stock, setStock] = useState<Record<string, number>>({});
  const [overrides, setOverrides] = useState<ModelPricing["pricing"]>({});
  const [pricingLoading, setPricingLoading] = useState(daily);

  useEffect(() => {
    if (!daily) return;
    let alive = true;
    loadModelPricing(model, brandProp)
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
  }, [model, brandProp, daily]);

  const p: MerchProduct = withModelPricing(product, { pricing: overrides, stock });

  const [delivery, setDelivery] = useState(false);
  const options = markingOptions(p);
  const [rows, setRows] = useState<Selection[]>([
    { id: 1, sku: p.variants[0]?.sku || "", quantity: options.kind === "placa" ? "5" : "1" },
  ]);
  const groups = markGroups(options);
  const positions = groups.flatMap((g) => g.zones);
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
  // Mejora propia: el paso de personalización empieza abierto si el artículo admite marcaje.
  const [markingOpen, setMarkingOpen] = useState(positions.length > 0);
  const isGarment = brandProp !== "stamina" || GARMENT_KINDS.has(options.kind);
  const item = isGarment ? "la prenda" : "el producto";
  const hasSizes = p.variants.some((v) => realSize(v.size));
  const showSizeSelect = hasSizes || p.colors.some((c) => p.variants.filter((v) => v.color === c).length > 1);
  const sizeLabel = isGarment ? "Talla" : "Variante";
  const techniques = [...new Set(marks.map((m) => m.technique))];
  const [nextRowId, setNextRowId] = useState(2);
  const [allColors, setAllColors] = useState(false);
  const [notes, setNotes] = useState("");

  const current = p.variants.find((v) => v.sku === rows[0]?.sku);
  const updateRow = (id: number, patch: Partial<Selection>) =>
    setRows((list) => list.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const section = brandProp === "roly" || brandProp === "jhk" ? "ropa" : "merchandising";
  const { brand, quote, quantityError, money, subtotal, shipping, varies, unitText, message } = merchOrder({
    brand: brandProp,
    product: p,
    rows,
    marks,
    askLogo,
    notes,
    delivery,
    pricingLoading,
  });

  // Mejora propia: precio por unidad en cada tramo de cantidad para la primera selección y los marcajes elegidos.
  const tiers = pricingLoading || askLogo || !rows[0] ? [] : volumeTiers(p, rows[0].sku, marks);

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
          <SiteLink href={`/${section}/`}>{section === "ropa" ? "Ropa" : "Merchandising"}</SiteLink>
          {context?.category && (
            <>
              <span>/</span>
              <SiteLink href={context.category.path}>{context.category.name}</SiteLink>
            </>
          )}
          <span>/</span>
          <span>{p.name}</span>
        </nav>
        {priceNotice && (
          <p className="shop-fineprint" role="status">
            {priceNotice}
          </p>
        )}
        {/* Mejora propia: columna de opciones (H1) primero en el HTML; la foto se coloca delante con CSS (product-seo.css). */}
        <div className="shop-product-layout">
          <div className="shop-product-options">
            <span className="eyebrow">
              {brand.toUpperCase()} · REF. {p.code}
            </span>
            {/* Mejora propia: H1 con tipo de producto y marca; el texto de carga y el configurador van después. */}
            <h1>
              {heading ? (
                <>
                  <span className="shop-h1-kind">{heading.kind}</span> {heading.model}
                </>
              ) : (
                p.name
              )}
            </h1>
            <p className="shop-product-summary">{productSummary(p)}</p>
            <section className="shop-step">
              <h2>
                <span>01</span>{" "}
                {options.kind === "placa"
                  ? "Modelo y cantidad"
                  : isGarment
                    ? "Color, talla y cantidad"
                    : showSizeSelect
                      ? "Color, variante y cantidad"
                      : "Color y cantidad"}
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
                              src={imageSrc(image)}
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
                const { variant: v, over } = stockStatus(p, rows, row.sku);
                const formats = p.variants.filter((x) => x.color === v?.color);
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
                      {showSizeSelect && (
                      <label>
                        {sizeLabel}
                        <NativeSelect
                          aria-label={`${sizeLabel} de la selección ${index + 1}`}
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
                      )}
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
                      {brand === "jhk"
                        ? "Stock a consultar"
                        : `${warehouse === "2040" ? "Stock Canarias" : "Stock proveedor"}: ${v?.stock == null ? "Consultar disponibilidad" : `${v.stock} uds.`}`}
                      {over ? ` · ${OVER_STOCK}` : ""}
                    </p>
                  </div>
                );
              })}
              {p.variants.length > 1 && (
                <button
                  className="shop-add"
                  disabled={rows.length >= 30}
                  onClick={() => {
                    // Mejora propia: la fila nueva copia el color y la talla de la anterior.
                    setRows((list) => [...list, { id: nextRowId, sku: list[list.length - 1]?.sku || p.variants[0].sku, quantity: "1" }]);
                    setNextRowId((n) => n + 1);
                  }}
                >
                  <Plus size={17} />{" "}
                  {isGarment ? "Añadir otra talla o color" : showSizeSelect ? "Añadir otra variante o color" : "Añadir otro color"}
                </button>
              )}
              {quantityError && (
                <p role="alert" className="shop-stock-warning">
                  {quantityError}
                </p>
              )}
              {tiers.length > 0 && current && (
                <VolumeTiers
                  tiers={tiers}
                  quantity={quote?.quantity ?? null}
                  detail={[
                    rows.length > 1 ? "Para la primera selección" : "",
                    current.color,
                    realSize(current.size) ? current.size : "",
                    marks.length ? `${marks.length} ${marks.length === 1 ? "marcaje incluido" : "marcajes incluidos"}` : "sin marcaje",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                />
              )}
            </section>
            <section className="shop-step shop-simple-markings">
              <details
                className="shop-marking-disclosure"
                open={markingOpen}
                onToggle={(e) => setMarkingOpen(e.currentTarget.open)}
              >
                <summary>
                  <span>
                    <b>02</b>
                    <strong>Personalización</strong>
                    <small>
                      {askLogo
                        ? "Marcaje a consultar"
                        : marks.length
                          ? marks.map((m) => `${m.position} · ${m.technique === "DTF UV" ? m.technique : `${m.size} · ${m.technique}`}`).join(" / ")
                          : positions.length
                            ? "Sin logo · Añade tu marcaje"
                            : "Sin logo · Abre para añadir tu marcaje"}
                    </small>
                  </span>
                  <Plus size={20} />
                </summary>
                <div className="shop-marking-content">
                  <p>
                    {options.kind === "conjunto"
                      ? "Elige qué prendas personalizar. Cada marcaje se aplica a todos los conjuntos."
                      : "Cada fila cuenta como un marcaje. Se aplica a todas las unidades."}
                    {positions.length > 0 && (
                      <>
                        {" "}
                        Técnica{" "}
                        {[...new Set(positions.map((z) => z.technique))].map((t) => TECHNIQUES[t] ?? t).join(" · ")}.
                      </>
                    )}
                  </p>
                  {groups.map(({ garment, zones }) => {
                    const label = (position: string) => (garment ? position.slice(garment.length + 3) : position);
                    return (
                      <div className={garment ? "shop-mark-garment" : undefined} key={garment || "product"}>
                        {garment && <h3>Marcaje de {garment.toLocaleLowerCase("es")}</h3>}
                        {marks.map((m, index) =>
                          zones.some((z) => z.position === m.position) ? (
                            <div className="shop-mark-row" key={m.id}>
                              <span className="shop-mark-number" aria-label={`Marcaje ${index + 1}`}>
                                {index + 1}
                              </span>
                              <label className="shop-mark-position">
                                Posición
                                <span className="shop-mark-position-control">
                                  <NativeSelect
                                    aria-label={`Zona del marcaje ${index + 1}${garment ? " · " + garment : ""}`}
                                    value={m.position}
                                    onChange={(e) => {
                                      const picked = zones.find((x) => x.position === e.target.value);
                                      if (picked) setMarks((list) => list.map((x) => (x.id === m.id ? { ...picked, id: m.id } : x)));
                                    }}
                                  >
                                    {zones.map((pos) => (
                                      <NativeSelectOption
                                        key={pos.position}
                                        value={pos.position}
                                        disabled={marks.some((x) => x.id !== m.id && x.position === pos.position)}
                                      >
                                        {label(pos.position)}
                                      </NativeSelectOption>
                                    ))}
                                  </NativeSelect>
                                  <span className="shop-mark-position-value" aria-hidden="true">
                                    {label(m.position)}
                                  </span>
                                </span>
                              </label>
                              <label className="shop-mark-size">
                                Tamaño
                                <span className="shop-mark-size-control">
                                  <NativeSelect
                                    aria-label={`Tamaño del marcaje ${index + 1}`}
                                    value={m.size}
                                    onChange={(e) =>
                                      setMarks((list) => list.map((x) => (x.id === m.id ? { ...x, size: e.target.value } : x)))
                                    }
                                  >
                                    {sizesFor(m).map((s) => (
                                      <NativeSelectOption key={s} value={s}>
                                        {m.technique === "DTF UV"
                                          ? "Logo a color"
                                          : `${s} · hasta ${MARK_SIZES.find((x) => x.code === s)?.dimensions}`}
                                      </NativeSelectOption>
                                    ))}
                                  </NativeSelect>
                                  <span className="shop-mark-size-value" aria-hidden="true">
                                    <strong>{m.technique === "DTF UV" ? "Logo a color" : `${m.size} · ${m.technique}`}</strong>
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
                          ) : null,
                        )}
                        {zones.some((z) => !marks.some((x) => x.position === z.position)) && (
                          <button
                            type="button"
                            className="shop-add shop-mark-add"
                            onClick={() => {
                              const free = zones.find((z) => !marks.some((x) => x.position === z.position));
                              if (free) setMarks((list) => [...list, { ...free, id: nextMarkId }]);
                              setNextMarkId((n) => n + 1);
                              setAskLogo(false);
                            }}
                          >
                            <Plus size={17} /> {garment
                              ? `Añadir marcaje de ${garment.toLocaleLowerCase("es")}`
                              : marks.length
                                ? "Añadir otro marcaje"
                                : "Añadir marcaje"}
                          </button>
                        )}
                      </div>
                    );
                  })}
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
                      {techniques.map((t) => TECHNIQUES[t] ?? t).join(" · ")}. Revisamos que el tamaño elegido encaje en {item} antes de
                      producir. Diseño gráfico no incluido.
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
              <p>Sin IGIC ni diseño gráfico. No es un pedido confirmado.</p>
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
                  reprice={{
                    kind: "merch",
                    ...(brandProp === "stamina" ? {} : { brand: brandProp }),
                    model,
                    code: p.code,
                    name: p.name,
                    variants: product.variants
                      .filter((v) => rows.some((r) => r.sku === v.sku))
                      .map(({ sku, color, size, packaging, tariff }) => ({ sku, color, size, packaging, tariff })),
                    rows: rows.map((r) => ({ sku: r.sku, quantity: Number(r.quantity) })),
                    marks,
                    askLogo,
                    notes,
                    delivery,
                  }}
                  sticky={{
                    total: money(shipping?.total),
                    detail: `${quote.quantity} ${quote.quantity === 1 ? "unidad" : "unidades"}`,
                    panel: ".shop-price-panel",
                  }}
                />
              ) : (
                <button className="brand-button" disabled>
                  Revisa las cantidades
                </button>
              )}
              <p>Se abre WhatsApp con tu selección.</p>
            </section>
          </div>
          <div className="shop-product-visual">
            <div className="shop-main-photo">
              {current?.image || p.image ? (
                <img
                  src={imageSrc(current?.image || p.image)}
                  alt={[p.name, productSummary(p), current?.color].filter(Boolean).join(" · ")}
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
              {context && (
                <>
                  {context.buyingGuide && (
                    <p>
                      <b>Antes de elegir</b>
                      <br />
                      {context.buyingGuide}
                    </p>
                  )}
                  <p>{context.personalization}</p>
                  <p>{context.local}</p>
                  <ul>
                    {context.links.map((l) => (
                      <li key={l.path}>
                        <SiteLink href={l.path}>{l.name}</SiteLink>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </details>
          </div>
        </div>
      </div>
      {children}
    </main>
  );
}
