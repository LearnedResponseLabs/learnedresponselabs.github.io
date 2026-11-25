export const CAPS={1:16,2:14,3:12,4:11,5:11};
export const COLORS=['#4a90d9','#e6550d','#31a354','#756bb1','#d62728','#17becf','#bcbd22','#e377c2','#8c564b','#1f77b4','#ff9896','#9edae5','#c49c94','#f7b6d2','#2ca02c','#ff7f0e','#9467bd','#aec7e8','#98df8a','#c5b0d5','#ffbb78'];
export function parseState(hash){
 const p=new URLSearchParams(hash.replace(/^#/,''));const k=Number(p.get('k')||2),n=Number(p.get('n')||5),tile=Number(p.get('tile')||1);
 if(!Number.isInteger(k)||!CAPS[k]||!Number.isInteger(n)||n<k+2||n>CAPS[k]||!Number.isInteger(tile)||tile<1||tile>10000)throw Error('Invalid family or tile in state link.');
 const vector=(key)=>{if(!p.has(key))return null;const s=p.get(key);if(s.length>1500)throw Error('State vector too long.');const v=s.split(',');if(v.length!==n||v.some(x=>!/^\+?(?:\d+(?:\.\d*)?|\.\d+)(?:\/\d+)?$/.test(x)||x.length>48))throw Error('Invalid rational vector in state link.');return v;};
 const view=p.get('view')||'raw';if(!['raw','scaled','coordinates'].includes(view))throw Error('Invalid projection in state link.');
 return {k,n,tile:tile-1,weights:vector('w'),t:vector('t'),view};
}
export function stateHash(s){const p=new URLSearchParams({n:String(s.n),k:String(s.k),tile:String(s.tile+1)});if(s.view&&s.view!=='raw')p.set('view',s.view);if(s.weights&&s.weights.some(x=>String(x)!=='1'))p.set('w',s.weights.join(','));if(s.t&&s.t.some((x,i)=>String(x)!==String(i+1)))p.set('t',s.t.join(','));return '#'+p.toString();}
export function project(p,frame){const q=p.map((x,i)=>(x-frame.center[i])/frame.scale[i]);return frame.axes.map(a=>q.reduce((s,x,i)=>s+x*a[i],0));}
export function hull(points){
 const P=points.map((p,i)=>[p[0],p[1],i]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const uniq=P.filter((p,i)=>!i||p[0]!==P[i-1][0]||p[1]!==P[i-1][1]);if(uniq.length<=2)return uniq;
 const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 const lower=[],upper=[];for(const p of uniq){while(lower.length>1&&cross(lower.at(-2),lower.at(-1),p)<=0)lower.pop();lower.push(p);}for(const p of uniq.toReversed()){while(upper.length>1&&cross(upper.at(-2),upper.at(-1),p)<=0)upper.pop();upper.push(p);}return lower.slice(0,-1).concat(upper.slice(0,-1));
}
export function circular(count){return Array.from({length:count},(_,i)=>[Math.cos(2*Math.PI*i/count),Math.sin(2*Math.PI*i/count)]);}
export function signature(s){return s.map(x=>x>0?'+':'−').join('');}
export function finiteFormat(x){return Number.isFinite(x)?Number(x).toPrecision(6):'outside numeric display range';}
export function plotTile(event){const p=event?.points?.find(p=>Number.isInteger(p.customdata));return p?p.customdata:null;}
export function download(name,text,type='application/json'){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
