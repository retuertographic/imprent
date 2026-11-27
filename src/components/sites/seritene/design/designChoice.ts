/**
 * Paso «Tu diseño» (mejora propia): elección de diseño del cliente, línea que se añade al mensaje del
 * pedido y consejos automáticos sobre el archivo. Funciones puras (sin DOM), compartidas por las fichas,
 * los configuradores y el carrito.
 *
 * El archivo nunca se sube: se lee en el navegador y el cliente lo envía él mismo por WhatsApp o email.
 * En el carrito solo se guarda la elección y los datos del archivo (nombre, tipo, tamaño y píxeles).
 */
import { MAILTO_MAX, mailtoUrl } from "../content";

export type DesignOption = "logo" | "service" | "idea";

/** Datos del archivo elegido que van al mensaje y al carrito (nunca el archivo). */
export type DesignFileInfo = {
  name: string;
  /** Tipo MIME tal como lo da el navegador (vacío en AI/EPS en muchos sistemas). */
  type: string;
  /** Bytes. */
  size: number;
  /** Píxeles de las imágenes rasterizadas (PNG, JPG, WebP…). */
  width?: number;
  height?: number;
};

export type DesignChoice = { option: DesignOption; file?: DesignFileInfo };

export const DESIGN_OPTIONS: { value: DesignOption; label: string; hint: string }[] = [
  { value: "logo", label: "Ya tengo mi logo o diseño", hint: "Lo revisamos y te enviamos una prueba antes de producir." },
  { value: "service", label: "Necesito que me lo diseñéis", hint: "El diseño se presupuesta aparte." },
  { value: "idea", label: "Solo tengo una idea", hint: "Cuéntanosla y te orientamos." },
];

/** Formatos que admite el selector de archivo. */
export const DESIGN_ACCEPT = "image/*,application/pdf,.ai,.eps,.svg";

/** Nombre de archivo apto para una línea de mensaje (sin saltos de línea ni longitudes absurdas). */
export const cleanFileName = (name: string) => {
  const flat = name.replace(/[\r\n\t]+/g, " ").trim();
  return flat.length > 80 ? `${flat.slice(0, 60)}…${flat.slice(-15)}` : flat;
};

const es = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 });

/** «Diseño: tengo mi logo (logo-empresa.png, 1200×800 px)» / «Diseño: necesito diseño» / «Diseño: solo una idea». */
export function designLine(choice: DesignChoice) {
  if (choice.option === "service") return "Diseño: necesito diseño";
  if (choice.option === "idea") return "Diseño: solo una idea";
  const file = choice.file;
  if (!file) return "Diseño: tengo mi logo";
  const px = file.width && file.height ? `, ${file.width}×${file.height} px` : "";
  return `Diseño: tengo mi logo (${cleanFileName(file.name)}${px})`;
}

/** Mensaje del pedido con la línea de diseño al final (sin elección, el mensaje tal cual). */
export const withDesignLine = (message: string, choice: DesignChoice | null | undefined) =>
  choice ? `${message}\n${designLine(choice)}` : message;

/** Recordatorio que acompaña a WhatsApp y al email cuando el cliente tiene logo. */
export const ATTACH_REMINDER = "Adjunta tu logo en el chat: el mensaje ya va escrito, solo falta el archivo.";

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const px = (v: unknown) => v === undefined || (Number.isSafeInteger(v) && (v as number) > 0 && (v as number) <= 100000);

/** Comprobación del campo guardado en el carrito (un valor no válido se descarta sin perder la selección). */
export function isDesignChoice(value: unknown): value is DesignChoice {
  if (!isObj(value) || !["logo", "service", "idea"].includes(String(value.option))) return false;
  const f = value.file;
  if (f === undefined) return true;
  return (
    value.option === "logo" &&
    isObj(f) &&
    typeof f.name === "string" &&
    f.name.length <= 300 &&
    typeof f.type === "string" &&
    f.type.length <= 200 &&
    Number.isSafeInteger(f.size) &&
    (f.size as number) >= 0 &&
    px(f.width) &&
    px(f.height)
  );
}

