# Seritene — brief del clon

Fuente: https://seritene.com/ (web del cliente; clonada como base para mejoras de agencia).
Fecha de captura: 2026-11-01.

## Mapa de rutas

| Origen | Local | Archivos |
| --- | --- | --- |
| `https://seritene.com/` | `/` | `src/app/page.tsx`, `src/components/sites/seritene/*` |

Solo se ha clonado la home. Todos los enlaces internos que no son la home (categorías, productos,
equipo, contacto, buscador, Seribot, legales…) apuntan a `https://seritene.com/...` mediante `ext()`
en `content.ts`. WhatsApp, teléfono, email e Instagram mantienen sus destinos reales.

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
marca), con las rutas de fuentes reescritas a `/sites/seritene/`. Se importan una a una desde
`src/app/layout.tsx` (no vía `@import` en un CSS con Tailwind: el plugin de PostCSS las recortaba).

Tokens principales: `--brand-green: #43b02a`, `--brand-ink: #080808`; tipografía Montserrat
(400 y 500–800, archivos `.woff2` propios del sitio).

## Recursos

Todo en `public/sites/seritene/` con la misma ruta relativa que en el origen
(`/optimized/*.webp`, `/team/*.webp`, `/trabajos/proyecto-XX-{thumb,full}.webp`, `/reels/*.jpg`,
logos, Seribot, icono de WhatsApp, fuentes). El favicon (`seritene-symbol.png`) está en `src/app/icon.png`.

## Verificación

- Altura de página idéntica a la fuente: 7061 px (1440×900), 8683 px (390×844), 7421 px (1920×1080).
- Sin desbordamiento horizontal, sin errores de consola ni imágenes rotas.
- Probado: megamenú + Escape, menú "más", pausar animaciones, buscador, rotación de titular,
  carrusel de trabajos, lightbox (flechas de teclado, cierre), FAQ, carrusel de equipo, menú móvil.
- Comparativas en `docs/design-references/seritene/` (izquierda: original, derecha: clon).

## Diferencias conocidas

- El titular rotativo y los carruseles automáticos dependen del tiempo, así que una captura puede
  mostrar otra frase u otra tarjeta que el original en el mismo instante.
- Las páginas internas no están clonadas (enlazan a producción).
