export const PI=Math.PI;
export const fmt=(v,d=4)=>Number.isFinite(v)?(Math.abs(v)<1e-4&&v!==0?v.toExponential(2):v.toFixed(d)):'—';
export function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export function eigenvalues(matrix){
 const n=matrix.length;if(!n||matrix.some(r=>r.length!==n||r.some(x=>!Number.isFinite(x))))throw Error('Invalid symmetric matrix');
 const a=matrix.map(r=>r.slice());
 for(let it=0;it<100*n*n;it++){
  let p=0,q=1,m=0;for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)if(Math.abs(a[i][j])>m){p=i;q=j;m=Math.abs(a[i][j]);}
  if(m<1e-12)break;const phi=.5*Math.atan2(2*a[p][q],a[q][q]-a[p][p]),c=Math.cos(phi),s=Math.sin(phi);
  const app=a[p][p],aqq=a[q][q],apq=a[p][q];
  for(let k=0;k<n;k++)if(k!==p&&k!==q){const x=a[k][p],y=a[k][q];a[k][p]=a[p][k]=c*x-s*y;a[k][q]=a[q][k]=s*x+c*y;}
  a[p][p]=c*c*app-2*s*c*apq+s*s*aqq;a[q][q]=s*s*app+2*s*c*apq+c*c*aqq;a[p][q]=a[q][p]=0;
 }
 return a.map((r,i)=>r[i]).sort((a,b)=>a-b);
}
export function sumMatrices(list,n){const h=Array.from({length:n},()=>Array(n).fill(0));for(const m of list)for(let i=0;i<n;i++)for(let j=0;j<n;j++)h[i][j]+=m[i][j];return h;}
export function simplexPoint(p){return [p[1]+.5*p[2],Math.sqrt(3)/2*p[2]];}
export function encodeState(s){return btoa(unescape(encodeURIComponent(JSON.stringify(s)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
export function decodeState(s){if(s.length>12000)throw Error('State is too large');const t=s.replace(/-/g,'+').replace(/_/g,'/');const x=JSON.parse(decodeURIComponent(escape(atob(t))));if(!x||typeof x!=='object'||Array.isArray(x))throw Error('Bad state');return x;}
export function download(name,contents,type='application/json'){const u=URL.createObjectURL(new Blob([contents],{type}));const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),2000);}
export function triangleFaces(width){const t=[];for(let i=0;i<width-1;i++)for(let j=0;j<width-1;j++){const p=i*width+j;t.push([p,p+1,p+width],[p+1,p+width+1,p+width]);}return t;}
