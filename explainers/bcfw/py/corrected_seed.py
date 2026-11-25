"""Domino-variable seed, from arXiv:2310.17727v3.

Definitions 7.8, 10.4 and 10.8; Remark 10.5; Lemma 10.13.
Forms the sticky same-end beta/alpha identity before constructing relations.
The exchange monomial exponents determine all arrows incident to mutables.
Only domino variables are included; the full extended cluster is not shown.
Python standard library only. Chord indices in this module are zero-based.
"""
from __future__ import annotations
from collections import Counter, defaultdict
from dataclasses import dataclass
from typing import Iterable

LETTERS = ("alpha", "beta", "gamma", "delta", "epsilon")
RawVar = tuple[int, str]
Monomial = Counter[RawVar]


@dataclass(frozen=True)
class Relation:
    """An exchange relation ``pivot*pivot' = incoming + outgoing``."""

    pivot: RawVar
    incoming: tuple[tuple[RawVar, int], ...]
    outgoing: tuple[tuple[RawVar, int], ...]
    source_case: str

    def incoming_counter(self) -> Monomial:
        return Counter(dict(self.incoming))

    def outgoing_counter(self) -> Monomial:
        return Counter(dict(self.outgoing))


def _parent(diagram, i: int) -> int | None:
    """The immediate chord geometrically above ``diagram[i]`` (Def. 7.8)."""

    a, c = diagram[i][0], diagram[i][2]
    candidates = []
    for j, chord in enumerate(diagram):
        if j == i:
            continue
        aj, cj = chord[0], chord[2]
        if aj <= a and c <= cj and (aj, cj) != (a, c):
            candidates.append(j)
    if not candidates:
        return None
    return min(candidates, key=lambda j: (diagram[j][2] - diagram[j][0], -diagram[j][0]))


def _only(values: Iterable[int], description: str) -> int | None:
    values = tuple(values)
    if len(values) > 1:
        raise ValueError(f"non-unique {description}: {values}")
    return values[0] if values else None


def _structure(diagram):
    k = len(diagram)
    start = lambda i: diagram[i][0]
    end = lambda i: diagram[i][2]
    parents = tuple(_parent(diagram, i) for i in range(k))
    children = {i: tuple(j for j in range(k) if parents[j] == i) for i in range(k)}

    sticky_child = {
        i: _only((j for j in children[i] if start(j) == start(i) + 1), f"sticky child of {i}")
        for i in range(k)
    }
    same_end_child = {
        i: _only((j for j in children[i] if end(j) == end(i)), f"same-end child of {i}")
        for i in range(k)
    }
    left_sibling = {
        i: _only(
            (j for j in range(k) if j != i and parents[j] == parents[i] and end(j) == start(i)),
            f"head-to-tail left sibling of {i}",
        )
        for i in range(k)
    }
    right_sibling = {
        i: _only(
            (j for j in range(k) if j != i and parents[j] == parents[i] and start(j) == end(i)),
            f"head-to-tail right sibling of {i}",
        )
        for i in range(k)
    }

    return {
        "parents": parents,
        "children": children,
        "sticky_child": sticky_child,
        "same_end_child": same_end_child,
        "left_sibling": left_sibling,
        "right_sibling": right_sibling,
    }


def _counter_tuple(counter: Monomial) -> tuple[tuple[RawVar, int], ...]:
    return tuple(sorted((var, exponent) for var, exponent in counter.items() if exponent))


