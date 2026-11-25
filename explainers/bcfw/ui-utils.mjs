/** Pure UI helpers. They do not implement Python quiver mutation. */
export const MODEL = 'bcfw-domino-quotient-v2';
export const SCHEMA = 'bcfw-domino/v2';
export const CAPS = [48, 96, 192, 384, 512];
export function parseState(search, catalog, defaultCap=96) {
  const q = new URLSearchParams(search);
  const family = q.get('family') || catalog.default;
  const row = catalog.families.find(x => x.key === family);
  if (!row) throw new Error('The state link names an unknown family.');
  const tile = Number(q.get('tile') || 0);
  if (!Number.isInteger(tile) || tile < 0 || tile >= row.tiles) throw new Error('The state link names an invalid tile.');
  const cap = Number(q.get('cap') || defaultCap);
  if (!CAPS.includes(cap)) throw new Error('The state link has an unsupported search cap.');
  const path = q.get('path') ? q.get('path').split(',') : [];
  if (path.length > 128 || path.some(x => !/^[1-8]_[αβγδε]$/.test(x))) throw new Error('The state link has an invalid mutation path.');
  return {family, tile, cap, path};
}
export function stateURL(base, state) {
  const u = new URL(base);
  u.search = ''; u.hash = '';
  u.searchParams.set('family', state.family);
  u.searchParams.set('tile', state.tile);
  u.searchParams.set('cap', state.cap);
  if (state.path.length) u.searchParams.set('path', state.path.join(','));
  return u.href;
}
export function normalisePositions(p) {
  if (!p.length) return [];
  const xs = p.map(x => x[0]), ys = p.map(x => x[1]);
  const cx = (Math.max(...xs)+Math.min(...xs))/2;
  const cy = (Math.max(...ys)+Math.min(...ys))/2;
  const span = Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys),1e-9)/2;
  return p.map(([x,y]) => [(x-cx)/span,(y-cy)/span]);
}
export function graphPositions(graph, layout='force') {
  const n = graph.nodes.length;
  if (n <= 1) return n ? [[0,0]] : [];
  const circle = graph.nodes.map((_,i) => [Math.cos(2*Math.PI*i/n), Math.sin(2*Math.PI*i/n)]);
  if (layout === 'circle') return circle;
  if (layout === 'shells') {
    const groups = new Map();
    for (const v of graph.nodes) {
      if (!groups.has(v.depth)) groups.set(v.depth,[]);
      groups.get(v.depth).push(v.id);
    }
    const p = Array.from({length:n},()=>[0,0]);
    for (const [d,ids] of groups) ids.forEach((id,i) => {p[id]=[d*Math.cos(2*Math.PI*i/ids.length+d*.21), d*Math.sin(2*Math.PI*i/ids.length+d*.21)];});
    return normalisePositions(p);
  }
  // Deterministic bounded layout. Force calculations never alter graph edges.
  const p = circle.map(([x,y],i)=>[x*(1+.12*Math.sin(i*2.4)),y*(1+.12*Math.cos(i*1.7))]);
  const unique = [...new Map(graph.edges.map(([a,b])=>[`${a}:${b}`,[a,b]])).values()];
  const ideal = 2/Math.sqrt(n), steps = n > 250 ? 70 : 130;
  for (let step=0;step<steps;step++) {
    const dx = new Float64Array(n), dy = new Float64Array(n);
    for(let a=0;a<n;a++) for(let b=a+1;b<n;b++) {
      let x=p[a][0]-p[b][0], y=p[a][1]-p[b][1];
      const r2=Math.max(x*x+y*y,.0001), f=ideal*ideal/r2;
      dx[a]+=x*f;dy[a]+=y*f;dx[b]-=x*f;dy[b]-=y*f;
    }
    for(const [a,b] of unique) {
      const x=p[a][0]-p[b][0], y=p[a][1]-p[b][1],r=Math.hypot(x,y),f=r/ideal;
      dx[a]-=x*f;dy[a]-=y*f;dx[b]+=x*f;dy[b]+=y*f;
    }
    const temp=.12*(1-step/steps)+.005;
    for(let a=0;a<n;a++) {
      dx[a]-=.16*p[a][0];dy[a]-=.16*p[a][1];
      const len=Math.hypot(dx[a],dy[a])||1;
      const scale=Math.min(len,temp)/len;
      p[a][0]+=dx[a]*scale;p[a][1]+=dy[a]*scale;
    }
  }
  return normalisePositions(p);
}
export function escapeHTML(value) {return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
