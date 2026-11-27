/** Datos compartidos del sitio Seritene (contacto, enlaces y contenidos de la home). */

export const ORIGIN = "https://seritene.com";
/** Prefijo de la web publicada (p. ej. "/imprent" en GitHub Pages). Lo fija el workflow de deploy. */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const ASSETS = `${BASE_PATH}/sites/seritene`;

/** Rutas aún no clonadas: apuntan a la web de producción. */
export const ext = (path: string) => `${ORIGIN}${path}`;
export const asset = (path: string) => `${ASSETS}${path}`;

export const contact = {
  phone: "+34641782535",
  displayPhone: "641 78 25 35",
  email: "info@seritene.com",
  whatsapp: "https://wa.me/34641782535",
  instagram: "https://www.instagram.com/seritenefabricadeideas/",
  facebook: "https://www.facebook.com/seritene/",
  /** Nombre comercial (el mismo que en el perfil de Google y en el JSON-LD de producción). */
  businessName: "Seritene Creaciones Publicitarias",
  address: {
    street: "Calle Lordelos, 20, n.º 9",
    postalCode: "38315",
    locality: "La Orotava",
    region: "Santa Cruz de Tenerife",
    country: "ES",
  },
  geo: { lat: 28.382666, lng: -16.556423 },
  // Horario de atención: aún no lo tenemos del cliente; no se muestra ni va al JSON-LD hasta confirmarlo.
  // openingHours: [{ days: ["Mo", "Tu", "We", "Th", "Fr"], opens: "09:00", closes: "14:00" }],
};

/** «Calle Lordelos, 20, n.º 9 · 38315 La Orotava · Santa Cruz de Tenerife» */
export const fullAddress = [
  contact.address.street,
  `${contact.address.postalCode} ${contact.address.locality}`,
  contact.address.region,
].join(" · ");

/** Enlace a Google Maps con el nombre y la dirección completa (abre la ficha del negocio o el punto exacto). */
export const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${contact.businessName}, ${contact.address.street}, ${contact.address.postalCode} ${contact.address.locality}, ${contact.address.region}`,
)}`;

/**
 * Plazo típico de producción para la línea de tiempo del pedido (fichas y carrito).
 * Vacío a propósito: hace falta que el cliente confirme un plazo real. Mientras esté vacío no se muestra.
 */
export const typicalLeadTime = "";

/**
 * Línea de tiempo del pedido (fichas, configuradores y bloque «Qué pasa después» del carrito): pasos
 * desde que se envía la solicitud, sin plazos ni horarios inventados.
 */
export const orderSteps = [
  { title: "Envías tu pedido y tu logo", text: "Por WhatsApp o email, con el resumen de tu selección y tu archivo." },
  { title: "Revisamos y te enviamos una prueba", text: "Comprobamos tu logo o tu idea y te mandamos una prueba para que la veas." },
  { title: "Confirmas y pagas", text: "Cuando des el visto bueno a la prueba y al presupuesto." },
  { title: "Producimos", text: "Lo preparamos en nuestro taller." },
  { title: "Entrega o recogida", text: "Te lo enviamos o pasas a recogerlo." },
];

export const logoHint = {
  title: "Cómo enviarnos tu logo",
  text: "Adjúntalo en WhatsApp o por email (PNG, PDF, AI o SVG).",
};

/**
 * Enlace `mailto:` a info@seritene.com. Saltos de línea como CRLF (RFC 6068) y espacios como %20
 * (algunos clientes de correo muestran «+» si se usa URLSearchParams).
 */
export const mailtoUrl = (subject: string, body: string) =>
  `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.replace(/\r?\n/g, "\r\n"))}`;

/**
 * Longitud máxima segura de un enlace `mailto:` (Outlook y algunos navegadores cortan o ignoran
 * enlaces de más de ~2.000 caracteres). Por encima, el cuerpo se sustituye por un texto corto.
 */
export const MAILTO_MAX = 1900;

const wa = (text: string) => `${contact.whatsapp}?text=${encodeURIComponent(text)}`;

