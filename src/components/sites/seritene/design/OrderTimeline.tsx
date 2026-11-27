import { ChevronDown } from "lucide-react";
import { logoHint, orderSteps, typicalLeadTime } from "../content";

/**
 * Línea de tiempo del pedido (mejora propia), con los mismos pasos en fichas y carrito (`orderSteps`).
 * - `compact`: plegable de una línea para fichas y configuradores; al abrirla, los pasos en fila.
 * - `full`: bloque «Qué pasa después» del carrito, con el recordatorio de cómo enviar el logo.
 * El plazo solo aparece si `typicalLeadTime` está confirmado.
 */
export function OrderTimeline({ variant = "compact" }: { variant?: "compact" | "full" }) {
  const steps = (
    <ol className="order-timeline-steps">
      {orderSteps.map((step) => (
        <li key={step.title}>
          <strong>{step.title}</strong>
          <span>{step.text}</span>
        </li>
      ))}
    </ol>
  );
  const lead = typicalLeadTime ? <p className="cart-next-lead">Plazo típico: {typicalLeadTime}.</p> : null;

  if (variant === "full") {
    return (
      <section className="cart-next order-timeline-full" aria-labelledby="cart-next-title">
        <h3 id="cart-next-title">Qué pasa después</h3>
        {steps}
        {lead}
        <p className="cart-next-logo">
          <strong>{logoHint.title}:</strong> {logoHint.text}
        </p>
      </section>
    );
  }

  return (
    <details className="order-timeline">
      <summary>
        <span>
          <strong>Cómo sigue tu pedido</strong>
          <small>
            {orderSteps.length} pasos: {orderSteps[0].title.toLocaleLowerCase("es")} → … → {orderSteps.at(-1)?.title.toLocaleLowerCase("es")}
          </small>
        </span>
        <ChevronDown size={18} aria-hidden="true" />
      </summary>
      {steps}
      {lead}
    </details>
  );
}
