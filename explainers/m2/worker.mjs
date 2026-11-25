/** Module worker: serial Python requests; no Dash or server callbacks. */
let bootPromise=null, pyodide=null, api=null, register=null, root=null, catalog=null, plabicCatalog=null, registerPlabic=null;
let queue=Promise.resolve();const loaded=new Set();
async function text(url,max=8_000_000){const r=await fetch(url);if(!r.ok)throw Error(`HTTP ${r.status}: ${url}`);const s=await r.text();if(s.length>max)throw Error('Resource exceeds limit.');return s;}
const progress=message=>self.postMessage({type:'progress',message});
async function boot(baseURL){
 root=new URL(baseURL);const config=JSON.parse(await text(new URL('runtime-config.json',root)));
 catalog=JSON.parse(await text(new URL('data/catalog.json',root)));
 plabicCatalog=JSON.parse(await text(new URL('data/plabic/catalog.json',root)));
 const indexURL=new URL(config.indexURL,root).href.replace(/\/?$/,'/');
 progress(`Loading Pyodide ${config.pyodideVersion}…`);
 const {loadPyodide}=await import(indexURL+'pyodide.mjs');
 pyodide=await loadPyodide({indexURL,stdout:()=>{},stderr:s=>self.postMessage({type:'log',message:String(s)})});
 if(pyodide.version!==config.pyodideVersion)throw Error(`Pyodide version mismatch: ${pyodide.version}`);
 progress('Loading exact Python matrix and trip computations…');
 pyodide.FS.mkdirTree('/m2');
 for(const name of ['plabic_geometry.py','core.py']){pyodide.FS.writeFile('/m2/'+name,await text(new URL('py/'+name,root),100_000));}
 await pyodide.runPythonAsync("import sys\nsys.path.insert(0, '/m2')\nimport core");
 api=pyodide.runPython('core.dispatch_json');register=pyodide.runPython('core.register_family_json');registerPlabic=pyodide.runPython('core.register_plabic_json');
 const result=JSON.parse(api(JSON.stringify({action:'selftest'})));
 if(!result.ok||!result.result.ok||!result.result.wasm)throw Error('The WebAssembly startup self-test did not pass.');
 return {...result.result,version:pyodide.version,portVersion:result.result.version};
}
async function family(key){
 if(loaded.has(key))return;
 const record=catalog.families.find(f=>f.key===key);if(!record)throw Error('Unknown atlas family.');
 const raw=await text(new URL(record.url,root));
 if(self.crypto?.subtle){const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw))),b=>b.toString(16).padStart(2,'0')).join('');if(hash!==record.sha256)throw Error('Atlas integrity check failed in Python worker.');}
 register(raw);
 const p=plabicCatalog.families.find(f=>f.key===key);if(!p)throw Error('Missing plabic metadata.');
 const pr=await text(new URL(p.url,root));
 if(self.crypto?.subtle){const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(pr))),b=>b.toString(16).padStart(2,'0')).join('');if(hash!==p.sha256)throw Error('Plabic integrity check failed.');}
 registerPlabic(pr);loaded.add(key);
}
async function handle(event){
 const {id,type,baseURL,payload}=event.data||{};
 try{
  if(type==='boot'){if(!bootPromise)bootPromise=boot(baseURL);self.postMessage({type:'ready',id,result:await bootPromise});return;}
  if(type!=='request'||!bootPromise)throw Error('Python worker is not initialized.');
  await bootPromise;
  if(payload.action==='inspect')await family(payload.family);
  self.postMessage({type:'result',id,...JSON.parse(api(JSON.stringify(payload)))});
 }catch(error){self.postMessage({type:'error',id,error:{code:'runtime_error',message:String(error.message||error)}});}
}
self.addEventListener('message',event=>{queue=queue.then(()=>handle(event)).catch(e=>self.postMessage({type:'error',error:{code:'worker_error',message:String(e)}}));});
