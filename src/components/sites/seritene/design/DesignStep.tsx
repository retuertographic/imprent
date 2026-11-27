"use client";
/* eslint-disable @next/next/no-img-element */

import { useId, useRef, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, FileImage, FileText, Info, PenTool, Upload, X } from "lucide-react";
import {
  DESIGN_ACCEPT,
  DESIGN_OPTIONS,
  KIND_LABEL,
  cleanFileName,
  designTips,
  formatBytes,
  type DesignFileInfo,
  type MockupZone,
  type PrintSize,
} from "./designChoice";
import type { DesignState } from "./useDesign";

type Props = {
  design: DesignState;
  /** Tamaño de impresión conocido (formato, tamaño máximo del marcaje) para avisar de resolución baja. */
  printSize?: PrintSize | null;
  /** Vista previa orientativa del logo sobre la foto del producto. */
  mockup?: { src: string; zone: MockupZone } | null;
  /** Texto bajo «Necesito que me lo diseñéis» (por defecto, que se presupuesta aparte). */
  serviceNote?: string;
  /** Archivo elegido antes en una ficha (el carrito no puede recuperarlo: hay que volver a elegirlo). */
  remembered?: DesignFileInfo | null;
  /** Título del grupo (legend). */
  title?: ReactNode;
  className?: string;
};

const TONE_ICON = { ok: CheckCircle2, warn: AlertTriangle, info: Info };

/**
 * Paso «Tu diseño» (mejora propia): «Ya tengo mi logo» / «Necesito que me lo diseñéis» / «Solo tengo
 * una idea». Con logo, el cliente elige su archivo, que se lee en el navegador (no se sube a ningún
 * sitio) para mostrar miniatura y consejos; luego lo envía él por WhatsApp o email (ver `DesignSend`).
 */
export function DesignStep({ design, printSize, mockup, serviceNote, remembered, title = "Tu diseño", className = "" }: Props) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const { option, setOption, file, analysis, previewUrl, reading, selectFile } = design;
  const tips = analysis ? designTips(analysis, printSize) : [];
  const showMockup = mockup && previewUrl && analysis && (analysis.kind === "raster" || analysis.kind === "svg") && !analysis.unreadable;

  return (
    <fieldset className={`design-step ${className}`.trim()}>
      <legend>{title}</legend>
      <div className="design-step-options">
        {DESIGN_OPTIONS.map((o) => (
          <label key={o.value} className={`design-step-option${option === o.value ? " is-selected" : ""}`}>
            <input
              type="radio"
              name={`${id}-option`}
              value={o.value}
              checked={option === o.value}
              onChange={() => setOption(o.value)}
            />
            <span>
              <strong>{o.label}</strong>
              <small>{o.value === "service" && serviceNote ? serviceNote : o.hint}</small>
            </span>
          </label>
        ))}
      </div>

      {option === "logo" && (
        <div className="design-step-file">
          <input
            ref={inputRef}
            id={`${id}-file`}
            className="design-step-input"
            type="file"
            accept={DESIGN_ACCEPT}
            aria-describedby={`${id}-file-hint`}
            onChange={(e) => selectFile(e.target.files?.[0] ?? null)}
          />
          <label htmlFor={`${id}-file`} className="design-step-pick">
            <Upload size={18} aria-hidden="true" />
            <span>{file ? "Cambiar archivo" : "Elegir mi logo"}</span>
            <small>(opcional)</small>
          </label>
          <p id={`${id}-file-hint`} className="design-step-hint">
            PNG, JPG, PDF, SVG, AI o EPS. <strong>No se sube a ningún sitio:</strong> lo revisamos aquí, en tu navegador, y
            luego nos lo envías tú por WhatsApp o email.
          </p>
          {!file && remembered && (
            <p className="design-step-hint">
              En la ficha elegiste <strong>{cleanFileName(remembered.name)}</strong>. Vuelve a seleccionarlo para enviarlo con el
              pedido.
            </p>
          )}

          <div className="design-step-status" aria-live="polite" aria-atomic="false">
            {reading && <p role="status">Leyendo el archivo…</p>}
            {file && analysis && (
              <div className="design-step-preview">
                {previewUrl && !analysis.unreadable ? (
                  <img src={previewUrl} alt={`Miniatura de ${cleanFileName(file.name)}`} />
                ) : (
                  <span className="design-step-icon" aria-hidden="true">
                    {analysis.kind === "vector" ? <PenTool size={28} /> : analysis.kind === "pdf" ? <FileText size={28} /> : <FileImage size={28} />}
                  </span>
                )}
                <dl>
                  <dt className="sr-only">Archivo</dt>
                  <dd className="design-step-name">{cleanFileName(file.name)}</dd>
                  <dt className="sr-only">Datos</dt>
                  <dd>
                    {[
                      KIND_LABEL[analysis.kind],
                      file.type || null,
                      formatBytes(file.size),
                      analysis.width && analysis.height ? `${analysis.width}×${analysis.height} px` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </dd>
                </dl>
                <button
                  type="button"
                  className="design-step-remove"
                  onClick={() => {
                    selectFile(null);
                    if (inputRef.current) {
                      inputRef.current.value = "";
                      inputRef.current.focus();
                    }
                  }}
                >
                  <X size={15} aria-hidden="true" /> Quitar<span className="sr-only"> archivo</span>
                </button>
              </div>
            )}
            {tips.length > 0 && (
              <ul className="design-step-tips" aria-label="Consejos sobre tu archivo">
                {tips.map((tip) => {
                  const Icon = TONE_ICON[tip.tone];
                  return (
                    <li key={tip.text} className={`is-${tip.tone}`}>
                      <Icon size={16} aria-hidden="true" />
                      <span>
                        {tip.tone === "warn" && <span className="sr-only">Aviso: </span>}
                        {tip.text}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {showMockup && (
            <figure className="design-step-mockup">
              <div className="design-step-mockup-frame">
                <img src={mockup.src} alt="" referrerPolicy="no-referrer" />
                <img
                  className="design-step-mockup-logo"
                  src={previewUrl}
                  alt=""
                  style={{ left: `${mockup.zone.left}%`, top: `${mockup.zone.top}%`, width: `${mockup.zone.width}%` }}
                />
              </div>
              <figcaption>
                <strong>Vista orientativa.</strong> La posición y el tamaño reales los confirmamos en la prueba.
              </figcaption>
            </figure>
          )}
        </div>
      )}

      {option === "service" && (
        <p className="design-step-note">Cuéntanos qué necesitas al enviar el pedido. Te presupuestamos el diseño aparte antes de empezar.</p>
      )}
      {option === "idea" && (
        <p className="design-step-note">
          Explícanos tu idea al enviar el pedido; si tienes bocetos o fotos de referencia, adjúntalos. Te orientamos y, si hace falta
          diseño, te lo presupuestamos aparte.
        </p>
      )}
    </fieldset>
  );
}
