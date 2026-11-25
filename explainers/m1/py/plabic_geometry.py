"""Pure-Python plabic ladder geometry.

No matplotlib and no dynamic imports.
Coordinates are Cartesian (upward y). The browser reflects y to display SVG.
"""
from __future__ import annotations
from dataclasses import dataclass
from typing import ClassVar
import math

VERSION = "plabic-geometry-v1"

@dataclass
class BezierPath:
    vertices: list
    codes: list
    MOVETO: ClassVar[int] = 1
    LINETO: ClassVar[int] = 2
    CURVE4: ClassVar[int] = 4

LEG_SPACING = 1.0

BRIDGE_SPACING = 1.0

VERTEX_SIZE = 0.16

LINE_WIDTH = 1.8

RUNG_COLOR = '#5a1a1a'

BLACK_VERTEX_COLOR = '#9999c0'

STRAND_OFFSET = 0.18

STRAND_LINE_WIDTH = 2.2

STRAND_ALPHA = 0.85

TRIP_COLORS = ['#d62728', '#9467bd', '#1f77b4', '#bcbd22', '#2ca02c', '#ff7f0e', '#e377c2', '#17becf', '#8c564b', '#7f7f7f']

def _compute_heights(bridges, have_lollipops):
    if not bridges:
        return []
    n_bridges = len(bridges)
    heights = [0.0] * n_bridges
    heights[0] = -BRIDGE_SPACING if have_lollipops else 0.0
    for k in range(1, n_bridges):
        a_k, b_k = bridges[k]
        lo_k, hi_k = sorted([a_k, b_k])
        interval_k = set(range(lo_k, hi_k + 1))
        overlap = []
        for j in range(k):
            a_j, b_j = bridges[j]
            lo_j, hi_j = sorted([a_j, b_j])
            if interval_k & set(range(lo_j, hi_j + 1)):
                overlap.append(heights[j])
        heights[k] = min(overlap) - BRIDGE_SPACING if overlap else 0.0
    return heights

def _compute_leg_depths(bridges, heights, n, loop_legs, coloop_legs):
    depths = {}
    for i in range(1, n + 1):
        touching = [heights[k] for k, (a, b) in enumerate(bridges) if i in (a, b)]
        if touching:
            depths[i] = min(touching)
        else:
            depths[i] = -BRIDGE_SPACING if i in loop_legs or i in coloop_legs else 0.0
    return depths

def _strand_segments(start_leg, bridges, heights):
    rung_order = sorted(range(len(bridges)), key=lambda k: -heights[k])
    cur_leg = start_leg
    crossings = []
    for k in rung_order:
        a, b = bridges[k]
        if cur_leg in (a, b):
            other = b if cur_leg == a else a
            crossings.append((k, cur_leg, other, heights[k]))
            cur_leg = other
    return (crossings, cur_leg)

