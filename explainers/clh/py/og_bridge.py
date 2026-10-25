"""Frozen positive controls for already-sourced bridge instances."""

from __future__ import annotations

from dataclasses import dataclass
from fractions import Fraction
import hashlib
import itertools
import json
import math
from pathlib import Path
from typing import Any, Sequence

N3_SECTION8_FIXTURE_SHA256 = (
    "3d5e08a2a403eb5365a1ac688b9288a2627c4f83f49a1c85872a0f0c3d189c7c"
)


def _contains_float(value: Any) -> bool:
    if isinstance(value, float):
        return True
    if isinstance(value, dict):
        return any(_contains_float(item) for item in value.values())
    if isinstance(value, list):
        return any(_contains_float(item) for item in value)
    return False


@dataclass(frozen=True, slots=True)
class BridgeControlCheck:
    """Exact integrity and combinatorial checks on the frozen N=3 bridge ledger."""

    fixture_sha256: str
    hash_matches: bool
    status_matches: bool
    prerequisites_pass: bool
    pre_shift_term_count: int
    pre_shift_declared_count: int
    shifted_term_count: int
    shifted_declared_count: int
    pre_shift_plucker_count: int
    shifted_plucker_count: int
    contains_float: bool
    claim_boundary: str

    @property
    def all_pass(self) -> bool:
        """Return whether the frozen exact ledger is intact and internally consistent."""

        return (
            self.hash_matches
            and self.status_matches
            and self.prerequisites_pass
            and self.pre_shift_term_count == self.pre_shift_declared_count == 25
            and self.shifted_term_count == self.shifted_declared_count == 42
            and self.pre_shift_plucker_count == 15
            and self.shifted_plucker_count == 20
            and not self.contains_float
        )

    def to_record(self) -> dict[str, object]:
        """Serialize the exact-control result and its strict epistemic boundary."""

        return {
            "control_id": "n3-section8-top-cell-realization",
            "fixture_sha256": self.fixture_sha256,
            "expected_sha256": N3_SECTION8_FIXTURE_SHA256,
            "hash_matches": self.hash_matches,
            "status_matches": self.status_matches,
            "prerequisites_pass": self.prerequisites_pass,
            "ledger_counts": {
                "pre_shift_terms": self.pre_shift_term_count,
                "pre_shift_declared": self.pre_shift_declared_count,
                "pre_shift_pluckers": self.pre_shift_plucker_count,
                "shifted_terms": self.shifted_term_count,
                "shifted_declared": self.shifted_declared_count,
                "shifted_pluckers": self.shifted_plucker_count,
            },
            "contains_float": self.contains_float,
            "verification_kind": "FROZEN_EXACT_LEDGER_AND_SOURCE_SPECIALIZATION_CONTROL",
            "claim_boundary": self.claim_boundary,
            "all_pass": self.all_pass,
        }


def verify_og3_6_bridge_bytes(raw: bytes) -> BridgeControlCheck:
    """Check exact frozen fixture bytes without accessing packet directories."""

    record = json.loads(raw.decode("utf-8"))
    pre = record["symbolic_ledgers"]["pre_shift"]
    shifted = record["symbolic_ledgers"]["gdown"]
    pre_terms = sum(len(terms) for terms in pre["plucker_terms"].values())
    shifted_terms = sum(len(terms) for terms in shifted["plucker_terms"].values())
    prerequisites = record["source_chain"]["prerequisites"]
    decision = record["decision"]
    status_matches = (
        record["status"] == "N3_cyclic_order_all_theta_proof_packet_ready"
        and decision["N3_all_admissible_theta_claim_made"] is True
        and decision["generic_bridge_claim_made"] is False
        and decision["Galashin_Q9_2_claim_made"] is False
    )
    return BridgeControlCheck(
        fixture_sha256=hashlib.sha256(raw).hexdigest(),
        hash_matches=hashlib.sha256(raw).hexdigest() == N3_SECTION8_FIXTURE_SHA256,
        status_matches=status_matches,
        prerequisites_pass=all(value is True for value in prerequisites.values()),
        pre_shift_term_count=pre_terms,
        pre_shift_declared_count=int(pre["matching_count"]),
        shifted_term_count=shifted_terms,
        shifted_declared_count=int(shifted["matching_count"]),
        pre_shift_plucker_count=len(pre["plucker_terms"]),
        shifted_plucker_count=len(shifted["plucker_terms"]),
        contains_float=_contains_float(record),
        claim_boundary=(
            "This checks the frozen exact monomial ledgers and source-specialization gates for "
            "the N=3 cyclic-order top-cell realization. Equality for all admissible theta is "
            "inherited from the pinned Galashin theorems; this computation does not prove the "
            "generic electrical-to-Ising homeomorphism or Galashin-Pylyavskyy Question 9.2."
        ),
    )


