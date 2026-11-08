"use client";

/**
 * Calculadoras por superficie (cartón pluma, imantado, lona y póster).
 * Portadas de los chunks `foam-`, `magnet-`, `banner-` y `poster-configurator` de seritene.com:
 * el precio es la superficie total (m²) por la tarifa del tramo de superficie, en céntimos.
 */
import { useState, type ReactNode } from "react";
import { Input } from "../form-controls";
import { OrderActions } from "../OrderActions";
import { ProductDelivery } from "../ProductDelivery";
import { deliveryLine, formatEuro, shippingFor } from "../order";
import { BannerArt, FoamArt, MagnetArt, PosterArt } from "./AreaArt";

export type AreaKind = "foam" | "magnet" | "banner" | "poster";

/** Tramos de superficie total (m², desde) y tarifa en céntimos por m². */
type RateTable = { from: number[]; rate: number[] };

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
const validMeasure = (v: number) =>
  Number.isFinite(v) && v >= 1 && Number.isSafeInteger(Math.round(v * 10)) && Math.abs(v * 10 - Math.round(v * 10)) < 1e-6;

function areaPrice(width: number, height: number, quantity: number, tables: RateTable[]) {
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

type Options = { thickness: number; finish: string };

type KindConfig = {
  id: string;
  defaults: [string, string];
  presets: [number, number][];
  tables: (o: Options) => RateTable[];
  art: (w: number, h: number, o: Options) => ReactNode;
  previewLine: (o: Options) => string;
  previewNote: string;
  intro: (o: Options, setOptions: (o: Partial<Options>) => void) => ReactNode;
  measuresStep: string;
  priceLine: string;
  pieceSuffix: (o: Options) => string;
  message: (o: Options) => [string, string];
  cart: { image: string; name: string };
  conditions: string;
};

const CONDITIONS =
  "Precio calculado según la superficie total de las piezas. Sin IGIC. El diseño o la adaptación de archivos, si los necesitas, se presupuestan aparte. Confirmamos las medidas de fabricación y el plazo antes de producir.";

function FinishOptions({ finish, onChange }: { finish: string; onChange: (finish: string) => void }) {
  return (
    <fieldset className="foam-fieldset">
      <legend>Acabado de impresión</legend>
      <div className="foam-options">
        {["Mate", "Brillo"].map((f) => (
          <button key={f} type="button" aria-pressed={finish === f} onClick={() => onChange(f)}>
            {f}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Step({ mark, children }: { mark: string; children: ReactNode }) {
  return (
    <div className="foam-step">
      <span>{mark}</span>
      <h2>{children}</h2>
    </div>
  );
}

const KINDS: Record<AreaKind, KindConfig> = {
  foam: {
    id: "foam",
    defaults: ["50", "70"],
    presets: [
      [30, 40],
      [50, 70],
      [70, 100],
      [100, 100],
    ],
    tables: (o) => [FOAM_BOARD[o.thickness], UV_PRINT],
    art: (w, h, o) => <FoamArt width={w} height={h} thickness={o.thickness} gloss={o.finish === "Brillo"} />,
    previewLine: (o) => `${o.thickness} mm · ${o.finish} · Una cara`,
    previewNote: "Vista orientativa. Imprimimos tu diseño.",
    intro: (o, set) => (
      <>
        <Step mark="01">Elige el acabado</Step>
        <fieldset className="foam-fieldset">
          <legend>Grosor del cartón pluma</legend>
          <div className="foam-options">
            {[5, 10].map((t) => (
              <button key={t} type="button" aria-pressed={o.thickness === t} onClick={() => set({ thickness: t })}>
                {t} mm
              </button>
            ))}
          </div>
        </fieldset>
        <FinishOptions finish={o.finish} onChange={(finish) => set({ finish })} />
      </>
    ),
    measuresStep: "02",
    priceLine: "Cartón pluma + impresión a todo color + vinilo aplicado",
    pieceSuffix: (o) => `${o.thickness} mm · ${o.finish}`,
    message: (o) => [
      `Hola Seritene, quiero cartón pluma impreso de ${o.thickness} mm.`,
      `Acabado: ${o.finish}. Impresión a todo color a una cara con vinilo aplicado.`,
    ],
    cart: { image: "/catalogue/coleccion-carton-pluma.png", name: "Cartón pluma impreso" },
    conditions: `Impresión a una cara. ${CONDITIONS}`,
  },
  magnet: {
    id: "magnet",
    defaults: ["50", "30"],
    presets: [
      [30, 20],
      [50, 30],
      [60, 40],
      [100, 50],
    ],
    tables: () => [MAGNET_SHEET, UV_PRINT],
    art: (w, h, o) => <MagnetArt width={w} height={h} gloss={o.finish === "Brillo"} />,
    previewLine: (o) => `0,5 mm · ${o.finish} · Una cara`,
    previewNote: "Vista orientativa. Imprimimos tu diseño.",
    intro: (o, set) => (
      <>
        <Step mark="01">Elige el acabado</Step>
        <p className="foam-hint">Lámina imantada de 0,5 mm con vinilo impreso aplicado.</p>
        <FinishOptions finish={o.finish} onChange={(finish) => set({ finish })} />
      </>
    ),
    measuresStep: "02",
    priceLine: "Lámina imantada + impresión a todo color + vinilo aplicado",
    pieceSuffix: (o) => `0,5 mm · ${o.finish}`,
    message: (o) => [
      "Hola Seritene, quiero imantado impreso de 0,5 mm.",
      `Acabado: ${o.finish}. Impresión a todo color a una cara con vinilo aplicado.`,
    ],
    cart: { image: "/catalogue/coleccion-imantados.png", name: "Imantado impreso" },
    conditions: `Impresión a una cara. ${CONDITIONS}`,
  },
  banner: {
    id: "banner",
    defaults: ["200", "100"],
    presets: [
      [100, 100],
      [200, 100],
      [300, 100],
      [300, 200],
    ],
    tables: () => [BANNER],
    art: (w, h) => <BannerArt width={w} height={h} />,
    previewLine: () => "510 g/m² · Ollados incluidos",
    previewNote: "Vista orientativa. La distribución de ollados se confirma con el pedido.",
    intro: () => (
      <>
        <Step mark="✓">Impresión y ollados incluidos</Step>
        <p className="foam-hint">Lona fundida de 510 g/m² con impresión UV digital a todo color a una cara.</p>
      </>
    ),
    measuresStep: "01",
    priceLine: "Lona 510 g/m² + impresión a todo color + ollados",
    pieceSuffix: () => "Ollados incluidos",
    message: () => [
      "Hola Seritene, quiero lona fundida de 510 g/m² con impresión UV digital y ollados incluidos.",
      "Impresión a todo color a una cara. Ollados incluidos.",
    ],
    cart: { image: "/catalogue/coleccion-lonas.png", name: "Lona impresa con ollados" },
    conditions: `Ollados incluidos. Confirmamos su distribución al preparar el pedido. Impresión a una cara. ${CONDITIONS}`,
  },
  poster: {
    id: "poster",
    defaults: ["50", "70"],
    presets: [
      [29.7, 42],
      [42, 59.4],
      [50, 70],
      [70, 100],
    ],
    tables: () => [POSTER],
    art: (w, h) => <PosterArt width={w} height={h} />,
    previewLine: () => "Papel 150 g/m² · A todo color",
    previewNote: "Vista orientativa. Imprimimos tu diseño.",
    intro: () => (
      <>
        <Step mark="✓">Impresión a color incluida</Step>
        <p className="foam-hint">Papel póster de 150 g/m² con impresión UV digital a todo color a una cara.</p>
      </>
    ),
    measuresStep: "01",
    priceLine: "Papel 150 g/m² + impresión UV a todo color",
    pieceSuffix: () => "Impresión incluida",
    message: () => [
      "Hola Seritene, quiero un póster en papel de 150 g/m² con impresión UV digital a todo color.",
      "Impresión a todo color a una cara.",
    ],
    cart: { image: "/catalogue/coleccion-posters.png", name: "Póster impreso" },
    conditions: `Papel impreso a una cara. Marco no incluido. ${CONDITIONS}`,
  },
};

const parse = (value: string) => (value.trim() ? Number(value.replace(",", ".")) : NaN);

export function AreaConfigurator({ kind }: { kind: AreaKind }) {
  const config = KINDS[kind];
  const [widthText, setWidthText] = useState(config.defaults[0]);
  const [heightText, setHeightText] = useState(config.defaults[1]);
  const [quantityText, setQuantityText] = useState("1");
  const [options, setOptionsState] = useState<Options>({ thickness: 5, finish: "Mate" });
  const [delivery, setDelivery] = useState(false);
  const setOptions = (patch: Partial<Options>) => setOptionsState((o) => ({ ...o, ...patch }));

  const width = parse(widthText);
  const height = parse(heightText);
  const quantity = parse(quantityText);
  const price = areaPrice(width, height, quantity, config.tables(options));
  const shipping = shippingFor(price?.total, delivery);
  const [first, third] = config.message(options);
  const message =
    price && shipping
      ? [
          first,
          `Medidas por pieza: ${width} × ${height} cm. Cantidad: ${quantity}.`,
          third,
          `Total sin IGIC: ${formatEuro(shipping.total)}.`,
          deliveryLine(price.total, delivery),
          "Quiero confirmar archivo, medidas de fabricación y plazo.",
        ].join("\n")
      : "";
  const id = config.id;
  const [defaultW, defaultH] = config.defaults.map(Number);

  return (
    <div className="foam-calculator">
      <div className="foam-preview">
        <span className="foam-preview-label">TU FORMATO, A MEDIDA</span>
        {config.art(price ? width : defaultW, price ? height : defaultH, options)}
        <strong>{price ? `${widthText} × ${heightText} cm` : "Introduce tus medidas"}</strong>
        <p>{config.previewLine(options)}</p>
        <small>{config.previewNote}</small>
      </div>
      <div className="foam-controls">
        {config.intro(options, setOptions)}
        <Step mark={config.measuresStep}>Introduce tus medidas</Step>
        <div className="foam-measures">
          <div className="print-field">
            <label htmlFor={`${id}-width`}>Ancho (cm)</label>
            <Input
              id={`${id}-width`}
              inputMode="decimal"
              value={widthText}
              onChange={(e) => setWidthText(e.target.value)}
              aria-invalid={!validMeasure(width)}
              aria-describedby={`${id}-dim-help`}
            />
          </div>
          <span aria-hidden="true">×</span>
          <div className="print-field">
            <label htmlFor={`${id}-height`}>Alto (cm)</label>
            <Input
              id={`${id}-height`}
              inputMode="decimal"
              value={heightText}
              onChange={(e) => setHeightText(e.target.value)}
              aria-invalid={!validMeasure(height)}
              aria-describedby={`${id}-dim-help`}
            />
          </div>
        </div>
        <p id={`${id}-dim-help`} className="foam-hint">
          En centímetros, desde 1 cm. Puedes usar un decimal (por ejemplo, 29,7).
        </p>
        <div className="foam-presets" aria-label="Medidas habituales">
          {config.presets.map(([w, h]) => (
            <button
              key={`${w}x${h}`}
              type="button"
              onClick={() => {
                setWidthText(String(w));
                setHeightText(String(h));
              }}
            >
              {w.toLocaleString("es-ES")} × {h.toLocaleString("es-ES")}
            </button>
          ))}
        </div>
        <div className="print-field">
          <label htmlFor={`${id}-quantity`}>Cantidad de piezas iguales</label>
          <Input
            id={`${id}-quantity`}
            type="number"
            min={1}
            step={1}
            value={quantityText}
            onChange={(e) => setQuantityText(e.target.value)}
            aria-invalid={!Number.isSafeInteger(quantity) || quantity < 1}
          />
        </div>
        <div className="foam-price" aria-live="polite" aria-atomic="true">
          <span>Tu precio completo · sin IGIC</span>
          <strong>{price && shipping ? formatEuro(shipping.total) : "—"}</strong>
          <p>{config.priceLine}</p>
          {price && (
            <small>
              {quantity} {quantity === 1 ? "pieza" : "piezas"} de {widthText} × {heightText} cm · {config.pieceSuffix(options)}
            </small>
          )}
        </div>
        {!price && (
          <p className="foam-error" role="alert">
            Revisa las medidas y la cantidad: medidas desde 1 cm con un decimal como máximo y una cantidad entera de al menos 1.
            Para medidas fuera de rango, consúltanos.
          </p>
        )}
        {price && <ProductDelivery subtotal={price.total} selected={delivery} onChange={setDelivery} />}
        {price ? (
          <OrderActions
            image={config.cart.image}
            name={config.cart.name}
            message={message}
            quantity={quantity}
            subtotal={price.total}
            delivery={delivery}
          />
        ) : (
          <button className="brand-button print-request" disabled>
            Revisa tus medidas
          </button>
        )}
        <p className="print-conditions">{config.conditions}</p>
      </div>
    </div>
  );
}
