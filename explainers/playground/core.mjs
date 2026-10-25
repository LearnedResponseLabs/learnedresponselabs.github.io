// Formatting and Html constructors follow the reading edition's definitions.
export const range=n=>Array.from({length:n},(_,i)=>i);
export const sum=xs=>xs.reduce((a,b)=>a+b,0);
export const mod=(a,n)=>((a%n)+n)%n;
export const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export const join=(xs,sep=', ')=>xs.join(sep);
export const nums=xs=>join(xs);
export const vec=xs=>'('+nums(xs)+')';
export const set=xs=>'{'+nums([...new Set(xs)].sort((a,b)=>a-b))+'}';
export const edge=([p,q])=>`${p+1}→${q+1}`;
export const pair=([p,q])=>`{${p+1}, ${q+1}}`;
export const edges=es=>es.length?join(es.map(edge)):'∅';
export const pairList=es=>es.length?join(es.map(pair)):'∅';
export const paper=xs=>xs.map(x=>x+1);
export const mark=b=>b?'holds ✓':'fails ✗';
export const truth=b=>b?'holds':'fails';
export const check=b=>b?' ✓':' ✗';
export const near=(x,y)=>Math.abs(x-y)<0.00002;
export const node=(t,c=[],a={})=>({t,a,c});
export const html=value=>({kind:'html',value});
export const table=(title,columns,labels,rows)=>({title,columns,labels,rows});
export const facts=(title,rows)=>table(title,['Value'],rows.map(x=>x[0]),rows.map(x=>[x[1]]));
export const trimNum=s=>s.includes('.')?s.replace(/0+$/,'').replace(/\.$/,''):s;
// Lean Float.toString uses fixed six decimals; Float JSON uses eight decimals in scientific form.
export const num=x=>Number.isNaN(x)?'NaN':x===Infinity?'inf':x===-Infinity?'-inf':(Object.is(x,-0)?'-':'')+x.toFixed(6);
export const dec2=x=>{const c=Math.floor(Math.abs(x)*100+0.5);return (x<0&&c!==0?'-':'')+(c/100).toFixed(2).replace(/\.?0+$/,'').replace(/^$/,'0');};
export function f4(x){
 if(x===0)return '0';if(!Number.isFinite(x))return num(x);
 const sign=x<0?'−':'',a=Math.abs(x),e=Math.floor(Math.log(a)/Math.log(10)),rounded=Math.floor(a*Math.pow(10,3-e)+0.5);
 if(e< -3||e>4)return sign+trimNum(num(rounded/1000))+'e'+e;
 if(e>=3)return sign+String(rounded*10**(e-3));
 const decimals=3-e,digits=String(rounded).padStart(decimals+1,'0'),whole=digits.slice(0,-decimals),frac=digits.slice(-decimals).replace(/0+$/,'');
 return sign+whole+(frac?'.'+frac:'');
}
export const fs=xs=>vec(xs.map(f4));
export const signedSum=xs=>xs.length?String(xs[0])+xs.slice(1).map(x=>x<0?' − '+(-x):' + '+x).join(''):'0';
export function pretty(j){
 if(typeof j==='string'){
  if(j==='true'||j==='false')return mark(j==='true');
  try{const p=JSON.parse(j);if(Array.isArray(p))return pretty(p);if(typeof p==='number')return j.includes('.')?f4(p):j;}catch{}
  return /^\d+>\d+$/.test(j)?j.replace('>','→'):j;
 }
 if(Array.isArray(j))return vec(j.map(pretty));if(typeof j==='boolean')return mark(j);if(typeof j==='number')return f4(j);return JSON.stringify(j);
}
export function prettyAt(label,v){
 let parsed=v;if(typeof v==='string'){try{parsed=JSON.parse(v);}catch{}}
 const entries=Array.isArray(parsed)?parsed:[];
 if(label.includes('edge')||label.includes('crossing')||label.includes('inversions')){
  if(entries.length&&entries.every(x=>Array.isArray(x)&&x.length===2))return join(entries.map(x=>pretty(x[0])+'→'+pretty(x[1])));
 }else if(label==='components'&&entries.length)return join(entries.map(x=>'{'+join(x.map(pretty))+'}'),'; ');
 return pretty(v);
}
export const shortLabel=s=>({'central derivative of potential along h':'finite difference','central derivative of gradient along h':'gradient difference','minimum gap margin (radians)':'gap margin (rad)','safe sup-norm radius (radians)':'safe radius (rad)','admissible (numerical margin > 1e-9 radians)':'admissible','finite sampled targets have the displayed preimages':'preimages found','finite sampled image size (distinct points)':'image size','component count / kernel dimension predicted by the theorem':'component count','full sum minus crossing sum':'full − crossing','N is inclusion: N(Meas(theta))':'N(Meas θ)'})[s]??s;
export function smallTable(title,columns,labels,rows){return node('table',[node('caption',[title]),node('tr',['',...columns].map(x=>node('th',[x]))),...labels.slice(0,rows.length).map((lab,i)=>node('tr',[node('th',[lab]),...rows[i].map(x=>node('td',[x]))]))]);}
export function renderTable(t){
 const title=pretty(t.title),cols=t.columns.map(pretty),labs=t.labels.map(pretty);
 return smallTable(title,cols.map(shortLabel),labs.map(x=>shortLabel(title==='All unordered pair columns'?x.replace(/^(.*?)→(.*?)$/,'{$1, $2}'):x)),t.rows.map((r,i)=>r.map((v,j)=>prettyAt(cols[j]==='Value'?labs[i]:cols[j],v))));
}
export const view=(headline,context,ts=[])=>html(node('div',[node('p',[node('strong',[headline])]),node('p',[context]),...ts.map(renderTable)]));
export const withPicture=(out,pic)=>out.kind==='html'?{...out,value:{...out.value,c:[...out.value.c.slice(0,2),node('div',[pic]),...out.value.c.slice(2)]}}:out;
export const ctx='One instance, not a proof. Float comparisons use tolerance 2e-5; derivatives use radians.';
export const floatCtx='Float mirror; angles in units of π, derivatives in radians. One instance, not a proof.';
export const synCtx=ctx+' Synthetic necklace-log image; no Grassmannian measurement is computed. Finite samples do not establish continuity or global surjectivity.';
