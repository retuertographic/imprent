"use client";

import { Check, Mail, MessageCircle } from "lucide-react";
import { useState, type FormEvent } from "react";
import { MAILTO_MAX, contact, mailtoUrl } from "../content";
import { SiteLink } from "../SiteLink";

const services = [
  "Textil personalizado",
  "Fullprint / equipaciones",
  "Merchandising",
  "Rotulación y cartelería",
  "Diseño gráfico",
  "Imprenta / tarjetas de visita",
  "Ropa laboral",
  "Soportes publicitarios",
  "Necesito asesoramiento",
];

type Prepared = { whatsapp: string; email: string; emailShort: boolean; message: string };

const EMAIL_SHORT_TEXT = "Hola Seritene, os escribo con una consulta. Pego el detalle a continuación:\n\n";

/**
 * Formulario de contacto: prepara el mensaje y lo abre en WhatsApp o en el correo
 * (no se envía nada a un servidor; la opción de email es una mejora propia).
 */
export function ContactForm() {
  const [prepared, setPrepared] = useState<Prepared | null>(null);
  const [copied, setCopied] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const get = (name: string) => String(data.get(name) ?? "");
    const message =
      `Hola, soy ${get("name")}${get("company") ? ` de ${get("company")}` : ""}. Me interesa ${get("service")}.\n` +
      `Cantidad orientativa: ${get("quantity") || "por definir"}.\n` +
      `Destino: ${get("destination")}.\n` +
      get("message");
    const subject = `Consulta web: ${get("service")}`;
    const email = mailtoUrl(subject, message);
    const emailShort = email.length > MAILTO_MAX;
    setPrepared({
      whatsapp: `${contact.whatsapp}?text=${encodeURIComponent(message)}`,
      email: emailShort ? mailtoUrl(subject, EMAIL_SHORT_TEXT) : email,
      emailShort,
      message,
    });
    setCopied("");
  }

  async function copy(message: string) {
    try {
      await navigator.clipboard.writeText(message);
      setCopied("Texto copiado. Pégalo en el correo.");
    } catch {
      setCopied("No se pudo copiar. Selecciona el texto de tu consulta y cópialo a mano.");
    }
  }

  return (
    <form className="contact-form" onSubmit={onSubmit} onChange={() => setPrepared(null)}>
      <h2>Cuéntanos la idea.</h2>
      <p>Prepara tu consulta y revísala en WhatsApp o en tu correo antes de enviarla.</p>
      <div className="form-grid">
        <label>
          Tu nombre
          <input name="name" autoComplete="name" required maxLength={100} />
        </label>
        <label>
          Empresa o club <span>(opcional)</span>
          <input name="company" autoComplete="organization" maxLength={120} />
        </label>
        <label>
          ¿Qué necesitas?
          <select name="service">
            {services.map((service) => (
              <option key={service}>{service}</option>
            ))}
          </select>
        </label>
        <label>
          Unidades aproximadas
          <input name="quantity" type="number" min="1" max="1000000" placeholder="Por definir" />
        </label>
      </div>
      <label>
        Municipio o isla de entrega
        <input name="destination" required placeholder="Por ejemplo: La Orotava, Tenerife" maxLength={150} />
      </label>
      <label>
        Cuéntanos un poco más
        <textarea
          name="message"
          rows={4}
          required
          maxLength={2000}
          placeholder="Prendas, colores, zonas de marcaje, fecha en la que lo necesitas…"
        />
      </label>
      <p className="form-note">
        Responsable: José Enrique Ferrera Torres (Seritene). Usamos tu consulta para atender la solicitud y preparar el
        presupuesto. Al abrir WhatsApp o tu correo, el texto pasa a ese servicio para que lo revises antes de enviarlo. Puedes ejercer
        tus derechos por correo y consultar los detalles en la{" "}
        <SiteLink href="/politica-privacidad/">política de privacidad</SiteLink>.
      </p>
      <button className="brand-button" type="submit">
        Preparar mi consulta
      </button>
      {prepared && (
        <div className="contact-ready" role="status">
          <Check />
          <div>
            <strong>Tu consulta está lista.</strong>
            <p>Aún no se ha enviado. Ábrela en WhatsApp o en tu correo, revísala y envíala.</p>
            <div className="contact-ready-actions">
              <a className="brand-button light" href={prepared.whatsapp} target="_blank" rel="noreferrer">
                <MessageCircle size={17} aria-hidden="true" />
                Revisar en WhatsApp
              </a>
              <a className="contact-ready-email" href={prepared.email}>
                <Mail size={17} aria-hidden="true" />
                Enviar por email
              </a>
            </div>
            {prepared.emailShort && (
              <p className="contact-ready-note">
                Tu consulta es larga para abrirla entera en el correo.{" "}
                <button type="button" onClick={() => copy(prepared.message)}>
                  Copia el texto
                </button>{" "}
                y pégalo en el mensaje. {copied}
              </p>
            )}
          </div>
        </div>
      )}
    </form>
  );
}