def verify_og3_6_bridge_control(path: str | Path) -> BridgeControlCheck:
    """Check the exact N=3 Section-8 ledger without reasserting generic Q9.2."""

    return verify_og3_6_bridge_bytes(Path(path).read_bytes())


CRITICAL_SHIFT_SCHEMA = "ogcanon.critical-shift/v1"


def _numpy():
    # Keep the numerical backend out of the base import path. The rest of
    # ogcanon remains usable for exact graph computations without NumPy loaded.
    import numpy as np

    return np


def _reduce_label(value: int, n: int) -> int:
    return ((value - 1) % n) + 1


@dataclass(frozen=True, slots=True)
class BoundedAffinePermutation:
    """A one-window bounded affine permutation used by the critical shift."""

    window: tuple[int, ...]

    @property
    def n(self) -> int:
        return len(self.window)

    @property
    def residues(self) -> tuple[int, ...]:
        return tuple(_reduce_label(value, self.n) for value in self.window)

    @property
    def inverse_residue(self) -> dict[int, int]:
        return {value: index for index, value in enumerate(self.residues, 1)}

    @property
    def rank(self) -> int:
        displacement = sum(
            value - index for index, value in enumerate(self.window, start=1)
        )
        if displacement % self.n:
            raise ValueError(f"nonintegral rank for affine window {self.window}")
        return displacement // self.n

    def __call__(self, p: int) -> int:
        residue = _reduce_label(p, self.n)
        period = (p - residue) // self.n
        return self.window[residue - 1] + period * self.n

    @property
    def is_loopless(self) -> bool:
        return all(self(p) > p for p in range(1, self.n + 1))

    def shift_down(self) -> "BoundedAffinePermutation":
        """Return Galashin's shift f-down(p)=f(p-1)."""

        return BoundedAffinePermutation(
            tuple(self(p - 1) for p in range(1, self.n + 1))
        )

    @classmethod
    def loopless_lift(cls, residues: Sequence[int]) -> "BoundedAffinePermutation":
        n = len(residues)
        if sorted(residues) != list(range(1, n + 1)):
            raise ValueError("residues must be a permutation of [1,n]")
        window = []
        for p, residue in enumerate(residues, 1):
            advance = (residue - p) % n
            window.append(p + (advance if advance else n))
        return cls(tuple(window))


def dual_affine_permutation(
    affine: BoundedAffinePermutation,
) -> BoundedAffinePermutation:
    """Return Galashin's dual affine permutation ``f_hat(p)=f^-1(p)+n``."""

    window = []
    for p in range(1, affine.n + 1):
        inverse_residue = affine.inverse_residue[p]
        inverse_value = inverse_residue + (
            (p - affine(inverse_residue)) // affine.n
        ) * affine.n
        if affine(inverse_value) != p:
            raise AssertionError("failed to construct the affine inverse")
        window.append(inverse_value + affine.n)
    return BoundedAffinePermutation(tuple(window))


def _matching_map(pairs: Sequence[Sequence[int]]) -> tuple[int, ...]:
    n = 2 * len(pairs)
    tau = [0] * (n + 1)
    for pair in pairs:
        if len(pair) != 2:
            raise ValueError("each matching edge must have two endpoints")
        p, q = (int(value) for value in pair)
        if p == q or not (1 <= p <= n and 1 <= q <= n):
            raise ValueError(f"invalid matching edge {(p, q)} on [1,{n}]")
        if tau[p] or tau[q]:
            raise ValueError(f"matching endpoint repeated in {(p, q)}")
        tau[p] = q
        tau[q] = p
    if sorted(tau[1:]) != list(range(1, n + 1)):
        raise ValueError("pairs do not define a perfect matching")
    return tuple(tau[1:])


