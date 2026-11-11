/**
 * Recalcular una selección del carrito con otra cantidad (mejora propia).
 *
 * Cada tipo de producto llama a las mismas funciones puras que su ficha (`fullprintOrder`,
 * `printOrder`, `rollupOrder`, `areaOrder`, `merchOrder`…), con la selección guardada en `reprice`,
 * y regenera `subtotal` y `details` igual que «Añadir al carrito». Los datos de cada catálogo se
 * cargan bajo demanda (`import()`), solo si el carrito tiene productos de ese tipo.
 */
import type { MerchReprice, Reprice } from "./reprice";
import { cartDetails, type CartItem } from "./storage";

export type QuantityControl =
  | { type: "select"; options: { value: number; label: string }[] }
  | { type: "number"; min: number; max: number | null; step: number };

export type QuantityRow = {
  /** Nombre de la fila (talla y color en merchandising); `null` = única cantidad del producto. */
  label: string | null;
  control: QuantityControl;
  /** Regla visible bajo el control (mínimo, múltiplos…). */
  hint: string;
};

export type RepriceUpdate = Pick<CartItem, "quantity" | "subtotal" | "details" | "reprice">;

export type Repricer = {
  rows: QuantityRow[];
  /** Cantidades actuales de cada fila. */
  quantities: (item: CartItem) => number[];
  /** Motivo por el que no se puede aplicar (como en la ficha, que desactiva el pedido); `null` si se puede. */
  check: (quantities: number[], changed: number) => string | null;
  /** Avisos que no impiden el cambio (stock), por fila. */
  warnings: (quantities: number[]) => (string | null)[];
  apply: (quantities: number[]) => RepriceUpdate;
};

const es = new Intl.NumberFormat("es-ES");
const isCount = (n: number) => Number.isSafeInteger(n) && n >= 1;
const units = (n: number) => `${es.format(n)} ${n === 1 ? "unidad" : "unidades"}`;

type Single = {
  reprice: Reprice;
  control: QuantityControl;
  hint: string;
  /** Mismo cálculo que la ficha para esa cantidad. */
  order: (quantity: number) => { ok: boolean; subtotal: number | null; message: string };
  error: string;
};

/** Productos con una sola cantidad. */
function single({ reprice, control, hint, order, error }: Single): Repricer {
  return {
    rows: [{ label: null, control, hint }],
    quantities: (item) => [item.quantity ?? (control.type === "number" ? control.min : control.options[0].value)],
    check: ([quantity]) => {
      if (control.type === "select" && !control.options.some((o) => o.value === quantity)) return error;
      return isCount(quantity) && order(quantity).ok ? null : error;
    },
    warnings: () => [null],
    apply: ([quantity]) => {
      const result = order(quantity);
      return { quantity, subtotal: result.subtotal, details: cartDetails(result.message), reprice };
    },
  };
}

const ONE = "Introduce una cantidad entera de al menos 1 unidad.";
const ONE_VALID = "Introduce una cantidad entera válida de al menos 1 unidad.";
const unitControl: QuantityControl = { type: "number", min: 1, max: null, step: 1 };

