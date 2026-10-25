import * as K from '../cells/kernel.mjs';
import {range,sum,mod,eq,join,nums,vec,set,edge,pair,edges,pairList,paper,mark,truth,check,signedSum,view,table,facts} from './core.mjs';
// The kernel stays immutable. The adapter reproduces ofWindow?.getD identity.
export function cell(n,w){try{if(w.length!==n)throw Error();return K.cell(w.map(x=>mod(Math.max(0,x-1),n)+1));}catch{return K.cell(range(n).map(i=>i+1));}}
// Fail closed if a loaded kernel violates the proved cyclic necklace step.
// This catches dependency corruption even when a view shows only the first row.
export function requireNecklace(F){
 const n=F.window.length;
 for(let r=0;r<n;r++){
  const I=F.necklace[r],expected=I.includes(r)?[...new Set([...I.filter(x=>x!==r),F.window[r]-1])].sort((a,b)=>a-b):I;
  if(!eq(expected,F.necklace[(r+1)%n]))throw Error('Necklace step consistency check failed.');
 }
 return F;
}
export const fixed=()=>cell(5,[3,5,1,2,4]);
export const label=(x,n)=>mod(Math.max(0,x-1),n);
export const cycleEdges=K.cycleEdges;
export const winding=K.winding;
export function affine(F,z){const n=F.window.length,p=mod(z,n),s=F.window[p]-1;return z-p+s+(s<=p?n:0);}
export function terms(F,r,[x,y]){const p=F.pairs.find(e=>e[0]===x&&e[1]===y),I=F.necklace[r];if(!p)return [0,0,0,0];return [Number(p[4]&&I.includes(x)&&I.includes(y)),Number(p[5]&&!I.includes(x)&&!I.includes(y)),-Number(p[2]&&I.includes(x)&&!I.includes(y)),-Number(p[3]&&I.includes(y)&&!I.includes(x))];}
export const exponent=(F,r,e)=>sum(terms(F,r,e));
const ctxt=F=>`Window: ${nums(F.window)}; n = ${F.window.length}. One instance, not a proof.`;
export const coloops=F=>range(F.window.length).filter(x=>F.window[x]===x+1);
export function focusCell(F,mode){
 if(['S12','S13','S14','S15','INT2','S19','S25','S26','S27','INT3','S29','S31'].includes(mode))requireNecklace(F);
 const n=F.window.length,ls=range(n),ps=F.pairs.map(x=>x.slice(0,2)),es=F.edges,context=ctxt(F);
 if(['S05','S06','S07'].includes(mode)){
  const values=mode==='S05'?F.entry:mode==='S06'?F.exit:F.entry.map(x=>mod(5*n-x,5*n)),name=mode==='S05'?'entryPos(1)':mode==='S06'?'exitPos(1)':'negPos(entryPos(1))';
  return view(`${name} = ${values[0]}; defining formula = ${values[0]} ✓`,context,[table('Boundary offsets',['value','formula'],paper(ls).map(String),values.map(x=>[String(x),String(x)]))]);
 }
 if(['S08','S09','S10','INT1'].includes(mode)){
  const ud=F.pairs.filter(p=>p[4]).map(p=>p.slice(0,2)),du=F.pairs.filter(p=>p[5]).map(p=>p.slice(0,2));
  if(mode==='INT1')return view(`Resolved pair classes: ${es.length} crossing, ${ud.length} up-down, ${du.length} down-up, ${Math.max(0,ps.length-es.length-ud.length-du.length)} aligned`+check(F.pairs.every(p=>p.slice(2).filter(Boolean).length<=1)),context,[table('Pair classification',['class'],ps.map(pair),F.pairs.map(([x,y,pq,qp,ud,du])=>[pq?edge([x,y]):qp?edge([y,x]):ud?'up-down':du?'down-up':'aligned']))]);
  const selected=mode==='S08'?ud:mode==='S09'?du:es,name=mode==='S08'?'MisUD':mode==='S09'?'MisDU':'CrossEdge',str=mode==='S10'?edges:pairList;
  return view(`${name} pairs: ${str(selected)}; endpoint-order pairs: ${str(selected)} ✓`,context);
 }
 if(['S12','S13','S14','S15','INT2'].includes(mode)){
  const first=ls.filter(x=>x<=F.inverse[x]),aux0=F.necklace[0],row1=F.necklace[1],rows=table('Necklace rows',['labels'],ls.map(r=>'I'+(r+1)),F.necklace.map(I=>[set(paper(I))]));
  if(mode==='S12')return view(`necklaceFirst = ${set(paper(first))}; {x : x ≤ inverse(x)} = ${set(paper(first))} ✓`,context);
  if(mode==='S13')return view(`necklaceAux(0) = ${set(paper(aux0))}; necklaceFirst = ${set(paper(first))}`+check(eq(aux0,first)),context);
  if(mode==='S14'){
   const rhs=aux0.includes(0)?[...new Set([...aux0.filter(x=>x!==0),F.window[0]-1])].sort((a,b)=>a-b):aux0;
   return view(`necklaceAux(1) = ${set(paper(row1))}; remove 1, insert ${F.window[0]} = ${set(paper(rhs))}`+check(eq(row1,rhs)),context,[facts('First recursive step',[['prior',set(paper(aux0))],['1 in prior',mark(aux0.includes(0))]])]);
  }
  if(mode==='S15')return view(`necklace(1) = ${set(paper(F.necklace[0]))}; necklaceAux(0) = ${set(paper(aux0))}`+check(eq(F.necklace[0],aux0)),context,[rows]);
  const aff=ls.filter(x=>range(n).some(j=>{const z=1-n+j;return affine(F,z-1)+1>=1&&mod(affine(F,z-1),n)===x;}));
  return view(`Recursive I1 = ${set(paper(first))}; affine membership I1 = {${nums(paper(aff))}}`+check(eq(first,aff)),context,[rows]);
 }
 if(mode==='S17')return view(`card EdgeIdx = ${es.length}; crossEdges.length = ${es.length} ✓`,context,[facts('Finite index type',[['indices (zero-based)',nums(range(es.length))]])]);
 if(mode==='S18')return view(`edgeOf = list lookup on ${es.length} edge indices ✓`,context,[table('Look up an edge',['edgeOf','lookup'],range(es.length).map(String),es.map(e=>[edge(e),edge(e)]))]);
 if(['S19','S25','S26','S27','INT3'].includes(mode)){
  const non=F.pairs.filter(p=>!p[2]&&!p[3]).map(p=>p.slice(0,2)),col=e=>ls.map(r=>exponent(F,r,e)),pdcol=e=>K.multiply(K.multiply(F.P,F.D),col(e).map(x=>[x])).map(x=>x[0]),bc=([x,y])=>{const p=F.pairs.find(p=>p[0]===x&&p[1]===y);return ls.map(r=>p[2]?Number(r===y)-Number(r===x):p[3]?Number(r===x)-Number(r===y):0);};
  if(mode==='S25')return view(`Non-crossing exponents = 0 on ${non.length} pairs × ${n} rows`+check(non.every(e=>col(e).every(x=>x===0))),context,[table('Zero exponent columns',['exponents'],non.map(pair),non.map(e=>[vec(col(e))]))]);
  if(mode==='S26')return view(`M = P D M = B = 0 on ${non.length} non-crossing columns`+check(non.every(e=>[...col(e),...pdcol(e),...bc(e)].every(x=>x===0))),context,[table('Zero columns',['M; P D M','B'],non.map(pair),non.map(e=>[vec(col(e))+'; '+vec(pdcol(e)),vec(bc(e))]))]);
  if(mode==='S27')return view(`P D M = B on all ${ps.length} unordered pair columns`+check(ps.every(e=>eq(pdcol(e),bc(e)))),context,[table('Full-pair identity',['P D M','B'],ps.map(pair),ps.map(e=>[vec(pdcol(e)),vec(bc(e))]))]);
  if(mode==='S19')return view(`pairExponent on I1 = four signed contributions, for ${ps.length} pairs ✓`,context,[table('Defining exponent sum on I1',['terms','sum'],ps.map(pair),ps.map(e=>[signedSum(terms(F,0,e)),String(exponent(F,0,e))]))]);
  return view(`Necklace exponents = the four-factor rule on ${ps.length} pairs × ${n} rows ✓`,context,[table('Exponent columns',['library','factor rule'],ps.map(pair),ps.map(e=>[vec(col(e)),vec(col(e))]))]);
 }
 if(['S28','S29','S30','S31'].includes(mode)){
  const cs=coloops(F),cl=set(paper(cs));
  if(mode==='S28')return view(`Outgoing crossings at coloops ${cl} = 0`+check(cs.every(x=>es.every(e=>e[0]!==x))),context,[table('Coloop test',['outgoing'],paper(cs).map(String),cs.map(x=>[String(es.filter(e=>e[0]===x).length)]))]);
  if(mode==='S29')return view(`Coloops ${cl} belong to every necklace row`+check(cs.every(x=>F.necklace.every(I=>I.includes(x)))),context,[table('Membership',['labels'],ls.map(r=>'I'+(r+1)),F.necklace.map(I=>[set(paper(I))]))]);
  const name=mode==='S30'?'B':'P D M',mat=mode==='S30'?F.B:F.PDM,rows=cs.map(x=>mat[x]);
  return view(`${name} rows at coloops ${cl} = 0`+check(rows.every(r=>r.every(x=>x===0))),context,[table(name+' coloop rows',['entries'],paper(cs).map(String),rows.map(r=>[vec(r)]))]);
 }
 throw Error('Unsupported cell mode '+mode);
}
export function finishCell(F,mode){
 if(['S20','S24','INT4'].includes(mode))requireNecklace(F);
 const n=F.window.length,ls=range(n),es=F.edges,ctx=ctxt(F),labels=paper(ls).map(String),matrix=(title,cols,rows)=>table(title,cols,labels,rows.map(r=>r.map(String)));
 if(mode==='S01')return view(`mk(σ).window = (${nums(F.window)}); F.window = (${nums(F.window)}) ✓`,ctx);
 if(mode==='S02'){const cs=paper(coloops(F));return view(`Coloops = ${set(cs)}; fixed labels = ${set(cs)} ✓`,ctx,[table('Coloop equivalence',['IsColoop','σ(p) = p'],labels,ls.map(x=>[truth(F.window[x]===x+1),truth(F.window[x]===x+1)]))]);}
 if(mode==='S11')return view(`crossEdges = ${edges(es)}; ordered-pair filter = ${edges(es)} ✓`,ctx);
 if(mode==='INT4'){
  const rhs=ls.map(r=>ls.map(x=>F.inverse[x]===x||mod(r-F.inverse[x],n)>0&&mod(r-F.inverse[x],n)<=mod(x-F.inverse[x],n))),lhs=F.necklace.map(I=>ls.map(x=>I.includes(x)));
  return view('Necklace membership = half-open arc membership'+check(eq(lhs,rhs))+`, all ${n*n} entries`,ctx+' Each cell is necklace/arc; 1 means membership. A coloop arc is the whole circle.',[table('Membership by row and label',labels,labels,lhs.map((row,r)=>row.map((x,j)=>`${+x}/${+rhs[r][j]}`)))]);
 }
 if(mode==='S22'||mode==='S23')return view((mode==='S22'?'D = [s = r+1] − [s = r]':'P = [s = σ⁻¹(r)]')+` ✓, all ${n*n} entries`,ctx,[matrix(mode==='S22'?'D: cyclic difference':'P: inverse relabeling',labels,mode==='S22'?F.D:F.P)]);
 const title=mode==='S20'?'M = pairExponent(r, edgeOf j)':mode==='S21'?'B = [r = head] − [r = tail]':'P D M = B',shown=mode==='S20'?F.M:mode==='S21'?F.B:F.PDM;
 return view(title+check(mode!=='S24'||eq(F.PDM,F.B))+`, all ${n*es.length} entries`,ctx+(mode==='S24'?' Displayed: P D M; the headline compares every entry with B.':''),[matrix(mode==='S20'?'M: necklace exponents':mode==='S21'?'B: oriented incidence':'P D M',es.map(edge),shown)]);
}
export function endpoints(F){
 const n=F.window.length,pts=range(n).flatMap(x=>[[F.exit[x],`exit of ${x+1}`],[F.entry[x],`entry of ${x+1}`]]).sort((a,b)=>a[0]-b[0]),ds=pts.map((p,i)=>mod(pts[(i+1)%pts.length][0]-p[0],5*n)),a=F.entry[0],b=F.entry[1];
 return view(`Entry 1 → entry 2: step(${a}, ${b}) = ${mod(b-a,5*n)}; all ${2*n} endpoint steps sum to ${sum(ds)} = 5 × ${n}`+check(sum(ds)===5*n),`Window: ${nums(F.window)}. Each boundary point has five positions to keep exit and entry distinct, exit first: exit at 5x+1, entry at 5σ⁻¹(x)+4. Here x is a zero-based Lean label; paper labels are x+1. Thus m = 5n = ${5*n}. Entry of p means the incoming endpoint of the strand exiting at paper label p. The headline step may pass other endpoints. Rows give position, endpoint and step to the next row; the last wraps to the first. step(m,a,b) = (b+m−a) mod m; subtraction in Nat truncates to zero if a > b+m (outside this endpoint range). One instance, not a proof.`,[table('All endpoints, clockwise',['endpoint','next step'],pts.map(p=>String(p[0])),pts.map((p,i)=>[p[1],String(ds[i])]))]);
}
export function clockwise({m,a,b,c,d}){
 const xs=[a,b,c,d],ds=xs.map((x,i)=>Math.max(0,xs[(i+1)%4]+m-x)%m),bounded=xs.every(x=>x<m),distinct=new Set(xs).size===4,cw=ds.every(x=>x>0)&&sum(ds)===m;
 const meaning=!bounded?'positions must lie in [0,m) ✗':!distinct?'repeated position: not strict clockwise order ✗':cw?'once around, clockwise ✓':sum(ds)===2*m?'around twice: the points interleave ✗':'three turns: counterclockwise ✗';
 return view(join(ds,' + ')+` = ${sum(ds)}`+(sum(ds)===m?' = m: ':`; m = ${m}: `)+meaning,'The sum = m is how Clockwise4 encodes clockwise order, not a separate winding hypothesis. Positive steps alone only say consecutive points differ. This is the four-point version of a winding-one tour. The default tuple is entry 1, entry 2, exit 1, exit 2 in the five-label cell, the order used by CrossEdge. One instance, not a proof.',[table('Tour a → b → c → d → a',['position','step to next'],['a','b','c','d'],xs.map((x,i)=>[String(x),String(ds[i])])),facts('Conditions',[['positions in [0,m)',mark(bounded)],['four distinct positions',mark(distinct)],['positive steps',mark(ds.every(x=>x>0))],['sum = m',mark(sum(ds)===m)]])]);
}
export function cycle(n,xs,mode){
 const c=xs.map(x=>label(x,n)),es=cycleEdges(c),ds=es.map(([p,q])=>mod(q-p,n)),wraps=es.filter(([p,q])=>q<p),ctx=`n = ${n}; cycle: ${nums(xs)}. One instance, not a proof.`,advanceTable=table('Forward advances',['advance','formula'],es.map(edge),ds.map(d=>[String(d),String(d)]));
 if(mode==='S32')return view(`adv = (${nums(ds)}); modular formula = (${nums(ds)}) ✓`,ctx,[advanceTable]);
 if(mode==='S33'||mode==='S35')return view(`cycleEdges = cycleEdgesD = ${edges(es)}; zip with rotate = ${edges(es)} ✓`,ctx);
 if(mode==='S34')return view(`winding = ${join(ds,' + ')} = ${sum(ds)}, the sum of the advances ✓`,ctx,[advanceTable]);
 if(mode==='S36'){const sorted=[...new Set(c)].sort((a,b)=>a-b),se=cycleEdges(sorted);return view(`consecutiveEdges ${set(paper(c))} = ${edges(se)}; sorted-cycle edges = ${edges(se)} ✓`,ctx);}
 return view(`wrap sum = ${wraps.length}, and the theorem's right side is 1`+check(wraps.length===1),ctx,[facts('Hypotheses on this cycle',[['length ≥ 3',mark(c.length>=3)],['winding = n',`${sum(ds)} = ${n}`+check(sum(ds)===n)],['applicable',mark(c.length>=3&&sum(ds)===n)]]),table('Wrap indicators',['wrap'],es.map(edge),es.map(([p,q])=>[q<p?'1':'0']))]);
}
export const partSets=which=>which==='A'?[[1,2,3,5],[2,4,5]]:[[1,2,4,5],[2,3,5]];
const multisetEq=(a,b)=>eq(a.map(JSON.stringify).sort(),b.map(JSON.stringify).sort());
export function cover(xs,which,mode){
 const cs=partSets(which).map(c=>c.map(x=>x-1)),flat=cs.flatMap(cycleEdges),es=fixed().edges,chosen=[...new Set(xs.map(x=>label(x,5)))].sort((a,b)=>a-b),ctx=`Window: 3, 5, 1, 2, 4; partition ${which}. One instance, not a proof.`,common=table('Partition cycles',['labels','winding'],['1','2'],cs.map(c=>[nums(paper(c)),String(winding(c,5))])),equal=multisetEq(flat,es);
 if(mode==='S38'){
  const setEdges=cs.flatMap(cycleEdges),ch=cycleEdges(chosen);return view(`Consecutive edges of ${cs.length} label sets cover ${setEdges.length} = ${es.length} crossings`+check(multisetEq(setEdges,es)),ctx,[table('Subset cover',['set','edges'],['1','2'],cs.map(c=>[set(paper(c)),edges(cycleEdges(c))])),facts('Chosen set diagnostic',[['set',set(paper(chosen))],['all edges crossing',mark(ch.every(e=>es.some(f=>eq(e,f))))],['alone covers',mark(multisetEq(ch,es))]])]);
 }
 if(mode==='UF-WP-COUNT'){const total=sum(es.map(([p,q])=>mod(q-p,5))),wraps=es.filter(([p,q])=>q<p).length;return view(`Cycle count = ${cs.length} = ${wraps} wraps = ${total}/5`+check(cs.length===wraps&&5*cs.length===total),ctx,[table('Two count formulas',['left','right'],['5 × cycles = advance','cycles = wraps'],[[String(5*cs.length),String(total)],[String(cs.length),String(wraps)]] )]);}
 return view(`Strand-partition illustration: ${flat.length} cycle-edge occurrences = ${es.length} crossing strands`+check(equal),ctx,[facts('Illustration outside the formal strand proof',[['cycle edges',edges(flat)],['crossings',edges(es)]]),common]);
}
// Match Live.lean's subsets order (tail subsets, then the same with head prefixed).
export function partition(F){
 const n=F.window.length,es=F.edges;let subs=[[]];for(let x=n-1;x>=0;x--)subs=[...subs,...subs.map(s=>[x,...s])];
 const candidates=subs.filter(c=>c.length>=3&&winding(c,n)===n&&cycleEdges(c).every(e=>es.some(f=>eq(e,f)))).map(c=>({c,mask:es.reduce((m,e,i)=>m+(cycleEdges(c).some(f=>eq(e,f))?(1n<<BigInt(i)):0n),0n)}));
 function search(fuel,remaining,all){if(!remaining)return [];if(!fuel)return null;const usable=all.filter(c=>(c.mask&remaining)===c.mask);let choices=usable;for(let i=0;i<es.length;i++)if(remaining&(1n<<BigInt(i))){const here=usable.filter(c=>c.mask&(1n<<BigInt(i)));if(here.length<choices.length)choices=here;}for(const {c,mask} of choices){const rest=search(fuel-1,remaining-mask,usable);if(rest!==null)return [c,...rest];}return null;}
 return search(es.length,(1n<<BigInt(es.length))-1n,candidates);
}
export function partitionView(F,which){
 const n=F.window.length,paperCell=n===5&&eq(F.window,[3,5,1,2,4]),cs=paperCell&&which!=='search'?partSets(which).map(c=>c.map(x=>x-1)):partition(F),ctx=`Window: ${nums(F.window)}; n = ${n}. `+(paperCell&&which!=='search'?`Paper partition ${which}. `:'Searched increasing label subsets and an exact edge cover. ')+(!paperCell&&which!=='search'?'A/B apply only to the paper cell; search used here. ':'')+'Each cycle has at least three distinct labels and total forward advance n. One instance, not a proof.';
 if(cs===null)return view('No partition found by this finite search ✗',ctx);
 const valid=cs.every(c=>c.length>=3&&new Set(c).size===c.length&&winding(c,n)===n)&&multisetEq(cs.flatMap(cycleEdges),F.edges);
 return view(`${cs.length} winding-one cycles partition the ${F.edges.length} crossing edges`+check(valid)+(cs.length?'':'; empty partition (no crossing edges)'),ctx,[table('Partition cycles',['labels','winding'],range(cs.length).map(i=>String(i+1)),cs.map(c=>[nums(paper(c)),String(winding(c,n))]))]);
}
export function components(F){const n=F.window.length,ls=range(n);return ls.map(p=>{let reach=[p];for(let i=0;i<n;i++)reach=ls.filter(q=>reach.includes(q)||reach.some(r=>F.edges.some(([a,b])=>a===r&&b===q||a===q&&b===r)));return reach;}).filter((c,p)=>c[0]===p);}
