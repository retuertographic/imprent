/**
 * JSON-LD de las fichas de proveedor (solo servidor, al generar el HTML estático).
 *
 * - `Product` del modelo (no de una variante): nombre = H1, marca, `sku`/`mpn` = referencia del modelo,
 *   fotos de los colores y oferta calculada con la misma lógica que la ficha (`quoteOrder`) sobre la tarifa
 *   del día (merch-pricing.json / roly-pricing.json, que el workflow refresca antes de la build) o, si no
 *   la hay, la de la ficha. Precio por unidad en la cantidad mínima de pedido, sin marcaje y sin IGIC.
 * - Todas las variantes con el mismo precio → `Offer` (válido para fichas de comerciante en Google);
 *   precios distintos → `AggregateOffer` (lowPrice/highPrice/offerCount, válido para fragmentos de producto).
 * - Sin ninguna variante con precio calculable («A presupuestar») no se emite `Product`: Google exige
 *   `offers`, `review` o `aggregateRating`, y no hay oferta real que declarar. Se mantienen
 *   BreadcrumbList y WebPage.
 * - `availability` solo cuando hay datos de stock: InStock si alguna variante con precio tiene unidades;
 *   OutOfStock si todas tienen stock conocido y es 0; sin dato (JHK, modelos sin respuesta), se omite.
 * - Sin `hasMerchantReturnPolicy` ni `deliveryTime`: pendientes de datos del cliente.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ORIGIN } from "../content";
import { SHIPPING } from "../soportes/order";
import type { ModelPricing } from "./loadPricing";
import { withModelPricing } from "./order";
import { quoteOrder } from "./pricing";
import { brandLabel, productHeading, productKind, productTitle } from "./productSeo";
import type { Brand, MerchPageData, MerchPricingFile, MerchProduct, MerchVariant } from "./types";

const PRICING_DIR = join(process.cwd(), "public/sites/seritene/shop-data");
const PRICING_FILES: Partial<Record<Brand, string>> = { stamina: "merch-pricing.json", roly: "roly-pricing.json" };

const pricingFiles = new Map<Brand, MerchPricingFile | null>();
function pricingFile(brand: Brand): MerchPricingFile | null {
  if (!pricingFiles.has(brand)) {
    const file = PRICING_FILES[brand];
    let data: MerchPricingFile | null = null;
    if (file) {
      try {
        data = JSON.parse(readFileSync(join(PRICING_DIR, file), "utf8")) as MerchPricingFile;
      } catch {
        data = null;
      }
    }
    pricingFiles.set(brand, data);
  }
  return pricingFiles.get(brand) ?? null;
}

/** Igual que `loadModelPricing` (cliente), leyendo el archivo del disco. */
function modelPricing(brand: Brand, model: string): { pricing: ModelPricing; fetchedAt: string | null; hasModel: boolean } {
  const file = pricingFile(brand);
  if (!file) return { pricing: { pricing: {}, stock: {} }, fetchedAt: null, hasModel: false };
  const pricing: ModelPricing["pricing"] = {};
  for (const [sku, [t, p]] of Object.entries(file.pricing[model] ?? {})) {
    pricing[sku] = { tariff: t < 0 ? null : file.tariffs[t], packaging: p < 0 ? null : file.packagings[p] };
  }
  return { pricing: { pricing, stock: file.stock[model] ?? {} }, fetchedAt: file.fetchedAt, hasModel: model in file.pricing };
}

/** Precio por unidad (céntimos) en la cantidad mínima que admite la variante, como lo calcula la ficha. */
function entryPrice(product: MerchProduct, v: MerchVariant): { cents: number; quantity: number } | null {
  const minimum = Math.max(1, v.packaging?.minimum ?? 1);
  const multiple = Math.max(1, v.packaging?.multiple ?? 1);
  const quantity = Math.ceil(minimum / multiple) * multiple;
  try {
    const quote = quoteOrder(product, [{ sku: v.sku, quantity }], []);
    const cents = quote.lines[0]?.unitCents;
    return quote.issues.length || cents == null ? null : { cents, quantity };
  } catch {
    return null;
  }
}

const euros = (cents: number) => (cents / 100).toFixed(2);
const absolute = (src: string) => (src.startsWith("/") ? `${ORIGIN}${src}` : src);
const plain = (s: string) => s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

/** Fin del año siguiente a la fecha de los precios (p. ej. tarifa del 16/11/2026 → 2027-12-31). */
const validUntil = (date: string | null | undefined) => {
  const year = date && !Number.isNaN(Date.parse(date)) ? new Date(date).getUTCFullYear() : new Date().getUTCFullYear();
  return `${year + 1}-12-31`;
};

/**
 * Envío a domicilio de la web: 6 € (gratis desde 199 € de pedido, sin IGIC). Destino: Canarias
 * (códigos postales 35xxx y 38xxx). Sin plazo de entrega: se confirma en cada presupuesto.
 */