async function merchRepricer(r: MerchReprice): Promise<Repricer | null> {
  const [{ loadModelPricing }, order, { tierPrice }] = await Promise.all([
    import("../merch/loadPricing"),
    import("../merch/order"),
    import("../merch/pricing"),
  ]);
  // Tarifa y stock del día, como la ficha; si no cargan, la ficha usa los datos propios de la variante.
  const data = await loadModelPricing(r.model).catch(() => ({ pricing: {}, stock: {} }));
  const product = order.withModelPricing(
    {
      name: r.name,
      code: r.code,
      variants: r.variants.map((v) => ({ ...v, image: "", price: null, stock: null })),
    },
    data,
  );
  if (r.rows.some((row) => !product.variants.some((v) => v.sku === row.sku))) return null;

  const rowsWith = (quantities: number[]) => r.rows.map((row, i) => ({ sku: row.sku, quantity: quantities[i] }));
  const rows: QuantityRow[] = r.rows.map((row) => {
    const v = product.variants.find((x) => x.sku === row.sku)!;
    const shared = r.rows.filter((x) => x.sku === row.sku).length > 1;
    // Embalaje del proveedor (mínimo y múltiplos por talla y color), salvo tarifa manual.
    const rules = !shared && v.tariff?.version === 2 && v.tariff.basis !== "manual-unit" && v.packaging ? v.packaging : null;
    const min = Math.max(1, rules?.minimum ?? 1);
    const step = Math.max(1, rules?.multiple ?? 1);
    const size = v.size?.startsWith("TALLA ÚNICA") ? "Único" : v.size || "Único";
    return {
      label: `${v.color} · ${size}`,
      control: { type: "number", min, max: 5000, step },
      hint: [min > 1 ? `Mínimo ${min}` : "", step > 1 ? `múltiplos de ${step}` : ""].filter(Boolean).join(" · "),
    };
  });

  return {
    rows,
    // Las filas guardadas cambian al editar (el recálculo no se vuelve a preparar): se leen de la selección actual.
    quantities: (item) => (item.reprice?.kind === "merch" ? item.reprice : r).rows.map((row) => row.quantity),
    check: (quantities, changed) => {
      const selection = rowsWith(quantities);
      if (merchOrderFor(selection).quantityError) return order.MERCH_QUANTITY_ERROR;
      const { variant, total } = order.stockStatus(product, selection, selection[changed].sku);
      const tier = variant ? tierPrice(variant.tariff, variant.packaging, total) : null;
      return tier && (tier.tier === "minimum" || tier.tier === "multiple") ? tier.issue : null;
    },
    warnings: (quantities) => {
      const selection = rowsWith(quantities);
      return selection.map((row) => (order.stockStatus(product, selection, row.sku).over ? order.OVER_STOCK : null));
    },
    apply: (quantities) => {
      const selection = rowsWith(quantities);
      const result = merchOrderFor(selection);
      return {
        quantity: result.quote?.quantity ?? quantities.reduce((a, b) => a + b, 0),
        subtotal: result.subtotal,
        details: cartDetails(result.message),
        reprice: { ...r, rows: selection },
      };
    },
  };

  function merchOrderFor(selection: { sku: string; quantity: number }[]) {
    return order.merchOrder({
      product,
      rows: selection,
      marks: r.marks,
      askLogo: r.askLogo,
      notes: r.notes,
      delivery: r.delivery,
    });
  }
}