export const whatsappLinks = {
  idea: wa("Hola Seritene, tengo una idea y me gustaría que me ayudaseis a personalizarla."),
  doubt: wa("Hola Seritene, tengo una duda sobre un pedido personalizado."),
  order: wa("Hola Seritene, me gustaría que me ayudaseis con un pedido personalizado."),
};

export type NavCategory = {
  name: string;
  href: string;
  links?: { name: string; href: string }[];
};

export const navCategories: NavCategory[] = [
  {
    name: "Ropa",
    href: "/ropa/",
    links: [
      ["Camisetas", "camisetas"],
      ["Sudaderas", "sudaderas"],
      ["Polos", "polos"],
      ["Pantalones", "pantalones"],
      ["Abrigos y chaquetas", "abrigos"],
      ["Ropa deportiva", "deporte"],
      ["Ropa laboral", "laboral"],
    ]
      .map(([name, slug]) => ({ name, href: `/ropa/${slug}/` }))
      // Producción enlaza /ropa/gorras/, que redirige (308) a la categoría de merchandising.
      .concat({ name: "Gorras", href: "/merchandising/gorras/" }),
  },
  {
    name: "Merchandising",
    href: "/merchandising/",
    links: [
      ["Bolsas", "bolsas"],
      ["Gorras", "gorras"],
      ["Tazas", "tazas"],
      ["Botellas", "botellas"],
      ["Libretas", "libretas"],
      ["Bolígrafos", "boligrafos"],
      ["Llaveros", "llaveros"],
      ["Mochilas", "mochilas"],
      ["Tecnología", "tecnologia"],
    ].map(([name, slug]) => ({ name, href: `/merchandising/${slug}/` })),
  },
  { name: "Fullprint", href: "/fullprint/" },
  { name: "DTF por metros", href: "/dtf-x-metros/" },
  { name: "Imprenta", href: "/imprenta/" },
  { name: "Soportes publicitarios", href: "/soportes-publicitarios/" },
  { name: "Eventos", href: "/eventos/" },
];

export const utilityLinks: [string, string][] = [
  ["Nuestro equipo", "/sobre-nosotros/"],
  ["Servicios", "/servicios/"],
  ["Trabajos reales", "/trabajos/"],
  ["Catálogos", "/catalogos/"],
  ["Contacto", "/contacto/"],
];

export const services = [
  { name: "Ropa", href: "/ropa/", label: "TU LOGO, TU ESTILO", text: "Camisetas, sudaderas y mucho más.", image: "mockup-ropa" },
  { name: "Fullprint", href: "/fullprint/", label: "SIN LÍMITES DE COLOR", text: "El diseño ocupa toda la prenda.", image: "mockup-fullprint" },
  { name: "Merchandising", href: "/merchandising/", text: "Tu marca, siempre a mano.", image: "mockup-merchandising" },
  { name: "Imprenta", href: "/imprenta/", text: "Una buena primera impresión.", image: "mockup-imprenta" },
  { name: "Ropa laboral", href: "/ropa/laboral/", text: "Equipamos a tu equipo.", image: "mockup-laboral" },
  { name: "Soportes publicitarios", href: "/soportes-publicitarios/", text: "Hazte ver desde lejos.", image: "mockup-banderas" },
];

export const proofs = [
  "Producción propia.",
  "Asesoramiento personalizado.",
  "Empresas, clubes y eventos.",
  "Servicio en Tenerife y Canarias.",
  "Amplio catálogo.",
];

/**
 * Reseñas de Google (componente `GoogleReviews` y `aggregateRating` del JSON-LD). VACÍO A PROPÓSITO:
 * no tenemos todavía la ficha ni las reseñas del cliente, y mientras todo esté vacío no se muestra nada.
 * Datos que hacen falta (siempre reales, copiados de la ficha de Google Business Profile):
 * - `profileUrl`: enlace público a la ficha o a sus reseñas (p. ej. el enlace «Compartir» de Google Maps).
 *   Con solo esto se muestra «Ver nuestras reseñas en Google».
 * - `rating` (media, p. ej. 4.9) y `count` (número total de reseñas): se muestran las estrellas y el número,
 *   y se añaden como `aggregateRating` al LocalBusiness del JSON-LD (solo si están los dos).
 * - `reviews`: hasta 3 reseñas literales (texto, nombre tal como aparece en Google y fecha ISO «AAAA-MM-DD»)
 *   y su puntuación. Conviene tener el permiso del autor o usar solo el nombre de pila.
 */
