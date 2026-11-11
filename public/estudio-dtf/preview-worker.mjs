import {reducePreview} from './preview.mjs';
self.onmessage=({data:m})=>{
  try{
    const pixels=reducePreview(new Uint8ClampedArray(m.buffer),m.width,m.height,m.targetWidth,m.targetHeight);
    self.postMessage({buffer:pixels.buffer,width:m.targetWidth,height:m.targetHeight},[pixels.buffer]);
  }catch(error){self.postMessage({error:error.message});}
};
