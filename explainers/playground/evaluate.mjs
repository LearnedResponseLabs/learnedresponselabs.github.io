import {html} from './core.mjs';
import * as C from './combinatorial.mjs';
import * as P from './pictures.mjs';
import * as A from './analytic.mjs';
import {evaluateExtension} from './extensions.mjs';
import {evaluateAnalytic} from './analytic_dispatch.mjs';
import {twoComponents} from './curvature.mjs';
export function evaluate(id,v){
 if(/^item_(S(4[6-9]|[56][0-9]|70)|H[1-4])$/.test(id)||['ComponentShift','SevenCellWitness','RoundTrip'].includes(id))return evaluateAnalytic(id,v);
 if(id==='TwoComponents')return twoComponents(v.angles,v.direction);
 if(id.startsWith('item_UF-'))return evaluateExtension(id,v);
 const F=()=>C.cell(v.n??(v.window?.length??5),v.window??[3,5,1,2,4]),mode=id.replace(/^item_/,'');
 if(id.startsWith('item_')&&/^(S\d+|INT\d+)$/.test(mode)){
  if(mode==='S16')return A.cotangent(v.alpha,v.diffs);
  if(mode==='S40')return A.cycleGaps(v.angles);
  if(mode==='S41')return A.rational(v.direction,v.weights);
  if(['S42','S43','S44','S45'].includes(mode))return A.focusAnalytic(v.angles,v.direction??[0,0,1,0,0],mode);
  if(mode==='S03')return C.endpoints(F());if(mode==='S04')return C.clockwise(v);
  if(['S01','S02','S11','S20','S21','S22','S23','S24','INT4'].includes(mode))return C.finishCell(F(),mode);
  if(['S32','S33','S34','S35','S36','S39'].includes(mode))return C.cycle(v.n,v.cycle,mode);
  if(mode==='S37')return C.partitionView(F(),v.cover);if(mode==='S38')return C.cover(v.cycle,v.cover,mode);
  if(/^(S(0[5-9]|1[02345789]|19|2[5-9]|3[01])|INT[123])$/.test(mode))return C.focusCell(F(),mode);
 }
 if(id.startsWith('D01_boundary')||id.startsWith('D02_boundary'))return html(P.boundaryPicture(F()));
 if(id==='D03_necklace_EX02')return html(P.necklaceTable(F()));
 if(id==='CrossingCount')return {kind:'text',value:String(F().edges.length)};
 if(id==='D05_matrices_EX01'||id==='D06_matrices_EX02'){
  const f=C.requireNecklace(F()),which=v.matrix==='PDM'?'P*D*M':v.matrix;return {kind:'table',value:[['M',f.M],['P*D*M',f.PDM],['B',f.B]].filter(([name])=>which==='all'||which===name).map(([title,rows])=>({title,rows,columns:f.edges.map(([p,q])=>`${p+1}>${q+1}`),labels:f.window.map((_,i)=>i+1)})),equal:JSON.stringify(f.PDM)===JSON.stringify(f.B)};
 }
 if(id==='Angles')return html(P.anglePicture(C.fixed(),v.angles));
 throw Error('No browser implementation for '+id);
}
