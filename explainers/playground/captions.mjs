export default {
 "withS56Note": [
  " If G(x) = G(y), then (G(y) − G(x))·(y − x) = 0, so x = y by S55.",
  "The grid is a 2-D section, through x, of the 4-dimensional slice. G may stretch and shear it a great deal, but it never brings two points together."
 ],
 "withS58Note": [
  "The picture is a 2-D section, the plane of labels 3 and 2 through θ, of the 4-dimensional slice and of its image. ΣG = 0 is the test for the incidence range here because the crossing graph is connected: im B is the set of vectors whose entries sum to zero on each crossing component.",
  "The lines run off to ∞ along the plotted paths only; not every approach to the boundary does that. The paper's directed triangle with θ(t) = (0, t, 2t) has G(θ(t)) → (log 2, 0, −log 2) as θ(t) tends to a vertex of the chamber (\"Relation to hyperbolic volume and to earlier variational principles\"). That is why S58 claims an open embedding, an open image inside im B, and not that G is onto im B. The main theorem never needs G to blow up at the boundary: Meas_f is onto because of gauge invariance (Galashin, Prop. 4.2), not because of G."
 ],
 "withS60Note": [
  "Why the minimizer solves G(x) = y, and not only its part along the slice: on the slice θ₁ = a₁, first-order optimality says (G(x) − y)·h = 0 for every h with h₁ = 0, so G(x) − y is a multiple of e₁, a vector of T⊥. Both G(x) and y lie in W = im B, whose vectors sum to zero (S50, S51), and the only multiple of e₁ that sums to zero is 0: T⊥ ∩ W = {0}. So G(x) = y. With several components, T⊥ is spanned by one anchor vector per component, and the sum over each component gives the same conclusion.",
  "With S56 (G injective on the slice), every y in G(slice) has exactly one preimage, and it is the unique minimizer of Ψ(z) − y·z on the slice: inverting G is minimizing."
 ],
 "withS65Note": [
  "Why the orange and green bars agree: P_f D M_N λ = B(ℓ + log 2·1) = Bℓ = G_f. The necklace logarithms are N = M_N λ, the crossing-column exponent matrix applied to the log brackets λ (S62); P_f D M_N = B is the row-difference identity (Proposition 10, S24); λ_e = ℓ_e + log 2 on every crossing edge is the hinge (S64); and B·1 = 0, in-degree equals out-degree (S50). So P D N = B(ℓ + log 2·1) = Bℓ = G."
 ],
 "withS67Note": [
  "S67 gives R(Meas θ) = G(θ) for every θ in the slice S_a, from hlog alone; with H2 (Meas onto Crit) it gives R(Crit) = G(S_a), as S68 notes."
 ],
 "withS68Note": [
  "Stronger than R(z) ∈ im B: R(Crit) = G(S_a). Every z ∈ Crit is Meas θ for some θ ∈ S_a (H2), and R(Meas θ) = G(θ) (S67). S68 states only the membership. The identity is part of S66's conclusion: there R z lies in the image of G on the slice, and Meas⁻¹ z = G⁻¹(R z).",
  "im B is characterized componentwise: a vector lies in im B exactly when its entries sum to zero on each crossing component. This cell's graph is connected, so a single sum is checked here."
 ],
 "withS70Note": [
  "This theorem constructs a synthetic model that satisfies the four hypotheses of S66. It shows they are consistent, not that they hold for Galashin's critical measurement map; that is what H1–H4 (sitting 7) ask you to check."
 ],
 "withH1Note": [
  "What proves H1 is algebraic, not numerical: Galashin's Proposition 5.1 makes Meas_f a regular map, so it is continuous, and his Lemma 5.13 identifies its value at admissible real angles with the critical measurement (paper, the paragraph on H1; S66's note on the citation). The picture is a synthetic illustration in the necklace-log model: finitely many nearby inputs, which shows sensitivity and proves no continuity."
 ],
 "withH2Note": [
  "What proves H2 is the componentwise gauge shift. Crit is the image of Meas_f on all admissible θ (Galashin's Definition 1.14 with Proposition 5.1). Shifting each crossing component by its own constant, θ_j ↦ θ_j + a_{p_C} − θ_{p_C} for j ∈ C, carries any admissible θ into the slice S_a. Such a shift changes no gap δ_e and, by Galashin's Proposition 4.2 and the paragraph after it, not Meas_f either (the paper's proof of the main theorem, Surjectivity; S52, S69).",
  "The Newton solve above recovers one preimage in the synthetic model: an illustration on a single instance, not a test of surjectivity."
 ],
 "withH3Note": [
  "In the synthetic model N is the inclusion of the image into ℝⁿ, so ‖ΔN‖ = ‖ΔMeas‖ holds by construction. The picture shows that hypothesis, not evidence that the actual twisted-necklace map is continuous. What proves H3 is algebraic: the Muller–Speyer left twist is regular on the open positroid cell, its necklace minors do not vanish there, and their logarithms, with a continuous choice of representatives, are continuous."
 ],
 "roundTripView": [
  "The paper's cell (window 3 5 1 2 4). θ gives the necklace logarithms N, H4's model of the measured minors; then R = P_f D N, which Theorem 1's proof shows equals G(θ) = Bℓ; then G⁻¹(R) by Newton steps on the slice through the anchor θ₁, which must give θ back. Angles in units of π. Float mirror; one instance, not a proof."
 ],
 "shiftView": [
  "Window 3 1 2 6 4 5: the crossing graph is the two triangles 1→2→3→1 and 4→5→6→4. S52 lets s differ from component to component: each triangle turns by its own angle, no gap changes, so neither does G. Angles and s in units of π, G from log sin of the gaps. Float mirror; one instance, not a proof."
 ],
 "s69Seven": [
  "Window 2 5 3 7 1 4 6, S50's seven-label cell: three crossing components, {1, 4, 5, 6, 7} and the isolated labels 2 and 3, each with its own anchor (its least label). Lean's witness (gaugeSlice_nonempty_core) is the regular 7-gon θ₀(j) = π(j − 1)/7 with each component turned on its own, θ_j = π(j − 1)/7 + a_{p_C} − π(p_C − 1)/7 for j ∈ C, so every anchor sits at its own a. Edges join labels of one component only, so every gap is the regular 7-gon's, and the witness is admissible whatever the anchors. Angles in units of π. One instance, not a proof."
 ],
 "chain": "Where this sits: H ≻ 0 on T_gauge (S53) ⇒ Ψ strictly convex on the slice θ₁ = x₁ (S54) ⇒ G strictly monotone there (S55) ⇒ G injective there (S56).",
 "hlogBoundary": "What stays assumed: hlog (H4) is the interface to the actual critical variety. It stands for Galashin's Proposition 5.12 and (5.8) on necklace rows, and reading it faithfully is what H4 (sitting 7) asks you to check. Here N is a synthetic model, so no Grassmannian measurement is computed."
};
