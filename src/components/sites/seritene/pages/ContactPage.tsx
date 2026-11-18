import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { contact, mapsUrl } from "../content";
import { Breadcrumbs, PageIntro } from "./common";
import { ContactForm } from "./ContactForm";

/** /contacto/ */
export function ContactPage() {
  return (
    <main id="contenido" className="brand-main">
      <Breadcrumbs items={[{ label: "Contacto" }]} />
      <PageIntro eyebrow="TODO EMPIEZA CON UNA CONVERSACIÓN" title="¿Qué tienes en mente?">
        Una prenda, un equipo entero o una idea que todavía está tomando forma. Estamos aquí para ayudarte.
      </PageIntro>
      <section className="wrap contact-layout">
        <aside>
          <h2>
            Personas.
            <br />
            Al otro lado.
          </h2>
          <a href={`tel:${contact.phone}`}>
            <Phone size={24} />
            <span>
              <small>Llámanos</small>
              <strong>{contact.displayPhone}</strong>
            </span>
          </a>
          <a href={`mailto:${contact.email}`}>
            <Mail size={24} />
            <span>
              <small>Escríbenos</small>
              <strong>{contact.email}</strong>
            </span>
          </a>
          <a href={contact.whatsapp} target="_blank" rel="noreferrer">
            <MessageCircle size={24} />
            <span>
              <small>Envíanos tu idea</small>
              <strong>WhatsApp</strong>
            </span>
          </a>
          <a className="contact-address" href={mapsUrl} target="_blank" rel="noreferrer">
            <MapPin size={24} />
            <span>
              <small>Dónde estamos</small>
              <address>
                <strong>{contact.address.street}</strong>
                <span>
                  {contact.address.postalCode} {contact.address.locality} · {contact.address.region}
                </span>
              </address>
              <span className="sr-only">(ver en Google Maps)</span>
            </span>
          </a>
          <div className="contact-local">
            <p className="eyebrow">TENERIFE · CANARIAS</p>
            <p>
              Atendemos proyectos en La Orotava, Puerto de la Cruz, Los Realejos y el resto de Tenerife. Consulta las
              opciones de entrega para otras islas.
            </p>
            <a className="text-cta" href={mapsUrl} target="_blank" rel="noreferrer">
              Cómo llegar con Google Maps
            </a>
          </div>
        </aside>
        <ContactForm />
      </section>
    </main>
  );
}
