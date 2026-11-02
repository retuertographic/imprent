/** Datos compartidos del sitio Seritene (contacto, enlaces y contenidos de la home). */

export const ORIGIN = "https://seritene.com";
export const ASSETS = "/sites/seritene";

/** Rutas aún no clonadas: apuntan a la web de producción. */
export const ext = (path: string) => `${ORIGIN}${path}`;
export const asset = (path: string) => `${ASSETS}${path}`;

export const contact = {
  phone: "+34641782535",
  displayPhone: "641 78 25 35",
  email: "info@seritene.com",
  whatsapp: "https://wa.me/34641782535",
  instagram: "https://www.instagram.com/seritenefabricadeideas/",
};

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
      ["Gorras", "gorras"],
    ].map(([name, slug]) => ({ name, href: `/ropa/${slug}/` })),
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
  ["Catálogos", "/catalogos/"],
  ["Contacto", "/contacto/"],
];

export const services = [
  { name: "Ropa", href: "/ropa/", label: "TU LOGO, TU ESTILO", text: "Camisetas, sudaderas y mucho más.", image: "mockup-ropa" },
  { name: "Fullprint", href: "/fullprint/", label: "SIN LÍMITES DE COLOR", text: "El diseño ocupa toda la prenda.", image: "mockup-fullprint" },
  { name: "Merchandising", href: "/merchandising/", text: "Tu marca, siempre a mano.", image: "mockup-merchandising" },
  { name: "Imprenta", href: "/imprenta/", text: "Una buena primera impresión.", image: "mockup-imprenta" },
  { name: "Ropa laboral", href: "/ropa-laboral/", text: "Equipamos a tu equipo.", image: "mockup-laboral" },
  { name: "Soportes publicitarios", href: "/soportes-publicitarios/", text: "Hazte ver desde lejos.", image: "mockup-banderas" },
];

export const proofs = [
  "Producción propia.",
  "Asesoramiento personalizado.",
  "Empresas, clubes y eventos.",
  "Servicio en Tenerife y Canarias.",
  "Amplio catálogo.",
];

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

export type Project = {
  id: string;
  title: string;
  category: string;
  description: string;
  position: string;
  presentation?: boolean;
};

export const projects: Project[] = [
  { id: "09", title: "Camisetas para HYROX", category: "Textil", description: "Diseño fullprint negro y amarillo, con nombre personalizado en la espalda.", position: "50% 48%" },
  { id: "07", title: "Una sudadera con mucho sabor", category: "Textil", description: "Sudadera azul con capucha y diseño integral para hostelería.", position: "50% 48%" },
  { id: "11", title: "Tu marca, siempre a mano", category: "Accesorios", description: "Llaveros textiles personalizados con distintos diseños y acabados.", position: "50% 36%" },
  { id: "16", title: "Roll-ups que abren el apetito", category: "Soportes", description: "Soportes enrollables para comunicar actividades y proyectos de cocina.", position: "50% 48%" },
  { id: "08", title: "Color para entrenar", category: "Textil", description: "Camiseta deportiva de tirantes con diseño geométrico a todo color.", position: "50% 48%" },
  { id: "10", title: "Identidad de club", category: "Textil", description: "Camiseta deportiva en naranja y amarillo con el nombre del club en la espalda.", position: "50% 46%" },
  { id: "19", title: "Un delantal con personalidad", category: "Textil", description: "Delantal personalizado con un diseño colorido para el día a día en el comercio.", position: "48% 55%" },
  { id: "20", title: "Una toalla que motiva", category: "Textil", description: "Toalla verde personalizada con un mensaje deportivo.", position: "50% 48%" },
  { id: "12", title: "Lanyards a todo color", category: "Accesorios", description: "Cintas personalizadas con diferentes colores, logotipos y terminaciones.", position: "50% 25%" },
  { id: "13", title: "Pulseras para recordar", category: "Accesorios", description: "Pulseras textiles personalizadas para eventos, equipos y celebraciones.", position: "50% 40%" },
  { id: "18", title: "Tradición con identidad", category: "Textil", description: "Pañuelo personalizado con motivos de La Orotava.", position: "50% 40%" },
  { id: "15", title: "Que te vean desde la calle", category: "Soportes", description: "Banderas publicitarias instaladas en el exterior de un negocio.", position: "50% 49%" },
  { id: "14", title: "Banderines con mucho detalle", category: "Soportes", description: "Banderines personalizados con acabado de flecos, preparados en el taller.", position: "50% 32%" },
  { id: "17", title: "Tu marca también se sienta a la mesa", category: "Soportes", description: "Mantel corporativo personalizado para una mesa de presentación.", position: "50% 53%" },
  { id: "01", title: "Una temporada para celebrar", category: "Trofeos", description: "Trofeos transparentes personalizados para un equipo campeón.", position: "46% 42%" },
  { id: "02", title: "El recuerdo de un equipo", category: "Trofeos", description: "Placas con fotografía y mensaje conmemorativo sobre soportes de sobremesa.", position: "50% 43%" },
  { id: "03", title: "Reconocimientos con carácter", category: "Trofeos", description: "Trofeos transparentes BOLD con personalización en color violeta.", position: "50% 49%" },
  { id: "05", title: "Trofeos de madera", category: "Trofeos", description: "Piezas conmemorativas de madera con silueta recortada y texto personalizado.", position: "50% 49%" },
  { id: "04", title: "El primer contacto lleva tu nombre", category: "Accesorios", description: "Identificadores de personal con nombre y logotipo para Beach Mate.", position: "50% 36%" },
  { id: "06", title: "Diseño para un equipo de boxeo", category: "Textil", description: "Presentación digital del diseño de camiseta, con vistas delantera y trasera.", position: "50% 50%", presentation: true },
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
