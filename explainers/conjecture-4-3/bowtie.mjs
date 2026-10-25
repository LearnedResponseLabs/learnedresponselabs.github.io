// The bow-tie section of "The idea, in seven steps": the top cell of Gr(3,5) beside the bow-tie cell, and the bow-tie's
// angles with the collision of its two noncrossing labels 3 and 5. Cells come from the audited kernel; the gaps, the
// admissibility margin and G = B log sin(delta) follow its formulas for any cell (checked against it in
// scripts/check_bowtie.mjs).
import {cell, partition, cycleEdges} from '../cells/kernel.mjs';

export const BOWTIE = [3, 1, 5, 2, 4];
export const TOP = [4, 5, 1, 2, 3];
export const DEFAULT = [0, 0.2, 0.6, 0.5, 0.8];   // theta / pi, admissible for the bow-tie

export function model(C, a) {
  const gaps = C.edges.map(([p, q]) => Math.PI * (a[q] - a[p] + Number(q < p)));
  const admissible = gaps.every(d => 1e-9 < d && d < Math.PI - 1e-9);
  const G = admissible ? C.B.map(row => row.reduce((s, b, j) => s + b * Math.log(Math.sin(gaps[j])), 0)) : null;
  return {gaps, admissible, G};
}

const NS = 'http://www.w3.org/2000/svg';
const CLASS = ([p, q, pq, qp, ud, du]) => pq || qp ? 'crossing' : ud ? 'misaligned (↑↓)' : du ? 'misaligned (↓↑)' : 'aligned';
const fmt = x => (Math.abs(x) < 5e-13 ? 0 : x).toFixed(3);

function graphSVG(C, colors, {dashed = true, size = 230} = {}) {
  const n = C.window.length, r = size * 0.36, c = size / 2;
  const pos = i => [c + r * Math.sin(2 * Math.PI * i / n), c - r * Math.cos(2 * Math.PI * i / n)];
  let s = `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img">`;
  s += `<defs><marker id="bt-ah" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="currentColor"/></marker></defs>`;
  if (dashed) for (const pr of C.pairs) {
    if (pr[2] || pr[3]) continue;
    const [x1, y1] = pos(pr[0]), [x2, y2] = pos(pr[1]);
    s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--muted)" stroke-width="1" stroke-dasharray="3 4"/>`;
  }
  C.edges.forEach(([p, q], j) => {
    const [x1, y1] = pos(p), [x2, y2] = pos(q), len = Math.hypot(x2 - x1, y2 - y1), k = (len - 11) / len;
    s += `<line x1="${x1}" y1="${y1}" x2="${x1 + (x2 - x1) * k}" y2="${y1 + (y2 - y1) * k}" stroke="${colors[j]}" stroke-width="2" style="color:${colors[j]}" marker-end="url(#bt-ah)"/>`;
  });
  for (let i = 0; i < n; i++) {
    const [x, y] = pos(i), [lx, ly] = [c + (r + 17) * Math.sin(2 * Math.PI * i / n), c - (r + 17) * Math.cos(2 * Math.PI * i / n)];
    s += `<circle cx="${x}" cy="${y}" r="6" fill="var(--surface)" stroke="var(--ink)" stroke-width="1.5"/><text x="${lx}" y="${ly + 5}" text-anchor="middle" font-size="14" fill="var(--ink)">${i + 1}</text>`;
  }
  return s + '</svg>';
}

function circleSVG(C, a, colors, M, size = 260) {
  const c = size / 2, r = size * 0.38, pt = t => [c + r * Math.sin(2 * Math.PI * t), c - r * Math.cos(2 * Math.PI * t)];
  let s = `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img"><circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="var(--rule)"/>`;
  C.edges.forEach(([p, q], j) => {
    const [x1, y1] = pt(a[p]), [x2, y2] = pt(a[q]);
    s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${M.admissible ? colors[j] : '#b3364a'}" stroke-width="2"/>`;
  });
  const seen = new Map();
  a.forEach((t, i) => {
    const key = (((t % 1) + 1) % 1).toFixed(6), k = seen.get(key) || 0; seen.set(key, k + 1);
    const [x, y] = pt(t), lr = r + 18 + 14 * k, [lx, ly] = [c + lr * Math.sin(2 * Math.PI * t), c - lr * Math.cos(2 * Math.PI * t)];
    s += `<circle cx="${x}" cy="${y}" r="5.5" fill="var(--ink)"/><text x="${lx}" y="${ly + 5}" text-anchor="middle" font-size="14" fill="var(--ink)">${i + 1}</text>`;
  });
  return s + '</svg>';
}

