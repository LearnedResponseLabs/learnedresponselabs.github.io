/** Production Python runs only in a Pyodide module worker. */
let bootPromise=null,api=null,runtime=null,queue=Promise.resolve();
async function text(url,max=1000000){const r=await fetch(url);if(!r.ok)throw Error(`HTTP ${r.status}: ${url}`);const s=await r.text();if(s.length>max)throw Error('Source exceeds size limit');return s;}
async function boot(baseURL){
 const root=new URL(baseURL),cfg=JSON.parse(await text(new URL('runtime-config.json',root)));
 const indexURL=new URL(cfg.indexURL,root).href.replace(/\/?$/,'/');
 self.postMessage({type:'progress',message:`Loading Pyodide ${cfg.pyodideVersion}…`});
 const {loadPyodide}=await import(indexURL+'pyodide.mjs');
 runtime=await loadPyodide({indexURL,stdout:()=>{},stderr:()=>{}});
 if(runtime.version!==cfg.pyodideVersion)throw Error('Runtime version mismatch');
 self.postMessage({type:'progress',message:'Loading NumPy and the source-derived numerical kernels…'});
 await runtime.loadPackage(['numpy']);runtime.FS.mkdirTree('/clh');
 for(const name of ['labs.py','og_bridge.py','lessons.py'])runtime.FS.writeFile('/clh/'+name,await text(new URL('py/'+name,root)));
 await runtime.runPythonAsync("import sys\nsys.path.insert(0,'/clh')\nimport labs, lessons");
 api=runtime.runPython('lessons.dispatch_json');
 const check=JSON.parse(api(JSON.stringify({action:'selftest'})));
 if(!check.ok||!check.result.ok||!check.result.wasm)throw Error('WebAssembly startup checks did not pass');
 return {...check.result,runtimeVersion:runtime.version};
}
async function handle({data}){const {type,id,baseURL,payload}=data||{};try{
 if(type==='boot'){bootPromise ||= boot(baseURL);self.postMessage({type:'ready',id,result:await bootPromise});}
 else if(type==='request'&&bootPromise){await bootPromise;self.postMessage({type:'result',id,...JSON.parse(api(JSON.stringify(payload)))});}
 else throw Error('Worker not initialized');
 }catch(e){self.postMessage({type:'error',id,error:String(e.message||e)});}}
self.onmessage=e=>{queue=queue.then(()=>handle(e));};
