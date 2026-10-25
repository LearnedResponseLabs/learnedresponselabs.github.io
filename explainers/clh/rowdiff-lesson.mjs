// Lesson G03 of the necklace lab: a necklace difference becomes a graph edge.
// Every matrix below is computed in this page by rowdiff-kernel.mjs with exact integer arithmetic;
// nothing here waits for the browser Python runtime used by the experiments above.
import {FIXTURES, DEFECTS, evaluate, liftedAngles} from './rowdiff-kernel.mjs';

const params = new URLSearchParams(location.search);
const lab = params.get('lab') || 'landscape';
const root = document.getElementById('g03-lesson');
const ANCHORS = ['g03', 'g03-coloop', 'g03-wrap', 'g03-coincide', 'g03-controls', 'g03-boundary'];
const KIND = {
  crossing: ['crossing', 'Directed crossing: exponent −1 on rows containing the tail but not the head.'],
  mis_ud: ['Mis↑↓', 'Mis↑↓: +1 only on rows containing both labels.'],
  mis_du: ['Mis↓↑', 'Mis↓↑: +1 only on rows containing neither label.'],
  absent: ['absent', 'In no class of Proposition 5.12: the pair does not occur in the product, exponent 0.'],
};
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const sub = (a, b) => `${a}<sub>${b}</sub>`;
const signed = v => (v > 0 ? '+' + v : String(v));
const set = I => '{' + I.join(',') + '}';

let state = {
  fixture: FIXTURES[params.get('g03')] ? params.get('g03') : 'triangle',
  pair: params.get('g03pair') || null,
  defect: DEFECTS[params.get('g03defect')] ? params.get('g03defect') : 'none',
};

function pairKey(p) { return p[0] + '-' + p[1]; }

function defaultPair(r) {
  const c = r.columns.find(c => c.kind === 'crossing' && c.wrapped) || r.columns.find(c => c.kind === 'crossing') || r.columns[0];
  return pairKey(c.pair);
}

function chip(c, selected) {
  const [label] = KIND[c.kind];
  const cls = ['g03-chip', 'k-' + c.kind, c.coloop ? 'coloop' : '', selected ? 'on' : ''].join(' ');
  const text = c.kind === 'crossing' ? `${c.tail}→${c.head}` : `${c.pair[0]},${c.pair[1]}`;
  const tags = [label, c.coloop ? 'coloop pair' : '', c.wrapped ? 'wrapped' : '', c.coincidence ? 'sₚ = q' : ''].filter(Boolean).join(' · ');
  return `<button type="button" class="${cls}" data-pair="${pairKey(c.pair)}" aria-pressed="${selected}" title="${esc(tags)}"><b>${text}</b><small>${esc(tags)}</small></button>`;
}

function endpointSVG(r, col) {
  const n = r.n, m = 5 * n, R = 118, cx = 170, cy = 150;
  const at = pos => { const a = -Math.PI / 2 + 2 * Math.PI * pos / m; return [cx + R * Math.cos(a), cy + R * Math.sin(a), a]; };
  const exitPos = x => 5 * (x - 1) + (state.defect === 'wrong_resolution' ? 4 : 1);
  const entryPos = x => 5 * (r.s[x - 1] - 1) + (state.defect === 'wrong_resolution' ? 1 : 4);
  const [p, q] = col.pair;
  const marks = [
    [entryPos(p), 'p', `entry paired with ${p}, at s${sub('', p)} = ${r.s[p - 1]}`],
    [exitPos(p), 'p', `exit of ${p}`],
    [entryPos(q), 'q', `entry paired with ${q}, at s${sub('', q)} = ${r.s[q - 1]}`],
    [exitPos(q), 'q', `exit of ${q}`],
  ];
  let out = `<svg viewBox="0 0 340 300" role="img" aria-label="Refined endpoints on the circle for the pair ${p}, ${q}"><circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#c9d6dc" stroke-width="2"/>`;
  for (let j = 1; j <= n; j++) {
    for (const [pos, sign] of [[exitPos(j), '⁻'], [5 * (j - 1) + (state.defect === 'wrong_resolution' ? 1 : 4), '⁺']]) {
      const [x, y, a] = at(pos);
      out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="#8aa1ad"/>`;
      const lx = cx + (R + 17) * Math.cos(a), ly = cy + (R + 17) * Math.sin(a) + 4;
      out += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" font-size="10.5" fill="#506779">${j}${sign}</text>`;
    }
  }
  marks.forEach(([pos, who], i) => {
    const [x, y, a] = at(pos);
    const color = who === 'p' ? '#08685f' : '#955009';
    out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" fill="${color}"/><text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="middle" font-size="10" font-weight="700" fill="white">${i + 1}</text>`;
    const ix = cx + (R - 26) * Math.cos(a), iy = cy + (R - 26) * Math.sin(a) + 4;
    out += `<text x="${ix.toFixed(1)}" y="${iy.toFixed(1)}" text-anchor="middle" font-size="10" fill="${color}">${i % 2 ? 'exit' : 'entry'}</text>`;
  });
  const verdict = KIND[col.kind][0] + (col.kind === 'crossing' ? ` ${col.tail}→${col.head}` : '');
  out += `<text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="16" font-weight="700" fill="#192d3c">${esc(verdict)}</text><text x="${cx}" y="${cy + 15}" text-anchor="middle" font-size="11" fill="#506779">clockwise from the top</text></svg>`;
  const legend = `<ol class="g03-order">${marks.map(([pos, who, text]) => `<li class="${who}">${text} <small>(position ${pos} of ${m})</small></li>`).join('')}</ol>`;
  return out + legend;
}

