"""Browser computations for the domino-variable quotient seed.

Standard-library construction, ice-quiver mutation and bounded C-matrix search.
Frozen--frozen arrows are omitted. Symbolic cluster expressions are not computed.
"""
from __future__ import annotations

from collections import Counter
from functools import lru_cache
from itertools import combinations
from math import comb
from pathlib import Path
import json
import re

from corrected_seed import seed_from_diagram, LETTERS

MODEL = "bcfw-domino-quotient-v2"
SCHEMA = "bcfw-domino/v2"
VARS = ("α", "β", "γ", "δ", "ε")
AVAIL = ((6, 1), (7, 2), (8, 2), (8, 3), (9, 3), (10, 3), (8, 4), (9, 4), (10, 4))
MAX_STEPS = 128
MAX_NODES = 512
MAX_MULTIPLICITY = 10000
MAX_TOTAL_ARROWS = 100000
_DATA_ROOT = Path(__file__).resolve().parent.parent / "data"


class PortError(ValueError):
    def __init__(self, message: str, code: str = "invalid_input"):
        super().__init__(message)
        self.code = code


def configure(data_root: str) -> None:
    global _DATA_ROOT
    _DATA_ROOT = Path(data_root)
    family_data.cache_clear()


def checked_int(value, name: str, lo: int, hi: int) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or not lo <= value <= hi:
        raise PortError(f"{name} must be an integer in [{lo}, {hi}].")
    return value


def validate_diagram(diagram, n: int):
    checked_int(n, "n", 5, 40)
    if not isinstance(diagram, (list, tuple)) or not 1 <= len(diagram) <= 8:
        raise PortError("A diagram needs 1–8 chords.")
    result = []
    for c in diagram:
        if not isinstance(c, (list, tuple)) or len(c) != 4:
            raise PortError("Each chord needs four integer marker labels.")
        a, b, cc, d = [checked_int(v, "marker", 1, n-1) for v in c]
        if not (a+1 == b < cc and cc+1 == d):
            raise PortError("Require a, a+1 < c, c+1 ≤ n−1; retain terminal marker n.")
        result.append((a, b, cc, d))
    if len({c[0] for c in result}) != len(result):
        raise PortError("Chord start segments must be distinct.")
    for a, b in combinations(result, 2):
        if a[0] < b[0] < a[2] < b[2] or b[0] < a[0] < b[2] < a[2]:
            raise PortError("Crossing chords are outside the standard diagram grammar.")
    # Preserve chord order. The source labels are order-sensitive.
    return tuple(result)


@lru_cache(maxsize=16)
def enumerate_diagrams(n: int, k: int):
    """Lexicographic standard noncrossing diagrams with distinct starts."""
    if (n, k) not in AVAIL:
        raise PortError("Family is outside the nine bounded viewer presets.")
    choices = [(a, a+1, c, c+1)
               for a in range(1, n-3) for c in range(a+2, n-1)]
    answer = []
    for d in combinations(choices, k):
        if len({c[0] for c in d}) != k:
            continue
        if any(a[0] < b[0] < a[2] < b[2] for a, b in combinations(d, 2)):
            continue
        answer.append(d)
    return tuple(answer)


def expected_count(n: int, k: int) -> int:
    # Narayana N(n−3,k+1), used only as an enumerator regression check.
    return comb(n-3, k) * comb(n-3, k+1) // (n-3)


def flip_edges(diagrams):
    sets = [frozenset(map(tuple, d)) for d in diagrams]
    return [[i, j] for i in range(len(sets)) for j in range(i+1, len(sets))
            if len(sets[i] & sets[j]) == len(sets[i])-1]


@lru_cache(maxsize=512)
def seed(diagram: tuple, n: int):
    diagram = validate_diagram(diagram, n)
    source = seed_from_diagram(diagram)
    verts = []
    for raw, aliases in sorted(source["aliases"].items()):
        i, letter = raw
        var = VARS[LETTERS.index(letter)]
        names = [f"{VARS[LETTERS.index(l)]}{j+1}" for j, l in aliases]
        verts.append({"id": len(verts), "key": f"{i+1}_{var}", "chord": i+1,
                      "var": var, "label": " = ".join(names),
                      "aliases": [f"{j+1}_{VARS[LETTERS.index(l)]}" for j, l in aliases],
                      "mutable": raw in source["mutable"]})
    ix = {raw: i for i, raw in enumerate(sorted(source["aliases"]))}
    arrows = Counter((ix[a], ix[b]) for a, b in source["principal_arrows"])
    mutable = tuple(ix[v] for v in source["mutable"])
    mids = set(mutable)
    # Principal entries already appear in two relations: add them only once.
    # Frozen--frozen arrows do not occur in an exchange relation and are omitted.
    for pivot, relation in source["relations"].items():
        for var, exponent in relation.incoming:
            if ix[var] not in mids:
                arrows[ix[var], ix[pivot]] += exponent
        for var, exponent in relation.outgoing:
            if ix[var] not in mids:
                arrows[ix[pivot], ix[var]] += exponent
    return verts, arrows, mutable, list(source["parents"]), set()


