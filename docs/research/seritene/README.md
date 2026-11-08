# Seritene — brief del clon

Fuente: https://seritene.com/ (web del cliente; clonada como base para mejoras de agencia).
Fecha de captura: 2026-11-01.

## Mapa de rutas

Fase 1 (clonada): las 125 páginas del sitemap salvo las ~2.000 fichas `/producto/...`.
La lista exacta está en `src/components/sites/seritene/routes.ts` (`LOCAL_ROUTES`).

| Bloque | Rutas | Código |
| --- | --- | --- |
| Home | `/` | `src/app/page.tsx`, componentes `Home*`, `UnboxHero` |
| Contenido y blog | equipo, valores, servicios, contacto, catálogos, textil, rotulación, diseño, banderas-rollups, ropa-laboral, DTF, mapa web, legales, cuestionario, `/blog/` + 7 artículos | `src/components/sites/seritene/pages/` |
| Tienda | `/ropa/*`, `/merchandising/*`, `/productos/` (buscador `?q=`), `/imprenta/*` | `src/components/sites/seritene/shop/` (datos en `public/sites/seritene/shop-data/`) |
| Fullprint | portada, 6 colecciones, 30 modelos | `src/components/sites/seritene/fullprint/` |
| Soportes y eventos | `/soportes-publicitarios/*`, `/eventos/*`, medallas | `src/components/sites/seritene/soportes/`, `eventos/` |

Enlaces: `SiteLink` usa la ruta local si está en `LOCAL_ROUTES`; si no, la de seritene.com.
Cada página mantiene su `canonical` hacia seritene.com.

### Datos extraídos (scripts re-ejecutables)

- `scripts/extract-shop-data.mjs` — catálogos de ropa/merchandising y secciones del buscador.
- `scripts/extract-fullprint.mjs` — modelos, colecciones y precios de Fullprint.
- `scripts/extract-seritene-soportes-eventos.mjs` — soportes, eventos y medallas.

Son una foto del sitio en noviembre de 2026: si el cliente cambia precios o productos, hay que volver a ejecutarlos.

## Estructura de la home

1. `SiteHeader` — cabecera fija con megamenús (Ropa, Merchandising), buscador desplegable, menú "más"
   (incluye *Pausar animaciones*, que pone `motion-paused` en `<html>`) y menú móvil.
2. `UnboxHero` — sección sticky de 1800 px: al hacer scroll, 6 productos salen de la caja negra
   (lógica de posición portada del sitio original), titular rotativo cada 4,5 s y cinta animada.
3. `HomeMotion` envuelve el resto: `[data-enter]` (aparición) y `[data-scrub]` (`--scrub` −1…1).
   - `ServicesSection` (6 tarjetas), `BrandSection` (verde), `HomeProjects` (carrusel 3D, autoplay
     2,5 s + lightbox de 20 trabajos con Base UI Dialog), `ConfidenceSection` (+35 años),
     `AudiencesSection`, `SocialSection` (4 reels), `HomeTeam` (baraja de 10 personas, autoplay 1,8 s),
     `HelpSection` (FAQ en `<details>`), `FinalSection`.
4. `SiteFooter` + botones flotantes de WhatsApp y Seribot.

## Estilos

`src/app/styles/seritene/*.css` son las hojas de producción del sitio (Tailwind v4 compilado + CSS de
marca), con las fuentes en `src/app/styles/seritene/fonts/` y `url()` relativas. Se importan una a una desde
`src/app/layout.tsx` (no vía `@import` en un CSS con Tailwind: el plugin de PostCSS las recortaba).

Tokens principales: `--brand-green: #43b02a`, `--brand-ink: #080808`; tipografía Montserrat
(400 y 500–800, archivos `.woff2` propios del sitio).

## Recursos

Todo en `public/sites/seritene/` con la misma ruta relativa que en el origen
(salvo las fuentes; `/optimized/*.webp`, `/team/*.webp`, `/trabajos/proyecto-XX-{thumb,full}.webp`, `/reels/*.jpg`,
logos, Seribot, icono de WhatsApp, fuentes). El favicon (`seritene-symbol.png`) está en `src/app/icon.png`.

## Verificación

- Home: altura idéntica a la fuente: 7061 px (1440×900), 8683 px (390×844), 7421 px (1920×1080).
- Fase 1: las 125 rutas, comparadas a 1440×900 y 390×844, miden lo mismo que la fuente (250/250),
  sin desbordamiento horizontal ni errores; ningún enlace interno roto en el export.
- Sin desbordamiento horizontal, sin errores de consola ni imágenes rotas.
- Probado: megamenú + Escape, menú "más", pausar animaciones, buscador, rotación de titular,
  carrusel de trabajos, lightbox (flechas de teclado, cierre), FAQ, carrusel de equipo, menú móvil.
- Comparativas en `docs/design-references/seritene/` (izquierda: original, derecha: clon).

## Diferencias conocidas

- Fase 1: no hay icono de carrito en la cabecera y `/carrito/` no está clonado; "Ver carrito" lleva a
  seritene.com, que no ve lo añadido aquí (el almacenamiento del navegador es por dominio).
- El buscador local busca en las descripciones cortas del listado: da resultados parecidos pero no
  idénticos a los de producción (que busca en el servidor).
- `/catalogos/` y `/ropa-laboral/` muestran una foto de la primera página del catálogo.
- Las páginas `?pagina=N` muestran la página 1 en el HTML estático y cargan la pedida en el navegador.

- El titular rotativo y los carruseles automáticos dependen del tiempo, así que una captura puede
  mostrar otra frase u otra tarjeta que el original en el mismo instante.
- Las páginas internas no están clonadas (enlazan a producción).
