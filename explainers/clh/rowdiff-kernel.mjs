// Exact integer evaluation of the row-difference identity P_f D M_N = B.
// Pure functions, no DOM: the page and the command-line checks import the same code.
// Conventions follow the CLH paper, Proposition 10 (the row-difference identity):
//   f is a loopless bounded affine window, i < f(i) <= i + n; f(i) = i + n is a coloop.
//   s_x is the position a with f(a) = x (mod n); (P_f z)_x = z_{s_x}; (D z)_r = z_{r+1} - z_r cyclically.
//   Necklace rows I_r = { f(a) mod n : a < r <= f(a) } (Galashin's affine formula).
//   Refined endpoints on a circle of 5n positions: exit j- at 5(j-1)+1, entry j+ at 5(j-1)+4,
//   so an exit precedes the entry carrying the same integer label.
//   Pair classes from Galashin Section 5.4 and Proposition 5.12 (as reproduced in the paper):
//   Mis-up-down: s_p+, p-, s_q+, q- clockwise; Mis-down-up: the same four counterclockwise;
//   crossing p->q: s_p+, s_q+, p-, q- clockwise. Every other pair is absent from the product.

export const FIXTURES = {
  triangle: {window: [3, 4, 5], title: 'Triangle cell (no coloop)'},
  coloop: {window: [3, 5, 6, 8], title: 'Triangle cell with a coloop at label 4'},
  nontop8: {window: [6, 8, 7, 9, 10, 12, 11, 13], title: 'Non-top cell on eight labels (no coloop)'},
  disconnected: {window: [3, 7, 8, 6, 10, 11], title: 'Two separate triangles on six labels (no coloop)'},
};

export const DEFECTS = {
  none: 'No defect: the paper’s conventions',
  wrong_endpoint: 'Wrong endpoint: arcs closed on the entry side, [sₓ, x) instead of (sₓ, x]',
  wrong_resolution: 'Wrong endpoint order at a shared label: entry placed before exit',
  wrong_lift: 'Wrong affine lift: arc read on the integers, (sₓ, x] with no lift of x past sₓ',
  coloop_unlifted: 'Wrong affine lift for a coloop: lift length 0 instead of n (coloop in no row)',
  wrong_relabel: 'Wrong relabeling endpoint: (P z)ₓ = z at f(x) mod n instead of at sₓ',
};

const mod = (a, m) => ((a % m) + m) % m;

export function parseWindow(w) {
  if (!Array.isArray(w) || w.length < 2 || w.length > 12) throw Error('Window must list 2 to 12 integers');
  const n = w.length;
  const f = w.map(Number);
  f.forEach((v, i) => {
    if (!Number.isInteger(v)) throw Error('Window entries must be integers');
    if (!(i + 1 < v && v <= i + 1 + n)) throw Error('Need i < f(i) <= i + n: a loop f(i) = i is outside the loopless scope');
  });
  const fbar = f.map(v => mod(v - 1, n) + 1);
  if (new Set(fbar).size !== n) throw Error('Residues f(i) mod n must be distinct');
  const s = Array(n + 1).fill(0);
  fbar.forEach((x, i) => { s[x] = i + 1; });
  const coloops = f.map((v, i) => (v === i + 1 + n ? i + 1 : 0)).filter(Boolean);
  return {n, f, fbar, s, coloops};
}

// Galashin's affine formula for the Grassmann necklace, read literally over one period of a.
export function necklaceByDefinition(cell) {
  const {n, f} = cell;
  const F = a => { const i = mod(a - 1, n); return f[i] + (a - 1 - i); };
  const rows = [];
  for (let r = 1; r <= n; r++) {
    const I = new Set();
    for (let a = r - n; a < r; a++) { const fa = F(a); if (a < r && r <= fa) I.add(mod(fa - 1, n) + 1); }
    rows.push([...I].sort((x, y) => x - y));
  }
  return rows;
}

// Arc of rows containing label x, with the lift x' of x satisfying 0 < x' - s_x <= n.
// mode selects the paper's arc or one of the defective readings used as negative controls.
export function arc(cell, x, mode = 'lifted') {
  const {n, s} = cell;
  const sx = s[x];
  let start = sx, len;
  if (mode === 'lifted' || mode === 'wrong_endpoint') len = mod(x - sx - 1, n) + 1;           // 1..n; n for a coloop
  else if (mode === 'unlifted') len = Math.max(0, x - sx);                                    // integer interval, no lift
  else if (mode === 'coloop_unlifted') len = sx === x ? 0 : mod(x - sx - 1, n) + 1;          // coloop given length 0
  else throw Error('Unknown arc mode');
  if (mode === 'wrong_endpoint') start = sx - 1;                                              // [s_x, x) cyclically
  const rows = [];
  for (let t = 1; t <= len; t++) rows.push(mod(start + t - 1, n) + 1);
  return rows.sort((a, b) => a - b);
}

export function necklaceByArcs(cell, mode = 'lifted') {
  const {n} = cell;
  const rows = Array.from({length: n}, () => []);
  for (let x = 1; x <= n; x++) for (const r of arc(cell, x, mode)) rows[r - 1].push(x);
  return rows.map(I => I.sort((a, b) => a - b));
}

function cyclic(points, m) {
  let total = 0;
  for (let i = 0; i < points.length; i++) {
    const step = mod(points[(i + 1) % points.length] - points[i], m);
    if (step <= 0) return false;
    total += step;
  }
  return total === m;
}

