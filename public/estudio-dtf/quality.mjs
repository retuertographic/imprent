export function resolutionStatus(dpi){
  if(dpi>=250)return {level:'good',label:'Buena resolución',hint:'Detalle adecuado para imprimir.'};
  if(dpi>=150)return {level:'fair',label:'Resolución aceptable',hint:'Puede perder detalle fino al imprimir.'};
  return {level:'poor',label:'Baja resolución',hint:'Reduce el tamaño o sube un archivo más grande.'};
}

// Preserve the source RGB and existing alpha. The model contributes only its matte.
export function applyAlphaMatte(source,matte){
  if(source.length!==matte.length||source.length%4)throw new Error('La máscara no coincide con la imagen.');
  const result=new Uint8ClampedArray(source);
  for(let i=3;i<result.length;i+=4)result[i]=Math.round(source[i]*matte[i]/255);
  return result;
}