def electrical_permutation(
    pairs: Sequence[Sequence[int]],
) -> BoundedAffinePermutation:
    """Return Galashin's loopless electrical affine permutation for a matching."""

    tau = _matching_map(pairs)
    n = len(tau)
    residues = tuple(tau[p % n] for p in range(1, n + 1))
    return BoundedAffinePermutation.loopless_lift(residues)


def ising_permutation(
    pairs: Sequence[Sequence[int]],
) -> BoundedAffinePermutation:
    """Return Galashin's loopless Ising affine permutation for a matching."""

    return BoundedAffinePermutation.loopless_lift(_matching_map(pairs))


@dataclass(frozen=True, slots=True)
class CriticalShiftSpec:
    """A reproducible numerical realization of the Proposition 8.9 map."""

    id: str
    matching: tuple[tuple[int, int], ...]
    theta_over_pi: tuple[float, ...]
    initial_theta_over_pi: tuple[float, ...]
    expected: dict[str, object]
    claim_boundary: str

    @classmethod
    def from_record(cls, record: dict[str, object]) -> "CriticalShiftSpec":
        if record.get("schema") != CRITICAL_SHIFT_SCHEMA:
            raise ValueError(
                f"expected schema {CRITICAL_SHIFT_SCHEMA!r}, got {record.get('schema')!r}"
            )
        raw_matching = record.get("matching")
        if not isinstance(raw_matching, list):
            raise TypeError("matching must be a list")
        matching = tuple(tuple(int(value) for value in pair) for pair in raw_matching)
        _matching_map(matching)
        n = 2 * len(matching)
        theta = tuple(
            float(Fraction(str(value))) for value in record.get("theta_over_pi", [])
        )
        initial = tuple(
            float(Fraction(str(value)))
            for value in record.get("initial_theta_over_pi", [])
        )
        if len(theta) != n or len(initial) != n:
            raise ValueError(f"theta lists must each have length {n}")
        expected = record.get("expected")
        if not isinstance(expected, dict):
            raise TypeError("expected must be an object")
        return cls(
            id=str(record["id"]),
            matching=matching,  # type: ignore[arg-type]
            theta_over_pi=theta,
            initial_theta_over_pi=initial,
            expected=expected,
            claim_boundary=str(record["claim_boundary"]),
        )

    @classmethod
    def from_json(cls, path: str | Path) -> "CriticalShiftSpec":
        return cls.from_record(json.loads(Path(path).read_text(encoding="utf-8")))


@dataclass(frozen=True, slots=True)
class CriticalShiftCheck:
    """Computed certificate for one constructive critical-shift realization."""

    fixture_id: str
    payload: dict[str, object]

    @property
    def all_pass(self) -> bool:
        return bool(self.payload["all_pass"])

    def to_record(self) -> dict[str, object]:
        return dict(self.payload)


@dataclass(frozen=True, slots=True)
class CriticalShiftResult:
    """Numerical output of the constructive critical-locus shift."""

    matching: tuple[tuple[int, int], ...]
    electrical_window: tuple[int, ...]
    ising_window: tuple[int, ...]
    directed_crossing_edges: tuple[tuple[int, int], ...]
    r_coordinate: tuple[float, ...]
    recovered_theta: tuple[float, ...]
    target_matrix: tuple[tuple[float, ...], ...]
    twist: dict[str, float]
    recovery: dict[str, object]

    @property
    def converged(self) -> bool:
        return bool(self.recovery["converged"])

    def to_record(self) -> dict[str, object]:
        return {
            "matching": [list(pair) for pair in self.matching],
            "electrical_window": list(self.electrical_window),
            "ising_window": list(self.ising_window),
            "directed_crossing_edges": [
                list(edge) for edge in self.directed_crossing_edges
            ],
            "r_coordinate": list(self.r_coordinate),
            "recovered_theta": list(self.recovered_theta),
            "target_matrix": [list(row) for row in self.target_matrix],
            "twist": dict(self.twist),
            "recovery": dict(self.recovery),
            "verification_kind": "FLOAT64_CONSTRUCTIVE_MAP",
            "claim_boundary": (
                "Numerical evaluation of the critical-locus map only. The caller must "
                "supply a source matrix in the stated critical cell and a starting point "
                "in its admissible angle chamber. The target is Galashin's dual critical "
                "measurement; no full-cell or descended boundary extension is implied."
            ),
        }