def _strand_smooth_path(start_leg, bridges, heights, n, top_y, bottom_y):
    """Bridge routing, including its side flips. Returns Cartesian Bezier control points; no plotting dependency."""
    leg_x = {i: (i - 1) * LEG_SPACING for i in range(1, n + 1)}
    crossings, end_leg = _strand_segments(start_leg, bridges, heights)
    delta = STRAND_OFFSET

    def vertex_color(leg, rung_idx):
        a, b = bridges[rung_idx]
        return 'white' if leg == a else 'black'

    def required_side(color):
        """Which side of leg the strand must be on when heading S into this vertex.
        White on right (W) → strand on E (+1).
        Black on left (E) → strand on W (-1).
        """
        return +1 if color == 'white' else -1
    if not crossings:
        side = +1
        verts = [(leg_x[start_leg] + side * delta, top_y + 0.35), (leg_x[end_leg] + side * delta, bottom_y - 0.35)]
        codes = [BezierPath.MOVETO, BezierPath.LINETO]
        return (BezierPath(verts, codes), end_leg)
    first_k, _, _, _ = crossings[0]
    entry_side = required_side(vertex_color(start_leg, first_k))
    verts = [(leg_x[start_leg] + entry_side * delta, top_y + 0.35)]
    codes = [BezierPath.MOVETO]
    cur_side = entry_side
    for cidx, (k, leg_in, leg_out, h) in enumerate(crossings):
        in_color = vertex_color(leg_in, k)
        out_color = vertex_color(leg_out, k)
        in_x = leg_x[leg_in] + cur_side * delta
        exit_side = required_side(out_color)
        out_x = leg_x[leg_out] + exit_side * delta
        approach_y = h + VERTEX_SIZE * 1.5
        verts.append((in_x, approach_y))
        codes.append(BezierPath.LINETO)
        depart_y = h - VERTEX_SIZE * 1.5
        rung_mid_x = (leg_x[leg_in] + leg_x[leg_out]) / 2
        half_rung = (out_x - in_x) / 2
        ctrl1a = (in_x, h + VERTEX_SIZE * 0.3)
        ctrl2a = (rung_mid_x - half_rung * 0.5, h)
        verts.append(ctrl1a)
        verts.append(ctrl2a)
        verts.append((rung_mid_x, h))
        codes.extend([BezierPath.CURVE4, BezierPath.CURVE4, BezierPath.CURVE4])
        ctrl1b = (rung_mid_x + half_rung * 0.5, h)
        ctrl2b = (out_x, h - VERTEX_SIZE * 0.3)
        verts.append(ctrl1b)
        verts.append(ctrl2b)
        verts.append((out_x, depart_y))
        codes.extend([BezierPath.CURVE4, BezierPath.CURVE4, BezierPath.CURVE4])
        cur_side = exit_side
        if cidx + 1 < len(crossings):
            next_k, next_leg_in, _, next_h = crossings[cidx + 1]
            if next_leg_in == leg_out:
                next_required = required_side(vertex_color(next_leg_in, next_k))
                if next_required != cur_side:
                    next_approach_y = next_h + VERTEX_SIZE * 1.5
                    cross_y = (depart_y + next_approach_y) / 2
                    old_x = leg_x[leg_out] + cur_side * delta
                    new_x = leg_x[leg_out] + next_required * delta
                    leg_mid_x = leg_x[leg_out]
                    half_drop1 = (cross_y - depart_y) / 2
                    ctrl1c = (old_x, cross_y + abs(half_drop1) * 0.5)
                    ctrl2c = (old_x, cross_y)
                    verts.append(ctrl1c)
                    verts.append(ctrl2c)
                    verts.append((leg_mid_x, cross_y))
                    codes.extend([BezierPath.CURVE4, BezierPath.CURVE4, BezierPath.CURVE4])
                    ctrl1d = (new_x, cross_y)
                    ctrl2d = (new_x, cross_y - abs(half_drop1) * 0.5)
                    verts.append(ctrl1d)
                    verts.append(ctrl2d)
                    verts.append((new_x, next_approach_y))
                    codes.extend([BezierPath.CURVE4, BezierPath.CURVE4, BezierPath.CURVE4])
                    cur_side = next_required
    verts.append((leg_x[end_leg] + cur_side * delta, bottom_y - 0.35))
    codes.append(BezierPath.LINETO)
    return (BezierPath(verts, codes), end_leg)


def path_commands(path: BezierPath) -> list:
    """Losslessly regroup matplotlib-style codes as SVG M/L/C commands."""
    out = []
    i = 0
    while i < len(path.codes):
        code = path.codes[i]
        if code in (BezierPath.MOVETO, BezierPath.LINETO):
            out.append(["M" if code == BezierPath.MOVETO else "L", *path.vertices[i]])
            i += 1
        elif code == BezierPath.CURVE4:
            if path.codes[i:i+3] != [BezierPath.CURVE4] * 3:
                raise ValueError("Incomplete cubic Bezier segment.")
            out.append(["C", *path.vertices[i], *path.vertices[i+1], *path.vertices[i+2]])
            i += 3
        else:
            raise ValueError("Unknown path command.")
    return out


def _int(x, lo, hi, name):
    if type(x) is not int or not lo <= x <= hi:
        raise ValueError(f"{name} must be an integer in [{lo}, {hi}].")
    return x


