import {cell, parseWindow, partition, cycleEdges, winding, pairName, range, mod, multiply, analytic, inverse, RUNNING} from './kernel.mjs';

const $ = id => document.getElementById(id);
const colours = ['var(--accent)','var(--inverse)','var(--ok)','#b35d97','#9473cc','#8b891f','#279eab','#d65d5d','#7d8fa4'];
const colour = i => colours[i%colours.length];
const lab = x => x+1;
const edgeText = ([p,q]) => `${p+1} → ${q+1}`;
const fmt = x => !Number.isFinite(x) ? 'undefined' : Math.abs(x)<1e-13 ? '0' : Number(x.toPrecision(6)).toString();
const esc = x => String(x).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
let C, cover, pairIndex=0, columnIndex=0, rowIndex=0, serial=0;
let a=[0,0.1,0.7,0.3,0.8], h=[0,1,-0.5,0.25,-0.75];
const point = (fraction,r=136,cx=200,cy=200) => [cx+r*Math.sin(2*Math.PI*fraction), cy-r*Math.cos(2*Math.PI*fraction)];
const at = (slot,n,r=136) => point(slot/(5*n),r);
const line = (a,b,stroke='var(--accent)',width=2,extra='') => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${stroke}" stroke-width="${width}" ${extra}/>`;
const circle = (p,r,fill,stroke='none',extra='') => `<circle cx="${p[0]}" cy="${p[1]}" r="${r}" fill="${fill}" stroke="${stroke}" ${extra}/>`;
const text = (p,s,extra='') => `<text x="${p[0]}" y="${p[1]}" ${extra}>${esc(s)}</text>`;
function svg(title,body,w=400,height=400) {
  const id=`svg-title-${serial++}`;
  return `<svg viewBox="0 0 ${w} ${height}" role="img" aria-labelledby="${id}"><title id="${id}">${esc(title)}</title>${body}</svg>`;
}
const figure = (title,drawing,caption='') => `<figure><h3>${title}</h3>${drawing}${caption?`<figcaption>${caption}</figcaption>`:''}</figure>`;
function arrow(a,b,stroke='var(--accent)',width=2,cut=0,extra='') {
  const id=`arrow-${serial++}`, dx=b[0]-a[0], dy=b[1]-a[1], len=Math.hypot(dx,dy);
  if (len<1e-8) return '';
  const s=cut/len, start=[a[0]+s*dx,a[1]+s*dy], end=[b[0]-s*dx,b[1]-s*dy];
  return `<defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="${stroke}"/></marker></defs>${line(start,end,stroke,width,`marker-end="url(#${id})" ${extra}`)}`;
}
function table(title,headers,rows,{classes='',rowheads=true}={}) {
  return `<div class="scroll-table ${classes}" tabindex="0" role="region" aria-label="${esc(title)}"><table><caption>${title}</caption><thead><tr>${headers.map(x=>`<th scope="col">${x}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map((x,j)=>j===0 && rowheads?`<th scope="row">${x}</th>`:`<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function empty(s) { return `<p class="empty">${s}</p>`; }
function boundaryDrawing({pair=null,marks=false}={}) {
  const n=C.window.length, m=5*n;
  let body=circle([200,200],136,'none','var(--rule)');
  for (let k=0;k<m;k++) body+=line(at(k,n,133),at(k,n,139),'var(--rule)',1);
  const chosen=marks?C.edges[columnIndex]:null;
  const active=pair??chosen;
  for (let x=0;x<n;x++) {
    const hot=!active || active.includes(x), col=pair?(x===pair[0]?'var(--inverse)':'var(--accent)'):colour(x);
    body+=`<g opacity="${hot?1:0.18}">${arrow(at(C.entry[x],n),at(C.exit[x],n),col,hot&&active?3:1.7,4)}<title>Strand into ${x+1}: entry ${C.entry[x]} to exit ${C.exit[x]}</title></g>`;
  }
  for (let x=0;x<n;x++) {
    const hot=!active || active.includes(x), col=pair?(x===pair[0]?'var(--inverse)':'var(--accent)'):colour(x);
    body+=`<g opacity="${hot?1:0.25}">${circle(at(C.entry[x],n),4,col,col,'class="endpoint"')}${circle(at(C.exit[x],n),4,'var(--surface)',col,'class="endpoint"')}${text(at(C.entry[x],n,156),`${x+1}⁺`, 'class="halo"')}${text(at(C.exit[x],n,156),`${x+1}⁻`, 'class="halo"')}</g>`;
    body+=text(at(5*x+2.5,n,185),x+1,'style="font-size:15px;font-weight:600;fill:var(--muted)"');
  }
  body+=text([200,20],'clockwise ↻','style="font-size:12px;fill:var(--muted)"');
  if(marks && C.edges.length) {
    const placed=[];
    for(let j=0;j<C.edges.length;j++) {
      const [p,q]=C.edges[j], z=intersection(at(C.entry[p],n),at(C.exit[p],n),at(C.entry[q],n),at(C.exit[q],n));
      let label=[z[0],z[1]-15];
      for(let k=0;k<80 && placed.some(v=>Math.hypot(v[0]-label[0],v[1]-label[1])<20);k++) {
        label=[z[0]+(18+2*k)*Math.sin(k*2.4), z[1]+(18+2*k)*Math.cos(k*2.4)];
        label=label.map(v=>Math.max(35,Math.min(365,v)));
      }
      placed.push(label);
      const hot=j===columnIndex, col=hot?'var(--inverse)':'var(--muted)';
      body+=line(z,label,col,0.8)+circle(z,hot?4:2.2,col)+circle(label,9,'var(--surface)',col)+text(label,j+1,`style="font-size:10px;fill:${col};font-weight:${hot?700:400}"`);
    }
  }
  return svg(pair?`Strands ${pair.map(lab).join(' and ')} and their four endpoints`:'Boundary circle, filled entries and open exits on 5n positions',body);
}
function intersection(a,b,c,d) {
  const dx=b[0]-a[0],dy=b[1]-a[1],ex=d[0]-c[0],ey=d[1]-c[1], den=dx*ey-dy*ex;
  if(Math.abs(den)<1e-10) return [(a[0]+b[0])/2,(a[1]+b[1])/2];
  const t=((c[0]-a[0])*ey-(c[1]-a[1])*ex)/den;
  return [a[0]+t*dx,a[1]+t*dy];
}
function graphDrawing(es=C.edges,{cycle=null,index=0}={}) {
  const n=C.window.length;
  let body=circle([200,200],136,'none','var(--rule)');
  for(const e of es) {
    const col=cycle?colour(index):C.inverse[e[0]]===e[1]?'var(--inverse)':'var(--accent)';
    body+=arrow(point(e[0]/n),point(e[1]/n),col,cycle?3:1.8,12);
  }
  for(let x=0;x<n;x++) {
    const active=!cycle || cycle.includes(x), coloop=C.window[x]===x+1;
    body+=circle(point(x/n),active?7:4,coloop?'var(--surface)':active?'var(--ink)':'var(--rule)','var(--ink)');
    body+=text(point(x/n,160),x+1,`style="font-size:16px;fill:${active?'var(--ink)':'var(--muted)'}"`);
  }
  return svg(cycle?`Cycle ${cycle.map(lab).join(' to ')} and back to ${cycle[0]+1}`:`Directed crossing graph: ${es.map(edgeText).join(', ')||'no edges'}`,body);
}
function drawBoundary() {
  const n=C.window.length;
  $('boundary-output').innerHTML=`<div class="two-up">${figure('Strands on 5n positions',boundaryDrawing(),'Filled = entry <i>b</i><sup>+</sup>; open = exit <i>b</i><sup>−</sup>. The endpoint’s number is the strand’s exit label; the outer numbers name boundary blocks.')}${figure('Directed crossing graph',graphDrawing(),'An arrow is a pair of crossing strands. Bronze means σ<sup>−1</sup>(<i>p</i>) = <i>q</i>; a hollow graph node is a coloop.')}</div><details><summary>Exact endpoint positions</summary>${table('Positions, counted from 0 on the 5n circle',['Label x','σ⁻¹(x)','Entry position','Exit position'],range(n).map(x=>[x+1,C.inverse[x]+1,C.entry[x],C.exit[x]]))}</details>`;
}
function drawPair() {
  const pair=C.pairs[pairIndex];
  if(!pair) { $('pair-output').innerHTML=empty('One label has no unordered pair to inspect.'); return; }
  const [p,q,pq,qp,ud,du]=pair, n=C.window.length;
  const endpoints=[{x:p,sign:'+',pos:C.entry[p]},{x:q,sign:'+',pos:C.entry[q]},{x:p,sign:'−',pos:C.exit[p]},{x:q,sign:'−',pos:C.exit[q]}].sort((a,b)=>a.pos-b.pos);
  // Start the cyclic order at p's entry, as the defining predicates do.
  const k=endpoints.findIndex(e=>e.x===p && e.sign==='+'), order=[...endpoints.slice(k),...endpoints.slice(0,k)];
  $('pair-output').innerHTML=`<div class="two-up">${figure(`Pair {${p+1}, ${q+1}}`,boundaryDrawing({pair:[p,q]}))}<div><div class="callout"><strong>${esc(pairName(pair))}</strong><p>Clockwise from the filled entry of ${p+1}:</p><p class="math">${order.map(e=>`${e.x+1}<sup>${e.sign}</sup>`).join(' → ')} → ${p+1}<sup>+</sup></p></div>${table('The four clockwise steps',['From','To','Positions advanced'],order.map((e,i)=>[`${e.x+1}<sup>${e.sign}</sup> @ ${e.pos}`,`${order[(i+1)%4].x+1}<sup>${order[(i+1)%4].sign}</sup> @ ${order[(i+1)%4].pos}`,mod(order[(i+1)%4].pos-e.pos,5*n)]))}<p class="note">${pq||qp?'The two entries precede the two exits in the directed crossing order.':ud?'The entry and exit of p, then the entry and exit of q, occur clockwise.':du?'The entry and exit of p, then the entry and exit of q, occur counterclockwise.':'The endpoints are nested; neither crossing nor misalignment predicate holds.'}</p></div></div>`;
}
function arcDrawing(x) {
  const n=C.window.length,s=C.inverse[x], len=s===x?n:mod(x-s,n), r=68, cx=100,cy=100;
  const place=(v,rad=r)=>point(v/n,rad,cx,cy), col=colour(x);
  let body=circle([cx,cy],r,'none','var(--rule)');
  if(len===n) body+=circle([cx,cy],r,'none',col,'stroke-width="5"');
  else {
    const start=place(s),end=place(x), large=len>n/2?1:0;
    body+=`<path d="M${start.join(',')} A${r},${r} 0 ${large} 1 ${end.join(',')}" stroke="${col}" stroke-width="5" fill="none"/>`;
    body+=circle(start,5,'var(--surface)',col,'stroke-width="2"')+circle(end,5,col);
  }
  for(let row=0;row<n;row++) {
    const inside=C.necklace[row].includes(x), hot=row===rowIndex;
    body+=circle(place(row),hot?6:3,inside?col:'var(--surface)',hot?'var(--ink)':'var(--rule)',`stroke-width="${hot?2:1}"`);
    body+=text(place(row,86),row+1,`style="font-size:12px;font-weight:${hot?700:400}"`);
  }
  body+=text([100,94],s===x?'whole circle':`(${s+1}, ${x+1}]`,'style="font-size:16px"');
  body+=text([100,116],`x = ${x+1}`,'style="fill:var(--muted);font-size:12px"');
  return svg(`Rows containing label ${x+1}: ${C.necklace.flatMap((row,r)=>row.includes(x)?[r+1]:[]).join(', ')}${s===x?'; coloop, whole circle':''}`,body,200,200);
}
function drawNecklace() {
  const n=C.window.length;
  const rows=C.necklace.map((row,r)=>[`I<sub>${r+1}</sub>`, `<span class="membership">${row.map(x=>`<span class="${C.inverse[x]===x?'coloop':''}">${x+1}</span>`).join('')}</span>`,`Remove ${r+1}, insert ${C.window[r]}<br><span class="muted">→ I<sub>${(r+1)%n+1}</sub></span>`]);
  $('necklace-output').innerHTML=table('Grassmann necklace',['Row','Labels in the row','Step to the next row'],rows)+`<p class="note">Bronze frames mark coloops. The outlined dot in each circle marks row I<sub>${rowIndex+1}</sub>; coloured dots belong to the arc.</p><div class="arcs">${range(n).map(x=>figure(`Label ${x+1}`,arcDrawing(x),`I<sub>${rowIndex+1}</sub> ${C.necklace[rowIndex].includes(x)?'contains':'does not contain'} ${x+1}${C.inverse[x]===x?' · coloop':''}`)).join('')}</div>`;
  $('necklace-output').querySelectorAll('tbody tr')[rowIndex]?.classList.add('selected');
}
function drawColumns() {
  if(!C.edges.length) { $('columns-output').innerHTML=empty('This cell has no crossings, so M and B have zero columns.'); return; }
  $('columns-output').innerHTML=`<div class="two-up">${figure('Column numbers at strand crossings',boundaryDrawing({marks:true}),'Each small dot is the true intersection; a short leader connects it to its column number. The selected pair is highlighted.')}<div class="column-buttons">${C.edges.map((e,j)=>`<button type="button" data-column="${j}" aria-pressed="${j===columnIndex}"><b>${j+1}</b> ${edgeText(e)}</button>`).join('')}</div></div>`;
  $('columns-output').querySelectorAll('[data-column]').forEach(b=>b.addEventListener('click',()=>chooseColumn(Number(b.dataset.column))));
}
function matrix(name,A,rows,cols,{compare=null,highlight=false}={}) {
  return `<div class="scroll-table matrix" tabindex="0" role="region" aria-label="${name} matrix"><table><caption>${name}</caption><thead><tr><th scope="col">row</th>${cols.map((c,j)=>`<th scope="col" class="${highlight&&j===columnIndex?'selected':''}">${c}</th>`).join('')}</tr></thead><tbody>${A.map((row,r)=>`<tr><th scope="row">${rows[r]}</th>${row.map((v,j)=>`<td ${compare?`data-equal="${v===compare[r][j]}"`:''} class="${compare&&v!==compare[r][j]?'mismatch':highlight&&j===columnIndex?'selected':''}">${v}</td>`).join('')}${!cols.length?'<td class="muted">∅</td>':''}</tr>`).join('')}</tbody></table></div>`;
}
function drawMatrices() {
  const n=C.window.length, ls=range(n).map(lab), rs=range(n).map(r=>`I${r+1}`), js=C.edges.map((e,j)=>`${j+1}: ${edgeText(e)}`);
  const eq=C.B.every((row,r)=>row.every((v,j)=>v===C.PDM[r][j]));
  const dm=multiply(C.D,C.M);
  let walk=empty('There is no column to walk: the equality holds for the two empty n × 0 matrices.');
  if(C.edges.length) walk=table(`Column ${columnIndex+1}: ${edgeText(C.edges[columnIndex])}, from M to B`,['Row r / label x','Mᵣ','(DM)ᵣ = Mᵣ₊₁ − Mᵣ','σ⁻¹(x)','(PDM)ₓ','Bₓ'],ls.map((x,r)=>[x,C.M[r][columnIndex],dm[r][columnIndex],C.inverse[r]+1,C.PDM[r][columnIndex],C.B[r][columnIndex]]));
  $('matrices-output').innerHTML=`<div class="callout ${eq?'good':'bad'}" id="matrix-verdict" data-equal="${eq}"><strong>${eq?'PDM = B':'PDM differs from B'}</strong> · ${n*C.edges.length} integer entries compared${!C.edges.length?' (zero columns)':''}.</div><div class="matrix-grid"><div>${matrix('M · necklace exponents',C.M,rs,js,{highlight:true})}</div><div>${matrix('D · cyclic forward difference',C.D,rs,rs)}</div><div>${matrix('P · inverse relabelling',C.P,ls,rs)}</div><div>${matrix('B · head minus tail',C.B,ls,js,{highlight:true})}</div><div>${matrix('PDM · compare with B',C.PDM,ls,js,{compare:C.B,highlight:true})}</div><div><h3>Walk the chosen column</h3><p class="note">The first three columns use necklace row <i>r</i>. The last three use label <i>x</i>: read the difference at σ<sup>−1</sup>(<i>x</i>) to get the relabelled value.</p>${walk}</div></div>`;
}
function drawCycles() {
  const n=C.window.length;
  const pictures=cover.length?`<div class="three-up">${cover.map((c,i)=>figure(`Cycle ${i+1}`,graphDrawing(cycleEdges(c),{cycle:c,index:i}),`<span style="color:${colour(i)}">${[...c,c[0]].map(lab).join(' → ')}</span><br>Advances ${cycleEdges(c).map(([p,q])=>mod(q-p,n)).join(' + ')} = ${winding(c,n)}; winding = ${winding(c,n)/n}.`)).join('')}</div>`:empty('There are no edges to partition. The empty list of cycles covers the empty crossing graph.');
  $('cycles-output').innerHTML=pictures+table('Degree balance at every label',['Label','In-degree','Out-degree','Balance'],range(n).map(x=>{const indeg=C.edges.filter(e=>e[1]===x).length, outdeg=C.edges.filter(e=>e[0]===x).length; return [x+1,indeg,outdeg,indeg===outdeg?'equal':'unequal'];}))+`<p class="note" id="cover-verdict">${C.edges.length} crossing edges used once in ${cover.length} winding-one cycle${cover.length===1?'':'s'}. A cell can have more than one such partition.</p>`;
}
function chooseColumn(j) {
  columnIndex=j; $('column-select').value=String(j); drawColumns(); drawMatrices();
}
function angleColour(d) { return d>0&&d<Math.PI?`hsl(${215-175*d/Math.PI} 65% 50%)`:'var(--bad)'; }
function drawAngles(v) {
  let body=circle([200,200],136,'none','var(--rule)');
  const pts=a.map(x=>point(x));
  C.edges.forEach(([p,q],j)=>{const d=v.gaps[j], valid=d>1e-9&&d<Math.PI-1e-9;body+=line(pts[p],pts[q],valid?angleColour(d):'var(--bad)',valid?2.5:3.5,valid?'':'stroke-dasharray="5 4"');});
  const used=[];
  a.forEach((x,j)=>{
    let z=point(x,159), r=159;
    while(used.some(p=>Math.hypot(p[0]-z[0],p[1]-z[1])<23) && r<190) { r+=15; z=point(x,r); }
    used.push(z); body+=circle(pts[j],5,'var(--ink)')+line(pts[j],z,'var(--rule)',1)+text(z,j+1,'style="font-size:16px"');
  });
  const bad=v.gaps.filter(d=>!(d>1e-9&&d<Math.PI-1e-9)).length;
  $('angles-output').innerHTML=`<div class="callout ${v.admissible?'good':'bad'}" id="admissibility" data-admissible="${v.admissible}"><strong>${v.admissible?'Admissible':'Not numerically admissible'}</strong> · ${bad?`${bad} gap${bad===1?' is':'s are'} outside the safe interval (10⁻⁹, π − 10⁻⁹).`:'Every gap lies strictly between 0 and π, away from the numerical boundary.'}</div><div class="two-up">${figure('Circle angles 2θ',svg('Running example: the five angle points and crossing chords coloured by lifted gap',body),'Chord colour runs from blue for a small positive gap toward gold near π. Red dashed chords fail the admissibility check; angles are entered in units of π.')}${table('Lifted gap on each crossing edge',['Edge','δ / π','δ, radians'],C.edges.map((e,j)=>[edgeText(e),`<span style="color:${angleColour(v.gaps[j])}">${fmt(v.gaps[j]/Math.PI)}</span>`,fmt(v.gaps[j])]))}</div>`;
}
function drawCurvature(v) {
  if(!range(4).every(k=>$(`direction-${k+1}`).validity.valid)) {
    $('curvature-output').innerHTML=empty('Enter a direction value between −100 and 100 to calculate the cotangent terms.');
    return;
  }
  const max=Math.max(1,...v.terms.filter(Number.isFinite).map(Math.abs)), w=560, zero=290, scale=145/max;
  let bars=line([zero,12],[zero,38*C.edges.length+12],'var(--muted)',1);
  C.edges.forEach((e,j)=>{
    const y=30+j*38, term=v.terms[j], len=Number.isFinite(term)?term*scale:0;
    const ci=cover.findIndex(c=>cycleEdges(c).some(f=>f[0]===e[0]&&f[1]===e[1]));
    bars+=text([42,y],edgeText(e),'style="font-size:14px"')+`<rect x="${Math.min(zero,zero+len)}" y="${y-10}" width="${Math.max(.7,Math.abs(len))}" height="20" fill="${colour(ci)}"/>`+text([510,y],fmt(term),'style="font-size:12px"');
  });
  const chart=svg('Signed cotangent contributions: bars to the left are negative, bars to the right are positive',bars,w,38*C.edges.length+30);
  const terms=table('Cotangent contribution, edge by edge',['Edge','cot δ','h_q − h_p','cot δ · (h_q − h_p)²'],C.edges.map(([p,q],j)=>[edgeText([p,q]),fmt(v.weights[j]),fmt(h[q]-h[p]),fmt(v.terms[j])]));
  $('curvature-output').innerHTML=`${!v.admissible?'<p class="callout bad">Outside the admissible chamber: these are formal cotangent values. The Hessian positivity conclusion does not apply; singular terms are undefined.</p>':''}<div class="two-up"><figure class="signed-bars"><h3>Signed edge contributions</h3>${chart}<figcaption>The colours group edges by the two cycles drawn above. A negative edge term need not make a cycle’s sum negative.</figcaption></figure>${terms}</div><div class="cycle-sums">${v.cycles.map((s,i)=>`<p style="border-color:${colour(i)}">Cycle ${i+1}: <strong>${fmt(s)}</strong><br><span class="muted">Σ δ / π = ${fmt(cycleEdges(cover[i]).reduce((s,[p,q])=>s+a[q]-a[p]+Number(q<p),0))}</span></p>`).join('')}</div><div class="callout ${v.admissible?'good':''}" id="quadratic-total" data-total="${v.total}"><span class="math">Σ<sub>e</sub> cot(δ<sub>e</sub>)(h<sub>q</sub> − h<sub>p</sub>)² = <strong>${fmt(v.total)}</strong></span><p>Matrix calculation hᵀHh = ${fmt(v.Q)} · difference ${fmt(v.Q-v.total)}.</p></div>`;
}
function drawInverse(v) {
  if(!v.admissible) { $('inverse-output').innerHTML=empty('Choose admissible angles to define G(θ) and run the inverse. Logarithms are not evaluated outside the chamber.'); return; }
  const result=inverse(a), {iterates,residuals,damping,target}=result;
  const logs=residuals.map(r=>Math.log10(Math.max(1e-16,r))), lo=Math.min(-1,...logs)-.5, hi=Math.max(0,...logs)+.5;
  const place=(j,l)=>[55+490*j/12,40+185*(hi-l)/(hi-lo)];
  let body=line([55,28],[55,230],'var(--muted)',1)+line([55,230],[550,230],'var(--muted)',1);
  for(let i=0;i<4;i++){const l=hi-(hi-lo)*i/3,y=place(0,l)[1];body+=line([55,y],[550,y],'var(--rule)',1)+text([26,y],`10^${l.toFixed(0)}`,'style="font-size:10px"');}
  body+=`<polyline points="${logs.map((l,j)=>place(j,l).join(',')).join(' ')}" stroke="var(--accent)" fill="none" stroke-width="2"/>`;
  logs.forEach((l,j)=>{body+=circle(place(j,l),3,'var(--accent)')+text([place(j,l)[0],248],j,'style="font-size:11px"');});
  body+=text([300,277],'Newton step · residual in max norm (log scale)','style="font-size:12px;fill:var(--muted)"');
  const final=iterates.at(-1), error=Math.max(...a.map((x,j)=>Math.abs(x-final[j])));
  $('inverse-output').innerHTML=`<p class="formula-line">Target y = (${target.map(fmt).join(', ')})</p><div class="callout good"><strong>Final residual ${fmt(residuals.at(-1))}</strong> · angle error ${fmt(error)} in units of π.<p>A step is accepted only if it stays inside the numerical chamber and reduces the residual.</p></div>${figure('Residual along the iterates',svg('Residual versus Newton step, logarithmic vertical scale',body,600,300),'Full Newton steps are halved up to fifteen times. A damping value of 0 means no candidate improved the residual, so the iterate repeats. Residuals below 10⁻¹⁶ share the plot floor.')}${table('Twelve damped Newton steps on the slice θ₁ = 0',['Step','θ₁/π','θ₂/π','θ₃/π','θ₄/π','θ₅/π','Residual','Damping'],iterates.map((x,j)=>[j,...x.map(fmt),fmt(residuals[j]),j?fmt(damping[j-1]):'start']))}`;
}
function drawAnalytic() {
  const running=C.window.join(',')===RUNNING.join(',');
  $('analytic-content').hidden=!running; $('analytic-unavailable').hidden=running;
  if(!running) return;
  const v=analytic(a,h); drawAngles(v); drawCurvature(v); drawInverse(v);
}
function setAngles(values) {
  a=values.slice();
  for(let j=1;j<5;j++) { $(`theta-${j}`).value=String(a[j]); $(`theta-value-${j}`).value=a[j].toFixed(3); }
  drawAnalytic();
}
function setupAnalyticControls() {
  $('angle-controls').innerHTML=range(4).map(k=>{const j=k+1;return `<div class="slider"><label for="theta-${j}">θ<sub>${j+1}</sub> / π</label><output id="theta-value-${j}" for="theta-${j}">${a[j].toFixed(3)}</output><input id="theta-${j}" type="range" min="-0.25" max="1.5" step="0.005" value="${a[j]}"></div>`;}).join('');
  $('direction-controls').innerHTML='<span>Direction h, in radians: h<sub>1</sub> = 0</span>'+range(4).map(k=>{const j=k+1;return `<label for="direction-${j}">h<sub>${j+1}</sub><input id="direction-${j}" type="number" min="-100" max="100" step="any" value="${h[j]}"></label>`;}).join('');
  for(let j=1;j<5;j++) {
    $(`theta-${j}`).addEventListener('input',e=>{a[j]=Number(e.target.value);$(`theta-value-${j}`).value=a[j].toFixed(3);drawAnalytic();});
    $(`direction-${j}`).addEventListener('input',e=>{
      const value=e.target.valueAsNumber, valid=Number.isFinite(value)&&Math.abs(value)<=100;
      e.target.setCustomValidity(valid?'':'Use a finite number between −100 and 100.');
      e.target.setAttribute('aria-invalid',String(!valid));
      if(valid) h[j]=value;
      drawCurvature(analytic(a,h));
    });
  }
}
function loadWindow(input,historyMode='push') {
  // Clear stale pictures first, including when an invalid input is entered.
  $('results').hidden=true; $('input-error').hidden=true;
  $('window').removeAttribute('aria-invalid');
  try {
    const w=parseWindow(input);
    C=cell(w); cover=partition(C); pairIndex=0; columnIndex=0; rowIndex=0;
    $('window').value=w.join(',');
    if(historyMode!=='none') {
      const url=new URL(location.href); url.searchParams.set('w',w.join(','));
      history[`${historyMode}State`]({},'',url);
    }
    $('summary').innerHTML=[['n',w.length,'labels'],['k',C.rank,'rank · labels in every necklace row'],['edges',C.edges.length,'directed crossings'],['coloops',C.inverse.filter((s,x)=>s===x).length,'coloops']].map(([key,value,label])=>`<div class="fact" data-fact="${key}" data-value="${value}"><strong>${value}</strong><span>${label}</span></div>`).join('');
    $('pair-select').innerHTML=C.pairs.map(([p,q],i)=>`<option value="${i}">{${p+1}, ${q+1}}</option>`).join('')||'<option>No pair</option>';
    $('pair-select').disabled=!C.pairs.length;
    $('row-select').innerHTML=w.map((_,r)=>`<option value="${r}">I${r+1}</option>`).join('');
    $('column-select').innerHTML=C.edges.map((e,j)=>`<option value="${j}">${j+1}: ${edgeText(e)}</option>`).join('')||'<option>No crossing</option>';
    $('column-select').disabled=!C.edges.length;
    document.querySelectorAll('[data-window]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.window===w.join(','))));
    drawBoundary(); drawPair(); drawNecklace(); drawColumns(); drawMatrices(); drawCycles(); drawAnalytic();
    $('status').textContent=`Window (${w.join(', ')}): ${w.length} labels, rank ${C.rank}, ${C.edges.length} crossing edges. Pictures updated.`;
    $('results').hidden=false;
  } catch(error) {
    $('window').setAttribute('aria-invalid','true'); $('input-error').textContent=error.message; $('input-error').hidden=false;
    $('status').textContent='No pictures drawn. Correct the window to continue.';
    document.querySelectorAll('[id$="-output"]').forEach(e=>{e.innerHTML='';});
    if(historyMode!=='none') {
      const url=new URL(location.href);url.searchParams.set('w',String(input)); history[`${historyMode}State`]({},'',url);
    }
  }
}
$('window-form').addEventListener('submit',e=>{e.preventDefault();loadWindow($('window').value);});
$('window').addEventListener('input',()=>loadWindow($('window').value,'replace'));
document.querySelectorAll('[data-window]').forEach(b=>b.addEventListener('click',()=>loadWindow(b.dataset.window)));
$('pair-select').addEventListener('change',e=>{pairIndex=Number(e.target.value);drawPair();});
$('row-select').addEventListener('change',e=>{rowIndex=Number(e.target.value);drawNecklace();});
$('column-select').addEventListener('change',e=>chooseColumn(Number(e.target.value)));
$('angle-reset').addEventListener('click',()=>setAngles([0,0.1,0.7,0.3,0.8]));
$('angle-outside').addEventListener('click',()=>setAngles([0,...a.slice(1,4),1.2]));
window.addEventListener('popstate',()=>loadWindow(new URLSearchParams(location.search).get('w')??RUNNING,'none'));
const dark=()=>document.documentElement.dataset.theme?document.documentElement.dataset.theme==='dark':matchMedia('(prefers-color-scheme:dark)').matches;
const themeLabel=()=>{$('theme').textContent=dark()?'Light theme':'Dark theme';};
$('theme').addEventListener('click',()=>{document.documentElement.dataset.theme=dark()?'light':'dark';themeLabel();});
matchMedia('(prefers-color-scheme:dark)').addEventListener('change',themeLabel);
themeLabel(); setupAnalyticControls();
loadWindow(new URLSearchParams(location.search).get('w')??RUNNING,'replace');
