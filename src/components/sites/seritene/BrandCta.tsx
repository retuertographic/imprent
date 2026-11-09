"use client";

import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { SiteLink } from "./SiteLink";

/** Banda verde previa al pie en todas las páginas salvo la home. */
export function BrandCta() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return (
    <section className="brand-cta">
      <div className="wrap">
        <p className="eyebrow">SIN IDEAS ABURRIDAS, POR FAVOR.</p>
        <div>
          <h2>
            ¿La liamos
            <br />
            <em>con tu logo?</em>
          </h2>
          <SiteLink className="brand-button light" href="/contacto/">
            Venga, vamos allá <Plus size={18} />
          </SiteLink>
        </div>
      </div>
    </section>
  );
}
