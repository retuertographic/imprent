/* eslint-disable @next/next/no-img-element */
"use client";

import { Expand } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { workCategories, type WorkCategory } from "./content";
import { WorkLightbox } from "./WorkLightbox";
import { galleryWorks, isWorkCategory as isCategory, workCategoryLabel as labelOf, workImage, worksIn } from "./works";

/** Lee `?categoria=` (dentro de Suspense para que la rejilla completa siga en el HTML estático). */
function CategoryParam({ onChange }: { onChange: (value: string | null) => void }) {
  const value = useSearchParams().get("categoria");
  useEffect(() => onChange(value), [value, onChange]);
  return null;
}

type Props = {
  /** Categoría fija (bloques «Trabajos reales» de las páginas de servicio). */
  category?: WorkCategory;
  /** Máximo de fotos en la rejilla (el lightbox recorre todas las de la categoría). */
  limit?: number;
  /** Botones de filtro por categoría, sincronizados con `?categoria=` (página /trabajos/). */
  filterable?: boolean;
  /** Valor de `sizes` de las imágenes. */
  sizes?: string;
  className?: string;
};

/** Rejilla de trabajos reales con filtro opcional por categoría y lightbox accesible. */
export function WorkGallery({
  category,
  limit,
  filterable = false,
  sizes = "(max-width: 600px) 46vw, (max-width: 1000px) 31vw, 300px",
  className,
}: Props) {
  const [active, setActive] = useState<WorkCategory | null>(category ?? null);
  const [openId, setOpenId] = useState<string | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const onParam = useCallback((value: string | null) => setActive(isCategory(value) ? value : null), []);

  const items = useMemo(() => (active ? worksIn(active) : galleryWorks), [active]);
  const shown = limit ? items.slice(0, limit) : items;

  const choose = (next: WorkCategory | null) => {
    setActive(next);
    const params = new URLSearchParams(window.location.search);
    if (next) params.set("categoria", next);
    else params.delete("categoria");
    const search = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`);
  };

  const chips: { id: WorkCategory | null; label: string; count: number }[] = [
    { id: null, label: "Todos", count: galleryWorks.length },
    ...workCategories.map((c) => ({ id: c.id, label: c.label, count: worksIn(c.id).length })).filter((c) => c.count > 0),
  ];

  return (
    <div className={["work-gallery", className].filter(Boolean).join(" ")}>
      {filterable && (
        <>
          <Suspense fallback={null}>
            <CategoryParam onChange={onParam} />
          </Suspense>
          <div className="work-gallery-filters" role="group" aria-label="Filtrar trabajos por categoría">
            {chips.map((chip) => (
              <button
                key={chip.id ?? "todos"}
                type="button"
                aria-pressed={active === chip.id}
                onClick={() => choose(chip.id)}
              >
                {chip.label}
                <span aria-hidden="true">{chip.count}</span>
                <span className="sr-only"> ({chip.count} fotos)</span>
              </button>
            ))}
          </div>
          <p className="work-gallery-status" role="status">
            {items.length} {items.length === 1 ? "trabajo" : "trabajos"}
            {active ? ` de ${labelOf(active).toLocaleLowerCase("es")}` : ""}
          </p>
        </>
      )}
      <ul className="work-gallery-grid">
        {shown.map((item) => {
          const image = workImage(item);
          return (
            <li key={item.id}>
              <button
                type="button"
                className="work-gallery-tile"
                aria-label={`Ampliar: ${item.title}`}
                onClick={(event) => {
                  returnFocusRef.current = event.currentTarget;
                  setOpenId(item.id);
                }}
              >
                <span className="work-gallery-photo">
                  <img
                    src={image.src}
                    srcSet={image.srcSet}
                    sizes={sizes}
                    width={image.width}
                    height={image.height}
                    alt={item.description}
                    loading="lazy"
                    decoding="async"
                    style={{ objectPosition: item.position }}
                  />
                  <span className="work-gallery-zoom" aria-hidden="true">
                    <Expand size={16} />
                  </span>
                </span>
                <span className="work-gallery-caption">
                  <strong>{item.title}</strong>
                  <span>{item.gallery.map(labelOf).join(" · ")}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <WorkLightbox
        items={items}
        openId={openId}
        onOpenIdChange={setOpenId}
        finalFocus={returnFocusRef}
        label={(item) => (active ? labelOf(active) : labelOf(item.gallery[0]))}
      />
    </div>
  );
}
