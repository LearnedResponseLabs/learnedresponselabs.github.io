# Figure pack v0.2

These vector figures are inserted into the current v2 external-review source. The v1 PDFs already sent for review remain frozen in Git and deposit history; publishing v2 requires a new versioned PDF rather than overwriting those bytes.

The figure numbers in the headings below are those of the paper of 2026-10-19, which had ten figures. Since 2026-10-22 the paper has twenty-five, so cite a figure by its label (`fig:...`), which does not move.

Since 2026-10-19 every figure is drawn in TikZ, in the paper's fonts (Latin Modern, 11pt) at the text width, so `\includegraphics[width=\linewidth]` does not rescale it. The `.tex` file is canonical; the PDF is its `pdflatex` build and the SVG is `pdftocairo -svg` of the PDF. Entries are filled points and exits open points; the first strand or arc is blue and solid, the second ochre and dashed. These are mathematical illustrations and add no assertion. The data figures (3–5, 8–10) are generated from Lean output lines, which each `.tex` quotes in its comments.

## Figure 1: Critical measurement as a convex gradient

- Assets: `clh_convex_gradient_inverse.tex` (source), `clh_convex_gradient_inverse.pdf`, `clh_convex_gradient_inverse.svg`
- Claim rows: `CLH-1, CLH-2, CLH-3, CLH-4, CLH-5`
- Suggested insertion: After the Introduction subsection 'Contributions and proof architecture'.
- Proposed caption: The proof architecture after the Muller--Speyer twist and logarithmic necklace coordinate change. The map becomes the gradient of an explicit potential; the row-difference and winding-cycle identities make its Hessian positive definite on the gauge slice, exposing the constructive inverse.

## Figure 2: Half-open arcs on the resolved boundary

- Assets: `clh_halfopen_arcs.tex` (source), `clh_halfopen_arcs.pdf`, `clh_halfopen_arcs.svg`
- Redrawn 2026-10-19 in TikZ, in the paper's fonts (Latin Modern, 11pt) at the text width, so `\includegraphics` does not rescale it; open points are exits and filled points entries, as in Figures 4 and 8. Build from this directory: `pdflatex clh_halfopen_arcs.tex`, then `pdftocairo -svg clh_halfopen_arcs.pdf clh_halfopen_arcs.svg`.
- Claim rows: `CLH-4`
- Suggested insertion: After the half-open reading lemma, before the row-difference identity.
- Caption: in `main.tex` (`fig:clh-halfopen`).

## Figure 6: The three regimes of the window transition

- Assets: `clh_window_transition.tex` (source), `clh_window_transition.pdf`, `clh_window_transition.svg`
- Claim rows: `CLH-5`
- Suggested insertion: Before the exact local transition lemma of the window induction.
- Proposed caption: The three regimes of the exact local transition, on one lifted turn starting at a+. Chords run from entry to exit; two chords cross exactly when their endpoints interlace. The upper line shows the chords of w, the lower line those of g; only the entries of alpha and beta differ. The shaded band is the open swept arc from a+ to b+. Schematic; the positions are illustrative.

## Figure 7: Why negative cotangents do not destroy convexity

- Assets: `clh_winding_cycle_hessian.tex` (source), `clh_winding_cycle_hessian.pdf`, `clh_winding_cycle_hessian.svg`
- Claim rows: `CLH-3, CLH-5`
- Suggested insertion: Immediately before Proposition 7 (positive semidefiniteness of the Hessian).
- Proposed caption: The directed crossing edges partition into edge-disjoint winding-one cycles. Individual cotangent weights may be negative, but each cycle quadratic form is positive semidefinite; their sum has exactly the crossing-component shifts as its kernel.

## Figures 3–5 and 8–10 (added 2026-10-18)

Drawn from Lean output; each `.tex` quotes the output lines its values come from.

### Figure 3: A three-label row-difference identity