def principal_matrix(arrows, mutable):
    return tuple(tuple(arrows[a, b]-arrows[b, a] for b in mutable) for a in mutable)


def initial_extended(arrows, mutable):
    b = principal_matrix(arrows, mutable)
    rank = len(mutable)
    return tuple(tuple(row) + tuple(int(i == j) for j in range(rank))
                 for i, row in enumerate(b))


def mutate_extended(matrix, k):
    """FZ mutation of [B | C], with row C-vectors and B[source,target]>0.

    This rectangular block is closed under mutation at its mutable indices.
    Coefficients here are auxiliary principal coefficients, separate from the
    frozen domino variables in the drawn quiver.
    """
    result = tuple(tuple(-x if i == k or j == k else
                         x + (abs(row[k])*matrix[k][j] + row[k]*abs(matrix[k][j]))//2
                         for j, x in enumerate(row))
                   for i, row in enumerate(matrix))
    if any(abs(x) > MAX_MULTIPLICITY for row in result for x in row):
        raise PortError("The matrix-size limit was reached. The displayed state is retained.",
                        "resource_limit")
    return result


def seed_key(matrix):
    rank = len(matrix)
    return frozenset(tuple(row[rank:]) for row in matrix)


def guard(arrows: Counter) -> None:
    if len(arrows) > 3200 or any(v > MAX_MULTIPLICITY for v in arrows.values()) \
            or sum(arrows.values()) > MAX_TOTAL_ARROWS:
        raise PortError("Mutation exceeded the browser arrow-size limit. "
                        "The last displayed state is unchanged; undo or reset.", "resource_limit")


def mutate(arrows: Counter, vertex: int) -> Counter:
    """Weighted FZ mutation: compose, reverse incident arrows, cancel 2-cycles."""
    guard(arrows)
    incoming = [(s, count) for (s, t), count in arrows.items() if t == vertex]
    outgoing = [(t, count) for (s, t), count in arrows.items() if s == vertex]
    composed = arrows.copy()
    for s, a in incoming:
        for t, b in outgoing:
            composed[(s, t)] += a*b
    rev = Counter()
    for (s, t), count in composed.items():
        rev[(t, s) if vertex in (s, t) else (s, t)] += count
    result = Counter()
    seen = set()
    for s, t in rev:
        if (s, t) in seen:
            continue
        count = rev[(s, t)]-rev[(t, s)]
        if count > 0:
            result[(s, t)] = count
        elif count < 0:
            result[(t, s)] = -count
        seen.update(((s, t), (t, s)))
    guard(result)
    return result


def canonical(arrows: Counter, mutable) -> tuple:
    mset = set(mutable)
    return tuple(sorted((s, t, c) for (s, t), c in arrows.items()
                        if c and (s in mset or t in mset)))


def serialize_arrows(arrows, dots=()):
    return [{"source": s, "target": t, "multiplicity": c,
             "dotted": (s, t) in dots} for (s, t), c in sorted(arrows.items()) if c]


def validate_path(path, verts, mutable):
    if path is None:
        return []
    if not isinstance(path, list) or len(path) > MAX_STEPS:
        raise PortError(f"Mutation path must be a list of at most {MAX_STEPS} entries.", "path_limit")
    keys = {key: v["id"] for v in verts for key in v["aliases"]}
    mids = set(mutable)
    result = []
    for item in path:
        if isinstance(item, str):
            i = keys.get(item)
        elif isinstance(item, (list, tuple)) and len(item) == 2 \
                and isinstance(item[0], int) and not isinstance(item[0], bool) \
                and isinstance(item[1], str):
            i = keys.get(f"{item[0]}_{item[1]}")
        else:
            i = None
        if i is None:
            raise PortError("Unknown vertex in mutation path.")
        if i not in mids:
            raise PortError(f"{verts[i]['key']} is frozen; mutation was not applied.", "frozen_vertex")
        result.append(i)
    return result


def apply_path(diagram, n, path):
    verts, base, mutable, _, dots = seed(diagram, n)
    applied = validate_path(path, verts, mutable)
    arrows = base.copy()
    for v in applied:
        arrows = mutate(arrows, v)
        arrows = Counter({(s, t): c for (s, t), c in arrows.items()
                          if s in mutable or t in mutable})
    return verts, arrows, mutable, applied, (dots if not applied else set())


