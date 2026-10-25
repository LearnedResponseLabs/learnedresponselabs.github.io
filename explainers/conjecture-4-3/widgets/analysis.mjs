// Angles a are in units of π. Directions h and the line parameter t are in
// radians: a(t) = a + t h/π. The imported kernel owns all combinatorial data.
import {cell, RUNNING, partition, cycleEdges, analytic, inverse} from '../../cells/kernel.mjs';
export const PI = Math.PI;
export const BASE = Object.freeze([0, .1, .7, .3, .8]);
export const PRESETS = Object.freeze([[0,0,1,0,0], [0,1,-.5,.25,-.75], [0,1,1,1,1]].map(Object.freeze));
export const C = cell(RUNNING);
export const COVER = partition(C);
export const CYCLE_COLUMNS = COVER.map(c => cycleEdges(c).map(e => C.edges.findIndex(f => e[0]===f[0] && e[1]===f[1])));
export const sum = xs => xs.reduce((s,x) => s+x,0);
export const dot = (a,b) => sum(a.map((x,j) => x*b[j]));
export const mv = (A,x) => A.map(r => dot(r,x));
export const maxAbs = xs => Math.max(0,...xs.map(Math.abs));
const LOG2 = Math.log(2);
// ζ(2k), rounded to binary64. The tail uses its rapidly convergent defining
// series, only for k ≥ 13. No quadrature or network dependency at runtime.
const ZETA = [0,1.6449340668482264365,1.0823232337111381915,1.0173430619844491397,
 1.0040773561979443394,1.0009945751278180853,1.0002460865533080483,
 1.0000612481350587048,1.0000152822594086519,1.0000038172932649998,
 1.0000009539620338728,1.0000002384505027277,1.0000000596081890513];
