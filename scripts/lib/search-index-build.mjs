/**
 * Convierte los registros de la API de búsqueda en el índice compacto que se publica
 * (public/sites/seritene/shop-data/search-index.json). Usa las mismas funciones que el
 * navegador (src/components/sites/seritene/shop/searchIndex.ts, cargado con jiti) y añade las
 * pistas de público de los modelos de ropa (scripts/lib/search-hints.mjs).
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";
import { audienceHints } from "./search-hints.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const jiti = createJiti(import.meta.url);
const { compactRecord, expandRecord } = await jiti.import(join(ROOT, "src/components/sites/seritene/shop/searchIndex.ts"));

const ORIGIN = "https://seritene.com";
const FIELDS = ["kind", "name", "path", "image", "description", "brand", "keywords", "code", "audience"];

/** Compacta y comprueba que el registro se reconstruye igual (el detalle solo se guarda si no hay descripción). */
function checkedCompact(record) {
  const compact = compactRecord(record);
  const back = expandRecord(compact);
  for (const field of FIELDS) {
    if (back[field] !== record[field]) throw new Error(`${record.id}: «${field}» no se reconstruye (${back[field]} ≠ ${record[field]})`);
  }
  return compact;
}

/**
 * @param {object[]} raw  registros tal cual los devuelve la API
 * @param {string} root   raíz del proyecto (para leer shop-data y comprobar imágenes locales)
 */
export function buildIndex(raw, root) {
  const data = join(root, "public/sites/seritene/shop-data");
  // Referencias del proveedor (SU1031…): la API las busca pero no las devuelve.
  const codes = new Map();
  for (const group of ["ropa", "merchandising"]) {
    const { products } = JSON.parse(readFileSync(join(data, `${group}.json`), "utf8"));
    for (const [key, p] of Object.entries(products)) codes.set(`${p.brand}:${key}`, p.code);
  }
  const hints = audienceHints(root);
  const missingImages = new Set();
  const records = raw.map((item) => {
    let image = item.image || "";
    // Imágenes propias de seritene.com: desde public si están copiadas; si no, desde producción.
    if (image.startsWith("/") && !existsSync(join(root, "public/sites/seritene", image))) {
      missingImages.add(image);
      image = ORIGIN + image;
    }
    const code = codes.get(item.id) || "";
    return checkedCompact({
      id: item.id,
      kind: item.kind === "page" ? "page" : "product",
      name: item.name,
      path: item.path,
      image,
      description: item.description || "",
      detail: item.detail || "",
      brand: item.brand || "",
      keywords: item.keywords || "",
      code: code && code !== item.id.slice(item.id.indexOf(":") + 1) ? code : "",
      audience: hints.get(item.id) || "",
    });
  });
  return { index: { version: 2, records }, missingImages: [...missingImages].sort() };
}

/** Recalcula las pistas de público de un índice ya publicado (sin volver a consultar la API). */
export function refreshHints(index, root) {
  const hints = audienceHints(root);
  const records = index.records.map((compact) => checkedCompact({ ...expandRecord(compact), audience: hints.get(compact[0]) || "" }));
  return { version: 2, records };
}
