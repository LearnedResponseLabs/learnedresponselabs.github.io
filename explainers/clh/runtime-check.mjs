import {download} from './ui-utils.mjs';
let receipt=null;document.getElementById('save').onclick=()=>download('clh-wasm-checks.json',JSON.stringify(receipt,null,2));
document.getElementById('run').onclick=async()=>{
 const log=document.getElementById('log');document.getElementById('run').disabled=true;
 const worker=new Worker(new URL('worker.mjs',import.meta.url),{type:'module'});let count=0,pending=new Map();
 const request=(type,payload)=>new Promise((resolve,reject)=>{const id=++count;const timer=setTimeout(()=>{pending.delete(id);reject(Error('Runtime operation timed out'));},100000);pending.set(id,{resolve,reject,timer});worker.postMessage({type,id,payload,baseURL:new URL('.',location.href).href});});
 worker.onmessage=e=>{const m=e.data;if(m.type==='progress')log.textContent=m.message;const p=pending.get(m.id);if(p){clearTimeout(p.timer);pending.delete(m.id);if(m.type==='error'||m.ok===false)p.reject(Error(m.error));else p.resolve(m.result);}};
 receipt={schema:'lrl.clh-wasm/v1',at:new Date().toISOString(),checks:[],all_pass:false};
 try{
 const boot=await request('boot');receipt.runtime=boot;receipt.checks.push({name:'actual WebAssembly runtime',pass:boot.wasm===true&&boot.platform==='emscripten'});
 for(const [name,req,predicate] of [
 ['independent triangle inverse',{action:'landscape',uv:[.095,.669]},r=>r.inverse.converged&&r.recovery_error<1e-8&&r.identity_residual<1e-8],
 ['obtuse-cycle sum',{action:'cycles',fixture:'triangle',gaps:[.08,.10,.82]},r=>r.cotangents.some(x=>x<0)&&Math.min(...r.eigenvalues)>-1e-8],
 ['fan volume telescopes',{action:'volume',n:5,gaps:[.08,.13,.22,.25,.32]},r=>r.telescoping_residual<1e-10],
 ['actual non-top reconstruction',{action:'shift',uv:[.1,.2]},r=>r.inverse.converged&&r.target_residual<1e-8&&r.isotropy_defect<1e-8],
 ['admissible noncrossing collision',{action:'shift',uv:[.1,.3]},r=>r.inverse.converged&&r.identity_residual<1e-8],
 ['off-isotropy negative control',{action:'shift',uv:[.1,.2],off:.025},r=>r.isotropy_defect>1e-5&&r.ordinary_dual_difference>1e-5],
 ['retained collision shape',{action:'collision',u:.75,epsilon:.0001},r=>r.limit_error<1e-7],
 ['integer necklace identity',{action:'necklace',fixture:'nontop8'},r=>r.error===0],
 ['corrupted exponent rejected',{action:'necklace',corrupt:true},r=>r.error>0],
 ['dense-five equality',{action:'dense',eta:.065,bary:[1,0,0]},r=>Math.abs(r.slack)<1e-8],
 ]){const r=await request('request',req);receipt.checks.push({name,pass:Boolean(predicate(r))});log.textContent=JSON.stringify(receipt,null,2);}
 receipt.all_pass=receipt.checks.every(c=>c.pass);
 }catch(e){receipt.error=e.message;}finally{log.textContent=JSON.stringify(receipt,null,2);worker.terminate();document.getElementById('run').disabled=false;document.getElementById('save').disabled=false;}
};
