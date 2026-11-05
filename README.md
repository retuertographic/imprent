# Seritene — web

Clon editable de [seritene.com](https://seritene.com/) en Next.js, base para las mejoras de la agencia.

```bash
npm install
npm run dev     # http://localhost:3000
npm run check   # lint + typecheck + build (genera la web estática en out/)
npm run preview # sirve out/ en local
```

## Publicación (GitHub Pages)

Cada push a `main` compila la web estática y la publica en GitHub Pages
(workflow `.github/workflows/deploy.yml`): https://retuertographic.github.io/imprent/

Requisito único: en GitHub, **Settings → Pages → Build and deployment → Source: GitHub Actions**.

Dominio propio: añádelo en **Settings → Pages → Custom domain** y crea el registro DNS que indica GitHub.
El workflow ajusta solo el prefijo de rutas (`NEXT_PUBLIC_BASE_PATH`), así que no hay que tocar código.

- Componentes y contenidos: `src/components/sites/seritene/` (textos y enlaces en `content.ts`).
- Estilos: `src/app/styles/seritene/`.
- Recursos: `public/sites/seritene/`.
- Qué está clonado y qué no: `docs/research/seritene/README.md`.

Para clonar otra página del sitio con Claude Code: `/clone-website https://seritene.com/<ruta>/`.
