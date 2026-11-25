/** SVG display of Python-generated, source-parity Bezier paths.
 * No routing or combinatorial algorithm lives in this module.
 */
const NS='http://www.w3.org/2000/svg';
const SCALE=100;
function node(tag,attrs={},text){const e=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));if(text!==undefined)e.textContent=text;return e;}
function num(v){if(typeof v!=='number'||!Number.isFinite(v)||Math.abs(v)>100000)throw Error('Invalid plabic coordinate.');return String(v*SCALE);}
export function pathD(commands){
 if(!Array.isArray(commands)||commands.length>10000)throw Error('Invalid Bezier path.');
 return commands.map((c,i)=>{
  if(!Array.isArray(c)||!['M','L','C'].includes(c[0])||c.length!==(c[0]==='C'?7:3)||(i===0&&c[0]!=='M'))throw Error('Unsupported Bezier command.');
  return c[0]+' '+c.slice(1).map((v,j)=>num(j%2?-v:v)).join(' ');
 }).join(' ');
}
const xy=(x,y)=>({x:num(x),y:num(-y)});
function text(parent,x,y,value,attrs={}){const e=node('text',{...xy(x,y),'text-anchor':'middle','font-family':'Georgia, serif',...attrs},value);parent.append(e);return e;}
function line(parent,x1,y1,x2,y2,attrs={}){parent.append(node('line',{x1:num(x1),y1:num(-y1),x2:num(x2),y2:num(-y2),'stroke-linecap':'round','vector-effect':'non-scaling-stroke',...attrs}));}

export function renderPlabic(geometry,{showTrips=true,showFaces=true,showAlphaLabels=true,selectedTrip=0,onTrip=null,title='Plabic ladder',mode='snapshot'}={}){
 const g=geometry;
 if(!g||g.renderer!=='plabic-geometry-v1'||!Array.isArray(g.strands))throw Error('Plabic geometry is missing.');
 const n=g.n,s=g.style;
 const x0=-.75,x1=n-1+.75,high=g.top_y+.72;
 // Extra space includes the original anchor label that the old axes clipped.
 const low=g.bottom_y-(showTrips?1.25:0.75);
 const svg=node('svg',{xmlns:NS,viewBox:`${x0*SCALE} ${-high*SCALE} ${(x1-x0)*SCALE} ${(high-low)*SCALE}`,width:'100%',role:'group','aria-label':title,'data-renderer':g.renderer,'data-geometry-mode':mode,class:'plabic-svg',preserveAspectRatio:'xMidYMid meet'});
 svg.append(node('title',{},title));
 svg.append(node('desc',{},'Bridge layout with cubic Bezier strand overlays. Top labels name legs. Colored bottom labels name the starting strand at its exit. Select a strand for its directed endpoint mapping.'));
 svg.append(node('rect',{x:x0*SCALE,y:-high*SCALE,width:(x1-x0)*SCALE,height:(high-low)*SCALE,fill:'white'}));
 const paths=node('g',{'data-layer':'strands'});svg.append(paths);
 if(showTrips){
  for(const t of g.strands){
   const active=!selectedTrip||t.start===selectedTrip;
   const route=node('g',{'data-trip-start':t.start,'data-trip-end':t.end,role:'button',tabindex:0,'aria-label':`Strand ${t.start} to ${t.end}${selectedTrip===t.start?', selected':''}`,'aria-pressed':String(selectedTrip===t.start),class:'plabic-strand',opacity:active?1:.12});
   route.append(node('title',{},`Strand ${t.start} → ${t.end}. Click to ${selectedTrip===t.start?'show all strands':'highlight'}.`));
   const d=pathD(t.commands);
   route.append(node('path',{d,fill:'none',stroke:t.color,'stroke-width':selectedTrip===t.start?s.strand_width+1:s.strand_width,'stroke-opacity':s.strand_opacity,'stroke-linecap':'round','stroke-linejoin':'round','vector-effect':'non-scaling-stroke'}));
   // Wide transparent stroke is a click/keyboard target, not extra geometry.
   route.append(node('path',{d,fill:'none',stroke:'transparent','stroke-width':13,'vector-effect':'non-scaling-stroke','pointer-events':'stroke',class:'strand-hit'}));
   const [x,y]=t.end_point;
   // Arrow attached to the actual path endpoint, not the source's fixed +offset.
   route.append(node('path',{d:`M ${num(x-.055)} ${num(-(y+.035))} L ${num(x)} ${num(-(y-.10))} L ${num(x+.055)} ${num(-(y+.035))} Z`,fill:t.color,stroke:'none'}));
   const label=text(route,x,g.bottom_y-.66,String(t.start),{'font-size':19,'font-weight':'bold',fill:t.color});
   label.append(node('title',{},`Start ${t.start}; destination leg ${t.end}`));
   if(onTrip){const choose=()=>onTrip(t.start===selectedTrip?0:t.start);route.addEventListener('click',choose);route.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose();}});}
   paths.append(route);
  }
 }
 const structure=node('g',{'data-layer':'graph','pointer-events':'none'});svg.append(structure);
 for(const l of g.legs)line(structure,l.x,l.top,l.x,l.depth,{stroke:'black','stroke-width':s.line_width});
 for(const r of g.rungs)line(structure,r.x1,r.y,r.x2,r.y,{stroke:s.rung_color,'stroke-width':s.line_width});
 for(const v of g.vertices){structure.append(node('circle',{cx:num(v.x),cy:num(-v.y),r:num(s.vertex_radius),fill:v.color==='white'?'white':s.black_vertex_color,stroke:'black','stroke-width':s.line_width,'vector-effect':'non-scaling-stroke','data-vertex-color':v.color,'data-leg':v.leg}));}
 for(const l of g.legs)text(structure,l.x,g.top_y+.24,String(l.leg),{'font-size':23,'font-weight':'bold',fill:'#151c24'});
 const alphas=node('g',{'data-layer':'alpha-labels','pointer-events':'none'});svg.append(alphas);
 if(showAlphaLabels){for(const r of g.rungs){const e=text(alphas,(r.x1+r.x2)/2,r.y-.44,'α',{'font-size':19,'font-style':'italic',fill:s.rung_color});e.append(node('tspan',{'baseline-shift':'sub','font-size':12},String(r.alpha_index)));}}
 const faces=node('g',{'data-layer':'face-labels','pointer-events':'none'});svg.append(faces);
 if(showFaces&&g.face_labels_supplied){
  g.rungs.forEach((r,i)=>text(faces,(r.x1+r.x2)/2,r.y+.34,`(${g.face_labels[i].join(',')})`,{'font-size':16,'font-weight':'bold',fill:'darkred'}));
  if(g.face_labels.length){text(faces,(n-1)/2,g.bottom_y-(showTrips?.98:.24),`(${g.face_labels.at(-1).join(',')})`,{'font-size':16,'font-weight':'bold','font-style':'italic',fill:'darkred','data-anchor':'true'});}
 }
 return svg;
}

export function serializeSVG(svg,metadata={}){
 const clone=svg.cloneNode(true);
 clone.setAttribute('xmlns',NS);
 // Remove button semantics from an exported, non-interactive image.
 clone.setAttribute('role','img');clone.querySelectorAll('[tabindex]').forEach(e=>{e.removeAttribute('tabindex');e.removeAttribute('role');e.removeAttribute('aria-pressed');});
 const meta=node('metadata',{},JSON.stringify(metadata));clone.insertBefore(meta,clone.firstChild);
 return '<?xml version="1.0" encoding="UTF-8"?>\n'+new XMLSerializer().serializeToString(clone);
}
