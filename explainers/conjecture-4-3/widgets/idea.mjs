import {analytic} from '../../cells/kernel.mjs';
import {PI,BASE,PRESETS,C,COVER,CYCLE_COLUMNS,sum,dot,maxAbs,lobachevsky,lineDomain,linePoint,lineValue,validDirection,inverseSlice,sliceGrid,stepData} from './analysis.mjs';

const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=x=>!Number.isFinite(x)?'undefined':Math.abs(x)<1e-14?'0':Math.abs(x)<1e-4?x.toExponential(3):x.toFixed(5).replace(/\.?0+$/,'');
const number=(x,key='')=>`<span class="iw-number"${key?` data-number="${esc(key)}" data-value="${x}"`:''}>${fmt(x)}</span>`;
const edge=e=>`${e[0]+1} → ${e[1]+1}`;
const colours=['var(--accent)','var(--inverse)'];
const gapColour=d=>d>1e-9&&d<PI-1e-9?`hsl(${215-175*d/PI} 65% 47%)`:'var(--iw-bad)';
const line=(x,y,X,Y,colour='var(--rule)',width=1,extra='')=>`<line x1="${x}" y1="${y}" x2="${X}" y2="${Y}" stroke="${colour}" stroke-width="${width}" ${extra}/>`;
const text=(x,y,s,extra='')=>`<text x="${x}" y="${y}" ${extra}>${esc(s)}</text>`;
const dotSvg=(x,y,r=4,colour='var(--accent)')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${colour}"/>`;
const svg=(title,body,w=560,h=320)=>`<svg class="iw-svg" role="img" aria-label="${esc(title)}" viewBox="0 0 ${w} ${h}"><title>${esc(title)}</title>${body}</svg>`;
const figure=(drawing,caption)=>`<figure class="iw-figure">${drawing}<figcaption>${caption}</figcaption></figure>`;
const table=(caption,heads,rows,cls='')=>`<table class="iw-table ${cls}"><caption>${caption}</caption><thead><tr>${heads.map(x=>`<th scope="col">${x}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map((x,j)=>j?`<td>${x}</td>`:`<th scope="row">${x}</th>`).join('')}</tr>`).join('')}</tbody></table>`;
const vector=(xs,name)=>`<div class="iw-vector"><strong>${name}</strong><ol>${xs.map((x,j)=>`<li><span>${j+1}</span> ${number(x,`${name}-${j}`)}</li>`).join('')}</ol></div>`;
const note=(s,bad=false)=>`<p class="iw-status${bad?' iw-invalid':''}" role="status">${s}</p>`;
const instructions=[
 'Move the angles to change the point; turn everything to test what stays fixed.',
 'Move t to slide the tangent, then tilt the bowl to find its bottom.',
 'Choose a necklace row and move the angles to watch its product become a sum.',
 'Move the angles and follow the logarithms through the row differences and relabelling.',
 'Move the gap through a right angle and compare the signed terms with their cycle sums.',
 'Set the target angles, then move the step slider to follow the numerical inverse.',
 'Move the angles to watch the potential and the negative volume sum move together.'
];
const sharedSteps=[1,3,4,5,7], mounted=new Map();
let angles=BASE.slice(), target=BASE.slice(), h=PRESETS[1].slice(), turn=0, direction=PRESETS[0].slice(), t=0, tilt=0, iteration=12;
let inverseCache=null;
function slider(id,label,min,max,value,step='any',kind='') {
 return `<div class="iw-slider"><label for="${id}">${label}</label><output for="${id}">${fmt(value)}</output><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${value}" data-kind="${kind}"></div>`;
}
function angleControls(n,hidden=false) {
 return `<p class="iw-small">${hidden?'Target θ*':'θ'}₁ / π = 0. ${hidden?'The search starts at fixed angles and matches y.':'Angles are shared with steps 1, 3, 4, 5 and 7.'}</p><div class="iw-controls">${[1,2,3,4].map(j=>slider(`iw-${n}-a-${j}`,`${hidden?'Target θ*':'θ'}<sub>${j+1}</sub> / π`,-.999,1.999,BASE[j],.001,`${hidden?'target':'angle'}-${j}`)).join('')}</div><button type="button" data-action="${hidden?'target-reset':'reset'}">Reset angles</button>`;
}
function controls(n) {
 let s=sharedSteps.includes(n)?angleControls(n):'';
 if(n===1) s+=slider('iw-turn','Turn everything / π',-1,1,turn,.001,'turn');
 if(n===2) s+=`<label class="iw-field">Direction h <select id="iw-direction"><option value="0">Move θ₃ · (0, 0, 1, 0, 0)</option><option value="1">Mixed · (0, 1, −0.5, 0.25, −0.75)</option><option value="2">Move θ₂ to θ₅ · (0, 1, 1, 1, 1)</option><option value="custom">Custom direction</option></select></label><div class="iw-custom" hidden><label for="iw-custom-h">Five entries of h, separated by commas</label><input id="iw-custom-h" type="text" value="0, 1, -0.5, 0.25, -0.75" spellcheck="false"><button type="button" data-action="custom">Use this direction</button><p class="iw-custom-status" role="status"></p></div><p class="iw-small">Base θ/π = (0, 0.1, 0.7, 0.3, 0.8). Here t and h are in radians, so dΨ/dt = G · h. A common turn is excluded from the directions.</p>${slider('iw-t','Position t (radians)',-.5,.5,0,'any','t')}${slider('iw-tilt','Tilt s',-4,4,0,.01,'tilt')}`;
 if(n===3) s+=slider('iw-row','Necklace row r',1,5,1,1,'row');
 if(n===5) s+=`${slider('iw-gap','Gap δ(2 → 3) / π',.00001,.69999,.6,'any','gap')}<p class="iw-small">This gap control moves θ₃ inside the admissible interval; 0.5 is a right angle. Reset the angles if the other gaps leave no admissible interval.</p><details open><summary>Direction h · h₁ = 0</summary><div class="iw-controls">${[1,2,3,4].map(j=>slider(`iw-h-${j}`,`h<sub>${j+1}</sub>`,-2,2,h[j],.01,`h-${j}`)).join('')}</div></details>`;
 if(n===6) s+=angleControls(n,true)+slider('iw-iteration','Newton step',0,12,12,1,'iteration');
 return s;
}
function admissibility(v) {
 const j=v.gaps.findIndex(d=>!(1e-9<d&&d<PI-1e-9));
 return j<0?note('Admissible: every gap is between 0 and π, with a numerical margin of 10⁻⁹ radians.'):
 note(`First violated gap: ${edge(C.edges[j])}, δ / π = ${number(v.gaps[j]/PI)}. It must lie between 0 and 1, with a numerical margin of 10⁻⁹ radians. Choose admissible angles to evaluate the logarithms.`,true);
}
function circleDrawing(a,v) {
 const point=(x,r=118)=>[170+r*Math.cos(2*PI*x-PI/2),170+r*Math.sin(2*PI*x-PI/2)];
 const pts=a.map(x=>point(x));
 let body='<circle cx="170" cy="170" r="118" fill="none" stroke="var(--rule)"/>';
 C.edges.forEach(([p,q],j)=>{body+=line(...pts[p],...pts[q],gapColour(v.gaps[j]),2.5,v.admissible?'':'stroke-dasharray="5 3"');});
 const used=[];
 a.forEach((x,j)=>{
  let z=point(x,139),r=139;
  while(used.some(p=>Math.hypot(p[0]-z[0],p[1]-z[1])<22)&&r<162) {r+=12;z=point(x,r);}
  used.push(z);body+=dotSvg(...pts[j],4,'var(--ink)')+line(...pts[j],...z)+text(...z,j+1,'text-anchor="middle" dominant-baseline="middle"');
 });
 return svg('Five points at angle 2θ with the seven crossing chords coloured by their lifted gaps',body,340,340);
}
function signedBars(values,labels,title,classes=[]) {
 const scale=Math.max(1e-12,...values.filter(Number.isFinite).map(Math.abs));
 return `<figure class="iw-bars"><figcaption>${title}</figcaption>${values.map((x,j)=>`<div class="iw-bar-row ${classes[j]??''}"><span>${labels[j]}</span><div class="iw-bar-track"><i style="left:${x<0?50-46*Math.abs(x)/scale:50}%;width:${46*Math.abs(x)/scale}%"></i></div>${number(x,`bar-${j}`)}</div>`).join('')}<p class="iw-small">Bars left of the centre are negative; bars right are positive.</p></figure>`;
}
function draw1() {
 const v=stepData(1,angles,{turn});
 return admissibility(v)+`<div class="iw-two">${figure(circleDrawing(angles.map(x=>x+turn),v),'Positions use 2θ around the circle. Small gaps are blue; gaps near π are gold. Red chords are invalid.')}${table('The seven lifted gaps',['Edge','δ / π'],C.edges.map((e,j)=>[edge(e),number(v.gaps[j]/PI,`gap-${j}`)]))}</div>`+
 (v.G?signedBars(v.shifted,C.window.map((_,j)=>`y<sub>${j+1}</sub>`),'The point: y = G(θ), in the gradient coordinates')+note(`Largest change in y after the common turn: ${number(v.turnError,'turn-error')}. θ₁ / π after turning: ${number(turn)}.`):note('The point is undefined outside the admissible angles.',true));
}
function curveDrawing(points,tangent,minimum) {
 const w=560,H=320,left=62,right=530,top=25,bottom=262;
 const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
 const xlo=Math.min(...xs),xhi=Math.max(...xs),ylo=Math.min(...ys),yhi=Math.max(...ys),pad=Math.max(.1,.1*(yhi-ylo));
 const X=x=>left+(right-left)*(x-xlo)/(xhi-xlo),Y=y=>bottom-(bottom-top)*(y-ylo+pad)/(yhi-ylo+2*pad);
 let b=line(left,top,left,bottom,'var(--muted)')+line(left,bottom,right,bottom,'var(--muted)');
 [0,.5,1].forEach(r=>{const x=xlo+(xhi-xlo)*r,y=ylo+(yhi-ylo)*r;b+=text(X(x),285,fmt(x),'text-anchor="middle"')+text(left-8,Y(y),fmt(y),'text-anchor="end"')+line(left,Y(y),right,Y(y));});
 b+=`<path d="${points.map((p,j)=>`${j?'L':'M'}${X(p[0])},${Y(p[1])}`).join(' ')}" fill="none" stroke="var(--accent)" stroke-width="2.5"/>`;
 const [x,y,slope]=tangent,dx=(xhi-xlo)*.075;
 b+=line(X(x-dx),Y(y-slope*dx),X(x+dx),Y(y+slope*dx),'var(--inverse)',3)+dotSvg(X(x),Y(y),4,'var(--inverse)');
 if(minimum)b+=dotSvg(X(minimum.t),Y(minimum.value),5,'var(--ok)');
 b+=text(295,310,'t · radians','text-anchor="middle"');
 return svg('Tilted potential along the admissible line, with its tangent and unique minimum',b,w,H);
}
function draw2() {
 const v=stepData(2,BASE,{h:direction,t,s:tilt});
 if(!v.domain) return note('Enter a direction that changes at least one gap.',true);
 const [lo,hi]=v.domain,pad=(hi-lo)*.0001;
 const points=Array.from({length:201},(_,j)=>{const x=lo+pad+(hi-lo-2*pad)*j/200;return [x,lineValue(BASE,direction,x,tilt)];});
 return figure(curveDrawing(points,[t,v.value,v.slope-tilt],v.minimum),'Blue: Ψ(θ + th) − st. Gold: tangent at t. Green: the bottom of the tilted curve. The graph stops just short of the open endpoints.')+
 `<dl class="iw-facts"><div><dt>Admissible t interval (radians)</dt><dd>(${number(lo,'line-lo')}, ${number(hi,'line-hi')})</dd></div><div><dt>Potential Ψ at t</dt><dd>${number(v.value+tilt*t,'line-potential')}</dd></div><div><dt>Slope of Ψ: G · h</dt><dd>${number(v.slope,'line-slope')}</dd></div><div><dt>Tilted slope: G · h − s</dt><dd>${number(v.slope-tilt,'tilted-slope')}</dd></div><div><dt>Tilted height: Ψ − st</dt><dd>${number(v.value,'line-height')}</dd></div><div><dt>Minimizing t, where G · h = s</dt><dd>${v.minimum?number(v.minimum.t,'line-minimum'):'Beyond the numerical margin'}</dd></div></dl>`;
}
function necklaceDrawing(chosen) {
 let body='';
 for(let j=0;j<5;j++)body+=text(85+45*j,27,j+1,'text-anchor="middle"');
 C.necklace.forEach((row,r)=>{
  const y=57+39*r;
  if(r===chosen)body+=`<rect x="15" y="${y-16}" width="310" height="32" fill="var(--code-bg)" rx="3" stroke="var(--inverse)"/>`;
  body+=text(43,y+5,`I${r+1}`,'text-anchor="middle"');
  for(let j=0;j<5;j++)body+=`<circle cx="${85+45*j}" cy="${y}" r="7" fill="${row.includes(j)?r===chosen?'var(--inverse)':'var(--accent)':'var(--surface)'}" stroke="${row.includes(j)?'none':'var(--rule)'}"/>`;
 });
 return svg('The five necklace rows as membership dots, with the chosen row outlined',body,340,240);
}
function draw3() {
 const v=stepData(3,angles),r=Number(mounted.get(3).querySelector('[data-kind="row"]').value)-1;
 const rows=C.necklace.map((row,j)=>[`I<sub>${j+1}</sub>${r===j?' ← chosen':''}`,row.map(x=>x+1).join(', '),`Remove ${j+1}, insert ${C.window[j]}`]);
 let s=admissibility(v)+figure(necklaceDrawing(r),'Columns are labels 1 to 5; a filled dot means the label belongs to that necklace row. Gold marks the chosen row.')+table('The necklace: labels in each row',['Row','Labels','Next row'],rows);
 if(!v.necklace)return s;
 const {logs,terms,ell}=v.necklace;
 return s+signedBars(terms[r],C.edges.map(edge),`The seven terms in necklace row ${r+1}`,terms[r].map(x=>x<0?'iw-negative':''))+table(`Logarithm of twisted necklace minor ${r+1} · row sum ℓ<sub>${r+1}</sub>`,['Edge','Exponent M','log(2 sin δ)','Term'],C.edges.map((e,j)=>[edge(e),C.M[r][j],number(logs[j],`log-${j}`),number(terms[r][j],`term-${j}`)]))+
 note(`The logarithm of the minor’s magnitude is the sum of these seven terms: ℓ<sub>${r+1}</sub> = ${number(ell[r],'row-sum')}. Zero exponents contribute zero. Signs disappear when taking the magnitude.`);
}
function matrix(name,A,columns) {
 return table(name,['',...columns],A.map((r,j)=>[j+1,...r.map(x=>`<span class="iw-m${x<0?'neg':x>0?'pos':'zero'}">${x}</span>`)]),'iw-matrix');
}
function gradientDrawing(p,g) {
 const scale=180/Math.max(1e-12,...p.map(Math.abs),...g.map(Math.abs)),zero=300;
 let body=line(zero,24,zero,230,'var(--muted)')+text(zero,250,'0','text-anchor="middle"');
 for(let j=0;j<5;j++) {
  const y=38+39*j;
  body+=text(45,y+9,`y${j+1}`);
  [p[j],g[j]].forEach((x,k)=>{
   const end=zero+x*scale;
   body+=`<rect x="${Math.min(zero,end)}" y="${y+k*12}" width="${Math.max(.5,Math.abs(x*scale))}" height="8" fill="${k?'var(--inverse)':'var(--accent)'}"/>`;
  });
 }
 return svg('Paired signed bars comparing PDℓ in blue with G in gold for each of the five labels',body,560,265);
}
function draw4() {
 const v=stepData(4,angles);let s=admissibility(v);
 if(v.necklace) {
  const {ell,differences,relabelled,error}=v.necklace;
  s+=figure(gradientDrawing(relabelled,v.G),'Blue bars are PDℓ; gold bars are G. The matched pairs show that both calculations give the same coordinates. Left of zero is negative.')+`<div class="iw-vectors">${vector(ell,'ℓ')}${vector(differences,'Dℓ')}${vector(relabelled,'PDℓ')}${vector(v.G,'G')}</div>`+
  note(`Largest difference between PDℓ and G: ${number(error,'matrix-error')}. Row differences are next row minus current row, including row 5 back to row 1. Relabelling reads the difference at σ⁻¹ of each label. Balanced degrees cancel the constant log 2.`);
 }
 return s+`<details><summary>The four matrices · M, D, P and B</summary><p class="iw-small">Columns of M and B are edges, in the order shown. D acts on necklace rows; P relabels them as graph labels. PDM = B.</p><div class="iw-matrices">${matrix('M · necklace exponents',C.M,C.edges.map(e=>edge(e)))}${matrix('D · next row minus current row',C.D,[1,2,3,4,5])}${matrix('P · inverse relabelling',C.P,[1,2,3,4,5])}${matrix('B · head minus tail',C.B,C.edges.map(e=>edge(e)))}</div></details>`;
}
function cycleDrawing(c,colour) {
 const p=j=>[110+78*Math.cos(j*2*PI/5-PI/2),110+78*Math.sin(j*2*PI/5-PI/2)];
 let b='<circle cx="110" cy="110" r="78" fill="none" stroke="var(--rule)"/>';
 c.forEach((j,k)=>b+=line(...p(j),...p(c[(k+1)%c.length]),colour,2.5));
 for(let j=0;j<5;j++) {const z=p(j);b+=dotSvg(...z,4,c.includes(j)?colour:'var(--rule)')+text(110+(z[0]-110)*1.22,110+(z[1]-110)*1.22,j+1,'text-anchor="middle" dominant-baseline="middle"');}
 return svg('Winding-one cycle '+c.map(x=>x+1).join(', '),b,220,220);
}
function draw5() {
 const v=stepData(5,angles,{h});let s=admissibility(v);
 if(!v.admissible)return s+note('Choose admissible angles to compare cycle curvature sums.',true);
 s+=signedBars(v.terms,C.edges.map(edge),'Signed edge terms: cot δ · (h at head − h at tail)²',v.terms.map(x=>x<0?'iw-negative':''));
 s+=`<div class="iw-two">${COVER.map((c,k)=>`<div>${figure(cycleDrawing(c,colours[k]),`Cycle ${k+1}: ${[...c,c[0]].map(x=>x+1).join(' → ')}<br>Gap sum / π = ${number(sum(CYCLE_COLUMNS[k].map(j=>v.gaps[j]))/PI)}`)}${signedBars(CYCLE_COLUMNS[k].map(j=>v.terms[j]),CYCLE_COLUMNS[k].map(j=>edge(C.edges[j])),`Terms in cycle ${k+1}`,CYCLE_COLUMNS[k].map(j=>v.terms[j]<0?'iw-negative':''))}${note(`Cycle ${k+1} curvature sum: ${number(v.cycles[k],`cycle-${k}`)}`)}</div>`).join('')}</div>`;
 s+=table('Each edge contribution',['Edge','cot δ','Δh','Term'],C.edges.map(([p,q],j)=>[edge([p,q]),number(v.weights[j],`cot-${j}`),number(h[q]-h[p]),number(v.terms[j],`curvature-${j}`)]));
 return s+note(`Sum of both cycles: ${number(v.total,'curvature-total')}. Matrix value hᵀHh: ${number(v.Q,'curvature-matrix')}. Negative edge terms are marked in red and point left. On these admissible angles each cycle sum is non-negative.`);
}
// Marching triangles avoids ambiguous saddle cells. Cells touching the open
// boundary are omitted; the grey background means outside the sampled domain.
function contourSegments(grid,level) {
 const {size:n,values}=grid,segments=[];
 const xy=k=>[k%n,Math.floor(k/n)];
 function triangle(ids) {
  if(ids.some(k=>values[k]===null))return;
  const hits=[];
  for(let j=0;j<3;j++) {
   const p=ids[j],q=ids[(j+1)%3],a=values[p],b=values[q];
   if((a<level)!==(b<level)) {const t=(level-a)/(b-a),P=xy(p),Q=xy(q);hits.push([P[0]+t*(Q[0]-P[0]),P[1]+t*(Q[1]-P[1])]);}
  }
  if(hits.length===2)segments.push(hits);
 }
 for(let j=0;j<n-1;j++)for(let i=0;i<n-1;i++){const p=j*n+i;triangle([p,p+1,p+n+1]);triangle([p,p+n+1,p+n]);}
 return segments;
}
function contourDrawing(model,k) {
 const {geometry:g,grid,result}=model,{extent:e}=g;
 const X=x=>60+430*(x+e)/(2*e),Y=y=>260-230*(y+e)/(2*e);
 let b='<rect x="60" y="30" width="430" height="230" fill="var(--code-bg)"/>';
 const finite=grid.values.filter(x=>x!==null&&x>0).sort((a,b)=>a-b);
 const levels=[.03,.08,.16,.28,.45,.66,.86].map(q=>finite[Math.floor(q*(finite.length-1))]);
 const GX=x=>60+430*x/(grid.size-1),GY=y=>260-230*y/(grid.size-1);
 levels.forEach((v,j)=>{if(v===undefined)return;b+=`<path d="${contourSegments(grid,v).map(([p,q])=>`M${GX(p[0])},${GY(p[1])}L${GX(q[0])},${GY(q[1])}`).join(' ')}" fill="none" stroke="var(--accent)" stroke-opacity="${.35+.08*j}"/>`;});
 b+=line(X(-e),Y(0),X(e),Y(0),'var(--rule)')+line(X(0),Y(-e),X(0),Y(e),'var(--rule)');
 b+=`<polyline points="${g.points.slice(0,k+1).map(([x,y])=>`${X(x)},${Y(y)}`).join(' ')}" fill="none" stroke="var(--inverse)" stroke-width="2"/>`;
 g.points.slice(0,k+1).forEach(([x,y],j)=>b+=dotSvg(X(x),Y(y),j===k?5:2.5,'var(--inverse)'));
 b+=dotSvg(X(0),Y(0),5,'var(--ok)')+text(X(0)+9,Y(0)-9,'θ*')+text(X(g.points[0][0])-8,Y(g.points[0][1])+20,'start','text-anchor="end"');
 [-e,0,e].forEach(x=>{b+=text(X(x),282,fmt(x),'text-anchor="middle"')+text(52,Y(x),fmt(x),'text-anchor="end"');});
 b+=text(280,308,'u offset · units of π','text-anchor="middle"')+text(15,145,'v','text-anchor="middle"');
 return svg(`Level sets of Ψ − y·θ on a plane through θ*, with the projected Newton path through step ${k}`,b,560,320);
}
function draw6() {
 const key=target.join(',');
 if(inverseCache?.key!==key) {
  const v=stepData(6,target),geometry=inverseSlice(target,v.result);
  inverseCache={key,...v,geometry,grid:geometry?sliceGrid(target,geometry):null};
 }
 const v=inverseCache;let s=admissibility(v);
 if(!v.result)return s+note('The target needs admissible angles before the inverse can start.',true);
 const r=v.result,k=iteration,final=r.iterates.at(-1),error=maxAbs(final.map((x,j)=>x-target[j]));
 s+=vector(r.target,'Target y')+figure(contourDrawing(v,k),'Contours are computed here from Ψ − y·θ. Green is θ*. Gold shows the full Newton iterates projected onto this plane; the numerical search itself uses all four free angles.')+
 note(`Step ${k}: largest coordinate residual = ${number(r.residuals[k],'inverse-residual')}. ${k?`Damping used: ${number(r.damping[k-1],'inverse-damping')}.`:'Start: θ/π = (0, 0.2, 0.4, 0.6, 0.8).'} Distance of this iterate from the drawn plane / π: ${number(v.geometry.offPlane[k],'off-plane')}.`)+
 table('Target and recovered angles · units of π',['Label','Target θ* / π',`Step ${k} / π`,'Final / π'],target.map((x,j)=>[j+1,number(x,`target-${j}`),number(r.iterates[k][j],`iterate-${j}`),number(final[j],`recovered-${j}`)]))+
 note(`Final angle error / π: ${number(error,'inverse-error')}. Final residual: ${number(r.residuals.at(-1),'inverse-final')}. Steps are accepted only inside the admissible chamber and when they reduce the residual; a zero damping repeats the previous iterate.`);
 s+=`<details><summary>Residual and damping at every step</summary>${table('Twelve damped Newton steps',['Step','Largest residual','Damping'],r.residuals.map((x,j)=>[j,number(x),j?number(r.damping[j-1]):'start']))}</details><details><summary>The plane through θ*</summary><p class="iw-small">θ / π = θ* / π + uU + vV. U points from the target toward the start. V is perpendicular to U; both keep θ₁ = 0. Offsets use the ordinary Euclidean distance in θ/π.</p>${table('Orthonormal directions of the drawn plane',['Label','U','V'],v.geometry.u.map((x,j)=>[j+1,number(x),number(v.geometry.v[j])]))}</details>`;
 return s;
}
function volumeDrawing(v) {
 const X=x=>58+450*x/PI,Y=y=>145-170*y;
 const pts=Array.from({length:241},(_,j)=>[j*PI/240,lobachevsky(j*PI/240)]);
 let b=line(58,Y(0),508,Y(0),'var(--muted)')+line(58,30,58,260,'var(--muted)');
 b+=`<path d="${pts.map(([x,y],j)=>`${j?'L':'M'}${X(x)},${Y(y)}`).join(' ')}" fill="none" stroke="var(--accent)" stroke-width="2.5"/>`;
 [0,.25,.5,.75,1].forEach(x=>b+=text(X(x*PI),285,fmt(x),'text-anchor="middle"'));
 [-.4,0,.4].forEach(y=>b+=text(48,Y(y),fmt(y),'text-anchor="end"'));
 if(v.values) {
  const groups=[];
  v.gaps.forEach((x,j)=>{
   const prior=groups.find(g=>Math.abs(g.x-x)<1e-10);
   if(prior)prior.labels.push(j+1);else groups.push({x,y:v.values[j],labels:[j+1]});
  });
  const placed=[];
  groups.forEach(({x,y,labels})=>{
   const label=labels.join(', '),width=label.length*8,lx=Math.max(58+width/2,Math.min(508-width/2,X(x)));
   const offsets=[-14,22,-32,40,-50,58,-68,76,-86,94,-104,112];
   const candidates=offsets.map(d=>Y(y)+d).filter(ly=>18<=ly&&ly<=264);
   const ly=candidates.find(ly=>!placed.some(p=>Math.abs(p.y-ly)<17 && Math.abs(p.x-lx)<(p.width+width)/2+4))??candidates[0];
   placed.push({x:lx,y:ly,width});
   b+=line(X(x),Y(0),X(x),Y(y),gapColour(x),1.5)+dotSvg(X(x),Y(y),4,gapColour(x))+line(X(x),Y(y),lx,ly+4,'var(--rule)',.6)+text(lx,ly,label,'text-anchor="middle"');
  });
 }
 b+=text(280,310,'gap δ / π','text-anchor="middle"')+text(85,24,'Λ(δ)');
 return svg('Lobachevsky function, with the seven edge gaps marked and numbered',b,560,320);
}
function draw7() {
 const v=stepData(7,angles);let s=admissibility(v)+figure(volumeDrawing(v),'Λ(x) = − integral from 0 to x of log|2 sin t| dt. The numbers identify the seven edges in the table; equal gaps share a marker with all their edge numbers.');
 if(!v.values)return s;
 return s+table('Seven gaps and their Lobachevsky values',['Edge number','Edge','δ / π','Λ(δ)'],C.edges.map((e,j)=>[j+1,edge(e),number(v.gaps[j]/PI),number(v.values[j],`volume-${j}`)]))+
 `<dl class="iw-facts"><div><dt>Potential Ψ(θ)</dt><dd>${number(v.potential,'potential')}</dd></div><div><dt>Negative volume sum −ΣΛ(δ)</dt><dd>${number(v.negativeVolume,'negative-volume')}</dd></div><div><dt>Difference Ψ − (−ΣΛ)</dt><dd>${number(v.difference,'volume-difference')}</dd></div><div><dt>Constant: 1.5 π log 2</dt><dd>${number(v.constant,'volume-constant')}</dd></div></dl>`+
 note(`The difference stays at 3.26638: seven edges and two winding-one cycles give (7/2 − 2)π log 2. Numerical discrepancy: ${number(Math.abs(v.difference-v.constant),'volume-error')}.`);
}
const drawers=[null,draw1,draw2,draw3,draw4,draw5,draw6,draw7];
function setSlider(input,value) {
 input.value=String(value);input.closest('.iw-slider').querySelector('output').textContent=fmt(Number(input.value));
}
function sync() {
 for(const [n,panel] of mounted) {
  for(const input of panel.querySelectorAll('input[type="range"]')) {
   const kind=input.dataset.kind;
   if(kind.startsWith('angle-'))setSlider(input,angles[Number(kind.slice(6))]);
   else if(kind.startsWith('target-'))setSlider(input,target[Number(kind.slice(7))]);
   else if(kind.startsWith('h-'))setSlider(input,h[Number(kind.slice(2))]);
   else if(kind==='turn')setSlider(input,turn);
   else if(kind==='iteration')setSlider(input,iteration);
   else if(kind==='t')setSlider(input,t);
   else if(kind==='tilt')setSlider(input,tilt);
  }
 }
 const gap=mounted.get(5)?.querySelector('[data-kind="gap"]');
 if(gap) {
  const d=lineDomain(angles,PRESETS[0],.00001*PI);
  gap.disabled=!d;
  if(d) {gap.min=String(angles[2]-angles[1]+d[0]/PI);gap.max=String(angles[2]-angles[1]+d[1]/PI);setSlider(gap,angles[2]-angles[1]);}
 }
}
function render(steps=[1,2,3,4,5,6,7]) {
 sync();
 for(const n of steps) {
  const panel=mounted.get(n);if(!panel)continue;
  const result=panel.querySelector('.iw-result');
  const open=[...result.querySelectorAll('details')].map(e=>e.open);
  result.innerHTML=drawers[n]();
  [...result.querySelectorAll('details')].forEach((e,j)=>{if(open[j])e.open=true;});
  panel.dataset.revision=String(Number(panel.dataset.revision??0)+1);
 }
}
function updateLine() {
 const d=lineDomain(BASE,direction),input=mounted.get(2).querySelector('[data-kind="t"]');
 if(d) { const pad=(d[1]-d[0])*.0001;input.min=d[0]+pad;input.max=d[1]-pad;t=Math.max(Number(input.min),Math.min(Number(input.max),t)); }
 render([2]);
}
function handleInput(event) {
 const input=event.target;if(input.type!=='range')return;
 const kind=input.dataset.kind,value=Number(input.value);
 input.closest('.iw-slider').querySelector('output').textContent=fmt(value);
 if(kind.startsWith('angle-')) {angles[Number(kind.slice(6))]=value;render(sharedSteps);}
 else if(kind.startsWith('target-')) {target[Number(kind.slice(7))]=value;render([6]);}
 else if(kind.startsWith('h-')) {h[Number(kind.slice(2))]=value;render([5]);}
 else if(kind==='turn'){turn=value;render([1]);}
 else if(kind==='t'){t=value;render([2]);}
 else if(kind==='tilt'){tilt=value;render([2]);}
 else if(kind==='row')render([3]);
 else if(kind==='gap'){angles[2]=angles[1]+value;render(sharedSteps);}
 else if(kind==='iteration'){iteration=value;render([6]);}
}
function handleClick(event) {
 const action=event.target.closest('[data-action]')?.dataset.action;
 if(action==='reset'){angles=BASE.slice();render(sharedSteps);}
 if(action==='target-reset'){target=BASE.slice();render([6]);}
 if(action==='custom') {
  const panel=mounted.get(2),raw=panel.querySelector('#iw-custom-h').value.trim();
  const entries=raw.split(',').map(x=>x.trim()),v=entries.map(Number),status=panel.querySelector('.iw-custom-status');
  if(entries.some(x=>!x)||!validDirection(v)){status.textContent='Enter five finite numbers between −100 and 100, separated by commas, with at least two different entries.';return;}
  direction=v;t=0;status.textContent='Custom direction applied.';updateLine();
 }
}
for(let n=1;n<=7;n++) {
 const host=document.querySelector(`[data-widget="step${n}"]`);if(!host)continue;
 const fallback=host.querySelector('img')?.getAttribute('src');
 const panel=document.createElement('div');panel.className='iw';panel.dataset.step=String(n);
 panel.innerHTML=`<p class="iw-instruction">${instructions[n-1]}</p>${controls(n)}<div class="iw-result" aria-live="off"></div>${fallback?`<a class="iw-static" href="${esc(fallback)}">Drawn by Lean · static picture</a>`:''}`;
 mounted.set(n,panel);
 panel.addEventListener('input',handleInput);panel.addEventListener('click',handleClick);
 // Each static figure stays in place until that widget has rendered successfully.
 try {panel.querySelector('.iw-result').innerHTML=drawers[n]();host.replaceChildren(panel);host.dataset.mounted='true';}
 catch(error) {mounted.delete(n);console.error(`Step ${n} could not start`,error);}
}
const select=mounted.get(2)?.querySelector('#iw-direction');
select?.addEventListener('change',()=>{
 const custom=select.value==='custom';mounted.get(2).querySelector('.iw-custom').hidden=!custom;
 if(!custom){direction=PRESETS[Number(select.value)].slice();t=0;updateLine();}
});
if(mounted.has(2))updateLine();
sync();