/** Prepara el recálculo de una selección; `null` si el producto ya no existe (se cambia en la ficha). */
export async function loadRepricer(r: Reprice): Promise<Repricer | null> {
  switch (r.kind) {
    case "fullprint": {
      const [{ fullprintModels }, { fullprintOrder }] = await Promise.all([
        import("../fullprint/data"),
        import("../fullprint/pricing"),
      ]);
      const product = fullprintModels.find((m) => m.slug === r.slug);
      if (!product?.variants.some((v) => v.id === r.variantId)) return null;
      const order = (quantity: number) => {
        const o = fullprintOrder(product, { ...r, quantity });
        return { ok: o.validQuantity, subtotal: o.subtotal, message: o.message, minimum: o.minimum };
      };
      const { minimum } = order(NaN);
      return single({
        reprice: r,
        control: { type: "number", min: minimum, max: null, step: 1 },
        hint: `Pedido mínimo: ${es.format(minimum)} unidades.`,
        order,
        error: `Introduce una cantidad entera de al menos ${es.format(minimum)} unidades.`,
      });
    }
    case "print": {
      const { printProducts, printOrder, printQuantityOptions, PRINT_MINIMUM } = await import("../shop/printData");
      const product = printProducts.find((p) => p.slug === r.slug);
      if (!product) return null;
      const variant = product.variants.find((v) => v.id === r.variantId);
      if (product.variants.length && !variant) return null;
      const order = (quantity: number) => {
        const o = printOrder(product, { ...r, quantity });
        return { ok: o.canOrder, subtotal: o.subtotal, message: o.message };
      };
      const { minimum } = printOrder(product, { ...r, quantity: NaN });
      return single({
        reprice: r,
        control: variant
          ? { type: "select", options: printQuantityOptions(variant).map((o) => ({ value: o.quantity, label: o.label })) }
          : { type: "number", min: minimum, max: null, step: 1 },
        hint: `Pedido mínimo: ${es.format(PRINT_MINIMUM)} unidades.`,
        order,
        error: `Introduce una cantidad entera de al menos ${es.format(minimum)} unidades.`,
      });
    }
    case "rollup":
    case "photocall":
    case "tent":
    case "flag": {
      const [{ supportModels }, pricing] = await Promise.all([import("../soportes/data.generated"), import("../soportes/pricing")]);
      const model = supportModels[r.slug];
      if (!model) return null;
      let order: Single["order"] | null = null;
      if (r.kind === "rollup" && model.configurator === "RollupConfigurator") {
        const product = model.product;
        order = (q) => {
          const o = pricing.rollupOrder(product, q, r.delivery);
          return { ok: o.valid, subtotal: o.subtotal, message: o.message };
        };
      } else if (r.kind === "photocall" && model.configurator === "PhotocallConfigurator") {
        const product = model.product;
        order = (q) => {
          const o = pricing.photocallOrder(product, q, r.delivery);
          return { ok: o.valid, subtotal: o.subtotal, message: o.message };
        };
      } else if (r.kind === "tent" && model.configurator === "TentConfigurator") {
        const product = model.product;
        order = (q) => {
          const o = pricing.tentOrder(product, q, r.delivery);
          return { ok: o.valid, subtotal: o.subtotal, message: o.message };
        };
      } else if (r.kind === "flag" && model.configurator === "FlagConfigurator") {
        const product = model.product;
        if (!product.sizes.some((s) => s.id === r.sizeId)) return null;
        order = (q) => {
          const o = pricing.flagOrder(product, { ...r, quantity: q });
          return { ok: o.valid, subtotal: o.subtotal, message: o.message };
        };
      }
      if (!order) return null;
      return single({
        reprice: r,
        control: unitControl,
        hint: "",
        order,
        error: r.kind === "rollup" || r.kind === "flag" ? ONE : ONE_VALID,
      });
    }
    case "area": {
      const { areaOrder, validMeasure } = await import("./../soportes/areaPricing");
      if (!validMeasure(r.width) || !validMeasure(r.height)) return null;
      const options = { thickness: r.thickness, finish: r.finish };
      return single({
        reprice: r,
        control: unitControl,
        hint: `Piezas iguales de ${es.format(r.width)} × ${es.format(r.height)} cm.`,
        order: (quantity) => {
          const o = areaOrder(r.area, { width: r.width, height: r.height, quantity, options, delivery: r.delivery });
          return { ok: !!o.price, subtotal: o.subtotal, message: o.message };
        },
        error: "Introduce una cantidad entera de al menos 1 pieza.",
      });
    }
    case "merch":
      return merchRepricer(r);
  }
}

/** «1.000 unidades» o, en merchandising con varias filas, el total. */
export const quantityText = (quantity: number | null) => (quantity === null ? "Cantidad a confirmar" : units(quantity));

/** Siguiente cantidad válida hacia arriba o hacia abajo (`null` si no hay). */
export function stepQuantity(control: QuantityControl, current: number, direction: 1 | -1): number | null {
  if (control.type === "select") {
    const values = control.options.map((o) => o.value);
    const index = values.indexOf(current);
    const next =
      index === -1
        ? direction === 1
          ? values.find((v) => v > current)
          : values.findLast((v) => v < current)
        : values[index + direction];
    return next ?? null;
  }
  const { min, max, step } = control;
  const lowest = Math.ceil(min / step) * step;
  const base = Number.isSafeInteger(current) ? current : lowest - step * direction;
  let next = direction === 1 ? Math.floor(base / step) * step + step : Math.ceil(base / step) * step - step;
  if (direction === 1 && next < lowest) next = lowest;
  if (direction === -1 && max !== null && next > max) next = Math.floor(max / step) * step;
  if (next < lowest || (max !== null && next > max) || !Number.isSafeInteger(next)) return null;
  return next;
}
