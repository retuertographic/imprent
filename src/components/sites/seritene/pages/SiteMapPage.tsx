import { Plus } from "lucide-react";
import { SiteLink } from "../SiteLink";
import { PageIntro } from "./common";
import { siteMapLinks } from "./siteMapLinks";

/** /mapa-web/ */
export function SiteMapPage() {
  return (
    <main id="contenido" className="brand-main">
      <PageIntro eyebrow="TODOS LOS CAMINOS" title="Explora Seritene.">
        Encuentra cada apartado de nuestra web.
      </PageIntro>
      <div className="wrap map-links">
        {siteMapLinks.map(([href, label]) => (
          <SiteLink key={href} href={href}>
            {label}
            <Plus size={18} />
          </SiteLink>
        ))}
      </div>
    </main>
  );
}
