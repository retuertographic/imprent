/* eslint-disable @next/next/no-img-element */
"use client";

import type { RefObject } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { ChevronLeft, ChevronRight, MessageCircle, X } from "lucide-react";
import { asset, contact, type Project } from "./content";

type Props = {
  /** Fotos que recorre el lightbox (con las flechas y los botones), en orden. */
  items: Project[];
  /** Foto abierta (`null` = cerrado). */
  openId: string | null;
  onOpenIdChange: (id: string | null) => void;
  /** Elemento que recupera el foco al cerrar. */
  finalFocus: RefObject<HTMLElement | null>;
  /** Etiqueta superior (por defecto, la categoría de la foto). */
  label?: (item: Project) => string;
};

/**
 * Lightbox de trabajos reales (diálogo de Base UI: foco atrapado, Escape cierra y devuelve el foco).
 * Flechas izquierda/derecha para pasar de foto. Lo usan el carrusel de la portada y la galería.
 */
export function WorkLightbox({ items, openId, onOpenIdChange, finalFocus, label }: Props) {
  const openIndex = items.findIndex((item) => item.id === openId);
  const opened = openIndex >= 0 ? items[openIndex] : undefined;
  const move = (delta: number) => onOpenIdChange(items[(openIndex + delta + items.length) % items.length].id);

  return (
    <Dialog.Root
      open={Boolean(opened)}
      onOpenChange={(open) => {
        if (!open) onOpenIdChange(null);
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="work-lightbox-backdrop" />
        <Dialog.Popup
          className="work-lightbox"
          finalFocus={finalFocus}
          onKeyDown={(event) => {
            if (items.length < 2) return;
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              move(-1);
            }
            if (event.key === "ArrowRight") {
              event.preventDefault();
              move(1);
            }
          }}
        >
          {opened && (
            <>
              <div className="work-lightbox-top">
                <span>
                  {(label?.(opened) ?? (opened.presentation ? "Presentación digital" : opened.category)).toLocaleUpperCase("es")}
                  <i />
                  {openIndex + 1} / {items.length}
                </span>
                <Dialog.Close className="work-close" aria-label="Cerrar fotografía">
                  <X size={23} />
                </Dialog.Close>
              </div>
              <div className="work-lightbox-photo">
                <img key={opened.id} src={asset(`/trabajos/proyecto-${opened.id}-full.webp`)} alt={opened.description} />
              </div>
              <div className="work-lightbox-bottom">
                <div>
                  <Dialog.Title>{opened.title}</Dialog.Title>
                  <Dialog.Description>{opened.description}</Dialog.Description>
                </div>
                <a
                  className="work-enquire"
                  href={`${contact.whatsapp}?text=${encodeURIComponent(
                    `Hola Seritene, he visto en vuestra galería «${opened.title}» (proyecto ${opened.id}) y me gustaría consultar algo parecido.`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle size={18} />
                  Quiero algo así
                </a>
              </div>
              {items.length > 1 && (
                <div className="work-lightbox-nav">
                  <button type="button" onClick={() => move(-1)} aria-label="Fotografía anterior">
                    <ChevronLeft size={22} />
                  </button>
                  <span>Explora los detalles.</span>
                  <button type="button" onClick={() => move(1)} aria-label="Fotografía siguiente">
                    <ChevronRight size={22} />
                  </button>
                </div>
              )}
            </>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