function columnTables(r, j) {
  const col = r.columns[j], [p, q] = col.pair;
  const head = `<tr><th>row r</th><th>${sub('I', 'r')}</th><th>${p}∈${sub('I', 'r')}</th><th>${q}∈${sub('I', 'r')}</th><th>m<sub>r</sub></th><th>(Dm)<sub>r</sub></th></tr>`;
  const body = r.necklace.map((I, i) => {
    const hp = I.includes(p), hq = I.includes(q), v = r.M[i][j], d = r.D[i][j];
    return `<tr><td>${i + 1}</td><td>${set(I)}</td><td>${hp ? '✓' : '·'}</td><td>${hq ? '✓' : '·'}</td><td class="v${Math.sign(v)}">${signed(v)}</td><td class="v${Math.sign(d)}">${signed(d)}</td></tr>`;
  }).join('');
  const relabel = state.defect === 'wrong_relabel' ? x => r.fbar[x - 1] : x => r.s[x - 1];
  const head2 = `<tr><th>label x</th><th>${state.defect === 'wrong_relabel' ? 'f(x) mod n' : sub('s', 'x')}</th><th>(P D m)<sub>x</sub></th><th>B<sub>x</sub></th><th></th></tr>`;
  const body2 = r.PDM.map((row, i) => {
    const v = row[j], b = r.B[i][j];
    return `<tr><td>${i + 1}</td><td>${relabel(i + 1)}</td><td class="v${Math.sign(v)}">${signed(v)}</td><td class="v${Math.sign(b)}">${signed(b)}</td><td>${v === b ? '=' : '<b class="bad">≠</b>'}</td></tr>`;
  }).join('');
  return `<div class="g03-tables"><div class="scroll"><table class="source-table g03-table" data-table="rows"><caption>Necklace rows and the exponent column of the pair {${p},${q}}</caption>${head}${body}</table></div><div class="scroll"><table class="source-table g03-table" data-table="labels"><caption>Relabeled by (P z)<sub>x</sub> = z at ${state.defect === 'wrong_relabel' ? 'f(x) mod n (defect)' : 's<sub>x</sub>'}</caption>${head2}${body2}</table></div></div>`;
}

function stepText(r, col) {
  if (state.defect !== 'none') return '<p><b class="bad">A defect is selected.</b> The column below is computed with that defect; compare it with the description you get when the defect is off.</p>';
  const n = r.n;
  if (col.kind === 'crossing') {
    const a = col.interval_start, b = col.interval_end;
    return `<p>The four refined endpoints occur clockwise as s<sub>p</sub><sup>+</sup>, s<sub>q</sub><sup>+</sup>, p<sup>−</sup>, q<sup>−</sup> with p = ${col.tail}, q = ${col.head}: a directed crossing ${col.tail}→${col.head}. By the half-open arc lemma the rows containing ${col.tail} but not ${col.head} are exactly (s<sub>p</sub>, s<sub>q</sub>] = (${a}, ${b}]${col.interval_wraps ? `, an interval that passes from row ${n} to row 1` : ''}, so the column is −1 there and 0 elsewhere. The forward difference keeps only the two jumps, −1 at row ${a} and +1 at row ${b}; relabeling sends row s<sub>x</sub> to label x, so the jumps land on labels ${col.tail} and ${col.head}: the incidence column e<sub>${col.head}</sub> − e<sub>${col.tail}</sub>.</p>`;
  }
  const [p, q] = col.pair;
  if (col.kind === 'mis_ud') return `<p>Mis↑↓: the endpoints occur clockwise as s<sub>p</sub><sup>+</sup>, p<sup>−</sup>, s<sub>q</sub><sup>+</sup>, q<sup>−</sup>. The arcs of ${p} and ${q} are disjoint, so no necklace row contains both, and the +1 that Proposition 5.12 puts on such rows never occurs: the column is zero.</p>`;
  if (col.kind === 'mis_du') return `<p>Mis↓↑: the same four endpoints occur counterclockwise. The arcs of ${p} and ${q} cover every row, so no necklace row omits both, and the +1 on rows containing neither never occurs: the column is zero.${col.coloop ? ' Here one label is a coloop, which lies in every row, so this is immediate.' : ''}</p>`;
  return `<p>No class: the pair {${p},${q}} is not in the product of Proposition 5.12 at all, so its exponent is zero on every row${col.coloop ? '. A pair meeting a coloop is never a crossing and never Mis↑↓' : ''}.</p>`;
}