def _chords_cross(left: tuple[int, int], right: tuple[int, int]) -> bool:
    p, q = sorted(left)
    r, s = sorted(right)
    return (p < r < q < s) or (r < p < s < q)


def _matching_components(pairs: tuple[tuple[int, int], ...]) -> list[list[int]]:
    parent = list(range(len(pairs)))

    def find(index: int) -> int:
        while parent[index] != index:
            parent[index] = parent[parent[index]]
            index = parent[index]
        return index

    def union(left: int, right: int) -> None:
        left, right = find(left), find(right)
        if left != right:
            parent[right] = left

    for left, right in itertools.combinations(range(len(pairs)), 2):
        if _chords_cross(pairs[left], pairs[right]):
            union(left, right)
    groups: dict[int, list[int]] = {}
    for index in range(len(pairs)):
        groups.setdefault(find(index), []).append(index)
    return list(groups.values())


def _cyclic(points: tuple[int, ...], modulus: int) -> bool:
    steps = [
        (points[(index + 1) % len(points)] - points[index]) % modulus
        for index in range(len(points))
    ]
    return all(step > 0 for step in steps) and sum(steps) == modulus


def _directed_crossing_edges(
    affine: BoundedAffinePermutation,
) -> tuple[tuple[int, int], ...]:
    inverse = affine.inverse_residue
    modulus = 5 * affine.n

    def entry(label: int) -> int:
        return (5 * (inverse[label] - 1) + 4) % modulus

    def exit_(label: int) -> int:
        return 5 * (label - 1) + 1

    directed = set()
    for p, q in itertools.combinations(range(1, affine.n + 1), 2):
        if _cyclic((entry(p), entry(q), exit_(p), exit_(q)), modulus):
            directed.add((p, q))
        elif _cyclic((entry(q), entry(p), exit_(q), exit_(p)), modulus):
            directed.add((q, p))
    return tuple(sorted(directed))


def _graph_components(n: int, edges: tuple[tuple[int, int], ...]) -> list[list[int]]:
    parent = list(range(n))

    def find(index: int) -> int:
        while parent[index] != index:
            parent[index] = parent[parent[index]]
            index = parent[index]
        return index

    def union(left: int, right: int) -> None:
        left, right = find(left), find(right)
        if left != right:
            parent[right] = left

    for tail, head in edges:
        union(tail - 1, head - 1)
    groups: dict[int, list[int]] = {}
    for index in range(n):
        groups.setdefault(find(index), []).append(index)
    return list(groups.values())


def _incidence(n: int, edges: tuple[tuple[int, int], ...]):
    np = _numpy()
    matrix = np.zeros((n, len(edges)), dtype=float)
    for column, (tail, head) in enumerate(edges):
        matrix[tail - 1, column] = -1.0
        matrix[head - 1, column] = 1.0
    return matrix


def _gauge_normalize(theta, components: list[list[int]]):
    np = _numpy()
    normalized = np.array(theta, dtype=float)
    for component in components:
        normalized[component] -= normalized[min(component)]
    return normalized


def _edge_angles(theta, edges: tuple[tuple[int, int], ...]):
    np = _numpy()
    return np.array(
        [(theta[head - 1] - theta[tail - 1]) % math.pi for tail, head in edges]
    )


def _gradient(theta, edges: tuple[tuple[int, int], ...]):
    np = _numpy()
    return _incidence(len(theta), edges) @ np.log(np.sin(_edge_angles(theta, edges)))


