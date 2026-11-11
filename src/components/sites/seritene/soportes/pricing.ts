/**
 * Precio y mensaje de WhatsApp de los configuradores de roll-up, photocall, carpa y bandera.
 * Funciones puras compartidas por cada configurador y por el carrito (al cambiar la cantidad).
 * Importes en céntimos.
 */
import { deliveryLine, formatEuro, formatNumber, shippingFor } from "./order";
import type { FlagProduct, FlagTier, PhotocallProduct, RollupProduct, TentProduct } from "./types";

// --- Roll-up ----------------------------------------------------------------------------------

/** Tramos de cantidad: 1, 2, 3–4, 5–9 y 10+ (5 % de descuento por tramo). */
export const ROLLUP_TIERS = [1, 2, 3, 5, 10];

export function rollupPrice(product: RollupProduct, quantity: number) {
  if (!Number.isSafeInteger(quantity) || quantity < 1) return null;
  const tier = ROLLUP_TIERS.findLastIndex((min) => quantity >= min);
  const unit = product.prices[tier];
  const total = unit * quantity;
  return Number.isSafeInteger(total) ? { unit, total } : null;
}

export function rollupOrder(product: RollupProduct, quantity: number, delivery: boolean) {
  const price = rollupPrice(product, quantity);
  const shipping = shippingFor(price?.total, delivery);
  const message = [
    `Hola Seritene, quiero ${product.name}.`,
    `Cantidad: ${quantity}.`,
    "Aluminio enrollable, tejido Oxford 200 g/m² sublimado a todo color y bolsa de transporte.",
    price && shipping ? `Precio sin IGIC: ${formatEuro(price.unit)} / ud. Total sin IGIC: ${formatEuro(shipping.total)}.` : "",
    deliveryLine(price?.total, delivery),
    "Quiero confirmar diseño, impuestos y plazo.",
  ]
    .filter(Boolean)
    .join("\n");
  return { price, shipping, message, valid: !!price, subtotal: price?.total ?? null };
}

// --- Photocall --------------------------------------------------------------------------------

export function photocallPrice(product: PhotocallProduct, quantity: number) {
  if (product.unit === null || !Number.isSafeInteger(quantity) || quantity < 1) return null;
  const total = product.unit * quantity;
  return Number.isSafeInteger(total) ? { unit: product.unit, total } : null;
}

export function photocallOrder(product: PhotocallProduct, quantity: number, delivery: boolean) {
  const price = photocallPrice(product, quantity);
  const valid = Number.isSafeInteger(quantity) && quantity > 0 && (product.unit === null || !!price);
  const shipping = shippingFor(price?.total, delivery);
  const message = [
    `Hola Seritene, quiero presupuesto para ${product.name} (${product.size}), ${product.width} × ${product.height} cm.`,
    `Cantidad: ${quantity}.`,
    "Pack completo: estructura de aluminio plegable, impresión en poliéster textil de 210 g/m² y bolsa de nylon.",
    price && shipping
      ? `Precio sin IGIC: ${formatEuro(price.unit)} / ud. Total sin IGIC: ${formatEuro(shipping.total)}.`
      : "Precio pendiente de presupuesto.",
    price ? deliveryLine(price.total, delivery) : "Quiero confirmar precio y transporte.",
    "Quiero confirmar diseño, impuestos y plazo.",
  ].join("\n");
  return { price, shipping, message, valid, subtotal: price?.total ?? null };
}

// --- Carpa ------------------------------------------------------------------------------------

export function tentPrice(product: TentProduct, quantity: number) {
  if (!Number.isSafeInteger(quantity) || quantity < 1) return null;
  const total = product.unit * quantity;
  return Number.isSafeInteger(total) ? { unit: product.unit, total } : null;
}

export function tentOrder(product: TentProduct, quantity: number, delivery: boolean) {
  const price = tentPrice(product, quantity);
  const shipping = shippingFor(price?.total, delivery);
  const message = [
    `Hola Seritene, quiero presupuesto para ${product.name}.`,
    `Cantidad: ${quantity}.`,
    "Pack completo: estructura de aluminio plegable de perfil hexagonal de 40 mm, techo impreso en poliéster impermeable de 260 g/m² y bolsa de nylon con ruedas.",
    price && shipping ? `Precio sin IGIC: ${formatEuro(price.unit)} / ud. Total sin IGIC: ${formatEuro(shipping.total)}.` : "",
    price ? deliveryLine(price.total, delivery) : "",
    "Quiero confirmar diseño, impuestos y plazo.",
  ]
    .filter(Boolean)
    .join("\n");
  return { price, shipping, message, valid: !!price, subtotal: price?.total ?? null };
}

// --- Bandera ----------------------------------------------------------------------------------

export type CatalogArt = { src: string; small: string; width: number; height: number; smallWidth: number };

/** Bases de bandera: recortes de /banderas-bases.png ya exportados a /catalogue (chunk `catalog-image`). */
export const FLAG_BASES: { id: string; name: string; description: string; art: CatalogArt }[] = [
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

export type FlagPack = "complete" | "fabric";

export function flagTiers(product: FlagProduct, sizeId: string): FlagTier[] {
  const size = product.sizes.find((s) => s.id === sizeId);
  return size ? (size.tiers ?? [{ min: 1, complete: size.complete, fabric: size.fabric }]) : [];
}

export function flagPrice(product: FlagProduct, sizeId: string, pack: FlagPack, quantity: number) {
  if (!product.sizes.some((s) => s.id === sizeId) || !Number.isSafeInteger(quantity) || quantity < 1) return null;
  const tier = flagTiers(product, sizeId)
    .filter((t) => t.min <= quantity)
    .at(-1);
  if (!tier) return null;
  const unit = pack === "complete" ? tier.complete : tier.fabric;
  return Number.isSafeInteger(unit * quantity) ? { unit, total: unit * quantity } : null;
}

export type FlagSelection = { sizeId: string; pack: FlagPack; baseId: string; quantity: number; delivery: boolean };

export function flagOrder(product: FlagProduct, s: FlagSelection) {
  const size = product.sizes.find((x) => x.id === s.sizeId) ?? product.sizes[0];
  const price = flagPrice(product, s.sizeId, s.pack, s.quantity);
  const complete = s.pack === "complete";
  const base = FLAG_BASES.find((b) => b.id === s.baseId) ?? FLAG_BASES[0];
  const shipping = shippingFor(price?.total, s.delivery);
  const message = [
    `Hola Seritene, quiero ${product.name}, tamaño ${s.sizeId}.`,
    `Cantidad: ${formatNumber(s.quantity)}.`,
    `Tela: ${size.width} × ${size.height} cm.`,
    complete
      ? `Conjunto completo, base ${base.name} y bolsa de transporte. Altura con soporte aproximada: ${size.mounted} cm.`
      : "Solo tela, sin soporte, base ni bolsa de transporte.",
    price && shipping ? `Precio: ${formatEuro(price.unit)} / ud. Total: ${formatEuro(shipping.total)}.` : "",
    deliveryLine(price?.total, s.delivery),
    "Quiero confirmar diseño, impuestos y plazo.",
  ]
    .filter(Boolean)
    .join("\n");
  return { size, price, complete, base, shipping, message, valid: !!price, subtotal: price?.total ?? null };
}
