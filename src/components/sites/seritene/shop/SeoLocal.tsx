import { contact } from "../content";
import { SiteLink } from "../SiteLink";

type Kind = "textil" | "imprenta" | "merchandising";

const kindTitles: Record<Kind, string> = {
  textil: "Ropa personalizada para empresas y equipos en Tenerife",
  imprenta: "Imprenta para negocios y eventos en Tenerife",
  merchandising: "Merchandising para empresas y eventos en Canarias",
};

const kindTexts: Record<Kind, string> = {
  textil:
    "Camisetas, polos, sudaderas y ropa laboral con tu identidad. Elegimos la prenda y el marcaje según el tejido, el diseño y el uso que le dará tu equipo.",
  imprenta:
    "Flyers, tarjetas de visita y folletos con opciones de papel, caras y acabados. Los precios de cada ficha permiten comparar tiradas antes de preparar el pedido.",
  merchandising:
    "Artículos promocionales para comercios, clubes, ferias y celebraciones. Adaptamos el marcaje a la superficie útil del producto para que tu logo se vea claro.",
};

const subjectTexts: Record<string, string> = {
  Camisetas:
    "Camisetas para equipos, comercios y eventos. Para elegir el modelo, cuéntanos el uso, las tallas y si buscas un logo discreto o una impresión grande.",
  Sudaderas:
    "Sudaderas para uniformar a tu equipo o crear una colección. El corte, la capucha y la zona de impresión ayudan a decidir qué modelo encaja con tu diseño.",
  Polos:
    "Polos con tu logo para atención al público, hostelería y equipos. Revisamos tejido, tallas y ubicación del marcaje antes de preparar la propuesta.",
  Pantalones:
    "Pantalones para el trabajo y el día a día. Elige el modelo según el uso y consulta qué zonas admiten tu personalización.",
  Gorras:
    "Gorras con tu logo en el frontal. La ficha propone una ubicación sencilla para evitar tamaños y marcajes que no correspondan al artículo.",
  Bolsas:
    "Bolsas para comercios, eventos y promociones. Compara formato, tejido y asas; si quieres un diseño integral, visita nuestra colección de bolsas fullprint.",
  Tazas:
    "Tazas con tu marca para regalar o utilizar en el negocio. El modelo determina la superficie y la técnica de impresión; revisamos tu diseño antes de producir.",
  Botellas:
    "Botellas para equipos, eventos y regalos de empresa. La forma y el material determinan el marcaje compatible y las instrucciones de cuidado.",
  Libretas:
    "Libretas para formaciones, ferias y detalles de empresa. Elige formato y acabado de la cubierta para adaptar el logo a la zona disponible.",
  Bolígrafos:
    "Bolígrafos promocionales con un marcaje legible. En superficies pequeñas conviene priorizar el logo o un mensaje breve.",
  Llaveros:
    "Llaveros para promociones y regalos de empresa. Las opciones de personalización se ajustan al tamaño del artículo; también tenemos llaveros textiles fullprint.",
  Mochilas:
    "Mochilas para equipar grupos o regalar en eventos. Elige capacidad y distribución de bolsillos antes de concretar la zona del logo.",
  Tecnología:
    "Accesorios tecnológicos para promociones y detalles corporativos. Revisamos la referencia y el material para indicar la personalización compatible.",
  "Ropa deportiva":
    "Prendas para entrenamientos, clubes y eventos deportivos. Para equipaciones con diseño integral, consulta Fullprint y nuestra marca Kroma Sportswear.",
  "Ropa laboral":
    "Prendas para vestir a tu equipo en su actividad diaria. Indica el puesto y el uso; las necesidades de protección requieren comprobar las características de la referencia elegida.",
  "Abrigos y chaquetas":
    "Abrigos y chaquetas para equipos y empresas. La composición y las capas de la prenda condicionan la técnica de personalización.",
};

/** Bloque local (texto + preguntas frecuentes) al final de los listados. */
export function SeoLocal({ kind = "textil", subject }: { kind?: Kind; subject?: string }) {
  return (
    <section className="wrap seo-local">
      <div>
        <p className="eyebrow">SERITENE · TENERIFE Y CANARIAS</p>
        <h2>{subject ? `${subject} con tu logo en Tenerife` : kindTitles[kind]}</h2>
        <p>{(subject && subjectTexts[subject]) || kindTexts[kind]}</p>
        <p>
          Atendemos proyectos de Tenerife y consultas desde el resto de Canarias. Dinos tu municipio o isla y la fecha que
          necesitas para confirmar la entrega.
        </p>
      </div>
      <div>
        <details>
          <summary>¿Qué necesitas para pedir presupuesto?</summary>
          <p>
            Producto, unidades, diseño y fecha. En ropa, añade las tallas; para envíos, indica el destino. Puedes escribirnos
            al {contact.displayPhone} por WhatsApp.
          </p>
        </details>
        <details>
          <summary>¿Cuánto tarda el pedido?</summary>
          <p>
            El plazo depende del producto, la cantidad, la disponibilidad y la aprobación del diseño. Lo confirmamos contigo
            antes de producir; si tienes un evento, indícanos la fecha desde el principio.
          </p>
        </details>
        <details>
          <summary>¿Puedo aportar mi propio diseño?</summary>
          <p>
            Sí. Envíanos un PDF vectorial, SVG, AI o el archivo de mayor calidad que tengas. Revisamos si sirve para el
            soporte elegido. Si necesitas diseño o adaptación, se presupuesta aparte.
          </p>
        </details>
        <SiteLink className="text-cta" href="/contacto/">
          Preparar mi presupuesto
        </SiteLink>
      </div>
    </section>
  );
}
