// Integer definitions use zero-based labels internally. Public inputs are sigma,
// in one-based one-line notation. Fixed points encode coloops, never loops.
export const RUNNING = [3, 5, 1, 2, 4];
export const PRESETS = [[3, 1, 2], RUNNING, [5, 1, 3, 2, 4], [3, 1, 2, 6, 4, 5], [2, 5, 3, 7, 1, 4, 6]];
export const range = n => Array.from({length: n}, (_, i) => i);
export const mod = (a, n) => ((a % n) + n) % n;
const sum = xs => xs.reduce((s, x) => s + x, 0);
export function parseWindow(input) {
  let w = input;
  if (typeof input === 'string') {
    const s = input.trim();
    if (!s) throw Error('Enter a permutation of 1 to n, for example 3,5,1,2,4.');
    if (!/^\d+(?:\s*,\s*\d+|\s+\d+)*$/.test(s)) throw Error('Use positive integers separated by commas or spaces; no empty entries.');
    w = s.split(/[\s,]+/).map(Number);
  }
  if (!Array.isArray(w) || w.length < 1 || w.length > 9) throw Error('Use between 1 and 9 labels.');
  if (w.some(x => !Number.isSafeInteger(x))) throw Error('Every label must be an integer.');
  const n = w.length;
  if (w.some(x => x < 1 || x > n)) throw Error(`A window of length ${n} must contain exactly the labels 1 to ${n}.`);
  if (new Set(w).size !== n) throw Error('Each label must appear exactly once; this window repeats a label.');
  return w.slice();
}
export function clockwise4(m, a, b, c, d) {
  const steps = [mod(b-a, m), mod(c-b, m), mod(d-c, m), mod(a-d, m)];
  return steps.every(x => x > 0) && sum(steps) === m;
}
export function multiply(A, B) {
  const width = B[0]?.length ?? 0;
  return A.map(row => range(width).map(j => sum(row.map((x, k) => x * B[k][j]))));
}
export const cycleEdges = c => c.map((p, i) => [p, c[(i+1)%c.length]]);
export const winding = (c, n) => sum(cycleEdges(c).map(([p, q]) => mod(q-p, n)));

export function cell(input) {
  const window = parseWindow(input), n = window.length, labels = range(n), m = 5*n;
  const sigma = window.map(x => x-1), inverse = Array(n);
  sigma.forEach((x, i) => { inverse[x] = i; });
  const entry = labels.map(x => (5*inverse[x]+4)%m), exit = labels.map(x => 5*x+1);
  const cross = (p, q) => clockwise4(m, entry[p], entry[q], exit[p], exit[q]);
  const ud = (p, q) => clockwise4(m, entry[p], exit[p], entry[q], exit[q]);
  const du = (p, q) => clockwise4(m, ...[entry[p], exit[p], entry[q], exit[q]].map(x => mod(-x, m)));
  const edges = labels.flatMap(p => labels.filter(q => cross(p, q)).map(q => [p, q]));
  const pairs = labels.flatMap(p => labels.filter(q => p < q).map(q => [p, q, cross(p,q), cross(q,p), ud(p,q), du(p,q)]));
  const necklace = [], first = labels.filter(x => x <= inverse[x]);
  let prior = new Set(first);
  for (const r of labels) {
    necklace.push([...prior].sort((a,b) => a-b));
    if (prior.has(r)) { prior.delete(r); prior.add(sigma[r]); }
  }
  const M = necklace.map(row => {
    const I = new Set(row);
    return edges.map(([a,b]) => {
      const p = Math.min(a,b), q = Math.max(a,b);
      return Number(ud(p,q) && I.has(p) && I.has(q)) + Number(du(p,q) && !I.has(p) && !I.has(q))
        - Number(cross(p,q) && I.has(p) && !I.has(q)) - Number(cross(q,p) && I.has(q) && !I.has(p));
    });
  });
  const D = labels.map(r => labels.map(s => Number(s === (r+1)%n) - Number(s === r)));
  const P = labels.map(x => labels.map(s => Number(s === inverse[x])));
  const B = labels.map(r => edges.map(([p,q]) => Number(r === q) - Number(r === p)));
  const PDM = multiply(multiply(P,D),M);
  return {window, rank: sigma.filter((x,i) => x <= i).length, inverse, entry, exit, edges, pairs, necklace, M, D, P, B, PDM};
}