function mount(host) {
  const B = cell(BOWTIE), T = cell(TOP);
  const cover = partition(B), palette = ['var(--accent)', 'var(--inverse)', '#5f9e2c', '#5a62d6'];
  const cycleOf = j => cover.findIndex(cyc => cycleEdges(cyc).some(([p, q]) => p === B.edges[j][0] && q === B.edges[j][1]));
  const colors = B.edges.map((_, j) => palette[cycleOf(j)] || 'var(--ink)');
  const a = DEFAULT.slice();
  host.innerHTML = `
    <div class="bt-graphs">
      <figure><div class="bt-svg">${graphSVG(T, T.edges.map(() => 'var(--muted)'))}</div></figure>
      <figure><div class="bt-svg">${graphSVG(B, colors)}</div></figure>
    </div>
    <p class="bt-cap"><b>Left:</b> the top cell of Gr(3,5), window 4, 5, 1, 2, 3: all ten pairs of labels cross. <b>Right:</b> the bow-tie,
      window 3, 1, 5, 2, 4, in the same Grassmannian: six crossing edges, two triangles sharing label 2. The dashed pairs do not cross:
      ${B.pairs.filter(pr => !(pr[2] || pr[3])).map(pr => `{${pr[0] + 1}, ${pr[1] + 1}} ${CLASS(pr)}`).join(', ')}.</p>
    <p class="bt-how">Move the angles of the bow-tie. Then make labels 3 and 5 meet.</p>
    <div class="bt-controls">${[1, 2, 3, 4].map(i => `<label><span>θ<sub>${i + 1}</sub> / π</span><output id="bt-o${i}"></output><input type="range" id="bt-s${i}" min="-0.5" max="1.5" step="0.005" value="${a[i]}"></label>`).join('')}</div>
    <div class="bt-buttons"><button type="button" id="bt-meet" class="btn">Make 3 and 5 meet</button><button type="button" id="bt-reset" class="btn">Reset</button></div>
    <div class="bt-live"><div class="bt-svg" id="bt-circle"></div><div id="bt-read"></div></div>`;
  const draw = () => {
    const M = model(B, a);
    host.querySelector('#bt-circle').innerHTML = circleSVG(B, a, colors, M);
    for (let i = 1; i < 5; i++) host.querySelector(`#bt-o${i}`).textContent = a[i].toFixed(3);
    const sums = cover.map(cyc => cycleEdges(cyc).reduce((s, [p, q]) => s + M.gaps[B.edges.findIndex(e => e[0] === p && e[1] === q)], 0) / Math.PI);
    const meet = Math.abs(((a[2] - a[4]) % 1 + 1) % 1) < 1e-9 || Math.abs(((a[2] - a[4]) % 1 + 1) % 1 - 1) < 1e-9;
    const rows = B.edges.map(([p, q], j) => `<tr><td style="color:${colors[j]}">${p + 1} → ${q + 1}</td><td>${fmt(M.gaps[j] / Math.PI)}</td></tr>`).join('');
    host.querySelector('#bt-read').innerHTML = `
      <p class="bt-status ${M.admissible ? 'ok' : 'bad'}">${M.admissible ? 'Admissible: every gap is strictly between 0 and π.' : 'Not admissible: a gap has left (0, π).'}
        ${meet ? (M.admissible ? '<b>Labels 3 and 5 sit at the same point of the circle, and the angles are still admissible.</b> They do not cross, so no gap separates them.' : '') : ''}</p>
      <table class="bt-gaps"><thead><tr><th>Edge</th><th>gap δ / π</th></tr></thead><tbody>${rows}</tbody></table>
      <p class="bt-sums">Gap sums by cycle: ${sums.map((s, k) => `<span style="color:${palette[k]}">cycle ${k + 1}: ${fmt(s)}</span>`).join(' · ')} (each is 1 on admissible angles).</p>
      <p class="bt-g">${M.G ? `The point, in the gradient coordinates: y = (${M.G.map(fmt).join(', ')}).` : 'The point is not defined outside the admissible angles.'}</p>`;
  };
  for (let i = 1; i < 5; i++) host.querySelector(`#bt-s${i}`).addEventListener('input', e => { a[i] = Number(e.target.value); draw(); });
  host.querySelector('#bt-meet').addEventListener('click', () => { a[4] = a[2]; host.querySelector('#bt-s4').value = a[4]; draw(); });
  host.querySelector('#bt-reset').addEventListener('click', () => { DEFAULT.forEach((v, i) => { a[i] = v; if (i) host.querySelector(`#bt-s${i}`).value = v; }); draw(); });
  draw();
}

if (typeof document !== 'undefined') {
  for (const host of document.querySelectorAll('[data-widget="bowtie"]')) mount(host);
}