def _hessian(theta, edges: tuple[tuple[int, int], ...]):
    np = _numpy()
    incidence = _incidence(len(theta), edges)
    angles = _edge_angles(theta, edges)
    return incidence @ np.diag(1.0 / np.tan(angles)) @ incidence.T


def _forward_necklace(
    affine: BoundedAffinePermutation,
) -> tuple[dict[int, tuple[int, ...]], dict[int, tuple[int, ...]]]:
    i_sets: dict[int, tuple[int, ...]] = {}
    j_sets: dict[int, tuple[int, ...]] = {}
    for q in range(1, affine.n + 1):
        lifted = {affine(p) for p in range(q - affine.n, q) if p < q <= affine(p)}
        residues = tuple(sorted(_reduce_label(value, affine.n) for value in lifted))
        i_sets[q] = residues
        j_sets[q] = tuple(value for value in residues if value != q)
    return i_sets, j_sets


def grassmann_necklace(
    affine: BoundedAffinePermutation,
) -> tuple[tuple[int, ...], ...]:
    """Return the one-based Grassmann necklace ``(I_r)`` of a loopless window.

    The tuple is ordered by ``r=1,...,n`` and each subset is written in the
    ordinary sorted representative on ``[1,n]``.  This is the same convention
    used internally by the critical-measurement implementation.
    """

    if not affine.is_loopless:
        raise ValueError("Grassmann-necklace examples require a loopless window")
    i_sets, _ = _forward_necklace(affine)
    return tuple(i_sets[index] for index in range(1, affine.n + 1))


def reduced_grassmann_necklace(
    affine: BoundedAffinePermutation,
) -> tuple[tuple[int, ...], ...]:
    """Return ``J_r=I_r\\{r}`` in the frozen one-based convention."""

    if not affine.is_loopless:
        raise ValueError("reduced necklace examples require a loopless window")
    _, j_sets = _forward_necklace(affine)
    return tuple(j_sets[index] for index in range(1, affine.n + 1))


def _epsilon(affine: BoundedAffinePermutation, r: int) -> int:
    count = sum(
        1 for p, value in enumerate(affine.residues, start=1) if value <= p and p < r
    )
    return -1 if count % 2 else 1


def _gamma_matrix(affine: BoundedAffinePermutation, theta):
    np = _numpy()
    _, j_sets = _forward_necklace(affine)
    sample_points = [
        (index + 1) * math.pi / (affine.n + 3) for index in range(affine.rank)
    ]
    return np.array(
        [
            [
                _epsilon(affine, r)
                * math.prod(math.sin(t - theta[p - 1]) for p in j_sets[r])
                for r in range(1, affine.n + 1)
            ]
            for t in sample_points
        ],
        dtype=float,
    )


def _extended_column(matrix, affine: BoundedAffinePermutation, p: int):
    residue = _reduce_label(p, affine.n)
    period = (p - residue) // affine.n
    sign = (-1.0) ** (period * (affine.rank - 1))
    return sign * matrix[:, residue - 1]


def _left_twist(affine: BoundedAffinePermutation, matrix):
    np = _numpy()
    columns = []
    for q in range(1, affine.n + 1):
        support = tuple(p for p in range(q - affine.n, q) if p < q and affine(p) > q)
        if len(support) != affine.rank - 1:
            raise ValueError(f"bad twist support at q={q}: {support}")
        pivot = np.column_stack(
            [_extended_column(matrix, affine, q)]
            + [_extended_column(matrix, affine, p) for p in support]
        )
        columns.append(np.linalg.solve(pivot.T, np.eye(affine.rank)[:, 0]))
    return np.column_stack(columns)


def _plucker(matrix, columns: tuple[int, ...]) -> float:
    np = _numpy()
    return float(np.linalg.det(matrix[:, [column - 1 for column in columns]]))


def _plucker_vector(matrix):
    np = _numpy()
    labels = list(
        itertools.combinations(range(1, matrix.shape[1] + 1), matrix.shape[0])
    )
    return labels, np.array([_plucker(matrix, label) for label in labels])


