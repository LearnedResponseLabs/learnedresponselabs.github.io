"""m=2 triangle-tile atlas engine; Python standard library only.

After Parisi, Sherman-Bennett and Williams, arXiv:2104.08254. The atlas selects
non-edge-sharing black triangles from polygon triangulations and tests +/- row
signs at unit weights. This module adds exact determinant-polynomial diagnostics
and reconstructs the fixed-cut bridge ladder from its bounded affine permutation.
It does not compute a geometric adjacency/tiling or a Postnikov-move path between
graphs.
"""
from __future__ import annotations

from collections import defaultdict
from fractions import Fraction
from functools import lru_cache
from itertools import combinations, product
import json
import math
import sys

VERSION = '0.2.0'
MAX_N = 8
MAX_K = 4
_FAMILIES = {}


from plabic_geometry import build_geometry, VERSION as PLABIC_VERSION
_PLABIC_FACES = {}

def integer(x, lo, hi, name):
    if type(x) is not int or not lo <= x <= hi:
        raise ValueError(f'{name} must be an integer in [{lo}, {hi}]')
    return x


def rational(x):
    if isinstance(x, bool) or not isinstance(x, (str, int, float)):
        raise ValueError('Weights must be positive decimal numbers or rational strings.')
    text = str(x)
    if len(text) > 40 or 'e' in text.lower():
        raise ValueError('Use a decimal or fraction, not exponential notation (at most 40 characters).')
    try:
        f = Fraction(text)
    except (ValueError, ZeroDivisionError) as exc:
        raise ValueError('Invalid positive rational weight.') from exc
    if not Fraction(1, 10000) <= f <= 10000 or f.denominator > 10**9:
        raise ValueError('Weights must be between 0.0001 and 10000, denominator at most 10^9.')
    return f


def validate_tile(blacks, signs, n):
    integer(n, 3, MAX_N, 'n')
    if not isinstance(blacks, (tuple, list)) or not 1 <= len(blacks) <= MAX_K:
        raise ValueError('A tile requires 1–4 black triangles.')
    bs = []
    for tri in blacks:
        if not isinstance(tri, (list, tuple)) or len(tri) != 3:
            raise ValueError('Each triangle must have three vertices.')
        t = tuple(integer(v, 1, n, 'vertex') for v in tri)
        if tuple(sorted(set(t))) != t:
            raise ValueError('Triangle vertices must be strictly increasing.')
        bs.append(t)
    bs = tuple(bs)
    if tuple(sorted(set(bs))) != bs:
        raise ValueError('Black triangles must be distinct and lexicographically ordered.')
    if any(len(set(a) & set(b)) > 1 for a, b in combinations(bs, 2)):
        raise ValueError('The triangle-tile atlas excludes edge-sharing black triangles.')
    if len(signs) != len(bs):
        raise ValueError('Sign rows must match triangle rows.')
    ss = []
    for s in signs:
        if len(s) != 2 or any(type(v) is not int or v not in (-1, 1) for v in s):
            raise ValueError('Each sign row requires two entries in {-1, +1}.')
        ss.append(tuple(s))
    return bs, tuple(ss)


@lru_cache(maxsize=1024)
def determinant_terms(blacks, signs, n):
    """Exact determinant expansions in 3k independent positive edge variables.

    A term chooses one column in each row. Repeated columns contribute zero;
    sorting the distinct chosen columns supplies the determinant sign. Each
    monomial is encoded by its edge-variable indices (3*row + corner).
    """
    terms = defaultdict(list)
    for choices in product(range(3), repeat=len(blacks)):
        columns = [blacks[r][c] for r, c in enumerate(choices)]
        if len(set(columns)) != len(columns):
            continue
        inversions = sum(columns[i] > columns[j] for i in range(len(columns))
                         for j in range(i + 1, len(columns)))
        coefficient = (-1) ** inversions
        for r, c in enumerate(choices):
            coefficient *= 1 if c == 0 else signs[r][c - 1]
        terms[tuple(sorted(columns))].append((coefficient, tuple(3*r+c for r,c in enumerate(choices))))
    return {J: tuple(terms[J]) for J in combinations(range(1, n+1), len(blacks))}


def polynomial_certificate(blacks, signs, n):
    polys = determinant_terms(blacks, signs, n)
    negative = sum(c < 0 for ts in polys.values() for c, _ in ts)
    positive = sum(c > 0 for ts in polys.values() for c, _ in ts)
    nonzero = sum(bool(ts) for ts in polys.values())
    return {'method': 'exact determinant expansion in independent positive edge variables',
            'positive_terms': positive, 'negative_terms': negative,
            'nonzero_polynomials': nonzero, 'zero_polynomials': len(polys)-nonzero,
            'all_positive_weights_certified': negative == 0 and nonzero > 0,
            'scope': 'this signed sparse matrix family; not an amplituhedron tiling certificate'}


