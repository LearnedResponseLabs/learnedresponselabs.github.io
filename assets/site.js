
(function(){
  function ready(fn){ if(document.readyState!=='loading') fn(); else document.addEventListener('DOMContentLoaded',fn); }
  function load(cb,onerr){
    if(window.__REGISTRY__) return cb(window.__REGISTRY__);
    if(!window.__REGISTRY_URL__) return;
    fetch(window.__REGISTRY_URL__).then(r=>{if(!r.ok) throw new Error(r.status); return r.json();}).then(cb).catch(e=>{console.error('registry',e); onerr&&onerr(e);});
  }
  const ORDER=["PROVED_AUDITED","PROVED_DRAFT","VERIFIED","NUMERICAL","CONDITIONAL","IMPORTED","IMPORTED_INTERNAL","OPEN","REFUTED","NOT_CLAIMED"];
  const CLS={PROVED_AUDITED:'proved',PROVED_DRAFT:'proved',VERIFIED:'verified',NUMERICAL:'verified',CONDITIONAL:'open',OPEN:'open',IMPORTED:'imported',IMPORTED_INTERNAL:'imported',REFUTED:'not',NOT_CLAIMED:'not'};
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  function mini(counts){ const t=Object.values(counts).reduce((a,b)=>a+b,0); if(!t) return '<span class=muted>—</span>';
    return '<span class="mini" title="'+esc(ORDER.filter(k=>counts[k]).map(k=>k+': '+counts[k]).join(', '))+'">'+ORDER.filter(k=>counts[k]).map(k=>'<span class="seg seg-'+CLS[k]+'" style="flex:'+counts[k]+'"></span>').join('')+'</span>'; }
  function fillSelect(sel,vals){ vals.forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;sel.appendChild(o);}); }

  // sortable table: headers are buttons with aria-sort; initial rows are server-rendered and replaced here
  function table(el,cols,rowAttr){
    let sortKey=(cols.find(c=>c.sort)||cols[0]).key, asc=true, current=[];
    const thead=el.querySelector('thead'), tbody=el.querySelector('tbody');
    function render(data){
      const s=[...data].sort((a,b)=>{const x=a[sortKey],y=b[sortKey];const r=((x==null)-(y==null))||(typeof x==='number'&&typeof y==='number'?x-y:String(x==null?'':x).localeCompare(String(y==null?'':y)));return asc?r:-r;});
      thead.querySelectorAll('th[data-key]').forEach(th=>th.setAttribute('aria-sort',th.dataset.key===sortKey?(asc?'ascending':'descending'):'none'));
      tbody.innerHTML=s.map(r=>'<tr'+(rowAttr?rowAttr(r):'')+'>'+cols.map(c=>'<td'+(c.num?' class="num"':'')+'>'+(c.render?c.render(r):esc(r[c.key]))+'</td>').join('')+'</tr>').join('');
    }
    thead.addEventListener('click',e=>{const th=e.target.closest('th[data-key]');if(!th)return;if(sortKey===th.dataset.key)asc=!asc;else{sortKey=th.dataset.key;const col=cols.find(c=>c.key===sortKey);asc=!(col&&col.num);}render(current);});
    return d=>{current=d;render(d);};
  }

  function scatter(fig,metrics,x0,y0,onPick){
    const plot=fig.querySelector('.plot'), sx=fig.querySelector('select[data-axis=x]'), sy=fig.querySelector('select[data-axis=y]');
    metrics.forEach(m=>{[sx,sy].forEach(s=>{const o=document.createElement('option');o.value=m.key;o.textContent=m.label;s.appendChild(o);});});
    sx.value=x0; sy.value=y0;
    const W=460,H=300,L=44,R=16,T=14,B=40;
    function jit(id,k){ let h=0; const s=id+k; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))>>>0; return ((h%1000)/1000-0.5)*0.36; }
    let cur=[];
    function draw(rows){
      const kx=sx.value, ky=sy.value, mx=metrics.find(m=>m.key===kx), my=metrics.find(m=>m.key===ky);
      const xs=v=>L+(v-mx.min)/(mx.max-mx.min)*(W-L-R), ys=v=>H-B-(v-my.min)/(my.max-my.min)*(H-T-B);
      const stepx=Math.max(1,Math.ceil((mx.max-mx.min)/10)), stepy=Math.max(1,Math.ceil((my.max-my.min)/10));
      let g='<g class="grid">'; for(let v=mx.min;v<=mx.max;v+=stepx) g+='<line x1="'+xs(v)+'" x2="'+xs(v)+'" y1="'+T+'" y2="'+(H-B)+'"/>'; for(let v=my.min;v<=my.max;v+=stepy) g+='<line y1="'+ys(v)+'" y2="'+ys(v)+'" x1="'+L+'" x2="'+(W-R)+'"/>'; g+='</g>';
      let ax='<g class="axis">'; for(let v=mx.min;v<=mx.max;v+=stepx) ax+='<text x="'+xs(v)+'" y="'+(H-B+16)+'" text-anchor="middle">'+v+'</text>'; for(let v=my.min;v<=my.max;v+=stepy) ax+='<text x="'+(L-8)+'" y="'+(ys(v)+4)+'" text-anchor="end">'+v+'</text>';
      ax+='<text class="axis-label" x="'+((L+W-R)/2)+'" y="'+(H-6)+'" text-anchor="middle">'+esc(mx.label)+'</text><text class="axis-label" transform="translate(12 '+((T+H-B)/2)+') rotate(-90)" text-anchor="middle">'+esc(my.label)+'</text></g>';
      let pts=''; rows.forEach(r=>{ if(r[kx]==null||r[ky]==null) return; const cx=xs(r[kx]+jit(r.id,kx)), cy=ys(r[ky]+jit(r.id,ky));
        pts+='<circle class="pt g-'+r.group+'" r="5" cx="'+cx.toFixed(1)+'" cy="'+cy.toFixed(1)+'" data-id="'+esc(r.id)+'"><title>'+esc(r.id+' · '+r.title+' — '+mx.label+' '+r[kx]+', '+my.label+' '+r[ky])+'</title></circle>'; });
      plot.innerHTML='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+esc(my.label+' against '+mx.label)+'">'+g+ax+pts+'</svg>';
      fig.querySelector('.chart-title').textContent=my.label.charAt(0).toUpperCase()+my.label.slice(1)+' against '+mx.label;
    }
    sx.addEventListener('change',()=>draw(cur)); sy.addEventListener('change',()=>draw(cur));
    plot.addEventListener('click',e=>{const c=e.target.closest('.pt'); if(c) onPick(c.dataset.id);});
    plot.addEventListener('mousemove',e=>{const c=e.target.closest('.pt'); tip(c?c.querySelector('title').textContent:null,e);});
    plot.addEventListener('mouseleave',()=>tip(null));
    return d=>{cur=d;draw(d);};
  }
  let tipEl=null; function tip(text,e){ if(!text){ if(tipEl){tipEl.remove();tipEl=null;} return; } if(!tipEl){tipEl=document.createElement('div');tipEl.className='tip';document.body.appendChild(tipEl);} tipEl.textContent=text; tipEl.style.left=(e.clientX+14)+'px'; tipEl.style.top=(e.clientY+14)+'px'; }

  function briefsPage(R){
    const rows=R.briefs;
    const metrics=[{key:'impact',label:'impact',min:1,max:5},{key:'upside',label:'upside',min:1,max:10},{key:'review_value',label:'review value',min:1,max:5},{key:'paper_count',label:'papers',min:0,max:Math.max(1,...rows.map(r=>r.paper_count))},{key:'claims_total',label:'claim rows',min:0,max:Math.max(1,...rows.map(r=>r.claims_total))}];
    const genre=document.getElementById('brief-genre'), stage=document.getElementById('brief-stage'), q=document.getElementById('brief-search'), rel=document.getElementById('brief-released'), cnt=document.getElementById('brief-count');
    fillSelect(genre,[...new Set(rows.map(r=>r.genre).filter(Boolean))].sort()); fillSelect(stage,[...new Set(rows.map(r=>r.stage).filter(Boolean))].sort());
    document.getElementById('brief-legend').innerHTML=['flagship','frontier','applied','other'].map(g=>'<span class="g-'+g+'">'+g+'</span>').join('')+'<span class="muted">colour = genre group</span>';
    const cols=[{key:'id',label:'ID',sort:true,render:r=>'<code>'+esc(r.id)+'</code>'},{key:'title',label:'Title',render:r=>(r.page?'<a href="'+r.page+'">'+esc(r.title)+'</a>':esc(r.title))+(r.flagship?' <span class="chip">flagship</span>':'')},
      {key:'genre',label:'Genre'},{key:'stage',label:'Stage'},{key:'circulation',label:'Circulation'},{key:'confidence',label:'Confidence'},
      {key:'impact',label:'Impact',num:true},{key:'upside',label:'Upside',num:true},{key:'review_value',label:'Review value',num:true},{key:'paper_count',label:'Papers',num:true},{key:'claims_total',label:'Claim rows',num:true}];
    const upd=table(document.getElementById('brief-table'),cols,r=>' data-id="'+esc(r.id)+'"');
    const a=scatter(document.getElementById('chart-a'),metrics,'impact','upside',pick), b=scatter(document.getElementById('chart-b'),metrics,'review_value','impact',pick);
    function pick(id){ document.querySelectorAll('#brief-table tr.hl,.pt.hl').forEach(e=>e.classList.remove('hl')); document.querySelectorAll('.pt[data-id="'+id+'"]').forEach(e=>e.classList.add('hl')); const tr=document.querySelector('#brief-table tr[data-id="'+id+'"]'); if(tr){tr.classList.add('hl');tr.scrollIntoView({block:'center',behavior:'smooth'});} }
    function apply(){ const s=q.value.trim().toLowerCase(); const d=rows.filter(r=>(!genre.value||r.genre===genre.value)&&(!stage.value||r.stage===stage.value)&&(!rel.checked||r.released)&&(!s||r.title.toLowerCase().includes(s)||r.id.includes(s))); cnt.textContent=d.length+' of '+rows.length+' briefs'; upd(d); a(d); b(d); }
    [genre,stage,rel].forEach(e=>e.addEventListener('change',apply)); q.addEventListener('input',apply); apply();
  }
  function papersPage(R){
    const rows=R.papers, briefs=Object.fromEntries(R.briefs.map(b=>[b.id,b]));
    const genre=document.getElementById('paper-genre'), q=document.getElementById('paper-search'), av=document.getElementById('paper-available'), cnt=document.getElementById('paper-count');
    fillSelect(genre,[...new Set(rows.map(r=>r.genre))].sort());
    const cols=[{key:'title',label:'Title',sort:true,render:r=>(r.page?'<a href="'+r.page+'">'+esc(r.title)+'</a>':esc(r.title))},{key:'topic',label:'Topic',render:r=>r.topic?esc((briefs[r.topic]&&briefs[r.topic].title)||r.topic):''},
      {key:'genre',label:'Genre'},{key:'public_label',label:'Status'},{key:'claims_total',label:'Claim rows',num:true},
      {key:'available',label:'Links',render:r=>[r.pdf?'<a class="pub" href="'+esc(r.pdf)+'">PDF</a>':''].concat(r.published.map(p=>'<a class="pub" href="'+esc(p.url)+'">'+esc(p.label)+'</a>')).filter(Boolean).join(' · ')||'<span class=muted>not released</span>'}];
    const upd=table(document.getElementById('paper-table'),cols);
    function apply(){ const s=q.value.trim().toLowerCase(); const d=rows.filter(r=>(!genre.value||r.genre===genre.value)&&(!av.checked||r.available)&&(!s||r.title.toLowerCase().includes(s)||r.slug.includes(s))); cnt.textContent=d.length+' of '+rows.length+' papers'; upd(d); }
    [genre,av].forEach(e=>e.addEventListener('change',apply)); q.addEventListener('input',apply); apply();
  }
  ready(()=>load(R=>{ if(document.getElementById('brief-table')) briefsPage(R); if(document.getElementById('paper-table')) papersPage(R); },
    e=>{ ['brief-count','paper-count'].forEach(id=>{const el=document.getElementById(id); if(el){el.className='data-error'; el.textContent='The registry could not be loaded ('+e.message+'); the table shows the released rows only. Reload to retry.';}}); }));
})();
