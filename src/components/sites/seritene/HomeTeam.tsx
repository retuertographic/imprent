/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Asterisk, ChevronLeft, ChevronRight, Pause, Play, Plus } from "lucide-react";
import { asset, ext, team } from "./content";
import { useCarouselEnvironment } from "./useMotionAllowed";

const slotClass = (slot: number) =>
  slot === 0 ? "is-front" : slot === 1 ? "is-second" : slot === 2 ? "is-third" : "is-away";

export function HomeTeam() {
  const sectionRef = useRef<HTMLElement>(null);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const { motionAllowed, inView } = useCarouselEnvironment(sectionRef, 0.15);

  useEffect(() => {
    if (paused || hovered || focused || !inView || !motionAllowed) return;
    const timer = setInterval(() => {
      if (!document.hidden) setCurrent((c) => (c + 1) % team.length);
    }, 1800);
    return () => clearInterval(timer);
  }, [paused, hovered, focused, inView, motionAllowed]);

  const step = (delta: number) => {
    setPaused(true);
    setCurrent((c) => (c + delta + team.length) % team.length);
  };

  return (
    <section ref={sectionRef} className="home-team wrap" aria-labelledby="home-team-title">
      <div className="home-team-copy" data-enter>
        <p className="eyebrow">CONÓCENOS</p>
        <h2 id="home-team-title">
          El equipo detrás
          <br />
          <em>de tus proyectos.</em>
        </h2>
        <p>Diseño, impresión y confección. Ponle cara a quienes hacen realidad tus ideas.</p>
        <p className="home-team-quip">
          Talento de sobra.
          <br />
          Y alguna que otra buena ocurrencia.
        </p>
        <a className="brand-button" href={ext("/sobre-nosotros/")}>
          Conoce al equipo <Plus size={20} aria-hidden="true" />
        </a>
      </div>
      <div
        className="home-team-showcase"
        data-enter
        data-delay="100"
        data-direction="right"
        role="region"
        aria-roledescription="carrusel"
        aria-label="El equipo de Seritene"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) setFocused(false);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            step(-1);
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            step(1);
          }
        }}
      >
        <div className="home-team-deck" data-scrub="deck">
          <span className="home-team-stamp" aria-hidden="true">
            <Asterisk size={24} />
            HECHO
            <br />
            EN EQUIPO
          </span>
          {team.map((member, index) => {
            const slot = (index - current + team.length) % team.length;
            return (
              <a
                key={member.name}
                href={ext("/sobre-nosotros/")}
                className={`home-team-slide ${slotClass(slot)}`}
                tabIndex={slot === 0 ? 0 : -1}
                aria-hidden={slot !== 0}
                aria-label={`Conoce a ${member.name}, ${member.role}`}
                style={{ "--portrait-scale": member.scale, "--portrait-y": member.offsetY } as CSSProperties}
              >
                <div className="home-team-photo">
                  <img
                    src={asset(`/team/${member.photo}.webp`)}
                    alt={member.name}
                    width={960}
                    height={960}
                    loading="lazy"
                    decoding="async"
                    style={{ objectPosition: "50% 50%" }}
                  />
                  <span className="home-team-area">{member.area}</span>
                </div>
                <div className="home-team-person">
                  <div>
                    <h3>{member.name}</h3>
                    <p>{member.role}</p>
                  </div>
                  <Plus size={22} aria-hidden="true" />
                </div>
              </a>
            );
          })}
        </div>
        <div className="home-team-controls">
          <button type="button" aria-label="Persona anterior" onClick={() => step(-1)}>
            <ChevronLeft size={20} />
          </button>
          <p aria-live={paused ? "polite" : "off"}>{team[current].name}</p>
          {motionAllowed && (
            <button
              type="button"
              aria-label={paused ? "Reanudar tarjetas" : "Pausar tarjetas"}
              aria-pressed={paused}
              onClick={() => setPaused((p) => !p)}
            >
              {paused ? <Play size={16} /> : <Pause size={16} />}
            </button>
          )}
          <button type="button" aria-label="Siguiente persona" onClick={() => step(1)}>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}
