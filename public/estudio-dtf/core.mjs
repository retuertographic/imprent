import {nestRectangles} from './nesting.mjs';
export const DPI = 300;
export const SHEET_WIDTH = 57;
export const px = cm => Math.round(cm / 2.54 * DPI);
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const bounds = item => item.rotation % 180 ? {w:item.h,h:item.w} : {w:item.w,h:item.h};
export function overlaps(a,b,gap=0) {
  const aa=bounds(a),bb=bounds(b);
  return a.x < b.x+bb.w+gap-0.001 && a.x+aa.w+gap > b.x+0.001 && a.y < b.y+bb.h+gap-0.001 && a.y+aa.h+gap > b.y+0.001;
}
export function validate(items,length) {
  const outside=items.filter(i=>{const b=bounds(i);return ![i.x,i.y,i.w,i.h].every(Number.isFinite)||i.w<=0||i.h<=0||i.x<-.001||i.y<-.001||i.x+b.w>SHEET_WIDTH+.001||i.y+b.h>length+.001;});
  const collisions=[];
  for(let a=0;a<items.length;a++)for(let b=a+1;b<items.length;b++)if(overlaps(items[a],items[b]))collisions.push([items[a].id,items[b].id]);
  return {outside,collisions};
}
export function pack(items,length,gap=.5,margin=.5,rotate=true) {
  return nestRectangles(items,length,gap,margin,rotate);
}
export function halftone(data,width,height,opts) {
  if(data.length!==width*height*4)throw new Error('Las dimensiones de la imagen no son válidas.');
  const out=new Uint8ClampedArray(data.length),mode=opts.mode||'dark';
  const light=mode==='light',alphaOnly=mode==='alpha';
  const angle=Number.isFinite(opts.angle)?opts.angle:22.5;
  const frequency=clamp(Number(opts.lpi)||40,10,100),period=(Number(opts.dpi)||300)/frequency;
  const radians=angle*Math.PI/180,cos=Math.cos(radians),sin=Math.sin(radians);
  const bias=(clamp(Number(opts.threshold??50),0,100)-50)/100;
  const tolerance=clamp(Number(opts.tolerance)||0,-50,50);
  const fillHoles=light?clamp(Number(opts.holeReduction)||0,0,100)*.003:0;
  const darkCut=18+tolerance*1.3,lightCut=clamp(251-tolerance*1.45,175,260);
  const brightness=clamp(Number(opts.brightness)||0,-100,100)*1.27;
  const contrast=clamp(Number(opts.contrast)||0,-100,100);
  const contrastGain=contrast>=0?1+contrast/65:1/(1-contrast/65);
  const colorAdjusted=brightness!==0||contrast!==0;
  const tau=2*Math.PI/period;
  // Evaluate an AM screen at the actual print resolution. RGB is retained:
  // the garment replaces removed pixels, without bleaching the remaining ink.
  const xCos=new Float64Array(width),xSin=new Float64Array(width);
  for(let x=0;x<width;x++){xCos[x]=x*cos;xSin[x]=-x*sin;}
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const i=(y*width+x)*4,a=data[i+3];
    if(!a||(!alphaOnly&&a<128))continue;
    const r=data[i],g=data[i+1],b=data[i+2],max=Math.max(r,g,b),min=Math.min(r,g,b);
    if(!alphaOnly&&(light
      ?min>=lightCut||(max-min<Math.max(8,12+tolerance*.13)&&(r+g+b)/3>=Math.min(254,lightCut+2))
      :(tolerance!==0||colorAdjusted)&&max<=darkCut))continue;
    const rr=colorAdjusted?clamp(clamp((r-127.5)*contrastGain+127.5,0,255)+brightness,0,255):r;
    const gg=colorAdjusted?clamp(clamp((g-127.5)*contrastGain+127.5,0,255)+brightness,0,255):g;
    const bb=colorAdjusted?clamp(clamp((b-127.5)*contrastGain+127.5,0,255)+brightness,0,255):b;
    const luminance=.299*rr+.587*gg+.114*bb;
    let coverage;
    if(alphaOnly)coverage=a/255;
    else if(light)coverage=1-clamp((luminance-15.3)/224.4,0,1);
    else{
      let level=colorAdjusted?clamp((luminance-15.3)/84.15,0,1)*255:Math.round(clamp((luminance-15)/84,0,1)*255);
      if(tolerance<0)level=Math.min(255,level-tolerance*3*clamp((170-(.299*r+.587*g+.114*b))/170,0,1)**2);
      coverage=level/255;
    }
    const u=xCos[x]+y*sin,v=xSin[x]+y*cos;
    let screen;
    if(opts.shape==='line')screen=(1+Math.sin(tau*u))/2;
    else if(opts.shape==='square'){
      const dx=((u/period)%1+1)%1-.5,dy=((v/period)%1+1)%1-.5;
      screen=4*Math.max(dx*dx,dy*dy);
    }else screen=(1+Math.sin(tau*u)*Math.sin(tau*v))/2;
    if(coverage<=clamp(screen+bias-fillHoles,0,1))continue;
    out[i]=rr;out[i+1]=gg;out[i+2]=bb;out[i+3]=255;
  }
  return out;
}
export function suggestGarment(data,width,height){
  let light=0,dark=0,total=0;
  const stride=Math.max(1,Math.floor(Math.max(width,height)/100));
  // Judge the perimeter, rather than the bright artwork in the middle.
  for(let y=0;y<height;y+=stride)for(let x=0;x<width;x+=stride){
    if(x>width*.1&&x<width*.9&&y>height*.1&&y<height*.9)continue;
    const i=(y*width+x)*4;if(data[i+3]<230)continue;
    total++;const min=Math.min(data[i],data[i+1],data[i+2]),max=Math.max(data[i],data[i+1],data[i+2]);
    if(min>225)light++;if(max<40)dark++;
  }
  if(total<10)return null;
  if(light/total>.6)return 'light';if(dark/total>.6)return 'dark';return null;
}
export function automaticToneSettings(mode,sourceDpi){
  const light=mode==='light';
  return {lpi:light?(sourceDpi<230?30:35):40,threshold:50,angle:22.5,shape:'circle',tolerance:light?12:0,holeReduction:light?28:0,brightness:0,contrast:0};
}
const crcTable=Uint32Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
export function crc32(bytes){let crc=0xffffffff;for(const b of bytes)crc=crcTable[(crc^b)&255]^(crc>>>8);return (crc^0xffffffff)>>>0;}
export function pngChunk(type,data){
  const block=new Uint8Array(data.length+12),dv=new DataView(block.buffer);
  dv.setUint32(0,data.length);for(let n=0;n<4;n++)block[4+n]=type.charCodeAt(n);
  block.set(data,8);dv.setUint32(data.length+8,crc32(block.subarray(4,data.length+8)));return block;
}
export function pngHeader(width,height,dpi=300){
  const ihdr=new Uint8Array(13),id=new DataView(ihdr.buffer);
  id.setUint32(0,width);id.setUint32(4,height);ihdr[8]=8;ihdr[9]=6;
  const phys=new Uint8Array(9),pd=new DataView(phys.buffer);
  pd.setUint32(0,Math.round(dpi/.0254));pd.setUint32(4,Math.round(dpi/.0254));phys[8]=1;
  return [new Uint8Array([137,80,78,71,13,10,26,10]),pngChunk('IHDR',ihdr),pngChunk('pHYs',phys)];
}
