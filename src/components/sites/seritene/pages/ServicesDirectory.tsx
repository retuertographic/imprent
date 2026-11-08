import { Plus } from "lucide-react";
import { SiteLink } from "../SiteLink";
import { Breadcrumbs, PageIntro, pad2 } from "./common";
import { RevealObserver } from "./RevealObserver";

const directory = [
  {
    href: "/textil-personalizado/",
    name: "Textil personalizado",
    text: "Camisetas, polos, sudaderas y ropa de trabajo con la personalidad de tu empresa, equipo o evento. En Seritene te acompañamos desde la elección de la prenda hasta el acabado.",
    tags: ["Camisetas", "Polos", "Sudaderas"],
  },
  {
    href: "/fullprint/",
    name: "Camisetas fullprint y sublimación",
    text: "Diseña más allá del pecho. La impresión fullprint integra colores, gráficos y patrocinadores en toda la superficie de la prenda, con fabricación propia en Tenerife.",
    tags: ["Equipaciones deportivas", "Camisetas de eventos", "Ropa para clubes"],
  },
  {
    href: "/merchandising/",
    name: "Merchandising y regalos personalizados",
    text: "Tazas, botellas, bolsas, libretas y regalos promocionales para que tu marca siga presente después de un evento. El soporte y el acabado se eligen juntos.",
    tags: ["Tazas y botellas", "Libretas", "Llaveros"],
  },
  {
    href: "/rotulacion/",
    name: "Rotulación, lonas y cartelería",
    text: "Soportes para que tu negocio o evento gane presencia: lonas, banderas, vinilos y cartelería con una imagen coherente.",
    tags: ["Lonas", "Banderas", "Vinilos"],
  },
  {
    href: "/diseno-grafico/",
    name: "Diseño gráfico e identidad visual",
    text: "Damos forma a la identidad visual de tu proyecto y la adaptamos para que funcione sobre prendas, productos y soportes publicitarios.",
    tags: ["Identidad visual", "Adaptación de logotipos", "Diseño textil"],
  },
  {
    href: "/imprenta/",
    name: "Imprenta y tarjetas de visita",
    text: "Tarjetas de visita y papelería con tu identidad. Cuéntanos el formato, las unidades y la fecha: preparamos una propuesta para tu proyecto.",
    tags: ["Tarjetas de visita", "Papelería", "Diseño para impresión"],
  },
  {
    href: "/ropa-laboral/",
    name: "Ropa laboral personalizada",
    text: "Pantalones multibolsillos y prendas para el día a día de tu equipo. Elegimos la referencia y el marcaje según el uso y la composición.",
    tags: ["Pantalones multibolsillos", "Prendas de trabajo", "Logos y personalización"],
  },
  {
    href: "/banderas-rollups/",
    name: "Soportes publicitarios personalizados",
    text: "Banderas y roll-ups personalizados para tu negocio, feria o evento en Tenerife y Canarias. Tu diseño, en un soporte que se hace notar.",
    tags: ["Banderas publicitarias", "Roll-ups", "Ferias y eventos"],
  },
  {
    href: "/dtf-x-metros/",
    name: "DTF x metros",
    label: "DTF",
    text: "Monta tus diseños en planchas de 57 cm con nuestro estudio online. Ajusta medidas, crea semitonos y descarga tu PNG transparente para enviárnoslo.",
    tags: ["Montador online", "Semitonos", "PNG a 300 ppp"],
  },
];

/** /servicios/ */
export function ServicesDirectory() {
  return (
    <main id="contenido" className="brand-main">
      <Breadcrumbs items={[{ label: "Servicios" }]} />
      <PageIntro eyebrow="UN MISMO EQUIPO. MUCHAS POSIBILIDADES." title="De la idea, a todas partes.">
        El textil es nuestro punto de partida. El diseño, la impresión y los productos promocionales completan una
        identidad que se reconoce en cada soporte.
      </PageIntro>
      <section className="wrap services-directory">
        {directory.map((service, i) => (
          <SiteLink key={service.href} className="service-directory-row reveal" href={service.href}>
            <span>{service.label ?? pad2(i + 1)}</span>
            <div>
              <h2>{service.name}</h2>
              <p>{service.text}</p>
              <div>
                {service.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </div>
            <Plus size={30} />
          </SiteLink>
        ))}
      </section>
      <RevealObserver />
    </main>
  );
}
