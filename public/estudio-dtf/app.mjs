import {usedLength} from './nesting.mjs';
import {resolutionStatus,applyAlphaMatte} from './quality.mjs';
import {DPI,SHEET_WIDTH,px,clamp,bounds,validate,pack,suggestGarment,automaticToneSettings} from './core.mjs';
import {encodePNG} from './png.mjs';
import {visibleRegion} from './preview.mjs';
const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));
const icons={
 'help':'<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 4m0 3h.01"/>',
 'arrow-up-right':'<path d="M6 18 18 6M6 6h12v12"/>',
 'layout':'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M9 10h12"/>',
 'shield':'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z"/><path d="m8 12 3 3 5-6"/>',
 'upload':'<path d="M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5"/>',
 'lock':'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
 'sparkles':'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5zM20 2v4m-2-2h4"/>',
 'undo':'<path d="M4 10h10a6 6 0 0 1 0 12M4 10l5-5M4 10l5 5"/>',
 'redo':'<path d="M20 10H10a6 6 0 0 0 0 12m14-12-5-5m5 5-5 5"/>',
 'copy':'<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
 'rotate':'<path d="M5 6a8 8 0 1 1-2 9M5 6V1M5 6h5"/>',
 'trash':'<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
 'plus':'<path d="M12 4v16M4 12h16"/>',
 'download':'<path d="M12 3v13m-5-5 5 5 5-5M4 17v4h16v-4"/>',
 'check-circle':'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 6-6"/>',
 'message':'<path d="M21 11a9 9 0 0 1-13 8L3 21l2-5a9 9 0 1 1 16-5Z"/><path d="M8 9h8m-8 4h5"/>',
 'info':'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>'
};
$$('[data-icon]').forEach(e=>e.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true">${icons[e.dataset.icon]||''}</svg>`);
const assets=new Map();
let items=[],selected=null,length=100,zoom=1,scale=6,sheetBg='checker',history=[],future=[],busy=false,dirty=false;
let toneSource=null,toneResult=null,toneMode='result',toneBg='checker',lpi=40,toneRevision=0,toneResultRevision=-1,tonePrepare='auto',toneTimer;
const tonePreviewCache=new WeakMap();
let tonePreviewSerial=0,toneScrollFrame=0,tonePan=null;
let downloadURL=null,drag=null,toastTimer;
const uid=()=>crypto.randomUUID();
const num=(v,d=1)=>Number(v).toLocaleString('es-ES',{maximumFractionDigits:d});
const selectedItem=()=>items.find(i=>i.id===selected);
function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,5500);}
function getSnapshot(){return JSON.stringify({items,length,selected});}
function remember(){history.push(getSnapshot());if(history.length>30)history.shift();future=[];dirty=true;}
function restore(snapshot){const s=JSON.parse(snapshot);items=s.items;length=s.length;selected=s.selected;$('#sheetLength').value=length;renderAll();}
function undo(){if(!history.length||busy)return;future.push(getSnapshot());restore(history.pop());dirty=true;}
function redo(){if(!future.length||busy)return;history.push(getSnapshot());restore(future.pop());dirty=true;}
function setTab(which){
  const sheet=which==='sheet';
  if(!sheet)setToneBackground('checker');
  $('#sheetPanel').hidden=!sheet;$('#tonePanel').hidden=sheet;
  for(const [id,active] of [['sheetTab',sheet],['toneTab',!sheet]]){$('#'+id).classList.toggle('active',active);$('#'+id).setAttribute('aria-selected',String(active));$('#'+id).tabIndex=active?0:-1;}
  requestAnimationFrame(()=>sheet?renderSheet():renderTone());
}
$('#sheetTab').onclick=()=>setTab('sheet');$('#toneTab').onclick=()=>setTab('tone');
$$('[role=tab]').forEach(b=>b.onkeydown=e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();setTab(b.id==='sheetTab'?'tone':'sheet');$(b.id==='sheetTab'?'#toneTab':'#sheetTab').focus();}});
function makeCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function thumbnail(canvas){const c=makeCanvas(90,90),ctx=c.getContext('2d');const f=Math.min(90/canvas.width,90/canvas.height);ctx.drawImage(canvas,(90-canvas.width*f)/2,(90-canvas.height*f)/2,canvas.width*f,canvas.height*f);return c.toDataURL('image/png');}
function analyze(canvas){
  const c=makeCanvas(160,160);c.getContext('2d').drawImage(canvas,0,0,160,160);const p=c.getContext('2d').getImageData(0,0,160,160).data;
  let clear=0,partial=0;for(let i=3;i<p.length;i+=4){if(p[i]===0)clear++;else if(p[i]<255)partial++;}
  return {transparent:clear>0,partial:partial>100};
}
function registerAsset(canvas,name,sourceWidth=canvas.width,sourceHeight=canvas.height,isHalftone=false){
  if([...assets.values()].reduce((s,a)=>s+a.canvas.width*a.canvas.height,0)+canvas.width*canvas.height>70000000)throw new Error('Este proyecto ya contiene muchas imágenes. Guarda el proyecto y trabaja en otra plancha para mantener el navegador fluido.');
  const asset={id:uid(),name,canvas,sourceWidth,sourceHeight,isHalftone,thumbnail:thumbnail(canvas),...analyze(canvas)};assets.set(asset.id,asset);return asset;
}
async function readImage(file){
  if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('Usa una imagen PNG, JPG o WebP.');
  if(file.size>30*1024*1024)throw new Error('Cada imagen puede ocupar hasta 30 MB.');
  let bmp;try{bmp=await createImageBitmap(file);}catch{throw new Error('No se puede abrir esa imagen. Comprueba que el archivo esté completo.');}
  if(bmp.width*bmp.height>32000000){bmp.close();throw new Error('La imagen supera 32 megapíxeles. Reduce sus dimensiones antes de subirla.');}
  const c=makeCanvas(bmp.width,bmp.height);c.getContext('2d').drawImage(bmp,0,0);bmp.close();return c;
}
function fitNewAsset(asset,width){
  let w=width||Math.min(20,asset.canvas.width/DPI*2.54),h=w*asset.canvas.height/asset.canvas.width;
  w=Math.max(.1,w);h=Math.max(.1,h);
  const f=Math.min(1,56/w,299/h);w*=f;h*=f;
  return {id:uid(),assetId:asset.id,x:.5,y:.5,w,h,rotation:0};
}
function packSettings(){return {gap:clamp(Number($('#gap').value)||.5,.5,5),margin:clamp(Number($('#margin').value)||.5,.5,5)};}
function placeWithExisting(additions){
  const {gap,margin}=packSettings(),all=[...items,...additions];
  let result=pack(all,length,gap,margin),newLength=length;
  if(!result){
    for(let n=Math.min(300,Math.ceil((length+10)/10)*10);n<=300;n+=10){result=pack(all,n,gap,margin);if(result){newLength=n;break;}}
  }
  if(!result)throw new Error('Los diseños no caben en una plancha de hasta 300 cm. Reduce el tamaño, las copias o los márgenes.');
  remember();items=result;selected=additions[additions.length-1].id;length=newLength;$('#sheetLength').value=length;renderAll();
}
async function uploadFiles(files){
  if(busy)return;busy=true;
  try{
    const additions=[],failed=[];
    for(const file of Array.from(files).slice(0,30)){
      try{const canvas=await readImage(file);const a=registerAsset(canvas,file.name);additions.push(fitNewAsset(a));}catch(e){failed.push(`${file.name}: ${e.message}`);}
    }
    if(additions.length){placeWithExisting(additions);toast(`${additions.length} diseño${additions.length>1?'s':''} añadido${additions.length>1?'s':''}. Ajusta sus medidas en centímetros.`);}
    if(failed.length)toast(failed.join(' · '));
  }catch(e){toast(e.message);}finally{busy=false;$('#sheetFiles').value='';renderAll();}
}
$('#uploadSheet').onclick=$('#emptyUpload').onclick=()=>$('#sheetFiles').click();
$('#sheetFiles').onchange=e=>uploadFiles(e.target.files);
function dropzone(node,callback){
  node.addEventListener('dragover',e=>{e.preventDefault();node.classList.add('dragover');});
  node.addEventListener('dragleave',()=>node.classList.remove('dragover'));
  node.addEventListener('drop',e=>{e.preventDefault();node.classList.remove('dragover');callback(e.dataTransfer.files);});
}
dropzone($('#uploadSheet'),uploadFiles);dropzone($('#sheetViewport'),uploadFiles);
function drawItem(ctx,item,f,offsetY=0,printing=false){
  const a=assets.get(item.assetId);if(!a)return;
  const b=bounds(item);ctx.save();if(printing&&a.isHalftone)ctx.imageSmoothingEnabled=false;ctx.translate((item.x+b.w/2)*f,(item.y+b.h/2)*f-offsetY);ctx.rotate(item.rotation*Math.PI/180);ctx.drawImage(a.canvas,-item.w*f/2,-item.h*f/2,item.w*f,item.h*f);ctx.restore();
}
function renderSheet(){
  if($('#sheetPanel').hidden)return;
  const viewport=$('#sheetViewport'),canvas=$('#sheetCanvas');
  scale=Math.max(2,Math.min((viewport.clientWidth-90)/SHEET_WIDTH,(viewport.clientHeight-65)/Math.min(length,100)))*zoom;
  const w=SHEET_WIDTH*scale,h=length*scale,dpr=Math.min(devicePixelRatio||1,2);
  $('#sheetWrap').style.width=`${w}px`;$('#sheetWrap').style.height=`${h}px`;
  canvas.style.width=`${w}px`;canvas.style.height=`${h}px`;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
  const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);
  for(const i of items)drawItem(ctx,i,scale);
  const item=selectedItem();
  if(item){
    const b=bounds(item);ctx.save();ctx.strokeStyle='#4aaf25';ctx.lineWidth=1.5;ctx.strokeRect(item.x*scale,item.y*scale,b.w*scale,b.h*scale);
    for(const [x,y] of [[item.x,item.y],[item.x+b.w,item.y],[item.x,item.y+b.h],[item.x+b.w,item.y+b.h]]){ctx.fillStyle='#fff';ctx.fillRect(x*scale-3,y*scale-3,6,6);ctx.strokeRect(x*scale-3,y*scale-3,6,6);}ctx.restore();
  }
  $('#emptyCanvas').hidden=items.length>0;
  $('#topRuler').replaceChildren();for(let x=0;x<=57;x+=5){const s=document.createElement('span');s.style.left=`${x/57*100}%`;s.textContent=x;$('#topRuler').append(s);}
  $('#leftRuler').replaceChildren();for(let y=0;y<=length;y+=10){const s=document.createElement('span');s.style.top=`${y/length*100}%`;s.textContent=y;$('#leftRuler').append(s);}
  $('#zoomValue').textContent=`${Math.round(zoom*100)}%`;
}
function effectiveDPI(item){const a=assets.get(item.assetId);return Math.min(a.sourceWidth/item.w*2.54,a.sourceHeight/item.h*2.54);}
function renderAssets(){
  const list=$('#assetList');list.replaceChildren();
  const activeIds=[...new Set(items.map(i=>i.assetId))];
  for(const id of activeIds){
    const a=assets.get(id),count=items.filter(i=>i.assetId===id).length;
    const button=document.createElement('button');button.className='asset-row'+(selectedItem()?.assetId===id?' active':'');
    const img=document.createElement('img');img.src=a.thumbnail;img.alt='';
    const div=document.createElement('div'),name=document.createElement('b'),meta=document.createElement('small'),copies=document.createElement('span');
    name.textContent=a.name;meta.textContent=`${num(a.canvas.width,0)} × ${num(a.canvas.height,0)} px`;copies.textContent=`×${count}`;
    div.append(name,meta);button.append(img,div,copies);button.onclick=()=>{selected=items.find(i=>i.assetId===id).id;renderAll();};list.append(button);
  }
  $('#fileCount').textContent=activeIds.length;
}
function renderInspector(){
  const i=selectedItem();$('#selectionControls').hidden=!i;$('#noSelection').hidden=!!i;
  for(const id of ['duplicate','rotate','rotateInspector','removeBackground','remove'])$('#'+id).disabled=!i||busy;
  if(!i)return;const a=assets.get(i.assetId),dpi=effectiveDPI(i);
  $('#selectionName').textContent=a.name+(i.rotation?` · giro ${i.rotation}°`:'');
  for(const [id,k] of [['itemWidth','w'],['itemHeight','h'],['itemX','x'],['itemY','y']])$('#'+id).value=Number(i[k].toFixed(2));
  const quality=resolutionStatus(dpi);
  $('#quality').className=`quality quality-${quality.level}`;
  $('#quality').replaceChildren();
  const label=document.createElement('strong'),detail=document.createElement('span');
  label.textContent=quality.label;detail.textContent=`${Math.round(dpi)} ppp de origen · ${quality.hint}`;
  $('#quality').append(label,detail);
  $('#backgroundInfo').textContent=a.transparent?'✓ La imagen contiene transparencia.':'Fondo opaco · puedes quitarlo con «Eliminar fondo».';
}
function renderAll(){
  if(!busy&&nestingReportSnapshot&&nestingReportSnapshot!==getSnapshot()){$('#nestingStatus').hidden=true;nestingReportSnapshot=null;}
  $('#canvasSize').textContent=`57 × ${num(length)} cm`;
  $('#summaryCount').textContent=`${items.length} diseño${items.length===1?'':'s'} en tu plancha`;
  $('#summaryPixels').textContent=`${num(px(57),0)} × ${num(px(length),0)} px · 300 ppp · Fondo transparente`;
  const v=validate(items,length),warning=v.outside.length?`${v.outside.length} diseño(s) fuera de la plancha. Ajusta su posición o el largo.`:v.collisions.length?'Hay diseños superpuestos. Distribuye o ajusta sus posiciones.':'';
  $('#sheetWarning').hidden=!warning;$('#sheetWarning').textContent=warning;
  $('#exportSheet').disabled=!items.length||busy;
  $('#autoPack').disabled=!items.length||busy;
  $('#undo').disabled=!history.length||busy;$('#redo').disabled=!future.length||busy;
  $$('[data-length]').forEach(b=>b.classList.toggle('chosen',Number(b.dataset.length)===length));
  renderAssets();renderInspector();renderSheet();
}
function setLength(value){
  const n=Number(value);if(!Number.isFinite(n)||n<10||n>300){toast('El largo debe estar entre 10 y 300 cm.');$('#sheetLength').value=length;return;}
  if(n===length)return;remember();length=Math.round(n*10)/10;$('#sheetLength').value=length;renderAll();
}
$('#sheetLength').onchange=$('#sheetLength').onblur=e=>setLength(e.target.value);$$('[data-length]').forEach(b=>b.onclick=()=>setLength(b.dataset.length));
for(const id of ['gap','margin'])$('#'+id).onchange=e=>{e.target.value=clamp(Number(e.target.value)||.5,.5,5);};
let nestingJob=null,nestingReportSnapshot=null;
function finishNesting(){
  nestingJob?.restoreControls();nestingJob?.worker.terminate();clearTimeout(nestingJob?.timer);nestingJob=null;busy=false;
  $('#cancelNesting').hidden=true;
  $('#nestingButtonLabel').textContent='Distribuir automáticamente';renderAll();
}
$('#cancelNesting').onclick=()=>{finishNesting();$('#nestingStatus').textContent='Anidado cancelado. Tu montaje sigue igual.';};
$('#autoPack').onclick=()=>{
  if(busy||!items.length)return;
  const {gap,margin}=packSettings(),before=usedLength(items,margin);
  $('#gap').value=gap;$('#margin').value=margin;
  const status=$('#nestingStatus');status.hidden=false;status.textContent='Buscando una distribución más compacta…';
  $('#nestingButtonLabel').textContent='Anidando…';$('#cancelNesting').hidden=false;
  busy=true;renderAll();
  // Freeze edits while the worker solves; cancellation is always available.
  const controls=$$('button,input,select');
  const disabled=controls.map(el=>[el,el.disabled]);controls.forEach(el=>{if(el.id!=='cancelNesting')el.disabled=true;});
  const restoreControls=()=>disabled.forEach(([el,value])=>el.disabled=value);
  try{
    const worker=new Worker(new URL('./nesting-worker.mjs',import.meta.url),{type:'module'});
    const originalSnapshot=getSnapshot();
    const originalFinish=()=>finishNesting();
    const timer=setTimeout(()=>{originalFinish();status.textContent='El cálculo está tardando demasiado. Tu montaje sigue igual; prueba con menos diseños.';},60000);
    nestingJob={worker,timer,restoreControls};
    worker.onerror=()=>{originalFinish();status.textContent='No se pudo completar el anidado. Tu montaje sigue igual.';};
    worker.onmessage=({data})=>{
      if(data.type==='progress'){status.textContent=`Probando posiciones y giros… ${data.value}%`;return;}
      if(data.type==='result'&&data.items){
        if(getSnapshot()!==originalSnapshot){originalFinish();status.textContent='El montaje ha cambiado. Pulsa de nuevo para anidar la versión actual.';return;}
        remember();items=data.items;const after=usedLength(items,margin),saved=Math.max(0,before-after);
        originalFinish();nestingReportSnapshot=getSnapshot();status.hidden=false;
        status.textContent=`Ocupación: ${num(after)} cm de largo`+(saved>.05?` · ${num(saved)} cm menos`:' · distribución más compacta encontrada')+` · separación ${num(gap)} cm · borde ${num(margin)} cm.`;
      }else{originalFinish();status.textContent='No caben manteniendo el margen de corte. Aumenta el largo de la plancha o reduce las copias.';}
    };
    worker.postMessage({items,length,gap,margin});
  }catch{restoreControls();finishNesting();status.textContent='No se pudo iniciar el anidado. Tu montaje sigue igual.';}
};