def _projective_residual(candidate, target) -> float:
    np = _numpy()
    scale = float(np.dot(candidate, target) / np.dot(candidate, candidate))
    denominator = max(1.0, float(np.max(np.abs(target))))
    return float(np.max(np.abs(scale * candidate - target)) / denominator)


def _twist_equation_residual(affine, matrix, twisted) -> float:
    residuals = []
    for q in range(1, affine.n + 1):
        support = tuple(p for p in range(q - affine.n, q) if p < q and affine(p) > q)
        vector = twisted[:, q - 1]
        residuals.append(abs(float(vector @ _extended_column(matrix, affine, q)) - 1.0))
        residuals.extend(
            abs(float(vector @ _extended_column(matrix, affine, p))) for p in support
        )
    return max(residuals, default=0.0)


def _r_coordinate(affine, measured_matrix, edges):
    np = _numpy()
    twisted = _left_twist(affine, measured_matrix)
    i_sets, _ = _forward_necklace(affine)
    log_necklace = np.array(
        [math.log(abs(_plucker(twisted, i_sets[q]))) for q in range(1, affine.n + 1)]
    )
    differences = np.roll(log_necklace, -1) - log_necklace
    relabeled = np.array(
        [
            differences[affine.inverse_residue[label] - 1]
            for label in range(1, affine.n + 1)
        ]
    )
    incidence = _incidence(affine.n, edges)
    b_one = incidence @ np.ones(len(edges))
    return relabeled - math.log(2.0) * b_one, {
        "twist_equation_max_residual": _twist_equation_residual(
            affine, measured_matrix, twisted
        ),
        "B_one_max_abs": float(np.max(np.abs(b_one))) if edges else 0.0,
    }


def _recover_theta(target_r, start, edges, components):
    np = _numpy()
    x = _gauge_normalize(start, components)
    representatives = {min(component) for component in components}
    free = [index for index in range(len(x)) if index not in representatives]
    accepted_steps = 0
    for iteration in range(40):
        residual = _gradient(x, edges) - target_r
        residual_norm = float(np.linalg.norm(residual))
        if residual_norm < 1e-11:
            return x, {
                "converged": True,
                "iterations": iteration,
                "accepted_steps": accepted_steps,
                "residual_norm": residual_norm,
            }
        jacobian = _hessian(x, edges)[:, free]
        step = np.linalg.lstsq(jacobian, -residual, rcond=None)[0]
        scale = 1.0
        accepted = False
        for _ in range(24):
            candidate = np.array(x)
            candidate[free] += scale * step
            angles = _edge_angles(candidate, edges)
            candidate_residual = _gradient(candidate, edges) - target_r
            if (
                np.all(angles > 1e-8)
                and np.all(angles < math.pi - 1e-8)
                and np.linalg.norm(candidate_residual) < residual_norm
            ):
                x = candidate
                accepted = True
                accepted_steps += 1
                break
            scale *= 0.5
        if not accepted:
            return x, {
                "converged": False,
                "iterations": iteration,
                "accepted_steps": accepted_steps,
                "residual_norm": residual_norm,
                "reason": "line_search_failed",
            }
    final_norm = float(np.linalg.norm(_gradient(x, edges) - target_r))
    return x, {
        "converged": final_norm < 1e-10,
        "iterations": 40,
        "accepted_steps": accepted_steps,
        "residual_norm": final_norm,
    }


def critical_measurement_matrix(
    affine: BoundedAffinePermutation, theta: Sequence[float]
) -> tuple[tuple[float, ...], ...]:
    """Evaluate Galashin's critical curve matrix at a real angle tuple."""

    np = _numpy()
    values = np.array(theta, dtype=float)
    if values.shape != (affine.n,):
        raise ValueError(f"theta must have length {affine.n}")
    matrix = _gamma_matrix(affine, values)
    return tuple(tuple(float(value) for value in row) for row in matrix)


def _lift_angle(theta, p: int) -> float:
    residue = _reduce_label(p, len(theta))
    period = (p - residue) // len(theta)
    return float(theta[residue - 1] + period * math.pi)


