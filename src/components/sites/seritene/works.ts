import { asset, projects, workCategories, type Project, type WorkCategory } from "./content";

/** Fotos de trabajos reales que salen en la galería (la presentación digital se queda fuera). */
export const galleryWorks = projects.filter((project) => project.gallery.length > 0);

export const worksIn = (category: WorkCategory) => galleryWorks.filter((project) => project.gallery.includes(category));

export const isWorkCategory = (value: string | null): value is WorkCategory => workCategories.some((c) => c.id === value);

export const workCategoryLabel = (id: WorkCategory) => workCategories.find((c) => c.id === id)?.label ?? id;

/** Copias de una foto: 400 px (rejilla, `scripts/make-work-thumbs.mjs`) y `thumb` (740 px el lado mayor). */
export const workImage = (project: Project) => {
  const [w, h] = project.size;
  const small = asset(`/trabajos/proyecto-${project.id}-400.webp`);
  return {
    src: small,
    srcSet: `${small} 400w, ${asset(`/trabajos/proyecto-${project.id}-thumb.webp`)} ${w}w`,
    width: 400,
    height: Math.round((400 * h) / w),
  };
};
