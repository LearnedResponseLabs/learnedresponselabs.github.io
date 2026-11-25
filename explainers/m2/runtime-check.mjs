const root=new URL('./',import.meta.url),log=document.getElementById('log');
let receipt=null;
document.getElementById('run').onclick=async()=>{
 document.getElementById('run').disabled=true;document.getElementById('receipt').disabled=true;log.textContent='Starting actual production worker…\n';
 const worker=new Worker(new URL('worker.mjs',root),{type:'module'}),pending=new Map();let seq=0;
 receipt={date:new Date().toISOString(),environment:'Production Pyodide module worker; no test transport',userAgent:navigator.userAgent,url:location.href,checks:[]};
 const note=s=>{log.textContent+=s+'\n';};
 const check=(name,ok)=>{receipt.checks.push({name,passed:!!ok});note((ok?'PASS ':'FAIL ')+name);if(!ok)throw Error(name);};
 worker.onmessage=({data:d})=>{if(d.type==='progress'){note(d.message);return;}const p=pending.get(d.id);if(!p)return;pending.delete(d.id);clearTimeout(p.timer);if(d.type==='error'||d.ok===false)p.reject(Error(d.error?.message||'Python failed'));else p.resolve(d.result);};
 worker.onerror=e=>{for(const [id,p] of pending){clearTimeout(p.timer);p.reject(Error(e.message||'Worker error'));}pending.clear();};
 const request=(type,payload)=>new Promise((resolve,reject)=>{const id=++seq,timer=setTimeout(()=>{pending.delete(id);reject(Error('Runtime timeout'));},120000);pending.set(id,{resolve,reject,timer});worker.postMessage(type==='boot'?{type,id,baseURL:root.href}:{type,id,payload});});
 try{
  const c=await(await fetch(new URL('data/plabic/catalog.json',root))).json();const config=await(await fetch(new URL('runtime-config.json',root))).json();
  const boot=await request('boot');receipt.runtime=boot;
  check('Emscripten, not native Python',boot.wasm===true&&boot.platform==='emscripten');
  check('Pinned Pyodide version',boot.version===config.pyodideVersion);
  check('New Python geometry module',boot.plabic_renderer===c.renderer);
  for(const r of c.families){const g=await(await fetch(new URL(r.url,root))).json();const d=await request('request',{action:'inspect',family:r.key,tile:0});check(r.key+' geometry parity',JSON.stringify(d.plabic_geometry)===JSON.stringify(g.tiles[0]));}
  const g=await(await fetch(new URL('data/plabic/6_2.json',root))).json();
  const weighted=await request('request',{action:'inspect',family:'6_2',tile:0,weights:[['2','3/2','4'],['1','3','2']]});
  check('Non-unit weights preserve the cell renderer',JSON.stringify(weighted.plabic_geometry)===JSON.stringify(g.tiles[0]));
  const other=await request('request',{action:'inspect',family:'6_2',tile:24});
  check('Tile 25 geometry parity',JSON.stringify(other.plabic_geometry)===JSON.stringify(g.tiles[24]));
  check('Tile 25 endpoint permutation',JSON.stringify(other.plabic_geometry.strands.map(s=>s.end))==='[1,4,6,5,3,2]');
  receipt.ok=true;note('All checks passed in actual WebAssembly.');
 }catch(e){receipt.ok=false;receipt.error=String(e.message||e);note('FAILED: '+receipt.error);}finally{worker.terminate();for(const p of pending.values())clearTimeout(p.timer);document.getElementById('run').disabled=false;document.getElementById('receipt').disabled=false;window.runtimeReceipt=receipt;}
};
document.getElementById('receipt').onclick=()=>{const u=URL.createObjectURL(new Blob([JSON.stringify(receipt,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=u;a.download='m2-pyodide-renderer-runtime.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),2000);};
