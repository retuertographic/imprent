import type { Metadata } from "next";
// Estilos de producción de seritene.com (incluyen Tailwind v4 ya compilado).
// Se importan por separado para que el plugin de Tailwind no los reprocese.
import "./styles/seritene/base.css";
import "./styles/seritene/site-shell.css";
import "./styles/seritene/home.css";
import "./styles/seritene/home-projects.css";
import "./styles/seritene/home-team.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://seritene.com"),
  title: "Seritene | Textil personalizado y merchandising en Tenerife",
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
      <head>
        <link rel="preload" href="/sites/seritene/montserrat-semibold-core.woff2" as="font" type="font/woff2" crossOrigin="" />
      </head>
      <body>{children}</body>
    </html>
  );
}
