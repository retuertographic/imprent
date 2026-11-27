/** Contenidos de las páginas de servicio (/textil-personalizado/, /rotulacion/, …). */
import type { WorkCategory } from "../content";

export type ServicePageData = {
  path: string;
  crumb: string;
  metaTitle: string;
  metaDescription: string;
  /** H1 descriptivo con la palabra clave (se muestra con el aspecto del antetítulo). */
  h1: string;
  /** Lema: se muestra con el aspecto del antiguo H1, como párrafo. */
  title: [string, string];
  intro: string;
  dark?: boolean;
  image: { src: string; alt: string; productMockup?: boolean };
  tags: string[];
  storyEyebrow: string;
  storyCta: { label: string; href: string };
  story: { title: string; text: string }[];
  techniques?: boolean;
  faqs: { q: string; a: string }[];
  related: { label: string; href: string }[];
  /** Categoría del bloque «Trabajos reales» (solo si hay fotos reales de esa categoría). */
  works?: WorkCategory;
};

const related = {
  textil: { label: "Textil personalizado", href: "/textil-personalizado/" },
  fullprint: { label: "Camisetas fullprint y sublimación", href: "/fullprint/" },
  merch: { label: "Merchandising y regalos personalizados", href: "/merchandising/" },
  rotulacion: { label: "Rotulación, lonas y cartelería", href: "/rotulacion/" },
};

const contactCta = { label: "Cuéntanos tu idea", href: "/contacto/" };
const mockupAlt = "Mockups ilustrativos de prendas personalizadas";

export const textilPage: ServicePageData = {
  path: "/textil-personalizado/",
  works: "textil",
  crumb: "Textil personalizado",
  metaTitle: "Textil personalizado en Tenerife",
  metaDescription:
    "Camisetas, polos, sudaderas y ropa de trabajo con la personalidad de tu empresa, equipo o evento. En Seritene te acompañamos desde la elección de la prenda hasta el acabado.",
  h1: "Textil personalizado en Tenerife",
  title: ["No es solo ropa.", "Es tu identidad."],
  intro:
    "Camisetas, polos, sudaderas y ropa de trabajo con la personalidad de tu empresa, equipo o evento. En Seritene te acompañamos desde la elección de la prenda hasta el acabado.",
  image: { src: "/seritene-hero-textile.webp", alt: mockupAlt },
  tags: ["Camisetas", "Polos", "Sudaderas", "Ropa laboral", "Gorras", "Bolsas textiles"],
  storyEyebrow: "TEXTIL PERSONALIZADO EN TENERIFE",
  storyCta: { label: "Ver ropa personalizada", href: "/ropa/" },
  story: [
    {
      title: "Una prenda para cada propósito.",
      text: "Un uniforme que se usa todos los días no necesita lo mismo que una camiseta para un evento. Te ayudamos a elegir el tejido, el corte y el gramaje teniendo en cuenta el uso, el presupuesto y el diseño.",
    },
    {
      title: "El acabado también habla de ti.",
      text: "Trabajamos con serigrafía, DTF, bordado, vinilo textil y sublimación. Revisamos la composición y la zona de personalización para recomendar una técnica adecuada a cada prenda.",
    },
    {
      title: "De Tenerife a tu equipo.",
      text: "Trabajamos con empresas, clubes, asociaciones y particulares de Tenerife y Canarias. Reúne cantidades, tallas y colores y cuéntanos dónde y cuándo necesitas el pedido para valorar su producción y entrega.",
    },
  ],
  techniques: true,
  faqs: [
    {
      q: "¿Qué necesito para pedir presupuesto?",
      a: "El tipo de prenda, las unidades, los colores y tallas, tu diseño y las zonas de marcaje. Si aún no lo tienes claro, cuéntanos el uso que le vas a dar y te asesoramos.",
    },
    {
      q: "¿Puedo personalizar pecho, espalda y mangas?",
      a: "Sí. Cada zona se valora por separado según el tamaño y la técnica. Confirmamos antes la superficie disponible en la prenda elegida.",
    },
    {
      q: "¿Hay una cantidad mínima?",
      a: "Depende de la prenda y de la técnica. Cuéntanos cuántas unidades necesitas y valoramos la opción. El configurador de ejemplo permite probar de 1 a 1.000 unidades.",
    },
  ],
  related: [related.fullprint, related.merch, related.rotulacion],
};