export type GoogleReview = { text: string; author: string; date: string; rating: number };
export const googleReviews: {
  profileUrl: string;
  rating: number | null;
  count: number | null;
  reviews: GoogleReview[];
} = {
  profileUrl: "",
  rating: null,
  count: null,
  reviews: [],
};

/** Pruebas de confianza de la portada (bloque compacto tras la caja animada): las cuatro primeras de `proofs`. */
export const homeTrustProofs = proofs.slice(0, 4);
/** Fotos de la tira de trabajos de la portada (ids de `projects`, una por categoría y alguna más). */
export const homeTrustWorks = ["09", "16", "01", "12", "07", "15"];

export const reels = [
  { id: "Dc3a3mKKL6B", title: "Equipaciones a tu manera", alt: "Portada del reel de Seritene sobre equipaciones deportivas personalizadas." },
  { id: "DRhxrHcjIK2", title: "Merchandising que se usa", alt: "Portada del reel de Seritene sobre regalos y merchandising para empresas." },
  { id: "DRVKvDmAFZJ", title: "Antes de elegir uniformes", alt: "Portada del reel de Seritene con consejos para elegir uniformes de empresa." },
  { id: "DRC_OE5ANd4", title: "Premios con tu identidad", alt: "Portada del reel de Seritene mostrando trofeos personalizados." },
];

export const faqs = [
  {
    q: "¿Cómo termino mi pedido?",
    a: "Configura el producto y pulsa el botón de solicitud de su ficha. Se abrirá WhatsApp con tu selección para que la revises y la envíes. Confirmamos contigo disponibilidad, diseño, importe y plazo. La solicitud todavía no es un pedido confirmado ni un pago online.",
  },
  {
    q: "¿Puedo pedir pocas unidades?",
    a: "Depende del producto y de su personalización. Cada ficha indica la cantidad mínima cuando corresponde. Algunas cantidades o marcajes necesitan un presupuesto a medida; puedes consultarnos antes de decidir.",
  },
  {
    q: "¿Cómo veo el precio con mi logo?",
    a: "Abre «Añade tu marcaje» en los productos que ofrecen esa opción y elige entre las ubicaciones disponibles. Si la combinación se puede calcular, el precio se actualiza en la ficha. En Fullprint e Imprenta, consulta la impresión incluida en la opción elegida. Los acabados a medida se confirman en el presupuesto.",
  },
  {
    q: "¿Y si no tengo el diseño preparado?",
    a: "Cuéntanos tu idea. Si ya tienes un logo, envía el archivo de mayor calidad que tengas, preferiblemente PDF vectorial, SVG o AI. Revisamos si sirve para el producto. El diseño o la adaptación, cuando sean necesarios, se presupuestan aparte.",
  },
  {
    q: "¿El envío es obligatorio?",
    a: "No. Puedes activar o desactivar el envío a domicilio en la ficha del producto. Cuesta 6 € y es gratuito a partir de 199 € de pedido. Indícanos tu municipio o isla para concretar la entrega.",
  },
  {
    q: "¿Cuánto tardará en estar listo?",
    a: "Depende del artículo, la cantidad, la disponibilidad y la aprobación del diseño. Confirmamos el plazo contigo antes de producir. Si lo necesitas para un evento, dinos la fecha desde el primer mensaje.",
  },
];

/**
 * Categorías de la galería de trabajos (/trabajos/ y bloques «Trabajos reales»). Solo las que tienen fotos
 * reales del taller: todavía no hay fotos de trabajos de imprenta (si llegan, añade la categoría aquí y
 * etiqueta las fotos en `projects`). `href` es la página de servicio o catálogo de la categoría.
 */
export type WorkCategory = "textil" | "fullprint" | "merchandising" | "eventos" | "soportes";

