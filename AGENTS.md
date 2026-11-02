<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Seritene — web

Clon editable de https://seritene.com/ (web de un cliente de la agencia) sobre el que se hacen mejoras.

## Stack
- Next.js 16 (App Router, React 19, TypeScript strict)
- CSS plano: las hojas de producción del sitio están en `src/app/styles/seritene/` y se importan una a una desde `src/app/layout.tsx`. `base.css` ya contiene Tailwind v4 compilado (clases utilitarias del sitio original); no hay Tailwind en el build.
- Iconos: `lucide-react`. Diálogos: `@base-ui/react`.

## Comandos
- `npm run dev` — servidor de desarrollo
- `npm run check` — lint + typecheck + build (lo ejecuta también el CI en cada PR a `main`)

## Estructura
```
src/app/                       # rutas, layout y estilos
src/components/sites/seritene/ # componentes del sitio; contenidos en content.ts
public/sites/seritene/         # imágenes, fuentes y demás recursos
docs/research/seritene/        # brief del clon (mapa de rutas, recursos, diferencias)
docs/design-references/        # capturas de referencia
.agents/skills/clone-website/  # flujo para clonar más páginas (/clone-website <url>)
```

## Convenciones
- TypeScript strict, sin `any`; exports con nombre; componentes en PascalCase; 2 espacios.
- Textos, enlaces y datos de contacto en `content.ts`.
- Páginas aún no clonadas: enlazar con `ext("/ruta/")` (apunta a producción). Al clonar una página, crear su ruta local y cambiar esos enlaces.
