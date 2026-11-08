#!/usr/bin/env node
/**
 * Extrae el catálogo de las páginas de tienda de seritene.com (ropa y merchandising)
 * y lo guarda como JSON estático para las rutas clonadas:
 *
 *   public/sites/seritene/shop-data/ropa.json
 *   public/sites/seritene/shop-data/merchandising.json
 *   public/sites/seritene/shop-data/pages.json   (apartados y guías que muestra el buscador)
 *
 * Lee el `initialData` que cada página lleva en su carga RSC (también ?pagina=N),
 * así que reproduce exactamente el orden y los productos de producción.
 *
 * Uso: node scripts/extract-shop-data.mjs [--cache <dir>]
 *   --cache  guarda/reutiliza el HTML descargado en <dir> (útil para repetir sin red).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ORIGIN = "https://seritene.com";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public/sites/seritene/shop-data");
const PER_PAGE = 50;

const args = process.argv.slice(2);
const cacheDir = args.includes("--cache") ? args[args.indexOf("--cache") + 1] : null;
if (cacheDir) mkdirSync(cacheDir, { recursive: true });

/** Categorías por grupo: slug local → [id del catálogo, nombre] (igual que shop-categories en producción). */
const GROUPS = {
  ropa: {
    brand: "roly",
    categories: {
      camisetas: ["t_shirts", "Camisetas"],
      sudaderas: ["sud_cha", "Sudaderas"],
      polos: ["pol_s", "Polos"],
      pantalones: ["pant_c", "Pantalones"],
      abrigos: ["coats", "Abrigos y chaquetas"],
      deporte: ["sports", "Ropa deportiva"],
      laboral: ["workwear", "Ropa laboral"],
    },
  },
  merchandising: {
    brand: "stamina",
    categories: {
      bolsas: ["bags", "Bolsas"],
      gorras: ["travel_caps", "Gorras"],
      tazas: ["mugs", "Tazas"],
      botellas: ["bottles", "Botellas"],
      libretas: ["notebooks", "Libretas"],
      boligrafos: ["ball_pens", "Bolígrafos"],
      llaveros: ["keyrings", "Llaveros"],
      mochilas: ["bags_travel_backpack", "Mochilas"],
      tecnologia: ["technology", "Tecnología"],
    },
  },
};

/** Términos con los que se consulta el buscador de producción para recoger sus apartados y guías. */
const PAGE_TERMS = [
  "camiseta", "sudadera", "polo", "pantalon", "abrigo", "chaqueta", "deporte", "laboral", "gorra",
  "bolsa", "taza", "botella", "libreta", "boligrafo", "llavero", "mochila", "tecnologia", "regalo",
  "merchandising", "ropa", "imprenta", "flyer", "diptico", "triptico", "tarjeta", "pulsera", "abanico",
  "fullprint", "dtf", "bandera", "roll", "photocall", "carpa", "lona", "carton", "poster", "imantado",
  "evento", "vaso", "trofeo", "placa", "medalla", "serigrafia", "bordado", "diseño", "pedido", "cuidar",
  "rotulacion", "toalla", "delantal", "pañuelo", "bufanda", "lanyard", "tenerife", "empresa", "club",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Descarga (o lee de la caché) y valida con `parse`; reintenta si la respuesta no sirve. */
async function get(url, parse = (text) => text) {
  const file = cacheDir && join(cacheDir, url.replace(/[^a-z0-9]+/gi, "_") + ".txt");
  if (file && existsSync(file)) return parse(readFileSync(file, "utf8"));
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 seritene-clone-extractor" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const value = parse(text);
      if (file) writeFileSync(file, text);
      return value;
    } catch (error) {
      if (attempt >= 8) throw new Error(`${url}: ${error.message}`);
      await sleep(1000 * attempt);
    }
  }
}