export const workCategories: { id: WorkCategory; label: string; title: string; href: string }[] = [
  { id: "textil", label: "Textil", title: "Textil personalizado", href: "/textil-personalizado/" },
  { id: "fullprint", label: "Fullprint", title: "Fullprint y sublimación", href: "/fullprint/" },
  { id: "merchandising", label: "Merchandising", title: "Merchandising", href: "/merchandising/" },
  { id: "eventos", label: "Trofeos y eventos", title: "Trofeos, placas y eventos", href: "/eventos/" },
  { id: "soportes", label: "Soportes", title: "Soportes publicitarios", href: "/soportes-publicitarios/" },
];

export type Project = {
  id: string;
  title: string;
  category: string;
  description: string;
  position: string;
  presentation?: boolean;
  /**
   * Categorías de la galería (una foto puede estar en varias). Vacío = no sale en la galería
   * (la presentación digital no es una foto de un trabajo terminado).
   */
  gallery: WorkCategory[];
  /** Tamaño de la foto `thumb` (740 px el lado mayor): da la proporción a `width`/`height`. */
  size: [number, number];
};

export const projects: Project[] = [
  { id: "09", title: "Camisetas para HYROX", category: "Textil", description: "Diseño fullprint negro y amarillo, con nombre personalizado en la espalda.", position: "50% 48%", gallery: ["textil", "fullprint"], size: [555, 740] },
  { id: "07", title: "Una sudadera con mucho sabor", category: "Textil", description: "Sudadera azul con capucha y diseño integral para hostelería.", position: "50% 48%", gallery: ["textil", "fullprint"], size: [555, 740] },
  { id: "11", title: "Tu marca, siempre a mano", category: "Accesorios", description: "Llaveros textiles personalizados con distintos diseños y acabados.", position: "50% 36%", gallery: ["merchandising"], size: [740, 555] },
  { id: "16", title: "Roll-ups que abren el apetito", category: "Soportes", description: "Soportes enrollables para comunicar actividades y proyectos de cocina.", position: "50% 48%", gallery: ["soportes"], size: [555, 740] },
  { id: "08", title: "Color para entrenar", category: "Textil", description: "Camiseta deportiva de tirantes con diseño geométrico a todo color.", position: "50% 48%", gallery: ["textil", "fullprint"], size: [555, 740] },
  { id: "10", title: "Identidad de club", category: "Textil", description: "Camiseta deportiva en naranja y amarillo con el nombre del club en la espalda.", position: "50% 46%", gallery: ["textil", "fullprint"], size: [416, 740] },
  { id: "19", title: "Un delantal con personalidad", category: "Textil", description: "Delantal personalizado con un diseño colorido para el día a día en el comercio.", position: "48% 55%", gallery: ["textil", "fullprint"], size: [555, 740] },
  { id: "20", title: "Una toalla que motiva", category: "Textil", description: "Toalla verde personalizada con un mensaje deportivo.", position: "50% 48%", gallery: ["textil"], size: [555, 740] },
  { id: "12", title: "Lanyards a todo color", category: "Accesorios", description: "Cintas personalizadas con diferentes colores, logotipos y terminaciones.", position: "50% 25%", gallery: ["merchandising", "fullprint", "eventos"], size: [740, 555] },
  { id: "13", title: "Pulseras para recordar", category: "Accesorios", description: "Pulseras textiles personalizadas para eventos, equipos y celebraciones.", position: "50% 40%", gallery: ["eventos", "fullprint"], size: [555, 740] },
  { id: "18", title: "Tradición con identidad", category: "Textil", description: "Pañuelo personalizado con motivos de La Orotava.", position: "50% 40%", gallery: ["textil", "fullprint"], size: [416, 740] },
  { id: "15", title: "Que te vean desde la calle", category: "Soportes", description: "Banderas publicitarias instaladas en el exterior de un negocio.", position: "50% 49%", gallery: ["soportes"], size: [523, 740] },
  { id: "14", title: "Banderines con mucho detalle", category: "Soportes", description: "Banderines personalizados con acabado de flecos, preparados en el taller.", position: "50% 32%", gallery: ["soportes"], size: [555, 740] },
  { id: "17", title: "Tu marca también se sienta a la mesa", category: "Soportes", description: "Mantel corporativo personalizado para una mesa de presentación.", position: "50% 53%", gallery: ["soportes"], size: [740, 566] },
  { id: "01", title: "Una temporada para celebrar", category: "Trofeos", description: "Trofeos transparentes personalizados para un equipo campeón.", position: "46% 42%", gallery: ["eventos"], size: [740, 555] },
  { id: "02", title: "El recuerdo de un equipo", category: "Trofeos", description: "Placas con fotografía y mensaje conmemorativo sobre soportes de sobremesa.", position: "50% 43%", gallery: ["eventos"], size: [740, 555] },
  { id: "03", title: "Reconocimientos con carácter", category: "Trofeos", description: "Trofeos transparentes BOLD con personalización en color violeta.", position: "50% 49%", gallery: ["eventos"], size: [555, 740] },
  { id: "05", title: "Trofeos de madera", category: "Trofeos", description: "Piezas conmemorativas de madera con silueta recortada y texto personalizado.", position: "50% 49%", gallery: ["eventos"], size: [740, 333] },
  { id: "04", title: "El primer contacto lleva tu nombre", category: "Accesorios", description: "Identificadores de personal con nombre y logotipo para Beach Mate.", position: "50% 36%", gallery: ["merchandising"], size: [740, 555] },
  { id: "06", title: "Diseño para un equipo de boxeo", category: "Textil", description: "Presentación digital del diseño de camiseta, con vistas delantera y trasera.", position: "50% 50%", presentation: true, gallery: [], size: [592, 740] },
];

