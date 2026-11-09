/**
 * Cliente del buscador de producción (https://seritene.com/api/search) para los scripts de
 * extracción y de fixtures. Guarda cada respuesta en una carpeta de caché para no repetir
 * peticiones, limita la concurrencia y espera un poco entre llamadas.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const API = "https://seritene.com/api/search";
export const API_PER_PAGE = 50;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function createSearchClient({ cacheDir, concurrency = 4, delayMs = 150, refresh = false } = {}) {
  if (cacheDir) mkdirSync(cacheDir, { recursive: true });
  let active = 0;
  const waiting = [];
  let requests = 0;

  async function slot(fn) {
    if (active >= concurrency) await new Promise((r) => waiting.push(r));
    active++;
    try {
      return await fn();
    } finally {
      active--;
      waiting.shift()?.();
    }
  }

  /** Una llamada a la API (con caché en disco). */
  async function call(params) {
    const qs = new URLSearchParams(params).toString();
    const file = cacheDir && join(cacheDir, Buffer.from(qs).toString("base64url").slice(0, 200) + ".json");
    if (file && !refresh && existsSync(file)) return JSON.parse(readFileSync(file, "utf8"));
    return slot(async () => {
      for (let attempt = 1; ; attempt++) {
        try {
          const res = await fetch(`${API}?${qs}`, { headers: { "user-agent": "Mozilla/5.0 seritene-clone-extractor" } });
          const body = await res.json();
          if (res.status === 400) {
            // Consulta no válida (p. ej. menos de 2 caracteres): se guarda como sin resultados.
            const empty = { error: body.error, items: [], total: 0, nextCursor: null };
            if (file) writeFileSync(file, JSON.stringify(empty));
            return empty;
          }
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          requests++;
          if (file && body.nextCursor === null) writeFileSync(file, JSON.stringify(body));
          await sleep(delayMs);
          return body;
        } catch (error) {
          if (attempt >= 5) throw error;
          await sleep(1000 * attempt);
        }
      }
    });
  }

  /** Una página completa: repite con el cursor mientras el servidor siga escaneando fichas. */
  async function page(q, scope, n) {
    let body = await call({ q, scope, page: String(n), cursor: "0", scan: "0" });
    let guard = 0;
    while (body.nextCursor !== null && body.nextCursor !== undefined && guard++ < 200) {
      body = await call({ q, scope, page: String(n), cursor: String(body.nextCursor), scan: "1" });
    }
    if (body.partial) throw new Error(`Resultados parciales para «${q}» (página ${n}); vuelve a intentarlo.`);
    return body;
  }

  /** Todos los resultados de una consulta, en el orden de producción. */
  async function search(q, scope = "all") {
    const first = await page(q, scope, 0);
    const items = [...(first.items || [])];
    const pages = Math.ceil((first.total || 0) / API_PER_PAGE);
    const rest = await Promise.all(Array.from({ length: Math.max(0, pages - 1) }, (_, i) => page(q, scope, i + 1)));
    for (const body of rest) items.push(...(body.items || []));
    if (items.length !== (first.total || 0)) {
      throw new Error(`«${q}»: ${items.length} resultados recogidos de ${first.total}`);
    }
    return { total: first.total || 0, items, error: first.error };
  }

  return { call, page, search, stats: () => ({ requests }) };
}
