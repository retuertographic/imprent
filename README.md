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

### Tarifas y stock de las fichas de producto (refresco diario)

Las 1.584 fichas `/producto/stamina/<id>/` (merchandising) y las 407 `/producto/roly/<id>/` (ropa) muestran
precio y stock de `public/sites/seritene/shop-data/merch-pricing.json` y `roly-pricing.json` (producción los pide
en vivo a `/api/gor`, que no admite CORS). Las 12 fichas `/producto/jhk/<código>/` no los piden ni en producción:
tarifa manual de la propia ficha y «Stock a consultar».
El workflow de deploy, además de con cada push, se ejecuta **cada noche a las 02:17 UTC**
(03:17 en Madrid en invierno, 04:17 en verano) y antes de compilar ejecuta
`node scripts/refresh-merch-pricing.mjs`, que vuelve a descargar tarifas y stock de las dos marcas
(unos 13 min si producción va bien: ~660 peticiones; Roly sola, ~2,5 min).
El archivo nuevo solo se usa en esa build; no se commitea. Para que nunca se publiquen precios más
antiguos que los que ya había:
- El script parte de la copia **ya publicada** en GitHub Pages (de cada archivo) si es más reciente que la
  del repositorio.
- Tiene un tiempo máximo (24 min en el workflow): si producción va lenta, deja de pedir y guarda lo
  obtenido; el resto de modelos conserva sus datos anteriores y se pide primero la noche siguiente.
- Si seritene.com no responde, avisa (`::warning::` en el resumen del workflow), conserva el archivo
  de partida y la web se publica igual.

GitHub no garantiza la hora de las tareas programadas: la de las 02:17 UTC puede arrancar horas más tarde.

- Refrescar y publicar a mano: **Actions → Deploy a GitHub Pages → Run workflow** (rama `main`).
- En local: `node scripts/refresh-merch-pricing.mjs` (opcional `--brand roly`, `--only 1000,1001`). Commitea
  `merch-pricing.json` y `roly-pricing.json` de vez en cuando para que el respaldo no se quede muy atrás.
- Los datos fijos de las fichas (nombres, colores, imágenes…) no se refrescan solos: se regeneran con
  `node scripts/extract-merch-products.mjs --cache <carpeta>` (opcional `--brand roly,jhk`) y se commitean.

Requisito único: en GitHub, **Settings → Pages → Build and deployment → Source: GitHub Actions**.

Dominio propio: añádelo en **Settings → Pages → Custom domain** y crea el registro DNS que indica GitHub.
El workflow ajusta solo el prefijo de rutas (`NEXT_PUBLIC_BASE_PATH`), así que no hay que tocar código.

- Componentes y contenidos: `src/components/sites/seritene/` (textos y enlaces en `content.ts`).
- Estilos: `src/app/styles/seritene/`.
- Recursos: `public/sites/seritene/`.
- Qué está clonado y qué no: `docs/research/seritene/README.md`.

Para clonar otra página del sitio con Claude Code: `/clone-website https://seritene.com/<ruta>/`.