export type TeamMember = {
  name: string;
  role: string;
  area: string;
  photo: string;
  scale: number;
  offsetY: string;
};

export const team: TeamMember[] = [
  { name: "José Enrique", role: "CEO · Dirección general", area: "Dirección", photo: "jose-enrique-traje", scale: 1.18, offsetY: "-1.5%" },
  { name: "César", role: "Director general adjunto", area: "Dirección", photo: "cesar", scale: 1.17, offsetY: "-15%" },
  { name: "Silvia", role: "Responsable de taller", area: "Producción", photo: "silvia", scale: 1.32, offsetY: "-1.8%" },
  { name: "Elia", role: "Diseñadora gráfica", area: "Diseño", photo: "elia", scale: 1, offsetY: "0%" },
  { name: "Óscar", role: "Técnico de impresión", area: "Producción", photo: "oscar-actualizado", scale: 1.12, offsetY: "-1.5%" },
  { name: "Carla", role: "Especialista de producción", area: "Producción", photo: "carla", scale: 1.43, offsetY: "-1.6%" },
  { name: "Christian", role: "Especialista de producción", area: "Producción", photo: "christian", scale: 1.3, offsetY: "-2.5%" },
  { name: "Mariam", role: "Responsable de confección", area: "Confección", photo: "mariam", scale: 1.25, offsetY: "-2%" },
  { name: "Carolina", role: "Responsable adjunta de confección", area: "Confección", photo: "carolina", scale: 1.3, offsetY: "0%" },
  { name: "El jefe supremo", role: "Director de mimos", area: "Dirección suprema", photo: "jefe-supremo", scale: 1, offsetY: "0%" },
];

/** Ayuda del buscador cuando no hay resultados o hay pocos (categorías y servicios más pedidos). */
export const searchHelp = {
  popular: [
    { label: "Camisetas", href: "/ropa/camisetas/" },
    { label: "Sudaderas", href: "/ropa/sudaderas/" },
    { label: "Polos", href: "/ropa/polos/" },
    { label: "Ropa laboral", href: "/ropa/laboral/" },
    { label: "Gorras", href: "/merchandising/gorras/" },
    { label: "Tazas", href: "/merchandising/tazas/" },
    { label: "Bolsas", href: "/merchandising/bolsas/" },
    { label: "Bolígrafos", href: "/merchandising/boligrafos/" },
    { label: "Lona impresa", href: "/soportes-publicitarios/lona-impresa/" },
    { label: "Roll-ups", href: "/soportes-publicitarios/" },
    { label: "Tarjetas de visita", href: "/imprenta/tarjetas-de-visita/" },
    { label: "Fullprint", href: "/fullprint/" },
  ],
  whatsapp: wa("Hola Seritene, busco un producto que no encuentro en la web: "),
};
