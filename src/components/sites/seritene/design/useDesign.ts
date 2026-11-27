"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fileKind, type DesignChoice, type DesignOption, type FileAnalysis } from "./designChoice";

/** Estado del paso «Tu diseño»: elección, archivo (solo en memoria) y lo que se ha leído de él. */
export type DesignState = {
  option: DesignOption | null;
  setOption: (option: DesignOption) => void;
  file: File | null;
  /** `null` mientras no hay archivo o se está leyendo. */
  analysis: FileAnalysis | null;
  /** URL local (`blob:`) para la miniatura de imágenes y SVG. */
  previewUrl: string | null;
  reading: boolean;
  /** El navegador puede compartir este archivo (Web Share API con archivos, normalmente en móvil). */
  shareable: boolean;
  selectFile: (file: File | null) => void;
  /** Lo que va al mensaje y al carrito; `null` si no se ha elegido. */
  choice: DesignChoice | null;
};

const ALPHA_TYPES = /image\/(png|webp|gif|avif)/;

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo leer la imagen"));
    img.src = url;
  });
}

/** ¿Algún píxel semitransparente? Se mira una copia reducida (máx. 256 px) para no bloquear el móvil. */
function hasAlpha(img: HTMLImageElement) {
  const scale = Math.min(1, 256 / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;
  for (let i = 3; i < data.length; i += 4) if (data[i] < 255) return true;
  return false;
}

function canShareFile(file: File) {
  try {
    return typeof navigator.canShare === "function" && typeof navigator.share === "function" && navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

/** Lee el archivo en el navegador (nada se sube): tipo, píxeles y transparencia. */
async function analyze(file: File, url: string | null): Promise<FileAnalysis> {
  const kind = fileKind(file.name, file.type);
  const base: FileAnalysis = { name: file.name, type: file.type, size: file.size, kind, alpha: null, unreadable: false };
  if (kind !== "raster" || !url) return base;
  try {
    const img = await loadImage(url);
    let alpha: boolean | null = null;
    if (ALPHA_TYPES.test(file.type)) {
      try {
        alpha = hasAlpha(img);
      } catch {
        alpha = null;
      }
    }
    return { ...base, width: img.naturalWidth || undefined, height: img.naturalHeight || undefined, alpha };
  } catch {
    return { ...base, unreadable: true };
  }
}

export function useDesign(initial: DesignOption | null = "logo"): DesignState {
  const [option, setOption] = useState<DesignOption | null>(initial);
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<FileAnalysis | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [shareable, setShareable] = useState(false);
  const latest = useRef<File | null>(null);

  // Libera la URL local de la miniatura al cambiar de archivo o salir de la página.
  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const selectFile = useCallback((next: File | null) => {
    latest.current = next;
    setFile(next);
    setAnalysis(null);
    setShareable(next ? canShareFile(next) : false);
    const kind = next ? fileKind(next.name, next.type) : "other";
    const url = next && (kind === "raster" || kind === "svg") ? URL.createObjectURL(next) : null;
    setPreviewUrl(url);
    if (!next) return;
    analyze(next, url).then((result) => {
      if (latest.current === next) setAnalysis(result);
    });
  }, []);

  const choice: DesignChoice | null = option
    ? option === "logo" && file
      ? {
          option,
          file: {
            name: file.name,
            type: file.type,
            size: file.size,
            ...(analysis?.width && analysis.height ? { width: analysis.width, height: analysis.height } : {}),
          },
        }
      : { option }
    : null;

  return { option, setOption, file, analysis, previewUrl, reading: !!file && !analysis, shareable, selectFile, choice };
}
