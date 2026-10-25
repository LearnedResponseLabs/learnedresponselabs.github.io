import {range,sum,join,edge,check,near,f4,fs,view,table,withPicture} from './core.mjs';
import {cell,components} from './combinatorial.mjs';
import {pi,cot,logSin,gap} from './analytic.mjs';
import {pic,txt,seg,Box,blue,orange,el} from './pictures.mjs';
const F=()=>cell(6,[3,1,2,6,4,5]);
const dh=(h,[p,q])=>(h[q]??0)-(h[p]??0);
const admissible=(F,a)=>F.edges.every(e=>1e-9<gap(a,e)&&gap(a,e)<pi-1e-9);
const qform=(F,a,h)=>sum(F.edges.map(e=>cot(gap(a,e))*dh(h,e)*dh(h,e)));
const compName=c=>'{'+join(c.map(i=>i+1))+'}';
export function twoView(a,h){
 const f=F(),es=f.edges,comps=components(f),ctx='Window 3 1 2 6 4 5: the crossing graph is two triangles, 1→2→3→1 and 4→5→6→4, and each triangle\'s gaps sum to π. Ψ depends on θ only through the gaps, so moving one whole triangle leaves it unchanged: one flat direction per component, two here. An h that varies inside a component makes Ψ curve up. Float mirror; angles in units of π, derivatives in radians. One instance, not a proof.',input=table('Input by paper label',['θ/π','h'],range(6).map(i=>String(i+1)),range(6).map(j=>[f4(a[j]??0),f4(h[j]??0)]));
 if(!admissible(f,a)){
  const bad=es.filter(e=>!(1e-9<gap(a,e)&&gap(a,e)<pi-1e-9)),why=d=>d<=0?' ≤ 0':d>=pi?' ≥ 1':' within the numerical margin';
  return view('Not admissible: '+join(bad.map(e=>`δ(${edge(e)})/π = ${f4(gap(a,e)/pi)}`+why(gap(a,e))),'; ')+' ✗',ctx,[input]);
 }
 const q=qform(f,a,h),consts=comps.map(c=>c.every(i=>(h[i]??0)===(h[c[0]??0]??0))),constant=consts.every(Boolean),qc=comps.map(c=>sum(es.filter(e=>c.includes(e[0])).map(e=>cot(gap(a,e))*dh(h,e)*dh(h,e)))),compOf=i=>compName(comps.find(c=>c.includes(i))??[]),varying=comps.filter((_,j)=>!consts[j]).map(compName),head=constant?`Q(h) = ${f4(q)}: h is constant on each component, so Ψ is flat along h`:`Q(h) = ${f4(q)} > 0: h varies inside ${join(varying,' and ')}, so Ψ curves up`;
 return view(head+check(near(q,0)===constant),ctx,[input,table('Components',['h on it','h constant on it','Σ δ/π of its edges','Q from its edges'],comps.map(compName),comps.map((c,j)=>[fs(c.map(i=>h[i]??0)),consts[j]?'yes':'no',f4(sum(es.filter(e=>c.includes(e[0])).map(e=>gap(a,e)))/pi),f4(qc[j])])),table('Crossing edges',['component','δ/π','cot δ','Δh','cot δ · Δh²'],es.map(edge),es.map(e=>[compOf(e[0]),f4(gap(a,e)/pi),f4(cot(gap(a,e))),f4(dh(h,e)),f4(cot(gap(a,e))*dh(h,e)*dh(h,e))]))]);
}
function bend(d,s){if(s===0)return 0;const N=64,k=1/N,l0=logSin(d);return k/3*sum(range(N+1).map(j=>{const x=j*k,w=6*x*(1-x),c=j===0||j===N?1:j%2===0?2:4;return w===0?0:c*(logSin(d+s*(3*x*x-2*x*x*x))-l0)*s*w;}));}
export function bendData(f,a,h){
 if(!admissible(f,a))return {adm:false,tlo:0,thi:0,curve:[],quad:[],q:0,clipped:false};
 let tl=-0.5,th=0.5;for(const e of f.edges){const d=gap(a,e),s=dh(h,e);if(s>0){tl=Math.max(tl,-d/s);th=Math.min(th,(pi-d)/s);}else if(s<0){tl=Math.max(tl,(pi-d)/s);th=Math.min(th,-d/s);}}
 const m=0.000001,ts=range(61).map(j=>(tl+m)+(th-tl-2*m)*(j/60)),q=qform(f,a,h),ys=ts.map(t=>sum(f.edges.map(e=>bend(gap(a,e),t*dh(h,e))))),qs=ts.map(t=>q*t*t/2);
 return {adm:true,tlo:tl,thi:th,curve:ts.map((t,i)=>[t,ys[i]]),quad:ts.map((t,i)=>[t,qs[i]]),q,clipped:[...ys,...qs].some(y=>y>0.5)};
}
const legend=(x,y,c,s)=>[el('rect',{x:String(x),y:String(y-4),width:'9',height:'8',fill:c}),txt(x+13,y,s,10,'start')];
export function bendPic(d){
 if(!d.adm)return pic(340,24,[txt(170,12,'θ is not admissible: no bend is drawn',10,'middle','currentColor',true)]);
 const b=new Box(54,40,266,170,-0.5,0.5,-0.02,0.5),cap=l=>l.map(([t,y])=>[t,Math.min(y,0.5)]),marks=[d.tlo,d.thi].filter(t=>-0.5<t&&t<0.5).map(t=>{const [x]=b.pt([t,0]);return seg(x,b.y0,x,b.y0+b.h,orange,1,'3,3');}),note=(d.clipped?'clipped at 0.5; ':'')+(marks.length?'dashed: the chamber\'s edge on this line':'the same axes for every θ and h');
 return pic(340,286,[txt(170,14,'the bend of Ψ beyond its tangent, on fixed axes'),txt(170,28,'Ψ(θ + t h) − Ψ(θ) − t·DΨ(θ)[h], t from −0.5 to 0.5 radians',9,'middle','currentColor',true),...b.frame('t','bend'),...marks,b.series(cap(d.quad),orange,1.4,'4,3'),b.series(cap(d.curve),blue),b.dot([0,0],blue,3),...legend(40,238,blue,'the bend'),...legend(130,238,orange,'Q(h) t²/2, its quadratic part'),txt(170,256,`Q(h) = h·H(θ)h = ${f4(d.q)}`,10,'middle',blue),txt(170,272,note,9,'middle','currentColor',true)]);
}
export const twoComponents=(a,h)=>withPicture(twoView(a,h),bendPic(bendData(F(),a,h)));
