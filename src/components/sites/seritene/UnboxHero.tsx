/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { Search, Plus } from "lucide-react";
import { BASE_PATH, asset } from "./content";
import { SiteLink } from "./SiteLink";

type UnboxProduct = {
  name: string;
  href: string;
  image: string;
  /** Destino en escritorio, relativo al ancho/alto de la escena. */
  x: number;
  y: number;
  desktopTurn: number;
  turn: number;
  /** Arranque y destino en móvil. */
  mobileStartX: number;
  mobileX: number;
  mobileY: number;
  width: number;
  height: number;
  mobileWidth: number;
  mobileHeight: number;
};

const products: UnboxProduct[] = [
  { name: "Ropa", href: "/ropa/", image: "mockup-ropa", x: -0.34, y: -0.29, mobileStartX: -0.2, mobileX: 0.05, mobileY: -0.27, turn: 15, desktopTurn: 20, width: 12, height: 25, mobileWidth: 30, mobileHeight: 20 },
  { name: "Fullprint", href: "/fullprint/", image: "mockup-fullprint", x: -0.135, y: -0.19, mobileStartX: -0.2, mobileX: -0.28, mobileY: -0.15, turn: -15, desktopTurn: -19, width: 24, height: 44, mobileWidth: 45, mobileHeight: 40 },
  { name: "Merchandising", href: "/merchandising/", image: "mockup-merchandising", x: 0.135, y: -0.05, mobileStartX: 0.1, mobileX: 0.13, mobileY: 0.01, turn: 15, desktopTurn: -6, width: 17, height: 37, mobileWidth: 40, mobileHeight: 48 },
  { name: "Imprenta", href: "/imprenta/", image: "mockup-imprenta", x: -0.395, y: -0.53, mobileStartX: -0.32, mobileX: -0.31, mobileY: -0.45, turn: -15, desktopTurn: -12, width: 9, height: 20, mobileWidth: 25, mobileHeight: 20 },
  { name: "Ropa laboral", href: "/ropa-laboral/", image: "mockup-laboral", x: 0.31, y: -0.45, mobileStartX: 0.14, mobileX: 0.29, mobileY: -0.485, turn: 15, desktopTurn: 22, width: 13, height: 31, mobileWidth: 32, mobileHeight: 35 },
  { name: "Soportes publicitarios", href: "/soportes-publicitarios/", image: "mockup-banderas", x: 0.4, y: -0.28, mobileStartX: 0.3, mobileX: 0.4, mobileY: -0.24, turn: -15, desktopTurn: -12, width: 10, height: 21, mobileWidth: 30, mobileHeight: 20 },
];

const titles: [string, string][] = [
  ["Ponemos tu logo", "hasta en la sopa."],
  ["Tu marca merece", "salir del armario."],
  ["Vestimos equipos.", "Desatamos envidias."],
  ["Tu logo pide calle.", "Dale una camiseta."],
  ["Que hablen de ti.", "Y de tu sudadera."],
];

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (v: number) => {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
};

/** Apertura escalonada por producto. */
const stagger = (progress: number, index: number) => smooth((progress - index * 0.025) / (0.78 - index * 0.025));

type Size = { width: number; height: number };

function mobilePose(opts: {
  opened: number; width: number; height: number; item: Size; boxLip: number;
  startX: number; startY: number; targetX: number; targetY: number; turn: number;
}) {
  const f = clamp01(opts.opened);
  const x = (opts.startX + (opts.targetX - opts.startX) * f) * opts.width;
  const y = (opts.startY + (opts.targetY - opts.startY) * f) * opts.height;
  const scale = 0.18 + 0.82 * smooth(f);
  const rotation = opts.turn * f;
  const rad = (Math.abs(rotation) * Math.PI) / 180;
  const bottom = y + ((opts.item.height * Math.cos(rad) + opts.item.width * Math.sin(rad)) * scale) / 2;
  return { x, y, rotation, scale, layer: bottom < opts.boxLip ? 6 : 2 };
}

