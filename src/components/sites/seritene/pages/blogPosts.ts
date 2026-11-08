/** Guías del blog de Seritene (/blog/ y sus artículos). */

export type BlogPost = {
  slug: string;
  graphic: "graphic-0" | "graphic-1" | "graphic-2";
  eyebrow: string;
  title: string;
  /** Entradilla: también es la meta descripción y el resumen del listado. */
  lead: string;
  sections: { heading: string; text: string }[];
  related?: { heading: string; links: { label: string; href: string }[] };
};

export const blogPosts: BlogPost[] = [
  {
    slug: "fullprint-tenerife",
    graphic: "graphic-0",
    eyebrow: "FULLPRINT · GUÍA PRÁCTICA",
    title: "Fullprint en Tenerife: qué es, cómo funciona y cuándo elegirlo",
    lead: "El fullprint es una personalización integral: el diseño se adapta al patrón del tejido, en lugar de limitarse a un logo sobre una prenda ya terminada.",
    sections: [
      {
        heading: "Qué diferencia al fullprint de un marcaje",
        text: "En una camiseta de catálogo eliges una prenda base y añades el diseño en zonas concretas, como pecho o espalda. En fullprint, colores, formas y gráficos se distribuyen por los paneles que forman la prenda o el artículo. Puedes coordinar frontal, espalda y mangas dentro de una misma composición."
      },
      {
        heading: "Cómo se prepara y se fabrica",
        text: "Primero elegimos el producto, el tejido compatible y las medidas. Después adaptamos el diseño a su patrón y revisamos nombres, dorsales y logotipos. En la sublimación, el color se transfiere al tejido compatible de poliéster. Las piezas impresas se cortan y confeccionan según el producto. Antes de producir se confirma la propuesta gráfica."
      },
      {
        heading: "Para qué productos tiene sentido",
        text: "Es una opción para camisetas y equipaciones de clubes, ropa de eventos o prendas con patrocinadores y colores propios. También se aplica a delantales, bolsas, pañuelos, bufandas, lanyards y toallas compatibles. El uso determina el tejido y el formato; no todas las superficies admiten el mismo proceso."
      },
      {
        heading: "Qué conviene revisar antes de pedir",
        text: "Envía logotipos con buena definición, colores de referencia, unidades y tallas. Sitúa textos y detalles importantes lejos de las uniones del patrón. Las costuras y tolerancias de confección pueden afectar a la continuidad entre paneles; revisamos la propuesta para evitar que un detalle esencial dependa de esa alineación."
      },
      {
        heading: "Cómo solicitar tu proyecto en Tenerife",
        text: "Indica el producto, el uso, las unidades, las personalizaciones individuales y la fecha y destino de entrega. En Seritene valoramos el diseño integral y confirmamos tejido, acabados, presupuesto y plazo antes de producir. Para un logo pequeño sobre una prenda base puede encajar mejor otra técnica."
      }
    ],
    related: {
      heading: "Encuentra el producto para tu proyecto",
      links: [
        {
          label: "Colecciones fullprint",
          href: "/fullprint/"
        },
        {
          label: "Camiseta ESSENTIAL fullprint",
          href: "/fullprint/camisetas/"
        }
      ]
    }
  },
  {
    slug: "cuidar-camisetas-personalizadas",
    graphic: "graphic-1",
    eyebrow: "TEXTIL · CUIDADOS",
    title: "Cómo cuidar tus camisetas personalizadas para que duren más",
    lead: "El cuidado depende del tejido y de la técnica de personalización. La etiqueta de la prenda y las indicaciones del taller son la referencia para lavar, secar y planchar.",
    sections: [
      {
        heading: "Comprueba la etiqueta y el acabado",
        text: "Antes del primer lavado, consulta la etiqueta y las indicaciones del pedido. Una camiseta de algodón con DTF, una prenda bordada y una equipación sublimada pueden necesitar cuidados diferentes. Si hay un tiempo de espera tras la aplicación del marcaje, respétalo según las instrucciones recibidas."
      },
      {
        heading: "Reduce el roce durante el lavado",
        text: "Dale la vuelta a la camiseta y separa colores y tejidos siguiendo la etiqueta. Evita mezclarla con cremalleras abiertas o elementos que rocen el diseño. Elige un programa y una temperatura compatibles con la prenda y el marcaje; no hay una temperatura universal válida para todos los productos."
      },
      {
        heading: "Detergente, manchas y productos agresivos",
        text: "No apliques lejía ni disolventes directamente sobre la personalización. Usa productos compatibles con el tejido y sigue su dosificación. Si aparece una mancha, consulta antes de frotar con fuerza sobre el diseño o utilizar un quitamanchas que pueda alterar la tinta, el adhesivo o el color del tejido."
      },
      {
        heading: "Secado y planchado",
        text: "Comprueba si la etiqueta y el marcaje permiten secadora. Cuando haya dudas, consulta antes de exponer la prenda a calor intenso. No pases la plancha directamente por un transfer o vinilo; respeta la temperatura y la protección indicadas para ese acabado. Guarda la camiseta seca y evita pliegues forzados sobre el diseño."
      },
      {
        heading: "Si tienes una duda sobre tu pedido",
        text: "Envíanos la referencia o una foto de la camiseta y del acabado para identificar el producto. Te indicaremos los cuidados correspondientes a la técnica utilizada. Conservar las instrucciones del pedido ayuda a que todo el equipo trate sus prendas de la misma manera."
      }
    ],
    related: {
      heading: "Encuentra el producto para tu proyecto",
      links: [
        {
          label: "Camisetas personalizadas",
          href: "/ropa/camisetas/"
        },
        {
          label: "Comparar técnicas textiles",
          href: "/blog/dtf-serigrafia-bordado/"
        }
      ]
    }
  },
  {
    slug: "serigrafia-tenerife",
    graphic: "graphic-2",
    eyebrow: "SERIGRAFÍA · TÉCNICAS",
    title: "Serigrafía textil en Tenerife: cómo funciona y cuándo elegirla",
    lead: "La serigrafía aplica tinta sobre el tejido mediante pantallas preparadas para el diseño. La cantidad de prendas, los colores y el soporte influyen en su elección y presupuesto.",
    sections: [
      {
        heading: "Qué se prepara antes de imprimir",
        text: "El diseño se adapta al tamaño y a la zona de marcaje. Se preparan pantallas para los colores o separaciones necesarios y se comprueba su registro, es decir, que las distintas partes encajen. La tinta y el proceso de fijación deben ser compatibles con la composición de la prenda."
      },
      {
        heading: "Cuándo puede ser una buena opción",
        text: "Conviene valorarla para series que repiten un mismo diseño en camisetas, sudaderas o bolsas compatibles. Al repartir la preparación entre más unidades, la cantidad influye en el coste por pieza. Los diseños con colores definidos permiten comparar con claridad las opciones de impresión."
      },
      {
        heading: "Cómo compararla con DTF y bordado",
        text: "DTF puede encajar en gráficos a todo color y series con necesidades diferentes de preparación. El bordado aporta relieve con hilo y requiere adaptar el tamaño y el detalle. La serigrafía no sustituye siempre a las otras técnicas: revisamos diseño, tejido, uso y cantidad para recomendar el acabado."
      },
      {
        heading: "Qué enviar para presupuestar",
        text: "Indica unidades, modelo, tallas, color de la prenda y ubicación y medida del dibujo. Envía el archivo vectorial si lo tienes y señala los colores de referencia. Si necesitas distintas versiones del diseño o varios marcajes, inclúyelos en la consulta para valorar toda la preparación."
      },
      {
        heading: "Producción y cuidados",
        text: "En Seritene confirmamos la propuesta antes de producir y te orientamos sobre los cuidados del pedido. El resultado y la duración dependen también del tejido, la aplicación y el uso. Consulta la etiqueta y las indicaciones del acabado, especialmente antes de utilizar calor o productos agresivos."
      }
    ],
    related: {
      heading: "Encuentra el producto para tu proyecto",
      links: [
        {
          label: "Personalización textil",
          href: "/textil-personalizado/"
        },
        {
          label: "Camisetas para personalizar",
          href: "/ropa/camisetas/"
        }
      ]
    }
  },
  {
    slug: "elegir-regalos-promocionales",
    graphic: "graphic-0",
    eyebrow: "MERCHANDISING · GUÍA DE COMPRA",
    title: "Cómo elegir regalos promocionales para tu empresa en Tenerife",
    lead: "Un regalo promocional funciona mejor cuando tiene un uso claro para quien lo recibe. Elige primero el público y la ocasión, y después el producto y su personalización.",
    sections: [
      {
        heading: "Empieza por el destinatario",
        text: "Para una formación pueden encajar libretas y bolígrafos; para un club, botellas y bolsas; para un comercio, artículos que acompañen la compra o se usen a diario. Define quién lo recibirá, dónde y con qué objetivo antes de seleccionar el catálogo."
      },
      {
        heading: "Compara utilidad, formato y presupuesto",
        text: "Revisa tamaño, capacidad y características de cada referencia. El precio depende de las unidades, el modelo y el marcaje. Compara propuestas con los mismos conceptos incluidos y ten en cuenta diseño, impuestos y transporte cuando corresponda."
      },
      {
        heading: "Adapta el diseño al material",
        text: "Una taza, un llavero y una mochila no admiten la misma técnica ni el mismo tamaño de logo. Simplifica el mensaje cuando la superficie sea pequeña y comprueba el contraste. Revisamos la compatibilidad del material y la zona de impresión antes de confirmar la personalización."
      },
      {
        heading: "Evita afirmaciones que el producto no acredita",
        text: "Si necesitas una característica concreta, como un material reciclado o un uso alimentario, consulta la documentación de la referencia. El aspecto natural de un artículo no demuestra por sí solo una certificación o una ventaja ambiental."
      },
      {
        heading: "Prepara la entrega del evento",
        text: "Indica cantidad, fecha y municipio o isla de entrega. La disponibilidad y la producción se confirman para cada pedido. En Seritene puedes comparar merchandising de catálogo y enviarnos tu selección para preparar una propuesta con tu marca."
      }
    ],
    related: {
      heading: "Encuentra el producto para tu proyecto",
      links: [
        {
          label: "Merchandising personalizado",
          href: "/merchandising/"
        },
        {
          label: "Bolsas para tu empresa",
          href: "/merchandising/bolsas/"
        }
      ]
    }
  },
  {
    slug: "camisetas-personalizadas-tenerife",
    graphic: "graphic-1",
    eyebrow: "TEXTIL · GUÍA PRÁCTICA",
    title: "Cómo elegir camisetas para tu empresa en Tenerife",
    lead: "Antes del color y del logo, piensa en quién la va a llevar y para qué. Estas decisiones hacen que una camiseta funcione de verdad.",
    sections: [
      {
        heading: "Empieza por el uso",
        text: "Para un equipo que trabaja a diario, prioriza comodidad, tallaje y cuidados. En una acción puntual puedes buscar otro equilibrio entre presupuesto y presencia. Si es una actividad deportiva, consulta tejidos adecuados al esfuerzo."
      },
      {
        heading: "No elijas solo por el gramaje",
        text: "El gramaje describe el peso del tejido por superficie, pero no cuenta toda la historia. Composición, corte y construcción también influyen. Pide asesoramiento sobre una referencia concreta."
      },
      {
        heading: "Define el diseño y las zonas",
        text: "Un logo pequeño y un gráfico a toda espalda tienen necesidades y costes distintos. Entrega el diseño y una medida aproximada para valorar la técnica sin sorpresas."
      },
      {
        heading: "Prepara un listado antes de confirmar",
        text: "Agrupa unidades por talla y color, revisa nombres si los hay e indica la fecha y el destino del pedido en Tenerife o Canarias. La disponibilidad y el plazo se confirman para cada trabajo."
      }
    ],
    related: {
      heading: "Encuentra el producto para tu proyecto",
      links: [
        {
          label: "Camisetas personalizadas",
          href: "/ropa/camisetas/"
        },
        {
          label: "Técnicas de personalización textil",
          href: "/textil-personalizado/"
        }
      ]
    }
  },
  {
    slug: "dtf-serigrafia-bordado",
    graphic: "graphic-2",
    eyebrow: "PERSONALIZACIÓN · ACABADOS",
    title: "Serigrafía, DTF, sublimación, vinilo y bordado: qué técnica elegir",
    lead: "La técnica se elige cruzando diseño, tejido, uso y cantidad. No hay una única opción que sea la mejor para todas las prendas.",
    sections: [
      {
        heading: "DTF: diseños a todo color",
        text: "Se transfiere el diseño sobre una prenda compatible. Es una opción para gráficos con varios colores y distintas zonas, siempre revisando tejido y superficie útil."
      },
      {
        heading: "Serigrafía: tintas y series",
        text: "Se prepara una pantalla por color o separación y se aplica tinta. La cantidad, los colores y la preparación influyen en el presupuesto."
      },
      {
        heading: "Bordado: el relieve del hilo",
        text: "Aporta textura a polos, sudaderas y otras prendas adecuadas. El detalle mínimo y el tamaño del logo deben adaptarse al hilo; no todo dibujo se reproduce igual que en impresión."
      },
      {
        heading: "Vinilo de corte: formas y colores definidos",
        text: "Se recorta un material de color y se aplica sobre un tejido compatible. Puede ser útil para textos, números y diseños sencillos; los detalles muy pequeños y los gráficos complejos requieren valorar otras técnicas. La composición, la elasticidad y la temperatura de aplicación condicionan su uso."
      },
      {
        heading: "Y la sublimación",
        text: "Se usa con soportes compatibles y permite el diseño integral en prendas fullprint. Cuéntanos tu proyecto y revisamos qué técnica encaja con la prenda y el resultado que buscas."
      }
    ],
    related: {
      heading: "Encuentra el producto para tu proyecto",
      links: [
        {
          label: "Personalización textil",
          href: "/textil-personalizado/"
        },
        {
          label: "DTF por metros",
          href: "/dtf-x-metros/"
        },
        {
          label: "Fullprint",
          href: "/fullprint/"
        }
      ]
    }
  },
  {
    slug: "preparar-pedido-personalizado",
    graphic: "graphic-0",
    eyebrow: "TU PEDIDO · PASO A PASO",
    title: "Qué enviar para presupuestar tu pedido personalizado",
    lead: "Una consulta bien preparada ayuda a elegir el producto, ajustar el marcaje y confirmar un plazo realista.",
    sections: [
      {
        heading: "Producto y cantidad",
        text: "Indica el artículo y el número de unidades. En textil, añade tallas y colores, aunque el reparto sea todavía orientativo."
      },
      {
        heading: "Archivo y medidas",
        text: "Adjunta el logo en la mejor calidad disponible. Explica dónde quieres colocarlo y qué tamaño aproximado buscas en cada zona."
      },
      {
        heading: "Fecha y destino",
        text: "Indica cuándo lo necesitas y el municipio o isla de entrega. El plazo depende de la disponibilidad, la aprobación del diseño y la producción."
      },
      {
        heading: "Revisa la propuesta completa",
        text: "Comprueba prendas, cantidades, marcajes, diseño, impuestos y transporte. El configurador calcula un presupuesto orientativo con los productos disponibles. La propuesta comercial se confirma con Seritene."
      }
    ]
  },
];

export const getBlogPost = (slug: string) => blogPosts.find((post) => post.slug === slug);
