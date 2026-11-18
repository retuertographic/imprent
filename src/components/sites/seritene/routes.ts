import { JHK_PRODUCT_IDS, MERCH_PRODUCT_IDS, ROLY_PRODUCT_IDS } from "./merch/productIds.generated";

/**
 * Rutas de seritene.com clonadas en esta web (las fichas /producto/... van aparte: `isMerchProduct`).
 * Los enlaces a estas rutas son locales; el resto apunta a producción.
 */
export const LOCAL_ROUTES = new Set<string>([
  "/",
  "/aviso-legal/",
  "/banderas-rollups/",
  "/blog/",
  "/blog/camisetas-personalizadas-tenerife/",
  "/blog/cuidar-camisetas-personalizadas/",
  "/blog/dtf-serigrafia-bordado/",
  "/blog/elegir-regalos-promocionales/",
  "/blog/fullprint-tenerife/",
  "/blog/preparar-pedido-personalizado/",
  "/blog/serigrafia-tenerife/",
  "/carrito/",
  "/catalogos/",
  "/contacto/",
  "/diseno-grafico/",
  "/dtf-x-metros/",
  "/encuentra-tu-producto/",
  "/eventos/",
  "/eventos/abanicos/",
  "/eventos/placas/",
  "/eventos/producto/abanico-ab001/",
  "/eventos/producto/abanico-ab002/",
  "/eventos/producto/abanico-ab003/",
  "/eventos/producto/abanico-ab004/",
  "/eventos/producto/trofeo-metacrilato-5-mm/",
  "/eventos/producto/vaso-400-ml/",
  "/eventos/producto/vaso-500-ml/",
  "/eventos/producto/vaso-900-ml/",
  "/eventos/pulseras/",
  "/eventos/vasos/",
  "/fullprint/",
  "/fullprint/bolsa-agata/",
  "/fullprint/bufandas/",
  "/fullprint/camiseta-cover/",
  "/fullprint/camiseta-italian-pro/",
  "/fullprint/camiseta-mamba/",
  "/fullprint/camisetas/",
  "/fullprint/chaqueta-capucha/",
  "/fullprint/chaqueta-wind/",
  "/fullprint/coleccion/bolsas/",
  "/fullprint/coleccion/complementos/",
  "/fullprint/coleccion/delantales/",
  "/fullprint/coleccion/eventos/",
  "/fullprint/coleccion/ropa/",
  "/fullprint/coleccion/toallas/",
  "/fullprint/delantal-peto/",
  "/fullprint/essential-woman/",
  "/fullprint/fitpro/",
  "/fullprint/freedom/",
  "/fullprint/lanyards/",
  "/fullprint/leggin-dynamo/",
  "/fullprint/llaveros/",
  "/fullprint/mandil-corto/",
  "/fullprint/pantalon-city/",
  "/fullprint/pantalon-dunk/",
  "/fullprint/pantalon-gol/",
  "/fullprint/pantalon-strike/",
  "/fullprint/pantalon-vibora/",
  "/fullprint/pantalon-warrior/",
  "/fullprint/panuelos/",
  "/fullprint/polos/",
  "/fullprint/pulseras/",
  "/fullprint/sudadera-classic/",
  "/fullprint/sudadera-urban/",
  "/fullprint/toallas/",
  "/fullprint/top-empowered/",
  "/fullprint/woman-fit/",
  "/imprenta/",
  "/imprenta/abanicos-de-papel/",
  "/imprenta/dipticos/",
  "/imprenta/flyers/",
  "/imprenta/pulseras-full-color/",
  "/imprenta/pulseras-sin-marcaje/",
  "/imprenta/tarjetas-de-visita/",
  "/imprenta/tripticos/",
  "/mapa-web/",
  "/merchandising/",
  "/merchandising/boligrafos/",
  "/merchandising/bolsas/",
  "/merchandising/botellas/",
  "/merchandising/gorras/",
  "/merchandising/libretas/",
  "/merchandising/llaveros/",
  "/merchandising/medallas-personalizadas/",
  "/merchandising/medallas-personalizadas/metacrilato-8-cm/",
  "/merchandising/mochilas/",
  "/merchandising/tazas/",
  "/merchandising/tecnologia/",
  "/nuestros-valores/",
  "/politica-privacidad/",
  "/productos/",
  "/ropa/",
  "/ropa/abrigos/",
  "/ropa/camisetas/",
  "/ropa/deporte/",
  "/ropa/laboral/",
  "/ropa/pantalones/",
  "/ropa/polos/",
  "/ropa/sudaderas/",
  "/rotulacion/",
  "/servicios/",
  "/sobre-nosotros/",
  "/soportes-publicitarios/",
  "/soportes-publicitarios/carpa-3x3/",
  "/soportes-publicitarios/carpa-3x4-5/",
  "/soportes-publicitarios/carpa-3x6/",
  "/soportes-publicitarios/carton-pluma/",
  "/soportes-publicitarios/coleccion/banderas/",
  "/soportes-publicitarios/coleccion/carpas/",
  "/soportes-publicitarios/coleccion/photocalls/",
  "/soportes-publicitarios/coleccion/rollups/",
  "/soportes-publicitarios/gota/",
  "/soportes-publicitarios/imantado-impreso/",
  "/soportes-publicitarios/lona-impresa/",
  "/soportes-publicitarios/photocall-3x3/",
  "/soportes-publicitarios/photocall-3x4/",
  "/soportes-publicitarios/photocall-3x5/",
  "/soportes-publicitarios/photocall-3x6/",
  "/soportes-publicitarios/poster-impreso/",
  "/soportes-publicitarios/roll-up-100x200/",
  "/soportes-publicitarios/roll-up-120x200/",
  "/soportes-publicitarios/roll-up-150x200/",
  "/soportes-publicitarios/roll-up-85x200/",
  "/soportes-publicitarios/vela/",
  "/textil-personalizado/",
]);

const normalize = (path: string) => {
  const [pathname] = path.split(/[?#]/);
  return pathname.endsWith("/") ? pathname : pathname + "/";
};

/** Fichas de producto clonadas: `/producto/stamina|roly/<modelo>/` y `/producto/jhk/<código>/`. */
const PRODUCT_IDS: Record<string, Set<string>> = { stamina: MERCH_PRODUCT_IDS, roly: ROLY_PRODUCT_IDS, jhk: JHK_PRODUCT_IDS };
const isMerchProduct = (pathname: string) => {
  const m = /^\/producto\/(stamina|roly|jhk)\/([^/]+)\/$/.exec(pathname);
  return m !== null && PRODUCT_IDS[m[1]].has(m[2]);
};

/**
 * Rutas retiradas por duplicadas → ruta que se conserva. La antigua sigue existiendo como página de
 * redirección (meta refresh + canonical + noindex: la exportación estática no puede responder 301), pero
 * los enlaces internos van directamente al destino. En producción deben responder 301 (ver docs/research).
 */
export const REDIRECTS: Record<string, string> = {
  "/ropa-laboral/": "/ropa/laboral/",
};

/** Sustituye una ruta retirada por su destino, conservando consulta y fragmento. */
export const resolveRedirect = (href: string) => {
  if (!href.startsWith("/")) return href;
  const [, pathname, rest] = /^([^?#]*)(.*)$/.exec(href) ?? ["", href, ""];
  const target = REDIRECTS[normalize(pathname)];
  return target ? target + rest : href;
};

export const isLocalRoute = (path: string) => {
  if (!path.startsWith("/")) return false;
  const pathname = normalize(path);
  return LOCAL_ROUTES.has(pathname) || isMerchProduct(pathname);
};
