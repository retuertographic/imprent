/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { asset, contact, ext, whatsappLinks } from "./content";

const explore: [string, string][] = [
  ["Ropa personalizada", "/ropa/"],
  ["Técnicas textiles", "/textil-personalizado/"],
  ["Fullprint", "/fullprint/"],
  ["DTF x metros", "/dtf-x-metros/"],
  ["Imprenta", "/imprenta/"],
  ["Soportes publicitarios", "/soportes-publicitarios/"],
  ["Productos y configurador", "/productos/"],
  ["Merchandising", "/merchandising/"],
  ["Eventos y premios", "/eventos/"],
  ["Todos los servicios", "/servicios/"],
];

const company: [string, string][] = [
  ["Nuestro equipo", "/sobre-nosotros/"],
  ["Nuestros valores", "/nuestros-valores/"],
  ["Catálogos", "/catalogos/"],
  ["Ideas y guías", "/blog/"],
  ["Contacto", "/contacto/"],
];

export function SiteFooter() {
  return (
    <>
      <footer className="brand-footer">
        <div className="wrap footer-grid">
          <div>
            <Link href="/" className="footer-original-logo" aria-label="Seritene, inicio">
              <img
                src={asset("/seritene-original-white.png")}
                alt="Seritene · Creaciones Publicitarias"
                width={714}
                height={500}
                loading="lazy"
              />
            </Link>
            <p>
              Textil, ideas y mucho oficio.
              <br />
              Desde Tenerife, para Canarias.
            </p>
            <a href={contact.instagram} target="_blank" rel="noreferrer">
              Instagram
            </a>
          </div>
          <div>
            <strong>Explora</strong>
            {explore.map(([name, href]) => (
              <a key={href} href={ext(href)} className={href === "/dtf-x-metros/" ? "dtf-nav-link" : undefined}>
                {name}
              </a>
            ))}
          </div>
          <div>
            <strong>Seritene</strong>
            {company.map(([name, href]) => (
              <a key={href} href={ext(href)}>
                {name}
              </a>
            ))}
          </div>
          <div>
            <strong>Hablemos</strong>
            <a href={`tel:${contact.phone}`}>{contact.displayPhone}</a>
            <a href={`mailto:${contact.email}`}>{contact.email}</a>
            <span>Tenerife · Islas Canarias</span>
            <a href={contact.whatsapp} target="_blank" rel="noreferrer">
              Escríbenos por WhatsApp
            </a>
          </div>
        </div>
        <div className="wrap footer-bottom">
          <span>© {new Date().getFullYear()} Seritene</span>
          <div>
            <a href={ext("/aviso-legal/")}>Aviso legal</a>
            <a href={ext("/politica-privacidad/")}>Privacidad</a>
            <a href={ext("/mapa-web/")}>Mapa web</a>
          </div>
        </div>
      </footer>
      <a
        className="seritene-chat-float"
        href={whatsappLinks.order}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Hablar con Seritene por WhatsApp (se abre en otra pestaña)"
      >
        <img src={asset("/whatsapp-white.svg")} width={28} height={28} alt="" aria-hidden="true" />
      </a>
      <a
        className="seribot-float"
        href={ext("/encuentra-tu-producto/")}
        aria-label="Seribot: abre el asistente para encontrar tu producto"
        title="Encuentra lo que necesitas en cuatro preguntas"
      >
        <img src={asset("/seribot-floating.webp")} alt="" aria-hidden="true" width={88} height={88} />
        <span>¿Te ayudo?</span>
      </a>
    </>
  );
}