function coloopBox(r) {
  if (!r.coloops.length) {
    return `<p>This cell has no coloop. <a href="lab.html?lab=necklace&g03=coloop#g03-coloop">Open the triangle cell with a coloop at label 4</a>.</p>`;
  }
  const c = r.coloops[0];
  const cols = r.columns.filter(k => k.coloop);
  const rowsWith = r.necklace.filter(I => I.includes(c)).length;
  const zero = cols.every(k => r.pairs.findIndex(p => pairKey(p) === pairKey(k.pair)) >= 0 && r.M.every(row => row[r.pairs.findIndex(p => pairKey(p) === pairKey(k.pair))] === 0));
  return `<p>Label ${c} is a coloop: f(${c}) = ${c} + n = ${r.window[c - 1]}, so s<sub>${c}</sub> = ${c} and its lifted arc has length n: it is every row. Label ${c} lies in ${rowsWith} of ${r.n} necklace rows. Exit ${c}<sup>−</sup> sits immediately before entry ${c}<sup>+</sup>, so no endpoint lies between them; a pair meeting ${c} can be neither a crossing nor Mis↑↓.</p>
  <div class="g03-coloop-cols">${cols.map(k => `<div class="g03-coloop-col"><b>{${k.pair.join(',')}}</b> ${esc(KIND[k.kind][0])}: M<sub>N</sub> column ${r.M.map(row => row[r.pairs.findIndex(p => pairKey(p) === pairKey(k.pair))]).join(' ')} ; B column ${r.B.map(row => row[r.pairs.findIndex(p => pairKey(p) === pairKey(k.pair))]).join(' ')}</div>`).join('')}</div>
  <p>${zero ? 'Every coloop pair column is zero in M<sub>N</sub>, and the coloop row of B is zero: both sides vanish, which is the paper’s Coloops step. These columns are neither crossings nor ordinary absent pairs; they are counted separately below.' : '<b class="bad">A coloop column is nonzero under the selected defect.</b>'}</p>`;
}

function wrapBox(r) {
  const angles = liftedAngles(r.window);
  const e = angles.edges.find(x => x.wrapped);
  const rowWrap = r.columns.find(c => c.kind === 'crossing' && c.interval_wraps);
  if (!e) return '<p>This cell has no wrapped edge.</p>';
  const n = r.n, th = angles.theta;
  const deg = v => (v * 180 / Math.PI).toFixed(1) + '°';
  return `<p>The crossing <b>${e.tail}→${e.head}</b> is wrapped: its head label ${e.head} comes before its tail ${e.tail}. Galashin’s affine lift reads angles on the line with θ<sub>j+n</sub> = θ<sub>j</sub> + π, and the edge angle uses the forward lift of the head past the tail: δ<sub>e</sub> = θ<sub>${e.head}+${n}</sub> − θ<sub>${e.tail}</sub> = θ<sub>${e.head}</sub> − θ<sub>${e.tail}</sub> + π.</p>
  <div class="metrics"><div class="metric"><span>sample angles θ<sub>j</sub> = (j−1)π/(n+1)</span><strong>${th.map(deg).join(', ')}</strong></div><div class="metric"><span>raw difference θ<sub>${e.head}</sub> − θ<sub>${e.tail}</sub></span><strong>${deg(e.raw)}</strong><small>${e.raw_admissible ? 'in (0,π)' : 'outside (0,π): the unlifted reading fails'}</small></div><div class="metric"><span>lifted δ<sub>e</sub></span><strong>${deg(e.lifted)}</strong><small>${e.lifted_admissible ? 'in (0,π), as admissibility requires' : 'outside (0,π)'}</small></div></div>
  <p>The same lift is what makes each necklace arc half-open. Label x lies in row r exactly when r is in (s<sub>x</sub>, x], read with the lift x′ of x that satisfies 0 &lt; x′ − s<sub>x</sub> ≤ n. Here ${[e.tail, e.head].map(x => `x = ${x}: s<sub>x</sub> = ${r.s[x - 1]}, rows ${set(r.arcs[x - 1])}`).join('; ')}.${rowWrap ? ` Row intervals wrap too: the column of ${rowWrap.tail}→${rowWrap.head} is −1 on (${rowWrap.interval_start}, ${rowWrap.interval_end}], which passes from row ${n} to row 1.` : ''} Choose the defect “wrong affine lift” to read the arcs on the integers without the lift and watch the identity break.</p>
  <p class="g03-note">The angle lift belongs to the gradient identity built on this one; this lesson states it for the same edge and evaluates only the matrix identity.</p>`;
}

