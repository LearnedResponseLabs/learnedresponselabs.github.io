# Plucker Participation Cyclic Point Paper Draft

<!-- claims-sync: status=AUTHOR_REVIEW manifest=CLAIMS.md -->

This is the first LaTeX paper draft for the top-cell Plucker participation
theorem.

Working title:

```text
The Regular Cyclic Point Maximizes Plucker Participation on the Positive Grassmannian
```

Paper-facing terminology:

- The functional is called the **Plucker participation ratio**.
- The internal notes call the same quantity `N_eff` or effective sample size.
  That term is useful as modeling motivation but is not used in the title,
  since it is not standard algebraic-geometry vocabulary.

Claim boundary:

- The draft states the positive top-cell theorem for `Gr_{>0}(k,n)`.
- The proof is the comass/Wirtinger proof written out in `main.tex`.
- The regular cyclic point is cited as the equality witness through the cyclic
  Fourier / chord-product source role.
- The maximizer is proved **unique** (the regular cyclic point): the Wirtinger
  rigidity clause (σ_m > σ_{m+1}, strict since the cotangent singular values are
  distinct) gives the Uniqueness Corollary in `main.tex`. Both equality-case
  steps are written out — (E1) the two-sided complexified interlacing-equality
  induction, (E2) the wedge-line equality classification (with the α≠0
  hypothesis). No external review has been requested; the
  whiteboard-understanding and author-interest gates remain open. See
  `rem:rigidity-clause` and `CLAIMS.md` (the authoritative surface).
- Corollary 13 extends the bound and unique maximizing plane to the totally
  nonnegative Grassmannian. Each boundary point has strictly smaller
  participation; this is pointwise strictness, with no uniform gap asserted.
- The draft does not determine maxima on individual lower positroid cells or
  optimize over arbitrary signed non-decomposable coordinate vectors.
- The beta-1 chord-sum recurrence is recorded only as a companion provenance
  item; the main top-cell proof does not depend on citing it as a source
  identity.

Build:

```bash
make -C .
```

Primary output:

```text
[internal reference redacted]
```

Reader/submission handoff:

```text
reader_handoff.md
```

Current handoff status:

```text
development__whiteboard_and_author_interest_gates_open
```


---

*Publication note: 3 internal repository references were replaced with `[internal reference redacted]` when this page was published. The text is otherwise the author's.*
