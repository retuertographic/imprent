/** Equipo de Seritene (/sobre-nosotros/). */

export type TeamArea = "Dirección" | "Diseño" | "Producción" | "Confección";

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  area: TeamArea;
  line: string;
  description: string;
  photo: string;
  photoScale: number;
  photoOffsetY: number;
  mascot?: boolean;
};

export const teamFilters = ["Todo el equipo", "Dirección", "Diseño", "Producción", "Confección"] as const;
export type TeamFilter = (typeof teamFilters)[number];

export const team: TeamMember[] = [
  {
    id: "jose-enrique",
    name: "José Enrique",
    role: "CEO · Dirección general",
    area: "Dirección",
    line: "El rumbo de la casa.",
    description: "Al frente de Seritene y de la dirección de la empresa.",
    photo: "/team/jose-enrique-traje.webp",
    photoScale: 1.18,
    photoOffsetY: -1.5,
  },
  {
    id: "cesar",
    name: "César",
    role: "Director general adjunto",
    area: "Dirección",
    line: "Donde hace falta, ahí está.",
    description:
      "La segunda voz al frente de Seritene. Apoya la dirección y se implica en el día a día de las distintas áreas del equipo.",
    photo: "/team/cesar.webp",
    photoScale: 1.17,
    photoOffsetY: -15,
  },
  {
    id: "silvia",
    name: "Silvia",
    role: "Responsable de taller",
    area: "Producción",
    line: "Las ideas pasan a la acción.",
    description: "Al frente del taller, coordinando al equipo y el trabajo de producción.",
    photo: "/team/silvia.webp",
    photoScale: 1.32,
    photoOffsetY: -1.8,
  },
  {
    id: "elia",
    name: "Elia",
    role: "Diseñadora gráfica",
    area: "Diseño",
    line: "Tu idea empieza a verse.",
    description: "Da forma visual a las ideas desde el área de diseño de Seritene.",
    photo: "/team/elia.webp",
    photoScale: 1,
    photoOffsetY: 0,
  },
  {
    id: "oscar",
    name: "Óscar",
    role: "Técnico de impresión",
    area: "Producción",
    line: "Del diseño a la impresión.",
    description: "Se ocupa del trabajo técnico de impresión para convertir los diseños en productos personalizados.",
    photo: "/team/oscar-actualizado.webp",
    photoScale: 1.12,
    photoOffsetY: -1.5,
  },
  {
    id: "carla",
    name: "Carla",
    role: "Especialista de producción",
    area: "Producción",
    line: "Manos a la personalización.",
    description: "Forma parte del equipo de taller y participa en la producción de los pedidos.",
    photo: "/team/carla.webp",
    photoScale: 1.43,
    photoOffsetY: -1.6,
  },
  {
    id: "christian",
    name: "Christian",
    role: "Especialista de producción",
    area: "Producción",
    line: "Aquí las ideas se hacen.",
    description: "Trabaja en el taller junto al equipo para dar forma a los productos de Seritene.",
    photo: "/team/christian.webp",
    photoScale: 1.3,
    photoOffsetY: -2.5,
  },
  {
    id: "mariam",
    name: "Mariam",
    role: "Responsable de confección",
    area: "Confección",
    line: "El hilo conductor.",
    description: "Al frente del área de costura, coordina el trabajo de confección.",
    photo: "/team/mariam.webp",
    photoScale: 1.25,
    photoOffsetY: -2,
  },
  {
    id: "carolina",
    name: "Carolina",
    role: "Responsable adjunta de confección",
    area: "Confección",
    line: "Puntada a puntada, en equipo.",
    description: "Apoya a Mariam como segunda responsable del área de costura y participa en el trabajo de confección.",
    photo: "/team/carolina.webp",
    photoScale: 1.3,
    photoOffsetY: 0,
  },
  {
    id: "jefe-supremo",
    name: "El jefe supremo",
    role: "Director de mimos",
    area: "Dirección",
    line: "Aquí nadie mueve un hilo sin su aprobación.",
    description:
      "Supervisa el taller, recibe a las visitas y se asegura de que nadie trabaje sin una pausa para acariciarlo. Cobra en premios y tiene la última palabra. Bueno, el último ladrido.",
    photo: "/team/jefe-supremo.webp",
    photoScale: 1,
    photoOffsetY: 0,
    mascot: true,
  },
];
