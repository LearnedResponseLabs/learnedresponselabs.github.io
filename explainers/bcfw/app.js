import {MODEL, SCHEMA, parseState, stateURL, graphPositions, escapeHTML as esc} from './ui-utils.mjs';
const $ = id => document.getElementById(id);
const baseURL = new URL('./', location.href);
const C = {ink:'#25475b', blue:'#9eb7d2', selected:'#efb43e', near:'#da947c',edge:'#a4b3c3',teal:'#287183'};
const palette = ['#cf474c','#218a48','#2579be','#8d61b2','#d49328','#259b9b','#a86643','#6c7787'];
const plotConfig={responsive:true,displaylogo:false,scrollZoom:false,modeBarButtonsToRemove:['select2d','lasso2d'],toImageButtonOptions:{format:'svg'}};
const ax={visible:false,zeroline:false,showgrid:false,fixedrange:false};
const margin={l:24,r:24,t:16,b:22};
const baseLayout={paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:'rgba(0,0,0,0)',font:{family:'system-ui, sans-serif',size:11,color:C.ink},margin,showlegend:false,hovermode:'closest'};
let catalog, data, config={requestTimeoutMs:90000};
let state={family:'8_3',tile:0,path:[],cap:96}, result=null, redo=[];
let worker=null, ready=false, pending=null, requestId=0, generation=0, familyGeneration=0, bootTimer=null;
let booting=false, browsing=false;
const familyCache=new Map(), positionsCache=new Map();
const status = text => {$('status').textContent=text;};
const showError = text => {$('error').textContent=text;$('error').hidden=false;};
const clearError = () => {$('error').hidden=true;$('error').textContent='';};
function badge(text, mode='') {$('runtime-badge').textContent=text;$('runtime-badge').dataset.mode=mode;}
function shape(t) {return !t.type_finite ? 'diamond' : t.type_kind==='E' ? 'star' : t.type_kind==='D' ? 'square' : 'circle';}
function sameState(a,b){return a.family===b.family && a.tile===b.tile && a.cap===b.cap && JSON.stringify(a.path)===JSON.stringify(b.path);}
async function getJSON(path) {
  const r=await fetch(new URL(path,baseURL),{cache:'no-cache'});
  if(!r.ok) throw new Error(`Cannot load ${path}: HTTP ${r.status}`);
  return r.json();
}
function options(id, rows, value) {
  const e=$(id);e.replaceChildren(...rows.map(([v,label])=>{const o=document.createElement('option');o.value=v;o.textContent=label;return o;}));e.value=value;
}
function updateButtons() {
  const loaded=!!data, busy=!!pending||browsing;
  for(const id of ['family','tile','prev','next','share','export']) $(id).disabled=!loaded||busy;
  $('cap').disabled=!ready||busy;
  $('node').disabled=!ready||busy||!result;
  $('undo').disabled=!ready||busy||state.path.length===0;
  $('redo').disabled=!ready||busy||redo.length===0;
  $('reset').disabled=!ready||busy||state.path.length===0;
  $('cancel').hidden=!pending;
  for(const b of $('mutate-buttons').querySelectorAll('button')) b.disabled=!ready||busy;
  for(const b of $('neighbours').querySelectorAll('button')) b.disabled=busy;
}
function rewriteURL() {
  history.replaceState(null,'',stateURL(location.href,state));
}
function plot(id,traces,layout,click) {
  const node=$(id);
  const p=Plotly.react(node,traces,{...baseLayout,...layout},plotConfig);
  return p.then(()=>{
    if(node.removeAllListeners)node.removeAllListeners('plotly_click');
    if(click)node.on('plotly_click',e=>{const point=e.points?.find(p=>Number.isInteger(p.customdata));if(point)click(point.customdata);});
  });
}
function lines(edges, pos, color=C.edge) {
  const x=[],y=[];
  for(const [a,b] of edges){x.push(pos[a][0],pos[b][0],null);y.push(pos[a][1],pos[b][1],null);}
  return {x,y,type:'scatter',mode:'lines',line:{width:1,color},hoverinfo:'skip'};
}
async function drawFlip() {
  const selected=data.tiles[state.tile], neighbours=new Set(selected.neighbors),pos=data.tiles.map(t=>t.position);
  const sizes=data.tiles.map(t=>t.idx===state.tile?17:neighbours.has(t.idx)?11:8);
  $('family-counts').textContent=`${data.tiles.length} tiles · ${data.edges.length} flips`;
  await plot('graph',[lines(data.edges,pos),{x:pos.map(p=>p[0]),y:pos.map(p=>p[1]),customdata:data.tiles.map(t=>t.idx),
    type:'scatter',mode:'markers',marker:{size:sizes,symbol:data.tiles.map(shape),color:data.tiles.map(t=>t.idx===state.tile?C.selected:neighbours.has(t.idx)?C.near:C.blue),line:{width:.8,color:'white'}},
    text:data.tiles.map(t=>`Tile ${t.idx}<br>${esc(t.type_label)}<br>${t.neighbors.length} chord flips`),hovertemplate:'%{text}<extra></extra>'}],
    {xaxis:{...ax,range:[-1.2,1.2]},yaxis:{...ax,scaleanchor:'x',scaleratio:1,range:[-1.16,1.16]},uirevision:data.key}, idx=>chooseTile(idx));
  $('neighbours').replaceChildren(...selected.neighbors.map(i=>{const b=document.createElement('button');b.textContent=`Tile ${i}`;b.onclick=()=>chooseTile(i);return b;}));
  if(!selected.neighbors.length)$('neighbours').textContent='No one-chord neighbours.';
}
async function drawChord() {
  const d=data.tiles[state.tile].diagram, traces=[],annotations=[];
  for(let i=0;i<d.length;i++){
    const [a,b,c]=d[i],xl=a+.5,xr=c+.5,mid=(xl+xr)/2,h=.22+.13*(xr-xl),x=[],y=[];
    for(let j=0;j<=65;j++){const t=Math.PI*(1-j/65);x.push(mid+(xr-xl)/2*Math.cos(t));y.push(h*Math.sin(t));}
    traces.push({x,y,type:'scatter',mode:'lines',line:{color:palette[i],width:2},hoverinfo:'skip'});
    traces.push({x:[xr],y:[0],type:'scatter',mode:'markers',marker:{symbol:'triangle-down',size:9,color:palette[i]},hoverinfo:'skip'});
    annotations.push({x:mid,y:h+.07,text:`D<sub>${i+1}</sub>`,showarrow:false,font:{color:palette[i],size:12}});
  }
  const labels=Array.from({length:data.n},(_,i)=>i+1);
  traces.unshift({x:[.5,data.n+.5],y:[0,0],type:'scatter',mode:'lines',line:{color:'#555',width:1},hoverinfo:'skip'});
  traces.push({x:labels,y:labels.map(()=>0),mode:'markers+text',text:labels.map(String),textposition:'bottom center',marker:{symbol:'line-ns-open',size:7,color:'#666'},hoverinfo:'skip'});
  await plot('chord',traces,{xaxis:{...ax,range:[.4,data.n+.6]},yaxis:{...ax,range:[-.2,Math.max(...d.map(([a,b,c])=>.22+.13*(c-a)))+.23]},annotations,margin:{l:10,r:10,t:8,b:8}});
  $('selected-label').textContent=`A(${data.n},${data.k},4) · tile ${state.tile}`;
  $('chord-notation').textContent=d.map((c,i)=>`D${i+1} = (${c.join(', ')})`).join('   ');
}
function drawGeometry() {
  const t=data.tiles[state.tile],g=t.geometry;
  $('plabic-missing').hidden=!!t.plabic;$('plabic').hidden=!t.plabic;$('plabic-open').hidden=!t.plabic;
  if(t.plabic){
    const u=new URL(t.plabic,baseURL);if(u.origin!==location.origin)throw new Error('Plabic image must be a local exported asset.');
    $('plabic').src=u.href;$('plabic-open').href=u.href;
    $('plabic-provenance').textContent='Plabic graph of the selected cell. Quiver mutations leave this tile geometry fixed.';
  } else {$('plabic').removeAttribute('src');$('plabic-provenance').textContent='The realization image is unavailable for this tile.';}
  const rows=[['Ambient family',`A(${data.n},${data.k},4)`],['Tile',String(state.tile)],['Chord flips',String(t.neighbors.length)],['Domino seed type',t.type_label],
    ['Decorated permutation',g?.perm ? `(${g.perm.join(', ')})`:'Realization data unavailable'],
    ['Nonzero support',g?.n_bases ?? 'Not exported'],['Positive parameters',g?.n_params ?? 'Not exported']];
  $('tile-facts').replaceChildren(...rows.flatMap(([a,b])=>{const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=a;dd.textContent=b;return [dt,dd];}));
  $('support').textContent=g?.plabels ? (Array.isArray(g.plabels)?g.plabels.join(' · '):String(g.plabels)) : 'Realized support labels are unavailable for this tile.';
  $('cmatrix').textContent=g?.cmatrix ? (typeof g.cmatrix==='string'?g.cmatrix:JSON.stringify(g.cmatrix,null,2)):'Not exported.';
  $('certificate').textContent=t.certificate||'No type-check description available.';
}
async function drawQuiver() {
  const q=result.quiver,v=q.vertices,p=v.map(v=>[v.chord,4-'αβγδε'.indexOf(v.var)]),ann=[],bows=[];
  const blocked=(a,b)=>p.some(([x,y])=>{const dx=b[0]-a[0],dy=b[1]-a[1],s=((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy);return s>1e-9&&s<1-1e-9&&Math.abs((x-a[0])*dy-(y-a[1])*dx)<1e-9;});
  for(const a of q.arrows){
    const [x0,y0]=p[a.source],[x1,y1]=p[a.target];let ax=x0,ay=y0,lx=(x0+x1)/2,ly=(y0+y1)/2;
    if(blocked(p[a.source],p[a.target])){ // A straight line would run through another vertex and read as a chain of shorter arrows.
      const dx=x1-x0,dy=y1-y0,len=Math.hypot(dx,dy),cx=lx+.56*dy/len,cy=ly-.56*dx/len,at=t=>[(1-t)*(1-t)*x0+2*t*(1-t)*cx+t*t*x1,(1-t)*(1-t)*y0+2*t*(1-t)*cy+t*t*y1];
      const pts=Array.from({length:25},(_,i)=>at(i/24*.85));bows.push({x:pts.map(q=>q[0]),y:pts.map(q=>q[1]),mode:'lines',type:'scatter',line:{color:'#89949e',width:1.1},hoverinfo:'skip',showlegend:false});
      [ax,ay]=at(.85);[lx,ly]=at(.5);
    }
    ann.push({x:x1,y:y1,ax,ay,xref:'x',yref:'y',axref:'x',ayref:'y',text:'',showarrow:true,arrowhead:2,arrowsize:1,arrowwidth:1.1,
      arrowcolor:a.dotted?'#c18b43':'#89949e',standoff:13,startstandoff:ax===x0&&ay===y0?13:0,opacity:a.dotted?.6:.9});
    if(a.multiplicity>1)ann.push({x:lx+.055,y:ly+.07,text:String(a.multiplicity),showarrow:false,bgcolor:'white',borderpad:2,font:{size:10,color:'#77522c'}});
  }
  const mutated=new Set(q.mutated_slots);
  const h=v.map(v=>`${esc(v.label)}${v.mutable?' — mutable':' — frozen'}<br>${v.aliases.length>1?'These two names denote one variable.<br>':''}${mutated.has(v.id)?'This position has mutated; its expression is not computed.':'Initial domino-variable names.'}`);
  await plot('quiver',[...bows,{x:p.map(p=>p[0]),y:p.map(p=>p[1]),customdata:v.map(v=>v.id),mode:'markers+text',type:'scatter',
    text:v.map(v=>esc(v.label)),textposition:'middle center',textfont:{size:10,color:'#203947'},
    marker:{size:v.map(v=>v.aliases.length>1?36:25),color:v.map(v=>v.mutable?C.selected:C.blue),line:{width:1,color:'white'}},hovertext:h,hovertemplate:'%{hovertext}<extra></extra>'}],
    {xaxis:{range:[.25,data.k+.7],tickvals:Array.from({length:data.k},(_,i)=>i+1),title:{text:'chord Dᵢ',standoff:6},zeroline:false,gridcolor:'#ebf0f5',fixedrange:true},
     yaxis:{range:[-.4,4.45],tickvals:[4,3,2,1,0],ticktext:['α','β','γ','δ','ε'],showgrid:false,zeroline:false,fixedrange:true},annotations:ann,margin:{l:36,r:26,t:14,b:36}},id=>mutateSlot(id));
  $('mutables').textContent=`${q.mutable.length} distinct mutable · ${q.raw_mutable_count} mutable names · ${q.vertices.length} total variables`;
  $('path').textContent=state.path.length ? `ΣD → ${state.path.map(x=>x.replace('_','')).join(' → ')}   (${state.path.length} moves)`:'ΣD · initial seed';
  $('mutate-buttons').replaceChildren(...q.mutable.map(id=>{const v=q.vertices[id],b=document.createElement('button');b.textContent=v.label;b.title=`Mutate the position initially named ${v.label}`;b.dataset.vertex=v.key;b.onclick=()=>mutateSlot(id);return b;}));
  if(!q.mutable.length)$('mutate-buttons').textContent='This seed has no mutable slots.';
}
async function drawExchange() {
  const g=result.exchange,t=data.tiles[state.tile],mode=$('layout').value;
  const rank=result.quiver.mutable.length;
  const cmatrix=result.c_matrix??Array.from({length:rank},(_,i)=>Array.from({length:rank},(_,j)=>Number(i===j)));
  $('search-cmatrix').textContent=rank?cmatrix.map(row=>`[${row.join(', ')}]`).join('\n'):'No mutable variables.';
  const key=`${state.family}:${state.tile}:${g.cap}:${g.nodes.length}:${mode}`;
  if(!positionsCache.has(key)){if(positionsCache.size>40)positionsCache.clear();positionsCache.set(key,graphPositions(g,mode));}
  const p=positionsCache.get(key),edges=[...new Map(g.edges.map(([a,b])=>[`${a}:${b}`,[a,b]])).values()];
  const traces=[lines(edges,p,'#b6c2ce'),{x:p.map(v=>v[0]),y:p.map(v=>v[1]),customdata:g.nodes.map(n=>n.id),type:'scatter',mode:'markers',
    marker:{size:g.nodes.map(n=>n.id===g.current?14:8),color:g.nodes.map(n=>n.depth),colorscale:[[0,'#8fc3cb'],[1,'#244d6a']],line:{width:.6,color:'white'}},
    text:g.nodes.map(n=>`Seed state ${n.id}<br>${n.path.length} recorded moves${n.id===g.current?' · current':''}<br>${esc(n.path.join(' → ')||'ΣD')}`),hovertemplate:'%{text}<extra></extra>'}];
  traces.push({x:[p[0][0]],y:[p[0][1]],customdata:[0],mode:'markers',type:'scatter',marker:{size:19,symbol:'star',color:g.current===0?C.selected:'#e5eaf1',line:{color:'#b27e22',width:1.3}},hovertemplate:'Initial seed state<extra></extra>'});
  if(g.current!=null && g.current!==0)traces.push({x:[p[g.current][0]],y:[p[g.current][1]],customdata:[g.current],mode:'markers',type:'scatter',marker:{size:15,color:C.selected,line:{color:'white',width:1.2}},hovertemplate:`Current seed state ${g.current}<extra></extra>`});
  await plot('exchange',traces,{xaxis:{...ax,range:[-1.17,1.17]},yaxis:{...ax,scaleanchor:'x',scaleratio:1,range:[-1.17,1.17]},margin:{l:10,r:10,t:12,b:8},uirevision:key},node=>jump(node));
  $('type-label').textContent=`Domino seed type: ${t.type_label}${t.cluster_count!=null?` · ${t.cluster_count} clusters by type formula`:' · not of finite type'}`;
  $('exchange-status').textContent=`${result.preview?'Initial preview · ':''}${g.nodes.length} C-matrix seed states · cap ${g.cap} · ${edges.length} neighbour pairs${g.truncated?' · search stopped at the cap or matrix-size limit':' · search complete'}${g.count_matches===true?' · matches the cluster count':''}${g.current==null?' · current state lies outside the displayed search':''}${g.resource_limited?' · matrix-size limit reached':''}. No counting continues beyond the cap.`;
  options('node',g.nodes.map(n=>[n.id,`${n.id===g.current?'● ':''}State ${n.id} · ${n.depth} moves`]),g.current??'');
}
async function renderAll(){await Promise.all([drawFlip(),drawChord(),drawQuiver(),drawExchange()]);drawGeometry();updateButtons();}
function preview(t){return {family:state.family,tile:t.idx,path:[],model:MODEL,quiver:t.seed,exchange:t.preview_exchange,preview:true};}
async function chooseFamily(key,idx=0,path=[],cap=state.cap) {
  if(pending)return;
  const token=++familyGeneration;browsing=true;updateButtons();clearError();
  try{
    if(!familyCache.has(key))familyCache.set(key,await getJSON(`data/families/${key}.json`));
    if(token!==familyGeneration)return;
    const f=familyCache.get(key);
    if(f.model!==MODEL || f.schema!==SCHEMA || !f.tiles[idx])throw new Error('Family data does not match the source model or tile index.');
    data=f;state={family:key,tile:idx,path:[],cap};redo=[];result=preview(f.tiles[idx]);
    $('family').value=key;options('tile',f.tiles.map(t=>[t.idx,`Tile ${t.idx} · ${t.type_label}`]),idx);$('cap').value=cap;
    await renderAll();browsing=false;updateButtons();
    if(ready) {pendingInitial=null;await compute({family:key,tile:idx,path,cap});}
    else {if(path.length)pendingInitial={family:key,tile:idx,path,cap};status(path.length?'Saved mutation path will be restored when Python is ready.':'Initial seed loaded. Live mutation starts when Python is ready.');}
  }catch(e){showError(e.message);browsing=false;updateButtons();}
}
function chooseTile(idx){if(!data||pending||browsing||idx<0||idx>=data.tiles.length)return;pendingInitial=null;chooseFamily(data.key,idx,[],state.cap);}
let pendingInitial=null;
async function compute(next,action='evaluate',node=null,after=null) {
  if(!ready||pending||!data)return;
  clearError();
  const id=++requestId;
  const payload={action,...next};if(node!=null)payload.node=node;
  status(action==='jump'?'Replaying the selected state in Python…':'Computing quiver mutations in Python…');
  const timer=setTimeout(()=>stopWorker('The computation timed out. Your last displayed state is retained. Restart Python to continue.'),config.requestTimeoutMs);
  return new Promise(resolve=>{
    pending={id,next,after,timer,resolve};updateButtons();worker.postMessage({type:'request',id,payload});
  });
}
function mutateSlot(id){if(!ready||pending)return;const v=result?.quiver.vertices[id];if(!v?.mutable)return;compute({...state,path:[...state.path,v.key]},'evaluate',null,()=>{redo=[];});}
function jump(node){if(!ready||pending)return;compute({...state},'jump',node,()=>{redo=[];});}
function stopWorker(message){
  generation++;worker?.terminate();worker=null;ready=false;booting=false;clearTimeout(bootTimer);
  if(pending){clearTimeout(pending.timer);pending.resolve(false);pending=null;}
  badge('Python stopped · last state retained','error');showError(message);status('Read-only inspection remains available.');updateButtons();
}
function startWorker(){
  if(pending){pending.resolve(false);clearTimeout(pending.timer);pending=null;}
  worker?.terminate();const gen=++generation;ready=false;booting=true;clearError();updateButtons();badge('Starting Python…','loading');
  try {worker=new Worker(new URL('worker.mjs',baseURL),{type:'module'});}catch(e){stopWorker(`Cannot start background Python: ${e.message}`);return;}
  const thisWorker=worker;
  bootTimer=setTimeout(()=>{if(gen===generation)stopWorker('Pyodide did not finish loading. Check runtime-config.json and the CDN, or mirror the runtime locally.');},config.requestTimeoutMs);
  worker.addEventListener('error',e=>{if(gen===generation)stopWorker(`Python runtime could not load: ${e.message||'browser/network error'}. Initial seeds are still readable.`);});
  worker.addEventListener('message',async event=>{
    if(gen!==generation)return;
    const m=event.data;
    if(m.type==='progress'){if(booting)status(m.message);return;}
    if(m.type==='log'){console.info('[Python]',m.message);return;}
    if(m.type==='ready'){
      clearTimeout(bootTimer);ready=true;booting=false;badge(`${m.result.backend||'Pyodide'} ${m.result.version} · local Python`,'ready');updateButtons();
      if(data&&!browsing){const target=pendingInitial||state;pendingInitial=null;await compute(target);}else status('Python is ready. Loading family data…');return;
    }
    if(m.type==='error'&&booting){stopWorker(`Pyodide startup failed: ${m.error.message} Initial seeds remain available. See README for a same-origin runtime mirror.`);return;}
    if(!pending||m.id!==pending.id)return;
    const p=pending;clearTimeout(p.timer);pending=null;
    if(m.type==='error'||m.ok===false){showError(m.error?.message||'Python computation failed.');status('Computation rejected. The previous state is unchanged.');$('cap').value=state.cap;updateButtons();p.resolve(false);return;}
    try {
      const r=m.result;
      if(r.model!==MODEL||r.family!==p.next.family||r.tile!==p.next.tile)throw new Error('Python returned data for a different selection/model.');
      state={...p.next,path:r.path};result=r;p.after?.();rewriteURL();
      await Promise.all([drawQuiver(),drawExchange()]);
      status(`Local Python complete · tile ${state.tile} · ${state.path.length} mutations · ${result.exchange.nodes.length} C-matrix seed states.`);updateButtons();p.resolve(true);
    } catch(e){showError(e.message);updateButtons();p.resolve(false);}
  });
  thisWorker.postMessage({type:'boot',id:++requestId,baseURL:baseURL.href});
}
$('family').addEventListener('change',()=>{pendingInitial=null;chooseFamily($('family').value);});
$('tile').addEventListener('change',()=>chooseTile(Number($('tile').value)));
$('prev').onclick=()=>chooseTile((state.tile-1+data.tiles.length)%data.tiles.length);
$('next').onclick=()=>chooseTile((state.tile+1)%data.tiles.length);
$('cap').onchange=()=>compute({...state,cap:Number($('cap').value)});
$('layout').onchange=()=>{if(result)drawExchange();};
$('node').onchange=()=>jump(Number($('node').value));
$('undo').onclick=()=>{if(state.path.length){const last=state.path.at(-1);compute({...state,path:state.path.slice(0,-1)},'evaluate',null,()=>redo.push(last));}};
$('redo').onclick=()=>{if(redo.length){const last=redo.at(-1);compute({...state,path:[...state.path,last]},'evaluate',null,()=>redo.pop());}};
$('reset').onclick=()=>compute({...state,path:[]},'evaluate',null,()=>{redo=[];});
$('restart').onclick=()=>startWorker();
$('cancel').onclick=()=>stopWorker('Computation cancelled. The last displayed state was kept.');
$('share').onclick=async()=>{const u=stateURL(location.href,state);try{await navigator.clipboard.writeText(u);status('State link copied. It records family, tile, search cap and mutation path.');}catch{showError(`Clipboard is unavailable. Copy this state link: ${u}`);}};
$('export').onclick=()=>{
  const tile=data.tiles[state.tile],payload={schema:'bcfw-domino/state-v2',model:MODEL,state,result,tile:{diagram:tile.diagram,geometry:tile.geometry,plabic:tile.plabic,type_label:tile.type_label,certificate:tile.certificate},
    note:'Domino-variable quotient quiver; states identified by unordered C-rows. Symbolic cluster expressions are not computed. Geometry null means unavailable.',computedBy:result.preview?'bundled initial seed preview':'Python runtime'};
  const u=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=u;a.download=`bcfw-${state.family}-tile${state.tile}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);
};
$('plabic').onerror=()=>{if($('plabic').getAttribute('src'))showError('The plabic image could not be loaded.');};
async function init(){
  try{
    if(!globalThis.Plotly)throw new Error('The local Plotly bundle did not load. Serve the complete folder, including vendor/.');
    [catalog,config]=await Promise.all([getJSON('data/catalog.json'),getJSON('runtime-config.json')]);
    if(catalog.model!==MODEL || catalog.schema!==SCHEMA)throw new Error('Catalogue model mismatch.');
    options('family',catalog.families.map(f=>[f.key,`A(${f.n},${f.k},4) · ${f.tiles} tiles`]),catalog.default);
    let initial;try{initial=parseState(location.search,catalog,config.graphCap);}catch(e){initial=parseState('',catalog,config.graphCap);showError(e.message);}
    pendingInitial=initial;startWorker();await chooseFamily(initial.family,initial.tile,initial.path,initial.cap);
  }catch(e){showError(e.message);badge('Asset loading failed','error');status('See README for static hosting instructions.');}
}
init();
