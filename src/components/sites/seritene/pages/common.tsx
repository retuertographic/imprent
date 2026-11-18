import { Plus } from "lucide-react";
import { Fragment, type ReactNode } from "react";
import { SiteLink } from "../SiteLink";

export type Crumb = { label: string; href?: string; /** Sin aria-current (como en las fichas de catálogo). */ plain?: boolean };

/** Miga de pan de las páginas interiores: Inicio / … / página actual. */
export function Breadcrumbs({ items, className = "wrap breadcrumbs" }: { items: Crumb[]; className?: string }) {
  const last = items.length - 1;
  return (
    <nav className={className} aria-label="Ruta de navegación">
      <SiteLink href="/">Inicio</SiteLink>
      {items.map((item, i) => (
        <Fragment key={item.label}>
          <span>/</span>
          {item.href ? (
            <SiteLink href={item.href}>{item.label}</SiteLink>
          ) : (
            <span aria-current={i === last && !item.plain ? "page" : undefined}>{item.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}

/**
 * Cabecera de página: antetítulo, título y entradilla. Con `h1`, ese texto descriptivo es el H1 (con el
 * aspecto del antetítulo) y `title` pasa a ser un lema con el aspecto del antiguo H1.
 */
export function PageIntro({
  eyebrow,
  h1,
  title,
  children,
}: {
  eyebrow?: string;
  h1?: string;
  title: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="wrap page-intro">
      {h1 ? (
        <>
          <h1 className="eyebrow kw-kicker">{h1}</h1>
          <p className="kw-slogan">{title}</p>
        </>
      ) : (
        <>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
        </>
      )}
      <p>{children}</p>
    </section>
  );
}

export type Faq = { q: string; a: ReactNode };

/** Bloque «Lo que nos preguntan» con acordeones nativos. */
export function FaqSection({ faqs }: { faqs: Faq[] }) {
  return (
    <section className="wrap section-pad faq-section">
      <div>
        <p className="eyebrow">LO QUE NOS PREGUNTAN</p>
        <h2>
          Todo un
          <br />
          poco más claro.
        </h2>
      </div>
      <div>
        {faqs.map((faq) => (
          <details key={faq.q}>
            <summary>
              {faq.q}
              <Plus size={18} />
            </summary>
            <p>{faq.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/** Convierte un texto con saltos «\n» en líneas separadas por <br />. */
export function Lines({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {line}
        </Fragment>
      ))}
    </>
  );
}

export const pad2 = (n: number) => String(n).padStart(2, "0");