def seed_from_diagram(diagram) -> dict:
    """Construct the source seed and its principal quiver from a chord diagram.

    Chord indices are zero-based.  The canonical representative of the identity
    ``beta_child = alpha_parent`` is ``(parent, 'alpha')``.
    """

    diagram = tuple(tuple(chord) for chord in diagram)
    k = len(diagram)
    st = _structure(diagram)
    parents = st["parents"]

    canonical: dict[RawVar, RawVar] = {
        (i, letter): (i, letter) for i in range(k) for letter in LETTERS
    }
    identity_pairs = []
    for i, p in enumerate(parents):
        if p is None:
            continue
        sticky = diagram[i][0] == diagram[p][0] + 1
        same_end = diagram[i][2] == diagram[p][2]
        if sticky and same_end:
            canonical[(i, "beta")] = (p, "alpha")
            identity_pairs.append(((i, "beta"), (p, "alpha")))

    def canon(var: RawVar) -> RawVar:
        return canonical[var]

    raw_mutable: set[RawVar] = set()
    for i in range(k):
        if st["sticky_child"][i] is not None:
            raw_mutable.add((i, "alpha"))
        if st["left_sibling"][i] is not None or canonical[(i, "beta")] != (i, "beta"):
            raw_mutable.add((i, "beta"))
        if st["same_end_child"][i] is not None:
            raw_mutable.update({(i, "delta"), (i, "epsilon")})
    mutable = {canon(var) for var in raw_mutable}

    relation_data: dict[RawVar, tuple[Monomial, Monomial, str]] = {}

    def monomial(*variables: RawVar | None) -> Monomial:
        out: Monomial = Counter()
        for var in variables:
            if var is not None:
                out[canon(var)] += 1
        return out

    def add_relation(pivot: RawVar, incoming: Monomial, outgoing: Monomial, case: str) -> None:
        pivot = canon(pivot)
        if pivot in incoming or pivot in outgoing:
            raise ValueError(f"{case}: pivot {pivot} occurs in its own exchange monomial")
        common = set(incoming) & set(outgoing)
        if common:
            raise ValueError(f"{case}: exchange monomials share variables {sorted(common)}")
        value = (incoming, outgoing, case)
        if pivot in relation_data:
            old_in, old_out, old_case = relation_data[pivot]
            if old_in != incoming or old_out != outgoing:
                raise ValueError(f"conflicting relations for {pivot}: {old_case} versus {case}")
            return
        relation_data[pivot] = value

    for i in range(k):
        p = parents[i]
        sticky_parent = p is not None and diagram[i][0] == diagram[p][0] + 1
        same_end_parent = p is not None and diagram[i][2] == diagram[p][2]

        # Lemma 10.13, R1.
        j = st["sticky_child"][i]
        if j is not None:
            first = monomial(
                None if sticky_parent and same_end_parent else (i, "beta"),
                (j, "epsilon"),
                (p, "alpha") if sticky_parent else None,
            )
            second = monomial(
                (j, "alpha"),
                (i, "epsilon") if diagram[j][2] == diagram[i][2] else None,
            )
            add_relation((i, "alpha"), first, second, f"R1(i={i},j={j})")

        # Lemma 10.13, R2.
        j = st["left_sibling"][i]
        if j is not None:
            add_relation(
                (i, "beta"),
                monomial((j, "gamma")),
                monomial((i, "alpha"), (j, "delta")),
                f"R2(i={i},j={j})",
            )

        # Lemma 10.13, R3a and R3b.
        j = st["same_end_child"][i]
        if j is not None:
            right = st["right_sibling"][i]
            add_relation(
                (i, "delta"),
                monomial(
                    (j, "gamma"),
                    (i, "epsilon"),
                    (p, "delta") if same_end_parent else None,
                    (right, "beta") if right is not None else None,
                ),
                monomial(
                    (i, "gamma"),
                    (j, "delta"),
                    (p, "epsilon") if same_end_parent else None,
                ),
                f"R3a(i={i},j={j})",
            )
            add_relation(
                (i, "epsilon"),
                monomial(
                    (j, "delta"),
                    (i, "alpha") if diagram[j][0] == diagram[i][0] + 1 else None,
                    (p, "epsilon") if same_end_parent else None,
                ),
                monomial(
                    (i, "delta"),
                    (j, "epsilon"),
                    (p, "alpha") if sticky_parent else None,
                ),
                f"R3b(i={i},j={j})",
            )

    missing = mutable - set(relation_data)
    extra = set(relation_data) - mutable
    if missing or extra:
        raise ValueError(f"relation/mutable mismatch: missing={sorted(missing)}, extra={sorted(extra)}")

    # Recover B_mut column by column and fail closed unless it is skew-symmetric.
    vertices = sorted(mutable)
    arrows: list[tuple[RawVar, RawVar]] = []
    for pos, u in enumerate(vertices):
        for v in vertices[pos + 1 :]:
            v_in, v_out, _ = relation_data[v]
            u_in, u_out, _ = relation_data[u]
            b_uv = v_in[u] - v_out[u]
            b_vu = u_in[v] - u_out[v]
            if b_uv != -b_vu:
                raise ValueError(
                    f"principal exchange matrix is not skew-symmetric at {u},{v}: "
                    f"b[u,v]={b_uv}, b[v,u]={b_vu}"
                )
            if b_uv > 0:
                arrows.extend([(u, v)] * b_uv)
            elif b_uv < 0:
                arrows.extend([(v, u)] * (-b_uv))

    aliases: dict[RawVar, list[RawVar]] = defaultdict(list)
    for raw, representative in canonical.items():
        aliases[representative].append(raw)

    relations = {
        pivot: Relation(
            pivot=pivot,
            incoming=_counter_tuple(incoming),
            outgoing=_counter_tuple(outgoing),
            source_case=case,
        )
        for pivot, (incoming, outgoing, case) in relation_data.items()
    }
    return {
        "diagram": diagram,
        "parents": parents,
        "raw_mutable": tuple(sorted(raw_mutable)),
        "mutable": tuple(vertices),
        "identity_pairs": tuple(identity_pairs),
        "aliases": {key: tuple(sorted(value)) for key, value in aliases.items()},
        "relations": relations,
        "principal_arrows": tuple(arrows),
    }
