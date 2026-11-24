/**
 * Mejoras de texto sobre las fichas estáticas extraídas de seritene.com (eventos y medallas).
 * Producción publica notas internas de borrador («… pendientes de validación …») y mezcla
 * «sin impuestos» con «sin IGIC»: al extraer se quitan esas frases y se unifica el vocabulario,
 * para que una nueva extracción no las vuelva a traer.
 */

/** Frases internas que no deben llegar al público. */
const DRAFT_SENTENCE = /[^.]*\bpendientes? de validaci[oó]n\b[^.]*\.?/gi;

/** Texto público de una nota: sin frases de borrador, «sin IGIC» y precio desconocido «A presupuestar». */
export function publicCopy(value) {
  if (typeof value !== "string") return value;
  const out = value
    .replace(DRAFT_SENTENCE, "")
    .replace(/\b([Ss])in impuestos\b/g, (_, s) => `${s}in IGIC`)
    .replace(/\s{2,}/g, " ")
    .trim();
  return /^consultar(?: precio)?$/i.test(out) ? "A presupuestar" : out;
}

/** Aplica `publicCopy` a los textos visibles de una ficha estática y quita las notas que quedan vacías. */
export function publicStaticProduct(product) {
  const list = (items) => (items || []).map(publicCopy).filter(Boolean);
  return {
    ...product,
    priceLead: publicCopy(product.priceLead),
    priceDetail: publicCopy(product.priceDetail),
    table: product.table && {
      ...product.table,
      caption: publicCopy(product.table.caption),
      rows: product.table.rows.map((row) => ({ ...row, cells: row.cells.map(publicCopy) })),
    },
    priceNotes: list(product.priceNotes),
    customization: list(product.customization),
    footNote: publicCopy(product.footNote),
  };
}
