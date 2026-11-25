import {color,esc,parseState,encodeState,neighbors,positions,formatNumber,defaultWeights,validateFamily,checkedJSON} from './ui-utils.mjs';

import {renderPlabic,serializeSVG} from './plabic-svg.mjs';

const $=id=>document.getElementById(id);
const ROOT=new URL('./',import.meta.url);
const PLOT_IDS=['psw','matrix','adjacency'];
const plotConfig={responsive:true,displaylogo:false,modeBarButtonsToRemove:['lasso2d','select2d'],toImageButtonOptions:{format:'svg',filename:'m2-tile-atlas'}};
let plabicCatalog=null,plabicFamily=null,plabicCache=new Map();
let catalog=null,config=null,family=null,detail=null,serial=0,worker=null,workerReady=false,requestId=0;
let requestedWeights=null,backend='snapshot',pending=new Map(),cache=new Map(),paintSerial=0;
let state={n:6,k:2,tile:12,trips:true,labels:true,layout:'source',trip:0,faces:true,bridgeLabels:true,weights:null};
const bootState=parseState(location.hash);
if(!bootState.error){state={...state,...bootState};requestedWeights=bootState.weights;state.weights=null;}
const message=(text)=>{$('message').textContent=text||'';$('message').hidden=!text;};
const activity=text=>{$('activity').textContent=text;};
const runtime=text=>{$('runtime-status').textContent=text;};
const familyKey=()=>`${state.n}_${state.k}`;
const title=()=>`A(${state.n},${state.k},2)`;
function setOptions(el,opts,value){el.replaceChildren(...opts.map(([v,text])=>new Option(text,String(v))));el.value=String(value);el.disabled=false;}
function recordFor(key){return catalog.families.find(f=>f.key===key);}
function saveLink(){try{history.replaceState(null,'',encodeState(state));}catch{/* read-only embeds may disable history */}}
function controls(){
 const ks=[...new Set(catalog.families.map(f=>f.k))].sort((a,b)=>a-b);
 setOptions($('rank'),ks.map(k=>[k,`k = ${k}`]),state.k);
 const ns=catalog.families.filter(f=>f.k===state.k).map(f=>f.n);
 setOptions($('size'),ns.map(n=>[n,`n = ${n}`]),state.n);
 setOptions($('tile'),family.tiles.map((_,i)=>[i,`${i+1} / ${family.tiles.length}`]),state.tile);
 setOptions($('trip'),[[0,'All'],...Array.from({length:state.n},(_,i)=>[i+1,`B${i+1} → B${detail.permutation[i]}`])],state.trip);
 $('faces').checked=state.faces;$('bridge-labels').checked=state.bridgeLabels;
 $('trips').checked=state.trips;$('labels').checked=state.labels;$('layout').value=state.layout;
 $('prev').disabled=state.tile===0;$('next').disabled=state.tile===family.tiles.length-1;
 for(const id of ['example','share','export'])$(id).disabled=false;
 $('apply').disabled=!workerReady;$('sample').disabled=!workerReady;$('gauge').disabled=!workerReady;
}
function baseLayout(height){return {height,margin:{l:28,r:23,t:15,b:20},paper_bgcolor:'#ffffff',plot_bgcolor:'#e8eef7',font:{family:'Arial, sans-serif',color:'#304b72',size:12},showlegend:false,hovermode:'closest'};}
function selectedTrips(){return state.trips?detail.psw_graph.trips.filter(t=>!state.trip||t.start===state.trip):[];}
function graphNodeMap(g){return new Map(g.nodes.map(n=>[n.id,n]));}
async function drawPSW(){
 const nodes=graphNodeMap(detail.psw_graph), xy=Array.from({length:state.n},(_,i)=>[nodes.get(`B${i+1}`).x,nodes.get(`B${i+1}`).y]);
 // Unused corners have shortened lollipops in the standard-form graph; the
 // source atlas itself always places the polygon vertices on the unit circle.
 for(let i=0;i<state.n;i++){const a=Math.PI/2-2*Math.PI*i/state.n;xy[i]=[Math.cos(a),Math.sin(a)];}
 const traces=[];const outline=[...xy,xy[0]];
 traces.push({x:outline.map(p=>p[0]),y:outline.map(p=>p[1]),mode:'lines',line:{color:'#949da9',width:1.6},hoverinfo:'skip'});
 detail.blacks.forEach((tri,r)=>{const ps=tri.map(v=>xy[v-1]);ps.push(ps[0]);traces.push({x:ps.map(p=>p[0]),y:ps.map(p=>p[1]),mode:'lines',fill:'toself',fillcolor:'rgba(80,80,80,.36)',line:{color:'#5e6470',width:1.1},hoverinfo:'skip'});});
 const wx=[],wy=[],labels=[];
 detail.blacks.forEach((tri,r)=>{const w=nodes.get(`W${r+1}`);tri.forEach((v,c)=>{const b=xy[v-1];traces.push({x:[w.x,b[0]],y:[w.y,b[1]],mode:'lines',line:{color:'#c82d2c',width:2},hoverinfo:'skip'});if(state.labels){wx.push(.60*w.x+.40*b[0]);wy.push(.60*w.y+.40*b[1]);const sign=c===0?1:detail.signs[r][c-1];labels.push(`${sign<0?'−':''}${['α','β','γ'][c]}<sub>${r+1}</sub>`);}});});
 if(state.labels)traces.push({x:wx,y:wy,mode:'text',text:labels,textfont:{size:11,color:'#9c2828'},hoverinfo:'skip'});
 const annotations=[];
 for(const t of selectedTrips()){if(t.start===t.end)continue;const a=xy[t.start-1],b=xy[t.end-1];annotations.push({x:b[0],y:b[1],ax:a[0],ay:a[1],xref:'x',yref:'y',axref:'x',ayref:'y',showarrow:true,arrowhead:2,arrowwidth:state.trip?2.6:1.15,arrowcolor:currentGeometry()?.strands[t.start-1]?.color||color(t.start-1),opacity:state.trip?.94:.68,standoff:7,startstandoff:7});}
 traces.push({x:xy.map(p=>p[0]),y:xy.map(p=>p[1]),mode:'markers',marker:{size:10,color:'#19212c'},text:xy.map((_,i)=>`B${i+1}`),hoverinfo:'text'});
 traces.push({x:xy.map(p=>p[0]*1.13),y:xy.map(p=>p[1]*1.13),mode:'text',text:xy.map((_,i)=>`B<sub>${i+1}</sub>`),textfont:{size:11},hoverinfo:'skip'});
 const ws=detail.blacks.map((_,r)=>nodes.get(`W${r+1}`));
 traces.push({x:ws.map(p=>p.x),y:ws.map(p=>p.y),mode:'markers+text',marker:{size:14,color:'#fff',line:{color:'#263448',width:1.4}},text:ws.map((_,r)=>`W${r+1}`),textfont:{size:8,color:'#293b55'},textposition:'middle center',hovertext:detail.blacks.map((t,r)=>`W${r+1}: (${t.join(', ')})`),hoverinfo:'text'});
 const layout={...baseLayout($('psw').clientHeight),annotations,uirevision:`psw-${familyKey()}`,xaxis:{visible:false,range:[-1.32,1.32]},yaxis:{visible:false,range:[-1.26,1.26],scaleanchor:'x'}};
 await Plotly.react('psw',traces,layout,plotConfig);
}
async function drawMatrix(){
 const z=detail.matrix.map(r=>r.map(Math.sign));
 const labels=detail.matrix.map(r=>r.map(()=>''));
 detail.blacks.forEach((tri,r)=>tri.forEach((v,c)=>{const sign=c===0?1:detail.signs[r][c-1];labels[r][v-1]=`${c===0?'':sign<0?'−':'+'}${['α','β','γ'][c]}<sub>${r+1}</sub>${backend==='python'&&detail.weights.some(row=>row.some(x=>x!=='1'))?'<br><span style="font-size:10px">'+esc(detail.matrix_exact[r][v-1])+'</span>':''}`;}));
 const layout={...baseLayout($('matrix').clientHeight),margin:{l:55,r:22,t:38,b:23},uirevision:`matrix-${familyKey()}`,xaxis:{side:'top',tickmode:'array',tickvals:Array.from({length:state.n},(_,i)=>String(i+1)),title:{text:'boundary vertex / column',font:{size:11},standoff:7}},yaxis:{autorange:'reversed',tickmode:'array',tickvals:Array.from({length:state.k},(_,i)=>`W${i+1}`)}};
 await Plotly.react('matrix',[{type:'heatmap',z,x:Array.from({length:state.n},(_,i)=>String(i+1)),y:Array.from({length:state.k},(_,i)=>`W${i+1}`),text:labels,texttemplate:'%{text}',textfont:{size:13},customdata:detail.matrix_exact,hovertemplate:'M[%{y}, %{x}] = %{customdata}<extra></extra>',zmin:-1,zmax:1,colorscale:[[0,'#d56b70'],[.5,'#f4f5f7'],[1,'#7090d3']],showscale:false,xgap:1.6,ygap:1.6}],layout,plotConfig);
}
async function drawAdjacency(){
 const ps=positions(family,state.layout),xs=[],ys=[];
 family.edges.forEach(([a,b])=>{xs.push(ps[a][0],ps[b][0],null);ys.push(ps[a][1],ps[b][1],null);});
 const nbrs=new Set(neighbors(family.edges,state.tile));const labelled=family.tiles.length<=60;
 const layout={...baseLayout($('adjacency').clientHeight),margin:{l:16,r:16,t:12,b:14},uirevision:`adj-${familyKey()}-${state.layout}`,clickmode:'event',xaxis:{visible:false,range:[-1.2,1.2]},yaxis:{visible:false,range:[-1.2,1.2],scaleanchor:'x'}};
 await Plotly.react('adjacency',[{x:xs,y:ys,mode:'lines',line:{color:'#9baabe',width:family.edges.length>600?.65:1},hoverinfo:'skip'},{x:ps.map(p=>p[0]),y:ps.map(p=>p[1]),mode:labelled?'markers+text':'markers',text:labelled?ps.map((_,i)=>String(i+1)):undefined,textposition:'top center',textfont:{size:9,color:'#33445e'},marker:{size:ps.map((_,i)=>i===state.tile?15:nbrs.has(i)?10:family.tiles.length>120?6:9),color:ps.map((_,i)=>i===state.tile?'#202936':color(i)),opacity:ps.map((_,i)=>i===state.tile||nbrs.has(i)?1:.7),line:{color:'white',width:1}},customdata:ps.map((_,i)=>i),hovertext:family.tiles.map((t,i)=>`Tile ${i+1}<br>Black triangles: ${t.blacks.map(t=>'('+t.join(',')+')').join(', ')}`),hoverinfo:'text'}],layout,plotConfig);
 const graph=$('adjacency');graph.removeAllListeners?.('plotly_click');graph.on('plotly_click',e=>{const i=e.points?.[0]?.customdata;if(Number.isInteger(i)&&i>=0&&i<family.tiles.length)chooseTile(i);});
}
function currentGeometry(){return detail?.plabic_geometry||plabicFamily?.tiles[state.tile]||null;}
async function drawLadder(){
 const g=currentGeometry();const host=$('ladder');
 if(!g){host.replaceChildren();const p=document.createElement('p');p.className='caption';p.textContent='The plabic geometry is unavailable. Reload the page to try again.';host.append(p);$('export-svg').disabled=true;return;}
 const provenance=detail?.plabic_geometry?'python':'snapshot';
 const svg=renderPlabic(g,{showTrips:state.trips,showFaces:state.faces,showAlphaLabels:state.bridgeLabels,selectedTrip:state.trip,
  title:`${title()}, tile ${state.tile+1}: plabic ladder`,mode:provenance,
  onTrip:async start=>{state.trip=start;state.trips=true;await paint({weights:false});saveLink();if(start)host.querySelector(`[data-trip-start="${start}"]`)?.focus({preventScroll:true});}});
 host.replaceChildren(svg);$('export-svg').disabled=false;
 $('plabic-status').textContent=provenance==='python'?'Strand paths · computed in Python':'Strand paths · bundled snapshot';
 $('strand-status').textContent=state.trip?`Selected strand ${state.trip} → ${g.permutation[state.trip-1]}.`:'Colored bottom numbers identify the starting strand at its exit.';
}
async function plabicFor(record){
 if(plabicCache.has(record.key))return plabicCache.get(record.key);
 const r=plabicCatalog.families.find(f=>f.key===record.key);if(!r)throw Error('Missing plabic family record.');
 const g=await checkedJSON(new URL(r.url,ROOT),r.sha256);
 if(g.family!==record.key||g.atlas_sha256!==record.sha256||g.tiles.length!==record.tile_count)throw Error('Plabic data do not match this atlas.');
 plabicCache.set(record.key,g);return g;
}
function exportSVG(){
 const svg=$('ladder').querySelector('svg');if(!svg)return;
 const content=serializeSVG(svg,{family:familyKey(),tile:state.tile+1,renderer:currentGeometry().renderer,permutation:detail.permutation,geometry:detail?.plabic_geometry?'Python result':'bundled snapshot',view:{trips:state.trips,faces:state.faces,alpha_labels:state.bridgeLabels,selected_trip:state.trip}});
 const url=URL.createObjectURL(new Blob([content],{type:'image/svg+xml;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`m2-${familyKey()}-tile-${state.tile+1}-plabic.svg`;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);activity('Exported the current vector plabic view, including selected strand and label settings.');
}

function paintText(){
 $('psw-title').textContent=`Bicolored triangulation → Ĝ(T) · tile ${state.tile+1}`;
 $('psw-subtitle').textContent=`Black triangles: ${detail.blacks.map(t=>'('+t.join(', ')+')').join(', ')} · n = ${state.n}`;
 $('matrix-title').innerHTML=`Signed tile matrix M<sub>T</sub> ∈ Gr≥0(${state.k},${state.n})`;
 $('matrix-subtitle').textContent=`${3*state.k} edge weights; positive row gauge leaves 2k = ${2*state.k} coordinates. Rows = white vertices; columns = boundary vertices.`;
 const unit=detail.weights.every(row=>row.every(v=>v==='1'));
 $('matrix-tag').textContent=unit?'Unit weights':'Exact rational inputs';
 $('minor-summary').textContent=`${detail.positive_minors} positive · ${detail.zero_minors} zero · ${detail.negative_minors} negative minors`;
 $('adj-subtitle').textContent=`${family.tiles.length} triangle-tiles · ${family.edges.length} edges · selected node in black, neighbors emphasized`;
 $('cell-title').textContent=`Tile ${state.tile+1} · ${title()}`;$('dim-tag').textContent=`dimension ${detail.dimension}`;
 const sub=['₁','₂','₃','₄'];
 const rows=detail.blacks.map((t,r)=>`<div class="row-formula"><strong>W${r+1}</strong> <span class="mono">α${sub[r]}e${t[0]} ${detail.signs[r][0]>0?'+':'−'} β${sub[r]}e${t[1]} ${detail.signs[r][1]>0?'+':'−'} γ${sub[r]}e${t[2]}</span></div>`).join('');
 $('details').innerHTML=`<div class="detail-line"><strong>Black triangles:</strong> ${detail.blacks.map(t=>'('+t.join(', ')+')').join(', ')}</div><div class="detail-line"><strong>Decorated permutation π:</strong> <span class="mono">${detail.permutation.map((p,i)=>p+(detail.coloops.includes(i+1)?'°':'')).join(', ')}</span></div><div class="detail-line"><strong>Affine window:</strong> <span class="mono">[${detail.affine_window.join(', ')}]</span></div><div class="detail-line"><strong>Loops:</strong> ${detail.loops.join(', ')||'none'} · <strong>Coloops:</strong> ${detail.coloops.join(', ')||'none'}</div><div class="detail-line"><strong>Bridge pairs:</strong> <span class="mono">${detail.bridge_chain.pairs.map(p=>'('+p.join(',')+')').join(' ')}</span></div>${rows}`;
 $('neighbor-buttons').replaceChildren(...neighbors(family.edges,state.tile).map(i=>{const b=document.createElement('button');b.textContent=`Tile ${i+1}`;b.addEventListener('click',()=>chooseTile(i));return b;}));
 const c=detail.certificate;
 $('certificate').innerHTML=`<h3>Exact positive-weight check</h3><div>${c.positive_terms} positive determinant monomials · ${c.negative_terms} negative monomials</div><div>${c.nonzero_polynomials} nonzero minor polynomials · ${c.zero_polynomials} identically zero</div><p>Each nonzero minor is a sum of positive monomials in the independent edge weights. This finite expansion certifies nonnegativity throughout <em>this</em> signed sparse matrix family—not only at α = β = γ = 1.</p><p><strong>Row-gauge ratios (β/α, γ/α):</strong><br>${detail.row_gauge_ratios.map((r,i)=>`W${i+1}: (${r.map(esc).join(', ')})`).join('<br>')}</p>`;
 $('necklace').innerHTML=detail.necklace.map((b,i)=>`<span>I${i+1} = {${b.join(',')}}</span>`).join('');
 const names={necklace_round_trip:'Necklace ↔ affine permutation',psw_trip_agreement:'PSW trips ↔ matrix permutation',ladder_trip_agreement:'Bridge trips ↔ matrix permutation',bridge_count_2k:'Bridge count = 2k'};
 $('checks').innerHTML=Object.entries(detail.checks).map(([k,v])=>`<div class="check-item ${v?'':'fail'}">${v?'✓':'✗'} ${esc(names[k]||k)}</div>`).join('');
 $('calculation-mode').textContent=backend==='python'?'Computed in Python':'Precomputed unit weights';
 $('atlas-status').textContent=`${title()} · tile ${state.tile+1} / ${family.tiles.length} · ${catalog.tile_count} tiles available`;
 paintMinors();
}
function paintMinors(){if(!detail)return;$('minors').innerHTML=detail.minors.filter(m=>!$('nonzero').checked||m.sign!==0).map(m=>`<tr><td class="mono">${m.columns.join(', ')}</td><td class="mono">${esc(m.exact)}</td><td>${formatNumber(m.normalized)}</td></tr>`).join('');}
function paintWeights(){
 $('weight-inputs').replaceChildren(...detail.weights.map((row,r)=>{const d=document.createElement('div');d.className='weight-row';const s=document.createElement('span');s.textContent=`W${r+1}`;d.append(s);row.forEach((value,c)=>{const l=document.createElement('label');l.append(document.createTextNode(`${['α','β','γ'][c]}${r+1}`));const i=document.createElement('input');i.value=value;i.type='text';i.inputMode='decimal';i.maxLength=40;i.id=`weight-${r}-${c}`;i.setAttribute('aria-label',`${['alpha','beta','gamma'][c]} ${r+1}`);i.addEventListener('keydown',e=>{if(e.key==='Enter'&&workerReady)applyWeights();});l.append(i);d.append(l);});return d;}));
}
async function paint({weights=true}={}){
 const stamp=++paintSerial;paintText();controls();if(weights)paintWeights();
 await Promise.all([drawPSW(),drawMatrix(),drawAdjacency(),drawLadder()]);
 if(stamp!==paintSerial)return;
 document.body.dataset.ready='true';document.body.dataset.family=familyKey();document.body.dataset.tile=String(state.tile);document.body.dataset.backend=backend;
}
async function loadFamily(n,k,tile=0){
 const my=++serial;message('');$('atlas-status').textContent=`Loading A(${n},${k},2)…`;
 const record=recordFor(`${n}_${k}`);if(!record)throw Error('This rank/size pair is not in the source atlas.');
 let f=cache.get(record.key);
 if(!f){f=validateFamily(await checkedJSON(new URL(record.url,ROOT),record.sha256),record);cache.set(record.key,f);}
 const pg=await plabicFor(record);
 if(my!==serial)return;
 plabicFamily=pg;family=f;state.n=n;state.k=k;state.tile=Math.min(Math.max(0,tile),f.tiles.length-1);state.trip=Math.min(state.trip,n);
 state.weights=null;detail=structuredClone(f.tiles[state.tile].unit);backend='snapshot';
 await paint();saveLink();
 if(workerReady){if(requestedWeights){const w=requestedWeights;requestedWeights=null;await calculate(w);}else await calculate(defaultWeights(k),false);}
 else if(requestedWeights){$('weight-note').textContent='The state link requests non-unit weights. Showing the unit-weight atlas until Python is ready.';}
}
function reportLoadError(error){message(`Atlas change failed: ${error.message}`);if(family&&detail){controls();$('atlas-status').textContent=`${title()} · tile ${state.tile+1} / ${family.tiles.length} · previous tile retained`;}}
async function chooseTile(index){
 if(!family||index===state.tile)return;
 const my=++serial;requestedWeights=null;state.tile=index;state.weights=null;detail=structuredClone(family.tiles[index].unit);backend='snapshot';message('');
 await paint();saveLink();if(my===serial&&workerReady)await calculate(defaultWeights(state.k),false);
}
function failWorker(error){workerReady=false;runtime(`Python unavailable · unit-weight atlas remains usable.`);$('retry').hidden=false;$('retry').disabled=false;for(const id of ['apply','sample','gauge'])$(id).disabled=true;for(const [id,p] of pending){clearTimeout(p.timer);p.reject(error);}pending.clear();if(worker){worker.terminate();worker=null;}activity(`Python runtime: ${error.message}. See Run & deploy for a local-runtime option.`);}
function request(type,payload){return new Promise((resolve,reject)=>{if(!worker){reject(Error('Python worker is not running.'));return;}const id=++requestId;const timer=setTimeout(()=>{pending.delete(id);const e=Error('Python request timed out. Retry to restart the worker.');reject(e);failWorker(e);},config.requestTimeoutMs||90000);pending.set(id,{resolve,reject,timer});worker.postMessage(type==='boot'?{type,id,baseURL:ROOT.href}:{type,id,payload});});}
async function startPython(){
 $('retry').hidden=true;
 if(worker)worker.terminate();
 worker=new Worker(new URL('worker.mjs',ROOT),{type:'module'});
 worker.addEventListener('message',event=>{const d=event.data;if(d.type==='progress'){runtime(d.message);return;}if(d.type==='log'){console.warn(d.message);return;}const p=pending.get(d.id);if(!p)return;pending.delete(d.id);clearTimeout(p.timer);if(d.type==='error'||d.ok===false){p.reject(Error(d.error?.message||'Python computation failed.'));}else p.resolve(d.result);});
 worker.addEventListener('error',event=>failWorker(Error(event.message||'Python worker failed.')));
 try{
  const r=await request('boot');workerReady=true;document.body.dataset.pythonPlatform=r.platform;runtime(`Pyodide ${r.version} · Python ${r.python} · local computation`);
  controls();if(detail){const w=requestedWeights||detail.weights;requestedWeights=null;await calculate(w,false);}activity('Python startup fixture passed. No matrix inputs are sent to a server.');
 }catch(error){failWorker(error);}
}
async function calculate(weights,announce=true){
 if(!workerReady)return;
 const my=++serial, key=familyKey(),tile=state.tile;$('apply').disabled=true;
 if(announce)runtime('Computing exact minors and cross-representation checks…');
 try{
  const r=await request('request',{action:'inspect',family:key,tile,weights});
  if(my!==serial||key!==familyKey()||tile!==state.tile)return;
  detail=r;state.weights=r.weights;backend='python';message('');await paint();saveLink();
  runtime(`Python ready · exact rational arithmetic · computed locally`);$('weight-note').textContent='Showing the applied Python result. Edit any positive weight, then recompute. The inputs are exact decimals or fractions.';
 }catch(error){if(my===serial){message(`Weights were not applied: ${error.message}`);if(workerReady)runtime('Python ready · previous result retained');}}
 finally{if(my===serial)$('apply').disabled=!workerReady;}
}
function readWeights(){return Array.from({length:state.k},(_,r)=>Array.from({length:3},(_,c)=>$(`weight-${r}-${c}`).value.trim()));}
async function applyWeights(){await calculate(readWeights());}
function download(){
 const output={schema_version:1,version:'0.2.0',family:familyKey(),tile_number:state.tile+1,calculation:backend==='python'?'live Python result':'precomputed unit-weight snapshot',atlas_neighbors:neighbors(family.edges,state.tile).map(i=>i+1),edge_rule:family.edge_rule,detail:{...detail,plabic_geometry:currentGeometry()}};
 const blob=new Blob([JSON.stringify(output,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`m2-${familyKey()}-tile-${state.tile+1}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);activity('Exported the displayed state, exact minors, bridge ladder and provenance.');
}
function bind(){
 $('faces').addEventListener('change',async()=>{state.faces=$('faces').checked;await drawLadder();saveLink();});
 $('bridge-labels').addEventListener('change',async()=>{state.bridgeLabels=$('bridge-labels').checked;await drawLadder();saveLink();});
 $('export-svg').addEventListener('click',exportSVG);
 $('rank').addEventListener('change',()=>{const k=Number($('rank').value);const ns=catalog.families.filter(f=>f.k===k).map(f=>f.n);requestedWeights=null;loadFamily(ns.includes(state.n)?state.n:ns[0],k).catch(reportLoadError);});
 $('size').addEventListener('change',()=>{requestedWeights=null;loadFamily(Number($('size').value),state.k).catch(reportLoadError);});
 $('tile').addEventListener('change',()=>chooseTile(Number($('tile').value)));
 $('prev').addEventListener('click',()=>{if(state.tile>0)chooseTile(state.tile-1);});$('next').addEventListener('click',()=>{if(state.tile+1<family.tiles.length)chooseTile(state.tile+1);});
 $('trips').addEventListener('change',async()=>{state.trips=$('trips').checked;await paint({weights:false});saveLink();});
 $('labels').addEventListener('change',async()=>{state.labels=$('labels').checked;await paint({weights:false});saveLink();});
 $('trip').addEventListener('change',async()=>{state.trip=Number($('trip').value);state.trips=true;await paint({weights:false});saveLink();});
 $('layout').addEventListener('change',async()=>{state.layout=$('layout').value;await drawAdjacency();saveLink();});
 $('nonzero').addEventListener('change',paintMinors);
 $('example').addEventListener('click',()=>{requestedWeights=null;state.trips=true;state.labels=true;state.trip=0;state.layout='source';loadFamily(6,2,12).catch(reportLoadError);});
 $('retry').addEventListener('click',()=>startPython());$('apply').addEventListener('click',applyWeights);
 $('unit').addEventListener('click',async()=>{if(workerReady){await calculate(defaultWeights(state.k));}else{++serial;state.weights=null;detail=structuredClone(family.tiles[state.tile].unit);backend='snapshot';requestedWeights=null;await paint();saveLink();}});
 $('sample').addEventListener('click',()=>calculate(Array.from({length:state.k},(_,r)=>['1',String(r+2),`${r+2}/${r+3}`])));
 $('gauge').addEventListener('click',()=>{const w=detail.weights.map(r=>r.slice());w[0]=w[0].map(s=>{const [a,b='1']=s.split('/');return `${BigInt(a)*2n}/${b}`;});calculate(w);});
 $('share').addEventListener('click',async()=>{const url=new URL(location.href);url.hash=encodeState(state);try{await navigator.clipboard.writeText(url.href);activity('State link copied.');}catch{activity('Copy the state link from your browser address bar.');saveLink();}});
 $('export').addEventListener('click',download);
 window.addEventListener('hashchange',async()=>{const s=parseState(location.hash);if(s.error){message(s.error);return;}const r=recordFor(`${s.n}_${s.k}`);if(!r||s.tile>=r.tile_count){message('State link is outside the atlas.');return;}const before={...state};state={...state,trips:s.trips,labels:s.labels,layout:s.layout,trip:s.trip,faces:s.faces,bridgeLabels:s.bridgeLabels};requestedWeights=s.weights;try{await loadFamily(s.n,s.k,s.tile);}catch(error){state=before;requestedWeights=null;reportLoadError(error);}});
 let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>PLOT_IDS.forEach(id=>{if($(id).data)Plotly.Plots.resize(id);}),150);});
}
async function main(){
 if(location.protocol==='file:'){message('Open this directory through a static HTTP server: python -m http.server 8000. Direct file:// access blocks module workers and atlas fetches.');return;}
 try{
  if(!globalThis.Plotly)throw Error('The bundled Plotly library did not load. Preserve the vendor/ directory.');
  [catalog,config,plabicCatalog]=await Promise.all([checkedJSON(new URL('data/catalog.json',ROOT)),checkedJSON(new URL('runtime-config.json',ROOT)),checkedJSON(new URL('data/plabic/catalog.json',ROOT))]);
  let note=bootState.error;
  const r=recordFor(familyKey());if(!r||state.tile>=r.tile_count){note=note||'That state is outside the atlas; showing the example.';state={...state,n:6,k:2,tile:12,weights:null};requestedWeights=null;}
  bind();await loadFamily(state.n,state.k,state.tile);if(note)message(note);
  if(config.movesViewerURL){const url=new URL(config.movesViewerURL,ROOT);if(['http:','https:'].includes(url.protocol)){$('moves-link').href=url.href;$('moves-link').hidden=false;}}
  const mode=new URLSearchParams(location.search).get('mode');
  if(mode==='snapshot'){runtime('Snapshot mode · bundled unit-weight atlas · no Python started');$('retry').hidden=false;}else startPython();
 }catch(error){message(`Could not start the atlas: ${error.message}`);runtime('Initialization failed.');}
}
main();