@lru_cache(maxsize=8)
def _neighbourhood(diagram: tuple, n: int, cap: int):
    """Bounded BFS, identifying unordered C-rows, with an induced-edge pass.

    Stops adding nodes at cap, and never runs an undisplayed counting search.
    Even at exactly cap, the closing pass detects whether the search completed.
    No arrow-pattern identity is used. Finite completed counts are compared
    with the independently stored finite-type count by evaluate().
    """
    verts, base, mutable, _, _ = seed(diagram, n)
    ext = initial_extended(base, mutable)
    index = {seed_key(ext): 0}
    nodes = [{"id": 0, "path": [], "depth": 0}]
    states = [ext]
    edges = set()
    head = 0
    while head < len(states) and len(states) < cap:
        parent = head
        matrix = states[parent]
        head += 1
        for k, v in enumerate(mutable):
            try:
                other_matrix = mutate_extended(matrix, k)
            except PortError as e:
                if e.code != "resource_limit":
                    raise
                continue
            key = seed_key(other_matrix)
            if key not in index:
                if len(states) >= cap:
                    break
                index[key] = len(states)
                states.append(other_matrix)
                nodes.append({"id": index[key], "path": nodes[parent]["path"]+[verts[v]["key"]],
                              "depth": nodes[parent]["depth"]+1})
            other = index[key]
            if other != parent:
                edges.add((min(parent, other), max(parent, other), v))
    source_edge_count = len(edges)
    boundary = limited = 0
    for parent, matrix in enumerate(states):
        for k, v in enumerate(mutable):
            try:
                other_matrix = mutate_extended(matrix, k)
            except PortError as e:
                if e.code != "resource_limit":
                    raise
                limited += 1
                continue
            other = index.get(seed_key(other_matrix))
            if other is None:
                boundary += 1
            elif other != parent:
                edges.add((min(parent, other), max(parent, other), v))
    return {"nodes": nodes, "edges": [list(x) for x in sorted(edges)],
            "mutable": list(mutable), "cap": cap,
            "truncated": bool(boundary or limited), "complete": not (boundary or limited),
            "boundary_transitions": boundary, "resource_limited": limited,
            "source_edge_count": source_edge_count,
            "closing_edges_added": len(edges)-source_edge_count,
            "state_identity": "unordered C-matrix rows (principal coefficients)",
            "counting_beyond_cap": False}, index


def neighbourhood(diagram, n, cap=96, path=None):
    checked_int(cap, "graph cap", 2, MAX_NODES)
    graph, index = _neighbourhood(diagram, n, cap)
    verts, base, mutable, _, _ = seed(diagram, n)
    matrix = initial_extended(base, mutable)
    for v in validate_path(path or [], verts, mutable):
        matrix = mutate_extended(matrix, mutable.index(v))
    return dict(graph, current=index.get(seed_key(matrix)))


def quiver_state(diagram, n, path=None):
    verts, arrows, mutable, applied, _ = apply_path(diagram, n, path or [])
    source = seed_from_diagram(diagram)
    return {"vertices": verts, "arrows": serialize_arrows(arrows),
            "mutable": list(mutable), "mutated_slots": sorted(set(applied)),
            "arrow_total": sum(arrows.values()),
            "raw_mutable_count": len(source["raw_mutable"]),
            "distinct_mutable_count": len(source["mutable"]),
            "omits_frozen_frozen": True}


@lru_cache(maxsize=16)
def family_data(family: str):
    if not isinstance(family, str) or not re.fullmatch(r"\d{1,2}_\d", family):
        raise PortError("Invalid family key.")
    n, k = map(int, family.split("_"))
    if (n, k) not in AVAIL:
        raise PortError("Unknown family.")
    path = _DATA_ROOT / "families" / f"{family}.json"
    if not path.is_file():
        raise PortError("The selected family data file is missing.", "missing_data")
    if path.stat().st_size > 25_000_000:
        raise PortError("Family file exceeds the safety limit.")
    family = json.loads(path.read_text(encoding="utf-8"))
    if family.get("schema") != SCHEMA or family.get("model") != MODEL:
        raise PortError("Family data was exported for a different model/schema.", "schema_mismatch")
    return family


def selected_tile(family: str, tile: int):
    f = family_data(family)
    checked_int(tile, "tile", 0, len(f["tiles"])-1)
    t = f["tiles"][tile]
    d = validate_diagram(t["diagram"], f["n"])
    if len(d) != f["k"]:
        raise PortError("Tile rank does not match family.", "schema_mismatch")
    return f, t, d