export type FileKind = "raster" | "svg" | "pdf" | "vector" | "other";

/** Tipo de archivo por MIME y extensión (AI/EPS suelen llegar sin MIME o como `application/postscript`). */
export function fileKind(name: string, type: string): FileKind {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  if (type === "image/svg+xml" || ext === "svg") return "svg";
  if (ext === "ai" || ext === "eps" || /postscript|illustrator/.test(type)) return "vector";
  if (type === "application/pdf" || ext === "pdf") return "pdf";
  if (type.startsWith("image/") || ["png", "jpg", "jpeg", "webp", "gif", "bmp", "avif", "heic", "heif", "tif", "tiff"].includes(ext)) {
    return "raster";
  }
  return "other";
}

export const KIND_LABEL: Record<FileKind, string> = {
  raster: "Imagen",
  svg: "SVG (vectorial)",
  pdf: "PDF",
  vector: "Vectorial (AI / EPS)",
  other: "Archivo",
};

/** 1536 → «1,5 KB» */
export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${es.format(bytes / 1024)} KB`;
  return `${es.format(bytes / (1024 * 1024))} MB`;
}

/** Tamaño de impresión cuando se conoce (formato del flyer, tamaño máximo del marcaje…). */
export type PrintSize = { widthMm: number; heightMm: number; label: string };

/** Lo que el navegador ha podido leer del archivo. */
export type FileAnalysis = DesignFileInfo & {
  kind: FileKind;
  /** `true`/`false` en PNG, WebP, GIF y AVIF; `null` si no aplica o no se pudo leer. */
  alpha: boolean | null;
  /** El navegador no pudo abrir la imagen (HEIC fuera de Safari, archivo dañado…). */
  unreadable: boolean;
};

export type DesignTip = { tone: "ok" | "warn" | "info"; text: string };

/** Por debajo de esta resolución (ppp) a tamaño de impresión se avisa de que puede verse pixelado. */
export const LOW_DPI = 150;
const GOOD_DPI = 300;
/** Muchos servidores de correo rechazan adjuntos de más de ~20 MB. */
const EMAIL_LIMIT = 20 * 1024 * 1024;

const cm = (mm: number) => es.format(Math.round(mm) / 10);

/**
 * Consejos verificables en el navegador: resolución (y si es baja para el tamaño de impresión elegido),
 * transparencia y formato. Avisan, nunca bloquean.
 */
export function designTips(a: FileAnalysis, printSize?: PrintSize | null): DesignTip[] {
  const tips: DesignTip[] = [];
  if (a.kind === "svg") tips.push({ tone: "ok", text: "SVG vectorial: el mejor formato, se imprime nítido a cualquier tamaño." });
  if (a.kind === "vector") {
    tips.push({ tone: "ok", text: "Formato vectorial de diseño (AI / EPS): perfecto para imprimir a cualquier tamaño." });
    tips.push({ tone: "info", text: "Tu navegador no puede mostrar la vista previa, pero nosotros sí lo abrimos." });
  }
  if (a.kind === "pdf") {
    tips.push({ tone: "ok", text: "PDF: si se exportó como vectorial desde tu programa de diseño, se imprime nítido a cualquier tamaño." });
  }
  if (a.kind === "other") {
    tips.push({ tone: "warn", text: "No reconocemos este tipo de archivo. Mejor en PNG, JPG, PDF, SVG, AI o EPS." });
  }
  if (a.kind === "raster") {
    if (a.unreadable || !a.width || !a.height) {
      tips.push({ tone: "info", text: "Tu navegador no puede leer esta imagen para comprobar su resolución; la revisaremos nosotros." });
    } else {
      const w = a.width;
      const h = a.height;
      tips.push({
        tone: "info",
        text: `${w}×${h} px: a ${GOOD_DPI} ppp da para imprimir con buena calidad hasta ${cm((w / GOOD_DPI) * 254)} × ${cm((h / GOOD_DPI) * 254)} cm.`,
      });
      if (printSize) {
        // El diseño se encaja en la zona: manda el lado que más se estira.
        const dpi = Math.round(25.4 * Math.max(w / printSize.widthMm, h / printSize.heightMm));
        tips.push(
          dpi < LOW_DPI
            ? {
                tone: "warn",
                text: `Resolución baja para ${printSize.label}: unos ${dpi} ppp, puede verse pixelado. Si tienes una versión más grande o vectorial, mejor (puedes enviarla igualmente).`,
              }
            : { tone: "ok", text: `Resolución suficiente para ${printSize.label} (unos ${Math.min(dpi, 999)} ppp).` },
        );
      } else if (Math.max(w, h) < 1000) {
        tips.push({ tone: "warn", text: "Imagen pequeña: para tamaños grandes puede verse pixelada. Si tienes una versión más grande o vectorial, mejor." });
      }
    }
    if (a.alpha === true) tips.push({ tone: "ok", text: "Tiene fondo transparente: se imprime solo el logo, sin recuadro." });
    else if (a.alpha === false) {
      tips.push({ tone: "info", text: "No tiene transparencia: el fondo de la imagen también se imprimirá. Si hay que quitarlo, avísanos." });
    } else if (/jpe?g/i.test(a.type) || /\.jpe?g$/i.test(a.name)) {
      tips.push({ tone: "info", text: "Los JPG no tienen transparencia: el fondo de la imagen también se imprimirá. Si hay que quitarlo, avísanos." });
    }
    tips.push({ tone: "info", text: "Si tienes el logo en PDF, AI, SVG o EPS (vectorial), envíanos ese: se imprime nítido a cualquier tamaño." });
  }
  if (a.size > EMAIL_LIMIT) {
    tips.push({ tone: "warn", text: `Archivo de ${formatBytes(a.size)}: puede ser demasiado grande para algunos correos. Por WhatsApp envíalo como documento.` });
  }
  return tips;
}

/** Asunto de los emails de pedido desde las fichas. */
export const designEmailSubject = (name: string) => `Pedido Seritene: ${name}`.slice(0, 120);

/**
 * Enlace «Enviar por email» con el resumen y el recordatorio de adjuntar el logo. Si el enlace superaría
 * `MAILTO_MAX`, lleva un texto corto y `isLong` (la ficha ofrece copiar el resumen para pegarlo).
 */
export function designEmail(subject: string, message: string, choice: DesignChoice | null | undefined) {
  const attach = choice?.option === "logo" ? "\n\nOs adjunto mi logo en este correo." : "";
  const full = mailtoUrl(subject, `${message}${attach}`);
  if (full.length <= MAILTO_MAX) return { url: full, isLong: false };
  const short = [
    "Hola Seritene, quiero solicitar este pedido. Pego el resumen a continuación.",
    ...(choice ? [designLine(choice)] : []),
  ].join("\n");
  return { url: mailtoUrl(subject, `${short}${attach}`), isLong: true };
}

/** Mockup orientativo: zona de marcaje sobre la foto del producto, en % de la foto. */
export type MockupZone = { left: number; top: number; width: number };

/**
 * Zona aproximada de la foto (vista de frente) para la posición de un marcaje; `null` si la foto no la
 * muestra (espalda, mangas, muslos) y no se pinta vista previa.
 */
export function mockupZone(position: string): MockupZone | null {
  const p = position.toLowerCase();
  if (/espalda|manga|muslo|pantal/.test(p)) return null;
  // «Pecho izquierdo» es el de quien lleva la prenda: en la foto de frente queda a la derecha.
  if (/pecho izquierdo \+ derecho/.test(p)) return null;
  if (/pecho izquierdo/.test(p)) return { left: 61, top: 33, width: 13 };
  if (/pecho derecho/.test(p)) return { left: 39, top: 33, width: 13 };
  if (/delanter|frontal|cara principal/.test(p)) return { left: 50, top: 42, width: 30 };
  return null;
}
