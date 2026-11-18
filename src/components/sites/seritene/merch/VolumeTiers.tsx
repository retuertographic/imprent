import { formatEuro, type VolumeTier } from "./pricing";

const es = new Intl.NumberFormat("es-ES");

type Props = {
  tiers: VolumeTier[];
  /** Unidades totales del pedido (el tramo en el que caen se resalta). */
  quantity: number | null;
  /** Para qué selección es la tabla («BLANCO · S · 1 marcaje»). */
  detail: string;
};

/** Tabla «Precio por unidad según cantidad» de las fichas de proveedor (mejora propia). */
export function VolumeTiers({ tiers, quantity, detail }: Props) {
  if (!tiers.length) return null;
  return (
    <div className="shop-volume-tiers">
      <table>
        <caption>
          Precio por unidad según cantidad
          <small>{detail}</small>
        </caption>
        <thead>
          <tr>
            <th scope="col">Unidades</th>
            <th scope="col">Precio / ud.</th>
            <th scope="col">Ahorro</th>
          </tr>
        </thead>
        <tbody>
          {tiers.map((t) => {
            const current = quantity !== null && quantity >= t.from && (t.to === null || quantity <= t.to);
            return (
              <tr key={t.from} className={current ? "is-current" : undefined} aria-current={current ? "true" : undefined}>
                <th scope="row">
                  {t.to === null ? `${es.format(t.from)} o más` : t.to === t.from ? es.format(t.from) : `${es.format(t.from)}–${es.format(t.to)}`}
                  {current && <span className="sr-only"> (tu cantidad)</span>}
                </th>
                <td>{formatEuro(t.unitCents)}</td>
                <td>{t.savings > 0 ? `−${t.savings} %` : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="shop-fineprint">
        Precio por unidad con los marcajes elegidos, sin IGIC ni envío. El descuento por cantidad cuenta todas las unidades del pedido.
      </p>
    </div>
  );
}