def _alternating_orthogonal_complement(matrix):
    """Represent ``alt^perp(RowSpan(matrix))`` in Galashin's sign convention."""

    np = _numpy()
    source = np.array(matrix, dtype=float)
    rank = int(np.linalg.matrix_rank(source))
    if rank != source.shape[0]:
        raise ValueError("ordinary dual-source matrix is rank deficient")
    _, _, vh = np.linalg.svd(source, full_matrices=True)
    kernel = vh[rank:, :]
    alternating = np.array(
        [(-1.0) ** position for position in range(1, source.shape[1] + 1)]
    )
    return kernel * alternating


def dual_critical_measurement_matrix(
    affine: BoundedAffinePermutation, theta: Sequence[float]
) -> tuple[tuple[float, ...], ...]:
    """Evaluate Galashin's dual critical measurement at a real angle tuple.

    Proposition 3.4 writes this point as the alternating orthogonal complement
    of the ordinary critical measurement for ``affine_hat`` after relabeling
    the angles. This generally differs from the ordinary critical curve matrix;
    the two agree on the matching fixture's physical isotropic slice.
    """

    np = _numpy()
    values = np.array(theta, dtype=float)
    if values.shape != (affine.n,):
        raise ValueError(f"theta must have length {affine.n}")
    dual_affine = dual_affine_permutation(affine)
    relabeled = np.array(
        [_lift_angle(values, affine(q)) for q in range(1, affine.n + 1)]
    )
    ordinary_dual = _gamma_matrix(dual_affine, relabeled)
    matrix = _alternating_orthogonal_complement(ordinary_dual)
    if matrix.shape != (affine.rank, affine.n):
        raise AssertionError(
            f"dual critical matrix has shape {matrix.shape}, "
            f"expected {(affine.rank, affine.n)}"
        )
    return tuple(tuple(float(value) for value in row) for row in matrix)


def construct_critical_shift(
    pairs: Sequence[Sequence[int]],
    source_matrix: Sequence[Sequence[float]],
    initial_theta: Sequence[float],
) -> CriticalShiftResult:
    """Numerically evaluate H_f from a critical electrical source matrix.

    ``initial_theta`` is an independent starting point, in radians, in the
    source cell's admissible chamber. The returned matrix represents the dual
    critical point for Galashin's shifted affine permutation.
    """

    np = _numpy()
    frozen_pairs = tuple(tuple(int(value) for value in pair) for pair in pairs)
    _matching_map(frozen_pairs)
    electrical = electrical_permutation(frozen_pairs)
    ising = ising_permutation(frozen_pairs)
    if electrical.shift_down() != ising:
        raise ValueError("electrical shift does not match the Ising permutation")
    source = np.array(source_matrix, dtype=float)
    expected_shape = (electrical.rank, electrical.n)
    if source.shape != expected_shape:
        raise ValueError(
            f"source_matrix must have shape {expected_shape}, got {source.shape}"
        )
    start = np.array(initial_theta, dtype=float)
    if start.shape != (electrical.n,):
        raise ValueError(f"initial_theta must have length {electrical.n}")
    if int(np.linalg.matrix_rank(source)) != electrical.rank:
        raise ValueError("source_matrix is rank deficient")

    edges = _directed_crossing_edges(electrical)
    components = _graph_components(electrical.n, edges)
    r_value, twist = _r_coordinate(electrical, source, edges)
    recovered, recovery = _recover_theta(r_value, start, edges, components)
    if not recovery["converged"]:
        raise ValueError(
            "inverse-gradient solve did not converge: "
            f"residual={recovery['residual_norm']}"
        )
    target = np.array(dual_critical_measurement_matrix(ising, recovered))
    return CriticalShiftResult(
        matching=frozen_pairs,  # type: ignore[arg-type]
        electrical_window=electrical.window,
        ising_window=ising.window,
        directed_crossing_edges=edges,
        r_coordinate=tuple(float(value) for value in r_value),
        recovered_theta=tuple(float(value) for value in recovered),
        target_matrix=tuple(tuple(float(value) for value in row) for row in target),
        twist=twist,
        recovery=recovery,
    )


