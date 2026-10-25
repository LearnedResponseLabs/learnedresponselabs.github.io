# Claim manifest — conj43_loopless_homeomorphism

Program brief item: `Conj 4.3 — L2a/homeomorphism (convex-gradient route)`
Genre: `flagship`
Development status: `AUTHOR_REVIEW`
Whiteboard ready: `NO`
Author interest: `YES`
Status surfaces: `main.tex, README.md`

**This file is the authoritative status surface for this paper.** If any prose in `main.tex`
disagrees with a row here, this file wins and the prose is stale.

**Scope.** The boundary/compactification results, the exact finite atlases, and the dense-five
full-Hessian modulus are claimed in the supplement “Boundary compatibility of the critical Gr–OG shift, and exact finite atlases”, where they are BFA-1
through BFA-5, and not here: the finite atlases are computer-assisted where everything remaining here is
symbolic, and the boundary proofs are written at a lower density than this paper's core. **Everything
claimed in this manifest is a symbolic proof; no row depends on a finite computation or a numerical
certificate.**

**Tier discipline for this paper (read first).** Every positive theorem below is `PROVED_DRAFT`: a
written proof exists in the paper, and external mathematical review has not occurred. A claimed
resolution of a named open conjecture is not established until the field checks it, and `PROVED_DRAFT`
must never be read as "proved / accepted."

Status vocabulary: `PROVED_DRAFT` (proof in paper; external review pending), `IMPORTED` (consumed published
theorem), `NOT_CLAIMED`. These are claim classes, not one maturity ladder: the positive claims remain
`PROVED_DRAFT` because no external mathematical review has occurred.

