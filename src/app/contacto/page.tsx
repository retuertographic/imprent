import { ContactPage } from "@/components/sites/seritene/pages/ContactPage";
import { pageMetadata } from "@/components/sites/seritene/pages/meta";

export const metadata = pageMetadata(
  "/contacto/",
  "Contacto y presupuestos | Seritene Tenerife",
  "Cuéntanos tu proyecto de textil, fullprint o merchandising. Contacta con Seritene por teléfono, correo o WhatsApp.",
  true,
);

export default function Page() {
  return <ContactPage />;
}