export function refined(cell, resolution = 'exit_first') {
  const {n, s} = cell;
  const [ex, en] = resolution === 'exit_first' ? [1, 4] : [4, 1];
  return {
    modulus: 5 * n,
    exit: x => 5 * (x - 1) + ex,
    entry: x => 5 * (s[x] - 1) + en,   // the entry endpoint paired with label x sits at s_x
  };
}

export function classify(cell, p, q, resolution = 'exit_first') {
  const {modulus: m, exit, entry} = refined(cell, resolution);
  const four = [entry(p), exit(p), entry(q), exit(q)];
  if (cyclic(four, m)) return {kind: 'mis_ud'};
  if (cyclic(four.map(v => mod(-v, m)), m)) return {kind: 'mis_du'};
  if (cyclic([entry(p), entry(q), exit(p), exit(q)], m)) return {kind: 'crossing', tail: p, head: q};
  if (cyclic([entry(q), entry(p), exit(q), exit(p)], m)) return {kind: 'crossing', tail: q, head: p};
  return {kind: 'absent'};
}

export function evaluate(window, defect = 'none') {
  if (!(defect in DEFECTS)) throw Error('Unknown defect');
  const cell = parseWindow(window);
  const {n, s, fbar, coloops} = cell;
  const arcMode = {wrong_endpoint: 'wrong_endpoint', wrong_lift: 'unlifted', coloop_unlifted: 'coloop_unlifted'}[defect] || 'lifted';
  const resolution = defect === 'wrong_resolution' ? 'entry_first' : 'exit_first';
  const definition = necklaceByDefinition(cell);
  const lifted = necklaceByArcs(cell, 'lifted');
  const rows = necklaceByArcs(cell, arcMode);
  const member = rows.map(I => new Set(I));
  const pairs = [];
  for (let p = 1; p <= n; p++) for (let q = p + 1; q <= n; q++) pairs.push([p, q]);
  const M = Array.from({length: n}, () => Array(pairs.length).fill(0));
  const B = Array.from({length: n}, () => Array(pairs.length).fill(0));
  const columns = pairs.map(([p, q], j) => {
    const c = classify(cell, p, q, resolution);
    for (let r = 0; r < n; r++) {
      const hp = member[r].has(p), hq = member[r].has(q);
      if (c.kind === 'mis_ud' && hp && hq) M[r][j] += 1;
      if (c.kind === 'mis_du' && !hp && !hq) M[r][j] += 1;
      if (c.kind === 'crossing' && member[r].has(c.tail) && !member[r].has(c.head)) M[r][j] -= 1;
    }
    const truth = classify(cell, p, q, 'exit_first');
    if (truth.kind === 'crossing') { B[truth.tail - 1][j] = -1; B[truth.head - 1][j] = 1; }
    const col = {pair: [p, q], kind: c.kind, coloop: coloops.includes(p) || coloops.includes(q)};
    if (c.kind === 'crossing') {
      col.tail = c.tail; col.head = c.head;
      col.wrapped = c.tail > c.head;                                  // q-tilde = q + n in the affine lift
      col.coincidence = s[c.tail] === c.head;                         // s_p = q
      col.interval_start = s[c.tail]; col.interval_end = s[c.head];   // rows (s_p, s_q]
      col.interval_wraps = s[c.tail] > s[c.head];
    }
    return col;
  });
  const D = M.map((_, r) => M[(r + 1) % n].map((v, j) => v - M[r][j]));
  const relabel = defect === 'wrong_relabel' ? x => fbar[x - 1] : x => s[x];
  const PDM = Array.from({length: n}, (_, i) => D[relabel(i + 1) - 1].slice());
  const difference = PDM.map((row, i) => row.map((v, j) => v - B[i][j]));
  const error = Math.max(0, ...difference.flat().map(Math.abs));
  const badColumns = pairs.map((pq, j) => difference.some(row => row[j] !== 0) ? pq : null).filter(Boolean);
  const counts = {};
  for (const c of columns) { const k = c.coloop ? c.kind + '_coloop' : c.kind; counts[k] = (counts[k] || 0) + 1; }
  return {
    window: [...cell.f], n, s: s.slice(1), fbar, coloops, defect,
    necklace: rows, necklace_definition: definition,
    arcs_agree_with_definition: JSON.stringify(lifted) === JSON.stringify(definition),
    arcs: Array.from({length: n}, (_, i) => arc(cell, i + 1, arcMode)),
    pairs, columns, counts, M, D, PDM, B, difference, error,
    bad_columns: badColumns, identity_holds: error === 0,
  };
}

// Admissible sample angles theta_j = (j-1) pi / (n+1) and the lifted crossing angles
// delta_e = theta_q - theta_p + pi [p > q], the lift theta_{j+n} = theta_j + pi (paper Section 2.1).
export function liftedAngles(window) {
  const r = evaluate(window);
  const theta = Array.from({length: r.n}, (_, i) => i * Math.PI / (r.n + 1));
  const edges = r.columns.filter(c => c.kind === 'crossing').map(c => {
    const raw = theta[c.head - 1] - theta[c.tail - 1];
    const lifted = raw + (c.tail > c.head ? Math.PI : 0);
    return {tail: c.tail, head: c.head, wrapped: c.wrapped, raw, lifted,
      raw_admissible: raw > 0 && raw < Math.PI, lifted_admissible: lifted > 0 && lifted < Math.PI};
  });
  return {theta, edges};
}