export const rotulacionPage: ServicePageData = {
  path: "/rotulacion/",
  works: "soportes",
  crumb: "Rotulación, lonas y cartelería",
  metaTitle: "Rotulación, lonas y cartelería en Tenerife",
  metaDescription:
    "Rotulación de vehículos, vinilos para escaparates, lonas, banderas y cartelería en Tenerife para que tu negocio o evento gane presencia con una imagen coherente.",
  h1: "Rotulación de vehículos, escaparates y lonas en Tenerife",
  title: ["Que te vean.", "Que te recuerden."],
  intro:
    "Soportes para que tu negocio o evento gane presencia: rotulación de vehículos, vinilos para escaparates, lonas, banderas y cartelería con una imagen coherente.",
  dark: true,
  image: { src: "/seritene-hero-dark.webp", alt: mockupAlt },
  tags: ["Vehículos", "Escaparates", "Lonas", "Banderas", "Vinilos", "Cartelería", "Expositores"],
  storyEyebrow: "ROTULACIÓN, LONAS Y CARTELERÍA EN TENERIFE",
  storyCta: contactCta,
  story: [
    {
      title: "Rotulación de vehículos.",
      text: "Tu furgoneta o tu coche de empresa también es publicidad: se mueve contigo y lo ven cada día. Cuéntanos el modelo, las zonas que quieres rotular y si ya tienes el diseño. Revisamos la superficie y preparamos una propuesta que respete las formas del vehículo y se lea en movimiento.",
    },
    {
      title: "Escaparates y vinilo.",
      text: "El escaparate es lo primero que ve quien pasa por delante. Con vinilo puedes mostrar tu logo, el horario, una promoción o una decoración de temporada. Indícanos las medidas del cristal y qué quieres comunicar, y valoramos el vinilo y la colocación más adecuados.",
    },
    {
      title: "Lonas para fachadas, vallas y eventos.",
      text: "Una lona impresa funciona en fachadas, vallas, ferias y eventos al aire libre. Puedes calcular el precio de una lona con ollados a tu medida en la sección de soportes publicitarios o pedirnos ayuda para elegir el formato.",
    },
    {
      title: "Rótulos y cartelería para tu negocio.",
      text: "Rótulos para el local, carteles y señalética interior. Antes de producir revisamos la medida, la distancia de lectura y el lugar de colocación para que el mensaje se entienda.",
    },
    {
      title: "La medida empieza por el lugar.",
      text: "Cuéntanos dónde se colocará la pieza, las dimensiones disponibles y si estará en interior o exterior. Con esos datos valoramos material, formato y acabado.",
    },
    {
      title: "Legible a la distancia correcta.",
      text: "Adaptamos la composición al soporte: un cartel visto de cerca y una lona no se diseñan igual. Jerarquía, contraste y tamaño de letra ayudan a que el mensaje se entienda.",
    },
    {
      title: "Parte de una identidad completa.",
      text: "La señalética, el textil del equipo y el material promocional pueden compartir una misma línea visual. Así tu marca se reconoce en distintos soportes.",
    },
  ],
  faqs: [
    {
      q: "¿Qué medidas tengo que enviar?",
      a: "Ancho y alto de la superficie y, si puedes, una foto del lugar. Indica también si necesitas orientación sobre colocación.",
    },
    {
      q: "¿Qué necesitáis para rotular un vehículo?",
      a: "El modelo del vehículo, las zonas que quieres rotular (laterales, trasera, capó…) y fotos de cada lado. Si ya tienes logo o diseño, envíalo también y lo adaptamos a las formas del vehículo.",
    },
    {
      q: "¿Puedo encargar solo el diseño o la impresión?",
      a: "Cuéntanos qué parte tienes resuelta y qué necesitas. Revisaremos los archivos antes de valorar el trabajo.",
    },
  ],
  related: [related.textil, related.fullprint, related.merch],
};

