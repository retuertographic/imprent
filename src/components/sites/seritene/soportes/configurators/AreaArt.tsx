/** Vistas orientativas (SVG) de cartón pluma, imantado, lona y póster, proporcionales a las medidas. */
import { PrintDesign } from "./PrintDesign";

const ratioOf = (width: number, height: number) => Math.max(0.15, Math.min(6, width / height));

export function FoamArt({ width = 50, height = 70, thickness = 5, gloss = false }: { width?: number; height?: number; thickness?: number; gloss?: boolean }) {
  const ratio = ratioOf(width, height);
  const w = Math.min(280, 290 * ratio);
  const h = w / ratio;
  const x = (360 - w) / 2;
  const y = (350 - h) / 2;
  const edge = thickness === 10 ? 9 : 5;
  return (
    <svg className="foam-art" viewBox="0 0 380 400" role="img" aria-label={`Vista orientativa de cartón pluma de ${thickness} mm con diseño Seritene`}>
      <ellipse cx="195" cy="360" rx="125" ry="12" fill="#142211" opacity=".08" />
      <g transform="translate(5 0) skewY(-3)">
        <path d={`M${x + w} ${y}l${edge} ${edge}v${h}l-${edge} -${edge}Z`} fill="#d5d6cf" />
        <path d={`M${x} ${y + h}l${edge} ${edge}h${w}l-${edge} -${edge}Z`} fill="#fefefe" stroke="#d4d5ce" />
        <rect x={x} y={y} width={w} height={h} rx="1" fill="white" stroke="#d4d9d0" />
        <PrintDesign x={x} y={y} width={w} height={h} variant="foam" />
        {gloss && <path d={`M${x + w * 0.52} ${y}H${x + w * 0.75}L${x + w * 0.3} ${y + h}H${x + w * 0.12}Z`} fill="white" opacity=".24" />}
      </g>
    </svg>
  );
}

export function MagnetArt({ width = 50, height = 30, gloss = false }: { width?: number; height?: number; gloss?: boolean }) {
  const ratio = ratioOf(width, height);
  const w = Math.min(290, 280 * ratio);
  const h = w / ratio;
  const x = (360 - w) / 2;
  const y = (340 - h) / 2;
  const curl = Math.min(w, h) * 0.17;
  return (
    <svg className="foam-art" viewBox="0 0 380 400" role="img" aria-label="Vista orientativa de lámina imantada impresa de 0,5 mm con diseño Seritene">
      <ellipse cx="195" cy="346" rx="130" ry="12" fill="#142211" opacity=".09" />
      <g transform="translate(6 5) skewY(-4)">
        <rect x={x + 3} y={y + 3} width={w} height={h} rx="3" fill="#343934" />
        <path d={`M${x} ${y}H${x + w}V${y + h - curl}Q${x + w - curl} ${y + h - curl} ${x + w - curl} ${y + h}H${x}Z`} fill="white" stroke="#cbd1c5" />
        <PrintDesign x={x} y={y} width={w} height={h} variant="magnet" />
        <path
          d={`M${x + w - curl} ${y + h}Q${x + w - curl * 0.85} ${y + h - curl * 0.35} ${x + w} ${y + h - curl}Q${x + w - curl * 1.35} ${y + h - curl * 1.4} ${x + w - curl} ${y + h}Z`}
          fill="#363c36"
        />
        {gloss && <path d={`M${x + w * 0.5} ${y}H${x + w * 0.72}L${x + w * 0.28} ${y + h}H${x + w * 0.08}Z`} fill="white" opacity=".22" />}
      </g>
    </svg>
  );
}

export function BannerArt({ width = 200, height = 100 }: { width?: number; height?: number }) {
  const ratio = ratioOf(width, height);
  const w = Math.min(300, 290 * ratio);
  const h = w / ratio;
  const x = (370 - w) / 2;
  const y = (340 - h) / 2;
  const m = Math.min(w, h) * 0.06;
  const grommets = [
    [x + m, y + m],
    [x + w / 2, y + m],
    [x + w - m, y + m],
    [x + m, y + h - m],
    [x + w / 2, y + h - m],
    [x + w - m, y + h - m],
  ];
  return (
    <svg className="foam-art" viewBox="0 0 380 400" role="img" aria-label="Vista orientativa de lona impresa Seritene con ollados">
      <ellipse cx="190" cy="345" rx="140" ry="12" fill="#142211" opacity=".08" />
      <g transform="translate(0 5) skewY(-3)">
        <rect x={x + 2} y={y + 3} width={w} height={h} rx="3" fill="#d8ddd2" />
        <rect x={x} y={y} width={w} height={h} rx="3" fill="white" stroke="#cbd1c5" />
        <PrintDesign x={x} y={y} width={w} height={h} variant="banner" />
        <path d={`M${x + w * 0.32} ${y}Q${x + w * 0.4} ${y + h * 0.5} ${x + w * 0.3} ${y + h}`} fill="none" stroke="white" strokeWidth="8" opacity=".16" />
        {grommets.map(([cx, cy], i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r={Math.min(4, m * 0.55)} fill="#e1e5df" stroke="#8b9388" strokeWidth="1.2" />
            <circle cx={cx} cy={cy} r={Math.min(2, m * 0.26)} fill="#72806a" />
          </g>
        ))}
      </g>
    </svg>
  );
}

export function PosterArt({ width = 50, height = 70 }: { width?: number; height?: number }) {
  const ratio = ratioOf(width, height);
  const w = Math.min(300, 290 * ratio);
  const h = w / ratio;
  const x = (380 - w) / 2;
  const y = (350 - h) / 2;
  const fold = Math.min(w, h) * 0.11;
  return (
    <svg className="foam-art" viewBox="0 0 380 400" role="img" aria-label="Vista orientativa de póster en papel con diseño Seritene">
      <ellipse cx="190" cy="350" rx="125" ry="10" fill="#142211" opacity=".07" />
      <g transform="rotate(-3 190 190)">
        <path d={`M${x + 5} ${y + 6}H${x + w + 5}V${y + h - fold + 6}L${x + w - fold + 5} ${y + h + 6}H${x + 5}Z`} fill="#142211" opacity=".09" />
        <path d={`M${x} ${y}H${x + w}V${y + h - fold}L${x + w - fold} ${y + h}H${x}Z`} fill="white" stroke="#cbd1c5" />
        <PrintDesign x={x} y={y} width={w} height={h} variant="poster" />
        <path
          d={`M${x + w - fold} ${y + h}Q${x + w - fold * 0.65} ${y + h - fold * 0.65} ${x + w} ${y + h - fold}H${x + w - fold}Z`}
          fill="#f4f5f1"
          stroke="#bdc5b7"
          strokeWidth=".6"
        />
      </g>
    </svg>
  );
}
