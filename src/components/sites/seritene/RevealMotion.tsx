"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Aparición suave de los elementos `.reveal` al entrar en pantalla (como en seritene.com).
 * Sin JavaScript o con movimiento reducido, el contenido se muestra tal cual.
 * Montado en el layout: se vuelve a ejecutar en cada cambio de página.
 */
export function RevealMotion() {
  const pathname = usePathname();
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const elements = document.querySelectorAll<HTMLElement>(".reveal:not(.revealed)");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 },
    );
    elements.forEach((el) => {
      el.classList.add("reveal-ready");
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, [pathname]);
  return null;
}
