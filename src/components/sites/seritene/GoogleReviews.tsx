import { ArrowUpRight, Star } from "lucide-react";
import { googleReviews } from "./content";

/** Hay valoración media y número de reseñas reales (lo usa también el JSON-LD). */
export const hasGoogleRating = (data = googleReviews): data is typeof googleReviews & { rating: number; count: number } =>
  typeof data.rating === "number" && data.rating > 0 && typeof data.count === "number" && data.count > 0;

const fmtRating = new Intl.NumberFormat("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fmtCount = new Intl.NumberFormat("es-ES");
const fmtDate = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric", timeZone: "UTC" });

function Stars({ value }: { value: number }) {
  return (
    <span className="google-reviews-stars" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={16} fill={value >= n - 0.25 ? "currentColor" : "none"} />
      ))}
    </span>
  );
}

/**
 * Reseñas de Google, controladas por `googleReviews` en content.ts. No pinta nada mientras no haya enlace
 * a la ficha: con `profileUrl` muestra el enlace; con `rating` y `count`, las estrellas y el número; con
 * `reviews`, una tira de hasta 3 reseñas. Nunca inventa datos.
 */
export function GoogleReviews({ data = googleReviews }: { data?: typeof googleReviews }) {
  if (!data.profileUrl) return null;
  const rated = hasGoogleRating(data);
  const reviews = data.reviews.filter((r) => r.text && r.author).slice(0, 3);
  return (
    <section className="wrap google-reviews" aria-labelledby="google-reviews-title">
      <div className="google-reviews-head">
        <div>
          <p className="eyebrow">OPINIONES DE CLIENTES</p>
          <h2 id="google-reviews-title">Lo que dicen en Google.</h2>
        </div>
        {rated && (
          <p className="google-reviews-score">
            <strong>{fmtRating.format(data.rating)}</strong>
            <Stars value={data.rating} />
            <span>
              {fmtCount.format(data.count)} {data.count === 1 ? "reseña" : "reseñas"}
            </span>
            <span className="sr-only">
              Valoración media de {fmtRating.format(data.rating)} sobre 5 en Google.
            </span>
          </p>
        )}
      </div>
      {reviews.length > 0 && (
        <ul className="google-reviews-list">
          {reviews.map((review) => (
            <li key={`${review.author}-${review.date}`}>
              <figure>
                <Stars value={review.rating} />
                <span className="sr-only">{review.rating} de 5 estrellas.</span>
                <blockquote>
                  <p>{review.text}</p>
                </blockquote>
                <figcaption>
                  {review.author}
                  {review.date && (
                    <>
                      {" · "}
                      <time dateTime={review.date}>{fmtDate.format(new Date(review.date))}</time>
                    </>
                  )}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      )}
      <a className="google-reviews-link" href={data.profileUrl} target="_blank" rel="noopener noreferrer">
        Ver nuestras reseñas en Google
        <ArrowUpRight size={18} />
        <span className="sr-only"> (se abre en otra pestaña)</span>
      </a>
    </section>
  );
}