// A winding-one simple cycle follows a subset in cyclic label order. Enumerate
// those subsets and solve exact edge cover, with smallest-choice-first search.
// This is a bounded computation, not the choice of witness from an existence proof.
export function partition(C) {
  const n = C.window.length, E = C.edges;
  if (!E.length) return [];
  const index = new Map(E.map((e,j) => [e.join(','), j])), candidates = [], byEdge = E.map(() => []);
  for (let s = 1; s < 2**n; s++) {
    const c = range(n).filter(x => s & (1<<x));
    if (c.length < 3) continue;
    const js = cycleEdges(c).map(e => index.get(e.join(',')));
    if (js.some(j => j === undefined)) continue;
    const bits = js.reduce((b,j) => b | (1n<<BigInt(j)), 0n), k = candidates.length;
    candidates.push({c,bits}); js.forEach(j => byEdge[j].push(k));
  }
  const failed = new Set();
  function visit(left) {
    if (left === 0n) return [];
    if (failed.has(left)) return null;
    let choices = null;
    for (let j=0; j<E.length; j++) if (left & (1n<<BigInt(j))) {
      const available = byEdge[j].filter(k => (candidates[k].bits & left) === candidates[k].bits);
      if (choices === null || available.length < choices.length) choices = available;
      if (!choices.length) break;
    }
    for (const k of choices) {
      const rest = visit(left ^ candidates[k].bits);
      if (rest !== null) return [candidates[k].c, ...rest];
    }
    failed.add(left); return null;
  }
  const result = visit((1n<<BigInt(E.length))-1n);
  if (result === null) throw Error('No winding-one partition was found.');
  return result;
}

export function pairName([p,q,pq,qp,ud,du]) {
  if (pq) return `crossing ${p+1} → ${q+1}`;
  if (qp) return `crossing ${q+1} → ${p+1}`;
  if (ud) return 'Mis↑↓';
  if (du) return 'Mis↓↑';
  return 'aligned';
}

// Float mirror of the running example, with angles supplied in units of pi.
const F = cell(RUNNING), pi = Math.PI;
let fixedCover;
const sumF = sum, intF = x => x;
export function analytic(a, h = [0,1,-0.5,0.25,-0.75]) {
  const cover = fixedCover ??= partition(F);
  const gaps = F.edges.map(([p,q]) => pi*(a[q]-a[p]+Number(q<p)));
  const admissible = gaps.every(d => 1e-9 < d && d < pi-1e-9);
  const weights = gaps.map(d => Math.cos(d)/Math.sin(d));
  const terms = weights.map((w,j) => { const [p,q] = F.edges[j]; const d = h[q]-h[p]; return w*d*d; });
  const cycles = cover.map(c => sumF(cycleEdges(c).map(e => terms[F.edges.findIndex(f => f[0]===e[0] && f[1]===e[1])])));
  const total = sumF(terms);
  const G = admissible ? range(5).map(r => sumF(F.edges.map((_,j) => intF(F.B[r][j])*Math.log(Math.sin(gaps[j]))))) : null;
  const H = range(5).map(r => range(5).map(s => sumF(F.edges.map((_,j) => F.B[r][j]*weights[j]*F.B[s][j]))));
  const Q = sumF(h.map((x,r) => x*sumF(H[r].map((y,s) => y*h[s]))));
  return {gaps, admissible, weights, terms, cycles, total, H, Q, G};
}
const sub = (a,b) => a.map((x,i) => x-b[i]);
const maxAbs = xs => xs.reduce((a,b) => Math.max(a,Math.abs(b)), 0);
// Same elimination order as the numerical illustration in the reading edition.
function solve(A,b) {
  if (!A.length) return [];
  const row = A[0], pivot = row[0];
  const reduced = A.slice(1).map(r => sub(r.slice(1),row.slice(1).map(x => x*(r[0]/pivot))));
  const rhs = A.slice(1).map((r,i) => b[i+1]-r[0]*b[0]/pivot);
  const tail = solve(reduced,rhs);
  return [(b[0]-sumF(row.slice(1).map((x,i) => x*tail[i])))/pivot,...tail];
}
export function inverse(a) {
  const target = analytic(a).G;
  if (!target) return null;
  let x = range(5).map(j => a[0]+j/5);
  const iterates = [x.slice()], residuals = [maxAbs(sub(analytic(x).G,target))], damping = [];
  for (let i=0; i<12; i++) {
    const v = analytic(x), err = sub(v.G,target), step = [0,...solve(v.H.slice(1).map(r => r.slice(1)),err.slice(1))];
    let accepted = false, used = 0;
    for (let k=0; k<16; k++) {
      const t = -1/(pi*2**k), y = x.map((z,j) => z+t*step[j]), ay = analytic(y);
      if (!accepted && ay.admissible && maxAbs(sub(ay.G,target)) < maxAbs(err)) { x=y; accepted=true; used=2**(-k); }
    }
    iterates.push(x.slice()); residuals.push(maxAbs(sub(analytic(x).G,target))); damping.push(used);
  }
  return {target,iterates,residuals,damping};
}
