"use client";
import { Minus, Plus } from "lucide-react";
import { useEffect, useId, useState, type KeyboardEvent } from "react";
import { SiteLink } from "../SiteLink";
import { loadRepricer, quantityText, stepQuantity, type QuantityRow, type Repricer, type RepriceUpdate } from "./repricers";
import type { Reprice } from "./reprice";
import { withoutBasePath, type CartItem } from "./storage";

/**
 * Clave de carga del recálculo: la selección sin las cantidades de las filas (que cambian al editar),
 * para no volver a preparar el producto en cada cambio.
 */
const loadKey = (reprice: Reprice | undefined) =>
  reprice ? JSON.stringify(reprice.kind === "merch" ? { ...reprice, rows: reprice.rows.map((r) => r.sku) } : reprice) : "";

type LoadState = { key: string; repricer: Repricer | null };

function useRepricer(item: CartItem) {
  const key = loadKey(item.reprice);
  const [state, setState] = useState<LoadState | null>(null);
  const reprice = item.reprice;
  useEffect(() => {
    if (!reprice) return;
    let alive = true;
    loadRepricer(reprice)
      .catch(() => null)
      .then((repricer) => alive && setState({ key, repricer }));
    return () => {
      alive = false;
    };
    // `reprice` cambia de referencia en cada lectura del carrito; `key` resume lo que importa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  if (!reprice) return { status: "none" as const };
  if (!state || state.key !== key) return { status: "loading" as const };
  return state.repricer ? { status: "ready" as const, repricer: state.repricer } : { status: "none" as const };
}

/** Cantidad sin editar y enlace a la ficha (selecciones antiguas o productos que ya no existen). */
function ReadOnlyQuantity({ item, link }: { item: CartItem; link: boolean }) {
  return (
    <p className="cart-qty-static">
      {item.quantity === null ? "Cantidad y opciones a confirmar" : quantityText(item.quantity)}
      {link && item.quantity !== null && (
        <>
          {" · "}
          <SiteLink href={withoutBasePath(item.path)}>Cambiar en la ficha</SiteLink>
        </>
      )}
    </p>
  );
}

type EditorProps = {
  item: CartItem;
  /** Guarda el cambio (y anuncia el nuevo subtotal). */
  onApply: (update: RepriceUpdate) => void;
  onAnnounce: (text: string) => void;
};

/** Control de cantidad de una selección del carrito (− / campo / +, o desplegable con las cantidades de la ficha). */
export function QuantityEditor({ item, onApply, onAnnounce }: EditorProps) {
  const loaded = useRepricer(item);
  if (loaded.status === "loading") return <ReadOnlyQuantity item={item} link={false} />;
  if (loaded.status === "none") return <ReadOnlyQuantity item={item} link />;
  return <Rows item={item} repricer={loaded.repricer} onApply={onApply} onAnnounce={onAnnounce} />;
}

function Rows({ item, repricer, onApply, onAnnounce }: EditorProps & { repricer: Repricer }) {
  const id = useId();
  const quantities = repricer.quantities(item);
  const stored = quantities.join(",");
  const [drafts, setDrafts] = useState(() => quantities.map(String));
  const [error, setError] = useState<{ row: number; text: string } | null>(null);
  // Si la cantidad cambia (aquí o en otra pestaña), los campos muestran la guardada.
  const [prevStored, setPrevStored] = useState(stored);
  if (prevStored !== stored) {
    setPrevStored(stored);
    setDrafts(quantities.map(String));
  }
  const warnings = repricer.warnings(quantities);
  const many = repricer.rows.length > 1;

  function commit(row: number, value: number) {
    if (value === quantities[row]) {
      setDrafts(quantities.map(String));
      setError(null);
      return;
    }
    const next = quantities.map((q, i) => (i === row ? value : q));
    const problem = repricer.check(next, row);
    if (problem) {
      setDrafts(quantities.map(String));
      setError({ row, text: problem });
      onAnnounce(`No se ha cambiado la cantidad. ${problem}`);
      return;
    }
    setError(null);
    onApply(repricer.apply(next));
  }

  function commitDraft(row: number) {
    const text = drafts[row].trim();
    if (text === String(quantities[row])) return setError((e) => (e?.row === row ? e : null));
    commit(row, text === "" ? NaN : Number(text));
  }

  function renderRow(r: QuantityRow, row: number) {
    const label = r.label ? `Unidades de ${item.name}, ${r.label}` : `Cantidad de ${item.name}`;
    const hintId = `${id}-hint-${row}`;
    const errorId = `${id}-error-${row}`;
    const rowError = error?.row === row ? error.text : "";
    const described = [r.hint ? hintId : "", rowError ? errorId : ""].filter(Boolean).join(" ") || undefined;
    const current = quantities[row];
    const down = stepQuantity(r.control, current, -1);
    const up = stepQuantity(r.control, current, 1);

    return (
      <div className="cart-qty-row" key={row}>
        {r.control.type === "select" ? (
          <label className="cart-qty-select">
            <span className="cart-qty-label">{r.label ?? "Cantidad"}</span>
            <select
              aria-label={label}
              aria-describedby={described}
              value={String(current)}
              onChange={(e) => commit(row, Number(e.target.value))}
            >
              {!r.control.options.some((o) => o.value === current) && (
                <option value={String(current)} disabled>
                  {quantityText(current)}
                </option>
              )}
              {r.control.options.map((o) => (
                <option key={o.value} value={String(o.value)}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="cart-qty-field">
            <span className="cart-qty-label" aria-hidden="true">
              {r.label ?? "Cantidad"}
            </span>
            <div className="cart-qty-stepper">
              <button
                type="button"
                aria-label={`Reducir ${label.charAt(0).toLowerCase()}${label.slice(1)}`}
                disabled={down === null}
                onClick={() => down !== null && commit(row, down)}
              >
                <Minus size={15} aria-hidden="true" />
              </button>
              <input
                type="number"
                inputMode="numeric"
                aria-label={label}
                aria-describedby={described}
                aria-invalid={rowError ? true : undefined}
                min={r.control.min}
                max={r.control.max ?? undefined}
                step={r.control.step}
                value={drafts[row] ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setDrafts((list) => list.map((d, i) => (i === row ? value : d)));
                }}
                onBlur={() => commitDraft(row)}
                onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitDraft(row);
                  } else if (e.key === "Escape") {
                    setDrafts(quantities.map(String));
                    setError(null);
                  } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                    // Las flechas siguen las reglas del producto (mínimos y múltiplos) y aplican el cambio.
                    e.preventDefault();
                    const target = e.key === "ArrowUp" ? up : down;
                    if (target !== null) commit(row, target);
                  }
                }}
              />
              <button
                type="button"
                aria-label={`Aumentar ${label.charAt(0).toLowerCase()}${label.slice(1)}`}
                disabled={up === null}
                onClick={() => up !== null && commit(row, up)}
              >
                <Plus size={15} aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
        {r.hint && (
          <small id={hintId} className="cart-qty-hint">
            {r.hint}
          </small>
        )}
        {rowError && (
          <small id={errorId} className="cart-qty-error">
            {rowError}
          </small>
        )}
        {warnings[row] && <small className="cart-qty-warning">{warnings[row]}</small>}
      </div>
    );
  }

  if (!many) return <div className="cart-qty">{renderRow(repricer.rows[0], 0)}</div>;
  return (
    <fieldset className="cart-qty cart-qty-rows">
      <legend>
        Unidades por talla y color <span>· {quantityText(item.quantity)} en total</span>
      </legend>
      {repricer.rows.map(renderRow)}
    </fieldset>
  );
}
