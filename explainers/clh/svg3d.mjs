/** Small orthographic 3D renderer for modest mathematical meshes.
 * SVG only: no WebGL/GPU dependency. Painter-sorted translucent faces, lines,
 * keyboard and pointer rotation, and selectable sample vertices.
 * This is a display projection, never an intrinsic metric computation.
 */
export function renderOrthographic(container,scene){
 const ns='http://www.w3.org/2000/svg';
 const el=(name,attrs={})=>{const e=document.createElementNS(ns,name);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);return e;};
 const view=container.__view3d||{yaw:-.65,pitch:.72};container.__view3d=view;
 const P=scene.points;const ctr=[0,1,2].map(j=>(Math.min(...P.map(p=>p[j]))+Math.max(...P.map(p=>p[j])))/2);
 const radius=Math.max(1e-12,...P.map(p=>Math.hypot(...p.map((x,j)=>x-ctr[j]))));
 const svg=el('svg',{viewBox:'0 0 620 420',role:'img','aria-label':scene.title+'; drag or use arrow keys to rotate',tabindex:'0'});
 svg.style.cssText='width:100%;height:100%;display:block;touch-action:pan-y;background:white;cursor:grab';
 const defs=el('defs');svg.append(defs);const root=el('g');svg.append(root);
 const note=el('text',{x:310,y:408,'text-anchor':'middle',fill:'#5d7381','font-size':11});note.textContent='Drag to rotate · arrow keys rotate · Home resets';svg.append(note);
 container.replaceChildren(svg);
 function draw(){
  root.replaceChildren();const c=Math.cos(view.yaw),s=Math.sin(view.yaw),cp=Math.cos(view.pitch),sp=Math.sin(view.pitch);
  const Q=P.map(p=>{let x=p[0]-ctr[0],y=p[1]-ctr[1],z=p[2]-ctr[2];const a=c*x-s*y,b=s*x+c*y;return [310+178*a/radius,204+178*(sp*b-cp*z)/radius,cp*b+sp*z];});
  const faces=(scene.faces||[]).map(f=>({...f,depth:f.indices.reduce((v,i)=>v+Q[i][2],0)/f.indices.length})).sort((a,b)=>a.depth-b.depth);
  for(const f of faces){const poly=el('polygon',{points:f.indices.map(i=>Q[i].slice(0,2).join(',')).join(' '),fill:f.color||'#16766c','fill-opacity':f.opacity??.25,stroke:f.stroke||f.color||'#16766c','stroke-opacity':.22,'stroke-width':.5});if(f.title){const t=el('title');t.textContent=f.title;poly.append(t);}root.append(poly);}
  for(const line of scene.lines||[]){const p=el('polyline',{points:line.indices.map(i=>Q[i].slice(0,2).join(',')).join(' '),fill:'none',stroke:line.color||'#9db6c0','stroke-width':line.width||1.5,'stroke-opacity':line.opacity??.9,'stroke-linejoin':'round','stroke-linecap':'round'});if(line.dash)p.setAttribute('stroke-dasharray',line.dash);root.append(p);}
  const dots=(scene.dots||[]).slice().sort((a,b)=>Q[a.index][2]-Q[b.index][2]);
  for(const dot of dots){const [x,y]=Q[dot.index],d=el('circle',{cx:x,cy:y,r:dot.size||3,fill:dot.color||'#16766c',stroke:dot.stroke||'white','stroke-width':dot.strokeWidth??.7,opacity:dot.opacity??1});
   if(dot.title){const t=el('title');t.textContent=dot.title;d.append(t);}
   if(dot.data!==undefined&&scene.onPoint){d.style.cursor='pointer';d.setAttribute('data-sample',String(dot.index));}
   root.append(d);
  }
  for(const label of scene.labels||[]){const [x,y]=Q[label.index],t=el('text',{x:x+(label.dx||0),y:y+(label.dy??-11),'text-anchor':'middle',fill:label.color||'#203d4c','font-size':label.size||12,'font-weight':label.bold?'700':'500','paint-order':'stroke','stroke':'white','stroke-width':3,'stroke-linejoin':'round'});t.textContent=label.text;root.append(t);}
 }
 let pointer=null,dragged=false;
 svg.addEventListener('pointerdown',e=>{if(e.button!==0)return;pointer={x:e.clientX,y:e.clientY,yaw:view.yaw,pitch:view.pitch,sample:e.target.getAttribute?.('data-sample')};dragged=false;svg.setPointerCapture(e.pointerId);svg.style.cursor='grabbing';});
 svg.addEventListener('pointermove',e=>{if(!pointer)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;if(Math.hypot(dx,dy)>3)dragged=true;if(dragged){view.yaw=pointer.yaw+dx*.008;view.pitch=Math.max(-1.5,Math.min(1.5,pointer.pitch+dy*.008));draw();}});
 svg.addEventListener('pointerup',e=>{const sample=pointer?.sample;const pick=!dragged&&sample!==null&&sample!==undefined;pointer=null;svg.style.cursor='grab';if(svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId);if(pick&&scene.onPoint){const dot=(scene.dots||[]).find(d=>d.index===Number(sample));if(dot?.data!==undefined)scene.onPoint(dot.data);}});
 svg.addEventListener('pointercancel',()=>{pointer=null;});
 svg.addEventListener('keydown',e=>{let changed=true;if(e.key==='ArrowLeft')view.yaw-=.13;else if(e.key==='ArrowRight')view.yaw+=.13;else if(e.key==='ArrowUp')view.pitch-=.13;else if(e.key==='ArrowDown')view.pitch+=.13;else if(e.key==='Home'){view.yaw=-.65;view.pitch=.72;}else changed=false;if(changed){e.preventDefault();view.pitch=Math.max(-1.5,Math.min(1.5,view.pitch));draw();}});
 draw();
 return svg;
}
