import { asset } from "../../content";

export type PrintVariant = "foam" | "magnet" | "banner" | "poster";

type Props = { x: number; y: number; width: number; height: number; variant: PrintVariant };

/** Diseño de ejemplo Seritene dibujado dentro de las vistas orientativas (chunk `print-design`). */
export function PrintDesign({ x, y, width: w, height: h, variant }: Props) {
  const min = Math.min(w, h);
  const font = min * 0.12;
  const logo = asset("/seritene-logo.webp");

  if (variant === "foam") {
    return (
      <g>
        <rect x={x} y={y} width={w} height={h} fill="#f8f6ef" />
        <rect x={x + w * 0.08} y={y + h * 0.1} width={w * 0.12} height={h * 0.025} fill="#43b02a" />
        <text x={x + w * 0.08} y={y + h * 0.32} fontFamily="Arial,sans-serif" fontSize={font} fontWeight="800" fill="#172013">
          IDEAS
        </text>
        <text x={x + w * 0.08} y={y + h * 0.32 + font * 1.15} fontFamily="Arial,sans-serif" fontSize={font} fontWeight="800" fill="#172013">
          CON
        </text>
        <text x={x + w * 0.08} y={y + h * 0.32 + font * 2.3} fontFamily="Arial,sans-serif" fontSize={font} fontWeight="800" fill="#43b02a">
          FORMA.
        </text>
        <rect x={x + w * 0.08} y={y + h * 0.73} width={w * 0.84} height={h * 0.18} fill="#dbe9c9" />
        <rect x={x + w * 0.68} y={y + h * 0.73} width={w * 0.24} height={h * 0.18} fill="#43b02a" />
      </g>
    );
  }

  if (variant === "magnet") {
    return (
      <g>
        <rect x={x} y={y} width={w * 0.035} height={h} fill="#43b02a" />
        <text x={x + w * 0.09} y={y + h * 0.31} fontFamily="Arial,sans-serif" fontSize={min * 0.115} fontWeight="800" fill="#172013">
          TU MARCA,
        </text>
        <text x={x + w * 0.09} y={y + h * 0.49} fontFamily="Arial,sans-serif" fontSize={min * 0.115} fontWeight="800" fill="#172013">
          EN MARCHA.
        </text>
        <path
          d={`M${x + w * 0.7} ${y + h * 0.25}H${x + w * 0.88}V${y + h * 0.43}M${x + w * 0.88} ${y + h * 0.25}L${x + w * 0.7} ${y + h * 0.43}`}
          fill="none"
          stroke="#43b02a"
          strokeWidth={min * 0.035}
        />
        <image
          href={logo}
          x={x + w * 0.09}
          y={y + h * 0.69}
          width={Math.min(w * 0.25, h * 0.45)}
          height={h * 0.18}
          preserveAspectRatio="xMinYMid meet"
        />
      </g>
    );
  }

  if (variant === "banner") {
    const size = Math.min(w * 0.095, h * 0.21);
    return (
      <g>
        <rect x={x} y={y} width={w} height={h} fill="#182414" />
        <rect x={x} y={y} width={w * 0.29} height={h} fill="#eaf0df" />
        <image href={logo} x={x + w * 0.045} y={y + h * 0.42} width={w * 0.2} height={h * 0.16} preserveAspectRatio="xMidYMid meet" />
        <text x={x + w * 0.35} y={y + h * 0.43} fontFamily="Arial,sans-serif" fontSize={size} fontWeight="800" fill="#f6f8ef">
          HAZTE
        </text>
        <text x={x + w * 0.35} y={y + h * 0.7} fontFamily="Arial,sans-serif" fontSize={size} fontWeight="800" fill="#76cb46">
          VER.
        </text>
        <rect x={x + w * 0.35} y={y + h * 0.81} width={w * 0.48} height={h * 0.02} fill="#76cb46" />
      </g>
    );
  }

  return (
    <g>
      <circle cx={x + w * 0.53} cy={y + h * 0.38} r={min * 0.33} fill="#43b02a" />
      <path
        d={`M${x + w * 0.16} ${y + h * 0.56}Q${x + w * 0.5} ${y + h * 0.12} ${x + w * 0.85} ${y + h * 0.29}`}
        fill="none"
        stroke="#192416"
        strokeWidth={min * 0.055}
      />
      <text x={x + w * 0.09} y={y + h * 0.76} fontFamily="Arial,sans-serif" fontSize={min * 0.12} fontWeight="800" fill="#172013">
        DALE VIDA.
      </text>
      <rect x={x + w * 0.09} y={y + h * 0.84} width={w * 0.38} height={h * 0.012} fill="#718263" />
    </g>
  );
}
