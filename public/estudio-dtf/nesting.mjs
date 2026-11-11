const EPS=1e-7;
const dimensions=i=>i.rotation%180?{w:i.h,h:i.w}:{w:i.w,h:i.h};
export const usedLength=(items,margin=.5)=>items.length?Math.max(...items.map(i=>i.y+dimensions(i).h))+margin:0;
const intersects=(a,b)=>a.x<b.x+b.w-EPS&&a.x+a.w>b.x+EPS&&a.y<b.y+b.h-EPS&&a.y+a.h>b.y+EPS;
const contains=(a,b)=>a.x<=b.x+EPS&&a.y<=b.y+EPS&&a.x+a.w>=b.x+b.w-EPS&&a.y+a.h>=b.y+b.h-EPS;
const less=(a,b)=>{for(let i=0;i<a.length;i++){if(a[i]<b[i]-EPS)return true;if(a[i]>b[i]+EPS)return false;}return false;};

// Maximal free rectangles retain cavities below and beside previous placements.
// Inflate each rectangle by the cut gap, including a virtual strip beyond the bin.
function attempt(order,width,height,gap,margin,rotate,mode){
  let free=[{x:0,y:0,w:width-2*margin+gap,h:height-2*margin+gap}],placed=[],bottom=0;
  for(const item of order){
    let best;
    for(const rotation of rotate?[item.rotation,(item.rotation+90)%360]:[item.rotation]){
      const d=dimensions({...item,rotation}),w=d.w+gap,h=d.h+gap;
      for(const f of free){
        if(w>f.w+EPS||h>f.h+EPS)continue;
        const short=Math.min(f.w-w,f.h-h),long=Math.max(f.w-w,f.h-h),top=f.y+h;
        const score=mode===0?[Math.max(bottom,top),top,f.x,short]:mode===1?[short,long,top,f.x]:[f.w*f.h-w*h,short,top,f.x];
        if(!best||less(score,best.score))best={x:f.x,y:f.y,w,h,rotation,score};
      }
    }
    if(!best)return null;
    const next=[];
    for(const f of free){
      if(!intersects(f,best)){next.push(f);continue;}
      if(best.x>f.x+EPS)next.push({...f,w:best.x-f.x});
      if(best.x+best.w<f.x+f.w-EPS)next.push({...f,x:best.x+best.w,w:f.x+f.w-best.x-best.w});
      if(best.y>f.y+EPS)next.push({...f,h:best.y-f.y});
      if(best.y+best.h<f.y+f.h-EPS)next.push({...f,y:best.y+best.h,h:f.y+f.h-best.y-best.h});
    }
    free=next.filter((f,i)=>!next.some((g,j)=>i!==j&&contains(g,f)&&(!contains(f,g)||j<i)));
    bottom=Math.max(bottom,best.y+best.h);
    placed.push({...item,x:best.x+margin,y:best.y+margin,rotation:best.rotation});
  }
  return placed;
}
function validExisting(items,width,height,gap,margin){
  const rects=items.map(i=>({...dimensions(i),x:i.x,y:i.y}));
  return rects.every((r,i)=>Number.isFinite(r.x)&&Number.isFinite(r.y)&&r.x>=margin-EPS&&r.y>=margin-EPS&&r.x+r.w<=width-margin+EPS&&r.y+r.h<=height-margin+EPS&&rects.slice(i+1).every(s=>!intersects({...r,w:r.w+gap,h:r.h+gap},{...s,w:s.w+gap,h:s.h+gap})));
}
export function nestRectangles(items,height,gap=.5,margin=.5,rotate=true,{deep=false,onProgress=()=>{}}={}){
  if(!items.length)return [];
  const width=57;
  gap=Math.max(.5,Number.isFinite(gap)?gap:.5);margin=Math.max(.5,Number.isFinite(margin)?margin:.5);
  if(!Number.isFinite(height)||height<=2*margin||items.length>300||new Set(items.map(i=>i.id)).size!==items.length||items.some(i=>![i.w,i.h,i.rotation].every(Number.isFinite)||i.w<=0||i.h<=0||![0,90,180,270].includes(i.rotation)))return null;
  if(items.some(i=>{const d=dimensions(i);return !(d.w<=width-2*margin+EPS&&d.h<=height-2*margin+EPS)&&!(rotate&&d.h<=width-2*margin+EPS&&d.w<=height-2*margin+EPS);}))return null;
  if(items.reduce((s,i)=>s+(i.w+gap)*(i.h+gap),0)>(width-2*margin+gap)*(height-2*margin+gap)+EPS)return null;
  const metrics=[i=>i.w*i.h,i=>Math.max(i.w,i.h),i=>Math.min(i.w,i.h),i=>i.w+i.h,i=>i.w,i=>i.h];
  const orders=metrics.map(metric=>[...items].sort((a,b)=>metric(b)-metric(a)||b.w*b.h-a.w*a.h));
  if(deep){
    // Reproducible perturbed orders explore alternative ways to fill the same gaps.
    let seed=73129;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    for(let n=0;n<12;n++)orders.push(items.map(item=>({item,score:(item.w*item.h)**.5*(.6+random()*.8)})).sort((a,b)=>b.score-a.score).map(x=>x.item));
  }
  let best=validExisting(items,width,height,gap,margin)?items.map(i=>({...i})):null;
  let bestHeight=best?usedLength(best,margin):height+1;
  const accept=result=>{if(result){const h=usedLength(result,margin);if(h<bestHeight-EPS){best=result;bestHeight=h;}}};
  for(let n=0;n<orders.length;n++){
    for(let mode=0;mode<3;mode++)accept(attempt(orders[n],width,Math.min(height,bestHeight),gap,margin,rotate,mode));
    onProgress(Math.round((n+1)/orders.length*65));
  }
  // Search tighter sheet heights too: a smaller bin can force a better arrangement.
  if(best){
    let low=Math.max(2*margin,items.reduce((s,i)=>s+(i.w+gap)*(i.h+gap),0)/(width-2*margin+gap)+2*margin-gap),high=bestHeight;
    for(let step=0;step<(deep?9:4)&&high-low>.02;step++){
      const target=(low+high)/2;let found=false;
      for(const order of orders.slice(0,deep?12:3))for(const mode of [1,2,0]){
        const result=attempt(order,width,target,gap,margin,rotate,mode);
        if(result){accept(result);found=true;}
      }
      if(found)high=bestHeight;else low=target;
      onProgress(65+Math.round((step+1)/(deep?9:4)*35));
    }
  }
  if(!best)return null;
  const byId=new Map(best.map(i=>[i.id,i]));
  return items.map(i=>byId.get(i.id));
}
