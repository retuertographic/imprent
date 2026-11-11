import {pngHeader,pngChunk} from './core.mjs';
// Render and compress in strips: even long 300 ppp sheets never need a giant canvas.
export async function encodePNG(width,height,getStripe,onProgress=()=>{},dpi=300){
  if(typeof CompressionStream==='undefined')throw new Error('Este navegador no admite la exportación. Abre el estudio en una versión reciente de Chrome, Edge o Safari.');
  const parts=pngHeader(width,height,dpi),stream=new CompressionStream('deflate');
  const writer=stream.writable.getWriter(),reader=stream.readable.getReader();
  const collecting=(async()=>{while(true){const {value,done}=await reader.read();if(done)break;parts.push(pngChunk('IDAT',value));}})();
  try{
    for(let y=0;y<height;y+=128){
      const rows=Math.min(128,height-y),rgba=await getStripe(y,rows);
      if(rgba.length!==width*rows*4)throw new Error('No se ha podido leer la imagen completa.');
      const stride=width*4,filtered=new Uint8Array((stride+1)*rows);
      for(let r=0;r<rows;r++)filtered.set(rgba.subarray(r*stride,(r+1)*stride),r*(stride+1)+1);
      await writer.write(filtered);onProgress(Math.round((y+rows)/height*100));
      await new Promise(resolve=>setTimeout(resolve,0));
    }
    await writer.close();await collecting;
    parts.push(pngChunk('IEND',new Uint8Array()));
    return new Blob(parts,{type:'image/png'});
  }catch(error){await writer.abort(error).catch(()=>{});await collecting.catch(()=>{});throw error;}
}
