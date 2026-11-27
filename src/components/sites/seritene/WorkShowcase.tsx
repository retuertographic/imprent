import { ArrowUpRight } from "lucide-react";
import type { WorkCategory } from "./content";
import { SiteLink } from "./SiteLink";
import { WorkGallery } from "./WorkGallery";
import { workCategoryLabel, worksIn } from "./works";

/** Mínimo de fotos reales para mostrar el bloque en una página. */
const MIN_WORKS = 3;

/**
 * Bloque «Trabajos reales» de las páginas de servicio y catálogo: hasta `limit` fotos de la categoría
 * (lightbox con todas) y enlace a la galería filtrada. No se pinta si la categoría tiene menos de 3 fotos.
 */
export function WorkShowcase({ category, limit = 4, title }: { category: WorkCategory; limit?: number; title?: string }) {
  const total = worksIn(category).length;
  if (total < MIN_WORKS) return null;
  const label = workCategoryLabel(category).toLocaleLowerCase("es");
  const id = `trabajos-reales-${category}`;
  return (
    <section className="wrap work-showcase" aria-labelledby={id}>
      <div className="work-showcase-head">
        <div>
          <p className="eyebrow">TRABAJOS REALES</p>
          <h2 id={id}>{title ?? "Salido de nuestro taller."}</h2>
        </div>
        <SiteLink className="work-showcase-link" href={`/trabajos/?categoria=${category}`}>
          Ver {total > limit ? `los ${total} trabajos` : "más trabajos"} de {label}
          <ArrowUpRight size={18} />
        </SiteLink>
      </div>
      <WorkGallery
        category={category}
        limit={limit}
        className="work-gallery-compact"
        sizes="(max-width: 600px) 46vw, (max-width: 1000px) 23vw, 300px"
      />
    </section>
  );
}
