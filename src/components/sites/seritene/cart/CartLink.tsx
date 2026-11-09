"use client";
import { ShoppingCart } from "lucide-react";
import { SiteLink } from "../SiteLink";
import { useCart } from "./useCart";

/** Icono del carrito de la cabecera (`.ch-icon.ch-cart`) con el número de selecciones, en vivo. */
export function CartLink() {
  const count = useCart().cart.items.length;
  return (
    <SiteLink
      className="ch-icon ch-cart"
      href="/carrito/"
      aria-label={`Carrito: ${count} ${count === 1 ? "selección" : "selecciones"}`}
    >
      <ShoppingCart size={21} />
      {count > 0 && <span>{count}</span>}
    </SiteLink>
  );
}