const COEFF = Array.from({length:32},(_,i) => {
 const k=i+1, z=ZETA[k] ?? sum(Array.from({length:8},(_,j)=>(j+1)**(-2*k)));
 return z/(k*(2*k+1));
});
// Integrate log(sin x / x) = -Σ ζ(2k)(x/π)^(2k)/k.
// Reflection restricts x/π ≤ 1/2, so 32 terms suffice even at the midpoint.
export function lobachevsky(x) {
 if (!(x>=0 && x<=PI)) return NaN;
 if (x===0 || x===PI || x===PI/2) return 0;
 const sign=x>PI/2?-1:1, u=x>PI/2?PI-x:x, r=(u/PI)**2;
 let series=0;
 for(let k=COEFF.length-1;k>=0;k--) series=(series+COEFF[k])*r;
 return sign*u*(1-Math.log(2*u)+series);
}
export function primitive(x) {
 if (!(x>0 && x<PI)) return NaN;
 return -lobachevsky(x)+(PI/2-x)*LOG2;
}
export function psi(a) {
 const v=analytic(a);
 return v.admissible?sum(v.gaps.map(primitive)):NaN;
}
export const VOLUME_CONSTANT = (C.edges.length/2-COVER.length)*PI*LOG2;
export const linePoint = (a,h,t) => a.map((x,j)=>x+t*h[j]/PI);
export function validDirection(h) {
 return Array.isArray(h) && h.length===5 && h.every(Number.isFinite) && maxAbs(h.map(x=>x-h[0]))>1e-10 && maxAbs(h)<=100;
}
export function lineDomain(a,h,margin=2e-9) {
 if (!analytic(a).admissible || !validDirection(h)) return null;
 let lo=-Infinity,hi=Infinity;
 const gaps=analytic(a).gaps;
 C.edges.forEach(([p,q],j)=>{
  const b=h[q]-h[p];
  if(b!==0) { const x=(margin-gaps[j])/b, y=(PI-margin-gaps[j])/b; lo=Math.max(lo,Math.min(x,y));hi=Math.min(hi,Math.max(x,y)); }
 });
 return Number.isFinite(lo)&&Number.isFinite(hi)&&lo<hi?[lo,hi]:null;
}
export function lineValue(a,h,t,s=0) { return psi(linePoint(a,h,t))-s*t; }
export function lineSlope(a,h,t) {
 const v=analytic(linePoint(a,h,t)); return v.G?dot(v.G,h):NaN;
}
export function tiltMinimum(a,h,s) {
 const d=lineDomain(a,h);
 if (!d || !Number.isFinite(s)) return null;
 let [lo,hi]=d;
 if(!(lineSlope(a,h,lo)<s && s<lineSlope(a,h,hi))) return null;
 for(let k=0;k<70;k++) {
  const mid=(lo+hi)/2;
  if(lineSlope(a,h,mid)<s) lo=mid; else hi=mid;
 }
 const t=(lo+hi)/2;
 return {t,value:lineValue(a,h,t,s),slope:lineSlope(a,h,t)};
}
export function necklace(a) {
 const v=analytic(a);
 if(!v.admissible) return null;
 const logs=v.gaps.map(d=>Math.log(2*Math.sin(d))), ell=mv(C.M,logs), differences=mv(C.D,ell), relabelled=mv(C.P,differences);
 return {logs,terms:C.M.map(row=>row.map((m,j)=>m*logs[j])),ell,differences,relabelled,
  error:maxAbs(relabelled.map((x,j)=>x-v.G[j]))};
}
export function tiltedValue(a,y) { return psi(a)-PI*dot(y,a); }
const sub=(a,b)=>a.map((x,j)=>x-b[j]);
const norm=a=>Math.hypot(...a);
const normalized=a=>a.map(x=>x/norm(a));
// An orthonormal plane in the θ₁=0 gauge slice, through target and start.
// Newton's full four-dimensional iterates are projected onto this plane.
export function inverseSlice(a,result=inverse(a)) {
 if(!result) return null;
 const delta=sub(result.iterates[0],a);
 const u=norm(delta)>1e-8?normalized(delta):[0,0,1,0,0];
 const candidates=[1,2,3,4].map(j=>[0,0,0,0,0].map((_,k)=>Number(j===k)));
 candidates.sort((x,y)=>Math.abs(dot(x,u))-Math.abs(dot(y,u)));
 const e=candidates[0],v=normalized(sub(e,u.map(x=>x*dot(e,u))));
 const project=x=>{const d=sub(x,a);return [dot(d,u),dot(d,v)];};
 const points=result.iterates.map(project);
 const extent=Math.max(.16,...points.map(p=>Math.max(...p.map(Math.abs))))*1.25;
 const point=(x,y)=>a.map((z,j)=>z+x*u[j]+y*v[j]);
 const offPlane=result.iterates.map((x,j)=>norm(sub(sub(x,a),u.map((z,k)=>z*points[j][0]+v[k]*points[j][1]))));
 return {u,v,points,extent,offPlane,point};
}
export function sliceGrid(a,geometry,size=43) {
 const y=analytic(a).G;
 if(!y || !geometry) return null;
 const {extent,point}=geometry, minimum=tiltedValue(a,y), values=[];
 for(let j=0;j<size;j++) for(let i=0;i<size;i++) {
  const x=-extent+2*extent*i/(size-1),z=-extent+2*extent*j/(size-1), value=tiltedValue(point(x,z),y)-minimum;
  values.push(Number.isFinite(value)?value:null);
 }
 return {size,extent,values,minimum};
}
// The renderer and Node checks use these same display models; there is no
// separate illustrative substitute for kernel values in the drawing code.
export function stepData(step,a,options={}) {
 const h=options.h ?? PRESETS[1], v=analytic(a,h), common={a:a.slice(),...v};
 if(step===1) {
  const shifted=analytic(a.map(x=>x+(options.turn??0)),h);
  return {...common,shifted:shifted.G,turnError:v.G&&shifted.G?maxAbs(v.G.map((x,j)=>x-shifted.G[j])):null};
 }
 if(step===2) {
  const direction=options.h??PRESETS[0],t=options.t??0,s=options.s??0;
  return {...common,h:direction,t,s,domain:lineDomain(a,direction),point:linePoint(a,direction,t),value:lineValue(a,direction,t,s),slope:lineSlope(a,direction,t),minimum:tiltMinimum(a,direction,s)};
 }
 if(step===3 || step===4) return {...common,necklace:necklace(a)};
 if(step===5) return common;
 if(step===6) {
  const result=v.admissible?inverse(a):null;
  return {...common,result};
 }
 if(step===7) {
  const values=v.admissible?v.gaps.map(lobachevsky):null, potential=v.admissible?psi(a):null,negativeVolume=values?-sum(values):null;
  return {...common,values,potential,negativeVolume,difference:values?potential-negativeVolume:null,constant:VOLUME_CONSTANT};
 }
 throw Error('Unknown step');
}
