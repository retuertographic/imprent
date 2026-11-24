#!/usr/bin/env node
/**
 * Poda las reglas CSS que ninguna página puede usar en la hoja global `base.css`.
 *
 * `src/app/styles/seritene/base.full.css` es la hoja de producción completa de seritene.com (Tailwind v4
 * compilado + estilos propios, ~220 KB). Se carga en todas las páginas y bloquea el primer pintado, pero cada
 * página sólo usa una parte. Este script genera `src/app/styles/seritene/base.css` (la que importa
 * `layout.tsx`) quitando las reglas cuyos selectores exigen una clase o un id que no aparece en ningún sitio
 * del código ni de los datos. Todo lo demás se copia tal cual y en el mismo orden (la cascada no cambia).
 *
 * Qué se conserva siempre:
 *  - Reglas sin clases ni ids (elementos, `:root`, `*`, `::backdrop`, atributos, `[data-*]`, `aria-*`…).
 *  - Reglas con al menos un selector posible. Las clases dentro de `:not()`, `:is()`, `:where()`, `:has()`…
 *    no se exigen (se tratan como posibles), igual que los estados (`:hover`, `:focus-visible`, `[open]`).
 *  - `@layer properties`/`theme`, `@property`, `@font-face`, variables CSS y el orden de `@media`/`@supports`/
 *    `@container` (sólo se vacían; si quedan vacíos se quitan).
 *  - `@keyframes` referenciados por alguna declaración que queda (en esta hoja o en las demás de
 *    `src/app/styles/seritene/`) o por un estilo en línea `animation…` del código.
 *
 * "Contenido" en el que se buscan las clases (cada clase del CSS se busca como palabra completa, ya
 * desescapada: `.md\:flex` → `md:flex`, `.\[\&_svg\]\:size-4` → `[&_svg]:size-4`):
 *  - `src/**` (ts, tsx, js, mjs, json, md…): componentes, contenidos y datos generados.
 *  - `public/**` (json, html, js, mjs, txt) salvo `public/estudio-dtf/` (tiene su propia hoja).
 *  - Clases construidas con plantillas (`` `tech-tab-${i}` ``) o concatenación (`"range-" + x`): se detectan
 *    los prefijos y sufijos fijos y se conservan todas las clases que empiezan o terminan por ellos.
 *  - SAFELIST de abajo (clases que añade JS en tiempo de ejecución o librerías).
 *
 * Uso:
 *   node scripts/prune-css.mjs            regenera base.css desde base.full.css
 *   node scripts/prune-css.mjs --check    sale con 1 si base.css no coincide con lo que se generaría
 *                                         (p. ej. una página nueva usa una clase que estaba podada)
 *   node scripts/prune-css.mjs --verify   tras `next build`: comprueba que toda clase de los `class="…"`
 *                                         del HTML de `out/` que existe en base.full.css sigue en base.css
 *   node scripts/prune-css.mjs --report   resume qué se quita (también de otras hojas, sin escribir nada)
 *
 * Sólo usa `postcss` (ya instalado como dependencia de next); no añade dependencias.
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import postcss from "postcss";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const STYLES = join(ROOT, "src/app/styles/seritene");
const INPUT = join(STYLES, "base.full.css");
const OUTPUT = join(STYLES, "base.css");

/**
 * Clases que se conservan aunque no aparezcan como literal en el contenido. Hoy todas aparecen también en
 * el código; se listan para que no se pierdan si ese código cambia de forma (p. ej. pasan a construirse).
 */
const SAFELIST = [
  // Añadidas con classList desde JS
  "revealed", // RevealMotion: elemento ya visible
  "reveal-ready", // RevealMotion: elemento preparado para animar
  "motion-paused", // <html> con animaciones pausadas (botón del pie / SiteHeader)
  "home-content-active", // <html> en portada al pasar el hero (HomeMotion)
  "unbox-is-open", // UnboxHero abierto
  "sticky-order-visible", // <body> con la barra fija móvil de pedido visible
];

/** Prefijos y sufijos de clase que se conservan siempre (además de los detectados en plantillas). */
const SAFELIST_PREFIXES = [];
const SAFELIST_SUFFIXES = [];

