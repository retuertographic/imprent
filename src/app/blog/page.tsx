import { BlogIndex } from "@/components/sites/seritene/pages/Blog";
import { pageMetadata } from "@/components/sites/seritene/pages/meta";

export const metadata = pageMetadata(
  "/blog/",
  "Ideas y guías de personalización textil",
  "Guías para elegir camisetas personalizadas, técnicas de impresión y preparar pedidos para tu empresa o club en Tenerife.",
);

export default function Page() {
  return <BlogIndex />;
}
