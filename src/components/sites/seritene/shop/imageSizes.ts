/**
 * Tamaños de las fotos de producto: qué archivo pide cada `<img>` de los listados y de los colores de las fichas.
 *
 * - Fotos de proveedor (Stamina, Roly; https://static.gorfactory.es/images/models/…/model/large/…jpg): `large`
 *   mide 600×750 (prendas) o 600×600 (merchandising) y pesa ~70 KB. El proveedor solo publica otra versión,
 *   `small` (100×125 / 100×100, ~15 KB), que vale para los círculos de color (≈50 px CSS) pero no para tarjetas.
 * - Tarjetas de listados (ropa, merchandising, búsqueda, catálogos): copias propias en WebP que caben en un
 *   cuadro de 360 y de 720 px (CARD_THUMBS), generadas por scripts/make-product-thumbs.mjs en
 *   public/sites/seritene/thumbs/ y commiteadas. Con `sizes`, el navegador pide la de 360 en móvil 1x/2x y en
 *   escritorio 1x (~4 KB) y la de 720 en móvil 3x y escritorio 2x (~9 KB, frente a ~70 KB de la JPEG original).
 * - Colores de las fichas: `small` del proveedor; las fotos de JHK (locales, 796×1000) tienen copia propia de
 *   SWATCH_THUMB px de alto.
 *
 * Sin dependencias ni imports: scripts/make-product-thumbs.mjs importa este archivo directamente con Node.
 */

/**
 * Lados de los cuadros en los que caben las copias de tarjeta (px). La tarjeta mide 153 px CSS en móvil y
 * 320 px en escritorio: 360 cubre móvil 2x y escritorio 1x; 720, móvil 3x y escritorio 2x. Las copias no se
 * amplían: si la original es menor (600 o 460 px), la de 720 tiene su tamaño.
 */
export const CARD_THUMBS = [360, 720] as const;
export type CardThumbSize = (typeof CARD_THUMBS)[number];
/** Alto de la copia de los colores de JHK (px). El círculo mide ~50 px CSS. */
export const SWATCH_THUMB = 120;

/**
 * Ancho que ocupa la tarjeta (el `<img>` llena el cuadro con object-fit: contain): 2 columnas hasta 760 px de
 * ventana (márgenes de ~40 px por columna), 3 columnas después, con un máximo de ~320 px (contenedor de 1008 px).
 */
export const CARD_SIZES = "(max-width: 760px) calc(50vw - 40px), (max-width: 1100px) calc(33vw - 40px), 320px";

const GOR = /^https:\/\/static\.gorfactory\.es\/images\/models\/[^/]+\/model\/(?:outlet\/)?large\/([^/]+)\.jpe?g$/i;
const LOCAL = /^\/((?:images|catalogue|fullprint-examples|eventos-catalogo|medallas)\/[^?#]+)\.(?:webp|png|jpe?g)$/i;

/** Algunas variantes traen varias URL separadas por comas: se usa la primera. */
export const firstImage = (src: string) => src.split(",")[0].trim();

/** Ruta (dentro de public/sites/seritene) de la copia de tarjeta de ese tamaño, o null si la foto no tiene copias. */
export function cardThumbPath(src: string, size: CardThumbSize): string | null {
  const s = firstImage(src);
  const gor = s.match(GOR);
  if (gor) return `/thumbs/${size}/gor/${gor[1]}.webp`;
  const local = s.match(LOCAL);
  return local ? `/thumbs/${size}/${local[1]}.webp` : null;
}

/** Copia propia para los colores (solo fotos locales de JHK); las de proveedor usan `small`. */
export function swatchThumbPath(src: string): string | null {
  const local = firstImage(src).match(/^\/(images\/jhk\/[^?#]+)\.webp$/i);
  return local ? `/thumbs/swatch/${local[1]}.webp` : null;
}

/** Convierte una ruta de public/sites/seritene ("/images/…") en URL; las absolutas se dejan tal cual. */
export type ResolveImage = (src: string) => string;

/** Atributos `src`/`srcSet`/`sizes` de la foto de una tarjeta de listado. */
export function cardImageProps(src: string, resolve: ResolveImage): { src: string; srcSet?: string; sizes?: string } {
  const [small, large] = CARD_THUMBS.map((size) => cardThumbPath(src, size));
  if (!small || !large) return { src: resolve(firstImage(src)) };
  // El `w` de cada copia es el lado de su cuadro: con object-fit: contain, es el ancho de tarjeta que llena.
  return {
    src: resolve(small),
    srcSet: `${resolve(small)} ${CARD_THUMBS[0]}w, ${resolve(large)} ${CARD_THUMBS[1]}w`,
    sizes: CARD_SIZES,
  };
}

/** `src` de la miniatura de un color en la ficha. */
export function swatchImageSrc(src: string, resolve: ResolveImage): string {
  const s = firstImage(src);
  if (GOR.test(s)) return s.replace("/large/", "/small/");
  const thumb = swatchThumbPath(s);
  return resolve(thumb ?? s);
}
