"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  Ellipsis,
  Menu,
  MessageCircle,
  Pause,
  Play,
  Search,
  X,
} from "lucide-react";
import { asset, contact, navCategories, utilityLinks } from "./content";
import { HeaderSearch } from "./HeaderSearch";
import { SiteLink } from "./SiteLink";
import { CartLink } from "./cart/CartLink";

export function SiteHeader() {
  const pathname = usePathname();
  const isCurrent = (href: string) =>
    href === "/merchandising/" ? pathname.startsWith(href) && !pathname.includes("/medallas-") : pathname.startsWith(href);
  const [moreOpen, setMoreOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [panel, setPanel] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const searchToggleRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const moreToggleRef = useRef<HTMLButtonElement>(null);
  const panelButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  // Botones candidatos a recibir el foco tras cerrar con Escape (se usa el primero visible).
  const pendingFocus = useRef<(HTMLElement | null | undefined)[] | null>(null);

  const closeAll = () => {
    setMenuOpen(false);
    setPanel(null);
    setSearchOpen(false);
    setMoreOpen(false);
  };

  // Al navegar a otra página se cierran menús y buscador (ajuste de estado en render, sin efecto).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    closeAll();
  }

  useEffect(() => {
    document.documentElement.classList.toggle("motion-paused", paused);
  }, [paused]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) closeAll();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  // Tras cerrar con Escape, el foco vuelve al botón que abrió el panel si sigue visible
  // (en móvil el botón de categoría queda oculto al cerrar el menú: se usa la hamburguesa).
  useEffect(() => {
    const candidates = pendingFocus.current;
    if (!candidates) return;
    pendingFocus.current = null;
    candidates.find((el) => el && el.getClientRects().length > 0)?.focus();
  });

  const onEscape = () => {
    const menuToggle = menuToggleRef.current;
    if (panel && menuOpen) {
      // Menú móvil con una categoría desplegada: se pliega solo la categoría.
      setPanel(null);
      pendingFocus.current = [panelButtonRefs.current[panel], menuToggle];
      return;
    }
    if (panel) pendingFocus.current = [panelButtonRefs.current[panel], menuToggle];
    else if (searchOpen) pendingFocus.current = [searchToggleRef.current, searchInputRef.current];
    else if (moreOpen) pendingFocus.current = [moreToggleRef.current];
    else if (menuOpen) pendingFocus.current = [menuToggle];
    else return;
    closeAll();
  };

  const pauseLabel = `${paused ? "Activar" : "Pausar"} animaciones`;

  return (
    <>
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      <header
        className="catalog-header"
        ref={headerRef}
        onKeyDown={(event) => {
          if (event.key === "Escape") onEscape();
        }}
        onBlur={(event) => {
          // Si el foco sale de la cabecera (Tab fuera del panel), se cierran los paneles abiertos.
          const next = event.relatedTarget;
          if (next instanceof Node && !event.currentTarget.contains(next)) closeAll();
        }}
      >
        <div className="ch-main ch-inner">
          <Link className="ch-logo" href="/" aria-label="Seritene, inicio">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset("/seritene-logo.webp")} width={175} height={68} alt="Seritene · Creaciones publicitarias" />
          </Link>
          <nav
            id="seritene-categories"
            className={`ch-categories${menuOpen ? " ch-open" : ""}`}
            aria-label="Categorías de productos"
          >
            <div className="ch-inner ch-category-row">
              {navCategories.map((category, index) => (
                <div
                  key={category.name}
                  className={`ch-category${panel === category.name ? " ch-active" : ""}`}
                >
                  {category.links ? (
                    <>
                      <button
                        ref={(el) => {
                          panelButtonRefs.current[category.name] = el;
                        }}
                        aria-expanded={panel === category.name}
                        aria-controls={`ch-panel-${index}`}
                        className={isCurrent(category.href) ? "ch-current" : ""}
                        onClick={() => {
                          setPanel(panel === category.name ? null : category.name);
                          setSearchOpen(false);
                          setMoreOpen(false);
                        }}
                      >
                        {category.name}
                        <ChevronDown size={14} />
                      </button>
                      <div className="ch-panel" id={`ch-panel-${index}`} hidden={panel !== category.name}>
                        <div className="ch-panel-heading">
                          <span>EXPLORA {category.name.toUpperCase()}</span>
                          <SiteLink href={category.href}>
                            Ver todo <ArrowUpRight size={16} />
                          </SiteLink>
                        </div>
                        <div className="ch-panel-links">
                          {category.links.map((link) => (
                            <SiteLink key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined}>
                              {link.name}
                              <ArrowUpRight size={14} />
                            </SiteLink>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <SiteLink href={category.href} aria-current={isCurrent(category.href) ? "page" : undefined}>
                      {category.name}
                    </SiteLink>
                  )}
                </div>
              ))}
              <div className="ch-mobile-utility">
                {utilityLinks.map(([name, href]) => (
                  <SiteLink key={href} href={href}>
                    {name}
                  </SiteLink>
                ))}
                <button onClick={() => setPaused(!paused)}>{pauseLabel}</button>
              </div>
            </div>
          </nav>
          <HeaderSearch open={searchOpen} inputRef={searchInputRef} />
          <div className="ch-actions">
            <CartLink />
            <button
              className="ch-icon ch-search-toggle"
              ref={searchToggleRef}
              onClick={() => {
                setSearchOpen(!searchOpen);
                setMenuOpen(false);
                setPanel(null);
                setMoreOpen(false);
              }}
              aria-label={searchOpen ? "Cerrar buscador" : "Abrir buscador"}
              aria-expanded={searchOpen}
            >
              {searchOpen ? <X size={21} /> : <Search size={21} />}
            </button>
            <button
              className="ch-icon ch-more-toggle"
              ref={moreToggleRef}
              aria-label="Más sobre Seritene"
              aria-expanded={moreOpen}
              onClick={() => {
                setMoreOpen(!moreOpen);
                setPanel(null);
                setSearchOpen(false);
              }}
            >
              <Ellipsis size={20} />
            </button>
            <button
              className="ch-icon ch-menu-toggle"
              ref={menuToggleRef}
              onClick={() => {
                setMenuOpen(!menuOpen);
                setSearchOpen(false);
                setMoreOpen(false);
              }}
              aria-expanded={menuOpen}
              aria-controls="seritene-categories"
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            >
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        <div className="ch-more" hidden={!moreOpen}>
          <nav aria-label="Sobre Seritene">
            {utilityLinks.map(([name, href]) => (
              <SiteLink key={href} href={href}>
                {name}
                <ArrowUpRight size={14} />
              </SiteLink>
            ))}
            <a href={contact.whatsapp} target="_blank" rel="noreferrer">
              WhatsApp
              <MessageCircle size={16} />
            </a>
            <button onClick={() => setPaused(!paused)}>
              {pauseLabel}
              {paused ? <Play size={14} /> : <Pause size={14} />}
            </button>
          </nav>
        </div>
      </header>
    </>
  );
}
