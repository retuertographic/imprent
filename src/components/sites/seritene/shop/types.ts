/** Tipos del catálogo de tienda (datos generados por scripts/extract-shop-data.mjs). */

export type ShopGroup = "ropa" | "merchandising";

export type Product = {
  brand: string;
  code: string;
  name: string;
  /** Descripción ya recortada como en producción (primera frase, máx. 115 caracteres). */
  description: string;
  /** Ruta de seritene.com ("/images/...") o URL absoluta del proveedor. */
  image: string;
  /** Precio «desde» en euros, o null si es a presupuestar. */
  fromPrice: number | null;
  /** Referencia, composición, colores y categorías, para el buscador. */
  keywords: string;
};

export type GroupData = {
  /** Marca por defecto del grupo (roly para ropa, stamina para merchandising). */
  brand: string;
  /** Modelos de cada categoría en el orden de producción; "" es el listado completo del grupo. */
  lists: Record<string, string[]>;
  /** Productos por clave de modelo. */
  products: Record<string, Product>;
};

/** Producto listo para pintar una tarjeta. */
export type CardItem = Product & { key: string };
