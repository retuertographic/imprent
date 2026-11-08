"use client";

import { Plus, Sparkles } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { SiteLink } from "../SiteLink";

const techniques = [
  {
    name: "DTF",
    title: "Todo el color de tu idea.",
    body: "Diseños a todo color sobre prendas compatibles. Ideal para explorar distintas zonas y tamaños de marcaje.",
    detail: "Camisetas · Sudaderas · Bolsas textiles",
  },
  {
    name: "Serigrafía",
    title: "La fuerza de la tinta.",
    body: "Un acabado pensado para series. Los colores del diseño y la cantidad definen la preparación y el coste.",
    detail: "Textil promocional · Eventos · Equipos",
  },
  {
    name: "Bordado",
    title: "Identidad que se siente.",
    body: "El relieve del hilo aporta textura a tu logo. Adaptamos el dibujo y el tamaño a la prenda elegida.",
    detail: "Polos · Sudaderas · Gorras",
  },
  {
    name: "Sublimación",
    title: "El diseño forma parte del tejido.",
    body: "Gráficos integrados en tejidos compatibles. La base del fullprint para llevar tu diseño por toda la prenda.",
    detail: "Prendas de poliéster · Fullprint · Equipaciones",
  },
];

/** Pestañas «Tu idea tiene su técnica» (con navegación por teclado). */
export function TechniqueExplorer() {
  const [active, setActive] = useState(0);
  const current = techniques[active];

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const count = techniques.length;
    let next: number;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % count;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index + count - 1) % count;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = count - 1;
    else return;
    event.preventDefault();
    setActive(next);
    document.getElementById(`tech-tab-${next}`)?.focus();
  };

  return (
    <section className="technique-section wrap section-pad reveal">
      <div className="section-heading">
        <div>
          <p className="eyebrow">EL ACABADO LO CAMBIA TODO</p>
          <h2>
            Tu idea tiene
            <br />
            su técnica.
          </h2>
        </div>
        <p>
          Explora cómo podemos llevarla a la prenda.
          <br />
          Te ayudamos a elegir la opción adecuada.
        </p>
      </div>
      <div className="technique-layout">
        <div className="technique-tabs" role="tablist" aria-label="Técnicas de personalización">
          {techniques.map((technique, i) => (
            <button
              key={technique.name}
              role="tab"
              id={`tech-tab-${i}`}
              aria-controls="tech-panel"
              aria-selected={i === active}
              tabIndex={i === active ? 0 : -1}
              onKeyDown={(event) => onKeyDown(event, i)}
              onClick={() => setActive(i)}
            >
              <span>0{i + 1}</span>
              {technique.name}
              <Plus size={20} />
            </button>
          ))}
        </div>
        <div className="technique-panel" id="tech-panel" role="tabpanel" aria-labelledby={`tech-tab-${active}`} key={active}>
          <span className="tech-big" aria-hidden="true">
            0{active + 1}
          </span>
          <Sparkles size={34} />
          <h3>{current.title}</h3>
          <p>{current.body}</p>
          <span className="tech-detail">{current.detail}</span>
          <SiteLink href="/contacto/" className="text-cta">
            Consultar este acabado
          </SiteLink>
        </div>
      </div>
    </section>
  );
}
