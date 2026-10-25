import {evaluate} from './evaluate.mjs';
import {output as renderOutput} from './render.mjs';
import {range,mod,eq} from './core.mjs';
import {cell} from './combinatorial.mjs';
const $=id=>document.getElementById(id),catalog=await (await fetch('./catalog.json')).json();
let current,part,values={},issues=[],revision=0;
const defaults=w=>Object.fromEntries(Object.entries(w.controls).map(([k,c])=>[k,structuredClone(c.default)]));
const count=c=>typeof c.count==='string'?values[c.count]:c.count;
const labelText=s=>s.replace(/\$|\\+/g,'').replace(/alpha/g,'α').replace(/theta/g,'θ').replace(/eta/g,'η').replace(/pi/g,'π');
const element=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
const locations=catalog.parts.flatMap(p=>p.widgets.map(id=>({id,part:p.n})));
function query(id=current,p=part,v=values){const q=new URLSearchParams({ex:id,part:String(p)});for(const [k,x] of Object.entries(v))q.set(k,Array.isArray(x)?x.join(','):String(x));return '?'+q;}
function writeURL(push=false){history[push?'pushState':'replaceState']({ex:current},'',query());}
function parseList(text){if(!text.trim())return [];if(!/^\d+(?:\s*,\s*\d+|\s+\d+)*$/.test(text.trim()))throw Error('Use whole, nonnegative labels separated by commas or spaces.');return text.trim().split(/[\s,]+/).map(Number);}
function parseValues(w,q){
 const v=defaults(w);issues=[];
 // Numeric counts must be read before lists, independent of object ordering.
 for(const [k,c] of Object.entries(w.controls))if(q.has(k)&&c.type==='number'){
  const x=Number(q.get(k));if(q.get(k).trim()&&Number.isFinite(x)&&x>=c.min&&x<=c.max&&Math.abs((x-c.min)/c.step-Math.round((x-c.min)/c.step))<1e-7)v[k]=x;else issues.push(c.label+': invalid link value; default used.');
 }
 for(const [k,c] of Object.entries(w.controls))if(q.has(k)&&c.type!=='number')try{
  const text=q.get(k),n=typeof c.count==='string'?v[c.count]:c.count;
  if(c.type==='choice'){if(!c.options.some(o=>o.id===text))throw Error();v[k]=text;}
  else if(c.type==='numbers'){
   const x=text.split(',').map(Number);if(x.length!==n||x.some(z=>!Number.isFinite(z)||z<c.min||z>c.max||Math.abs((z-c.min)/c.step-Math.round((z-c.min)/c.step))>1e-7))throw Error();v[k]=x;
  }else{
   const x=parseList(text);if(x.some(z=>!Number.isSafeInteger(z)))throw Error();
   if(c.type!=='permutation'&&(new Set(x).size!==x.length||x.some(z=>z<1||z>n)||x.length<c.min_size||x.length>(c.max_size??n)))throw Error();v[k]=x;
  }
 }catch{issues.push(labelText(c.label)+': invalid link value; default used.');}
 return v;
}
function drawNavigation(){
 const nav=$('parts-nav');for(const p of catalog.parts){const details=element('details');details.open=p.n===part;details.dataset.part=p.n;details.append(element('summary',`Part ${p.n} · ${p.title}`));for(const id of p.widgets){const w=catalog.widgets[id],a=element('a',w.title);a.href=query(id,p.n,defaults(w));a.dataset.example=id;a.dataset.part=p.n;if(!w.ported){const s=element('span','Coming soon');s.className='soon';a.append(s);}a.addEventListener('click',e=>{if(e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();open(id,p.n,true);});details.append(a);}nav.append(details);}
 for(const p of catalog.parts){const o=element('option',`Part ${p.n} · ${p.title}`);o.value=p.n;$('part-select').append(o);}
 $('part-select').addEventListener('change',()=>{const p=catalog.parts.find(p=>p.n===Number($('part-select').value));open(p.widgets[0],p.n,true);});
 $('example-select').addEventListener('change',()=>open($('example-select').value,part,true));
}
function syncNav(){
 $('part-select').value=String(part);const p=catalog.parts.find(p=>p.n===part);$('part-caption').textContent=`Part ${part} · ${p.title}`;$('example-select').replaceChildren(...p.widgets.map(id=>{const w=catalog.widgets[id],o=element('option',w.title+(w.ported?'':' · Coming soon'));o.value=id;return o;}));$('example-select').value=current;
 for(const a of $('parts-nav').querySelectorAll('a')){if(a.dataset.example===current&&Number(a.dataset.part)===part)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');}
 for(const d of $('parts-nav').querySelectorAll('details'))d.open=Number(d.dataset.part)===part;
 const i=locations.findIndex(x=>x.id===current&&x.part===part);$('previous').disabled=i<=0;$('next').disabled=i===locations.length-1;$('position').textContent=`${i+1} of ${locations.length}`;
}
function step(delta){const i=locations.findIndex(x=>x.id===current&&x.part===part),next=locations[i+delta];if(next)open(next.id,next.part,true);}
function numberPair(key,c,index,onChange){
 const row=element('div');row.className='number-pair';const slider=element('input'),box=element('input'),name=key+(index===null?'':'-'+index);slider.type='range';box.type='number';
 for(const e of [slider,box]){e.min=c.min;e.max=c.max;e.step=c.step;e.value=index===null?values[key]:values[key][index];e.dataset.key=key;if(index!==null)e.dataset.index=index;e.dataset.kind=c.type;e.setAttribute('aria-label',labelText(c.label)+(index===null?'':` ${index+1}`)+(e===slider?' slider':' value'));}
 slider.id='control-'+name;box.id='box-'+name;slider.addEventListener('input',()=>{box.value=slider.value;onChange(Number(slider.value));});
 box.addEventListener('input',()=>{if(!box.validity.valid||box.value===''){box.setAttribute('aria-invalid','true');$('input-status').textContent=`Enter ${c.min} to ${c.max}, in steps of ${c.step}.`;$('output').dataset.state='invalid';return;}box.removeAttribute('aria-invalid');slider.value=box.value;onChange(Number(box.value));});row.append(slider,box);return row;
}
function drawControls(onlyKeys){
 const w=catalog.widgets[current],controls=$('controls');if(!onlyKeys)controls.replaceChildren();if(!w.ported)return;
 for(const [key,c] of Object.entries(w.controls)){
  if(onlyKeys&&!onlyKeys.includes(key))continue;
  const group=element(c.type==='numbers'||c.type==='subset'?'fieldset':'div');group.className='control-group';group.dataset.control=key;
  const heading=element(group.tagName==='FIELDSET'?'legend':'label',labelText(c.label));if(heading.tagName==='LABEL')heading.htmlFor='control-'+key;group.append(heading);
  if(c.type==='number')group.append(numberPair(key,c,null,x=>{values[key]=x;resizeDependent(key);drawControls(Object.entries(w.controls).filter(([,spec])=>spec.count===key).map(([name])=>name));compute();writeURL();}));
  else if(c.type==='numbers')values[key].forEach((_,i)=>{const row=element('div');row.className='array-row';const lab=element('label',String(i+1));lab.htmlFor='control-'+key+'-'+i;row.append(lab,numberPair(key,c,i,x=>{values[key][i]=x;compute();writeURL();}));group.append(row);});
  else if(c.type==='permutation'||c.type==='labels'){
   const input=element('input');input.type='text';input.id='control-'+key;input.value=values[key].join(',');input.dataset.key=key;input.dataset.kind=c.type;input.spellcheck=false;input.autocomplete='off';input.inputMode='text';
   const help=element('p',c.type==='permutation'?`Expected: ${count(c)} entries, labels 1 to ${count(c)}. As in Lean, entries reduce modulo n; a non-bijective or wrong-length window uses the identity.`:`Enter ${c.min_size} to ${count(c)} distinct labels, from 1 to ${count(c)}, in cycle order.`);help.className='control-help';help.id='help-'+key;input.setAttribute('aria-describedby',help.id);
   input.addEventListener('input',()=>{try{const x=parseList(input.value);if(x.some(z=>!Number.isSafeInteger(z)))throw Error('Labels must be safe whole numbers.');if(c.type==='labels'&&(new Set(x).size!==x.length||x.some(z=>z<1||z>count(c))||x.length<c.min_size))throw Error(`Use at least ${c.min_size} distinct labels from 1 to ${count(c)}.`);values[key]=x;input.removeAttribute('aria-invalid');compute();writeURL();}catch(e){input.setAttribute('aria-invalid','true');$('input-status').textContent=e.message;$('output').replaceChildren();$('output').dataset.state='invalid';}});group.append(input,help);
  }else if(c.type==='subset'){
   const list=element('div');list.className='checkboxes';range(count(c)).forEach(i=>{const lab=element('label'),box=element('input');box.type='checkbox';box.value=i+1;box.checked=values[key].includes(i+1);box.dataset.key=key;box.dataset.kind='subset';box.setAttribute('aria-label',labelText(c.label)+` ${i+1}`);box.disabled=c.max_size!==1&&!box.checked&&values[key].length>=(c.max_size??count(c));box.addEventListener('change',()=>{const x=box.checked?(c.max_size===1?[i+1]:[...values[key],i+1]):values[key].filter(z=>z!==i+1);if(x.length<c.min_size){box.checked=true;$('input-status').textContent=`Choose at least ${c.min_size} label${c.min_size===1?'':'s'}.`;return;}values[key]=x.sort((a,b)=>a-b);drawControls();compute();writeURL();});lab.append(box,element('span',String(i+1)));list.append(lab);});group.append(list);const help=element('p',`Choose ${c.min_size} to ${c.max_size??count(c)} labels.`);help.className='control-help';group.append(help);
  }else if(c.type==='choice'){
   const select=element('select');select.id='control-'+key;select.dataset.key=key;select.dataset.kind='choice';for(const opt of c.options){const o=element('option',opt.label);o.value=opt.id;select.append(o);}select.value=values[key];select.addEventListener('change',()=>{values[key]=select.value;compute();writeURL();});group.append(select);
  }if(onlyKeys){const old=controls.querySelector(`[data-control="${key}"]`);if(old)old.replaceWith(group);else controls.append(group);}else controls.append(group);
 }
}
function resizeDependent(key){for(const [k,c] of Object.entries(catalog.widgets[current].controls))if(c.count===key&&['labels','subset'].includes(c.type)){const n=values[key];values[k]=values[k].filter(x=>x<=n);for(let x=1;values[k].length<c.min_size&&x<=n;x++)if(!values[k].includes(x))values[k].push(x);}}
function compute(){
 const w=catalog.widgets[current],out=$('output');out.replaceChildren();out.dataset.example=current;out.dataset.revision=++revision;const status=[...issues];issues=[];
 if(!w.ported){out.append(element('p','Coming soon. '+(w.reason??'This example is being prepared for the browser.')));out.dataset.state='coming-soon';$('input-status').textContent='';$('reset').hidden=true;return;}
 $('reset').hidden=false;
 for(const [k,c] of Object.entries(w.controls))if(c.type==='permutation'){
  const n=count(c),x=values[k],normalized=x.map(z=>mod(Math.max(0,z-1),n)+1),fallback=x.length!==n||new Set(normalized).size!==n;
  if(fallback)status.push(`Window is not a permutation after reduction; using the identity (${range(n).map(i=>i+1).join(', ')}), exactly as Lean does.`);
  else if(!eq(x,normalized))status.push('Window entries reduce to ('+normalized.join(', ')+'), exactly as Lean does.');
 }
 try{out.append(renderOutput(document,evaluate(current,values)));out.dataset.state='ready';out.dataset.values=JSON.stringify(values);}catch(e){out.append(element('p','This input could not be evaluated: '+e.message));out.dataset.state='error';}
 $('input-status').textContent=status.join(' ');syncLinks();
}
function syncLinks(){const w=catalog.widgets[current];$('item-link').href='../../editions/clh/index.html#'+w.items[0];$('item-link').textContent='Read '+w.items[0]+' in the edition';
 const link=$('explorer-link');link.textContent=current==='item_UF-WP-DECORATED'?'Open the underlying cell in the explorer':'Open this cell in the explorer';if(!w.ported){link.hidden=true;return;}let window;
 if(values.window)window=cell(values.n??count(w.controls.window),values.window).window;
 else if(['item_UF-WP-DECORATED'].includes(current))window=[3,1,2,4,5];
 else if(current==='TwoComponents')window=[3,1,2,6,4,5];
 else if(values.angles||values.logs||values.weights||values.cover)window=[3,5,1,2,4];
 link.hidden=!window;if(window){const q=new URLSearchParams({w:window.join(',')});link.href='../cells/?'+q;}}
function open(id,p,push=false,q){
 if(!catalog.widgets[id])id='item_S10';current=id;part=catalog.parts.some(s=>s.n===p&&s.widgets.includes(id))?p:catalog.parts.find(s=>s.widgets.includes(id)).n;
 const w=catalog.widgets[id];values=q?parseValues(w,q):defaults(w);$('widget-title').textContent=w.title;$('notice').textContent=w.ported?`Computed in your browser from the definitions; checked against Lean on ${w.checked} settings.`:'Coming soon · this example is not yet available in the browser.';
 syncNav();drawControls();compute();syncLinks();if(push)writeURL(true);else writeURL();document.title=w.title+' · The playground · Learned Response Labs';document.documentElement.dataset.ready='true';
}
$('previous').addEventListener('click',()=>step(-1));$('next').addEventListener('click',()=>step(1));$('reset').addEventListener('click',()=>{values=defaults(catalog.widgets[current]);issues=[];drawControls();compute();writeURL();});
const themes=['auto','light','dark'];let theme='auto';try{theme=localStorage.getItem('clh-playground-theme')??'auto';}catch{}
function applyTheme(){if(theme==='auto')document.documentElement.removeAttribute('data-theme');else document.documentElement.dataset.theme=theme;$('theme').textContent='Theme: '+(theme==='auto'?'automatic':theme);}
$('theme').addEventListener('click',()=>{theme=themes[(themes.indexOf(theme)+1)%themes.length];applyTheme();try{localStorage.setItem('clh-playground-theme',theme);}catch{}});applyTheme();
const q=new URLSearchParams(location.search);current=q.get('ex')??'item_S10';part=Number(q.get('part'))||1;drawNavigation();open(current,part,false,q);
addEventListener('popstate',()=>{const q=new URLSearchParams(location.search);open(q.get('ex'),Number(q.get('part')),false,q);});