/** Reconstruye la carga RSC de la página y devuelve el `initialData` del catálogo. */
function initialData(html, url) {
  const chunks = [...html.matchAll(/\.rsc\.push\(("(?:[^"\\]|\\.)*")\)<\/script>/g)].map((m) => JSON.parse(m[1]));
  const rsc = chunks.join("");
  // A veces producción responde con `initialData: null` (lo carga en el cliente): se reintenta.
  const start = rsc.indexOf('"initialData":{');
  if (start < 0) throw new Error(`Sin initialData en ${url}`);
  // Recorre el objeto JSON equilibrando llaves.
  let i = rsc.indexOf("{", start);
  let depth = 0;
  let inString = false;
  for (let j = i; j < rsc.length; j++) {
    const ch = rsc[j];
    if (inString) {
      if (ch === "\\") j++;
      else if (ch === '"') inString = false;
    } else if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) return JSON.parse(rsc.slice(i, j + 1));
  }
  throw new Error(`initialData incompleto en ${url}`);
}

const modelKey = (item) => (item.brand === "jhk" ? item.code : item.code.match(/\d{4}/)?.[0] || item.code);

async function extractGroup(group, { brand, categories }) {
  const products = {};
  const lists = {};
  const routes = [["", `/${group}/`], ...Object.entries(categories).map(([slug, [id]]) => [id, `/${group}/${slug}/`])];
  for (const [id, path] of routes) {
    const first = await get(ORIGIN + path, (html) => initialData(html, path));
    const pages = Math.ceil(first.models.length / PER_PAGE);
    lists[id] = first.models;
    const datasets = [first];
    for (let page = 2; page <= pages; page++) {
      const pageUrl = `${path}?pagina=${page}`;
      datasets.push(await get(ORIGIN + pageUrl, (html) => initialData(html, pageUrl)));
    }
    for (const data of datasets) {
      for (const item of data.items) {
        products[modelKey(item)] = {
          brand: item.brand || brand,
          code: item.code,
          name: item.name,
          description: item.description,
          composition: item.composition || "",
          image: item.image || "",
          fromPrice: item.fromPrice ?? null,
          colors: item.colors ?? [],
        };
      }
    }
    console.log(`${path}: ${first.models.length} modelos, ${pages} página(s)`);
  }
  // Palabras clave para el buscador, como las de producción: referencia, composición, colores
  // y nombres de las categorías de la web en las que aparece el modelo.
  const memberships = Object.values(categories).map(([id, name]) => [new Set(lists[id]), name]);
  const out = {};
  for (const [key, p] of Object.entries(products)) {
    const cats = memberships.filter(([models]) => models.has(key)).map(([, name]) => name);
    out[key] = {
      brand: p.brand,
      code: p.code,
      name: p.name,
      description: p.description,
      image: p.image,
      fromPrice: p.fromPrice,
      keywords: [key, p.composition, ...p.colors, ...cats].filter(Boolean).join(" "),
    };
  }
  return { brand, lists, products: out };
}

async function extractPages() {
  const pages = new Map();
  for (const term of PAGE_TERMS) {
    const url = `${ORIGIN}/api/search?${new URLSearchParams({ q: term, scope: "all", page: "0", cursor: "0", scan: "0" })}`;
    try {
      const data = await get(url, JSON.parse);
      for (const item of data.items ?? []) {
        if (item.kind === "page" && !pages.has(item.path)) {
          pages.set(item.path, {
            path: item.path,
            name: item.name,
            description: item.description,
            label: item.brand,
            keywords: item.keywords,
          });
        }
      }
    } catch (error) {
      console.warn(`Búsqueda «${term}» omitida: ${error.message}`);
    }
    await sleep(150);
  }
  return [...pages.values()].sort((a, b) => a.path.localeCompare(b.path));
}

mkdirSync(OUT, { recursive: true });
for (const [group, config] of Object.entries(GROUPS)) {
  const data = await extractGroup(group, config);
  writeFileSync(join(OUT, `${group}.json`), JSON.stringify(data));
  console.log(`${group}.json: ${Object.keys(data.products).length} productos`);
}
const pages = await extractPages();
writeFileSync(join(OUT, "pages.json"), JSON.stringify(pages));
console.log(`pages.json: ${pages.length} apartados`);