- Assets: `clh_matrix_small.tex` (source), `clh_matrix_small.pdf`, `clh_matrix_small.svg`
- Claim rows: `CLH-4`
- Suggested insertion: After Proposition `prop:rowdiff` (Figure 3, page 13).
- Proposed caption: The row-difference identity for $\ba=(3,1,2)$. The columns are the three crossings $1\to2$, $2\to3$, $3\to1$, each with $s_p=q$. Rows of $M_N$ are necklace positions; rows of $P_fDM_N$ and $B$ are exit labels. Thus the negative arc indicators become incidence columns, with $-1$ at the tail and $+1$ at the head.

### Figure 4: The four pair classes

- Assets: `clh_pair_classes.tex` (source), `clh_pair_classes.pdf`, `clh_pair_classes.svg`
- Claim rows: `CLH-4`
- Suggested insertion: At the misalignment definitions before `eq:gal512` (Figure 4, page 14).
- Proposed caption: The four pair classes for $\ba=(3,5,1,2,4)$, with $s=s_p$ and $t=s_q$. Each circle is read clockwise. The blue solid strand runs from $b_s^+$ to $b_p^-$; the ochre dashed strand runs from $b_t^+$ to $b_q^-$. Filled points are entries and open points are exits. The crossing has order $b_s^+,b_t^+,b_p^-,b_q^-$; the alignment has order $b_s^+,b_p^-,b_q^-,b_t^+$. The two misalignments read $b_s^+,b_p^-,b_t^+,b_q^-$ clockwise and counterclockwise, respectively.

### Figure 5: Two winding-one partitions

- Assets: `clh_partitions.tex` (source), `clh_partitions.pdf`, `clh_partitions.svg`
- Claim rows: `CLH-5`
- Suggested insertion: At “Choice of partition” (Figure 5, page 19).
- Proposed caption: Two winding-one partitions for $f=(3,5,6,7,9)$. In each panel the blue solid cycle and the ochre dashed cycle together use every directed crossing edge exactly once. Each cycle has total cyclic advance $5$, hence winding $w=5/5=1$. The partitions differ in how the edges through labels $3$ and $4$ are assigned to cycles.

### Figure 8: A resolved boundary and its necklace

- Assets: `clh_boundary_necklace.tex` (source), `clh_boundary_necklace.pdf`, `clh_boundary_necklace.svg`
- Claim rows: `CLH-4`
- Suggested insertion: Appendix B, after the window and necklace rows (Figure 8, page 42).
- Proposed caption: The resolved boundary and necklace of $f=(3,5,6,7,9)$. Chords point from entry to exit; their intersections depict endpoint interlacing. Filled entries and open exits remain distinct when they share an integer label. The necklace rows on the right record membership on the half-open arcs $(s_p,p]$.

### Figure 9: The seven crossing columns

- Assets: `clh_matrix_worked.tex` (source), `clh_matrix_worked.pdf`, `clh_matrix_worked.svg`
- Claim rows: `CLH-4`
- Suggested insertion: Appendix B, “Matrices” (Figure 9, page 43).
- Proposed caption: The seven crossing columns for $f=(3,5,6,7,9)$, in the order shown above the matrices. Necklace positions index the rows of $M_N$; exit labels index the rows of $P_fDM_N$ and $B$. The two lower matrices agree entry by entry. All three omitted noncrossing columns are zero.

### Figure 10: Every crossing column as a half-open arc

- Assets: `clh_column_arcs.tex` (source), `clh_column_arcs.pdf`, `clh_column_arcs.svg`
- Claim rows: `CLH-4`
- Suggested insertion: Appendix B, “Half-open columns” (Figure 10, page 44).
- Proposed caption: Every crossing column as a half-open arc of necklace rows. Double solid circles mark rows in the arc; dashed circles mark the other rows. The exponent is $-1$ on the marked rows and $0$ elsewhere. The cyclic order makes $(4,1]=\{5,1\}$ and $(5,2]=\{1,2\}$.

## Figures drawn from Lean's values (added 2026-10-22)

Fourteen figures redrawn in TikZ, in the paper's fonts, from values computed in Lean at the worked example of Appendix B
(and, for the reduction, loop and sharp-modulus figures, at the inputs their captions give). Each `.tex` gives, in its
comments, the Lean definitions evaluated, the inputs and the SHA-256 of the output lines its values come from.
- **Combinatorial values** are evaluated by the formal definitions of Appendix A, or counted directly where the caption
  says so.
