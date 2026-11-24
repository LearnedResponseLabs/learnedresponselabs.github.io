# Claim manifest — plucker_participation_cyclic_point

Program brief item: `Plucker participation flagship`
Genre: `flagship`
Development status: `AUTHOR_REVIEW`
Whiteboard ready: `NO`
Author interest: `YES`
Status surfaces: `main.tex, README.md, reader_handoff.md`

**This file is the authoritative status surface for this paper.** If any prose in
`main.tex`, `README.md`, or `reader_handoff.md` disagrees with a row here, this file wins
and the prose is stale (fix the prose, then update the row).

Status vocabulary: `PROVED_AUDITED` (a written proof that has passed a recorded internal
adversarial audit; not external certification), `PROVED_DRAFT` (a written proof at the
internal tier, external mathematical review pending), `IMPORTED` (used, sourced
elsewhere), `NOT_CLAIMED`, `OPEN_AUTHOR_CHECK`.

| ID | Exact statement | Status | Depends on | Where | Receipt |
|----|-----------------|--------|------------|-------|---|
| PP-1 | Sharp maximum: `max Part` over `Gr_{>0}(k,n)` equals `∏ cot²((2r−1)π/2n)` (k=2m) / `n·∏ cot²(rπ/n)` (k=2m+1) | PROVED_DRAFT (comass/Wirtinger proof, written out in the paper) | exterior identities (`Ω^m/m!`, `η∧Ω^m/m!`); Fourier diagonalization of the sign kernel; Wirtinger comass bound | `main.tex` main theorem | `[internal reference redacted]@[commit redacted]#self_check` |
| PP-2 | Equality witness: the regular cyclic point attains PP-1 (cyclic Fourier planes = regular chord products) | PROVED_DRAFT (same chain as PP-1) | `lem:fourier-minors`; Karp cyclic-witness context | `main.tex` | `[internal reference redacted]@[commit redacted]#self_check` |
| PP-3 | Uniqueness: the regular cyclic point is the *unique* global maximizer (for each `(k,n)` the equality locus is a single cyclic Fourier plane) | PROVED_AUDITED — the two equality-case steps PP-3a and PP-3b are written out in the paper (318/318 multistart searches found no counterexample). External review pending | rigidity clause of the Wirtinger lemma; PP-3a; PP-3b; `lem:fourier-minors` (explicit Fourier–Karp row normalization and oriented-minor proof) | `main.tex` `cor:uniqueness`, `rem:rigidity-clause` | - |
| PP-3a | **(E1)** Interlacing equality case in the rigidity proof: two-sided complexified Hermitian interlacing-equality induction (both sign families of `iΘ` compressed to `P_C`) | PROVED_AUDITED — written out in `lem:wirtinger`'s proof; the top-m ties, the `σ_{m+1}:=0` endpoint and the kernel cases are all covered, and the pair-value convention is stated | — | `lem:wirtinger` proof | - |
| PP-3b | **(E2)** `lem:wedge-line` equality-case classification (for `α ≠ 0`: unit decomposable `(d+1)`-vector attains comass only if its plane is `Ru ⊕ Q'`, `Q'` an `α`-maximizing `d`-plane in `W`) — used by every odd `k` | PROVED_AUDITED — written out via an adapted basis; the `α ≠ 0` hypothesis is stated in the classification clause and every in-paper use satisfies it | — | `lem:wedge-line` | - |
| PP-4 | Maxima on individual lower positroid cells or boundary cells; optimization over arbitrary signed non-decomposable vectors | NOT_CLAIMED (the boundary-cell version is in a companion paper, released separately, with its own manifest) | — | Scope paragraph | - |
| PP-5 | Ogranovich prior-art framing | IMPORTED — pinned against the arXiv full text: title/author/eprint match `references.bib`; his theorems are k=2 only; the general-k **spread** extremality is his explicit Conjecture 1.2 (verbatim: "The subspace V₀ minimizes E(x) on Gr>0(k,n)"); Postnikov citations in his paper are cyclic-invariance/definitional only. The introduction states these facts, and that the participation functional is different and does not resolve his conjecture | — | intro ¶2 | - |
| PP-6 | Nonnegative Grassmannian: over all of `Gr_{≥0}(k,n)` the regular cyclic point is the unique maximizer of `Part`, so every boundary point is strictly below the top-cell value. Pointwise strictness only: the maximum on an individual boundary cell is not determined (PP-4) | PROVED_DRAFT — short deduction written out in the paper; the bound, the equality plane and the strict boundary inequality are also checked in Lean as `CyclicPoint.Layer9.nonneg_bound_equality` and `CyclicPoint.Layer9.nonneg_boundary_strict`, under the hypotheses stated there | PP-1 chain (`cor:signed-oriented-planes`); PP-3; `lem:fourier-minors` | `main.tex` `cor:tnn` | `[internal reference redacted]@[commit redacted]#independent_replay` |


---

*Publication note: 6 internal repository references were replaced with `[internal reference redacted]` when this page was published. The text is otherwise the author's.*
