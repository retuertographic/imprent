/**
 * Campo opcional `reprice` de cada selección del carrito (mejora propia; producción no lo tiene).
 *
 * Guarda la selección mínima de la ficha (producto, opciones y, en merchandising, las filas con sus
 * cantidades) para que el carrito pueda recalcular precio y mensaje con las mismas funciones que la
 * ficha al cambiar la cantidad. Las selecciones sin este campo (añadidas antes) siguen funcionando:
 * su cantidad se muestra sin editar y se enlaza a la ficha.
 */
import type { Marking } from "../merch/pricing";
import type { Packaging, Tariff } from "../merch/types";
import type { AreaKind } from "../soportes/areaPricing";

export type FullprintReprice = {
  kind: "fullprint";
  slug: string;
  variantId: string;
  extraIds: string[];
  attachmentId?: string;
  fabricId?: string;
  cut: string;
  design: string;
  notes: string;
  delivery: boolean;
};

export type PrintReprice = {
  kind: "print";
  slug: string;
  variantId: string;
  design: string;
  customFormat: string;
  delivery: boolean;
};

export type SupportReprice = {
  kind: "rollup" | "photocall" | "tent";
  slug: string;
  delivery: boolean;
};

export type FlagReprice = {
  kind: "flag";
  slug: string;
  sizeId: string;
  pack: "complete" | "fabric";
  baseId: string;
  delivery: boolean;
};

export type AreaReprice = {
  kind: "area";
  area: AreaKind;
  width: number;
  height: number;
  thickness: number;
  finish: string;
  delivery: boolean;
};

/** Datos de la ficha de una variante (antes de aplicar la tarifa del día de merch-pricing.json). */
export type MerchVariantSnapshot = {
  sku: string;
  color: string;
  size: string;
  packaging?: Packaging | null;
  tariff?: Tariff | null;
};

export type MerchReprice = {
  kind: "merch";
  /** Modelo de 4 cifras (clave de merch-pricing.json). */
  model: string;
  code: string;
  name: string;
  variants: MerchVariantSnapshot[];
  rows: { sku: string; quantity: number }[];
  marks: Marking[];
  askLogo: boolean;
  notes: string;
  delivery: boolean;
};

export type Reprice =
  | FullprintReprice
  | PrintReprice
  | SupportReprice
  | FlagReprice
  | AreaReprice
  | MerchReprice;

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown, max = 200) => typeof v === "string" && v.length <= max;
const optStr = (v: unknown) => v === undefined || str(v);
const bool = (v: unknown) => typeof v === "boolean";
const num = (v: unknown) => typeof v === "number" && Number.isFinite(v);
const nullableObj = (v: unknown) => v === undefined || v === null || isObj(v);

function isMerch(e: Obj) {
  return (
    /^\d{4}$/.test(String(e.model)) &&
    str(e.code) &&
    str(e.name, 300) &&
    str(e.notes, 1000) &&
    bool(e.askLogo) &&
    Array.isArray(e.variants) &&
    e.variants.length <= 30 &&
    e.variants.every((v) => isObj(v) && str(v.sku) && str(v.color) && str(v.size) && nullableObj(v.packaging) && nullableObj(v.tariff)) &&
    Array.isArray(e.rows) &&
    e.rows.length >= 1 &&
    e.rows.length <= 30 &&
    e.rows.every((r) => isObj(r) && str(r.sku) && Number.isSafeInteger(r.quantity)) &&
    Array.isArray(e.marks) &&
    e.marks.length <= 20 &&
    e.marks.every((m) => isObj(m) && num(m.id) && str(m.position) && str(m.technique) && str(m.size))
  );
}

/** Comprobación estructural del campo guardado (un valor no válido se ignora, la selección se conserva). */
export function isReprice(value: unknown): value is Reprice {
  if (!isObj(value) || !bool(value.delivery)) return false;
  const e = value;
  switch (e.kind) {
    case "fullprint":
      return (
        str(e.slug) &&
        str(e.variantId) &&
        Array.isArray(e.extraIds) &&
        e.extraIds.every((id) => str(id)) &&
        optStr(e.attachmentId) &&
        optStr(e.fabricId) &&
        str(e.cut) &&
        str(e.design) &&
        str(e.notes, 1000)
      );
    case "print":
      return str(e.slug) && str(e.variantId) && str(e.design) && str(e.customFormat);
    case "rollup":
    case "photocall":
    case "tent":
      return str(e.slug);
    case "flag":
      return str(e.slug) && str(e.sizeId) && (e.pack === "complete" || e.pack === "fabric") && str(e.baseId);
    case "area":
      return (
        ["foam", "magnet", "banner", "poster"].includes(String(e.area)) &&
        num(e.width) &&
        num(e.height) &&
        num(e.thickness) &&
        str(e.finish)
      );
    case "merch":
      return isMerch(e);
    default:
      return false;
  }
}