def all_minors(blacks, signs, n, weights):
    flat = [v for row in weights for v in row]
    out = []
    for J, terms in determinant_terms(blacks, signs, n).items():
        value = sum((c * math.prod(flat[i] for i in monomial) for c, monomial in terms), Fraction(0))
        out.append({'columns': list(J), 'exact': str(value), 'value': float(value),
                    'term_count': len(terms), 'sign': (value > 0) - (value < 0)})
    return out


def necklace_from_bases(bases, n, k):
    if not bases:
        raise ValueError('Rank deficient matrix: no nonzero maximal minors.')
    return [sorted(min(bases, key=lambda B: tuple(sorted((b-start) % n for b in B))))
            for start in range(1, n+1)]


def decorated_from_necklace(necklace, n):
    bare = []
    for i in range(1, n+1):
        here, nxt = set(necklace[i-1]), set(necklace[i % n])
        if i not in here:
            if here != nxt:
                raise ValueError('Invalid Grassmann necklace transition at a loop.')
            bare.append(i)
        else:
            change = nxt - (here - {i})
            if len(change) != 1:
                raise ValueError('Invalid Grassmann necklace exchange.')
            bare.append(next(iter(change)))
    if sorted(bare) != list(range(1,n+1)):
        raise ValueError('Necklace did not produce a permutation.')
    cols = [i for i in range(1,n+1) if bare[i-1] == i and i in necklace[i-1]]
    loops = [i for i in range(1,n+1) if bare[i-1] == i and i not in cols]
    affine = [p+n if p<i or i in cols else p for i,p in enumerate(bare,1)]
    return bare, affine, loops, cols


