/**
 * Pistas de público para el buscador: qué modelos de ropa tienen tallas infantiles y cuáles son
 * de mujer. Se calculan con las fichas del proveedor (src/components/sites/seritene/merch/data/
 * {roly,jhk}/*.json: tallas, categorías, nombre y descripción) y se guardan en el índice como
 * el campo `a` del registro compacto (ver shop/searchIndex.ts):
 *   k  tiene tallas infantiles (3/4, 5/6, 4, 8, 12, 3-4, meses…) además de las de adulto
 *   K  solo tiene tallas infantiles
 *   w  modelo de mujer (nombre «WOMAN»/«LADY»/«mujer» o la descripción dice «mujer»)
 * Las categorías del proveedor «cam_w» y «w_coats» no sirven: son de invierno, no de mujer.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** Talla infantil: edades (2–16, «3/4», «9-11», «12/14»), meses, años y tallas KID/JR. */
export function isKidsSize(size) {
  const s = String(size).trim().toUpperCase();
  if (/MES|AÑO|ANO|^KIDS?\b|^KID |^JR\b|^BABY/.test(s)) return true;
  const m = s.match(/^(\d+)(?:\s*[/-]\s*(\d+))?$/);
  return Boolean(m && Number(m[1]) <= 14 && (!m[2] || Number(m[2]) <= 16));
}

/** Pistas de un modelo a partir de su ficha (`product` de merch/data). */
export function audienceOf(product) {
  const sizes = (product.sizes || []).filter((s) => !/^UNICA$/i.test(s));
  const kids = sizes.filter(isKidsSize).length;
  let flags = "";
  if (kids) flags += kids === sizes.length ? "K" : "k";
  const text = `${product.name} ${product.description}`;
  if (/\b(WOMAN|LADY|LADIES|MUJER)\b/i.test(product.name) || /\bmujer\b/i.test(product.description || "")) {
    flags += "w";
  }
  return flags || (/\bniñ[oa]s?\b|\binfantil\b/i.test(text) ? "k" : "");
}

/** Mapa id del buscador («roly:1087», «jhk:TSRK190») → pistas, para los modelos que tienen alguna. */
export function audienceHints(root) {
  const hints = new Map();
  for (const brand of ["roly", "jhk"]) {
    const dir = join(root, "src/components/sites/seritene/merch/data", brand);
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir)) {
      if (!file.endsWith(".json")) continue;
      const { id, product } = JSON.parse(readFileSync(join(dir, file), "utf8"));
      const flags = product ? audienceOf(product) : "";
      if (flags) hints.set(`${brand}:${id ?? file.slice(0, -5)}`, flags);
    }
  }
  return hints;
}
