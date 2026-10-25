import * as K from '../cells/kernel.mjs';
import {mirrorSin,mirrorLog} from './precise_math.mjs';
import {range,sum,eq,join,vec,edge,mark,truth,check,near,f4,fs,num,pretty,prettyAt,view,table,facts,floatCtx,ctx,synCtx} from './core.mjs';
import {fixed,cycleEdges,exponent,requireNecklace} from './combinatorial.mjs';
export const pi=Math.PI;
export const cot=x=>Math.cos(x)/Math.sin(x);
export const logSin=x=>Math.log(Math.sin(x));
export const gap=(a,[p,q])=>pi*((a[q]??0)-(a[p]??0)+(q<p?1:0));
export const gaps=a=>fixed().edges.map(e=>gap(a,e));
export const admissible=a=>gaps(a).every(d=>1e-9<d&&d<pi-1e-9);
export const maxAbs=xs=>Math.max(0,...xs.map(Math.abs));
export const sub=(a,b)=>a.map((x,i)=>x-b[i]);
export const dot=(a,b)=>sum(a.map((x,i)=>x*b[i]));
export const necklace=a=>{const F=requireNecklace(fixed()),logs=F.edges.map(e=>mirrorLog(2*mirrorSin(gap(a,e))));return F.M.map(r=>sum(r.map((v,j)=>v*logs[j])));};
export const fullNecklace=a=>{const F=requireNecklace(fixed());return range(5).map(r=>sum(F.pairs.map(([p,q])=>{const e=exponent(F,r,[p,q]);return e===0?0:e*Math.log(2*Math.abs(Math.sin(pi*((a[q]??0)-(a[p]??0)))));})));};
export const recover=z=>fixed().inverse.map(r=>(z[(r+1)%5]??0)-(z[r]??0));
export function primitive(u){const N=4096,h=(u-pi/2)/N;let s=0;for(let j=0;j<=N;j++)s+=(j===0||j===N?1:j%2===0?2:4)*logSin(pi/2+j*h);return h/3*s;}
export const potential=a=>sum(gaps(a).map(primitive));
export function inadmissible(a,mode){
 const es=fixed().edges,ds=gaps(a),bad=es.map((e,j)=>[e,ds[j]]).filter(([,d])=>!(1e-9<d&&d<pi-1e-9)),reason=d=>d<=0?' ≤ 0':d>=pi?' ≥ 1':' within numerical boundary margin',lead=ds.some(d=>d<=0||pi<=d)?'Not admissible: ':'Numerical boundary stop: ';
 return view(lead+join(bad.map(([e,d])=>`δ(${edge(e)})/π = ${f4(d/pi)}`+reason(d)),'; ')+' ✗',mode+': admissible means every crossing gap satisfies 0 < δ < π. Computation also stops within 1e-9 radians of either boundary; the strict condition and numerical guard are shown separately. Conclusion not evaluated. One instance, not a proof.',[table('Crossing gaps',['δ/π','0 < δ < π','guard'],es.map(edge),ds.map(d=>[f4(d/pi),mark(0<d&&d<pi),mark(1e-9<d&&d<pi-1e-9)])),facts('Input',[['θ/π',fs(a)]])]);
}
export function cotangent(alpha,diffs){
 const m=alpha.length,total=sum(alpha),drift=sum(diffs),positive=alpha.every(x=>x>0),applicable=m>=3&&positive&&near(total,1)&&near(drift,0),finite=alpha.every(x=>Math.abs(Math.sin(pi*x))>1e-9),terms=alpha.map((x,i)=>cot(pi*x)*diffs[i]*diffs[i]),q=sum(terms),head=!finite?'Q undefined at a cotangent pole; theorem does not apply here ✗':applicable?`Q = ${f4(q)} ≥ 0; all four hypotheses hold`+check(q>=-0.00002):`Q = ${f4(q)}; theorem does not apply here ✗`;
 return view(head,'Three independent angles α/π and three differences d; neither sum is forced. The theorem needs m ≥ 3, every α > 0, Σα = π and Σd = 0. No cell admissibility is required. Equalities use Float tolerance 2e-5; positivity is strict. Q = Σ cot(αᵢ)dᵢ² is still shown when finite even if a hypothesis fails. One instance, not a proof.',[table('Angles and differences',['α/π','α > 0','d'],range(m).map(i=>String(i+1)),alpha.map((x,i)=>[f4(x),mark(x>0),f4(diffs[i])])),facts('Hypotheses and distance to equality',[['m ≥ 3',`${m}; deficit ${Math.max(0,3-m)}`+check(m>=3)],['each α/π > 0',`minimum ${f4(Math.min(alpha[0]??0,...alpha))}`+check(positive)],['Σα/π = 1',`${f4(total)}; residual ${f4(total-1)}`+check(near(total,1))],['Σd = 0',`${f4(drift)}; residual ${f4(drift)}`+check(near(drift,0))]])]);
}
const floats=(title,names,xs)=>table(title,names,['1','2','3','4','5'],range(5).map(j=>xs.map(x=>f4(x[j]??0))));
export function focusAnalytic(a,h,mode){
 if(!admissible(a))return inadmissible(a,mode);
 const F=fixed(),es=F.edges,{H,Q}=K.analytic(a,h),Hh=H.map(r=>dot(r,h)),constant=es.every(([p,q])=>(h[p]??0)===(h[q]??0)),constantText='constant on the connected component: '+truth(constant),input=floats('Input by paper label',['θ/π','h'],[a,h]);
 if(mode==='S42')return view(`Q = ${f4(Q)} ≥ 0`+check(Q>=-1e-9),floatCtx,[input,facts('Equality case',[['Q ≈ 0',mark(near(Q,0))],['constant',mark(constant)],['equivalence',mark(near(Q,0)===constant)]]),table('Signed cotangents',['cot δ','Δh'],es.map(edge),es.map(e=>[f4(cot(gap(a,e))),f4((h[e[1]]??0)-(h[e[0]]??0))]))]);
 if(mode==='S43')return view(`Q ≈ 0: ${truth(near(Q,0))} ↔ ${constantText}`+check(near(Q,0)===constant),floatCtx,[input,facts('Quadratic kernel',[['Q',f4(Q)]])]);
 if(mode==='S44')return view(`Hh ≈ 0: ${truth(maxAbs(Hh)<0.00002)} ↔ ${constantText}`+check((maxAbs(Hh)<0.00002)===constant),floatCtx,[floats('Matrix kernel by paper label',['h','Hh'],[h,Hh])]);
 if(mode==='S45'){
  const l=es.map(([p,q])=>2*Math.abs(Math.sin(pi*((a[q]??0)-(a[p]??0))))),r=es.map(e=>2*Math.sin(gap(a,e)));
  return view(`Bracket modulus on 1→2 = ${f4(l[0]??0)}; 2 sin δ = ${f4(r[0]??0)}`+check(near(l[0]??0,r[0]??0)),floatCtx,[table('Bracket modulus on crossing edges',['left','right'],es.map(edge),l.map((x,i)=>[f4(x),f4(r[i])]))]);
 }throw Error('Unsupported analytic mode '+mode);
}
// Finish.raw first serializes its source values with Float.toString (six decimals).
export const rawNum=x=>Number(num(x));
export const rawPretty=x=>pretty(Array.isArray(x)?x.map(y=>Array.isArray(y)?y.map(num):num(y)):num(x));
export function cycleGaps(a){
 if(!admissible(a))return inadmissible(a,'S40');const ces=cycleEdges([0,1,2,4]),ds=ces.map(e=>gap(a,e));
 return view(`Sum of cycle gaps/π = ${pretty(rawNum(sum(ds)/pi))}; winding-one right side = 1`+check(near(rawNum(sum(ds)/pi),1)),ctx,[facts('Telescoping cycle',[['cycle','(1, 2, 3, 5)'],['cycle gaps/pi',rawPretty(ds.map(d=>d/pi))],['raw differences sum',pretty(rawNum(sum(ces.map(([p,q])=>a[q]-a[p]))))]])]);
}
export function rational(direction,weights){const F=fixed(),H=range(5).map(r=>range(5).map(s=>sum(F.edges.map((_,j)=>F.B[r][j]*(weights[j]??0)*F.B[s][j])))),lhs=dot(direction,H.map(r=>dot(r,direction))),rhs=sum(F.edges.map(([p,q],j)=>(weights[j]??0)*((direction[q]??0)-(direction[p]??0))**2));return view(`hᵀ B diag(w) Bᵀ h = ${lhs}; edge sum = ${rhs}`+check(lhs===rhs),'Exact rational instance, not a proof.',[table('B diag(w) B^T',['1','2','3','4','5'],['1','2','3','4','5'],H.map(r=>r.map(String)))]);}
export function construct(a){
 if(!admissible(a))return inadmissible(a,'UF-CONSTRUCT');const h=[0,0,1,0,0],ts=[-0.00002,-0.00001,0,0.00001,0.00002],points=ts.map(t=>a.map((x,j)=>x+t*h[j])),good=points.filter(admissible),image=[...new Set(good.map(x=>JSON.stringify(necklace(x))))],N=necklace(a),full=fullNecklace(a);

 return view(`Synthetic construction illustration: ${image.length} > 0 targets from ${good.length} inputs; N(Meas θ) = full pair sum`+check(maxAbs(sub(N.map(rawNum),full.map(rawNum)))<0.00002&&image.length>0),synCtx,[table('Realized image point',['Meas θ','N(Meas θ)'],range(5).map(j=>String(j+1)),N.map(x=>[pretty(num(x)),pretty(num(x))]))]);
}
export function volume(a){
 if(!admissible(a))return inadmissible(a,'UF-VOLUME');const ds=gaps(a),lambdas=ds.map(d=>-primitive(d)-(d-pi/2)*Math.log(2)),P=potential(a),constant=sum(ds.map(d=>-(d-pi/2)*Math.log(2))),rhs=-sum(lambdas)+constant;
 return view(`Ψ = ${pretty(rawNum(P))}; −ΣΛ + C = ${pretty(rawNum(rhs))}`+check(near(rawNum(P),rawNum(rhs))),ctx+' Lobachevsky identity; no hyperbolic solid constructed.',[facts('Normalization',[['sum gaps/pi',pretty(rawNum(sum(ds)/pi))],['sum Lambda',pretty(rawNum(sum(lambdas)))],['normalization constant',pretty(rawNum(constant))]])]);
}