def verify_critical_shift(spec: CriticalShiftSpec) -> CriticalShiftCheck:
    """Compute one source -> inverse-gradient -> shifted-target realization.

    This is numerical corroboration of the constructive formula. The uniform
    theorem remains inherited from the source-pinned proof, not from this run.
    """

    np = _numpy()
    pairs = spec.matching
    electrical = electrical_permutation(pairs)
    ising = ising_permutation(pairs)
    shifted = electrical.shift_down()
    theta = math.pi * np.array(spec.theta_over_pi, dtype=float)
    start = math.pi * np.array(spec.initial_theta_over_pi, dtype=float)
    edges = _directed_crossing_edges(electrical)
    components = _graph_components(electrical.n, edges)
    source_matrix = _gamma_matrix(electrical, theta)
    direct_target_matrix = np.array(dual_critical_measurement_matrix(ising, theta))
    result = construct_critical_shift(pairs, source_matrix, start)
    r_value = np.array(result.r_coordinate)
    twist = result.twist
    factorization_error = float(np.max(np.abs(r_value - _gradient(theta, edges))))
    recovered = np.array(result.recovered_theta)
    recovery = result.recovery
    normalized_theta = _gauge_normalize(theta, components)
    recovery_error = float(np.max(np.abs(recovered - normalized_theta)))
    recovered_target_matrix = np.array(result.target_matrix)
    labels, direct_target = _plucker_vector(direct_target_matrix)
    recovered_labels, recovered_target = _plucker_vector(recovered_target_matrix)
    if labels != recovered_labels:
        raise AssertionError("target Plucker labels changed")
    target_residual = _projective_residual(recovered_target, direct_target)
    crossing_count = sum(
        _chords_cross(left, right) for left, right in itertools.combinations(pairs, 2)
    )
    chord_components = _matching_components(pairs)
    critical_dimension = len(pairs) - len(chord_components)
    expected = spec.expected
    expected_windows = list(electrical.window) == expected.get(
        "electrical_window"
    ) and list(ising.window) == expected.get("ising_window")
    expected_dimensions = crossing_count == expected.get(
        "cell_dimension"
    ) and critical_dimension == expected.get("critical_dimension")
    checks = {
        "non_top": crossing_count < math.comb(len(pairs), 2),
        "matching_connected": len(chord_components) == 1,
        "shift_identity": shifted.window == ising.window,
        "expected_windows": expected_windows,
        "expected_dimensions": expected_dimensions,
        "source_rank": int(np.linalg.matrix_rank(source_matrix)) == electrical.rank,
        "target_rank": int(np.linalg.matrix_rank(direct_target_matrix)) == ising.rank,
        "twist_equations": twist["twist_equation_max_residual"] < 1e-10,
        "eulerian_crossing_graph": twist["B_one_max_abs"] == 0.0,
        "r_factorization": factorization_error < 1e-9,
        "inverse_converged": bool(recovery["converged"]),
        "angle_recovery": recovery_error < 1e-8,
        "target_reconstruction": target_residual < 1e-8,
        "target_is_dual_measurement": True,
        "proper_critical_sublocus": critical_dimension < crossing_count,
    }
    payload: dict[str, object] = {
        "schema": CRITICAL_SHIFT_SCHEMA,
        "fixture_id": spec.id,
        "verification_kind": "FLOAT64_CONSTRUCTIVE_REALIZATION",
        "matching": [list(pair) for pair in pairs],
        "crossings": crossing_count,
        "cell_dimension": crossing_count,
        "critical_dimension": critical_dimension,
        "electrical_window": list(electrical.window),
        "electrical_rank": electrical.rank,
        "ising_window": list(ising.window),
        "ising_rank": ising.rank,
        "directed_crossing_edges": [list(edge) for edge in edges],
        "factorization_error": factorization_error,
        "recovery": recovery,
        "angle_recovery_error": recovery_error,
        "target_projective_residual": target_residual,
        "twist": twist,
        "checks": checks,
        "claim_boundary": spec.claim_boundary,
        "all_pass": all(checks.values()),
    }
    return CriticalShiftCheck(fixture_id=spec.id, payload=payload)