export const disenoPage: ServicePageData = {
  path: "/diseno-grafico/",
  crumb: "Diseño gráfico e identidad visual",
  metaTitle: "Diseño gráfico e identidad visual en Tenerife",
  metaDescription:
    "Damos forma a la identidad visual de tu proyecto y la adaptamos para que funcione sobre prendas, productos y soportes publicitarios.",
  h1: "Diseño gráfico e identidad visual en Tenerife",
  title: ["Una idea clara.", "Una marca propia."],
  intro:
    "Damos forma a la identidad visual de tu proyecto y la adaptamos para que funcione sobre prendas, productos y soportes publicitarios.",
  image: { src: "/seritene-hero-textile.webp", alt: mockupAlt },
  tags: ["Identidad visual", "Adaptación de logotipos", "Diseño textil", "Artes para impresión"],
  storyEyebrow: "DISEÑO GRÁFICO E IDENTIDAD VISUAL EN TENERIFE",
  storyCta: contactCta,
  story: [
    {
      title: "Del concepto al soporte.",
      text: "El punto de partida es entender qué representa tu marca y dónde se verá. Diseñamos teniendo en cuenta la aplicación final, no solo la pantalla.",
    },
    {
      title: "Archivos preparados para producir.",
      text: "Revisamos resolución, proporciones y colores. Si dispones de tu logo en formato vectorial, envíalo para conservar la mejor definición posible.",
    },
    {
      title: "Revisar antes de imprimir.",
      text: "Concretamos la propuesta, las ubicaciones y los tamaños antes de pasar a producción. El diseño gráfico se valora según el alcance del trabajo.",
    },
  ],
  faqs: [
    {
      q: "¿En qué formato envío mi logo?",
      a: "Preferimos PDF vectorial, SVG, AI o EPS. Si solo tienes una imagen, envíanos la de mayor resolución para revisarla.",
    },
    {
      q: "¿El diseño está incluido en el marcaje?",
      a: "No debe darse por incluido. Su coste depende de si el archivo está listo para imprimir o requiere creación y adaptación.",
    },
  ],
  related: [related.textil, related.fullprint, related.merch],
};

export const banderasPage: ServicePageData = {
  path: "/banderas-rollups/",
  works: "soportes",
  crumb: "Soportes publicitarios personalizados",
  metaTitle: "Soportes publicitarios personalizados en Tenerife",
  metaDescription:
    "Banderas y roll-ups personalizados para tu negocio, feria o evento en Tenerife y Canarias. Tu diseño, en un soporte que se hace notar.",
  h1: "Banderas y roll-ups personalizados en Tenerife",
  title: ["Que te vean.", "Desde lejos."],
  intro:
    "Banderas y roll-ups personalizados para tu negocio, feria o evento en Tenerife y Canarias. Tu diseño, en un soporte que se hace notar.",
  image: { src: "/mockup-banderas.webp", alt: "Bandera publicitaria personalizada de Seritene", productMockup: true },
  tags: ["Banderas publicitarias", "Roll-ups", "Ferias y eventos", "Diseño personalizado"],
  storyEyebrow: "SOPORTES PUBLICITARIOS PERSONALIZADOS EN TENERIFE",
  storyCta: contactCta,
  story: [
    {
      title: "Un formato para cada espacio.",
      text: "Cuéntanos dónde lo vas a colocar, si será en interior o exterior y qué espacio tienes. Te orientamos sobre el formato, las medidas y la base adecuados para tu proyecto.",
    },
    {
      title: "Tu mensaje, a lo grande.",
      text: "Adaptamos el logo y el diseño al soporte para que se lean con claridad. Envíanos las unidades y la fecha del evento para preparar una propuesta.",
    },
  ],
  faqs: [
    {
      q: "¿Puedo enviar mi propio diseño?",
      a: "Sí. Envíanos tu archivo y revisamos proporciones y resolución según las medidas del soporte.",
    },
    {
      q: "¿Qué datos necesitáis para presupuestar?",
      a: "El tipo de soporte, las unidades, las medidas aproximadas, el lugar de uso y la fecha. Confirmamos las opciones y los plazos en la propuesta.",
    },
  ],
  related: [related.textil, related.fullprint, related.merch],
};
