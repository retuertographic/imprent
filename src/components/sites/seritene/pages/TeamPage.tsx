"use client";

/* eslint-disable @next/next/no-img-element */
import {
  ArrowDown,
  ArrowUpRight,
  Asterisk,
  Compass,
  Palette,
  PawPrint,
  Plus,
  Printer,
  Scissors,
  type LucideIcon,
} from "lucide-react";
import { useState, type CSSProperties } from "react";
import { asset } from "../content";
import { SiteLink } from "../SiteLink";
import { Breadcrumbs } from "./common";
import { team, teamFilters, type TeamArea, type TeamFilter } from "./team";

const areaIcons: Record<TeamArea, LucideIcon> = {
  Dirección: Compass,
  Diseño: Palette,
  Producción: Printer,
  Confección: Scissors,
};

/** /sobre-nosotros/ — equipo con filtro por área y fichas desplegables. */
export function TeamPage() {
  const [filter, setFilter] = useState<TeamFilter>("Todo el equipo");
  const members = filter === "Todo el equipo" ? team : team.filter((member) => member.area === filter);

  return (
    <main id="contenido" className="brand-main team-page">
      <Breadcrumbs items={[{ label: "Nuestro equipo" }]} />
      <section className="team-hero">
        <div className="wrap team-hero-inner">
          <div>
            <p className="eyebrow">NUESTRO EQUIPO · TENERIFE</p>
            <h1>
              El equipo detrás
              <br />
              <em>de tus proyectos.</em>
            </h1>
            <p className="team-hero-copy">
              Un taller y un equipo que convierten tus ideas en algo que se puede vestir, tocar y llevar.
            </p>
            <a href="#equipo" className="team-meet">
              Ponle nombre a esas manos <ArrowDown size={20} />
            </a>
          </div>
        </div>
      </section>
      <div className="team-ribbon" aria-label="Diseño, impresión, confección y mucho oficio">
        <div className="team-ribbon-track" aria-hidden="true">
          {[0, 1, 2, 3].map((copy) => (
            <span className="team-ribbon-copy" key={copy}>
              DISEÑO <Asterisk /> IMPRESIÓN <Asterisk /> CONFECCIÓN <Asterisk /> MUCHO OFICIO <Asterisk />
            </span>
          ))}
        </div>
      </div>
      <section className="wrap team-section" id="equipo" aria-labelledby="team-heading">
        <div className="team-section-heading">
          <div>
            <p className="eyebrow">DETRÁS DE CADA PEDIDO</p>
            <h2 id="team-heading">
              Gente con <em>mucho oficio.</em>
            </h2>
          </div>
          <p>
            Conoce quién hace qué.
            <br />
            Toca una ficha para descubrir su papel.
          </p>
        </div>
        <div className="team-filters" role="group" aria-label="Filtrar equipo por área">
          {teamFilters.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={filter === option}
              aria-controls="team-grid"
              onClick={() => setFilter(option)}
            >
              {option}
            </button>
          ))}
        </div>
        <p className="team-result" role="status">
          {filter === "Todo el equipo" ? "Todas las áreas" : filter}
        </p>
        <div className="team-grid" id="team-grid">
          {members.map((member, i) => {
            const Icon = member.mascot ? PawPrint : areaIcons[member.area];
            const photoStyle = {
              objectPosition: "50% 50%",
              "--portrait-scale": member.photoScale,
              "--portrait-y": `${member.photoOffsetY}%`,
            } as CSSProperties;
            return (
              <article
                className="team-card"
                key={`${filter}-${member.id}`}
                style={{ "--card-delay": `${(i % 3) * 70}ms` } as CSSProperties}
              >
                <div className={`team-portrait team-portrait-${member.area === "Dirección" ? "dark" : "light"}`}>
                  <img
                    src={asset(member.photo)}
                    alt={member.name}
                    loading="lazy"
                    decoding="async"
                    width={960}
                    height={960}
                    style={photoStyle}
                  />
                  <span className="team-area">
                    <Icon size={14} />
                    {member.mascot ? "Dirección suprema" : member.area}
                  </span>
                  <span className="team-person-quip" aria-hidden="true">
                    {member.line}
                  </span>
                </div>
                <div className="team-card-body">
                  <h3>{member.name}</h3>
                  <p className="team-role">{member.role}</p>
                  <details className="team-details">
                    <summary>
                      <span>Su papel en el equipo</span>
                      <Plus size={18} />
                    </summary>
                    <div>
                      <h4>{member.line}</h4>
                      <p>{member.description}</p>
                    </div>
                  </details>
                </div>
              </article>
            );
          })}
        </div>
      </section>
      <section className="wrap team-outro">
        <span className="team-outro-symbol" aria-hidden="true">
          <Asterisk size="1em" strokeWidth={1.5} />
        </span>
        <div>
          <p className="eyebrow">ESPECIALISTAS EN TEXTIL · TENERIFE</p>
          <h2>
            Tu próximo proyecto.
            <br />
            <em>En buenas manos.</em>
          </h2>
          <p>Diseño, impresión, taller y confección. Un equipo en Tenerife para dar forma a las ideas de toda Canarias.</p>
          <SiteLink href="/contacto/" className="brand-button">
            Cuéntanos tu idea <ArrowUpRight size={20} />
          </SiteLink>
        </div>
      </section>
    </main>
  );
}
