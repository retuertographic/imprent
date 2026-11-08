/** Preguntas, recomendaciones y reglas del test /encuentra-tu-producto/. */

export type QuizStep = {
  id: "purpose" | "format" | "priority" | "quantity";
  title: string;
  options: { id: string; label: string; detail: string }[];
};

export type QuizAnswers = Partial<Record<QuizStep["id"], string>>;

export type QuizKind = "clothing" | "gifts" | "print" | "display";

export type QuizProduct = { id: string; name: string; href: string; reason: string; kind: QuizKind };

export const quizSteps: QuizStep[] = [
  {
    id: "purpose",
    title: "¿Para qué lo necesitas?",
    options: [
      { id: "company", label: "Mi empresa o negocio", detail: "Equipo, clientes o promoción." },
      { id: "sport", label: "Un club o equipo deportivo", detail: "Entrenar, competir o animar." },
      { id: "event", label: "Un evento o celebración", detail: "Ferias, fiestas y ocasiones especiales." },
      { id: "gift", label: "Un regalo", detail: "Un detalle con personalidad." },
    ],
  },
  {
    id: "format",
    title: "¿Qué tienes en mente?",
    options: [
      { id: "clothing", label: "Ropa personalizada", detail: "Camisetas, sudaderas y más." },
      { id: "gifts", label: "Objetos y regalos", detail: "Bolsas, tazas y merchandising." },
      { id: "print", label: "Imprenta", detail: "Tarjetas, folletos o pulseras." },
      { id: "display", label: "Que mi marca se vea", detail: "Banderas y soportes publicitarios." },
      { id: "unsure", label: "No lo tengo claro", detail: "Dame ideas según mis respuestas." },
    ],
  },
  {
    id: "priority",
    title: "¿Qué es lo más importante para ti?",
    options: [
      { id: "value", label: "Cuidar el presupuesto", detail: "Empezar por opciones sencillas." },
      { id: "useful", label: "Que lo usen mucho", detail: "Algo práctico para el día a día." },
      { id: "impact", label: "Llamar la atención", detail: "Que el diseño sea protagonista." },
    ],
  },
  {
    id: "quantity",
    title: "¿Cuántas unidades tienes en mente?",
    options: [
      { id: "few", label: "De 1 a 4", detail: "Un detalle o un pedido pequeño." },
      { id: "small", label: "De 5 a 24", detail: "Para un grupo pequeño." },
      { id: "medium", label: "De 25 a 99", detail: "Para hacer equipo." },
      { id: "large", label: "100 o más", detail: "Una acción a lo grande." },
      { id: "unknown", label: "Todavía no lo sé", detail: "Primero quiero ver las opciones." },
    ],
  },
];

const product = (id: string, name: string, href: string, reason: string, kind: QuizKind): QuizProduct => ({
  id,
  name,
  href,
  reason,
  kind,
});