function coincideBox(r) {
  const cs = r.columns.filter(c => c.kind === 'crossing' && c.coincidence);
  const clean = evaluate(r.window, 'none');
  const flipped = evaluate(r.window, 'wrong_resolution');
  const moved = clean.columns.filter((c, i) => c.kind === 'crossing' && c.coincidence && flipped.columns[i].kind !== 'crossing');
  if (!cs.length) return '<p>No crossing in this cell has s<sub>p</sub> = q.</p>';
  return `<p>For ${cs.map(c => `${c.tail}→${c.head}`).join(', ')} the entry endpoint at s<sub>p</sub> carries the label q itself: s<sub>p</sub> = q. That entry shares its integer with the exit q<sup>−</sup>. The paper places the exit immediately before the entry, which is consistent with the crossing order s<sub>p</sub><sup>+</sup>, s<sub>q</sub><sup>+</sup>, p<sup>−</sup>, q<sup>−</sup>, and the column stays −1 on (s<sub>p</sub>, s<sub>q</sub>]. The other coincidence, s<sub>q</sub> = p, would need p<sup>+</sup> before p<sup>−</sup> and never gives a crossing.</p>
  <p>Placing the entry first instead (defect “wrong endpoint order”) reclassifies ${moved.length} of these ${cs.length} edges as non-crossing pairs, and P<sub>f</sub> D M<sub>N</sub> then differs from B in ${flipped.bad_columns.length} column${flipped.bad_columns.length === 1 ? '' : 's'}.</p>`;
}

function defectBanner(r) {
  if (state.defect === 'none') return `<div class="g03-verdict ok" data-verdict="pass">P<sub>f</sub> D M<sub>N</sub> = B holds exactly on all ${r.pairs.length} pair columns of this cell (maximum integer discrepancy ${r.error}).</div>`;
  const applicable = state.defect !== 'coloop_unlifted' || r.coloops.length > 0;
  if (!applicable) return `<div class="g03-verdict na" data-verdict="not-applicable">${esc(DEFECTS[state.defect])}: not applicable, this cell has no coloop.</div>`;
  return r.error ? `<div class="g03-verdict fail" data-verdict="control-fails">Defect control. ${esc(DEFECTS[state.defect])}. The equality fails, as a defect must: maximum discrepancy ${r.error}, in ${r.bad_columns.length} of ${r.pairs.length} columns.</div>`
    : `<div class="g03-verdict bad" data-verdict="control-passed">Defect control did NOT break the equality: this control is not informative on this cell.</div>`;
}

