import {halftone} from './core.mjs';
self.onmessage=({data:m})=>{
  try{const pixels=halftone(new Uint8ClampedArray(m.buffer),m.width,m.height,m.options);self.postMessage({buffer:pixels.buffer,width:m.width,height:m.height},[pixels.buffer]);}
  catch(error){self.postMessage({error:error.message});}
};
