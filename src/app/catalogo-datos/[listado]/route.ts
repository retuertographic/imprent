import { allListings, getListingData, parseListing } from "@/components/sites/seritene/shop/catalogFacets";

/**
 * Datos de cada listado de categoría para los filtros (/catalogo-datos/ropa-camisetas.json…): tarjetas
 * con sus facetas. Se generan al construir el sitio (exportación estática), después de refrescar
 * tarifas y stock en el workflow de deploy.
 */
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return allListings().map((name) => ({ listado: `${name}.json` }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ listado: string }> }) {
  const { listado } = await params;
  const name = listado.replace(/\.json$/, "");
  if (!parseListing(name)) return new Response("No encontrado", { status: 404 });
  return Response.json(getListingData(name));
}
