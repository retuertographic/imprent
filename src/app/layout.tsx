import type { Metadata } from "next";
// Estilos de producción de seritene.com (incluyen Tailwind v4 ya compilado).
// Se importan por separado para que el plugin de Tailwind no los reprocese.
import "./styles/seritene/base.css";
import "./styles/seritene/site-shell.css";
import { RevealMotion } from "@/components/sites/seritene/RevealMotion";
import { SiteFooter } from "@/components/sites/seritene/SiteFooter";
import { SiteHeader } from "@/components/sites/seritene/SiteHeader";

export const metadata: Metadata = {
  metadataBase: new URL("https://seritene.com"),
  title: {
    default: "Seritene | Textil personalizado y merchandising en Tenerife",
    template: "%s | Seritene",
  },
  description:
    "Ropa personalizada, camisetas fullprint, merchandising e imprenta en Tenerife. Consulta stock y precios según cantidad y marcaje, y solicita tu pedido por WhatsApp.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
        <RevealMotion />
      </body>
    </html>
  );
}
