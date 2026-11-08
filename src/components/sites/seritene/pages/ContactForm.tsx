"use client";

import { Check } from "lucide-react";
import { useState, type FormEvent } from "react";
import { contact } from "../content";
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

/** Formulario de contacto: prepara el mensaje y lo abre en WhatsApp (no se envía nada a un servidor). */
export function ContactForm() {
  const [link, setLink] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const get = (name: string) => String(data.get(name) ?? "");
    const message =
      `Hola, soy ${get("name")}${get("company") ? ` de ${get("company")}` : ""}. Me interesa ${get("service")}.\n` +
      `Cantidad orientativa: ${get("quantity") || "por definir"}.\n` +
      `Destino: ${get("destination")}.\n` +
      get("message");
    setLink(`${contact.whatsapp}?text=${encodeURIComponent(message)}`);
  }

  return (
    <form className="contact-form" onSubmit={onSubmit} onChange={() => setLink("")}>
      <h2>Cuéntanos la idea.</h2>
      <p>Prepara tu consulta y revísala en WhatsApp antes de enviarla.</p>
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
        presupuesto. Al abrir WhatsApp, el texto pasa a ese servicio para que lo revises antes de enviarlo. Puedes ejercer
        tus derechos por correo y consultar los detalles en la{" "}
        <SiteLink href="/politica-privacidad/">política de privacidad</SiteLink>.
      </p>
      <button className="brand-button" type="submit">
        Preparar mi consulta
      </button>
      {link && (
        <div className="contact-ready" role="status">
          <Check />
          <div>
            <strong>Tu consulta está lista.</strong>
            <p>Aún no se ha enviado. Ábrela, revísala y envíala desde WhatsApp.</p>
            <a className="brand-button light" href={link} target="_blank" rel="noreferrer">
              Revisar en WhatsApp
            </a>
          </div>
        </div>
      )}
    </form>
  );
}
