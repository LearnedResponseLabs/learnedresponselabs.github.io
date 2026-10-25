# conj43_loopless_homeomorphism

<!-- claims-sync: status=AUTHOR_REVIEW manifest=CLAIMS.md -->

**Galashin's Conjecture 4.3 via a convex gradient.**

Main result (Theorem 1, `thm:main`): for every loopless bounded affine permutation `f`, the critical
measurement map `Meas_f : Θ_f^{>0} → Crit_f^{>0}` is a homeomorphism, uniform in `(k,n)`, with a
**constructive** inverse `Meas_f^{-1} = G_f^{-1} ∘ R_f`. This is Galashin's Conjecture 4.3 for the loopless
case.

The inverse also has the variational form
`Meas_f^{-1}(X) = argmin_{theta in Θ_f^{>0}} [Ψ_f(theta) - <R_f(X), theta>]`.
For `X in Crit_f^{>0}` the minimizer exists and is unique. This does not assert
existence for arbitrary targets in `im(B)` or convergence of a numerical solver.

**The idea.** After the Muller–Speyer twist and log Grassmann-necklace coordinates `R_f`, the measurement
map becomes a gradient: `R_f ∘ Meas_f = ∇Ψ_f` for an explicit potential `Ψ_f = Σ_e L(δ_e)`, `L'=log sin`,
with Hessian `B·diag(cot δ_e)·Bᵀ`. The potential is not convex edge-by-edge (`cot δ_e < 0` when
`δ_e > π/2`), but the crossing edges partition into **winding-one cycles**, and a cotangent cycle
inequality makes the Hessian PSD with kernel exactly the component shifts. Convexity ⇒ injective +
immersion + a continuous inverse (invariance of domain applied only between Euclidean spaces `S → im(B)`).
The gradient identity rests on a combinatorial fact, proved uniformly with no enumeration of cells: the cyclic row-difference of Galashin's
twisted-necklace exponent matrix is the incidence matrix `B`. The paper states, where the gradient identity is
proved, why it holds at admissible collisions of noncrossing labels: Galashin's Proposition 5.12 applies
at every point of the gauge slice, and component shifts carry the identity to the ambient chamber.

The same cycle mechanism is quantitative away from the angular walls. For a cycle of length `m` with
all angles at least `eta`, the exact modulus is
`kappa_m^star(eta)=[cot eta-(m-1)cot((m-1)eta)]/m`. This sharp single-cycle theorem gives an explicit
fixed-partition graph-Laplacian sandwich and inverse-Lipschitz bound in Euclidean log-necklace-gradient
coordinates. It does not assert global optimality across winding-one partitions or an intrinsic
Grassmannian metric bound; see `CLAIMS.md` CLH-12.

The partition-independent full-Hessian refinement of this bound for the dense cyclic `n=5` cell is an
exact computer-assisted theorem and belongs to the companion manuscript (in preparation), not here; see
“Boundary compatibility of the critical Gr–OG shift, and exact finite atlases” BFA-5.

**Corollaries 31–33.** Inverting `G_f` at any point of its image is the same strictly convex
minimization (Corollary 31, `cor:gradient-preimage`; a Lean theorem). The ordinary necklace minors
alone determine a critical point: `X ↦ [Δ_{I_1}(X) : ⋯ : Δ_{I_n}(X)]` embeds `Crit_f^{>0}` in positive
projective space, and the twist enters only the proof of the gradient identity (Remark `rem:untwisted`,
Corollary 32, `cor:necklace-embedding`). The critical cell is a real-analytic submanifold, `Meas_f` is a
real-analytic diffeomorphism onto it, and the necklace map is a real-analytic embedding (Corollary 33,
`cor:analytic-critical`). See `CLAIMS.md` CLH-13 to CLH-15.

**All-rank application.** Galashin's Proposition 8.9 applies uniformly: for every loopless `f`, its
shift `f_down(p)=f(p-1)` carries a constructive homeomorphism from `Crit_f^{>0}` to the dual critical
locus for `f_down`. For every matching `tau`, `(f_tau^elec)_down=f_tau^Ising`; on the common
`tau`-isotropic chamber this sends the critical electrical response point to the critical Ising
boundary-correlation point of the same generalized region. See Corollary `cor:shift` and `CLAIMS.md`
CLH-7.

**Boundary results are in the companion manuscript.** The compactification of that shift, its stratified descent,
the top-cell homeomorphism of compactified critical loci, and the exact finite atlases at `n=5` and
`n=6` are claimed in “Boundary compatibility of the critical Gr–OG shift, and exact finite atlases” (BFA-1..BFA-5),
a manuscript in preparation, not here. Two of those results are computer-assisted and the boundary proofs are written at a lower
density than this paper's core. Nothing here depends on them.

## Tier — read this first
Everything positive is `PROVED_DRAFT`: a written proof exists in the paper and external mathematical
review has not occurred. **Every proof in this paper is symbolic** — no row depends on a finite
computation or a numerical certificate. The computer-assisted results are in the companion manuscript.
**This is not external mathematical review.** See `CLAIMS.md` (the authoritative surface).

