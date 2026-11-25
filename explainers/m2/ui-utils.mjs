/** Pure presentation/state helpers. All mathematical data comes from Python. */
export const PALETTE=['#4a90d9','#e6550d','#31a354','#756bb1','#d62728','#17becf','#bcbd22','#e377c2','#8c564b','#1f77b4','#b34646','#327c85','#99714f','#a1518d','#2ca02c','#ff7f0e','#9467bd','#5176a3','#4c8859','#8c79b2','#b77b1b'];
export const color=i=>PALETTE[((i%PALETTE.length)+PALETTE.length)%PALETTE.length];
export const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function parseState(hash){
  if(typeof hash!=='string'||hash.length>2500) return {error:'State link exceeds the size limit.'};
  const p=new URLSearchParams(hash.replace(/^#/,''));
  const read=(key,d,lo,hi)=>{const raw=p.get(key);if(raw===null)return d;if(!/^\d+$/.test(raw))throw Error(`Invalid ${key}.`);const v=Number(raw);if(!Number.isSafeInteger(v)||v<lo||v>hi)throw Error(`Invalid ${key}.`);return v;};
  try{
    const n=read('n',6,3,8),k=read('k',2,1,4),tile=read('tile',13,1,1000);
    const layout=p.get('layout')||'source';if(!['source','circle'].includes(layout))throw Error('Invalid layout.');
    const trips=read('trips',1,0,1)===1, labels=read('labels',1,0,1)===1;
    const trip=read('trip',0,0,n);
    const faces=read('faces',1,0,1)===1,bridgeLabels=read('balpha',1,0,1)===1;
    let weights=null;
    if(p.has('weights')){
      weights=p.get('weights').split(';').map(row=>row.split(','));
      if(weights.length!==k||weights.some(row=>row.length!==3||row.some(s=>s.length>40||!/^\d+(?:\.\d+)?(?:\/\d+)?$/.test(s))))throw Error('Invalid weights in state link.');
    }
    return {n,k,tile:tile-1,trips,labels,layout,trip,faces,bridgeLabels,weights};
  }catch(e){return {error:e.message};}
}
export function encodeState(s){
 const p=new URLSearchParams({n:String(s.n),k:String(s.k),tile:String(s.tile+1),trips:s.trips?'1':'0',labels:s.labels?'1':'0',layout:s.layout,trip:String(s.trip||0),faces:s.faces===false?'0':'1',balpha:s.bridgeLabels===false?'0':'1'});
 if(s.weights&&s.weights.some(row=>row.some(v=>String(v)!=='1')))p.set('weights',s.weights.map(r=>r.join(',')).join(';'));
 return '#'+p.toString();
}
export function neighbors(edges,i){return edges.filter(e=>e[0]===i||e[1]===i).map(e=>e[0]===i?e[1]:e[0]).sort((a,b)=>a-b);}
export function positions(f,layout){return layout==='circle'?f.tiles.map((_,i)=>[Math.cos(2*Math.PI*i/f.tiles.length),Math.sin(2*Math.PI*i/f.tiles.length)]):f.positions;}
export function formatNumber(x){if(x===0)return '0';if(Number.isInteger(x)&&Math.abs(x)<1e9)return String(x);return Number(x).toPrecision(6).replace(/\.0+(?=e|$)/,'');}
export function defaultWeights(k){return Array.from({length:k},()=>['1','1','1']);}
export function validateFamily(f,record){
 if(!f||f.n!==record.n||f.k!==record.k||f.tiles?.length!==record.tile_count||f.positions?.length!==record.tile_count)throw Error('Atlas family dimensions do not match the catalogue.');
 for(const [a,b] of f.edges){if(!Number.isInteger(a)||!Number.isInteger(b)||a<0||b<0||a>=f.tiles.length||b>=f.tiles.length||a>=b)throw Error('Invalid atlas edge.');}
 return f;
}
export async function checkedJSON(url,expectedHash){
 const response=await fetch(url);if(!response.ok)throw Error(`${new URL(url,location.href).pathname}: HTTP ${response.status}`);
 const buffer=await response.arrayBuffer();if(buffer.byteLength>8_000_000)throw Error('Atlas file exceeds size limit.');
 if(expectedHash&&globalThis.crypto?.subtle){const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',buffer));const hash=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');if(hash!==expectedHash)throw Error('Atlas integrity check failed.');}
 return JSON.parse(new TextDecoder().decode(buffer));
}
