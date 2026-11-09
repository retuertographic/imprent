// Utilidades para leer el payload RSC (vinext) incrustado en el HTML servido por seritene.com.
import { readFileSync } from "node:fs";

/** Devuelve las filas RSC del HTML (id → valor JSON o texto). */
export function readRscRows(htmlFile) {
  const html = readFileSync(htmlFile, "utf8");
  const re = /\.rsc\.push\(("(?:[^"\\]|\\.)*")\)/g;
  let payload = "";
  let m;
  while ((m = re.exec(html))) payload += JSON.parse(m[1]);
  const rows = new Map();
  const refs = new Map();
  let i = 0;
  while (i < payload.length) {
    const colon = payload.indexOf(":", i);
    if (colon < 0) break;
    const id = payload.slice(i, colon);
    let rest = colon + 1;
    // Fila de texto: "T<len hex>,<texto>"
    const t = /^T([0-9a-f]+),/.exec(payload.slice(rest, rest + 12));
    if (t) {
      const start = rest + t[0].length;
      // La longitud es en bytes UTF-8.
      const buf = Buffer.from(payload.slice(start), "utf8");
      const text = buf.subarray(0, parseInt(t[1], 16)).toString("utf8");
      rows.set(id, text);
      i = start + text.length;
      continue;
    }
    const nl = payload.indexOf("\n", rest);
    const line = payload.slice(rest, nl < 0 ? undefined : nl);
    i = nl < 0 ? payload.length : nl + 1;
    if (line.startsWith("I[")) {
      const arr = JSON.parse(line.slice(1));
      refs.set(id, arr[2]);
    } else if (id && /^[\[{"n0-9tf-]/.test(line)) {
      try {
        rows.set(id, JSON.parse(line));
      } catch {
        rows.set(id, line);
      }
    }
  }
  return { rows, refs, html };
}

/** Resuelve referencias "$xx" a otras filas y devuelve un árbol de nodos {type, props}. */
export function resolveTree(value, rows, refs, seen = new Set()) {
  if (typeof value === "string") {
    if (value.startsWith("$$")) return value.slice(1);
    if (value === "$undefined") return undefined;
    const lazy = /^\$L?([0-9a-f]+)$/.exec(value);
    if (lazy && rows.has(lazy[1]) && !seen.has(lazy[1])) {
      return resolveTree(rows.get(lazy[1]), rows, refs, new Set([...seen, lazy[1]]));
    }
    return value;
  }
  if (Array.isArray(value)) {
    if (value[0] === "$" && typeof value[1] === "string" && value.length === 4) {
      let type = value[1];
      const ref = /^\$L([0-9a-f]+)$/.exec(type);
      if (ref) type = refs.get(ref[1]) ?? type;
      const props = {};
      for (const [k, v] of Object.entries(value[3] ?? {})) props[k] = resolveTree(v, rows, refs, seen);
      return { type, key: value[2], props };
    }
    return value.map((v) => resolveTree(v, rows, refs, seen));
  }
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = resolveTree(v, rows, refs, seen);
    return out;
  }
  return value;
}

export const isNode = (n) => n && typeof n === "object" && !Array.isArray(n) && "type" in n && "props" in n;

export function children(n) {
  if (!isNode(n)) return [];
  const c = n.props.children;
  return (Array.isArray(c) ? c.flat(Infinity) : [c]).filter((x) => x !== null && x !== undefined && x !== false);
}

/** Recorre el árbol en profundidad. */
export function* walk(n) {
  if (Array.isArray(n)) {
    for (const x of n) yield* walk(x);
    return;
  }
  if (!isNode(n)) return;
  yield n;
  for (const c of children(n)) yield* walk(c);
}

export const hasClass = (n, cls) => isNode(n) && typeof n.props.className === "string" && n.props.className.split(/\s+/).includes(cls);
export const find = (root, pred) => {
  for (const n of walk(root)) if (pred(n)) return n;
  return undefined;
};
export const findAll = (root, pred) => [...walk(root)].filter(pred);
export const byClass = (cls) => (n) => hasClass(n, cls);
export const byType = (t) => (n) => isNode(n) && n.type === t;

/** Texto plano de un nodo (concatena hijos). */
export function text(n) {
  if (n === null || n === undefined || n === false || n === true) return "";
  if (typeof n === "string" || typeof n === "number") return String(n);
  if (Array.isArray(n)) return n.map(text).join("");
  if (isNode(n)) {
    if (n.type === "br") return "\n";
    return children(n).map(text).join("");
  }
  return "";
}

/** Nodo <main> de la página. */
export function mainOf(rows, refs) {
  for (const v of rows.values()) {
    const tree = resolveTree(v, rows, refs);
    const main = find(tree, byType("main"));
    if (main) return main;
  }
  throw new Error("main no encontrado");
}

export function metaOf(html) {
  const title = /<title>(.*?)<\/title>/.exec(html)?.[1] ?? "";
  const description = /<meta name="description" content="([^"]*)"/.exec(html)?.[1] ?? "";
  const decode = (s) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  return { title: decode(title).replace(/ \| Seritene$/, ""), description: decode(description) };
}
