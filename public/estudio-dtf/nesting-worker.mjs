import {nestRectangles} from './nesting.mjs';
self.onmessage=({data})=>{
  try{
    const result=nestRectangles(data.items,data.length,data.gap,data.margin,true,{deep:true,onProgress:value=>self.postMessage({type:'progress',value})});
    self.postMessage({type:'result',items:result});
  }catch{self.postMessage({type:'error'});}
};
