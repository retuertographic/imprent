import { ORIGIN, contact, mapsUrl } from "./content";

/**
 * Grafo JSON-LD de todo el sitio (LocalBusiness + logo + WebSite + servicios), copia del que publica
 * seritene.com en cada página, con `hasMap` y `geo` desde `contact`. Las URL apuntan a producción
 * porque los canonicals también lo hacen. Las fichas y páginas de servicio enlazan a estos nodos por
 * `@id` (`/#organization`, `/#website`) y usan los suyos propios (`/producto/…/#product`, `…/#service`).
 * Sin `openingHoursSpecification` hasta tener el horario del cliente.
 */
const ORG_ID = `${ORIGIN}/#organization`;
const LOGO_ID = `${ORIGIN}/#logo`;

const canarias = [
  { "@type": "Place", name: "Tenerife" },
  { "@type": "AdministrativeArea", name: "Canarias" },
];

const services: [path: string, name: string, description: string][] = [
  [
    "/textil-personalizado/",
    "Textil personalizado en Tenerife",
    "Camisetas, polos, sudaderas y ropa de trabajo con la personalidad de tu empresa, equipo o evento. En Seritene te acompañamos desde la elección de la prenda hasta el acabado.",
  ],
  [
    "/fullprint/",
    "Camisetas fullprint y sublimación en Tenerife",
    "Diseña más allá del pecho. La impresión fullprint integra colores, gráficos y patrocinadores en toda la superficie de la prenda, con fabricación propia en Tenerife.",
  ],
  [
    "/merchandising/",
    "Merchandising y regalos personalizados en Tenerife",
    "Tazas, botellas, bolsas, libretas y regalos promocionales para que tu marca siga presente después de un evento. El soporte y el acabado se eligen juntos.",
  ],
  [
    "/rotulacion/",
    "Rotulación, lonas y cartelería en Tenerife",
    "Soportes para que tu negocio o evento gane presencia: lonas, banderas, vinilos y cartelería con una imagen coherente.",
  ],
  [
    "/diseno-grafico/",
    "Diseño gráfico e identidad visual en Tenerife",
    "Damos forma a la identidad visual de tu proyecto y la adaptamos para que funcione sobre prendas, productos y soportes publicitarios.",
  ],
  [
    "/imprenta/",
    "Imprenta y tarjetas de visita en Tenerife",
    "Tarjetas de visita y papelería con tu identidad. Cuéntanos el formato, las unidades y la fecha: preparamos una propuesta para tu proyecto.",
  ],
  [
    "/ropa-laboral/",
    "Ropa laboral personalizada en Tenerife",
    "Pantalones multibolsillos y prendas para el día a día de tu equipo. Elegimos la referencia y el marcaje según el uso y la composición.",
  ],
  [
    "/banderas-rollups/",
    "Soportes publicitarios personalizados en Tenerife",
    "Banderas y roll-ups personalizados para tu negocio, feria o evento en Tenerife y Canarias. Tu diseño, en un soporte que se hace notar.",
  ],
];

const serviceId = (path: string) => `${ORIGIN}${path}#service`;

const graph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": ORG_ID,
      name: contact.businessName,
      legalName: "José Enrique Ferrera Torres",
      foundingDate: "1991",
      address: {
        "@type": "PostalAddress",
        streetAddress: contact.address.street,
        addressLocality: contact.address.locality,
        addressRegion: contact.address.region,
        postalCode: contact.address.postalCode,
        addressCountry: contact.address.country,
      },
      geo: { "@type": "GeoCoordinates", latitude: contact.geo.lat, longitude: contact.geo.lng },
      hasMap: mapsUrl,
      alternateName: "Seritene",
      url: `${ORIGIN}/`,
      description:
        "Taller de personalización textil en La Orotava, Tenerife, desde 1991. Serigrafía, bordado, DTF, sublimación, fullprint, imprenta y productos promocionales para empresas, clubes, eventos y particulares.",
      logo: { "@id": LOGO_ID },
      image: { "@id": LOGO_ID },
      telephone: contact.phone,
      email: contact.email,
      knowsLanguage: "es",
      areaServed: [
        ...["La Orotava", "Puerto de la Cruz", "Santa Cruz de Tenerife", "San Cristóbal de La Laguna", "Los Realejos", "Costa Adeje"].map(
          (name) => ({ "@type": "Place", name }),
        ),
        { "@type": "AdministrativeArea", name: "Tenerife" },
        { "@type": "AdministrativeArea", name: "Canarias" },
      ],
      knowsAbout: [
        "Serigrafía textil",
        "Bordado",
        "Impresión DTF",
        "Vinilo textil",
        "Sublimación",
        "Fullprint",
        "Merchandising promocional",
        "Ropa laboral personalizada",
        "Imprenta",
        "Soportes publicitarios",
      ],
      sameAs: [contact.instagram, contact.facebook],
      contactPoint: {
        "@type": "ContactPoint",
        telephone: contact.phone,
        email: contact.email,
        contactType: "atención al cliente",
        availableLanguage: ["es"],
        areaServed: "ES",
      },
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Servicios de personalización de Seritene",
        itemListElement: services.map(([path]) => ({ "@type": "Offer", itemOffered: { "@id": serviceId(path) } })),
      },
    },
    {
      "@type": "ImageObject",
      "@id": LOGO_ID,
      url: `${ORIGIN}/seritene-logo.webp`,
      contentUrl: `${ORIGIN}/seritene-logo.webp`,
      caption: contact.businessName,
    },
    {
      "@type": "WebSite",
      "@id": `${ORIGIN}/#website`,
      name: "Seritene",
      url: `${ORIGIN}/`,
      inLanguage: "es",
      publisher: { "@id": ORG_ID },
    },
    ...services.map(([path, name, description]) => ({
      "@type": "Service",
      "@id": serviceId(path),
      name,
      description,
      url: `${ORIGIN}${path}`,
      provider: { "@id": ORG_ID },
      areaServed: canarias,
    })),
  ],
};

const json = JSON.stringify(graph).replace(/</g, "\\u003c");

/** Se pinta una sola vez, desde el layout raíz. */
export function SiteJsonLd() {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
