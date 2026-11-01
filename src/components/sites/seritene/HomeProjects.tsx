/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { ChevronLeft, ChevronRight, Expand, MessageCircle, Pause, Play, X } from "lucide-react";
import { asset, contact, projects } from "./content";
import { useCarouselEnvironment } from "./useMotionAllowed";

const slides = projects.filter((project) => !project.presentation);

export function HomeProjects() {
  const sectionRef = useRef<HTMLElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const touchStartRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [keyboardFocus, setKeyboardFocus] = useState(false);
  const { motionAllowed, pageVisible, inView } = useCarouselEnvironment(sectionRef, 0.2);

  const current = ((step % slides.length) + slides.length) % slides.length;
  const active = slides[current];
  const visibleSlides = slides
    .map((item, index) => {
      let offset = (index - current + slides.length) % slides.length;
      if (offset > slides.length / 2) offset -= slides.length;
      return { item, offset };
    })
    .filter(({ offset }) => Math.abs(offset) <= 2);

  const openIndex = projects.findIndex((project) => project.id === openId);
  const opened = openIndex >= 0 ? projects[openIndex] : undefined;

  useEffect(() => {
    if (paused || keyboardFocus || !inView || !motionAllowed || !pageVisible || openId) return;
    const timer = setInterval(() => setStep((s) => s + 1), 2500);
    return () => clearInterval(timer);
  }, [paused, keyboardFocus, inView, motionAllowed, pageVisible, openId]);

  const move = (delta: number) => setStep((s) => s + delta);
  const moveLightbox = (delta: number) =>
    setOpenId(projects[(openIndex + delta + projects.length) % projects.length].id);

  return (
    <section
      ref={sectionRef}
      className="home-projects"
      id="trabajos"
      aria-labelledby="home-projects-title"
      data-motion={motionAllowed}
      data-visible={inView}
    >
      <div className="wrap work-compact-layout">
        <div className="work-compact-copy" data-enter>
          <p className="eyebrow">TRABAJOS REALES</p>
          <h2 id="home-projects-title">
            Del taller.
            <br />
            <em>A la calle.</em>
          </h2>
          <p>Textil, detalles y marcas que ya tienen vida fuera de aquí.</p>
          <button
            type="button"
            className="work-browse"
            onClick={(event) => {
              returnFocusRef.current = event.currentTarget;
              setOpenId(active.id);
            }}
          >
            <Expand size={17} />
            Ver todos los trabajos
          </button>
        </div>
        <div
          className="work-depth-carousel"
          role="region"
          aria-roledescription="carrusel"
          aria-label="Trabajos reales de Seritene"
          onFocusCapture={(event) => setKeyboardFocus((event.target as HTMLElement).matches(":focus-visible"))}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node)) setKeyboardFocus(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              move(-1);
            }
            if (event.key === "ArrowRight") {
              event.preventDefault();
              move(1);
            }
          }}
        >
          <div
            className="work-depth-stage"
            onTouchStart={(event) => {
              touchStartRef.current = event.touches[0].clientX;
            }}
            onTouchEnd={(event) => {
              if (touchStartRef.current === null) return;
              const dx = event.changedTouches[0].clientX - touchStartRef.current;
              if (Math.abs(dx) > 45) move(dx > 0 ? -1 : 1);
              touchStartRef.current = null;
            }}
          >
            {visibleSlides.map(({ item, offset }) => (
              <button
                key={item.id}
                type="button"
                className="work-depth-slide"
                data-position={offset}
                tabIndex={offset === 0 ? 0 : -1}
                disabled={offset !== 0}
                aria-hidden={offset !== 0}
                aria-label={`Ampliar: ${item.title}`}
                onClick={(event) => {
                  returnFocusRef.current = event.currentTarget;
                  setOpenId(item.id);
                }}
              >
                <img
                  src={asset(`/trabajos/proyecto-${item.id}-thumb.webp`)}
                  alt={offset === 0 ? item.description : ""}
                  loading="lazy"
                  decoding="async"
                  style={{ objectPosition: item.position }}
                />
                <span aria-hidden="true">
                  <Expand size={17} />
                </span>
              </button>
            ))}
          </div>
          <div className="work-depth-caption">
            <strong>{active.title}</strong>
            <span>
              {String(current + 1).padStart(2, "0")} / {slides.length}
            </span>
          </div>
          <div className="work-collage-controls">
            <span>{motionAllowed && !paused ? "Un vistazo a nuestro taller" : "Hecho en Seritene"}</span>
            <div>
              <button type="button" aria-label="Trabajo anterior" onClick={() => move(-1)}>
                <ChevronLeft size={18} />
              </button>
              {motionAllowed && (
                <button
                  type="button"
                  aria-label={paused ? "Reanudar fotos automáticas" : "Pausar fotos automáticas"}
                  aria-pressed={paused}
                  onClick={() => {
                    setPaused((p) => !p);
                    setKeyboardFocus(false);
                  }}
                >
                  {paused ? <Play size={14} /> : <Pause size={14} />}
                </button>
              )}
              <button type="button" aria-label="Trabajo siguiente" onClick={() => move(1)}>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <Dialog.Root
        open={Boolean(opened)}
        onOpenChange={(open) => {
          if (!open) setOpenId(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="work-lightbox-backdrop" />
          <Dialog.Popup
            className="work-lightbox"
            finalFocus={returnFocusRef}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft") {
                event.preventDefault();
                moveLightbox(-1);
              }
              if (event.key === "ArrowRight") {
                event.preventDefault();
                moveLightbox(1);
              }
            }}
          >
            {opened && (
              <>
                <div className="work-lightbox-top">
                  <span>
                    {opened.presentation ? "PRESENTACIÓN DIGITAL" : opened.category.toLocaleUpperCase("es")}
                    <i />
                    {openIndex + 1} / {projects.length}
                  </span>
                  <Dialog.Close className="work-close" aria-label="Cerrar fotografía">
                    <X size={23} />
                  </Dialog.Close>
                </div>
                <div className="work-lightbox-photo">
                  <img key={opened.id} src={asset(`/trabajos/proyecto-${opened.id}-full.webp`)} alt={opened.description} />
                </div>
                <div className="work-lightbox-bottom">
                  <div>
                    <Dialog.Title>{opened.title}</Dialog.Title>
                    <Dialog.Description>{opened.description}</Dialog.Description>
                  </div>
                  <a
                    className="work-enquire"
                    href={`${contact.whatsapp}?text=${encodeURIComponent(
                      `Hola Seritene, he visto en vuestra galería «${opened.title}» (proyecto ${opened.id}) y me gustaría consultar algo parecido.`,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle size={18} />
                    Quiero algo así
                  </a>
                </div>
                <div className="work-lightbox-nav">
                  <button type="button" onClick={() => moveLightbox(-1)} aria-label="Fotografía anterior">
                    <ChevronLeft size={22} />
                  </button>
                  <span>Explora los detalles.</span>
                  <button type="button" onClick={() => moveLightbox(1)} aria-label="Fotografía siguiente">
                    <ChevronRight size={22} />
                  </button>
                </div>
              </>
            )}
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
