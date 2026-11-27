/* eslint-disable @next/next/no-img-element */
import { ArrowUpRight, Check } from "lucide-react";
import { homeTrustProofs, homeTrustWorks } from "./content";
import { SiteLink } from "./SiteLink";
import { galleryWorks, workCategoryLabel, workImage } from "./works";

const strip = homeTrustWorks
  .map((id) => galleryWorks.find((project) => project.id === id))
  .filter((project) => project !== undefined);

/**
 * Pruebas de confianza compactas justo tras la caja animada de la portada: cuatro pruebas reales de
 * `proofs` y una tira de trabajos reales que enlaza a la galería (cada foto, a su categoría).
 */
export function HomeTrust() {
  return (
    <section className="home-trust" aria-labelledby="home-trust-title">
      <div className="edit-wrap">
        <h2 id="home-trust-title" className="sr-only">
          Por qué confiar en Seritene
        </h2>
        <ul className="home-trust-proofs">
          {homeTrustProofs.map((proof) => (
            <li key={proof}>
              <Check size={16} aria-hidden="true" />
              {proof.replace(/\.$/, "")}
            </li>
          ))}
        </ul>
        <div className="home-trust-works">
          <p className="home-trust-label">
            <span>Trabajos reales</span> hechos en nuestro taller de La Orotava
          </p>
          <ul>
            {strip.map((project) => {
              const image = workImage(project);
              const category = project.gallery[0];
              return (
                <li key={project.id}>
                  <SiteLink href={`/trabajos/?categoria=${category}`} title={`Ver trabajos de ${workCategoryLabel(category).toLocaleLowerCase("es")}`}>
                    <img
                      src={image.src}
                      srcSet={image.srcSet}
                      sizes="(max-width: 700px) 31vw, 180px"
                      width={image.width}
                      height={image.height}
                      alt={project.description}
                      loading="lazy"
                      decoding="async"
                      style={{ objectPosition: project.position }}
                    />
                  </SiteLink>
                </li>
              );
            })}
          </ul>
          <SiteLink className="home-trust-more" href="/trabajos/">
            Ver todos los trabajos
            <ArrowUpRight size={17} />
          </SiteLink>
        </div>
      </div>
    </section>
  );
}