- **Real values** are computed in floating point.

They illustrate and are used in no proof; the paragraph after "Scope, and what is deferred to the companion
manuscript" says so in the paper. Captions are in `main.tex`, at the labels below. Build each as the other figures:
`pdflatex <stem>.tex`, then `pdftocairo -svg <stem>.pdf <stem>.svg`.

| Label | Stem | Shows | Claim rows | Placed |
|---|---|---|---|---|
| `fig:clh-lean-lobachevsky` | `clh_lean_lobachevsky` | $\Lambda$ with the seven gaps $\delta_e$ marked | CLH-2, CLH-3 | after the architecture figure; cited in the Lobachevsky paragraph |
| `fig:clh-lean-admissible` | `clh_lean_admissible` | $\Theadm$ on two planes through $\theta$ | CLH-1 | after `eq:adm-delta` |
| `fig:clh-lean-gauge` | `clh_lean_gauge` | a component shift and a non-component shift, with $G_f$ | CLH-2 | after `eq:delta-increment`'s paragraph |
| `fig:clh-lean-hinge` | `clh_lean_hinge` | the points $v_r$ and the chords $2\sin\delta_e$ | CLH-2 | after Remark `rem:chord` |
| `fig:clh-lean-reduction` | `clh_lean_reduction` | crossing components; deleting a loop | CLH-1; CLH-6 (not claimed) | after Remark `rem:loops` |
| `fig:clh-lean-potential` | `clh_lean_potential` | $\log\sin$, $L$ and $\Psi_f$ along a line above its tangent | CLH-2 | after Proposition `prop:grad` |
| `fig:clh-lean-incidence` | `clh_lean_incidence` | $G_f=B\ell$ as in-minus-out sums | CLH-2 | in the proof of `prop:grad` |
| `fig:clh-lean-wp-count` | `clh_lean_wp_count` | the count \eqref{eq:wp-cycle-count} for both partitions | CLH-5 | after `fig:clh-partitions` |
| `fig:clh-lean-hessian` | `clh_lean_hessian` | the ellipse $h^{\mathsf T}H_fh=1$; $\Psi_f$ below its chord | CLH-3 | after the proof of `prop:psd` |
| `fig:clh-lean-sharp` | `clh_lean_sharp` | the extremal pair of `thm:sharp-cot` | CLH-12 | after Theorem `thm:sharp-cot` |
| `fig:clh-lean-slice-map` | `clh_lean_slice_map` | $G_f$ on a plane of the gauge slice | CLH-1 | in the proof of `thm:main`, *Homeomorphism* |
| `fig:clh-lean-inverse` | `clh_lean_inverse` | level sets of $F_y$, $\theta_*$, projected Newton iterates | CLH-1 | in the proof of `thm:main`, *Variational inverse* |
| `fig:clh-lean-shift` | `clh_lean_shift` | $f$ and $f^\downarrow$ | CLH-7 | start of Section `sec:shift` |
| `fig:clh-lean-column` | `clh_lean_column` | two columns through $D$ and $P_f$ | CLH-4 | Appendix B, after `fig:clh-matrix-worked` |

## The local sign count of the strand-diagram proof (added 2026-10-22)

- Assets: `clh_strand_corner.tex` (source), `clh_strand_corner.pdf`, `clh_strand_corner.svg`
- Label: `fig:clh-strand-corner`; caption in `main.tex`.
- Claim rows: `CLH-5` (the second proof of the partition; nothing depends on it).
- Placed: in the second proof of Proposition `prop:wp`, after the derivation of `eq:signed-excess`.
- Content: (a) an interior crossing at a black corner, with its rays, faces and sign; (b) and (c) the black boundary
  resolution next to a black and a white vertex, exit before entry; (d) the other refinement, entry first, which is not
  used. Schematic; it adds no assertion.

## Rebuild

From this directory, for each figure:

```bash
pdflatex <stem>.tex
pdftocairo -svg <stem>.pdf <stem>.svg
```
