import type { Metadata } from "next";
import { CartView } from "@/components/sites/seritene/cart/CartView";

// Igual que producción: sin canonical y fuera de buscadores.
export const metadata: Metadata = {
  title: "Tu carrito",
  description: "Personalización textil, fullprint y merchandising en Tenerife y Canarias.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CartView />;
}
