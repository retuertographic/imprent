import { Sparkles } from "lucide-react";
import { SiteLink } from "../SiteLink";
import type { BlogPost } from "./blogPosts";
import { blogPosts } from "./blogPosts";
import { Breadcrumbs, PageIntro, pad2 } from "./common";

/** Listado /blog/. */
export function BlogIndex() {
  return (
    <main id="contenido" className="brand-main">
      <Breadcrumbs items={[{ label: "Ideas y guías" }]} />
      <PageIntro eyebrow="UN POCO DE CRITERIO, MUCHA INSPIRACIÓN" title="Ideas que toman forma.">
        Guías para elegir prendas, entender los acabados y preparar tu próximo pedido personalizado en Tenerife y Canarias.
      </PageIntro>
      <section className="wrap blog-grid">
        {blogPosts.map((post, i) => (
          <SiteLink key={post.slug} href={`/blog/${post.slug}/`} className="article-card reveal">
            <div className={`article-graphic ${post.graphic}`}>
              <span>
                GUÍA
                <br />
                {pad2(i + 1)}
              </span>
              <Sparkles size={56} />
            </div>
            <p className="eyebrow">{post.eyebrow}</p>
            <h2>{post.title}</h2>
            <p>{post.lead}</p>
            <span className="text-cta">Leer la guía</span>
          </SiteLink>
        ))}
      </section>
    </main>
  );
}

/** Artículo del blog. */
export function BlogArticle({ post }: { post: BlogPost }) {
  return (
    <main className="brand-main" id="contenido">
      <Breadcrumbs items={[{ label: "Ideas y guías", href: "/blog/" }, { label: post.title }]} />
      <article className="article-body">
        <p className="eyebrow">{post.eyebrow}</p>
        <h1>{post.title}</h1>
        <p className="article-lead">{post.lead}</p>
        {post.sections.map((section, i) => (
          <section key={section.heading}>
            <span>{pad2(i + 1)}</span>
            <h2>{section.heading}</h2>
            <p>{section.text}</p>
          </section>
        ))}
        {post.related && (
          <section>
            <h2>{post.related.heading}</h2>
            <ul>
              {post.related.links.map((link) => (
                <li key={link.href}>
                  <SiteLink className="text-cta" href={link.href}>
                    {link.label}
                  </SiteLink>
                </li>
              ))}
            </ul>
          </section>
        )}
        <div className="article-consult">
          <h2>¿Lo aplicamos a tu proyecto?</h2>
          <p>Cuéntanos lo que necesitas y revisamos contigo la prenda y la personalización.</p>
          <SiteLink className="brand-button" href="/contacto/">
            Pedir asesoramiento
          </SiteLink>
        </div>
        <SiteLink className="text-cta" href="/blog/">
          Ver todas las guías
        </SiteLink>
      </article>
    </main>
  );
}
