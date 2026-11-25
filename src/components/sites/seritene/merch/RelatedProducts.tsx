"use client";

import { SiteLink } from "../SiteLink";
import { ShopCard } from "../shop/ShopCard";
import type { CardItem } from "../shop/types";

type Props = {
  related: CardItem[];
  combine: CardItem[];
  /** Categoría de la ficha, para el enlace «Ver todos». */
  category?: { name: string; path: string };
};

/**
 * Bloques «Productos relacionados» y «Combínalo con» al final de la ficha (tarjetas del listado, fotos diferidas).
 * Componente de cliente a propósito: el HTML estático lleva las tarjetas completas, pero la carga RSC de cada
 * ficha (index.html, index.txt y __next.*.txt) solo repite los datos de las tarjetas y no su árbol de
 * elementos, que pesaba unas tres veces más (≈2.000 fichas).
 */
export function RelatedProducts({ related, combine, category }: Props) {
  if (!related.length && !combine.length) return null;
  return (
    <div className="wrap product-related">
      {related.length > 0 && (
        <section aria-labelledby="productos-relacionados">
          <div className="product-related-head">
            <h2 id="productos-relacionados">Productos relacionados</h2>
            {category && (
              <SiteLink className="text-cta" href={category.path}>
                Ver más {category.name.toLocaleLowerCase("es")}
              </SiteLink>
            )}
          </div>
          <div className="shop-grid">
            {related.map((item) => (
              <ShopCard key={`${item.brand}-${item.key}`} item={item} brand={item.brand} priority="lazy" />
            ))}
          </div>
        </section>
      )}
      {combine.length > 0 && (
        <section aria-labelledby="combinalo-con">
          <div className="product-related-head">
            <h2 id="combinalo-con">Combínalo con</h2>
          </div>
          <div className="shop-grid">
            {combine.map((item) => (
              <ShopCard key={`${item.brand}-${item.key}`} item={item} brand={item.brand} priority="lazy" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