function modifyField(key,value){
  const i=selectedItem();if(!i||busy)return;const n=Number(value);
  if(!Number.isFinite(n)||(['w','h'].includes(key)&&n<.1)){toast('Introduce una medida válida, de al menos 0,1 cm.');renderInspector();return;}
  if(Math.abs(n-i[key])<.005)return;
  const next={...i,[key]:n};
  if($('#lockRatio').checked){if(key==='w')next.h=i.h*n/i.w;if(key==='h')next.w=i.w*n/i.h;}
  const b=bounds(next);
  if(b.w>57||b.h>300){toast('El diseño supera el ancho de 57 cm o el largo máximo de 300 cm.');renderInspector();return;}
  next.x=clamp(next.x,0,57-b.w);next.y=clamp(next.y,0,Math.max(0,length-b.h));
  remember();Object.assign(i,next);renderAll();
}
for(const [id,k]of [['itemWidth','w'],['itemHeight','h'],['itemX','x'],['itemY','y']])$('#'+id).onchange=$('#'+id).onblur=e=>modifyField(k,e.target.value);
function addCopies(count){
  const i=selectedItem();if(!i)return;
  const n=Number(count);if(!Number.isInteger(n)||n<1||n>100)return toast('Añade entre 1 y 100 copias cada vez.');
  if(items.length+n>300)return toast('Puedes colocar hasta 300 diseños por plancha.');
  try{placeWithExisting(Array.from({length:n},()=>({...i,id:uid()})));toast(`${n} copia${n>1?'s':''} añadida${n>1?'s':''}.`);}catch(e){toast(e.message);}
}
$('#addCopies').onclick=()=>addCopies($('#copies').value);$('#duplicate').onclick=()=>addCopies(1);
$('#rotateInspector').onclick=$('#rotate').onclick=()=>{
  const i=selectedItem();if(!i||busy)return;const next={...i,rotation:(i.rotation+90)%360},b=bounds(next);
  if(b.w>57||b.h>length)return toast('El diseño girado no cabe. Reduce su tamaño o aumenta el largo.');
  remember();Object.assign(i,next,{x:clamp(i.x,0,57-b.w),y:clamp(i.y,0,length-b.h)});renderAll();
};
function removeSelected(){if(!selected||busy)return;remember();items=items.filter(i=>i.id!==selected);selected=items.at(-1)?.id||null;renderAll();}
$('#remove').onclick=removeSelected;$('#undo').onclick=undo;$('#redo').onclick=redo;
function canvasPoint(e){const r=$('#sheetCanvas').getBoundingClientRect();return {x:(e.clientX-r.left)/scale,y:(e.clientY-r.top)/scale};}
$('#sheetCanvas').addEventListener('pointerdown',e=>{
  if(busy)return;const p=canvasPoint(e);
  selected=[...items].reverse().find(i=>{const b=bounds(i);return p.x>=i.x&&p.x<=i.x+b.w&&p.y>=i.y&&p.y<=i.y+b.h;})?.id||null;
  const i=selectedItem();if(i){drag={start:p,x:i.x,y:i.y,before:getSnapshot(),moved:false};$('#sheetCanvas').setPointerCapture(e.pointerId);}
  renderAll();$('#sheetCanvas').focus({preventScroll:true});
});
$('#sheetCanvas').addEventListener('pointermove',e=>{
  if(!drag)return;const i=selectedItem(),p=canvasPoint(e),b=bounds(i);
  i.x=clamp(Math.round((drag.x+p.x-drag.start.x)*10)/10,0,57-b.w);i.y=clamp(Math.round((drag.y+p.y-drag.start.y)*10)/10,0,Math.max(0,length-b.h));
  drag.moved=true;renderSheet();renderInspector();
});
function endDrag(){if(drag?.moved){history.push(drag.before);if(history.length>30)history.shift();future=[];dirty=true;}drag=null;renderAll();}
$('#sheetCanvas').addEventListener('pointerup',endDrag);$('#sheetCanvas').addEventListener('pointercancel',endDrag);
document.addEventListener('keydown',e=>{
  if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)||$('dialog[open]'))return;
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo();return;}
  if(e.target!==$('#sheetCanvas'))return;
  if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();removeSelected();}
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)&&selectedItem()){
    e.preventDefault();const i=selectedItem(),step=e.shiftKey?1:.1;const k=['ArrowLeft','ArrowRight'].includes(e.key)?'x':'y';modifyField(k,i[k]+(['ArrowLeft','ArrowUp'].includes(e.key)?-step:step));
  }
});
$('#zoomIn').onclick=()=>{zoom=clamp(zoom+.25,.5,3);renderSheet();};$('#zoomOut').onclick=()=>{zoom=clamp(zoom-.25,.5,3);renderSheet();};$('#zoomFit').onclick=()=>{zoom=1;renderSheet();};
$$('[data-sheet-bg]').forEach(b=>b.onclick=()=>{sheetBg=b.dataset.sheetBg;$('#sheetCanvas').className=sheetBg==='checker'?'':`bg-${sheetBg}`;$$('[data-sheet-bg]').forEach(x=>x.classList.toggle('active',x===b));});
function demoArt(kind='type'){
  const c=makeCanvas(1200,kind==='tone'?1200:1000),ctx=c.getContext('2d');
  if(kind==='tone'){
    ctx.fillStyle='#000000';ctx.fillRect(0,0,c.width,c.height);
    const grad=ctx.createRadialGradient(500,420,25,620,580,650);grad.addColorStop(0,'#edffc9');grad.addColorStop(.35,'#7bcb3e');grad.addColorStop(.65,'#b890d8');grad.addColorStop(1,'#000000');ctx.fillStyle=grad;ctx.beginPath();ctx.arc(600,550,480,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#f2f6de';ctx.font='900 225px Arial';ctx.textAlign='center';ctx.fillText('WILD',600,590);ctx.fillText('IDEAS',600,795);ctx.font='bold 37px Arial';ctx.fillText('SERITENE · FÁBRICA DE IDEAS',600,1040);
  }else{
    ctx.fillStyle='#cdecae';ctx.beginPath();ctx.arc(600,460,420,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#4aaf25';for(let n=0;n<16;n++){ctx.save();ctx.translate(600,460);ctx.rotate(n*Math.PI/8);ctx.fillRect(-28,-460,56,920);ctx.restore();}
    ctx.fillStyle='#cdecae';ctx.beginPath();ctx.arc(600,460,340,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#20251f';ctx.textAlign='center';ctx.font='900 220px Arial';ctx.fillText('GOOD',600,425);ctx.fillText('VIBES',600,630);
    ctx.font='bold 36px Arial';ctx.fillText('HECHO PARA DESTACAR',600,820);
    ctx.font='bold 30px Arial';ctx.fillStyle='#367b20';ctx.fillText('SERITENE®',600,970);
  }
  return c;
}
$('#sheetDemo').onclick=()=>{
  try{const a=registerAsset(demoArt(),'Ejemplo · Good vibes.png');placeWithExisting([fitNewAsset(a,24),fitNewAsset(a,16),fitNewAsset(a,10)]);toast('Ejemplo cargado. Puedes cambiar sus medidas y probar la exportación.');}catch(e){toast(e.message);}
};
function updateToneDims(){
  if(!toneSource)return;const w=Number($('#toneWidth').value),h=w*toneSource.canvas.height/toneSource.canvas.width;
  if(!Number.isFinite(w)||w<=0){$('#toneDimensions').textContent='Indica un ancho de 1 a 57 cm.';return;}
  const dpi=(toneSource.sourceWidth||toneSource.canvas.width)/w*2.54;
  $('#toneDimensions').textContent=`${num(w)} × ${num(h)} cm · ${Math.round(dpi)} ppp de origen · salida 300 ppp`;
}
function scheduleTone(){
  clearTimeout(toneTimer);
  toneTimer=setTimeout(()=>{if(busy){scheduleTone();return;}processTone(false);},300);
}
function invalidateTone(update=true){
  toneRevision++;$('#toneToSheet').disabled=true;$('#downloadTone').disabled=true;
  if(toneResult){$('#toneStatus').textContent='Actualizando el semitono con tus ajustes…';if(update)scheduleTone();}
  updateToneDims();
}
function syncToneControls(){
  $('#thresholdManual').value=$('#threshold').value;
  for(const id of ['toneTolerance','toneHoles','toneBrightness','toneContrast'])$('#'+id+'Value').textContent=$('#'+id).value+(id==='toneHoles'?'%':'');
  $('#toneHolesControl').hidden=$('#garment').value!=='light';
  $$('[data-lpi]').forEach(b=>b.classList.toggle('chosen',Number(b.dataset.lpi)===lpi));
}
function setTonePrepare(mode){
  tonePrepare=mode;
  $$('[data-tone-prepare]').forEach(b=>{const active=b.dataset.tonePrepare===mode;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  $('#toneModeHint').textContent=mode==='auto'?'Ajustamos la trama al tipo de prenda y la resolución. Los colores originales se conservan.':'Ajusta a tu gusto. Después del primer resultado, los cambios se actualizan automáticamente.';
  if(!busy)$('#processTone').textContent=mode==='auto'?'⠿ Preparar automáticamente':'⠿ Generar semitono';
}
function applyAutomaticTone(){
  const dpi=toneSource?(toneSource.sourceWidth||toneSource.canvas.width)/Number($('#toneWidth').value)*2.54:300;
  const p=automaticToneSettings($('#garment').value,dpi);
  lpi=p.lpi;$('#threshold').value=p.threshold;$('#toneAngle').value=p.angle;$('#toneShape').value=p.shape;
  $('#toneTolerance').value=p.tolerance;$('#toneHoles').value=p.holeReduction;$('#toneBrightness').value=0;$('#toneContrast').value=0;
  syncToneControls();
}
function setToneBackground(bg){
  toneBg=bg;
  $$('[data-tone-bg]').forEach(b=>{const active=b.dataset.toneBg===bg;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  $('#toneBgLabel').textContent=bg==='checker'?'Sin fondo':bg==='white'?'Vista blanca':'Vista negra';
}
function setToneSource(source,width=20){
  clearTimeout(toneTimer);
  toneSource=source;toneResult=null;toneResultRevision=-1;$('#toneWidth').value=width;$('#processTone').disabled=false;
  const c=makeCanvas(160,Math.max(1,Math.round(160*source.canvas.height/source.canvas.width))),ctx=c.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(source.canvas,0,0,c.width,c.height);
  const suggested=suggestGarment(ctx.getImageData(0,0,c.width,c.height).data,c.width,c.height);
  $('#garment').value=suggested||'dark';
  $('#garmentHint').textContent=suggested===null?'Fondo transparente o ambiguo. Elige prenda clara u oscura según dónde imprimirás.':`Sugerencia: prenda ${suggested==='light'?'clara, elimina blancos':'oscura, elimina negros'}. Puedes cambiarla.`;
  setToneBackground('checker');setTonePrepare('auto');applyAutomaticTone();
  $('#toneZoom').value='fit';toneMode='result';$$('[data-tone-view]').forEach(b=>b.classList.toggle('active',b.dataset.toneView==='result'));
  $('#toneFileInfo').textContent=`${source.name} · ${num(source.canvas.width,0)} × ${num(source.canvas.height,0)} px`;
  $('#toneStatus').textContent='Indica el tamaño de impresión y pulsa Preparar automáticamente. La salida siempre es un PNG sin fondo.';
  invalidateTone();renderTone();
}
async function loadTone(files){
  if(!files?.length)return;
  try{const canvas=await readImage(files[0]);setToneSource({canvas,name:files[0].name});}catch(e){toast(e.message);}finally{$('#toneFile').value='';}
}
$('#uploadTone').onclick=()=>$('#toneFile').click();$('#toneFile').onchange=e=>loadTone(e.target.files);dropzone($('#uploadTone'),loadTone);
$('#toneDemo').onclick=()=>setToneSource({canvas:demoArt('tone'),name:'Ejemplo · Wild ideas.png'});
$('#sendToTone').onclick=()=>{const i=selectedItem();if(!i)return;setToneSource(assets.get(i.assetId),i.w);setTab('tone');};
for(const id of ['garment','toneWidth'])$('#'+id).oninput=()=>{if(tonePrepare==='auto')applyAutomaticTone();syncToneControls();invalidateTone();};
for(const id of ['toneAngle','toneShape'])$('#'+id).onchange=()=>{setTonePrepare('manual');invalidateTone();};
for(const id of ['toneTolerance','toneHoles','toneBrightness','toneContrast'])$('#'+id).oninput=()=>{setTonePrepare('manual');syncToneControls();invalidateTone();};
$('#threshold').oninput=()=>{setTonePrepare('manual');syncToneControls();invalidateTone();};
$('#thresholdManual').oninput=()=>{if($('#thresholdManual').value==='')return;$('#threshold').value=clamp(Number($('#thresholdManual').value),0,100);setTonePrepare('manual');syncToneControls();invalidateTone();};
$$('[data-lpi]').forEach(b=>b.onclick=()=>{lpi=Number(b.dataset.lpi);setTonePrepare('manual');syncToneControls();invalidateTone();});
$$('[data-tone-prepare]').forEach(b=>b.onclick=()=>{setTonePrepare(b.dataset.tonePrepare);if(tonePrepare==='auto')applyAutomaticTone();invalidateTone();});
$('#resetTone').onclick=()=>{setTonePrepare('auto');applyAutomaticTone();setToneBackground('checker');invalidateTone();renderTone();toast('Ajustes automáticos y vista sin fondo restablecidos.');};
async function processTone(notify=true){
  if(!toneSource||busy)return;
  clearTimeout(toneTimer);
  if(tonePrepare==='auto')applyAutomaticTone();
  const w=Number($('#toneWidth').value),h=w*toneSource.canvas.height/toneSource.canvas.width;
  if(!Number.isFinite(w)||w<1||w>57)return toast('El ancho debe estar entre 1 y 57 cm.');
  const width=px(w),height=Math.max(1,Math.round(width*toneSource.canvas.height/toneSource.canvas.width));
  if(width*height>32000000)return toast('Ese tamaño supera el límite de 32 megapíxeles para semitonos. Reduce el ancho de impresión.');
  busy=true;const revision=toneRevision;$('#processTone').disabled=true;$('#processTone').textContent='Preparando la trama…';
  const options={mode:$('#garment').value,threshold:Number($('#threshold').value),lpi,angle:Number($('#toneAngle').value),shape:$('#toneShape').value,tolerance:Number($('#toneTolerance').value),holeReduction:Number($('#toneHoles').value),brightness:Number($('#toneBrightness').value),contrast:Number($('#toneContrast').value)};
  try{
    const c=makeCanvas(width,height),ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(toneSource.canvas,0,0,width,height);
    const data=ctx.getImageData(0,0,width,height);
    const result=await new Promise((resolve,reject)=>{
      const worker=new Worker('./halftone-worker.mjs',{type:'module'});
      const timeout=setTimeout(()=>{worker.terminate();reject(new Error('La imagen es demasiado pesada. Prueba un ancho menor.'));},120000);
      worker.onmessage=({data})=>{clearTimeout(timeout);worker.terminate();data.error?reject(new Error(data.error)):resolve(data);};
      worker.onerror=()=>{clearTimeout(timeout);worker.terminate();reject(new Error('No se pudo procesar la imagen. Prueba de nuevo.'));};
      worker.postMessage({buffer:data.data.buffer,width,height,options},[data.data.buffer]);
    });
    if(revision!==toneRevision){scheduleTone();return;}
    ctx.putImageData(new ImageData(new Uint8ClampedArray(result.buffer),width,height),0,0);
    toneResult={canvas:c,w,h,sourceWidth:toneSource.sourceWidth||toneSource.canvas.width,sourceHeight:toneSource.sourceHeight||toneSource.canvas.height,name:toneSource.name.replace(/\.[^.]+$/,'')+' · semitono.png'};
    toneResultRevision=revision;
    $('#toneToSheet').disabled=false;$('#downloadTone').disabled=false;
    $('#toneStatus').textContent=`Semitono generado · ${num(width,0)} × ${num(height,0)} px · ${num(w)} × ${num(h)} cm · 300 ppp. Revisa los puntos con el zoom al 100%.`;
    renderTone();if(notify)toast('Semitono listo. Colores conservados y PNG sin fondo.');
  }catch(e){toast(e.message);}finally{busy=false;$('#processTone').disabled=!toneSource;setTonePrepare(tonePrepare);renderAll();}
}
$('#processTone').onclick=processTone;
function reducedTonePreview(source,width,height){
  const w=Math.min(width,source.width),h=Math.min(height,source.height);
  if(w===source.width&&h===source.height)return Promise.resolve(source);
  const previous=tonePreviewCache.get(source);
  if(previous?.w===w&&previous?.h===h)return previous.promise;
  if(previous?.worker){previous.worker.terminate();previous.reject(new Error('Vista sustituida'));}
  const entry={w,h,worker:null,reject:null,promise:null};
  entry.promise=new Promise((resolve,reject)=>{
    entry.reject=reject;
    const pixels=source.getContext('2d',{willReadFrequently:true}).getImageData(0,0,source.width,source.height);
    const worker=new Worker('./preview-worker.mjs',{type:'module'});entry.worker=worker;
    const finish=()=>{worker.terminate();entry.worker=null;};
    worker.onmessage=({data})=>{
      finish();if(data.error){tonePreviewCache.delete(source);reject(new Error(data.error));return;}
      const c=makeCanvas(data.width,data.height);c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(data.buffer),data.width,data.height),0,0);resolve(c);
    };
    worker.onerror=()=>{finish();tonePreviewCache.delete(source);reject(new Error('No se pudo preparar la vista suave. Usa Puntos reales.'));};
    worker.postMessage({buffer:pixels.data.buffer,width:source.width,height:source.height,targetWidth:w,targetHeight:h},[pixels.data.buffer]);
  });
  tonePreviewCache.set(source,entry);return entry.promise;
}
async function renderTone(){
  if($('#tonePanel').hidden)return;
  const serial=++tonePreviewSerial;
  const canvas=$('#toneCanvas'),viewport=$('#toneViewport'),stage=$('#toneStage');
  viewport.className='tone-viewport '+(toneBg==='checker'?'checker':'bg-'+toneBg);
  $('#toneEmpty').hidden=!!toneSource;stage.hidden=!toneSource;if(!toneSource)return;
  const source=toneSource.canvas,result=toneResult?.canvas;
  $('#toneCompareControl').hidden=toneMode!=='compare'||!result;
  const reference=result||source,actual=$('#toneZoom').value,smooth=actual==='fit',dpr=window.devicePixelRatio||1;
  $$('[data-tone-quality]').forEach(b=>{const active=(b.dataset.toneQuality==='fit')===smooth;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  viewport.classList.toggle('real-pixels',!smooth);
  let factor=smooth?Math.min(1,(viewport.clientWidth-60)/reference.width,(viewport.clientHeight-60)/reference.height):Number(actual)/dpr;
  factor=Math.max(.0001,factor);
  const w=Math.max(1,Math.round(reference.width*factor*dpr)),h=Math.max(1,Math.round(reference.height*factor*dpr));
  stage.style.width=`${w/dpr}px`;stage.style.height=`${h/dpr}px`;
  let rect={x:0,y:0,w:reference.width,h:reference.height},originalView=source,resultView=result;
  try{
    if(smooth){
      $('#toneViewHint').textContent='Preparando vista suave…';stage.setAttribute('aria-busy','true');
      [originalView,resultView]=await Promise.all([
        toneMode!=='result'||!result?reducedTonePreview(source,w,h):Promise.resolve(source),
        result&&toneMode!=='original'?reducedTonePreview(result,w,h):Promise.resolve(result)
      ]);
      if(serial!==tonePreviewSerial)return;
      canvas.width=w;canvas.height=h;canvas.style.left='0';canvas.style.top='0';
      canvas.style.width=`${w/dpr}px`;canvas.style.height=`${h/dpr}px`;
      $('#toneViewHint').textContent='Vista suave · imagen completa';
    }else{
      const box=stage.getBoundingClientRect(),view=viewport.getBoundingClientRect();
      rect=visibleRegion(reference.width,reference.height,factor,Math.max(0,view.left+viewport.clientLeft-box.left),Math.max(0,view.top+viewport.clientTop-box.top),viewport.clientWidth,viewport.clientHeight);
      canvas.width=rect.w*Number(actual);canvas.height=rect.h*Number(actual);
      canvas.style.left=`${rect.x*factor}px`;canvas.style.top=`${rect.y*factor}px`;
      canvas.style.width=`${canvas.width/dpr}px`;canvas.style.height=`${canvas.height/dpr}px`;
      $('#toneViewHint').textContent=`${Number(actual)*100}% · puntos reales · arrastra para explorar`;
    }
    stage.setAttribute('aria-busy','false');
    const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=smooth;ctx.imageSmoothingQuality='high';
    const draw=image=>{
      if(smooth)ctx.drawImage(image,0,0,canvas.width,canvas.height);
      else ctx.drawImage(image,rect.x*image.width/reference.width,rect.y*image.height/reference.height,rect.w*image.width/reference.width,rect.h*image.height/reference.height,0,0,canvas.width,canvas.height);
    };
    if(toneMode==='original'||!result)draw(originalView);
    else if(toneMode==='result')draw(resultView);
    else{
      const split=(reference.width*Number($('#toneCompare').value)/100-rect.x)/rect.w*canvas.width;
      ctx.save();ctx.beginPath();ctx.rect(0,0,Math.max(0,split),canvas.height);ctx.clip();draw(originalView);ctx.restore();
      ctx.save();ctx.beginPath();ctx.rect(Math.max(0,split),0,Math.max(0,canvas.width-split),canvas.height);ctx.clip();draw(resultView);ctx.restore();
      ctx.fillStyle='#4aaf25';ctx.fillRect(split-dpr,0,2*dpr,canvas.height);
      ctx.font=`bold ${11*dpr}px Arial`;ctx.textBaseline='top';
      for(const [label,x] of [['ORIGINAL',10*dpr],['SEMITONO',canvas.width-99*dpr]]){
        ctx.fillStyle='#20251f';ctx.fillRect(x,10*dpr,89*dpr,24*dpr);ctx.fillStyle='#fff';ctx.fillText(label,x+8*dpr,16*dpr);
      }
    }
  }catch(error){
    if(serial!==tonePreviewSerial)return;
    stage.setAttribute('aria-busy','false');$('#toneViewHint').textContent=error.message;
  }
}
$$('[data-tone-view]').forEach(b=>b.onclick=()=>{toneMode=b.dataset.toneView;$$('[data-tone-view]').forEach(x=>x.classList.toggle('active',x===b));renderTone();});
$$('[data-tone-bg]').forEach(b=>b.onclick=()=>{setToneBackground(b.dataset.toneBg);renderTone();});
$('#toneCompare').oninput=renderTone;
async function changeToneZoom(value){
  $('#toneZoom').value=value;await renderTone();
  const viewport=$('#toneViewport');viewport.scrollLeft=Math.max(0,(viewport.scrollWidth-viewport.clientWidth)/2);viewport.scrollTop=Math.max(0,(viewport.scrollHeight-viewport.clientHeight)/2);
  if(value!=='fit')renderTone();
}
$('#toneZoom').onchange=()=>changeToneZoom($('#toneZoom').value);
$$('[data-tone-quality]').forEach(b=>b.onclick=()=>changeToneZoom(b.dataset.toneQuality));
$('#toneViewport').addEventListener('scroll',()=>{
  if($('#toneZoom').value==='fit'||toneScrollFrame)return;
  toneScrollFrame=requestAnimationFrame(()=>{toneScrollFrame=0;renderTone();});
},{passive:true});
$('#toneViewport').addEventListener('pointerdown',e=>{
  if($('#toneZoom').value==='fit'||e.button!==0)return;
  const v=$('#toneViewport');tonePan={x:e.clientX,y:e.clientY,left:v.scrollLeft,top:v.scrollTop};v.setPointerCapture(e.pointerId);v.classList.add('panning');e.preventDefault();
});
$('#toneViewport').addEventListener('pointermove',e=>{
  if(!tonePan)return;const v=$('#toneViewport');v.scrollLeft=tonePan.left+tonePan.x-e.clientX;v.scrollTop=tonePan.top+tonePan.y-e.clientY;
});
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('#toneViewport').addEventListener(event,()=>{tonePan=null;$('#toneViewport').classList.remove('panning');});
$('#toneToSheet').onclick=()=>{
  if(!toneResult||toneResultRevision!==toneRevision)return;
  try{const a=registerAsset(toneResult.canvas,toneResult.name,toneResult.sourceWidth,toneResult.sourceHeight,true);placeWithExisting([fitNewAsset(a,toneResult.w)]);setTab('sheet');toast('Semitono añadido a tamaño real.');}catch(e){toast(e.message);}
};
function downloadBlob(blob,name){
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
$('#downloadTone').onclick=async()=>{
  if(!toneResult||busy||toneResultRevision!==toneRevision)return;
  busy=true;$('#downloadTone').disabled=true;
  try{
    const c=toneResult.canvas,ctx=c.getContext('2d',{willReadFrequently:true});
    const blob=await encodePNG(c.width,c.height,(y,h)=>ctx.getImageData(0,y,c.width,h).data,p=>$('#downloadTone').textContent=`Exportando ${p}%…`);
    downloadBlob(blob,`seritene-semitono-${num(toneResult.w)}x${num(toneResult.h)}cm-300ppp.png`);toast('PNG transparente generado con tamaño real a 300 ppp.');
  }catch(e){toast(e.message);}finally{busy=false;$('#downloadTone').disabled=false;$('#downloadTone').textContent='↓ Descargar PNG transparente';}
};
function exportIssues(){
  const v=validate(items,length),low=items.filter(i=>effectiveDPI(i)<250),opaque=items.filter(i=>!assets.get(i.assetId).transparent);
  const issues=[];if(v.outside.length)issues.push({error:true,text:`${v.outside.length} diseño(s) fuera de la plancha. Corrige las posiciones o el largo antes de exportar.`});
  if(v.collisions.length)issues.push({error:true,text:'Hay diseños superpuestos. Sepáralos antes de exportar para no imprimirlos unidos.'});
  if(low.length)issues.push({text:`${low.length} diseño(s) con menos de 250 ppp de origen. Exportar a 300 ppp no añade detalle.`});
  if(opaque.length)issues.push({text:`${opaque.length} diseño(s) tienen fondo opaco. El PNG conserva ese fondo. Usa «Eliminar fondo» en el paso 02 o Semitonos para eliminar blancos o negros.`});
  return issues;
}
$('#exportSheet').onclick=()=>{
  const issues=exportIssues();$('#exportSummary').innerHTML=`<b>57 × ${num(length)} cm</b><br>${items.length} diseños · ${num(px(57),0)} × ${num(px(length),0)} px<br>PNG · 300 ppp · sin fondo añadido`;
  $('#exportIssues').replaceChildren();issues.forEach(issue=>{const p=document.createElement('p');p.className='issue'+(issue.error?' error':'');p.textContent=issue.text;$('#exportIssues').append(p);});
  $('#confirmExport').disabled=issues.some(i=>i.error);$('#confirmExport').hidden=false;$('#exportProgress').hidden=true;$('#exportDone').hidden=true;$('#exportDialog').showModal();
};
$('#confirmExport').onclick=async()=>{
  if(busy||!items.length||exportIssues().some(i=>i.error))return;
  busy=true;$('#confirmExport').disabled=true;$('#exportProgress').hidden=false;
  const frozen=items.map(i=>({...i})),w=px(57),h=px(length),canvas=makeCanvas(w,128),ctx=canvas.getContext('2d',{willReadFrequently:true});
  try{
    const blob=await encodePNG(w,h,(y,rows)=>{
      if(canvas.height!==rows)canvas.height=rows;
      ctx.clearRect(0,0,w,rows);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
      const f=DPI/2.54;for(const i of frozen){const b=bounds(i);if((i.y+b.h)*f<y||i.y*f>y+rows)continue;drawItem(ctx,i,f,y,true);}
      return ctx.getImageData(0,0,w,rows).data;
    },p=>{$('#exportProgress progress').value=p;$('#exportProgress p').textContent=`Preparando el PNG… ${p}%`;});
    const base=$('#jobName').value.trim().replace(/[^\p{L}\p{N}_ -]/gu,'').slice(0,70)||'seritene-dtf';
    const name=`${base}-57x${num(length)}cm-300ppp.png`;
    if(downloadURL)URL.revokeObjectURL(downloadURL);downloadURL=URL.createObjectURL(blob);
    $('#downloadAgain').href=downloadURL;$('#downloadAgain').download=name;$('#downloadAgain').click();
    $('#whatsappExport').href='https://wa.me/34641782535?text='+encodeURIComponent(`Hola Seritene, he preparado una plancha DTF de 57 × ${num(length)} cm con ${items.length} diseños. Adjunto el PNG original a 300 ppp como documento para que lo reviséis.`);
    $('#exportDone').hidden=false;$('#confirmExport').hidden=true;$('#exportProgress').hidden=true;
  }catch(e){toast(e.message);$('#exportProgress').hidden=true;}
  finally{busy=false;$('#confirmExport').disabled=false;canvas.width=1;canvas.height=1;renderAll();}
};
$('#helpOpen').onclick=()=>$('#helpDialog').showModal();
$$('[data-close]').forEach(b=>b.onclick=()=>{if(busy&&b.dataset.close==='exportDialog')return toast('Espera a que termine la exportación.');$('#'+b.dataset.close).close();});
$('#exportDialog').addEventListener('cancel',e=>{if(busy)e.preventDefault();});
$('#saveProject').onclick=async()=>{
  if(!items.length)return toast('Añade algún diseño antes de guardar el proyecto.');
  try{const used=[...new Set(items.map(i=>i.assetId))];const project={format:'seritene-dtf',version:1,length,items,assets:used.map(id=>{const a=assets.get(id);return {id,name:a.name,sourceWidth:a.sourceWidth,sourceHeight:a.sourceHeight,isHalftone:a.isHalftone,data:a.canvas.toDataURL('image/png')};})};downloadBlob(new Blob([JSON.stringify(project)],{type:'application/json'}),'mi-proyecto.seritene');dirty=false;toast('Proyecto guardado con los diseños y sus posiciones.');}catch(e){toast('No se pudo guardar el proyecto. Prueba con menos imágenes.');}
};
$('#loadProject').onclick=()=>$('#projectFile').click();
$('#projectFile').onchange=async e=>{
  const file=e.target.files[0];if(!file)return;
  const added=[];
  try{
    if(file.size>160*1024*1024)throw new Error('El proyecto supera el límite de 160 MB.');
    const p=JSON.parse(await file.text());
    if(p.format!=='seritene-dtf'||p.version!==1||!Array.isArray(p.assets)||!Array.isArray(p.items)||p.items.length>300||p.assets.length>100||!Number.isFinite(p.length)||p.length<10||p.length>300)throw new Error('El proyecto no tiene un formato válido.');
    const mapped=new Map();
    for(const a of p.assets){
      if(typeof a.id!=='string'||mapped.has(a.id)||typeof a.name!=='string'||!/^data:image\/png;base64,/.test(a.data))throw new Error('El proyecto contiene una imagen no válida.');
      const blob=await fetch(a.data).then(r=>r.blob()),c=await readImage(new File([blob],'design.png',{type:'image/png'}));
      const sw=Number.isFinite(a.sourceWidth)&&a.sourceWidth>0?a.sourceWidth:c.width,sh=Number.isFinite(a.sourceHeight)&&a.sourceHeight>0?a.sourceHeight:c.height;
      const registered=registerAsset(c,a.name.slice(0,200),sw,sh,a.isHalftone===true);added.push(registered.id);mapped.set(a.id,registered.id);
    }
    const loaded=p.items.map(i=>{
      if(!mapped.has(i.assetId)||![i.x,i.y,i.w,i.h,i.rotation].every(Number.isFinite)||i.w<.1||i.h<.1||![0,90,180,270].includes(i.rotation))throw new Error('El proyecto contiene medidas no válidas.');
      return {id:uid(),assetId:mapped.get(i.assetId),x:i.x,y:i.y,w:i.w,h:i.h,rotation:i.rotation};
    });
    if(validate(loaded,p.length).outside.length)throw new Error('Hay diseños fuera de los límites del proyecto.');
    remember();items=loaded;length=p.length;selected=items[0]?.id||null;$('#sheetLength').value=length;renderAll();$('#helpDialog').close();toast('Proyecto abierto.');
  }catch(error){added.forEach(id=>assets.delete(id));toast(error.message||'No se pudo abrir el proyecto.');}
  finally{e.target.value='';}
};
window.addEventListener('beforeunload',e=>{if(dirty&&items.length){e.preventDefault();e.returnValue='';}});
let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{renderSheet();renderTone();},120);});
renderAll();setTab('sheet');
// Background removal is transactional: cancelling never changes an asset or history.
let backgroundWorker=null,backgroundTarget=null,backgroundResult=null,backgroundTimeout;
function drawBackgroundPreview(id,source){
  const c=$(id),factor=Math.min(1,600/source.width,600/source.height);
  c.width=Math.max(1,Math.round(source.width*factor));c.height=Math.max(1,Math.round(source.height*factor));
  c.getContext('2d').drawImage(source,0,0,c.width,c.height);
}
function stopBackgroundWorker(){
  clearTimeout(backgroundTimeout);backgroundWorker?.terminate();backgroundWorker=null;
}
function closeBackground(){
  stopBackgroundWorker();backgroundResult=null;backgroundTarget=null;
  $('#backgroundDialog').close();
}
$('#backgroundClose').onclick=$('#backgroundCancel').onclick=closeBackground;
$('#backgroundDialog').addEventListener('cancel',e=>{e.preventDefault();closeBackground();});
$('#removeBackground').onclick=()=>{
  const item=selectedItem();if(!item||busy)return;
  backgroundTarget={itemId:item.id,assetId:item.assetId};backgroundResult=null;
  drawBackgroundPreview('#backgroundBefore',assets.get(item.assetId).canvas);
  const after=$('#backgroundAfter');after.width=1;after.height=1;after.hidden=true;
  $('#backgroundPlaceholder').hidden=false;
  for(const id of ['backgroundProgress','backgroundError','backgroundApply','backgroundReview'])$('#'+id).hidden=true;
  $('#backgroundStart').hidden=false;$('#backgroundStart').disabled=false;
  $('#backgroundDialog').showModal();
};
function backgroundFailure(message){
  stopBackgroundWorker();$('#backgroundProgress').hidden=true;
  $('#backgroundError').textContent=message;$('#backgroundError').hidden=false;
  $('#backgroundStart').hidden=false;$('#backgroundStart').disabled=false;
}
$('#backgroundStart').onclick=()=>{
  if(backgroundWorker||!backgroundTarget)return;
  $('#backgroundError').hidden=true;$('#backgroundProgress').hidden=false;$('#backgroundStart').disabled=true;
  const progress=$('#backgroundProgress progress');progress.removeAttribute('value');
  $('#backgroundStatus').textContent='Preparando la herramienta… Puedes cancelar cuando quieras.';
  try{
    const source=assets.get(backgroundTarget.assetId).canvas;
    // Only the mask is inferred at a bounded size. Original print pixels remain intact.
    const factor=Math.min(1,1536/Math.max(source.width,source.height));
    const input=makeCanvas(Math.max(1,Math.round(source.width*factor)),Math.max(1,Math.round(source.height*factor)));
    input.getContext('2d').drawImage(source,0,0,input.width,input.height);
    const pixels=input.getContext('2d').getImageData(0,0,input.width,input.height);
    backgroundWorker=new Worker(new URL('./background-worker.mjs',import.meta.url),{type:'module'});
    backgroundTimeout=setTimeout(()=>backgroundFailure('Este dispositivo está tardando demasiado. Tu original sigue intacto. Puedes reintentarlo en un ordenador o usar Semitonos para quitar blancos o negros.'),240000);
    backgroundWorker.onerror=()=>backgroundFailure('No se pudo cargar la herramienta. Comprueba tu conexión y vuelve a intentarlo. Tu original sigue intacto.');
    backgroundWorker.onmessage=({data})=>{
      if(data.type==='progress'){
        $('#backgroundStatus').textContent=data.label+(Number.isFinite(data.value)?` · ${data.value}%`:'');
        if(Number.isFinite(data.value))progress.value=data.value;else progress.removeAttribute('value');
      }else if(data.type==='error'){
        console.warn('Background removal:',data.message);
        backgroundFailure('No se pudo completar el recorte en este dispositivo. Comprueba la conexión o prueba en un ordenador. Tu original sigue intacto.');
      }else if(data.type==='result'){
        try{
          if(data.channels!==4)throw new Error('Formato de máscara no válido.');
          const matte=makeCanvas(data.width,data.height);
          matte.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(data.pixels),data.width,data.height),0,0);
          const full=makeCanvas(source.width,source.height),ctx=full.getContext('2d');
          ctx.drawImage(matte,0,0,full.width,full.height);
          const original=source.getContext('2d').getImageData(0,0,source.width,source.height);
          const mask=ctx.getImageData(0,0,full.width,full.height);
          ctx.putImageData(new ImageData(applyAlphaMatte(original.data,mask.data),full.width,full.height),0,0);
          backgroundResult=full;drawBackgroundPreview('#backgroundAfter',full);
          $('#backgroundAfter').hidden=false;$('#backgroundPlaceholder').hidden=true;
          $('#backgroundProgress').hidden=true;$('#backgroundStart').hidden=true;
          $('#backgroundApply').hidden=false;$('#backgroundReview').hidden=false;
          stopBackgroundWorker();
        }catch{backgroundFailure('No se pudo preparar la vista previa. Tu original sigue intacto. Prueba con una imagen más pequeña.');}
      }
    };
    backgroundWorker.postMessage({pixels:pixels.data.buffer,width:input.width,height:input.height},[pixels.data.buffer]);
  }catch{backgroundFailure('Este navegador no pudo iniciar el recorte. Tu original sigue intacto. Prueba con un navegador actualizado.');}
};
$('#backgroundApply').onclick=()=>{
  const item=items.find(i=>i.id===backgroundTarget?.itemId);
  if(!item||!backgroundResult||item.assetId!==backgroundTarget.assetId)return;
  try{
    const original=assets.get(item.assetId);
    const cutout=registerAsset(backgroundResult,original.name+' · sin fondo',original.sourceWidth,original.sourceHeight,original.isHalftone);
    remember();item.assetId=cutout.id;selected=item.id;
    closeBackground();renderAll();toast('Fondo eliminado. Puedes recuperar el original con Deshacer.');
  }catch(e){$('#backgroundError').textContent=e.message;$('#backgroundError').hidden=false;}
};