/** Carpetas y extensiones que forman el contenido. */
const CONTENT_DIRS = ["src", "public"];
const CONTENT_EXT = /\.(?:tsx?|jsx?|mjs|cjs|json|mdx?|html?|txt)$/;
const CONTENT_EXCLUDE = [/^public\/estudio-dtf\//, /^src\/app\/styles\//];

const IDENT_CHAR = /[A-Za-z0-9_-]/;

function walkFiles(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walkFiles(full, out);
    else out.push(full);
  }
  return out;
}

function loadContent() {
  const parts = [];
  for (const d of CONTENT_DIRS) {
    for (const file of walkFiles(join(ROOT, d))) {
      const rel = relative(ROOT, file).split("\\").join("/");
      if (!CONTENT_EXT.test(rel) || CONTENT_EXCLUDE.some((re) => re.test(rel))) continue;
      parts.push(readFileSync(file, "utf8"));
    }
  }
  return parts.join("\n");
}

/** Prefijos/sufijos fijos de clases construidas: `foo-${x}`, `${x}-bar`, `"foo-" + x`. */
function dynamicAffixes(content) {
  const prefixes = new Set(SAFELIST_PREFIXES);
  const suffixes = new Set(SAFELIST_SUFFIXES);
  for (const m of content.matchAll(/([A-Za-z0-9_:-]{3,})\$\{/g)) prefixes.add(m[1]);
  for (const m of content.matchAll(/\}([_-][A-Za-z0-9_-]{2,})/g)) suffixes.add(m[1]);
  for (const m of content.matchAll(/["'`]([A-Za-z0-9_:-]{2,}[_-])["'`]\s*\+/g)) prefixes.add(m[1]);
  for (const m of content.matchAll(/\+\s*["'`]([_-][A-Za-z0-9_-]{2,})["'`]/g)) suffixes.add(m[1]);
  return { prefixes: [...prefixes], suffixes: [...suffixes] };
}

/** Lee un identificador CSS desde `i` (tras `.` o `#`) y lo devuelve desescapado. */
function readIdent(sel, i) {
  let name = "";
  while (i < sel.length) {
    const c = sel[i];
    if (c === "\\") {
      const hex = /^[0-9a-fA-F]{1,6}\s?/.exec(sel.slice(i + 1, i + 8));
      if (hex) {
        name += String.fromCodePoint(parseInt(hex[0].trim(), 16));
        i += 1 + hex[0].length;
      } else {
        name += sel[i + 1] ?? "";
        i += 2;
      }
    } else if (IDENT_CHAR.test(c) || c.charCodeAt(0) > 0x7f) {
      name += c;
      i += 1;
    } else break;
  }
  return { name, end: i };
}

/**
 * Clases e ids que un selector complejo exige. Ignora lo que va entre paréntesis (argumentos de
 * `:not()`, `:is()`, `:where()`, `:has()`, `:nth-child(… of S)`), corchetes de atributo y cadenas.
 */
function requiredNames(sel) {
  const classes = [];
  const ids = [];
  let depth = 0;
  let i = 0;
  while (i < sel.length) {
    const c = sel[i];
    if (c === "\\") {
      i += 2;
    } else if (c === '"' || c === "'") {
      i += 1;
      while (i < sel.length && sel[i] !== c) i += sel[i] === "\\" ? 2 : 1;
      i += 1;
    } else if (c === "[") {
      i += 1;
      while (i < sel.length && sel[i] !== "]") {
        if (sel[i] === '"' || sel[i] === "'") {
          const q = sel[i];
          i += 1;
          while (i < sel.length && sel[i] !== q) i += sel[i] === "\\" ? 2 : 1;
        }
        i += sel[i] === "\\" ? 2 : 1;
      }
      i += 1;
    } else if (c === "(") {
      depth += 1;
      i += 1;
    } else if (c === ")") {
      depth -= 1;
      i += 1;
    } else if (c === "." || c === "#") {
      const { name, end } = readIdent(sel, i + 1);
      if (depth === 0 && name && !/^\d/.test(name)) (c === "." ? classes : ids).push(name);
      i = Math.max(end, i + 1);
    } else {
      i += 1;
    }
  }
  return { classes, ids };
}

/** Divide una lista de selectores por las comas de primer nivel. */
function splitSelectors(selector) {
  const out = [];
  let depth = 0;
  let quote = "";
  let start = 0;
  for (let i = 0; i < selector.length; i++) {
    const c = selector[i];
    if (c === "\\") {
      i++;
      continue;
    }
    if (quote) {
      if (c === quote) quote = "";
    } else if (c === '"' || c === "'") quote = c;
    else if (c === "(" || c === "[") depth++;
    else if (c === ")" || c === "]") depth--;
    else if (c === "," && depth === 0) {
      out.push(selector.slice(start, i));
      start = i + 1;
    }
  }
  out.push(selector.slice(start));
  return out;
}

function makeMatcher(content) {
  const { prefixes, suffixes } = dynamicAffixes(content);
  const safe = new Set(SAFELIST);
  const cache = new Map();
  const inContent = (name) => {
    let from = 0;
    for (;;) {
      const at = content.indexOf(name, from);
      if (at < 0) return false;
      const before = at > 0 ? content[at - 1] : " ";
      const after = content[at + name.length] ?? " ";
      if (!IDENT_CHAR.test(before) && !IDENT_CHAR.test(after)) return true;
      from = at + 1;
    }
  };
  const used = (name) => {
    if (cache.has(name)) return cache.get(name);
    const ok =
      safe.has(name) ||
      prefixes.some((p) => name.startsWith(p)) ||
      suffixes.some((s) => name.endsWith(s)) ||
      inContent(name);
    cache.set(name, ok);
    return ok;
  };
  return { used, prefixes, suffixes };
}

/** Selectores con prefijos de navegador: si una lista los contiene no se toca (un selector no válido anula la regla entera). */
const VENDOR_SELECTOR = /::?-(?:webkit|moz|ms|o)-/;

/** Devuelve el CSS podado y estadísticas. `extraCss` son las demás hojas (para referencias a @keyframes). */
function prune(css, matcher, { content, extraCss = "" }) {
  const root = postcss.parse(css);
  const removed = { rules: 0, selectors: 0, keyframes: [], list: [] };
  const selectorOk = (s) => {
    const { classes, ids } = requiredNames(s);
    return classes.every(matcher.used) && ids.every(matcher.used);
  };

  root.walkRules((rule) => {
    if (rule.parent?.type === "atrule" && /keyframes$/.test(rule.parent.name)) return;
    const selectors = splitSelectors(rule.selector);
    const keep = selectors.filter(selectorOk);
    const drop = keep.length === 0 || !selectors.some((s) => VENDOR_SELECTOR.test(s));
    if (drop) for (const s of selectors) if (!keep.includes(s)) removed.list.push({ selector: s, ...requiredNames(s) });
    if (keep.length === 0) {
      removed.rules += 1;
      rule.remove();
    } else if (keep.length < selectors.length && !selectors.some((s) => VENDOR_SELECTOR.test(s))) {
      removed.selectors += selectors.length - keep.length;
      rule.selector = keep.join(",");
    }
  });

  // @keyframes sin referencias
  const refs = [extraCss];
  root.walkDecls((d) => refs.push(d.value));
  const refText = refs.join("\n");
  root.walkAtRules(/keyframes$/, (at) => {
    const name = at.params.trim();
    const word = new RegExp(`(^|[^A-Za-z0-9_-])${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^A-Za-z0-9_-])`);
    const inline = new RegExp(`animation[A-Za-z]*["']?\\s*[:=]\\s*[^;\\n]*\\b${name}\\b`);
    if (!word.test(refText) && !inline.test(content)) {
      removed.keyframes.push(name);
      at.remove();
    }
  });

  // At-rules que han quedado vacíos (no @font-face/@property, que no tienen reglas hijas)
  let changed = true;
  while (changed) {
    changed = false;
    root.walkAtRules((at) => {
      if (at.nodes && at.nodes.length === 0 && /^(media|supports|container|layer)$/.test(at.name)) {
        // `@layer components{}` vacío ya existía: conservar capas de primer nivel por el orden de cascada
        if (at.name === "layer" && at.parent === root) return;
        at.remove();
        changed = true;
      }
    });
  }
  return { css: root.toString(), removed };
}

const HEADER =
  "/* GENERADO por scripts/prune-css.mjs desde base.full.css: no editar a mano (ver docs/research/seritene/README.md) */\n";

function otherSheets() {
  return readdirSync(STYLES)
    .filter((f) => f.endsWith(".css") && f !== "base.css" && f !== "base.full.css")
    .map((f) => readFileSync(join(STYLES, f), "utf8"))
    .join("\n");
}

function build() {
  const content = loadContent();
  const matcher = makeMatcher(content);
  const full = readFileSync(INPUT, "utf8");
  const { css, removed } = prune(full, matcher, { content, extraCss: otherSheets() });
  return { full, css: HEADER + css, removed, matcher, content };
}

function size(s) {
  const b = Buffer.from(s);
  return `${(b.length / 1024).toFixed(1)} KB (gzip ${(gzipSync(b, { level: 9 }).length / 1024).toFixed(1)} KB)`;
}

/** Clases e ids de los atributos class="…" e id="…" de un HTML. */
function htmlNames(html) {
  const decode = (v) => v.replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"');
  const classes = new Set();
  const ids = new Set();
  for (const m of html.matchAll(/\sclass="([^"]*)"/g)) for (const c of decode(m[1]).split(/\s+/)) if (c) classes.add(c);
  for (const m of html.matchAll(/\sid="([^"]*)"/g)) ids.add(decode(m[1]));
  return { classes, ids };
}

const mode = process.argv[2] ?? "";
if (mode === "--check") {
  const { css } = build();
  const current = existsSync(OUTPUT) ? readFileSync(OUTPUT, "utf8") : "";
  if (current !== css) {
    console.error(
      "base.css no está al día con el código (¿una página nueva usa clases que estaban podadas?).\n" +
        "Ejecuta `node scripts/prune-css.mjs` y comitea el resultado.",
    );
    process.exit(1);
  }
  console.log(`base.css al día: ${size(css)}`);
} else if (mode === "--verify") {
  // Comprobación independiente del contenido: para cada página exportada, ningún selector podado puede
  // tener todas sus clases e ids presentes en el HTML de esa página (condición necesaria para coincidir).
  const outDir = join(ROOT, "out");
  if (!existsSync(outDir)) {
    console.error("No existe out/: ejecuta antes `next build`.");
    process.exit(1);
  }
  const { css, removed } = build();
  if (readFileSync(OUTPUT, "utf8") !== css) {
    console.error("base.css no está al día: ejecuta `node scripts/prune-css.mjs`.");
    process.exit(1);
  }
  const problems = new Map();
  let pages = 0;
  for (const file of walkFiles(outDir)) {
    // public/estudio-dtf/ se copia tal cual a out/ y no carga base.css (tiene su propia hoja)
    if (!file.endsWith(".html") || relative(outDir, file).startsWith("estudio-dtf")) continue;
    pages += 1;
    const { classes, ids } = htmlNames(readFileSync(file, "utf8"));
    for (const r of removed.list) {
      if (r.classes.every((c) => classes.has(c)) && r.ids.every((i) => ids.has(i))) {
        const key = r.selector.trim();
        if (!problems.has(key)) problems.set(key, relative(outDir, file));
      }
    }
  }
  if (problems.size) {
    console.error(`Selectores podados que podrían coincidir en el HTML exportado (${problems.size}):`);
    for (const [sel, page] of problems) console.error(`  ${sel}   (p. ej. ${page})`);
    console.error("Añade sus clases a SAFELIST en scripts/prune-css.mjs o revisa por qué no aparecen en el código.");
    process.exit(1);
  }
  console.log(`--verify: ${pages} páginas de out/, ningún selector podado puede coincidir en su HTML.`);
} else if (mode === "--report") {
  const { full, css, removed, matcher, content } = build();
  console.log(`base.full.css ${size(full)} → base.css ${size(css)}`);
  console.log(`reglas quitadas ${removed.rules}, selectores quitados ${removed.selectors}`);
  console.log(`@keyframes quitados: ${removed.keyframes.join(", ") || "ninguno"}`);
  console.log(`prefijos dinámicos: ${matcher.prefixes.length}, sufijos: ${matcher.suffixes.length}`);
  for (const f of readdirSync(STYLES).filter((n) => n.endsWith(".css") && !n.startsWith("base"))) {
    const sheet = readFileSync(join(STYLES, f), "utf8");
    const r = prune(sheet, matcher, { content, extraCss: full });
    console.log(`  ${f.padEnd(32)} ${size(sheet)} → ${size(r.css)}`);
  }
} else {
  const { full, css } = build();
  writeFileSync(OUTPUT, css);
  console.log(`base.full.css ${size(full)} → base.css ${size(css)}`);
}
