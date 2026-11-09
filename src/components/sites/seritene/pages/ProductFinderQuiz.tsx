"use client";

import {
  Check,
  ChevronLeft,
  Flag,
  Gift,
  MessageCircle,
  Plus,
  Printer,
  RotateCcw,
  Shirt,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { contact } from "../content";
import { SiteLink } from "../SiteLink";
import { quizSteps, recommend, summarize, type QuizAnswers, type QuizKind } from "./quizData";

const kindIcons: Record<QuizKind, LucideIcon> = { clothing: Shirt, gifts: Gift, print: Printer, display: Flag };
const rankLabels = ["Por aquí empezaríamos", "Otra buena opción", "También puede encajar"];

/** Test de cuatro preguntas con recomendaciones y consulta por WhatsApp. */
export function ProductFinderQuiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const headingRef = useRef<HTMLHeadingElement>(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) headingRef.current?.focus();
    else mounted.current = true;
  }, [step]);

  const done = step === quizSteps.length;
  const current = quizSteps[Math.min(step, quizSteps.length - 1)];
  const selected = answers[current.id];
  const results = recommend(answers);
  const summary = summarize(answers);
  const message = [
    "Hola, he hecho el test de Seritene y me gustaría que me ayudaseis con mi idea.",
    ...summary.map((item) => `${item.question} ${item.answer}`),
    "Opciones que me ha sugerido: " + results.map((item) => item.name).join(", ") + ".",
  ].join("\n");

  const restart = () => {
    setAnswers({});
    setStep(0);
  };

  return (
    <main id="contenido" className="brand-main finder-quiz">
      <div className="wrap">
        <nav className="finder-crumb" aria-label="Ruta de navegación">
          <SiteLink href="/">Inicio</SiteLink>
          <span>/</span>
          <span>Encuentra tu producto</span>
        </nav>
        <div className="finder-frame">
          <div className="finder-top">
            <span>
              <Sparkles size={19} aria-hidden="true" /> UNA IDEA. MIL POSIBILIDADES.
            </span>
            <span>{done ? "Tus recomendaciones" : `${step + 1} / ${quizSteps.length}`}</span>
          </div>
          <div
            className="finder-progress"
            role="progressbar"
            aria-label="Progreso del test"
            aria-valuemin={0}
            aria-valuemax={4}
            aria-valuenow={done ? 4 : step}
          >
            <span style={{ width: `${done ? 100 : step * 25}%` }} />
          </div>
          {done ? (
            <>
              <p className="finder-intro">Con lo que nos has contado…</p>
              <h1 ref={headingRef} tabIndex={-1}>
                Estas ideas <em>van contigo.</em>
              </h1>
              <div className="finder-summary">
                {summary.map((item) => (
                  <span key={item.question}>{item.answer}</span>
                ))}
              </div>
              <div className="finder-results">
                {results.map((item, i) => {
                  const Icon = kindIcons[item.kind];
                  return (
                    <SiteLink className="finder-result-card" href={item.href} key={item.id}>
                      <div className="finder-result-top">
                        <Icon size={30} aria-hidden="true" />
                        <span>{rankLabels[i]}</span>
                      </div>
                      <h2>{item.name}</h2>
                      <p>{item.reason}</p>
                      <strong>
                        Ver opciones y precios <Plus size={18} />
                      </strong>
                    </SiteLink>
                  );
                })}
              </div>
              <p className="finder-result-note">
                Elige una opción para ver los modelos y configurar tu pedido. El precio y la disponibilidad se consultan en
                cada ficha.
              </p>
              {answers.format === "print" && ["few", "small", "medium"].includes(answers.quantity || "") && (
                <p className="finder-quantity-note">
                  Las tiradas de imprenta varían por producto. Para la cantidad que has indicado, consúltanos antes de
                  elegir una tirada.
                </p>
              )}
              {answers.quantity === "few" && answers.format !== "print" && (
                <p className="finder-quantity-note">
                  Para personalizaciones de 1 a 4 unidades, te confirmamos el precio del marcaje al consultar.
                </p>
              )}
              <div className="finder-human">
                <div>
                  <h2>¿Lo vemos juntos?</h2>
                  <p>Envíanos tus respuestas y terminamos de darle forma.</p>
                </div>
                <a
                  className="brand-button"
                  href={`${contact.whatsapp}?text=${encodeURIComponent(message)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle size={20} />
                  Consultar mi idea
                </a>
              </div>
              <div className="finder-navigation">
                <button className="finder-back" type="button" onClick={() => setStep(0)}>
                  <ChevronLeft size={18} />
                  Cambiar respuestas
                </button>
                <button className="finder-back" type="button" onClick={restart}>
                  <RotateCcw size={16} />
                  Empezar de nuevo
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="finder-intro">Cuatro preguntas para encontrar por dónde empezar.</p>
              <h1 ref={headingRef} tabIndex={-1}>
                {current.title}
              </h1>
              <div className="finder-options-grid" role="group" aria-label={current.title}>
                {current.options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={selected === option.id}
                    onClick={() => setAnswers((prev) => ({ ...prev, [current.id]: option.id }))}
                  >
                    <span>
                      <strong>{option.label}</strong>
                      <small>{option.detail}</small>
                    </span>
                    <span className="finder-choice-mark" aria-hidden="true">
                      {selected === option.id ? <Check size={19} /> : <Plus size={19} />}
                    </span>
                  </button>
                ))}
              </div>
              <div className="finder-navigation">
                <button className="finder-back" type="button" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
                  <ChevronLeft size={18} />
                  Volver
                </button>
                <button className="brand-button" type="button" disabled={!selected} onClick={() => setStep((s) => s + 1)}>
                  {step === 3 ? "Ver mis opciones" : "Continuar"}
                  <Plus size={18} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
