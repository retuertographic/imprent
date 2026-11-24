const es = new Intl.NumberFormat("es-ES");

/** «1 unidad», «25 unidades», «1.000 unidades». */
export const formatUnits = (n: number) => `${es.format(n)} ${n === 1 ? "unidad" : "unidades"}`;
