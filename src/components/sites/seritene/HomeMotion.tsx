"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Animaciones de la home:
 * - `[data-enter]`: aparece al entrar en pantalla (`data-in`) y expone `--leave` al salir por arriba.
 * - `[data-scrub]`: expone `--scrub` (-1…1) según su posición en el viewport.
 */
export function HomeMotion({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const enters = Array.from(root.querySelectorAll<HTMLElement>("[data-enter]"));
    const scrubs = Array.from(root.querySelectorAll<HTMLElement>("[data-scrub]"));
    const reducedQuery = matchMedia("(prefers-reduced-motion: reduce)");
    let enabled = false;
    let frame = 0;
    const activeEnters = new Set<HTMLElement>();
    const activeScrubs = new Set<HTMLElement>();

    const markActive = () =>
      document.documentElement.classList.toggle(
        "home-content-active",
        root.getBoundingClientRect().top < window.innerHeight * 0.25,
      );

    const update = () => {
      frame = 0;
      markActive();
      if (!enabled) return;
      const vh = window.innerHeight;
      activeEnters.forEach((el) => {
        const r = el.getBoundingClientRect();
        const leave = Math.max(0, Math.min(1, (-r.top - r.height * 0.65) / (r.height * 0.5 + 40)));
        el.style.setProperty("--leave", leave.toFixed(3));
        if (r.top < vh && r.bottom > 0) el.dataset.in = "true";
      });
      activeScrubs.forEach((el) => {
        const r = el.getBoundingClientRect();
        const scrub = Math.max(-1, Math.min(1, ((vh - r.top) / (vh + r.height) - 0.5) * 2));
        el.style.setProperty("--scrub", scrub.toFixed(3));
      });
    };
    const schedule = () => {
      frame ||= requestAnimationFrame(update);
    };

    const sync = () => {
      enabled = !reducedQuery.matches && !document.documentElement.classList.contains("motion-paused");
      root.dataset.motion = String(enabled);
      if (enabled) schedule();
      else {
        cancelAnimationFrame(frame);
        frame = 0;
        enters.forEach((el) => {
          el.dataset.in = "true";
          el.style.setProperty("--leave", "0");
        });
        scrubs.forEach((el) => el.style.setProperty("--scrub", "0"));
      }
    };

    enters.forEach((el) => {
      el.style.setProperty("--enter-delay", `${Math.min(Number(el.dataset.delay) || 0, 250)}ms`);
      const r = el.getBoundingClientRect();
      el.dataset.in = String(r.top < window.innerHeight && r.bottom > 0);
    });

    const enterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            activeEnters.add(el);
            el.dataset.in = "true";
          } else {
            activeEnters.delete(el);
            el.dataset.in = "false";
            el.style.setProperty("--leave", "0");
          }
        });
        schedule();
      },
      { threshold: 0, rootMargin: "0px 0px -35px 0px" },
    );
    const scrubObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) activeScrubs.add(entry.target as HTMLElement);
          else activeScrubs.delete(entry.target as HTMLElement);
        });
        schedule();
      },
      { rootMargin: "80px" },
    );
    enters.forEach((el) => enterObserver.observe(el));
    scrubs.forEach((el) => scrubObserver.observe(el));

    const classObserver = new MutationObserver(sync);
    classObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    sync();
    markActive();
    reducedQuery.addEventListener("change", sync);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });

    return () => {
      enterObserver.disconnect();
      scrubObserver.disconnect();
      classObserver.disconnect();
      document.documentElement.classList.remove("home-content-active");
      cancelAnimationFrame(frame);
      reducedQuery.removeEventListener("change", sync);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <div className="home-editorial" ref={ref} data-motion="false">
      {children}
    </div>
  );
}