const SHIPPING_DETAILS = {
  "@type": "OfferShippingDetails",
  shippingRate: { "@type": "MonetaryAmount", value: euros(SHIPPING), currency: "EUR" },
  shippingDestination: {
    "@type": "DefinedRegion",
    addressCountry: "ES",
    postalCodeRange: [
      { "@type": "PostalCodeRangeSpecification", postalCodeBegin: "35000", postalCodeEnd: "35999" },
      { "@type": "PostalCodeRangeSpecification", postalCodeBegin: "38000", postalCodeEnd: "38999" },
    ],
  },
  description: "Envío a domicilio en Canarias: 6 €; gratis en pedidos desde 199 € (importes sin IGIC).",
};

const SCHEMA_AVAILABILITY = { in: "https://schema.org/InStock", out: "https://schema.org/OutOfStock" };

type JsonLdNode = Record<string, unknown> & { "@type"?: string };

/** Oferta del modelo o `null` si ninguna variante tiene precio calculable. */
export function productOffer(data: MerchPageData) {
  const { pricing, fetchedAt, hasModel } = modelPricing(data.brand, data.id);
  const p = withModelPricing(data.product, pricing);
  const priced = p.variants
    .map((v) => ({ v, price: entryPrice(p, v) }))
    .filter((x): x is { v: MerchVariant; price: { cents: number; quantity: number } } => x.price !== null);
  if (!priced.length) return null;

  const url = `${ORIGIN}/producto/${data.brand}/${data.id}/`;
  const cents = priced.map((x) => x.price.cents);
  const low = Math.min(...cents);
  const high = Math.max(...cents);
  const quantities = [...new Set(priced.map((x) => x.price.quantity))];
  const anyInStock = priced.some((x) => (x.v.stock ?? 0) > 0);
  const allKnown = priced.every((x) => x.v.stock != null);
  const availability = anyInStock ? SCHEMA_AVAILABILITY.in : allKnown ? SCHEMA_AVAILABILITY.out : undefined;
  const eligibleQuantity =
    quantities.length === 1 && quantities[0] > 1
      ? { "@type": "QuantitativeValue", minValue: quantities[0], unitCode: "C62" }
      : undefined;
  const common = {
    url,
    priceCurrency: "EUR",
    ...(availability ? { availability } : {}),
    itemCondition: "https://schema.org/NewCondition",
    priceValidUntil: validUntil(hasModel ? fetchedAt : (data.product.pricingCheckedAt ?? fetchedAt)),
    seller: { "@id": `${ORIGIN}/#organization` },
    shippingDetails: SHIPPING_DETAILS,
    description:
      "Precio por unidad del producto sin personalizar en la cantidad mínima de pedido. Sin IGIC, marcaje ni diseño gráfico.",
  };
  if (low === high) {
    return {
      "@type": "Offer",
      ...common,
      price: euros(low),
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: euros(low),
        priceCurrency: "EUR",
        valueAddedTaxIncluded: false,
        ...(eligibleQuantity ? { eligibleQuantity } : {}),
      },
    };
  }
  return {
    "@type": "AggregateOffer",
    ...common,
    lowPrice: euros(low),
    highPrice: euros(high),
    offerCount: priced.length,
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      minPrice: euros(low),
      maxPrice: euros(high),
      priceCurrency: "EUR",
      valueAddedTaxIncluded: false,
      ...(eligibleQuantity ? { eligibleQuantity } : {}),
    },
  };
}

/** Grafo de la ficha: BreadcrumbList (de producción, con el H1 como último paso), Product (si hay oferta) y WebPage. */
export function productJsonLd(data: MerchPageData): JsonLdNode[] {
  const heading = productHeading(data).text;
  const url = `${ORIGIN}/producto/${data.brand}/${data.id}/`;
  const productId = `${url}#product`;
  const source = (Array.isArray(data.jsonLd) ? data.jsonLd : [data.jsonLd]) as JsonLdNode[];
  const offers = productOffer(data);
  const { product } = data;

  const images = [...new Set([product.image, ...product.variants.map((v) => v.image)].filter(Boolean).map(absolute))].slice(0, 6);
  const productNode: JsonLdNode | null = offers
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        "@id": productId,
        url,
        name: heading,
        description: plain(product.description) || plain(product.composition) || heading,
        sku: product.code,
        mpn: product.code,
        brand: { "@type": "Brand", name: brandLabel(data.brand) },
        ...(images.length ? { image: images } : {}),
        category: data.context?.category?.name ?? productKind(data).noun,
        ...(product.composition ? { material: plain(product.composition) } : {}),
        mainEntityOfPage: { "@id": `${url}#webpage` },
        offers,
      }
    : null;

  const nodes: JsonLdNode[] = [];
  for (const node of source) {
    if (node["@type"] === "Product") continue;
    if (node["@type"] === "BreadcrumbList" && Array.isArray(node.itemListElement)) {
      const items = node.itemListElement as JsonLdNode[];
      nodes.push({
        ...node,
        itemListElement: items.map((item, i) => (i === items.length - 1 ? { ...item, name: heading } : item)),
      });
    } else if (node["@type"] === "WebPage") {
      const { mainEntity, ...rest } = node;
      nodes.push({ ...rest, name: productTitle(data), ...(productNode ? { mainEntity: mainEntity ?? { "@id": productId } } : {}) });
    } else nodes.push(node);
    if (node["@type"] === "BreadcrumbList" && productNode) nodes.push(productNode);
  }
  if (productNode && !nodes.includes(productNode)) nodes.push(productNode);
  return nodes;
}
