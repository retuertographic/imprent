/**
 * Precio y mensaje de las calculadoras por superficie (cartón pluma, imantado, lona y póster).
 * Portado de los chunks `foam-`, `magnet-`, `banner-` y `poster-configurator` de seritene.com:
 * el precio es la superficie total (m²) por la tarifa del tramo de superficie, en céntimos.
 * Lo usan `AreaConfigurator` y el carrito al cambiar la cantidad.
 */
import { deliveryLine, formatEuro, shippingFor } from "./order";

export type AreaKind = "foam" | "magnet" | "banner" | "poster";

/** Tramos de superficie total (m², desde) y tarifa en céntimos por m². */
type RateTable = { from: number[]; rate: number[] };

export type AreaOptions = { thickness: number; finish: string };

const UV_PRINT: RateTable = {
  from: [0, 0.3, 0.61, 1, 3, 6, 10, 20, 40],
  rate: [6000, 3600, 3000, 2400, 2100, 1980, 1860, 1740, 1620],
};
const FOAM_BOARD: Record<number, RateTable> = {
  5: { from: [0, 0.1, 0.3, 0.6, 1, 3, 6, 10], rate: [4000, 2800, 2400, 2000, 1600, 1400, 1320, 1240] },
  10: { from: [0, 0.1, 0.3, 0.6, 1, 3, 6, 10], rate: [5500, 3850, 3300, 2750, 2200, 1925, 1815, 1705] },
};
const MAGNET_SHEET: RateTable = {
  from: [0, 0.1, 0.3, 0.61, 1, 3, 6, 10, 20],
  rate: [9000, 6300, 5400, 4500, 3600, 3150, 2970, 2790, 2610],
};
const BANNER: RateTable = { from: [0, 0.3, 0.61, 1, 3, 6, 10, 20], rate: [7500, 4500, 3750, 3000, 2625, 2475, 2325, 2175] };
const POSTER: RateTable = { from: [0, 0.3, 0.61, 1, 3, 6, 10, 20], rate: [5000, 3000, 2500, 2000, 1750, 1650, 1550, 1450] };

/** Medida válida: desde 1 cm, con un decimal como máximo. */
export const validMeasure = (v: number) =>
  Number.isFinite(v) && v >= 1 && Number.isSafeInteger(Math.round(v * 10)) && Math.abs(v * 10 - Math.round(v * 10)) < 1e-6;

export function areaPrice(width: number, height: number, quantity: number, tables: RateTable[]) {
  if (!Number.isSafeInteger(quantity) || quantity < 1) return null;
  if (![width, height].every(validMeasure)) return null;
  // Superficie en unidades de (mm)² · 10⁻² → 1e6 = 1 m²
  const area = Math.round(width * 10) * Math.round(height * 10) * quantity;
  if (!Number.isSafeInteger(area)) return null;
  const rate = tables.reduce((sum, t) => sum + t.rate[t.from.findLastIndex((from) => area >= Math.round(from * 1e6))], 0);
  const raw = area * rate;
  if (!Number.isSafeInteger(raw)) return null;
  const total = Math.round(raw / 1e6);
  return total > 0 ? { total, area: area / 1e6 } : null;
}

type AreaPricing = {
  tables: (o: AreaOptions) => RateTable[];
  /** Primera y tercera línea del mensaje de WhatsApp. */
  message: (o: AreaOptions) => [string, string];
  /** Nombre e imagen que se guardan en el carrito. */
  cart: { image: string; name: string };
};

export const AREA_PRICING: Record<AreaKind, AreaPricing> = {
  foam: {
    tables: (o) => [FOAM_BOARD[o.thickness], UV_PRINT],
    message: (o) => [
      `Hola Seritene, quiero cartón pluma impreso de ${o.thickness} mm.`,
      `Acabado: ${o.finish}. Impresión a todo color a una cara con vinilo aplicado.`,
    ],
    cart: { image: "/catalogue/coleccion-carton-pluma.png", name: "Cartón pluma impreso" },
  },
  magnet: {
    tables: () => [MAGNET_SHEET, UV_PRINT],
    message: (o) => [
      "Hola Seritene, quiero imantado impreso de 0,5 mm.",
      `Acabado: ${o.finish}. Impresión a todo color a una cara con vinilo aplicado.`,
    ],
    cart: { image: "/catalogue/coleccion-imantados.png", name: "Imantado impreso" },
  },
  banner: {
    tables: () => [BANNER],
    message: () => [
      "Hola Seritene, quiero lona fundida de 510 g/m² con impresión UV digital y ollados incluidos.",
      "Impresión a todo color a una cara. Ollados incluidos.",
    ],
    cart: { image: "/catalogue/coleccion-lonas.png", name: "Lona impresa con ollados" },
  },
  poster: {
    tables: () => [POSTER],
    message: () => [
      "Hola Seritene, quiero un póster en papel de 150 g/m² con impresión UV digital a todo color.",
      "Impresión a todo color a una cara.",
    ],
    cart: { image: "/catalogue/coleccion-posters.png", name: "Póster impreso" },
  },
};

export type AreaSelection = { width: number; height: number; quantity: number; options: AreaOptions; delivery: boolean };

/** Precio y mensaje de una selección (mensaje vacío si las medidas o la cantidad no son válidas). */
export function areaOrder(kind: AreaKind, s: AreaSelection) {
  const config = AREA_PRICING[kind];
  const price = config.tables(s.options).every(Boolean) ? areaPrice(s.width, s.height, s.quantity, config.tables(s.options)) : null;
  const shipping = shippingFor(price?.total, s.delivery);
  const [first, third] = config.message(s.options);
  const message =
    price && shipping
      ? [
          first,
          `Medidas por pieza: ${s.width} × ${s.height} cm. Cantidad: ${s.quantity}.`,
          third,
          `Total sin IGIC: ${formatEuro(shipping.total)}.`,
          deliveryLine(price.total, s.delivery),
          "Quiero confirmar archivo, medidas de fabricación y plazo.",
        ].join("\n")
      : "";
  return { price, shipping, message, subtotal: price?.total ?? null };
}
