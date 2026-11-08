import "../styles/seritene/imprenta.css";
import "../styles/seritene/print.css";
import "../styles/seritene/shop.css";
import { pageMetadata } from "@/components/sites/seritene/shop/metadata";
import { ImprentaPage } from "@/components/sites/seritene/shop/PrintPages";

export const metadata = pageMetadata(
  "Imprenta en Tenerife: flyers, tarjetas y más",
  "Flyers, dípticos, trípticos, tarjetas de visita, pulseras y abanicos personalizados en Tenerife y Canarias. Elige tu producto y consulta precios por cantidad.",
  "/imprenta/",
);

export default function Page() {
  return <ImprentaPage />;
}
