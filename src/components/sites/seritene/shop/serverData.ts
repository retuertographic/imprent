/**
 * Datos del catálogo para los componentes de servidor (solo se usan al generar el HTML estático;
 * el cliente descarga los mismos JSON bajo demanda). Regenerar con scripts/extract-shop-data.mjs.
 */
import merchandisingJson from "../../../../../public/sites/seritene/shop-data/merchandising.json";
import ropaJson from "../../../../../public/sites/seritene/shop-data/ropa.json";
import type { GroupData, ShopGroup } from "./types";

const groups: Record<ShopGroup, GroupData> = {
  ropa: ropaJson as GroupData,
  merchandising: merchandisingJson as GroupData,
};

export const getGroupData = (group: ShopGroup) => groups[group];
