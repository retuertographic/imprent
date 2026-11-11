// Area averaging in premultiplied alpha. Every source pixel contributes to
// the reduced view; transparent RGB never darkens the visible ink.
// This module is for display only and is not used by the PNG exporter.
export function reducePreview(input,width,height,targetWidth,targetHeight){
  if(input.length!==width*height*4||targetWidth<1||targetHeight<1||targetWidth>width||targetHeight>height)throw new Error('Dimensiones de vista previa no válidas.');
  const output=new Uint8ClampedArray(targetWidth*targetHeight*4);
  const scaleX=width/targetWidth,scaleY=height/targetHeight;
  const row=new Float64Array(targetWidth*4),sum=new Float64Array(targetWidth*4);
  let lastRow=-1;
  function horizontal(y){
    if(y===lastRow)return;
    lastRow=y;row.fill(0);
    for(let x=0;x<targetWidth;x++){
      const left=x*scaleX,right=(x+1)*scaleX,offset=x*4;
      for(let sx=Math.floor(left);sx<Math.ceil(right)&&sx<width;sx++){
        const weight=Math.min(right,sx+1)-Math.max(left,sx),i=(y*width+sx)*4,alpha=input[i+3]*weight;
        row[offset]+=input[i]*alpha;row[offset+1]+=input[i+1]*alpha;row[offset+2]+=input[i+2]*alpha;row[offset+3]+=alpha;
      }
    }
  }
  for(let y=0;y<targetHeight;y++){
    sum.fill(0);const top=y*scaleY,bottom=(y+1)*scaleY;
    for(let sy=Math.floor(top);sy<Math.ceil(bottom)&&sy<height;sy++){
      horizontal(sy);const weight=Math.min(bottom,sy+1)-Math.max(top,sy);
      for(let i=0;i<sum.length;i++)sum[i]+=row[i]*weight;
    }
    for(let x=0;x<targetWidth;x++){
      const i=x*4,j=(y*targetWidth+x)*4,alpha=sum[i+3];
      if(alpha>0){output[j]=sum[i]/alpha;output[j+1]=sum[i+1]/alpha;output[j+2]=sum[i+2]/alpha;output[j+3]=alpha/(scaleX*scaleY);}
    }
  }
  return output;
}

// Pixel-aligned source rectangle for the visible area at 100% / 200%.
export function visibleRegion(width,height,scale,left,top,visibleWidth,visibleHeight){
  const x=Math.max(0,Math.min(width-1,Math.floor(left/scale)));
  const y=Math.max(0,Math.min(height-1,Math.floor(top/scale)));
  return {x,y,w:Math.max(1,Math.min(width-x,Math.ceil((left+visibleWidth)/scale)-x)),h:Math.max(1,Math.min(height-y,Math.ceil((top+visibleHeight)/scale)-y))};
}
