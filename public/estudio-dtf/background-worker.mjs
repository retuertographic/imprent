// Local inference only. BEN2 (MIT), Transformers.js (Apache-2.0).
// Models and runtime are downloaded on demand; image pixels never leave this worker.
let segmenter;
self.onmessage = async ({data}) => {
  try {
    const {pipeline,env,RawImage}=await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js');
    env.allowLocalModels=false;
    env.backends.onnx.wasm.numThreads=1;
    if(!segmenter) segmenter=await pipeline('background-removal','onnx-community/BEN2-ONNX',{
      revision:'c552aa82688edce09f0ac9d2e31ad53d9d629010',dtype:'fp16',device:'wasm',
      progress_callback:p=>{
        if(p.status==='progress'&&p.file?.endsWith('.onnx'))self.postMessage({type:'progress',value:Math.round(p.progress),label:'Descargando herramienta'});
        else if(p.status==='initiate')self.postMessage({type:'progress',label:'Preparando herramienta'});
      }
    });
    self.postMessage({type:'progress',label:'Separando el diseño del fondo…'});
    const image=new RawImage(new Uint8ClampedArray(data.pixels),data.width,data.height,4);
    const [result]=await segmenter(image);
    self.postMessage({type:'result',pixels:result.data.buffer,width:result.width,height:result.height,channels:result.channels},[result.data.buffer]);
  }catch(error){
    segmenter=null;
    self.postMessage({type:'error',message:String(error?.message||error)});
  }
};