const products: Record<string, QuizProduct> = {
  shirts: product("shirts", "Camisetas con tu logo", "/ropa/camisetas/", "Una base sencilla para personalizar y repartir entre tu grupo.", "clothing"),
  hoodies: product("hoodies", "Sudaderas personalizadas", "/ropa/sudaderas/", "Una prenda para acompañar al equipo también fuera de su actividad.", "clothing"),
  polos: product("polos", "Polos personalizados", "/ropa/polos/", "Para dar una imagen común al equipo en el día a día.", "clothing"),
  work: product("work", "Ropa laboral", "/ropa/laboral/", "Explora prendas pensadas para el trabajo y elige según vuestra actividad.", "clothing"),
  sports: product("sports", "Ropa deportiva", "/ropa/deporte/", "Modelos deportivos para personalizar con la identidad del club.", "clothing"),
  fullprint: product("fullprint", "Ropa fullprint", "/fullprint/", "Para llevar tus colores y gráficos por toda la prenda.", "clothing"),
  bags: product("bags", "Bolsas personalizadas", "/merchandising/bolsas/", "Un objeto útil para llevar tus cosas y tu marca contigo.", "gifts"),
  mugs: product("mugs", "Tazas con personalidad", "/merchandising/tazas/", "Un detalle para regalar y usar en casa o en el trabajo.", "gifts"),
  bottles: product("bottles", "Botellas personalizadas", "/merchandising/botellas/", "Una opción práctica para entrenar, salir o tener a mano a diario.", "gifts"),
  keys: product("keys", "Llaveros personalizados", "/merchandising/llaveros/", "Un detalle pequeño para que tu marca acompañe cada día.", "gifts"),
  pens: product("pens", "Bolígrafos personalizados", "/merchandising/boligrafos/", "Una opción sencilla para repartir en una acción promocional.", "gifts"),
  tech: product("tech", "Merchandising tecnológico", "/merchandising/tecnologia/", "Ideas diferentes para regalar a quienes disfrutan con la tecnología.", "gifts"),
  cards: product("cards", "Tarjetas de visita", "/imprenta/tarjetas-de-visita/", "Para presentarte y dejar tus datos en manos de tus clientes.", "print"),
  flyers: product("flyers", "Flyers", "/imprenta/flyers/", "Para comunicar una promoción, apertura o evento.", "print"),
  folded: product("folded", "Trípticos", "/imprenta/tripticos/", "Más espacio para explicar tus servicios o contar tu propuesta.", "print"),
  wristbands: product("wristbands", "Pulseras full color", "/imprenta/pulseras-full-color/", "Identificación para asistentes con el diseño de tu evento.", "print"),
  fans: product("fans", "Abanicos de papel", "/imprenta/abanicos-de-papel/", "Un detalle personalizado para celebraciones y días de calor.", "print"),
  sail: product("sail", "Bandera Vela", "/soportes-publicitarios/vela/", "Un soporte vertical para destacar tu marca en un espacio o evento.", "display"),
  drop: product("drop", "Bandera Gota", "/soportes-publicitarios/gota/", "Otra silueta para dar visibilidad a tu marca.", "display"),
  display: product("display", "Soportes publicitarios", "/banderas-rollups/", "Cuéntanos el espacio y te ayudamos con el soporte adecuado.", "display"),
};

/** Tres recomendaciones según las respuestas (mismas reglas que seritene.com). */
export function recommend(a: QuizAnswers): QuizProduct[] {
  const kind =
    a.format === "unsure"
      ? a.purpose === "sport"
        ? "clothing"
        : a.purpose === "company"
          ? a.priority === "impact"
            ? "display"
            : "clothing"
          : "gifts"
      : a.format;
  let ids: string[];
  if (kind === "print") {
    ids =
      a.purpose === "event"
        ? a.priority === "impact"
          ? ["wristbands", "fans", "flyers"]
          : ["flyers", "wristbands", "cards"]
        : a.priority === "impact"
          ? ["folded", "cards", "flyers"]
          : ["cards", "flyers", "folded"];
  } else if (kind === "display") {
    ids = a.priority === "impact" ? ["drop", "sail", "display"] : ["sail", "drop", "display"];
  } else if (kind === "gifts") {
    if (a.priority === "value") ids = a.purpose === "gift" ? ["keys", "mugs", "bags"] : ["pens", "keys", "bags"];
    else if (a.priority === "impact") ids = ["tech", "mugs", "bags"];
    else ids = a.purpose === "sport" ? ["bottles", "bags", "mugs"] : ["bags", "mugs", "bottles"];
  } else if (a.purpose === "sport") {
    ids =
      a.priority === "impact"
        ? ["fullprint", "sports", "hoodies"]
        : a.priority === "value"
          ? ["shirts", "sports", "hoodies"]
          : ["sports", "hoodies", "fullprint"];
  } else if (a.priority === "impact") ids = ["fullprint", "hoodies", "shirts"];
  else if (a.purpose === "company" && a.priority === "useful") ids = ["work", "polos", "shirts"];
  else if (a.priority === "useful") ids = ["hoodies", "shirts", "polos"];
  else ids = ["shirts", "polos", "hoodies"];
  return ids.map((id) => products[id]);
}

export function summarize(a: QuizAnswers) {
  return quizSteps.map((step) => ({
    question: step.title,
    answer: step.options.find((option) => option.id === a[step.id])?.label || "Por definir",
  }));
}
