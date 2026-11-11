#!/usr/bin/env node
/**
 * Copia local del «Estudio DTF · Seritene» (app estática hecha para el cliente).
 *
 *   node scripts/mirror-dtf-studio.mjs            # descarga y escribe public/estudio-dtf/
 *   node scripts/mirror-dtf-studio.mjs --check    # solo compara con lo que hay en disco
 *
 * Parte de index.html y sigue recursivamente todas las URL relativas del mismo origen:
 * href/src del HTML, url()/@import del CSS e import estáticos, import() dinámicos,
 * new Worker('./x.mjs') y new URL('./x', import.meta.url) de los módulos.
 * Los archivos se guardan tal cual llegan (con finales de línea LF, como los normaliza el repo), salvo:
 *  - index.html: se quita el <script> que inyecta Cloudflare (/cdn-cgi/challenge-platform),
 *    que no es de la app y daría 404 fuera de su host;
 *  - index.html: los enlaces a seritene.com (logo, «Volver a Seritene», Privacidad) pasan a
 *    rutas relativas del clon (../ y ../politica-privacidad/), válidas con o sin basePath.
 * WhatsApp, email y los recursos de terceros (Google Fonts; Transformers.js en jsDelivr y el
 * modelo BEN2 en Hugging Face para «Eliminar fondo») se dejan como están.
 */
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ORIGIN = "https://seritene-dtf-studio.cesarfr.chatgpt.site/";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public", "estudio-dtf");
const CHECK = process.argv.includes("--check");

/** Sustituciones en index.html: [descripción, buscar, reemplazar, veces esperadas]. */
const HTML_PATCHES = [
  ["logo y «Volver a Seritene» → home del clon", 'href="https://seritene.com/"', 'href="../"', 2],
  [
    "Privacidad → política de privacidad del clon",
    'href="https://seritene.com/politica-privacidad/"',
    'href="../politica-privacidad/"',
    1,
  ],
];
const CLOUDFLARE_SCRIPT = /<script>\(function\(\)\{function c\(\)\{[\s\S]*?\/cdn-cgi\/challenge-platform\/[\s\S]*?<\/script>/g;

const TEXT = /\.(html|css|m?js|json|svg|txt)$/i;

/** URL relativas que carga cada tipo de archivo. */
function references(file, text) {
  const refs = new Set();
  const add = (u) => {
    if (!u || /^(data:|blob:|mailto:|tel:|#|javascript:)/i.test(u)) return;
    refs.add(u);
  };
  if (file.endsWith(".html")) {
    for (const m of text.matchAll(/\b(?:href|src)\s*=\s*"([^"]+)"/g)) {
      // Solo recursos: los <a href> a otras webs no se descargan (se filtran por origen abajo).
      add(m[1]);
    }
  }
  if (file.endsWith(".css")) {
    for (const m of text.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) add(m[1]);
    for (const m of text.matchAll(/@import\s+['"]([^'"]+)['"]/g)) add(m[1]);
  }
  if (/\.m?js$/.test(file)) {
    for (const m of text.matchAll(/\b(?:import|export)\s[^'"`;]*?from\s*['"]([^'"]+)['"]/g)) add(m[1]);
    for (const m of text.matchAll(/\bimport\s*['"]([^'"]+)['"]/g)) add(m[1]);
    for (const m of text.matchAll(/\bimport\(\s*['"]([^'"]+)['"]\s*\)/g)) add(m[1]);
    for (const m of text.matchAll(/new\s+(?:Shared)?Worker\(\s*['"]([^'"]+)['"]/g)) add(m[1]);
    for (const m of text.matchAll(/new\s+URL\(\s*['"]([^'"]+)['"]\s*,\s*import\.meta\.url/g)) add(m[1]);
    for (const m of text.matchAll(/\bfetch\(\s*['"]([^'"]+)['"]/g)) add(m[1]);
    // Cualquier otra cadena './algo.ext' (imágenes, wasm, json…).
    for (const m of text.matchAll(/['"](\.{1,2}\/[\w./-]+\.[a-z0-9]{2,5})['"]/gi)) add(m[1]);
  }
  return [...refs];
}

async function download(url) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

function patchIndex(text) {
  let out = text.replace(CLOUDFLARE_SCRIPT, "");
  for (const [label, find, replace, times] of HTML_PATCHES) {
    const count = out.split(find).length - 1;
    if (count !== times) {
      console.warn(`! «${label}»: se esperaban ${times} coincidencias y hay ${count}; revisa index.html`);
    }
    out = out.split(find).join(replace);
  }
  if (/cdn-cgi|seritene-dtf-studio|chatgpt\.site/.test(out)) {
    console.warn("! index.html sigue mencionando el host original o Cloudflare; revísalo");
  }
  return out;
}

const files = new Map(); // ruta relativa -> Buffer
const queue = ["index.html"];
const external = new Set();
while (queue.length) {
  const rel = queue.shift();
  if (files.has(rel)) continue;
  const url = new URL(rel, ORIGIN).href;
  const body = await download(url === ORIGIN + "index.html" ? ORIGIN : url);
  files.set(rel, body);
  if (!TEXT.test(rel)) continue;
  for (const ref of references(rel, body.toString("utf8"))) {
    const target = new URL(ref, url);
    if (target.origin !== new URL(ORIGIN).origin) {
      external.add(target.origin + target.pathname);
      continue;
    }
    const next = decodeURIComponent(target.pathname.replace(/^\//, "")) || "index.html";
    if (!files.has(next) && !queue.includes(next)) queue.push(next);
  }
}

// El repo normaliza a LF (.gitattributes: text=auto); el origen sirve CRLF. Sin efecto en el navegador.
for (const [rel, body] of files) {
  if (TEXT.test(rel)) files.set(rel, Buffer.from(body.toString("utf8").replace(/\r\n/g, "\n")));
}
files.set("index.html", Buffer.from(patchIndex(files.get("index.html").toString("utf8"))));

let existing = [];
try {
  existing = await readdir(OUT, { recursive: true });
} catch {
  /* primera vez */
}
let changed = 0;
for (const [rel, body] of [...files].sort()) {
  const dest = path.join(OUT, rel);
  let prev = null;
  try {
    prev = await readFile(dest);
  } catch {
    /* nuevo */
  }
  const status = prev === null ? "nuevo" : prev.equals(body) ? "igual" : "cambiado";
  if (status !== "igual") changed++;
  console.log(`${status.padEnd(8)} ${String(body.length).padStart(7)} B  ${rel}`);
  if (!CHECK && status !== "igual") {
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, body);
  }
}
const stale = existing.filter((f) => /\.\w+$/.test(f) && !files.has(f.split(path.sep).join("/")));
for (const f of stale) console.log(`sobra    ${f} (ya no lo carga la app; bórralo a mano si procede)`);
console.log(`\nEnlaces y recursos de terceros (se quedan en su origen): ${[...external].sort().join(", ") || "ninguno"}`);
console.log(`${files.size} archivos, ${changed} nuevos o cambiados${CHECK ? " (modo --check: no se ha escrito nada)" : ""}.`);
if (CHECK && changed) process.exitCode = 1;
