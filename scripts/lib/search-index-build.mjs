/**
 * Convierte los registros de la API de búsqueda en el índice compacto que se publica
 * (public/sites/seritene/shop-data/search-index.json). Usa las mismas funciones que el
 * navegador (src/components/sites/seritene/shop/searchIndex.ts; Node ≥ 22.18 carga .ts).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { compactRecord, expandRecord } from "../../src/components/sites/seritene/shop/searchIndex.ts";

const ORIGIN = "https://seritene.com";

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
  const missingImages = new Set();
  const records = raw.map((item) => {
    let image = item.image || "";
    // Imágenes propias de seritene.com: desde public si están copiadas; si no, desde producción.
    if (image.startsWith("/") && !existsSync(join(root, "public/sites/seritene", image))) {
      missingImages.add(image);
      image = ORIGIN + image;
    }
    const code = codes.get(item.id) || "";
    const record = {
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
    };
    const compact = compactRecord(record);
    // Comprobación: el registro se reconstruye igual (el detalle solo se guarda si no hay descripción).
    const back = expandRecord(compact);
    for (const field of ["kind", "name", "path", "image", "description", "brand", "keywords", "code"]) {
      if (back[field] !== record[field]) throw new Error(`${item.id}: «${field}» no se reconstruye (${back[field]} ≠ ${record[field]})`);
    }
    return compact;
  });
  return { index: { version: 1, records }, missingImages: [...missingImages].sort() };
}