function desktopPose(opts: {
  opened: number; width: number; item: Size; boxLip: number; boxWidth: number;
  targetX: number; targetY: number; turn: number;
}) {
  const rise = smooth(opts.opened / 0.55);
  const spread = smooth((opts.opened - 0.55) / 0.45);
  const scale = 0.16 + 0.44 * rise + 0.4 * spread;
  const rotation = opts.turn * spread;
  const rad = (Math.abs(rotation) * Math.PI) / 180;
  const halfWidth = ((opts.item.width * Math.cos(rad) + opts.item.height * Math.sin(rad)) * scale) / 2;
  const limit = Math.max(0, opts.width / 2 - halfWidth - 12);
  const insideX = (opts.targetX / opts.width) * opts.boxWidth * 0.18;
  const x = Math.max(-limit, Math.min(limit, insideX + (opts.targetX - insideX) * spread));
  const startY = opts.boxLip + opts.item.height * 0.08 + opts.boxWidth * 0.055;
  const liftY = opts.boxLip - opts.item.height * 0.3 - 16;
  const y = startY + (liftY - startY) * rise + (opts.targetY - liftY) * spread;
  return { x, y, scale, rotation, layer: opts.opened > 0.55 ? 6 : 2, spread };
}

export function UnboxHero() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const scene = section?.querySelector<HTMLElement>(".unbox-scene");
    if (!section || !scene) return;

    const reducedQuery = matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = reducedQuery.matches;
    let paused = document.documentElement.classList.contains("motion-paused");
    let width = scene.clientWidth;
    let height = scene.clientHeight;
    let frame = 0;
    let lastTime = 0;
    let target = 0;
    let visible = true;
    let titleIndex = 0;
    const state = { progress: 0, time: 0 };

    const items = products.map((_, i) => section.querySelector<HTMLElement>(`.unbox-item-${i}`));
    const titleWrap = section.querySelector<HTMLElement>(".unbox-changing-title");
    const titleLead = titleWrap?.querySelector("span");
    const titleEm = titleWrap?.querySelector("em");
    const boxBack = scene.querySelector<HTMLElement>(".unbox-box-back");
    let boxLip = height * 0.75;
    let boxWidth = width * 0.52;
    let sizes: Size[] = items.map((el) => ({ width: el?.offsetWidth ?? 0, height: el?.offsetHeight ?? 0 }));

    const titleTimer = window.setInterval(() => {
      if (document.hidden || section.getBoundingClientRect().bottom <= 0 || reduced || paused || !titleLead || !titleEm || !titleWrap) return;
      titleIndex = (titleIndex + 1) % titles.length;
      titleLead.textContent = titles[titleIndex][0];
      titleEm.textContent = titles[titleIndex][1];
      titleWrap.style.animation = "none";
      void titleWrap.offsetWidth;
      titleWrap.style.animation = "";
    }, 4500);

    const readScroll = () => {
      const sticky = section.querySelector<HTMLElement>(".unbox-sticky");
      const travel = Math.max(1, section.offsetHeight - (sticky?.offsetHeight ?? innerHeight));
      target = clamp01(-section.getBoundingClientRect().top / travel);
    };

    const measure = () => {
      width = scene.clientWidth;
      height = scene.clientHeight;
      if (boxBack) {
        boxWidth = boxBack.offsetWidth;
        boxLip = boxBack.offsetTop + boxBack.offsetHeight * 0.04;
      }
      sizes = items.map((el) => ({ width: el?.offsetWidth ?? 0, height: el?.offsetHeight ?? 0 }));
      readScroll();
    };

    const render = () => {
      const progress = reduced ? 1 : state.progress;
      section.style.setProperty("--unbox-progress", String(progress));
      section.classList.toggle("unbox-is-open", progress > 0.18);

      products.forEach((product, i) => {
        const el = items[i];
        if (!el) return;
        const focused = el.matches(":focus-visible");
        const opened = focused ? 1 : stagger(progress, i);

        if (width <= 600) {
          const startY = (boxLip + sizes[i].height * 0.11 + 6) / height;
          const pose = mobilePose({
            opened: focused || reduced ? 1 : stagger(progress, 0),
            width, height, item: sizes[i], boxLip,
            startX: product.mobileStartX, startY,
            targetX: product.mobileX, targetY: 0.79 + product.mobileY, turn: product.turn,
          });
          el.style.transform = `translate(-50%,-50%) translate3d(${pose.x}px,${pose.y - height * 0.79}px,0) rotate(${pose.rotation}deg) scale(${pose.scale})`;
          el.style.opacity = "1";
          el.style.zIndex = String(focused ? 8 : pose.layer);
          el.style.pointerEvents = "auto";
          el.style.setProperty("--label-opacity", "1");
          return;
        }

        const pose = desktopPose({
          opened, width, item: sizes[i], boxLip, boxWidth,
          targetX: product.x * width, targetY: (0.79 + product.y) * height, turn: product.desktopTurn,
        });
        const float = paused || reduced ? 0 : Math.sin(state.time / 1000 + i) * 4 * pose.spread;
        el.style.transform = `translate(-50%,-50%) translate3d(${pose.x}px,${pose.y - height * 0.79 + float}px,0) rotate(${pose.rotation}deg) scale(${pose.scale})`;
        el.style.opacity = String(Math.min(1, opened * 12));
        el.style.zIndex = String(focused ? 8 : pose.layer);
        el.style.pointerEvents = opened > 0.55 ? "auto" : "none";
        el.style.setProperty("--label-opacity", String(pose.spread));
      });
    };

    const tick = (now: number) => {
      const dt = lastTime ? Math.min(now - lastTime, 50) : 16;
      lastTime = now;
      if (!paused && !reduced) {
        state.progress += (target - state.progress) * (1 - Math.exp(-dt * (width <= 600 ? 0.009 : 0.014)));
        if (Math.abs(target - state.progress) < 5e-4) state.progress = target;
        state.time += dt;
      }
      render();
      const keepGoing =
        visible && !document.hidden && !paused && !reduced &&
        (Math.abs(target - state.progress) > 5e-4 || (width > 600 && state.progress > 0.55));
      if (keepGoing) frame = requestAnimationFrame(tick);
      else {
        frame = 0;
        lastTime = 0;
      }
    };

    const start = () => {
      if (!frame && visible && !document.hidden) frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
    };
    const onScroll = () => {
      readScroll();
      start();
    };
    const onFocus = () => {
      render();
      start();
    };

    const resizeObserver = new ResizeObserver(() => {
      measure();
      render();
    });
    resizeObserver.observe(scene);
    const heading = section.querySelector(".unbox-heading");
    if (heading) resizeObserver.observe(heading);

    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) {
        readScroll();
        start();
      } else stop();
    });
    intersection.observe(section);

    const onReducedChange = () => {
      reduced = reducedQuery.matches;
      render();
      start();
    };
    const classObserver = new MutationObserver(() => {
      paused = document.documentElement.classList.contains("motion-paused");
      render();
      start();
    });
    classObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    const onVisibility = () => (document.hidden ? stop() : start());

    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    scene.addEventListener("focusin", onFocus);
    scene.addEventListener("focusout", onFocus);
    reducedQuery.addEventListener("change", onReducedChange);

    measure();
    render();
    start();

    return () => {
      clearInterval(titleTimer);
      stop();
      resizeObserver.disconnect();
      intersection.disconnect();
      classObserver.disconnect();
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      scene.removeEventListener("focusin", onFocus);
      scene.removeEventListener("focusout", onFocus);
      reducedQuery.removeEventListener("change", onReducedChange);
    };
  }, []);

  const box = asset("/optimized/seritene-black-box-720.webp");
  const boxSrcSet = `${asset("/optimized/seritene-black-box-360.webp")} 360w, ${box} 720w`;
  const ribbonSet = (
    <span className="hero-ribbon-set">
      <b>ROPA</b>
      <b>FULLPRINT</b>
      <b>MERCHANDISING</b>
    </span>
  );
  const ribbonGroup = (
    <div className="hero-ribbon-group">
      {ribbonSet}
      {ribbonSet}
      {ribbonSet}
    </div>
  );

  return (
    <section ref={sectionRef} className="unbox-section" aria-label="Textil y merchandising personalizados en Tenerife">
      <noscript>
        <style>{".unbox-product{opacity:1!important;pointer-events:auto!important}"}</style>
      </noscript>
      <div className="unbox-sticky">
        <div className="wrap unbox-heading">
          <p className="unbox-kicker">
            SERITENE® · FÁBRICA DE IDEAS
            <span className="hero-topic">Textil personalizado y merchandising en Tenerife</span>
          </p>
          <h1>
            <span className="sr-only">Textil y merchandising personalizados en Tenerife.</span>
            <span className="unbox-changing-title" aria-hidden="true">
              <span>{titles[0][0]}</span>
              <em>{titles[0][1]}</em>
            </span>
          </h1>
          <form className="unbox-main-search" role="search" action={`${BASE_PATH}/productos/`}>
            <label className="sr-only" htmlFor="hero-search">
              Busca lo que necesitas: productos, servicios y apartados
            </label>
            <input
              id="hero-search"
              type="search"
              required
              minLength={2}
              maxLength={100}
              placeholder="Busca lo que necesitas"
              autoComplete="off"
              name="q"
            />
            <button type="submit" aria-label="Buscar en toda la web">
              <Search size={20} />
            </button>
          </form>
          <SiteLink className="unbox-catalog-shortcut" href={"/productos/"}>
            Prefiero explorar el catálogo
          </SiteLink>
        </div>
        <div className="unbox-scene">
          <div className="unbox-halo" aria-hidden="true" />
          <span className="unbox-watermark" aria-hidden="true">
            SACA
            <br />
            TU MARCA.
          </span>
          <img
            className="unbox-box unbox-box-back"
            src={box}
            srcSet={boxSrcSet}
            sizes="(max-width:600px) 98vw, 46vw"
            alt="Caja Seritene de la que salen productos personalizados al deslizar"
            width={1254}
            height={1254}
            fetchPriority="high"
          />
          {products.map((product, i) => {
            const src = asset(`/optimized/${product.image}-720.webp`);
            const style = {
              opacity: 0,
              pointerEvents: "none",
              "--product-width": `${product.width}%`,
              "--product-height": `${product.height}%`,
              "--mobile-width": `${product.mobileWidth}%`,
              "--mobile-height": `${product.mobileHeight}%`,
              "--fallback-x": `${product.x * 100}cqw`,
              "--fallback-y": `${product.y * 100}cqh`,
              "--fallback-turn": `${product.desktopTurn}deg`,
            } as CSSProperties;
            return (
              <SiteLink
                key={product.name}
                className={`unbox-product unbox-item-${i}`}
                href={product.href}
                aria-label={`Ver ${product.name.toLowerCase()}`}
                style={style}
              >
                <span className="unbox-product-hover">
                  <span className="bold-product-cutout supplied-product" aria-hidden="true">
                    <img
                      src={src}
                      srcSet={`${asset(`/optimized/${product.image}-360.webp`)} 360w, ${src} 720w`}
                      sizes="(max-width:600px) 45vw, 24vw"
                      alt=""
                      width={1200}
                      height={1500}
                      loading="lazy"
                      decoding="async"
                    />
                  </span>
                  <span className="unbox-label">
                    {product.name}
                    <Plus size={14} />
                  </span>
                </span>
              </SiteLink>
            );
          })}
          <img className="unbox-box unbox-box-front" src={box} srcSet={boxSrcSet} sizes="(max-width:600px) 98vw, 46vw" alt="" aria-hidden="true" width={1254} height={1254} />
          <div className="unbox-box-message">
            <span>Aquí dentro se esconden</span>
            <strong>tus futuros</strong>
            <em>productos...</em>
          </div>
        </div>
        <div className="hero-ribbon" role="img" aria-label="Ropa, fullprint y merchandising">
          <div className="hero-ribbon-track" aria-hidden="true">
            {ribbonGroup}
            {ribbonGroup}
          </div>
        </div>
      </div>
    </section>
  );
}