## Honest boundary
- **Loopless measurement theorem, and nothing about the boundary.** No measurement extension to decorated/looped cells; not Galashin's Problem 5.2;
  and no compactification or boundary claim of any kind — those are the
  companion manuscript's. See `CLAIMS.md` CLH-6. The paper carries a remark (Remark 8, `rem:loops`) giving a proof candidate for a looped extension
  under a reading of Galashin's Definition 1.8 that is the paper's own: the length bookkeeping is cited
  from Lam and Postnikov and its combinatorial facts are Lean theorems; the remark states that none of it
  is claimed;
  Galashin states Conjecture 4.3 for loopless `f` only. The purely combinatorial
  partition statement depends only on the induced permutation and therefore ignores
  fixed-point decorations; this does not extend the measurement theorem.
  Problem 5.2 is addressed by the separate
  Problem 5.2 manuscript, not by this paper.
- **Citations: inherited checks from 2026-09-08; Kenyon additions checked 2026-09-23.** The seven hyperbolic-geometry references in the
  prior-work subsection (Milnor; Rivin 1994, 1996; Futer–Guéritaud; Bobenko–Springborn; Duffin;
  Pinkall–Polthier) were verified against the sources — bibliographic data and the statement each is
  cited for — and the entries now carry volume, issue and page ranges. The Postnikov pointers were
  checked against arXiv:math/0609764 (single version, no journal counterpart): `Cor. 14.2` and
  `Cor. 14.7` are right, and **`Fig. 14.2` was wrong** — it is the figure of moves of alternating
  strand diagrams, not a boundary resolution — so the pointer now goes to the map `T ↦ D` following
  `Def. 14.3` and `Lem. 14.4`, the step that merges the boundary vertex pairs `b_i, b'_i`. Since 2026-10-22
  the strand proof derives its sign count ray by ray, and the black boundary resolution it uses is a local
  construction added to that merge, not stated by it. Nothing in the paper
  depends on any of these references; the Postnikov layer is used only by the first of the two proofs of
  `prop:wp`. Every Galashin citation was verified against arXiv:2102.13339, twice and independently.
- **Lean scope.** The combinatorial components, the analytic steps (hinge, Hessian, gradient,
  convexity and the injective open gradient on the gauge slice, the variational inverse) and the
  derivation of the gradient identity from the logarithmic form of Galashin's Proposition 5.12 are
  formal theorems. They compose into a conditional homeomorphism theorem whose four hypotheses
  stand for Galashin's Propositions 4.2, 5.1 and 5.12 and the Muller–Speyer twist; Appendix A states
  them in mathematical notation. Lean does not construct the measurement map, so this is not a formal
  proof of Theorem 1. Also formal theorems: the sharp single-cycle modulus with its extremal pair, the
  graph-Laplacian sandwich and the inverse-Lipschitz bound; the combinatorial half of the shift corollary;
  the cycle count; the loop-deletion facts; and Corollary 31. Not formalized: the shift homeomorphism
  itself, the component reduction, the strand-diagram proof, Corollaries 32 and 33, and the volume reading.
- **Critical bridge only.** The shift identifies lower-dimensional critical subloci. It is not the
  homeomorphism of the full compactified electrical and Ising spaces asked for in Galashin--Pylyavskyy
  Question 9.2; for the top matching at `N>=3`, their open cell has dimension `binom(N,2)` while the
  connected critical family has dimension `N-1`.
- **Quantitative scope.** CLH-12 is the all-cycle, fixed-partition bound: it minimizes over the cycles of
  one chosen winding-one partition and is not claimed globally optimal. It is not a raw-Plucker or
  intrinsic-Grassmannian metric theorem. The partition-independent refinement (supplement BFA-5) applies
  to one cell only.
- **Attribution:** `Meas_f`, `γ`, Prop 5.12, admissibility, Prop 4.10, and Conjecture 4.3 are Galashin's;
  the twist is Muller–Speyer's. The contribution is the convex-gradient structure + winding-partition
  convexity + the uniform row-difference identity + the constructive homeomorphism.

## Status
`CLAIMS.md` is authoritative (CLH-1..CLH-7, CLH-12..CLH-15). Build with `pdflatex main.tex` (×3);
`conj43_loopless_homeomorphism.pdf` is the tracked, named PDF. The earlier paper and certificate DOIs
and the rights metadata are inserted in the source. The coloop-inclusive source supplement awaits a
public version DOI, marked as pending in Appendix A.

Since the deposited version, the paper has gained the variational inverse, Kenyon's variational
antecedent, the folded-immersion comparison with its stated limitations, the formal-interface appendix,
a named half-open reading lemma, the window induction as the primary proof of the partition (with the
strand proof's sign count derived ray by ray), a proof candidate for looped cells (not claimed), the sharp
modulus with its inverse-Lipschitz bound, Corollaries 31–33, figures drawn from values computed in Lean,
and a worked example (Appendix B). Statement numbers changed in the 2026-10-20 revision and again when
the corollaries were added.

This revision has not been published. `Whiteboard ready: NO` remains an author-owned
release gate. The paper was reviewed internally before release; external mathematical review has not
occurred, and all positive claim tiers remain
`PROVED_DRAFT`. The historical CLH-5 receipt is partial and fixed-point-free; completing
its receipt metadata does not supply a new coloop-inclusive execution receipt. CLH-4 and
CLH-5 also carry receipts for the coloop-inclusive formal statements and their recorded
statement-identity check (see `CLAIMS.md`, Receipt scope).

The partition proposition explicitly asserts existence without uniqueness. Any fixed
partition has one cycle per wrapped crossing edge. A small five-label example
displays two different partitions. A separate exact re-derivation checks all
46,233 loopless cells through `n=8`, including coloops; 20,936 have nonunique
partitions, and the top cell of `Gr(4,8)` has 2,405 partitions. This finite
corroboration is separately recorded from the historical Lean-source receipt.
