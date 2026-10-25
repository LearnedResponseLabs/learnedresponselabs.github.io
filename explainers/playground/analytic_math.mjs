import {range,sum} from './core.mjs';
import {fixed} from './combinatorial.mjs';
import {mirrorLogSin,mirrorSin,mirrorCos} from './precise_math.mjs';
import {pi,gap,gaps,admissible,logSin,cot,sub,dot,maxAbs,potential} from './analytic.mjs';
export {pi,gap,gaps,admissible,logSin,cot,sub,dot,maxAbs,potential};
export const grad=a=>fixed().B.map(r=>sum(fixed().edges.map((e,j)=>r[j]*mirrorLogSin(gap(a,e)))));
// S49 subtracts gradients only 2e-5 radians apart; a libm/V8 ulp can become 1e-11.
export const differenceGrad=a=>fixed().B.map(r=>sum(fixed().edges.map((e,j)=>r[j]*mirrorLogSin(gap(a,e)))));
export const hess=a=>{const F=fixed(),weights=F.edges.map(e=>{const d=gap(a,e);return mirrorCos(d)/mirrorSin(d);});return F.B.map(r=>F.B.map(s=>sum(F.edges.map((e,j)=>r[j]*weights[j]*s[j]))));};
export const mul=(M,h)=>M.map(r=>dot(r,h));
export const plus=(a,h,t)=>a.map((x,i)=>x+t*h[i]);
export const scaleF=(c,a)=>a.map(x=>c*x);
export const add=(a,b)=>a.map((x,i)=>x+b[i]);
export const gauge=h=>h.map(x=>x-(h[0]??0));
export const unit=j=>range(5).map(i=>i===j?1:0);
export const norm=v=>Math.sqrt(dot(v,v));
export const grid=(lo,hi,k)=>range(k+1).map(j=>lo+(hi-lo)*j/k);
export const minL=x=>Math.min(x[0]??0,...x),maxL=x=>Math.max(x[0]??0,...x);
export function primN(N,u){const h=(u-pi/2)/N;return h/3*sum(range(N+1).map(j=>(j===0||j===N?1:j%2===0?2:4)*logSin(pi/2+j*h)));}
export const dh=(h,[p,q])=>(h[q]??0)-(h[p]??0);
export const admissibleC=(f,a)=>f.edges.every(e=>1e-9<gap(a,e)&&gap(a,e)<pi-1e-9);
export const hessC=(f,a)=>range(f.window.length).map(r=>range(f.window.length).map(s=>sum(f.edges.map((e,j)=>f.B[r][j]*cot(gap(a,e))*f.B[s][j]))));
export const gradC=(f,a)=>f.B.map(r=>sum(f.edges.map((e,j)=>r[j]*logSin(gap(a,e)))));
export const qform=(f,a,h)=>sum(f.edges.map(e=>cot(gap(a,e))*dh(h,e)*dh(h,e)));
export function tWindow(f,a,h,lo,hi){let tl=lo,th=hi;for(const e of f.edges){const d=gap(a,e),s=dh(h,e);if(s>0){tl=Math.max(tl,-d/s);th=Math.min(th,(pi-d)/s);}else if(s<0){tl=Math.max(tl,(pi-d)/s);th=Math.min(th,-d/s);}}return [tl,th];}
export function solve(A,b){if(!A.length||!b.length)return [];const row=A[0],pivot=row[0]??1,reduced=A.slice(1).map(r=>sub(r.slice(1),row.slice(1).map(x=>x*((r[0]??0)/pivot)))),rhs=A.slice(1).map((r,i)=>b[i+1]-(r[0]??0)*b[0]/pivot),tail=solve(reduced,rhs);return [(b[0]-dot(row.slice(1),tail))/pivot,...tail];}
export const determinant=A=>!A.length?1:sum(A[0].map((x,j)=>(j%2===0?1:-1)*x*determinant(A.slice(1).map(r=>[...r.slice(0,j),...r.slice(j+1)]))));
// Preserve the fixed 12 x 16 search, including the updated x after acceptance.
// The trace has the initial point and each of the twelve resulting points.
export function inverseTrace(target,anchor){let x=range(5).map(j=>anchor+j/5),out=[x];for(let i=0;i<12;i++){const H=hess(x),err=sub(grad(x),target),step=[0,...solve(H.slice(1).map(r=>r.slice(1)),err.slice(1))],old=maxAbs(err);let accepted=false;for(let k=0;k<16;k++){const y=plus(x,step,-1/(pi*Math.pow(2,k)));if(!accepted&&admissible(y)&&maxAbs(sub(grad(y),target))<old){x=y;accepted=true;}}out.push(x);}return out;}
export const inverseF=(target,anchor)=>inverseTrace(target,anchor).at(-1);
export function jacobiEig(M){const n=M.length,A=M.map(r=>r.slice());for(let i=0;i<60;i++){let off=0;for(let p=0;p<n;p++)for(let q=0;q<n;q++)if(p!==q)off+=A[p][q]*A[p][q];if(off<1e-24)break;for(let p=0;p<n;p++)for(let q=0;q<n;q++){const apq=A[p][q];if(p<q&&Math.abs(apq)>1e-300){const app=A[p][p],aqq=A[q][q],th=(aqq-app)/(2*apq),t=(th>=0?1:-1)/(Math.abs(th)+Math.sqrt(th*th+1)),c=1/Math.sqrt(t*t+1),s=t*c;for(let k=0;k<n;k++){const akp=A[k][p],akq=A[k][q];A[k][p]=c*akp-s*akq;A[k][q]=s*akp+c*akq;}for(let k=0;k<n;k++){const apk=A[p][k],aqk=A[q][k];A[p][k]=c*apk-s*aqk;A[q][k]=s*apk+c*aqk;}}}}return range(n).map(i=>A[i][i]).sort((a,b)=>a-b);}
