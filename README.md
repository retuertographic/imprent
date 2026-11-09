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

### Tarifas y stock de merchandising (refresco diario)

Las 1.584 fichas `/producto/stamina/<id>/` muestran precio y stock de
`public/sites/seritene/shop-data/merch-pricing.json` (producción los pide en vivo a `/api/gor`, que no admite CORS).
El workflow de deploy, además de con cada push, se ejecuta **cada noche a las 02:17 UTC**
(03:17 en Madrid en invierno, 04:17 en verano) y antes de compilar ejecuta
`node scripts/refresh-merch-pricing.mjs`, que vuelve a descargar tarifas y stock (unos minutos).
El archivo nuevo solo se usa en esa build; no se commitea. Si seritene.com falla, el script avisa
(`::warning::` en el resumen del workflow), conserva el archivo del repositorio y la web se publica igual.

- Refrescar y publicar a mano: **Actions → Deploy a GitHub Pages → Run workflow** (rama `main`).
- En local: `node scripts/refresh-merch-pricing.mjs` (opcional `--only 1000,1001`). Commitea el
  `merch-pricing.json` resultante de vez en cuando para que el respaldo no se quede muy atrás.
- Los datos fijos de las fichas (nombres, colores, imágenes…) no se refrescan solos: se regeneran con
  `node scripts/extract-merch-products.mjs --cache <carpeta>` y se commitean.

Requisito único: en GitHub, **Settings → Pages → Build and deployment → Source: GitHub Actions**.

Dominio propio: añádelo en **Settings → Pages → Custom domain** y crea el registro DNS que indica GitHub.
El workflow ajusta solo el prefijo de rutas (`NEXT_PUBLIC_BASE_PATH`), así que no hay que tocar código.

- Componentes y contenidos: `src/components/sites/seritene/` (textos y enlaces en `content.ts`).
- Estilos: `src/app/styles/seritene/`.
- Recursos: `public/sites/seritene/`.
- Qué está clonado y qué no: `docs/research/seritene/README.md`.

Para clonar otra página del sitio con Claude Code: `/clone-website https://seritene.com/<ruta>/`.
