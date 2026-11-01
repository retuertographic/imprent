"use client";

import { useEffect, useState, type RefObject } from "react";

/** Estado común de los carruseles: movimiento permitido, pestaña visible y sección en pantalla. */
export function useCarouselEnvironment(ref: RefObject<HTMLElement | null>, threshold: number) {
  const [motionAllowed, setMotionAllowed] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const reducedQuery = matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () =>
      setMotionAllowed(!reducedQuery.matches && !document.documentElement.classList.contains("motion-paused"));
    const syncVisibility = () => setPageVisible(!document.hidden);
    syncMotion();
    syncVisibility();

    const intersection = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold });
    if (ref.current) intersection.observe(ref.current);
    const classObserver = new MutationObserver(syncMotion);
    classObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    reducedQuery.addEventListener("change", syncMotion);
    document.addEventListener("visibilitychange", syncVisibility);

    return () => {
      intersection.disconnect();
      classObserver.disconnect();
      reducedQuery.removeEventListener("change", syncMotion);
      document.removeEventListener("visibilitychange", syncVisibility);
    };
  }, [ref, threshold]);

  return { motionAllowed, pageVisible, inView };
}
