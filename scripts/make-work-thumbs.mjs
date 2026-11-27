#!/usr/bin/env node
/**
 * Copias pequeñas (WebP, 400 px de ancho) de las fotos de trabajos reales para las rejillas de la galería
 * (/trabajos/, bloques «Trabajos reales» y tira de la portada) → public/sites/seritene/trabajos/proyecto-XX-400.webp
 * (commiteadas). Origen: proyecto-XX-full.webp. El lightbox sigue usando la versión `full` y las rejillas
 * anchas la `thumb` (740 px) mediante srcSet.
 *
 * Uso: node scripts/make-work-thumbs.mjs [--force]
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const DIR = join(dirname(fileURLToPath(import.meta.url)), "../public/sites/seritene/trabajos");
const force = process.argv.includes("--force");
let total = 0;
for (const file of readdirSync(DIR)) {
  const m = /^proyecto-(\d+)-full\.webp$/.exec(file);
  // 06 es una presentación digital (no una foto de un trabajo): no sale en las rejillas.
  if (!m || m[1] === "06") continue;
  const out = join(DIR, `proyecto-${m[1]}-400.webp`);
  if (!force && existsSync(out)) {
    total += statSync(out).size;
    continue;
  }
  await sharp(join(DIR, file)).resize({ width: 400, withoutEnlargement: true }).webp({ quality: 72, effort: 6 }).toFile(out);
  const size = statSync(out).size;
  total += size;
  console.log(`${out.replace(DIR, "trabajos")}  ${(size / 1024).toFixed(1)} KB`);
}
console.log(`Total copias 400 px: ${(total / 1024).toFixed(1)} KB`);