| ID | Exact statement | Status | Depends on | Where | Receipt |
|----|-----------------|--------|------------|-------|---|
| CLH-1 | For every loopless bounded affine permutation `f`, `Meas_f : Θ_f^{>0} → Crit_f^{>0}` is a homeomorphism, with constructive inverse `Meas_f^{-1} = G_f^{-1} ∘ R_f`. (Galashin Conjecture 4.3, loopless case, uniform in (k,n).) Here `Θ_f^{>0}` is Galashin's gauge slice, distinguished in the paper from the ambient admissible chamber `Θ_f^adm`. | PROVED_DRAFT — proof written out in the paper; external review required. **Lean scope (formal statements of 2026-10-08):** a conditional formal theorem, not a formalization of CLH-1. If a map from the gauge slice (least-label representatives) onto a set `Crit` is continuous and surjective, and a continuous map `N` on `Crit` satisfies along it the necklace-row logarithmic form of Galashin Prop. 5.12 (every unordered pair, up to a common additive constant), then that map is a homeomorphism with inverse `G_f^{-1} ∘ P_f D N`; an abstract model shows the four hypotheses jointly satisfiable. They stand for Galashin Prop. 5.1 with Lem. 5.13, Prop. 4.2, Prop. 5.12 and the Muller–Speyer twist (Appendix A states each in mathematical notation). Lean constructs neither the measurement map nor the twist, so whether the hypotheses transcribe those results is a reader's check. The definitional interface is formal (statements of 2026-10-15): against Lean transcriptions of Galashin's definitions, the encoding is a bijection onto his loopless bounded affine permutations, the necklace rows are his affine formula, the crossings and the Mis classes are his, `Conj43.pairExponent` is his exponent in (5.8), and the half-open reading holds on his refined boundary; whether the transcriptions say what his definitions say is a reader's check. The convexity, injectivity, open-embedding and variational steps of `thm:main` on the slice are formal theorems; the frozen statements pass an independent statement-identity check with the standard axioms only | CLH-2, CLH-3; **surjectivity onto `Crit_f^{>0}` is an import**, Galashin Prop. 4.2 and the sentence after his eq. (4.3) (component shifts preserve `Meas_f`, so `Meas_f(Θ_f^{>0}) = Meas_f(Θ_f^adm)`); Muller–Speyer twist. The component reduction `lem:reduction` (Galashin §4 relabeling + Prop 4.10, with the commuting square now written out) is **not needed**: `prop:rowdiff` is proved with coloops allowed, so no statement carries a fixed-point-free hypothesis | `thm:main`, `lem:reduction`, eq. `eq:gauge-surjectivity`, Appendix A. Lean theorems: `Conj43.admissible_isOpen`, `Conj43.gradient_slice_strictMonotone`, `Conj43.gradient_slice_injective`, `Conj43.gradient_slice_embedding`, `Conj43.gradient_incidence_openEmbedding`, `Conj43.potential_variational_inverse`, `Conj43.variational_image_minimizer`, `Conj43.measurement_conditional_homeomorphism`, `Conj43.gal512_measurement_homeomorphism`, `Conj43.gauge_slice_nonempty`, `Conj43.gal512_hypotheses_nonvacuous`. | `sidecar` |
| CLH-2 | After the left twist and log-necklace coordinate `R_f`, the measurement map is a gradient: `R_f ∘ Meas_f = G_f = ∇Ψ_f`, `Ψ_f = Σ_e L(δ_e)`, `L'=log sin`; Hessian `H_f = B·diag(cot δ_e)·Bᵀ`. Here `δ_e = θ_{q̃} − θ_p ∈ (0,π)` is taken in Galashin's affine lift `θ_{j+n} = θ_j + π` (`q̃` the forward lift of `q` past `p`), not the raw label difference. With the edge orientations and B fixed, using log(abs(sin(theta_q-theta_p))) gives the same gradient values, and cotangent periodicity gives the same Hessian. The lift supplies the real domain of the log-sine potential and the positive cycle angles summing to pi used in convexity. The identity holds on the whole admissible locus: Galashin's Prop. 5.12, with Lem. 5.13, applies at every point of the gauge slice, admissible collisions of noncrossing labels included, where the vanishing bracket has exponent zero on every necklace row; component shifts carry the identity to the ambient chamber. | PROVED_DRAFT. **Lean scope (formal statements of 2026-10-08):** formal theorems cover the hinge identity, the gradient `G_f = Bℓ` of the potential and its derivative `B·diag(cot δ_e)·Bᵀ` on the admissible chamber (ordinary and strict derivatives), the degree balance `B1 = 0` with the vanishing of the `log 2` constant and the component-shift invariance of `G_f`, and the derivation of `R_f ∘ Meas_f = G_f` from the necklace-row logarithmic form of Galashin Prop. 5.12 (every unordered pair, up to a common additive constant) through the formal noncrossing-column vanishing, row-difference identity and hinge. That logarithmic form is a hypothesis of the formal statement and the twist and measurement map are not constructed, so the identity still rests on Galashin Prop. 5.12 as transcribed in `prop:rowdiff`; the frozen statements pass an independent statement-identity check with the standard axioms only | CLH-4; the hinge identity `\|[[t_q,t_p]]_+\| = 2 sin δ_e` (`lem:hinge`), derived from Galashin Def. 1.12/eq. (1.4) (`[[x,y]] = x/y − y/x`), eq. (5.1) (`t_p = e^{iθ_p}`) and Lem. 5.13 (`Meas_G(wt_t) = Meas_f(θ)`); Galashin Props. 4.2, 5.1 and 5.12 with Def. 1.8 (open-cell membership at collisions); Muller–Speyer twist; `prop:wp-direct-balance` for `B1 = 0` | `prop:grad`, `lem:hinge`, §2.1–§2.2. Lean theorems: `Conj43.hinge_identity`, `Conj43.logSinPrimitive_derivative`, `Conj43.potential_gradient`, `Conj43.gradient_hessian`, `Conj43.incidence_degree_balance`, `Conj43.gradient_edge_constant`, `Conj43.gradient_component_shifts`, `Conj43.necklace_log_crossing`, `Conj43.necklace_recovery_constant`, `Conj43.necklace_log_hinge`, `Conj43.necklace_log_gradient`, `Conj43.gal512_gradient`, `Conj43.gal512_recovery_incidence`. | `sidecar` |
| CLH-3 | `Ψ_f` is convex on the ambient admissible chamber `Θ_f^adm`: `H_f ⪰ 0` with `ker H_f` exactly the crossing-component shifts (hence `H_f ≻ 0` on the gauge slice). | PROVED_DRAFT — via the winding-one edge-partition (CLH-5) + the cotangent cycle inequality; the cotangent-cycle ingredient `lem:cot` is LEAN_CERTIFIED (standard axioms only). **Lean scope (formal statements of 2026-10-08):** the assembled statement is formalized too, over every loopless `f` with coloops admitted: on the admissible chamber `Σ cot δ_e (h_q − h_p)² ≥ 0`, with equality exactly for `h` constant on every crossing component, its matrix form `hᵀ B·diag(cot δ_e)·Bᵀ h`, and the matrix kernel; on the gauge slice (least-label representatives) positive definiteness on the tangent space and strict convexity of `Ψ_f`; and the lifted cycle sum `eq:cycle-sum`. With the formal Hessian identity listed under CLH-2, the Hessian statements of this row are formal theorems; convexity of `Ψ_f` on the ambient chamber is not stated separately, and strict convexity on the slice is. The frozen statements pass an independent statement-identity check with the standard axioms only | CLH-5; `lem:cot` | `prop:psd`. Lean theorems: `Conj43.cot_cycle_inequality`, `Conj43.cycle_wrap_sum`, `Conj43.delta_cycle_sum`, `Conj43.hessian_psd`, `Conj43.hessian_kernel_components`, `Conj43.hessian_matrix_form`, `Conj43.hessian_matrix_kernel`, `Conj43.hessian_gauge_positive`, `Conj43.potential_slice_strictConvex`. | `sidecar` |
| CLH-4 | Row-difference identity `P_f D M_N = B` — the cyclic row-difference of Galashin's twisted-necklace exponent matrix, relabeled, equals the directed incidence matrix, **for every loopless `f`, coloops allowed**. Proved census-free (pairs in no named class are absent directly from Prop. 5.12; the two Mis supports vanish; crossing columns are half-open intervals; coincidence pool provably closed; a coloop label admits no `Mis^{↑↓}` partner and no crossing, lies in every necklace row, and therefore has identically zero columns on both sides). | PROVED_DRAFT — symbolic, no arrangement enumeration. **Lean scope (2026-10-07):** LEAN_CERTIFIED in full, over `LooplessBAP` with loops excluded and coloops admitted: the crossing-edge columns (`rowdiff`), the coloop rows (`Bmat_coloop_row`, `PDM_coloop_row`), the vanishing of every non-crossing pair column, and the full unordered-pair identity (`Conj43.pairExponent_nonCross`, `Conj43.full_pair_columns_zero`, `Conj43.rowdiff_full_pairs`); the frozen statements pass an independent statement-identity check with the standard axioms only. **Interface (statements of 2026-10-15):** the exponent table, the Mis classes and the necklace rows are proved equal to Lean transcriptions of Galashin's (5.8), §5.4 and affine necklace formula | Galashin Prop 5.12 + the §5.4 class definitions; uniform crossing-only arc theorem | `prop:rowdiff`. Lean theorems: `Conj43.rowdiff`, `Conj43.not_crossEdge_of_coloop_fst`, `Conj43.coloop_mem_necklace`, `Conj43.Bmat_coloop_row`, `Conj43.PDM_coloop_row`, `Conj43.pairExponent_nonCross`, `Conj43.full_pair_columns_zero`, `Conj43.rowdiff_full_pairs`, `Conj43.pairExponent_eq_galashin`, `Conj43.misUD_iff_galashin`, `Conj43.misDU_iff_galashin`, `Conj43.galashin_necklace`. | `sidecar` |
| CLH-5 | Existence of winding-one partitions (W-P): the directed crossing-edge set of any loopless `f` admits a partition into edge-disjoint, vertex-simple winding-one cycles of length ≥ 3. The partition need not be unique; every such partition has exactly as many cycles as there are wrapped edges `p -> q` with `p > q`. The refined-endpoint rule depends only on the induced permutation, so this combinatorial statement also holds for every decorated permutation; the measurement theorem remains loopless. | PROVED_DRAFT — two independent proofs: (i) reduced alternating strand diagram → clockwise black-clique winding-one cycles → signed intersection excess → integral opposite-edge cancellation (imports Postnikov Lem. 14.6/Cor. 14.7 with Cor. 14.2, the boundary-vertex merge following Def. 14.3 with Lem. 14.4, and OPS Rem. 9.6 with Thm. 9.12, and derives the local sign count `eq:signed-excess` ray by ray, at interior corners and in the boundary collars, the black boundary resolution being a local construction added to Postnikov's merge — see `rem:wp-imports`); (ii) a self-contained window induction from the refined endpoint order, which is the machine-checked one. **Lean scope (2026-09-15):** LEAN_CERTIFIED via route (ii) only, over `LooplessBAP` with coloops admitted, so the machine statement certifies partition existence over all loopless `f`; the cycle count in its wrapped-edge form (`Conj43.partition_card`, with `Conj43.winding_eq_wrapped`) and the extension to decorated permutations (`TP.dec_winding_one_partition`) are further Lean theorems (statements of 2026-10-15); the count by total advance is also a Lean theorem (`Conj43.partition_advance`, `Conj43.crossEdges_advance`; statements of 2026-10-18); coloops are isolated vertices of the crossing graph and the cover induction handles them as fixed-position decorations. Standard axioms only | Postnikov alternating-strand construction; Oh–Postnikov–Speyer black-clique orientation (route (i) only) | `prop:wp`, `rem:wp-imports`, §4.2. Lean theorems: `Conj43.crossEdges_subset_cover`, `Conj43.winding_one_partition`, `Conj43.partition_card`, `Conj43.winding_eq_wrapped`, `Conj43.partition_advance`, `Conj43.crossEdges_advance`, `TP.dec_winding_one_partition`. | `sidecar` |
| CLH-6 | Decorated/looped measurement extension; anything about the boundary or compactification of `Crit_f`; general boundary properness; Galashin Problem 5.2 (irreducibility, dimension, defining equations). | NOT_CLAIMED — explicitly out of scope of THIS paper. The boundary and compactification claims separated from this paper live in the supplement “Boundary compatibility of the critical Gr–OG shift, and exact finite atlases” (BFA-1..BFA-4). A measurement or homeomorphism extension to decorated/looped cells is not claimed in this paper; the decoration-independent combinatorial observation in CLH-5 does not provide one. Problem 5.2 is addressed by the separate Problem 5.2 manuscript, not here. `rem:loops` gives a proof candidate for a looped extension under a reading of Galashin's Def. 1.8 that is the paper's, not Galashin's (lollipop ⇒ zero column ⇒ zero-column embedding of `Gr(k,n−1)`): the reducedness bookkeeping `ℓ(f) = ℓ(f') + k` is cited from the proof of Lam's Thm. 7.12, Postnikov's Thm. 13.2 gives an independent route, and the combinatorial facts are Lean theorems (`TP.deleteLoop_bdd`, `TP.affRank_deleteLoop`, `TP.affLength_deleteLoop`); the remark says in the text that none of it is claimed. Galashin states Conjecture 4.3 for loopless `f` only. | — | This manifest; positive theorem domains in `thm:main` and `cor:shift`; `rem:loops` | - |
| CLH-7 | For every loopless `f`, Galashin's shift gives a constructive homeomorphism `Φ_f : Crit_f^{>0} -> widehat(Crit)_{f_down}^{>0}`, `Φ_f(X)=widehat(Meas)_{f_down}(G_f^{-1}(R_f(X)))`. For every matching `tau`, `(f_tau^elec)_down=f_tau^Ising`, so restriction to the `tau`-isotropic chamber identifies the critical electrical and critical Ising loci of the same generalized region, uniformly in `(N,tau)`. | PROVED_DRAFT — corollary derived in the paper from the pinned Galashin statements; external review required. Not Galashin–Pylyavskyy Question 9.2: only the lower-dimensional critical subloci, as stated in `rem:shift-scope`. **Lean scope (2026-10-18):** the combinatorial half is formalized: `f↓(p) = f(p − 1)` is bounded, periodic and bijective with rank `k − 1` (`Conj43.rank_sum`, `Conj43.shift_bounds`, `Conj43.shift_periodic`, `Conj43.shift_bijective`, `Conj43.shift_rank`), `f↓ ≥ id` exactly when `f` has no loop (`Conj43.shift_self_le_iff`), and `(f_τ^elec)↓ = f_τ^Ising` for a matching on `2N ≥ 2` labels (`Conj43.elec_shift_eq_ising`). The homeomorphism `Φ_f` is not formalized. | CLH-1; Galashin Props. 7.2, 8.9 and Thm. 7.3 | `cor:shift`, `sec:shift`, `rem:shift-scope` | - |
| CLH-12 | For `m>=3` and `0<eta<=pi/m`, the exact uniform constant in the cotangent-cycle inequality under `alpha_i>=eta` is `kappa_m^star(eta)=[cot eta-(m-1)cot((m-1)eta)]/m`, attained by the displayed boundary angle--velocity pair. For any fixed winding-one partition this gives `kappa_{f,Z}^star L_f <= H_f <= cot(eta)L_f` and an inverse-Lipschitz constant `1/(kappa_{f,Z}^star lambda_f^+)` on the component-shift quotient in Euclidean log-necklace-gradient coordinates. No classification of all equality cases, cross-partition global optimality, or raw-Plucker/intrinsic-Grassmannian metric bound is claimed. | PROVED_DRAFT — proof written out in the paper; external review required. Supporting `lem:sharp-localization` is stated for `0 < eta < pi/m` (strict): at the endpoint `eta = pi/m` its strict upper bound is an equality, `kappa_m^star(pi/m) = cot(pi/m) = tan((m-2)(pi/m)/2)`. `thm:sharp-cot` dispatches that endpoint separately, so the theorem and the constant are unaffected. **Lean scope (2026-10-18; 2026-10-20):** the cycle inequality, its extremal pair, both bounds of `lem:sharp-localization` and the two-sided bound `eq:sharp-laplacian-sandwich` are Lean theorems (`Conj43.sharp_cot_cycle`, `Conj43.sharp_cot_extremizer`, `Conj43.kappaStar_pos`, `Conj43.kappaStar_lt_tan`, `Conj43.sharp_laplacian_sandwich`), and since 2026-10-20 so are the inverse-Lipschitz bound `eq:sharp-inverse-lipschitz` and its strong monotonicity (`Conj43.sharp_inverse_lipschitz`, `Conj43.sharp_strong_monotone`). | CLH-2, CLH-5; elementary diagonal-form criterion and trigonometric localization | `thm:sharp-cot`, `cor:sharp-laplacian-sandwich`, `rem:sharp-cycle-scope` | `sidecar` |
| CLH-13 | For every loopless `f` and every `y` in `G_f(Θ_f^{>0})`, there is exactly one `θ` in the gauge slice with `G_f(θ) = y`, and it is the unique minimizer of `Ψ_f − ⟨y,·⟩` on the slice: inverting `G_f` at a point of its image is a strictly convex minimization. | PROVED_DRAFT — corollary of the proof of `thm:main`; external review required. **Lean scope (2026-10-22, statement strengthened 2026-10-23):** `Conj43.variational_gradient_preimage` states it on every formal slice `S_a` (with `a = 0` it is the corollary), with the standard axioms only; since 2026-10-23 its statement is frozen (`Challenge/GradientPreimage.lean`, frozen after its proof, unlike the other groups) and Comparator-checked in the interface configuration. | CLH-3; `gradient_slice_injective` and the strict convexity of `Ψ_f` on the slice | `cor:gradient-preimage`, Appendix A. Lean theorem: `Conj43.variational_gradient_preimage`. | - |
| CLH-14 | For every loopless `f`, `R_f(X) = −P_f D (log\|Δ_{I_r}(X)\|)_r`, so `R_f` is read off ratios of the ordinary Grassmann-necklace minors; and the map `N_f : Crit_f^{>0} → P^{n−1}_{>0}`, `X ↦ [Δ_{I_1}(X) : ⋯ : Δ_{I_n}(X)]`, is a topological embedding with inverse `N ↦ Meas_f(G_f^{-1}(−P_f D log N))` on its image. | PROVED_DRAFT — corollary of `thm:main` and the twist identity `Δ_{I_r}(A) = 1/Δ_{I_r}(τ̃(A))` cited from Galashin (proof of Prop. 5.4) and Muller–Speyer (proof of Prop. 6.6); external review required. Not formalized. | CLH-1, CLH-2; Galashin proof of Prop. 5.4; Muller–Speyer proof of Prop. 6.6 | `rem:untwisted`, eq. `eq:untwisted`, `cor:necklace-embedding` | - |
| CLH-15 | For every loopless `f`, coloops included, `Crit_f^{>0}` is a real-analytic embedded submanifold of `Π_f^∘(R)`, hence of `Gr(k,n)(R)`, of dimension `n − c_f`; `Meas_f : Θ_f^{>0} → Crit_f^{>0}` is a real-analytic diffeomorphism with inverse `G_f^{-1} ∘ R_f`, with injective differential on the slice's tangent space; and `N_f` is a real-analytic embedding. Admissible collisions of noncrossing labels are included. | PROVED_DRAFT — corollary of `thm:main` with the analytic immersion and inverse function theorems; external review required. Not formalized. | CLH-1, CLH-2, CLH-3, CLH-14; Knutson–Lam–Speyer Thm. 5.9 (smoothness of the open positroid variety); Galashin Prop. 5.1, Lem. 5.13, §5.4 and eq. (2.4) | `cor:analytic-critical` | - |

**Receipt scope.** `sidecar` resolves to the nonpublished evidence ledger; it is
not a public artifact citation. The historical CLH-5 receipt covers a
fixed-point-free seed-cover declaration only. CLH-4 and CLH-5 also carry receipts
pinned at the commit of the recorded 43-statement formal check: the source modules
that state the coloop-inclusive theorems (including the full unordered-pair
row-difference theorems), and the record of the independent statement-identity and
kernel replay of all 43 frozen statements. These are formal checks of statements
about the formal encoding; that the encoding is Galashin's is checked by reading and
by finite cross-validation. Complete receipt metadata does not assert full theorem
coverage. A separate exact re-derivation receipt covers all loopless cells through
`n=8`, including coloops; this finite execution does not replace a uniform formal
receipt. Public
formal-source references and their remaining DOI gap are stated in Appendix A.

**Attribution.** `Meas_f`, the curve `γ_{f,θ}`, the necklace exponent formula (Prop 5.12),
the admissibility chamber, the bracket `[[x,y]]` and the specialization `t_p = e^{iθ_p}` (Def. 1.12,
eq. (5.1), Lem. 5.13), the gauge slice and its gauge invariance/surjectivity (Prop. 4.2, eq. (4.3)),
Prop 4.10, and Conjecture 4.3 are **Galashin's** (arXiv:2102.13339). The left
twist is **Muller–Speyer** (arXiv:1606.08383). The paper's contribution is the convex-gradient structure,
the winding-partition convexity, the census-free row-difference identity, and the constructive
homeomorphism. This paper claims Conjecture 4.3 for the loopless case at internal tier — see the tier
discipline above; it is not an established resolution until external review.

**Machine corroboration (not a premise).** The factorization identity `P_f D M_N = B` was verified
exactly over Q (symbolic exponent-matrix equality, zero tolerance) on a 2,175-cell census; the
existence of a winding-one partition was independently checked by an exact endpoint-swap
algorithm on all 46,233 loopless cells through `n = 8`, including coloops, with zero failures.
In this census 20,936 cells admit more than one partition; none with `n <= 4` do, and
the top cell of `Gr(4,8)` has 2,405 partitions. A separate independent pure-integer
implementation checked 458,733 unordered-pair exponent columns, including 169,490 directed columns, on
all 17,007 fixed-point-free cells through `n = 8`, with zero failures. The Lean/exact-Q definitional
interface is bit-identical on all 12 fixed-point-free cells through `n = 4`, including 15 `s_p = q` crossing edges. For
the coloop step of CLH-4 (symbolic proof, formalized on 2026-09-15 in `Conj43/Coloop.lean`; the Lean
evaluator is additionally bit-identical to an independent exact-integer mirror on all 5,912 loopless cells
with `n <= 7`, `out/crossval_coloop.json`), an independent reimplementation
checks `P_f D M_N = B` on all 3,737 loopless cells with at least one coloop and `n <= 7` (0 failures),
and a separate script confirms on those same cells the four sub-assertions the symbolic proof uses — a
coloop lies in every necklace row (5,912 instances), is in no crossing (5,912), admits no `Mis^{↑↓}`
partner (34,406), and has an identically zero `M_N` column against every partner (34,406) — plus the
distinctness of the four refined endpoints for non-coloop pairs (43,144); zero failures throughout. An
independent top-cell control starts from actual Fourier measurements, compares the convex-gradient
inverse with Galashin's §9 bridge/cross-ratio reconstruction, checks the Plücker extraction identities
exactly, and obtains route agreement below `6.0e-15` on 18 deterministic points through `n = 8`, with a
1 % corrupted bridge detected. All of this is finite computational corroboration, not a theorem premise.

**Remaining known exposure.**
1. **External review has not occurred.** The chain of proof is complete and fully symbolic, and the paper was
   reviewed internally before release, but no external mathematical review has taken place. This is the single
   most important caveat.
2. Source display: Galashin's Proposition 5.12 / eq. (5.8) is reproduced
   verbatim in `prop:rowdiff` as `eq:gal512`, with the two Mis classes defined inline, so §3.1 is
   checkable without the source open. Verified against the pinned source text: the formula is supported on
   exactly the two Mis classes and the directed-crossing class; a `Mis^{↑↓}` pair contributes only on rows
   containing BOTH `p,q`, a `Mis^{↓↑}` pair only on rows containing NEITHER, a directed crossing `p→q`
   only on rows containing `p` but not `q`; the crossing exponent is `−1` and the other two are `+1`. The
   coincidence cases (`s_p=q`, `s_q=p`) are written out. `prop:wp` carries the full direct plabic
   signed-excess/cancellation proof AND a self-contained combinatorial window induction, so the paper is
   self-contained on its central combinatorial theorem.
3. Hypothesis scope: `prop:rowdiff` is proved with coloops allowed, so no statement carries a
   fixed-point-free hypothesis (`rem:no-fpf`), and `lem:reduction` — retained, and stating and
   justifying the commuting square with the measurement maps from the proof of Galashin Prop. 4.10 — is
   not needed for the general loopless case.
4. Collisions: `prop:grad` states, in the paper carrying Theorem 1 itself, why the identity holds at
   admissible collisions of noncrossing labels. Galashin's Prop. 5.12 is stated for every gauge-fixed
   parameter at which the boundary measurement is well defined, which Lem. 5.13 supplies at every point
   of the gauge slice, collisions included; the absent noncrossing bracket has exponent zero on necklace
   rows; and the positivity of edge weights at admissible tuples (Prop. 4.2, Def. 1.8) keeps the value in
   the open cell. Component shifts extend the identity to the ambient chamber. The argument does not rely
   on the companion sign-regularity paper. (An earlier wording argued by density of pairwise-distinct
   parameters; that locus does not meet the gauge slice when there are two or more crossing components.)
5. Measurement and homeomorphism scope: loopless. Extensions to decorated/looped cells, everything about the boundary/compactification, and
   Problem 5.2 are outside this paper (CLH-6); the boundary material is the supplement's BFA-1..BFA-4.
6. The critical shift (CLH-7) is not the full electrical/Ising-space bridge of Galashin--Pylyavskyy
   Question 9.2. For the top matching and `N>=3`, the open network cell has dimension `binom(N,2)`, while
   the connected critical family has dimension `N-1`; Proposition 8.9 cannot fill the missing noncritical
   directions.
7. **Prior-work section: an open citation debt.** §1 carries "Relation to
   hyperbolic volume and to earlier variational principles": `Ψ_f = −Σ_e Λ(δ_e) + const` for Milnor's
   Lobachevsky function `Λ` (this identity is elementary and internal — `L(u) = −Λ(u) − u log 2` plus the
   constancy of `Σ_e δ_e` from `eq:cycle-sum` + CLH-5); the winding-one cycles are ideal polygons
   inscribed in a circle in `∂H³` under Galashin's own `v_p = e^{2iθ_p}` (Rem. 1.2); the convexity is
   Rivin-type; and the novelty is the decomposition, CLH-5. The volume identity
   `Σ_{e∈Z} Λ(δ_e) = Vol(cone over the inscribed ideal polygon)` is registered here at the paper's
   internal `PROVED_DRAFT` tier: it is proved in the paper for all `m` by fan triangulation plus the
   oddness and `π`-periodicity of `Λ`, taking the `m = 3` case (Milnor's ideal-tetrahedron formula
   `vol(T) = Λ(α)+Λ(β)+Λ(γ)`) as the only external input. It is a supporting statement of the
   prior-work subsection, not a result of the paper, and carries no table row: no theorem depends on it.
   **The citation debt is closed as of 2026-09-08.** The seven added bibliography entries (Milnor;
   Rivin 1994, 1996; Futer–Guéritaud; Bobenko–Springborn; Duffin; Pinkall–Polthier) were verified
   against the sources — bibliographic data and the statement each is cited for — and the entries now
   carry volume, issue and page ranges; the disclosure footnote and the LaTeX comment markers are
   removed. Milnor's Appendix Lemmas 1 and 2 have since been read first-hand in the open Project
   Euclid copy of the Bulletin article, so the `m = 3` formula is pinned to `[Milnor, Appendix
   Lem. 2]` directly, with `[FuterGueritaud, Lem. 5.1]`, which states it and cites Milnor for it,
   kept as a secondary pin; the oddness of the Lobachevsky function used in the fan triangulation
   is `[Milnor, Appendix Lem. 1]`. The Milnor entry also names Thurston's ch. 7 ("Computation of
   volume", by Milnor). The verification table is in the program's internal repair log.
8. **Citations to Postnikov: checked 2026-09-08, one pointer corrected.** `Cor. 14.2` (the bijection
   reduced plabic graphs ↔ alternating strand diagrams, trips ↦ strands) and `Cor. 14.7` (a reduced
   plabic graph exists with any prescribed decorated trip permutation) resolve as cited in
   arXiv:math/0609764, which has a single version and no journal counterpart with different numbering.
   **`Fig. 14.2` was wrong**: it is the figure of moves of alternating strand diagrams, not a boundary
   resolution. The pointer now goes to the map `T ↦ D` following `Def. 14.3` and to `Lem. 14.4` — the
   step that "merges all pairs of boundary vertices `b_i` and `b_i'`" — and `rem:wp-imports` records in the PDF that the black boundary resolution is not stated by that merge, whose map puts each entry before its exit: it is a local construction added in the boundary collars of the proof, where the sign count `eq:signed-excess` is derived ray by ray. These support only the *first* proof of `prop:wp`; the second proof
   (§4.2) uses none of them and is the machine-checked one. `Rem. 9.6` of Oh–Postnikov–Speyer was
   verified against the source, and every Galashin citation in the paper was verified against
   arXiv:2102.13339, twice and independently.
9. CLH-12 is sharp for one cycle. Its graph constant takes the minimum over one chosen winding-one
   partition; it is not claimed globally optimal across nonunique partitions or overlapping cycle
   vertex supports. The supplement's BFA-5 removes the partition dependence for the dense cyclic
   five-cell, but only for that cell and its declared Euclidean angular quotient. Neither result is a
   raw-Plucker or intrinsic-Grassmannian metric theorem.
