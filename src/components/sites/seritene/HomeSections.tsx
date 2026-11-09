/* eslint-disable @next/next/no-img-element */
import {
  Asterisk,
  Building2,
  Check,
  Gift,
  MapPin,
  MessageCircle,
  PartyPopper,
  Play,
  Plus,
  Search,
  Trophy,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import { asset, contact, faqs, proofs, reels, services, whatsappLinks } from "./content";
import { SiteLink } from "./SiteLink";

function InstagramIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

const pad = (n: number) => String(n).padStart(2, "0");

export function ServicesSection() {
  return (
    <section className="edit-section edit-services" id="que-hacemos" aria-labelledby="services-title">
      <div className="edit-wrap">
        <div className="edit-section-head">
          <p className="edit-eyebrow" data-enter>
            ELIGE DÓNDE DEJAR HUELLA
          </p>
          <h2 id="services-title" data-enter data-delay="50">
            Descubre todo lo que
            <br />
            <em>podemos personalizar.</em>
          </h2>
          <p className="edit-lead" data-enter data-delay="100">
            Textil es lo nuestro. Personalizarlo todo, también.
          </p>
        </div>
        <div className="edit-service-grid">
          {services.map((service, i) => {
            const src = asset(`/optimized/${service.image}-720.webp`);
            return (
              <SiteLink
                key={service.name}
                href={service.href}
                className={`edit-service edit-service-${i}`}
                data-enter
                data-delay={String((i % 3) * 90)}
              >
                <span className="edit-service-index">{pad(i + 1)}</span>
                {service.label && <span className="edit-service-label">{service.label}</span>}
                <div className="edit-service-art" data-scrub="product">
                  <img
                    src={src}
                    srcSet={`${asset(`/optimized/${service.image}-360.webp`)} 360w, ${src} 720w`}
                    sizes="(max-width:600px) 44vw, 30vw"
                    alt=""
                    width={300}
                    height={340}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="edit-service-name">
                  <h3>{service.name}</h3>
                  <Plus size={17} />
                </div>
                <p>{service.text}</p>
              </SiteLink>
            );
          })}
        </div>
        <p className="edit-local-line" data-enter>
          <MapPin size={14} />
          Serigrafía y sublimación en Tenerife. Personalización para toda Canarias.
        </p>
      </div>
    </section>
  );
}

export function BrandSection() {
  const src = asset("/optimized/mockup-merchandising-720.webp");
  return (
    <section className="edit-brand" id="como-pedir" aria-labelledby="brand-message-title">
      <div className="edit-wrap edit-brand-layout">
        <div className="edit-brand-copy" data-enter>
          <p className="edit-eyebrow">TU IDEA, PASO A PASO</p>
          <h2 id="brand-message-title">
            De tu idea
            <br />a <em>tus manos.</em>
          </h2>
          <div className="edit-actions">
            <SiteLink className="edit-button" href={"/productos/"}>
              <Search size={18} />
              Elige tu producto
            </SiteLink>
            <a className="edit-text-link" href={whatsappLinks.idea} target="_blank" rel="noopener noreferrer">
              Tengo una idea
              <MessageCircle size={18} />
            </a>
          </div>
        </div>
        <div className="edit-brand-art" data-enter data-direction="right">
          <div data-scrub="hero-object">
            <img
              src={src}
              srcSet={`${asset("/optimized/mockup-merchandising-360.webp")} 360w, ${src} 720w`}
              sizes="(max-width:600px) 90vw, 42vw"
              alt="Bolsa de Seritene: tu logo hasta en la sopa"
              width={500}
              height={580}
              loading="lazy"
              decoding="async"
            />
          </div>
          <span className="edit-brand-sticker">
            <Asterisk size={34} />
            CERO
            <br />
            ABURRIMIENTO
          </span>
        </div>
      </div>
    </section>
  );
}

export function ConfidenceSection() {
  return (
    <section className="edit-confidence confidence-motion" aria-labelledby="confidence-title" data-scrub="confidence">
      <div className="edit-wrap">
        <div className="edit-confidence-heading" data-enter data-direction="left">
          <p className="edit-eyebrow">MUCHO OFICIO. CERO HUMO.</p>
          <h2 id="confidence-title">
            Las buenas ideas
            <br />
            <em>se fabrican aquí.</em>
          </h2>
          <div className="confidence-seal" aria-hidden="true">
            <Asterisk size={28} />
            <span>
              HECHO EN
              <br />
              TENERIFE
            </span>
          </div>
        </div>
        <div className="edit-confidence-body">
          <div className="edit-experience" data-enter data-delay="40">
            <div className="experience-orbit">
              <strong>
                +35<span>años</span>
              </strong>
              <p>
                de experiencia
                <br />
                personalizando ideas.
              </p>
              <span className="experience-orbit-mark" aria-hidden="true">
                <Plus size={24} />
              </span>
            </div>
          </div>
          <div className="edit-proof-list">
            {proofs.map((proof, i) => (
              <div
                key={proof}
                className="proof-entry"
                data-enter
                data-direction={i % 2 === 0 ? "left" : "right"}
                data-delay={String(i * 40)}
              >
                <p>
                  <span className="proof-index" aria-hidden="true">
                    {pad(i + 1)}
                  </span>
                  <span>{proof}</span>
                  <Check size={16} />
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const audiences: { title: string; text: string; href: string; Icon: LucideIcon }[] = [
  { title: "Empresas", text: "Uniformes, ropa laboral y merchandising.", href: "/ropa-laboral/", Icon: Building2 },
  { title: "Clubes", text: "Equipaciones y deporte personalizado.", href: "/fullprint/", Icon: Trophy },
  { title: "Eventos", text: "Abanicos, lanyards y pulseras.", href: "/merchandising/", Icon: PartyPopper },
  { title: "Particulares", text: "Regalos que hablan de ti.", href: "/productos/", Icon: Gift },
];

export function AudiencesSection() {
  return (
    <section className="edit-section audience-studio audience-motion" aria-labelledby="audiences-title" data-scrub="audiences">
      <div className="edit-wrap">
        <div className="edit-section-head" data-enter>
          <p className="edit-eyebrow">TU IDEA EN BUENAS MANOS</p>
          <h2 id="audiences-title">
            Para quiénes <em>trabajamos.</em>
          </h2>
        </div>
        <div className="audience-studio-grid">
          {audiences.map(({ title, text, href, Icon }, i) => (
            <div
              key={title}
              className="audience-entry"
              data-enter
              data-direction={i % 2 === 0 ? "left" : "right"}
              data-delay={String(i * 65)}
            >
              <SiteLink className="audience-studio-card" href={href}>
                <span className="audience-symbol">
                  <Icon className="audience-icon" size={34} strokeWidth={1.35} aria-hidden="true" />
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
                <Plus className="audience-plus" size={18} aria-hidden="true" />
              </SiteLink>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SocialSection() {
  return (
    <section className="home-social" id="en-el-taller" aria-labelledby="home-social-title">
      <div className="wrap social-layout">
        <div className="social-copy" data-enter>
          <p className="eyebrow">
            <InstagramIcon size={16} />
            DENTRO DEL TALLER
          </p>
          <h2 id="home-social-title">
            Dale al play.
            <br />
            <em>Así lo hacemos.</em>
          </h2>
          <p>Nos manchamos, nos reímos y hacemos cosas muy guapas.</p>
          <a className="social-follow" href={contact.instagram} target="_blank" rel="noopener noreferrer">
            <InstagramIcon size={19} />
            Ver todos en Instagram
          </a>
          <span>@seritenefabricadeideas</span>
        </div>
        <div className="social-reels" data-enter data-delay="100" aria-label="Reels de Seritene en Instagram">
          {reels.map((reel) => (
            <a
              key={reel.id}
              className="social-reel"
              data-scrub="reel"
              href={`${contact.instagram}reel/${reel.id}/`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Ver reel: ${reel.title} (se abre en Instagram)`}
            >
              <div className="social-reel-image">
                <img
                  src={asset(`/reels/${reel.id}.jpg`)}
                  alt={reel.alt}
                  width={600}
                  height={900}
                  loading="lazy"
                  decoding="async"
                  style={{ objectPosition: "50% 50%" }}
                />
                <span className="social-reel-brand">
                  <InstagramIcon size={17} />
                </span>
                <span className="social-reel-play">
                  <Play size={21} fill="currentColor" strokeWidth={1.5} aria-hidden="true" />
                </span>
                <span className="social-reel-label">Ver reel</span>
              </div>
              <strong>{reel.title}</strong>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HelpSection() {
  return (
    <div className="edit-wrap edit-extra-help" data-enter>
      <details className="edit-help-disclosure">
        <summary>
          <span>¿Te queda alguna duda?</span>
          <span>
            Resolvemos las más habituales
            <Plus size={18} />
          </span>
        </summary>
        <section className="home-help" aria-labelledby="home-help-title">
          <div className="wrap home-help-layout">
            <div className="home-help-copy">
              <p className="eyebrow">DUDAS PEQUEÑAS. IDEAS GRANDES.</p>
              <h2 id="home-help-title">
                Antes del
                <br />
                <em>«lo quiero».</em>
              </h2>
              <p>
                Textil personalizado, fullprint, merchandising e imprenta desde Tenerife, para tus proyectos en
                Canarias.
              </p>
              <span>Lo que suele preguntarnos todo el mundo.</span>
              <a href={whatsappLinks.doubt} target="_blank" rel="noopener noreferrer">
                Mi duda es otra <ArrowUpRight size={18} />
              </a>
            </div>
            <div className="home-help-questions">
              {faqs.map((faq, i) => (
                <details key={faq.q} name="home-order-questions">
                  <summary>
                    <span className="home-help-number">{pad(i + 1)}</span>
                    <span>{faq.q}</span>
                    <Plus size={19} />
                  </summary>
                  <div className="home-help-answer">
                    <p>{faq.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
        <a className="edit-help-other" href={whatsappLinks.idea} target="_blank" rel="noopener noreferrer">
          Mi duda es otra
          <MessageCircle size={16} />
        </a>
      </details>
    </div>
  );
}

export function FinalSection() {
  return (
    <section className="edit-final" aria-labelledby="home-final-title">
      <div className="edit-wrap">
        <div data-enter>
          <p className="edit-eyebrow">NOS GUSTAN LAS BUENAS IDEAS. Y LAS LOCAS.</p>
          <h2 id="home-final-title">
            ¿Lo hacemos
            <br />
            <em>tuyo?</em>
          </h2>
        </div>
        <div className="edit-final-actions" data-enter data-delay="80">
          <SiteLink className="edit-button" href={"/productos/"}>
            <Search size={17} />
            Buscar productos
          </SiteLink>
          <a className="edit-button edit-button-outline" href={whatsappLinks.idea} target="_blank" rel="noopener noreferrer">
            <MessageCircle size={17} />
            Hablar por WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
