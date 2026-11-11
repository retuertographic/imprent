"use client";

/**
 * Calculadoras por superficie (cartón pluma, imantado, lona y póster).
 * Portadas de los chunks `foam-`, `magnet-`, `banner-` y `poster-configurator` de seritene.com.
 * Precio y mensaje: `../areaPricing.ts` (compartido con el carrito).
 */
import { useState, type ReactNode } from "react";
import { Input } from "../form-controls";
import { OrderActions } from "../OrderActions";
import { ProductDelivery } from "../ProductDelivery";
import { formatEuro } from "../order";
import { AREA_PRICING, areaOrder, validMeasure, type AreaKind, type AreaOptions } from "../areaPricing";
import { BannerArt, FoamArt, MagnetArt, PosterArt } from "./AreaArt";

export type { AreaKind };

type Options = AreaOptions;

type KindConfig = {
  id: string;
  defaults: [string, string];
  presets: [number, number][];
  art: (w: number, h: number, o: Options) => ReactNode;
  previewLine: (o: Options) => string;
  previewNote: string;
  intro: (o: Options, setOptions: (o: Partial<Options>) => void) => ReactNode;
  measuresStep: string;
  priceLine: string;
  pieceSuffix: (o: Options) => string;
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
  const { price, shipping, message } = areaOrder(kind, { width, height, quantity, options, delivery });
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
            image={AREA_PRICING[kind].cart.image}
            name={AREA_PRICING[kind].cart.name}
            message={message}
            quantity={quantity}
            subtotal={price.total}
            delivery={delivery}
            reprice={{ kind: "area", area: kind, width, height, thickness: options.thickness, finish: options.finish, delivery }}
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
