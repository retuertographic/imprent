"use client";
/* eslint-disable @next/next/no-img-element */
import { Pause, Play } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { asset } from "../content";
import type { FullprintExample } from "./types";

const small = (src: string) => src.replace(/\.webp$/, "-small.webp");

type Props = {
  slug: string;
  /** Nombre para la etiqueta accesible. */
  name: string;
  example: FullprintExample;
  priority?: boolean;
  compact?: boolean;
  controls?: boolean;
};

/** Animación «de blanco a fullprint»: producto en blanco detrás y ejemplo impreso delante. */
export function FullprintTransformation({ slug, name, example, priority = false, compact = false, controls = false }: Props) {
  const [paused, setPaused] = useState(false);
  const keychains = slug === "llaveros";
  const style = {
    "--fp-accent": example.accent,
    "--fp-secondary": example.secondary,
    "--fp-ink": example.ink,
  } as CSSProperties;
  const image = (
    <img
      src={asset(example.image)}
      srcSet={`${asset(small(example.image))} 768w, ${asset(example.image)} 1536w`}
      sizes={compact ? "(max-width:900px) 55vw, 30vw" : "(max-width:760px) 100vw, 680px"}
      width={1536}
      height={1024}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      alt=""
    />
  );

  return (
    <div
      className={`fp-transform${compact ? " fp-transform--compact" : ""}`}
      data-paused={paused}
      data-shape={example.shape}
      style={style}
    >
      <div
        className="fp-transform-square"
        role="img"
        aria-label={
          keychains
            ? "Llaveros: modelo corto blanco con anilla y modelo largo fullprint con mosquetón. Cintas sin costuras laterales."
            : `${name}: producto en blanco detrás y ejemplo fullprint ${example.name} delante. Diseño ficticio para ${example.use}.`
        }
      >
        <div className="fp-transform-brand" aria-hidden="true">
          SERITENE<span>DISEÑA SIN LÍMITES</span>
        </div>
        <div className="fp-transform-item fp-transform-blank" aria-hidden="true">
          {image}
        </div>
        <div className="fp-transform-item fp-transform-printed" aria-hidden="true">
          {image}
        </div>
        {keychains && (
          <div className="fp-keychain-pair" aria-hidden="true">
            {image}
          </div>
        )}
        <svg className="fp-transform-arrows" viewBox="0 0 600 600" aria-hidden="true">
          <path className="fp-transform-flow" d="M208 99 C225 47 320 48 365 95" />
          <path d="M350 94 L368 99 L366 80" />
          <path className="fp-transform-flow" d="M139 487 C177 532 254 548 306 522" />
          <path d="M292 516 L310 520 L302 538" />
          <path className="fp-transform-orbit" d="M546 331 C575 358 573 410 548 431" />
        </svg>
        <span className="fp-transform-spark fp-transform-spark-a" aria-hidden="true" />
        <span className="fp-transform-spark fp-transform-spark-b" aria-hidden="true" />
        <span className="fp-transform-spark fp-transform-spark-c" aria-hidden="true" />
        <div className="fp-transform-label fp-transform-label-before" aria-hidden="true">
          {keychains ? "CORTO · ANILLA" : "EN BLANCO"}
        </div>
        <div className="fp-transform-label fp-transform-label-after" aria-hidden="true">
          {keychains ? "LARGO · MOSQUETÓN" : "TU DISEÑO · FULLPRINT"}
          <small>{example.name}</small>
        </div>
        <div className="fp-transform-swatches" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
      </div>
      {controls && (
        <button
          className="fp-transform-pause"
          type="button"
          aria-label={paused ? "Animar ejemplo fullprint" : "Pausar ejemplo fullprint"}
          aria-pressed={paused}
          onClick={() => setPaused((p) => !p)}
        >
          {paused ? <Play size={14} /> : <Pause size={14} />}
          <span>{paused ? "Animar" : "Pausar"}</span>
        </button>
      )}
    </div>
  );
}

export const exampleSmallImage = small;
