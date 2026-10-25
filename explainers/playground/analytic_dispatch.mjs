import {f4,fs,smallTable,node,withPicture} from './core.mjs';
import {fixed,cell} from './combinatorial.mjs';
import {necklace,recover} from './analytic.mjs';
import {admissible,gauge,plus,pi,dot,mul,hess,grad,sub,determinant} from './analytic_math.mjs';
import * as V from './analytic_views.mjs';
import * as F4 from './fig4.mjs';
import * as F5 from './fig5.mjs';
import * as F6 from './fig6.mjs';
import * as H from './hypotheses.mjs';
import * as C from './curv_extra.mjs';
import {bendData,bendPic} from './curvature.mjs';
import captions from './captions.mjs';
export function evaluateAnalytic(id,v){
 if(id==='ComponentShift')return C.componentShift(v.angles,v.shift);
 if(id==='SevenCellWitness')return C.sevenWitness(v.anchors);
 if(id==='RoundTrip')return C.roundTrip(v.angles);
 const mode=id.replace(/^item_/,''),a=v.angles,h=v.direction??[0,0,1,0,0];
 if(mode==='S46')return withPicture(V.primitiveAt(v.u),F4.s46(v.u));
 if(mode==='S50')return withPicture(V.balance(v.n,v.window),F4.s50(cell(v.n,v.window)));
 if(mode==='S69')return withPicture(V.witnessAt(v.anchor),F6.s69(v.anchor));
 let out,picture;
 if(mode==='S47'){out=V.guarded(a,h,mode,()=>V.openness(a,h));picture=F4.s47(a,h);}
 else if(['S48','S49','S51','S52','S63','S65'].includes(mode)){
  out=V.guarded(a,h,mode,()=>V.rawAnalytic(a,h,mode),mode==='S52');
  if(mode==='S48')picture=C.both(F4.s48(a,h),bendPic(bendData(fixed(),a,h)));
  else if(mode==='S49')picture=C.both(F4.s49(a,h),C.s49Cycles(a));
  else picture=({S51:F4.s51,S52:F4.s52,S63:F6.s63,S65:F6.s65})[mode](a,h);
 }else if(['S53','S54','S55','S56','S57','S58','S59','S60','S61','S64','S66'].includes(mode)){
  out=V.guarded(a,h,mode,()=>V.focus(a,h,mode),['S54','S55','S56','S59'].includes(mode));
  picture=mode==='S53'?C.both(F5.s53(a,h),C.s53Gauge(a)):mode==='S64'?F6.s64(a):mode==='S66'?F6.s66(a):F5['s'+mode.slice(1)](a,h);
 }else if(mode==='H2'){out=V.guarded(a,h,mode,()=>V.preimage(a));picture=H.h2Picture(a);}
 else{
  out=V.guarded(a,h,mode,()=>V.model(a,h,mode));
  picture=mode==='H1'||mode==='H3'?H.sensPicture(a,h,mode==='H3'):mode==='H4'?H.h4Picture(a):F6['s'+mode.slice(1)](a);
 }
 out=withPicture(out,picture);
 const ok=admissible(a),segOK=()=>ok&&admissible(plus(a,gauge(h),0.02));
 let note,at=3,show=ok;
 if(mode==='S48')return C.withNode(ok,out,C.cycleTable(a,h,C.partitionA));
 if(mode==='S54'){
  const v=gauge(h),y=plus(a,v,0.02),q=b=>pi*pi*dot(v,mul(hess(b),v));show=segOK();
  if(show)note=[`The direction: h = ${fs(h)} and v = h − h₁·1 = ${fs(v)}, so v₁ = 0 (the gauge projection; with several crossing components one subtracts each component's anchor value on that component). The step 0.02 is in units of π: y/π = x/π + 0.02·v, that is y = x + 0.02π·v.`,`Why Ψ dips below its chord: along θ(t) = x + πt·v, d²/dt² Ψ(θ(t)) = π² vᵀH(θ(t))v > 0 for v ≠ 0 (S53); here it is ${f4(q(a))} at x and ${f4(q(y))} at y. A positive second derivative puts Ψ below the chord on [x, y]. S48 shows the same convexity from the other side: Ψ above its tangent.`];
 }else if(mode==='S55'){
  const v=gauge(h),y=plus(a,v,0.02);show=segOK();if(show){const dphi=pi*dot(sub(grad(y),grad(a)),v);note=[`Notation: v = h − h₁·1 = ${fs(v)}, θ(t) = x + πt·v with t in units of π, φ(t) = Ψ(θ(t)), and the plotted slope (g in the picture) is φ′(t) = π G(θ(t))·v. With y = θ(0.02): (G(y) − G(x))·(y − x) = 0.02 (φ′(0.02) − φ′(0)) = 0.02 × ${f4(dphi)} = ${f4(0.02*dphi)}.`,captions.chain];}
 }else if(mode==='S56'){show=segOK();note=[captions.chain+captions.withS56Note[0],captions.withS56Note[1]];}
 else if(mode==='S57'&&ok){const det4=determinant(hess(a).slice(1).map(r=>r.slice(1))),det2=F5.s57Data(a).det;note=[`Dimensions: here the slice θ₁ = const has dimension 4 (five labels, one crossing component), and the theorem's reduced Jacobian is the 4×4 matrix H without label 1's row and column, det ${f4(det4)} in radians. The picture shows a 2-D section of it: J is the 2×2 matrix of derivatives of (G·v, G·u) in (s, t) on the plane of labels 3 and 2, with s and t in units of π, det ${f4(det2)}.`];}
 else if(['S58','S60','S65','S70','H1','H2','H3'].includes(mode)){note=captions['with'+mode+'Note'];if(mode==='S65'||mode==='S70')at=2;}
 else if(mode==='S67'||mode==='S68')note=[...captions['with'+mode+'Note'],captions.hlogBoundary];
 else if(mode==='H4'&&ok){const z=necklace(a),z1=z[0],N=z.map(x=>x-z1),pdz=recover(z),pdN=recover(N),G=grad(a);return C.withNode(ok,out,node('div',[C.noteNode([`A normalized necklace: with z = M_N λ(θ) and N_r = z_r − z₁, H4 holds with the nonzero constant c(θ) = −z₁ = ${f4(0-z1)}. Projective necklace coordinates are defined only up to a common scale, and dividing by the first minor is this normalization in logarithms. S63 removes the constant: P_f D kills constant vectors, so P D N = P D z = G.`]),smallTable('The constant H4 allows, and S63 removes',['z = M_N λ','N = z − z₁·1','P D z','P D N','G = B ℓ'],['1','2','3','4','5'],z.map((_,r)=>[z[r],N[r],pdz[r],pdN[r],G[r]].map(f4)))]));}
 return note?C.withNode(show,out,C.noteNode(note),at):out;
}