function summary(r) {
  const n0 = r.columns.filter(c => c.kind !== 'crossing').length;
  const counts = [
    ['crossing', r.columns.filter(c => c.kind === 'crossing').length],
    ['Mis↑↓', r.columns.filter(c => c.kind === 'mis_ud' && !c.coloop).length],
    ['Mis↓↑', r.columns.filter(c => c.kind === 'mis_du' && !c.coloop).length],
    ['absent', r.columns.filter(c => c.kind === 'absent' && !c.coloop).length],
    ['coloop pairs', r.columns.filter(c => c.coloop).length],
  ];
  const diff = `<div class="scroll"><table class="source-table g03-diff"><caption>P<sub>f</sub> D M<sub>N</sub> − B, every unordered pair column</caption><tr><th>x</th>${r.pairs.map(p => `<th>${p.join(',')}</th>`).join('')}</tr>${r.difference.map((row, i) => `<tr><td>${i + 1}</td>${row.map(v => `<td class="v${Math.sign(v)}">${v}</td>`).join('')}</tr>`).join('')}</table></div>`;
  return `<div class="metrics">${counts.map(([k, v]) => `<div class="metric"><span>${k} columns</span><strong>${v}</strong></div>`).join('')}<div class="metric"><span>non-crossing columns of M<sub>N</sub> that are zero</span><strong>${r.columns.filter((c, j) => c.kind !== 'crossing' && r.M.every(row => row[j] === 0)).length} / ${n0}</strong></div><div class="metric"><span>necklace by arcs = by definition</span><strong>${r.arcs_agree_with_definition ? 'yes' : 'no'}</strong></div></div>${diff}`;
}

async function claimPanel() {
  try {
    const d = await (await fetch('data/rowdiff-claim-panel.json')).json();
    return `<h3>What CLH-4 states</h3><p><span class="g03-status">${esc(d.status)}</span> ${esc(d.statement)}</p><p class="g03-note">${esc(d.status_detail)}</p><p class="g03-note">${esc(d.attribution)}</p>`;
  } catch (e) {
    return '<p>The claim text could not be loaded.</p>';
  }
}