def necklace_from_affine(f):
    """Independent periodic-window necklace reconstruction, one-based labels."""
    n = len(f)
    return [sorted({((f[(b-1) % n]-1) % n)+1 for b in range(a-n,a)
                    if f[(b-1) % n]+((b-1)//n)*n >= a}) for a in range(1,n+1)]


def fixed_cut_bridges(window):
    """First ascent between adjacent live positions; no last-to-first wrap.

    This is an explicit fixed-cut rule.
    """
    f = list(window); n = len(f)
    if len({v % n for v in f}) != n or any(not i <= v <= i+n for i,v in enumerate(f,1)):
        raise ValueError('Not a bounded affine permutation.')
    states = [f.copy()]; bridges=[]
    for _ in range(n*n+1):
        live = [i for i in range(n) if (f[i]-i-1) % n]
        if not live:
            return {'pairs': bridges, 'windows': states,
                    'base_coloops': [i for i,v in enumerate(f,1) if v == i+n]}
        pair = next(((a,b) for a,b in zip(live,live[1:]) if f[a]<f[b]), None)
        if pair is None:
            raise ValueError('Fixed-cut bridge rule stalled; no completion is asserted.')
        a,b=pair; f[a],f[b]=f[b],f[a]
        if any(not i <= v <= i+n for i,v in enumerate(f,1)):
            raise ValueError('Bridge step left the bounded affine domain.')
        bridges.append([a+1,b+1]); states.append(f.copy())
    raise ValueError('Bridge guard exceeded.')


def geometry_graph(nodes, edges, n):
    byid = {x['id']: x for x in nodes}
    rot = {x['id']: [] for x in nodes}
    for a,b in edges:
        rot[a].append(b); rot[b].append(a)
    for v,ns in rot.items():
        p=byid[v]
        ns.sort(key=lambda u: math.atan2(byid[u]['y']-p['y'],byid[u]['x']-p['x']))
    trips=[]
    for i in range(1,n+1):
        leg=f'L{i}'; prev=leg; v=rot[leg][0]; path=[leg,v]
        seen=set()
        while byid[v]['color'] != 'boundary':
            state=(prev,v)
            if state in seen:
                raise ValueError('Closed trip encountered before reaching a boundary leg.')
            seen.add(state)
            ns=rot[v]; idx=ns.index(prev)
            step=-1 if byid[v]['color']=='white' else 1
            prev,v=v,ns[(idx+step) % len(ns)]; path.append(v)
        trips.append({'start': i, 'end': int(v[1:]), 'path': path})
    return {'nodes': nodes, 'edges': edges, 'rotation': rot, 'trips': trips,
            'trip_convention': 'CCW neighbor order; white-right / black-left, matching archived m2_plabic_moves'}


def ngon_xy(n):
    return [[math.cos(math.pi/2-2*math.pi*i/n), math.sin(math.pi/2-2*math.pi*i/n)] for i in range(n)]


def psw_graph(blacks,n):
    """Standard degree-one boundary-leg form of Ĝ(T)."""
    xy=ngon_xy(n); used={v for t in blacks for v in t}; nodes=[]; edges=[]
    for i,(x,y) in enumerate(xy,1):
        nodes.append({'id':f'L{i}','x':x*1.18,'y':y*1.18,'color':'boundary','label':str(i)})
        v=f'B{i}'
        nodes.append({'id':v,'x':x if i in used else x*.9,'y':y if i in used else y*.9,
                      'color':'black','label':f'B{i}'})
        edges.append([f'L{i}',v])
    for r,tri in enumerate(blacks):
        wid=f'W{r+1}'
        nodes.append({'id':wid,'x':sum(xy[v-1][0] for v in tri)/3,
                      'y':sum(xy[v-1][1] for v in tri)/3,'color':'white','label':wid})
        edges.extend([[wid,f'B{v}'] for v in tri])
    return geometry_graph(nodes,edges,n)


def bridge_graph(chain,n):
    """Bridge ladder with fixed strands terminated after their last bridge.

    This shortens dangling tails without changing their cyclic adjacency or
    their trip permutation. It avoids drawing bridges across inactive strands.
    """
    pairs=chain['pairs']; cols=set(chain['base_coloops']); nodes=[]; edges=[]
    for i in range(1,n+1):
        leg=f'L{i}'; nodes.append({'id':leg,'x':i,'y':1.2,'color':'boundary','label':str(i)})
        tail=leg; touch=[r for r,(a,b) in enumerate(pairs) if i in (a,b)]
        for r in touch:
            a,b=pairs[r]; v=f'V{i}_{r}'
            nodes.append({'id':v,'x':i,'y':-r,'color':'white' if i==a else 'black','label':''})
            edges.append([tail,v]); tail=v
        end=f'Z{i}'; y=-touch[-1]-.65 if touch else .4
        nodes.append({'id':end,'x':i,'y':y,'color':'white' if i in cols else 'black','label':''})
        edges.append([tail,end])
    for r,(a,b) in enumerate(pairs):
        edges.append([f'V{a}_{r}',f'V{b}_{r}'])
    g=geometry_graph(nodes,edges,n)
    g['embedding']='new vector bridge-ladder renderer; not the archived Matplotlib image'
    return g


@lru_cache(maxsize=128)
def cell_structure(blacks, signs, n):
    cert=polynomial_certificate(blacks,signs,n)
    if not cert['all_positive_weights_certified']:
        raise ValueError('The supplied sign pattern fails the exact positive-weight certificate.')
    bases=[list(J) for J,ts in determinant_terms(blacks,signs,n).items() if ts]
    neck=necklace_from_bases(bases,n,len(blacks))
    bare,affine,loops,coloops=decorated_from_necklace(neck,n)
    chain=fixed_cut_bridges(affine)
    pg=psw_graph(blacks,n); bg=bridge_graph(chain,n)
    checks={'necklace_round_trip':neck==necklace_from_affine(affine),
            'psw_trip_agreement': [p['end'] for p in pg['trips']]==bare,
            'ladder_trip_agreement':[p['end'] for p in bg['trips']]==bare,
            'bridge_count_2k':len(chain['pairs'])==2*len(blacks)}
    if not all(checks.values()):
        raise ValueError(f'Structural consistency check failed: {checks}')
    return {'bases':bases,'necklace':neck,'permutation':bare,'affine_window':affine,
            'loops':loops,'coloops':coloops,'dimension':2*len(blacks),
            'bridge_chain':chain,'psw_graph':pg,'bridge_graph':bg,'checks':checks,
            'certificate':cert}


def inspect_tile(blacks, signs, n, weights=None, face_labels=None):
    bs,ss=validate_tile(blacks,signs,n); k=len(bs)
    structure=cell_structure(bs,ss,n)
    if weights is None:
        weights=[['1','1','1'] for _ in range(k)]
    if not isinstance(weights,(list,tuple)) or len(weights)!=k or any(not isinstance(r,(list,tuple)) or len(r)!=3 for r in weights):
        raise ValueError('Provide exactly three weights per white vertex.')
    w=[[rational(x) for x in row] for row in weights]
    matrix=[[Fraction(0) for _ in range(n)] for _ in range(k)]
    for r,((a,b,c),(sb,sc)) in enumerate(zip(bs,ss)):
        matrix[r][a-1]=w[r][0]; matrix[r][b-1]=sb*w[r][1]; matrix[r][c-1]=sc*w[r][2]
    geometry=build_geometry(structure['permutation'], structure['bridge_chain']['pairs'],
                            structure['loops'], structure['coloops'], face_labels, k=k)
    minors=all_minors(bs,ss,n,w)
    total=sum((Fraction(m['exact']) for m in minors),Fraction(0))
    for m in minors:
        m['normalized']=float(Fraction(m['exact'])/total)
    return {'n':n,'k':k,'blacks':[list(t) for t in bs],'signs':[list(s) for s in ss],
            'weights':[[str(v) for v in row] for row in w],
            'matrix':[[float(v) for v in row] for row in matrix],
            'matrix_exact':[[str(v) for v in row] for row in matrix],
            'minors':minors,'positive_minors':sum(m['sign']>0 for m in minors),
            'zero_minors':sum(m['sign']==0 for m in minors),
            'negative_minors':sum(m['sign']<0 for m in minors),
            'row_gauge_ratios':[[str(row[1]/row[0]),str(row[2]/row[0])] for row in w],
            **structure, 'plabic_geometry': geometry}


def register_family_json(text):
    if len(text)>5_000_000: raise ValueError('Family data too large.')
    obj=json.loads(text); n=integer(obj['n'],3,MAX_N,'n'); k=integer(obj['k'],1,MAX_K,'k')
    if not isinstance(obj['tiles'],list) or not 1<=len(obj['tiles'])<=1000: raise ValueError('Invalid atlas size.')
    for t in obj['tiles']:
        bs,ss=validate_tile(t['blacks'],t['signs'],n)
        if len(bs)!=k: raise ValueError('Wrong rank in tile record.')
    _FAMILIES[f'{n}_{k}']={'n':n,'k':k,'tiles':[{'blacks':t['blacks'],'signs':t['signs']} for t in obj['tiles']]}
    return len(obj['tiles'])



def register_plabic_json(text):
    """Validate snapshots; retain only face labels for live recomputation."""
    if not isinstance(text,str) or len(text)>8_000_000:
        raise ValueError('Plabic data too large.')
    obj=json.loads(text)
    key=obj['family']
    if key not in _FAMILIES:
        raise ValueError('Load the atlas family before its plabic metadata.')
    f=_FAMILIES[key]
    if obj.get('n')!=f['n'] or obj.get('k')!=f['k'] or len(obj.get('tiles',[]))!=len(f['tiles']):
        raise ValueError('Plabic snapshot dimensions mismatch.')
    faces=[]
    for t,g in zip(f['tiles'],obj['tiles']):
        bs,ss=validate_tile(t['blacks'],t['signs'],f['n'])
        u=cell_structure(bs,ss,f['n'])
        fs=g['face_labels']
        bases={tuple(b) for b in u['bases']}
        if any(tuple(face) not in bases for face in fs):
            raise ValueError('Source face label is outside the tile support.')
        expected=build_geometry(u['permutation'],u['bridge_chain']['pairs'],u['loops'],u['coloops'],fs,k=f['k'])
        if expected!=g:
            raise ValueError('Source snapshot disagrees with Python geometry.')
        faces.append(fs)
    _PLABIC_FACES[key]=faces
    return len(faces)


def selftest():
    d=inspect_tile(((1,2,6),(3,5,6)),((1,-1),(1,1)),6)
    ok=(d['permutation']==[2,6,5,4,1,3] and d['bridge_chain']['pairs']==[[1,2],[3,5],[1,3],[3,6]]
        and d['matrix_exact']==[['1','1','0','0','0','-1'],['0','0','1','0','1','1']])
    pg=d['plabic_geometry']
    ok=ok and pg['renderer']==PLABIC_VERSION and [s['end'] for s in pg['strands']]==d['permutation']
    if not ok: raise RuntimeError('Screenshot fixture/renderer self-test failed.')
    return {'ok':ok,'version':VERSION,'python':sys.version.split()[0],
            'platform':sys.platform,'wasm':sys.platform=='emscripten', 'plabic_renderer':PLABIC_VERSION}


def dispatch_json(text):
    """JSON-in/JSON-out boundary, no generated Python or eval of user input."""
    try:
        if not isinstance(text,str) or len(text)>10_000: raise ValueError('Request exceeds size limit.')
        request=json.loads(text)
        if not isinstance(request,dict): raise ValueError('Request must be an object.')
        action=request.get('action')
        if action=='selftest': result=selftest()
        elif action=='inspect':
            family=request.get('family')
            if family not in _FAMILIES: raise ValueError('Family not loaded.')
            f=_FAMILIES[family]
            idx=integer(request.get('tile'),0,len(f['tiles'])-1,'tile index')
            t=f['tiles'][idx]
            faces=_PLABIC_FACES.get(family)
            result=inspect_tile(t['blacks'],t['signs'],f['n'],request.get('weights'),
                                faces[idx] if faces is not None else None)
            result['tile_index']=idx
        else: raise ValueError('Unknown action.')
        return json.dumps({'ok':True,'result':result},separators=(',',':'),allow_nan=False)
    except (ValueError,TypeError,KeyError,IndexError,ZeroDivisionError) as exc:
        return json.dumps({'ok':False,'error':{'code':'invalid_request','message':str(exc)}})


if __name__=='__main__':
    print(json.dumps(selftest(),indent=2))
