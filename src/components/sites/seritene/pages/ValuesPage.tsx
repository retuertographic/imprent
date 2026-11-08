import { SiteLink } from "../SiteLink";
import { Breadcrumbs, PageIntro, pad2 } from "./common";

const values = [
  {
    name: "Cercanía",
    text: "Detrás de cada consulta hay una persona. Escuchamos el uso, el presupuesto y los detalles que hacen diferente tu proyecto.",
  },
  {
    name: "Criterio",
    text: "Recomendamos prendas y técnicas según el resultado que buscas. Te explicamos las opciones para que puedas elegir.",
  },
  {
    name: "Cuidado",
    text: "Revisamos diseños, ubicaciones y personalizaciones. El detalle pequeño también forma parte de la imagen de tu marca.",
  },
  {
    name: "Creatividad",
    text: "Exploramos cómo trasladar tu identidad a tejidos y soportes distintos, manteniendo una línea visual coherente.",
  },
];

/** /nuestros-valores/ */
export function ValuesPage() {
  return (
    <main id="contenido" className="brand-main">
      <Breadcrumbs items={[{ label: "Nuestros valores" }]} />
      <PageIntro eyebrow="SERITENE · CREACIONES PUBLICITARIAS" title="Lo que hacemos. Cómo lo hacemos.">
        Somos una empresa familiar de Tenerife. Nos mueve convertir ideas en prendas y productos que representan a las
        personas que hay detrás.
      </PageIntro>
      <section className="about-manifesto">
        <div className="wrap">
          <span className="about-number">
            35<span>+</span>
          </span>
          <div>
            <p className="eyebrow">OFICIO QUE SIGUE EVOLUCIONANDO</p>
            <h2>
              La experiencia
              <br />
              se lleva dentro.
            </h2>
            <p>
              La personalización textil es nuestra especialidad. Combinamos técnicas de impresión, diseño y fabricación
              fullprint para acompañar a empresas, clubes, asociaciones y particulares.
            </p>
            <p>Cada proyecto empieza con una conversación: entender qué necesitas para darle forma con criterio.</p>
          </div>
        </div>
      </section>
      <section className="wrap section-pad values-grid">
        {values.map((value, i) => (
          <article className="reveal" key={value.name}>
            <span>{pad2(i + 1)}</span>
            <h2>{value.name}</h2>
            <p>{value.text}</p>
          </article>
        ))}
      </section>
      <section className="wrap about-bottom section-pad">
        <h2>
          De Tenerife.
          <br />
          <em>Con identidad propia.</em>
        </h2>
        <p>
          Trabajamos con proyectos de toda la isla y atendemos consultas desde el resto de Canarias. Cuéntanos dónde estás
          y qué tienes en mente.
        </p>
        <SiteLink className="brand-button" href="/contacto/">
          Conócenos de cerca
        </SiteLink>
      </section>
    </main>
  );
}
