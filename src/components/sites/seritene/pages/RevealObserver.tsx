"use client";

import { useEffect } from "react";

/**
 * Aparición suave de los elementos `.reveal` al entrar en pantalla (como en seritene.com).
 * Sin JavaScript o con movimiento reducido, el contenido se muestra tal cual.
 */
export function RevealObserver() {
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
  }, []);
  return null;
}