async function render() {
  const r = evaluate(FIXTURES[state.fixture].window, state.defect);
  if (!state.pair || !r.pairs.some(p => pairKey(p) === state.pair)) state.pair = defaultPair(r);
  const j = r.pairs.findIndex(p => pairKey(p) === state.pair);
  const col = r.columns[j];
  window.__G03_LAST__ = {state: {...state}, result: r};
  root.querySelector('#g03-live').innerHTML = `
    <div class="g03-controls controls" id="g03-controls">
      <div class="control"><label for="g03-fixture">Cell (window f(1), …, f(n))</label><select id="g03-fixture">${Object.entries(FIXTURES).map(([k, v]) => `<option value="${k}" ${k === state.fixture ? 'selected' : ''}>${esc(v.title)}: (${v.window.join(',')})</option>`).join('')}</select></div>
      <div class="control"><label for="g03-defect">Defect control</label><select id="g03-defect">${Object.entries(DEFECTS).map(([k, v]) => `<option value="${k}" ${k === state.defect ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select></div>
    </div>
    ${defectBanner(r)}
    <div class="g03-chips" role="group" aria-label="Pair columns">${r.columns.map((c, i) => chip(c, i === j)).join('')}</div>
    <div class="g03-legend"><span class="k-crossing">crossing</span><span class="k-mis_ud">Mis↑↓</span><span class="k-mis_du">Mis↓↑</span><span class="k-absent">absent</span><span class="coloop">coloop pair (dashed)</span></div>
    <div class="g03-grid">
      <section class="panel"><header><div class="kicker">1 · four refined endpoints</div><h2>Which class is the pair {${col.pair.join(',')}}?</h2><p>Exit j<sup>−</sup> sits just before entry j<sup>+</sup>. The pair’s entries sit at s<sub>p</sub> = ${r.s[col.pair[0] - 1]} and s<sub>q</sub> = ${r.s[col.pair[1] - 1]}.</p></header><div class="content g03-svg" id="g03-endpoints">${endpointSVG(r, col)}</div></section>
      <section class="panel"><header><div class="kicker">2 · exponent column → difference → relabel</div><h2>${col.kind === 'crossing' ? `An interval becomes the edge ${col.tail}→${col.head}` : 'A non-crossing column is zero'}</h2></header><div class="content" id="g03-column">${stepText(r, col)}${columnTables(r, j)}</div></section>
    </div>
    <section class="panel full" id="g03-matrix"><header><div class="kicker">3 · the whole matrix, exactly</div><h2>All pair columns of this cell</h2><p>Computed in this page with exact integer arithmetic; no plot tolerance and no browser Python.</p></header><div class="content">${summary(r)}</div></section>`;
  root.querySelector('#g03-coloop-body').innerHTML = coloopBox(evaluate(FIXTURES[state.fixture].window, state.defect === 'coloop_unlifted' ? 'coloop_unlifted' : 'none'));
  root.querySelector('#g03-wrap-body').innerHTML = wrapBox(evaluate(FIXTURES[state.fixture].window));
  root.querySelector('#g03-coincide-body').innerHTML = coincideBox(evaluate(FIXTURES[state.fixture].window));
  root.querySelector('#g03-fixture').addEventListener('change', e => { state.fixture = e.target.value; state.pair = null; render(); });
  root.querySelector('#g03-defect').addEventListener('change', e => { state.defect = e.target.value; render(); });
  root.querySelectorAll('[data-pair]').forEach(b => b.addEventListener('click', () => { state.pair = b.dataset.pair; render(); }));
  const q = new URLSearchParams(location.search);
  q.set('lab', 'necklace'); q.set('g03', state.fixture); q.set('g03pair', state.pair);
  if (state.defect === 'none') q.delete('g03defect'); else q.set('g03defect', state.defect);
  history.replaceState(null, '', '?' + q.toString() + location.hash);
}

async function main() {
  if (!root) return;
  if (lab !== 'necklace') { root.hidden = true; window.__G03_READY__ = true; return; }
  root.innerHTML = `
    <header class="hero g03-hero" id="g03"><div class="kicker">Lesson G03 · the row-difference identity</div><h2>A necklace difference becomes a graph edge</h2>
    <div class="intro">Pick a pair of labels. Galashin’s necklace exponent formula gives that pair a column over the necklace rows. Take the cyclic forward difference of the rows, then relabel row s<sub>x</sub> as label x. A crossing pair comes out as the incidence column of its directed edge; every other pair comes out as zero. Together the columns give P<sub>f</sub> D M<sub>N</sub> = B.</div>
    <p class="g03-note">Everything in this lesson is computed live in the page with exact integers. It does not depend on the browser Python runtime of the experiment above.</p></header>
    <div id="g03-live"></div>
    <div class="g03-boxes">
      <section class="panel" id="g03-coloop"><header><div class="kicker">coloop column</div><h2>A coloop is in every row and crosses nothing</h2></header><div class="content" id="g03-coloop-body"></div></section>
      <section class="panel" id="g03-wrap"><header><div class="kicker">wrapped edge</div><h2>The affine lift, stated</h2></header><div class="content" id="g03-wrap-body"></div></section>
      <section class="panel" id="g03-coincide"><header><div class="kicker">the coincidence s<sub>p</sub> = q</div><h2>An entry and an exit share a label</h2></header><div class="content" id="g03-coincide-body"></div></section>
    </div>
    <section class="panel full g03-boundary" id="g03-boundary"><header><div class="kicker">claim boundary</div><h2>What is claimed, what this page shows, what it does not establish</h2></header><div class="content">
      <div id="g03-claim"></div>
      <h3>What this page shows</h3><p>Exact integer evaluation of P<sub>f</sub> D M<sub>N</sub> = B, over every unordered pair column, on four fixed small cells: the triangle (3,4,5), the same triangle with a coloop (3,5,6,8), two separate triangles (3,7,8,6,10,11) and a non-top cell on eight labels (6,8,7,9,10,12,11,13). Crossing, Mis, absent and coloop columns are shown separately. Five defect controls — wrong arc endpoint, wrong endpoint order at a shared label, wrong affine lift, a coloop read without its lift, and relabeling at the wrong endpoint — each break the equality on the cells where they apply.</p>
      <h3>What it does not establish</h3><ul><li>The identity for any other cell. Four finite checks are not the all-cell symbolic proof, and the paper uses no finite computation as a premise.</li><li>The formal (Lean) coverage: the machine proof covers the crossing-edge columns and the coloop step; the vanishing of the non-crossing pair columns is proved symbolically in the paper and is not formalized. This page is neither.</li><li>Anything about the gradient identity, convexity or the homeomorphism built on this identity.</li><li>External review. The statement is a proof candidate; no mathematician outside the program has checked it.</li></ul>
    </div></section>`;
  root.querySelector('#g03-claim').innerHTML = await claimPanel();
  try { await render(); } catch (e) { root.querySelector('#g03-live').innerHTML = `<div class="error">${esc(e.message)}</div>`; }
  window.__G03_READY__ = true;
  const target = location.hash.slice(1);
  if (ANCHORS.includes(target)) {
    // The lab above renders asynchronously and can move this section; scroll again once it is ready.
    const go = () => document.getElementById(target)?.scrollIntoView({behavior: 'instant', block: 'start'});
    go();
    for (let i = 0; i < 40 && !window.__CLH_APP_READY__; i++) await new Promise(res => setTimeout(res, 100));
    await new Promise(res => requestAnimationFrame(() => setTimeout(res, 50)));
    go();
  }
  window.__G03_SCROLLED__ = true;
}

main();