def build_geometry(perm, bridges, loop_legs=(), coloop_legs=(), face_labels=None, *, k=None):
    """Precomputed symbolic data -> vector scene (JSON-safe).

    perm is the bare boundary permutation, bridges are in peeling order.
    Fixed-point decorations must be explicit: no loop/coloop inference or
    redefinition of colors. Face labels are optional data;
    they are not reconstructed in this module.
    """
    if not isinstance(perm, (list, tuple)) or not 1 <= len(perm) <= 64:
        raise ValueError("Supply a permutation on 1..n, with 1 <= n <= 64.")
    n = len(perm)
    p = [_int(v, 1, n, "permutation value") for v in perm]
    if sorted(p) != list(range(1, n+1)):
        raise ValueError("Not a permutation of 1..n.")
    if not isinstance(bridges, (list, tuple)) or len(bridges) > 512:
        raise ValueError("Supply at most 512 bridges in peeling order.")
    bs = []
    for pair in bridges:
        if not isinstance(pair, (list, tuple)) or len(pair) != 2:
            raise ValueError("A bridge needs exactly two leg indices.")
        a, b = [_int(x, 1, n, "bridge endpoint") for x in pair]
        if a == b:
            raise ValueError("A bridge must join distinct legs.")
        bs.append((a, b))
    loops = sorted({_int(x, 1, n, "loop") for x in loop_legs})
    cols = sorted({_int(x, 1, n, "coloop") for x in coloop_legs})
    fixed = {i for i, v in enumerate(p, 1) if i == v}
    if set(loops) & set(cols) or set(loops) | set(cols) != fixed:
        raise ValueError("Explicit, disjoint loop/coloop sets must cover exactly the fixed points.")
    if k is not None:
        _int(k, 0, n, "rank")
    fs = []
    if face_labels is not None:
        if not isinstance(face_labels, (tuple, list)) or len(face_labels) != (len(bs)+1 if bs else 0):
            raise ValueError("Expected one face label per bridge plus an anchor (or none for zero bridges).")
        for f in face_labels:
            if not isinstance(f, (list, tuple, set, frozenset)):
                raise ValueError("A face label must be a collection of indices.")
            values = [_int(x, 1, n, "face index") for x in f]
            if len(set(values)) != len(values):
                raise ValueError("Duplicate index in a face label.")
            if k is not None and len(values) != k:
                raise ValueError("Face label has the wrong cardinality for the stated rank.")
            fs.append(sorted(values))
    heights = _compute_heights(bs, bool(loops or cols))
    depths = _compute_leg_depths(bs, heights, n, loops, cols)
    top_y = BRIDGE_SPACING * 0.7
    bottom_y = (min(heights) if heights else 0) - BRIDGE_SPACING * 0.7
    lx = {i: (i-1) * LEG_SPACING for i in range(1, n+1)}
    strands = []
    for start in range(1, n+1):
        path, end = _strand_smooth_path(start, bs, heights, n, top_y, bottom_y)
        if end != p[start-1]:
            raise ValueError("Peeling-order strand endpoint disagrees with the supplied permutation.")
        if not all(math.isfinite(v) for point in path.vertices for v in point):
            raise ValueError("Nonfinite path coordinate.")
        strands.append({"start": start, "end": end,
                        "color": TRIP_COLORS[(start-1) % len(TRIP_COLORS)],
                        "commands": path_commands(path),
                        "end_point": list(path.vertices[-1])})
    vertices = []
    rungs = []
    for idx, (a, b) in enumerate(bs):
        h = heights[idx]
        rungs.append({"index": idx, "pair": [a, b], "y": h,
                      "x1": lx[a], "x2": lx[b], "alpha_index": len(bs)-idx})
        vertices.extend([{"x": lx[a], "y": h, "color": "white", "leg": a, "rung": idx},
                         {"x": lx[b], "y": h, "color": "black", "leg": b, "rung": idx}])
    for i in loops:
        vertices.append({"x": lx[i], "y": depths[i], "color": "white", "leg": i, "kind": "loop"})
    for i in cols:
        vertices.append({"x": lx[i], "y": depths[i], "color": "black", "leg": i, "kind": "coloop"})
    return {"schema_version": 1, "renderer": VERSION, "n": n, "k": k,
            "permutation": p, "bridges": [list(b) for b in bs], "loops": loops, "coloops": cols,
            "face_labels": fs, "face_labels_supplied": face_labels is not None,
            "heights": heights, "top_y": top_y, "bottom_y": bottom_y,
            "legs": [{"leg": i, "x": lx[i], "top": top_y, "depth": depths[i]} for i in range(1,n+1)],
            "rungs": rungs, "vertices": vertices, "strands": strands,
            "style": {"leg_spacing": LEG_SPACING, "bridge_spacing": BRIDGE_SPACING,
                      "vertex_radius": VERTEX_SIZE, "line_width": LINE_WIDTH,
                      "rung_color": RUNG_COLOR, "black_vertex_color": BLACK_VERTEX_COLOR,
                      "strand_width": STRAND_LINE_WIDTH, "strand_opacity": STRAND_ALPHA},
            "scope": "Not a bridge-weight map, and not a proof of the face-label algorithm."}