def evaluate(family: str, tile: int, path=None, cap=96):
    f, tile_data, diagram = selected_tile(family, tile)
    verts, arrows, mutable, applied, dots = apply_path(diagram, f["n"], path or [])
    graph = neighbourhood(diagram, f["n"], cap, path or [])
    matrix = initial_extended(seed(diagram, f["n"])[1], mutable)
    for v in applied:
        matrix = mutate_extended(matrix, mutable.index(v))
    expected = tile_data.get("cluster_count") if tile_data.get("type_finite") else None
    match = len(graph["nodes"]) == expected if graph["complete"] and expected is not None else None
    if match is False:
        raise PortError("Completed seed search disagrees with the finite-type count.", "count_mismatch")
    graph = dict(graph, expected_count=expected, count_matches=match)
    return {"schema": SCHEMA, "model": MODEL, "family": family, "tile": tile,
            "path": [verts[v]["key"] for v in applied],
            "quiver": quiver_state(diagram, f["n"], path),
            "c_matrix": [list(row[len(mutable):]) for row in matrix],
            "principal_matrix": [list(row[:len(mutable)]) for row in matrix],
            "exchange": graph,
            "source": {"seed": "arXiv:2310.17727v3, Definitions 10.4/10.8, Remark 10.5, Lemma 10.13"},
            "limits": {"max_path": MAX_STEPS, "max_nodes": MAX_NODES,
                       "max_multiplicity": MAX_MULTIPLICITY}}


def dispatch(request):
    if not isinstance(request, dict):
        raise PortError("Request must be an object.")
    action = request.get("action", "evaluate")
    if action == "selftest":
        return selftest()
    f = request.get("family", "8_3")
    t = request.get("tile", 0)
    cap = request.get("cap", 96)
    path = request.get("path", [])
    if action == "evaluate":
        return evaluate(f, t, path, cap)
    if action == "jump":
        family, _, diagram = selected_tile(f, t)
        g, _ = _neighbourhood(diagram, family["n"], checked_int(cap, "graph cap", 2, MAX_NODES))
        target = checked_int(request.get("node"), "graph node", 0, len(g["nodes"])-1)
        return evaluate(f, t, g["nodes"][target]["path"], cap)
    raise PortError("Unsupported action.")


def dispatch_json(raw: str) -> str:
    try:
        if len(raw) > 100000:
            raise PortError("Request is too large.")
        value = dispatch(json.loads(raw))
        return json.dumps({"ok": True, "result": value}, ensure_ascii=False, allow_nan=False)
    except (PortError, json.JSONDecodeError) as e:
        return json.dumps({"ok": False, "error": {"code": getattr(e, "code", "invalid_json"),
                                                   "message": str(e)}}, ensure_ascii=False)


def selftest():
    d = ((1, 2, 3, 4), (3, 4, 6, 7), (4, 5, 6, 7))
    fig18 = seed_from_diagram(((3, 4, 5, 6), (5, 6, 8, 9), (1, 2, 8, 9),
                              (10, 11, 12, 13), (9, 10, 12, 13), (8, 9, 13, 14)))
    stair3 = seed_from_diagram(((1, 2, 5, 6), (2, 3, 5, 6), (3, 4, 5, 6)))
    stair4 = seed_from_diagram(((1, 2, 6, 7), (2, 3, 6, 7), (3, 4, 6, 7), (4, 5, 6, 7)))
    verts, base, mutable, _, _ = seed(d, 8)
    ext = initial_extended(base, mutable)
    graph, _ = _neighbourhood(d, 8, 96)
    tests = {"figure18_counts": (len(fig18["raw_mutable"]), len(fig18["mutable"])) == (9, 8),
             "three_staircase_counts": (len(stair3["raw_mutable"]), len(stair3["mutable"])) == (8, 6),
             "four_staircase_counts": (len(stair4["raw_mutable"]), len(stair4["mutable"])) == (12, 9),
             "default_distinct_vertices": len(verts) == 14,
             "default_four_mutables": len(mutable) == 4,
             "default_quotient_label": any(v["label"] == "α2 = β3" for v in verts),
             "mutation_involution": all(mutate(mutate(base, v), v) == base for v in mutable),
             "C_matrix_involution": all(mutate_extended(mutate_extended(ext, k), k) == ext
                                        for k in range(len(mutable))),
             "default_A4_42_seeds": graph["complete"] and len(graph["nodes"]) == 42,
             "default_10_tiles": len(enumerate_diagrams(8, 3)) == 10,
             "default_15_flips": len(flip_edges(enumerate_diagrams(8, 3))) == 15}
    return {"ok": all(tests.values()), "tests": tests, "model": MODEL}
