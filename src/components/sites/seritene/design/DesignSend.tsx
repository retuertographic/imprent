"use client";

import { useState } from "react";
import { Copy, Mail, MessageCircle, Paperclip, Share2 } from "lucide-react";
import { contact } from "../content";
import { ATTACH_REMINDER, cleanFileName, designEmail, designEmailSubject } from "./designChoice";
import type { DesignState } from "./useDesign";

export const orderWhatsappUrl = (message: string) => `${contact.whatsapp}?text=${encodeURIComponent(message)}`;

/** Se puede compartir el logo con la Web Share API (móvil con soporte de archivos). */
export const canShareLogo = (design: DesignState | null | undefined): design is DesignState & { file: File } =>
  !!design && design.option === "logo" && !!design.file && design.shareable;

/**
 * Comparte el logo y el mensaje con el menú del sistema (el cliente elige WhatsApp). Copia antes el
 * mensaje: algunas apps solo recogen el archivo y así el cliente puede pegar el texto.
 * Devuelve el texto de estado que se anuncia (vacío si el cliente cancela).
 */
export async function shareLogo(file: File, message: string) {
  let copied = false;
  try {
    await navigator.clipboard.writeText(message);
    copied = true;
  } catch {
    copied = false;
  }
  try {
    await navigator.share({ files: [file], text: message });
    return copied ? "Si WhatsApp no muestra el texto del pedido, pégalo en el chat: lo hemos copiado." : "";
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return "";
    return "No se pudo abrir el menú de compartir. Usa «Abrir WhatsApp» y adjunta el logo en el chat.";
  }
}

type ButtonProps = {
  /** Mensaje completo del pedido (con la línea de diseño). */
  message: string;
  design?: DesignState | null;
  icons?: boolean;
  onStatus: (text: string) => void;
};

/**
 * Botón principal del pedido: «Enviar por WhatsApp con el logo» (Web Share con el archivo) si el móvil
 * lo permite; si no, el enlace de WhatsApp con el mensaje ya escrito («Abrir WhatsApp» cuando hay logo
 * que adjuntar, «Solicitar pedido» en el resto).
 */
export function OrderWhatsApp({ message, design, icons = true, onStatus }: ButtonProps) {
  if (canShareLogo(design)) {
    return (
      <button type="button" className="brand-button order-direct order-share" onClick={async () => onStatus(await shareLogo(design.file, message))}>
        {icons && <Share2 size={18} aria-hidden="true" />}
        Enviar por WhatsApp con el logo
      </button>
    );
  }
  return (
    <a className="brand-button order-direct" href={orderWhatsappUrl(message)} target="_blank" rel="noreferrer">
      {icons && <MessageCircle size={18} aria-hidden="true" />}
      {design?.option === "logo" ? "Abrir WhatsApp" : "Solicitar pedido"}
    </a>
  );
}

type NotesProps = {
  message: string;
  /** Nombre del producto (asunto del email). */
  name: string;
  design?: DesignState | null;
  status: string;
  onStatus: (text: string) => void;
};

/** Bajo los botones: recordatorio de adjuntar el logo, «Enviar por email» y avisos del envío. */
export function DesignSendNotes({ message, name, design, status, onStatus }: NotesProps) {
  const [copied, setCopied] = useState(false);
  if (!design || design.option !== "logo") return status ? <p className="order-design-status" role="status">{status}</p> : null;
  const share = canShareLogo(design);
  const email = designEmail(designEmailSubject(name), message, design.choice);
  const fileName = design.file ? cleanFileName(design.file.name) : "";

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      onStatus("Resumen copiado. Pégalo en el email.");
    } catch {
      onStatus("No se pudo copiar el resumen.");
    }
  }

  return (
    <div className="order-design">
      {share ? (
        <p className="order-design-note">
          <Paperclip size={16} aria-hidden="true" />
          <span>
            Elige <strong>WhatsApp</strong> en el menú: <strong>{fileName}</strong> irá adjunto con el mensaje del pedido.{" "}
            <a href={orderWhatsappUrl(message)} target="_blank" rel="noreferrer">
              Abrir WhatsApp sin adjunto
            </a>
          </span>
        </p>
      ) : (
        <p className="order-design-note">
          <Paperclip size={16} aria-hidden="true" />
          <span>
            <strong>{ATTACH_REMINDER}</strong>
            {fileName && <> Archivo: {fileName}.</>}
          </span>
        </p>
      )}
      <div className="order-design-links">
        <a className="order-email" href={email.url}>
          <Mail size={16} aria-hidden="true" />
          Enviar por email
          <span className="sr-only"> a {contact.email} (adjunta tu logo al correo)</span>
        </a>
        {email.isLong && (
          <button type="button" className="order-email" onClick={copy}>
            <Copy size={16} aria-hidden="true" />
            {copied ? "Resumen copiado" : "Copiar resumen"}
          </button>
        )}
      </div>
      {email.isLong && <p className="order-design-small">El resumen es largo para un enlace de correo: cópialo y pégalo en el email.</p>}
      {!share && <p className="order-design-small">En el email, adjunta tu logo antes de enviarlo.</p>}
      <p className="order-design-status" role="status">
        {status}
      </p>
    </div>
  );
}
