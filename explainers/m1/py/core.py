"""m=1 cyclic-arrangement explorer; standard-library Python / Pyodide.

After Karp and Williams, arXiv:1608.08288.
Vertices come from exact enumeration: at k incident hyperplanes
I, 1 + sum x_j t^j = product_{i in I}(1-t/t_i). All remaining signed inequalities
are checked. This is an implementation change, not a new theorem claim.
"""
from __future__ import annotations
from fractions import Fraction as F
from functools import lru_cache
from itertools import combinations, product
from math import comb, sqrt, copysign, isfinite
import json
import sys
import plabic_geometry as pg

VERSION='m1-pyodide-v0.1.0'
CAPS={1:16,2:14,3:12,4:11,5:11}

def integer(x, lo, hi, label):
    if type(x) is not int or not lo <= x <= hi:
        raise ValueError(f'{label} must be an integer from {lo} to {hi}.')
    return x

def family_key(k,n):
    integer(k,1,5,'k');integer(n,k+2,CAPS[k],'n');return f'{n}_{k}'

def avail_kn():
    return [(k,n) for k in CAPS for n in range(k+2,CAPS[k]+1)]

def rational(x,label='value',positive=False):
    if isinstance(x,bool) or not isinstance(x,(str,int,float,F)):
        raise ValueError(f'{label} must be a rational number.')
    if len(str(x))>48:raise ValueError(f'{label} has too many digits.')
    try:q=F(str(x))
    except (ValueError,ZeroDivisionError,OverflowError):raise ValueError(f'{label} is not a finite rational number.') from None
    if q.numerator.bit_length()>160 or q.denominator.bit_length()>160 or abs(q)>10**6:
        raise ValueError(f'{label} is outside the supported numeric range.')
    if positive and not F(1,10**6)<=q<=10**6:
        raise ValueError(f'{label} must lie between 1/1000000 and 1000000, strictly positive.')
    return q

def parameters(n,t=None):
    if t is None:return tuple(F(i) for i in range(1,n+1))
    if not isinstance(t,(list,tuple)) or len(t)!=n:raise ValueError(f'Expected {n} ordered t values.')
    vals=tuple(rational(v,f't{i+1}',True) for i,v in enumerate(t))
    if any(b<=a for a,b in zip(vals,vals[1:])):raise ValueError('t values must be strictly increasing; collisions are not supported.')
    return vals

def signs_from_gaps(gaps,n):
    G=set(gaps);s=1;out=[]
    for i in range(1,n+1):
        out.append(s)
        if i in G:s=-s
    return tuple(out)

def validate_gaps(gaps,n):
    if not isinstance(gaps,(tuple,list)) or not 1<=len(gaps)<=5:raise ValueError('Supply 1–5 gaps.')
    vals=[integer(v,1,n-1,'gap') for v in gaps]
    if len(set(vals))!=len(vals) or vals!=sorted(vals):raise ValueError('Gaps must be strictly increasing.')
    family_key(len(vals),n)
    return tuple(vals)

def runs(gaps):
    out=[]
    for g in gaps:
        if out and g==out[-1][-1]+1:out[-1].append(g)
        else:out.append([g])
    return out

def cell(gaps,n):
    """Direct-sum construction; literal fixed points are loops."""
    G=validate_gaps(gaps,n);p=list(range(1,n+1));blocks=[];covered=set()
    for run in runs(G):
        a,L=run[0],len(run);W=list(range(a,a+L+1));covered.update(W)
        for j,w in enumerate(W):p[w-1]=W[(j-1)%(L+1)]
        blocks.append({'run':run,'window':W,'rank':L,'block':f'top cell of Gr({L},{L+1})'})
    affine=[v if v>=i else v+n for i,v in enumerate(p,1)]
    cur=affine[:];bridges=[]
    while True:
        live=[i for i,v in enumerate(cur) if (v-1)%n!=i]
        pair=next(((a,b) for a,b in zip(live,live[1:]) if cur[a]<cur[b]),None)
        if pair is None:break
        a,b=pair;bridges.append([a+1,b+1]);cur[a],cur[b]=cur[b],cur[a]
        if len(bridges)>n*n:raise RuntimeError('Bridge chain did not terminate.')
    if len(bridges)!=len(G):raise RuntimeError('Block dimension / bridge-count mismatch.')
    return {'gaps':list(G),'blocks':blocks,'permutation':p,'affine_window':affine,
            'loops':[i for i in range(1,n+1) if i not in covered],'coloops':[],
            'dimension':len(G),'bridges':bridges}

def root_polynomial(roots):
    coeff=[F(1)]
    for t in roots:
        new=[F(0)]*(len(coeff)+1)
        for j,c in enumerate(coeff):new[j]+=c;new[j+1]-=c/t
        coeff=new
    return coeff

def evaluate(coeff,t):
    y=F(0)
    for a in reversed(coeff):y=y*t+a
    return y

def rank(rows):
    A=[list(map(F,r)) for r in rows]
    if not A:return 0
    piv=0
    for j in range(len(A[0])):
        r=next((r for r in range(piv,len(A)) if A[r][j]),None)
        if r is None:continue
        A[piv],A[r]=A[r],A[piv];q=A[piv][j];A[piv]=[x/q for x in A[piv]]
        for r in range(piv+1,len(A)):
            q=A[r][j]
            if q:A[r]=[x-q*y for x,y in zip(A[r],A[piv])]
        piv+=1
        if piv==len(A):break
    return piv

def affine_rank(pts):
    if not pts:return -1
    return rank([[x-y for x,y in zip(p,pts[0])] for p in pts[1:]])

def determinant(A):
    """Exact Gaussian determinant with row-pivot sign tracking."""
    a=[list(map(F,r)) for r in A];n=len(a)
    if any(len(r)!=n for r in a):raise ValueError('Determinant requires a square matrix.')
    d=F(1)
    for j in range(n):
        r=next((r for r in range(j,n) if a[r][j]),None)
        if r is None:return F(0)
        if r!=j:a[j],a[r]=a[r],a[j];d=-d
        p=a[j][j];d*=p
        for r in range(j+1,n):
            q=a[r][j]/p
            for c in range(j+1,n):a[r][c]-=q*a[j][c]
    return d

def projection(points,scaled=False):
    """Deterministic top-two covariance eigenvectors (same PCA/SVD subspace).
    k<=5 Jacobi avoids a browser NumPy dependency.
    Axis signs are fixed by the largest loading; signs carry no mathematical meaning.
    """
    d=len(points[0]);m=len(points)
    center=[sum(p[j] for p in points)/m for j in range(d)]
    vari=[sum((p[j]-center[j])**2 for p in points)/m for j in range(d)]
    scale=[sqrt(v) if scaled and v>1e-30 else 1. for v in vari]
    X=[[(p[j]-center[j])/scale[j] for j in range(d)] for p in points]
    A=[[sum(x[i]*x[j] for x in X)/m for j in range(d)] for i in range(d)]
    V=[[float(i==j) for j in range(d)] for i in range(d)]
    if d>1:
        for _ in range(200):
            i,j=max(combinations(range(d),2),key=lambda ij:abs(A[ij[0]][ij[1]]))
            if abs(A[i][j])<=max(1e-300,max(abs(A[q][q]) for q in range(d)))*1e-15:break
            tau=(A[j][j]-A[i][i])/(2*A[i][j]);t=copysign(1.,tau)/(abs(tau)+sqrt(1+tau*tau))
            c=1/sqrt(1+t*t);s=t*c;v=A[i][j]
            A[i][i]-=t*v;A[j][j]+=t*v;A[i][j]=A[j][i]=0.
            for r in range(d):
                if r not in (i,j):
                    ai,aj=A[r][i],A[r][j];A[r][i]=A[i][r]=c*ai-s*aj;A[r][j]=A[j][r]=s*ai+c*aj
                vi,vj=V[r][i],V[r][j];V[r][i]=c*vi-s*vj;V[r][j]=s*vi+c*vj
    order=sorted(range(d),key=lambda i:-A[i][i]);axes=[]
    for q in order[:2]:
        v=[V[j][q] for j in range(d)];sgn=1 if v[max(range(d),key=lambda j:abs(v[j]))]>=0 else -1
        axes.append([sgn*x for x in v])
    if d==1:axes.append([0.])
    total=sum(max(0,A[j][j]) for j in range(d))
    return {'center':center,'scale':scale,'axes':axes,
            'variance_fraction':sum(max(0,A[q][q]) for q in order[:2])/total if total else 1.,
            'kind':'standardized PCA' if scaled else 'raw-coordinate SVD/PCA',
            'eigenvalues':[max(0,A[q][q]) for q in order]}

def projected(p,frame):
    q=[(x-c)/s for x,c,s in zip(p,frame['center'],frame['scale'])]
    return [sum(x*a for x,a in zip(q,axis)) for axis in frame['axes']]

@lru_cache(maxsize=6)
def _family(k,n,t):
    patterns=sorted((signs_from_gaps(G,n),G) for G in combinations(range(1,n),k))
    which={s:i for i,(s,G) in enumerate(patterns)};tile_vertices=[[] for _ in patterns];vertices=[]
    for I in combinations(range(1,n+1),k):
        coeff=root_polynomial([t[i-1] for i in I]);sig0=[]
        for ti in t:
            v=evaluate(coeff,ti);sig0.append((v>0)-(v<0))
        vid=len(vertices);vertices.append({'id':vid,'incident':list(I),'exact':[str(x) for x in coeff[1:]],'x':[float(x) for x in coeff[1:]]})
        for assign in product((-1,1),repeat=k):
            s=sig0[:]
            for i,sgn in zip(I,assign):s[i-1]=sgn
            tid=which.get(tuple(s))
            if tid is not None:tile_vertices[tid].append(vid)
    tiles=[]
    for idx,(sigma,G) in enumerate(patterns):
        ids=tile_vertices[idx];vs=[[F(q) for q in vertices[v]['exact']] for v in ids]
        if len(ids)<k+1 or affine_rank(vs)!=k:raise RuntimeError('Degenerate bounded chamber.')
        centroid=[sum(v[j] for v in vs)/len(vs) for j in range(k)]
        witness=root_polynomial([(t[g-1]+t[g])/2 for g in G])[1:]
        facets=[]
        for h in range(1,n+1):
            face_ids=[v for v in ids if h in vertices[v]['incident']]
            if face_ids and affine_rank([[F(q) for q in vertices[v]['exact']] for v in face_ids])==k-1:
                facets.append({'hyperplane':h,'vertices':face_ids})
        cd=cell(G,n)
        # Face labels are stored data; geometry itself never needs them.
        geometry=pg.build_geometry(cd['permutation'],cd['bridges'],cd['loops'],[],None,k=k)
        tiles.append({'id':idx,'sigma':list(sigma),'gaps':list(G),'var':k,'vertices':ids,
                      'centroid':[float(x) for x in centroid],'centroid_exact':[str(x) for x in centroid],
                      'witness_exact':[str(x) for x in witness], 'facets':facets,'cell':cd,'plabic':geometry})
    edges=[]
    for i,tile in enumerate(tiles):
        for facet in tile['facets']:
            h=facet['hyperplane'];s=tile['sigma'][:];s[h-1]*=-1;j=which.get(tuple(s))
            if j is not None and i<j:
                shared=sorted(set(tile['vertices']) & set(tiles[j]['vertices']))
                if affine_rank([[F(q) for q in vertices[v]['exact']] for v in shared])!=k-1:
                    raise RuntimeError('Adjacency fails exact common-facet rank check.')
                edges.append([i,j,h])
    pts=[vertices[v]['x'] for tile in tiles for v in tile['vertices']]
    centers=[t['centroid'] for t in tiles]
    proj={'raw':projection(pts),'scaled':projection(pts,True)}
    frame=projection(centers)
    out={'schema_version':1,'port':VERSION,'key':f'{n}_{k}','k':k,'n':n,'t':[str(x) for x in t],
         'tile_count':len(tiles),'vertices':vertices,'tiles':tiles,'edges':edges,'projection':proj,
         'adjacency_positions':[projected(p,frame) for p in centers],
         'geometry_method':'Exact rational polynomial vertices, signed half-spaces, exact common-facet rank.',
         'scope':'Cyclic moment-curve arrangement; all tiles are bounded top-dimensional chambers. SVD views are projections, not embeddings.'}
    if len(tiles)!=comb(n-1,k):raise RuntimeError('Tile-count mismatch.')
    return out

def build_family(k,n,t=None):
    family_key(k,n);return _family(k,n,parameters(n,t))

def realize(gaps,n,weights=None,t=None):
    """Vandermonde blocks -> C -> Y=CZ -> normalized cofactor point."""
    G=validate_gaps(gaps,n);k=len(G);tt=parameters(n,t);cd=cell(G,n)
    if weights is None:ww=[F(1)]*n
    else:
        if not isinstance(weights,(list,tuple)) or len(weights)!=n:raise ValueError(f'Expected {n} positive column weights.')
        ww=[rational(v,f'weight {i+1}',True) for i,v in enumerate(weights)]
    C=[[F(0)]*n for _ in range(k)];row=0
    for b in cd['blocks']:
        for r in range(b['rank']):
            for j,col in enumerate(b['window']):C[row+r][col-1]=ww[col-1]*(j+1)**r
        row+=b['rank']
    Z=[[ti**j for j in range(k+1)] for ti in tt]
    Y=[[sum(C[r][i]*Z[i][j] for i in range(n)) for j in range(k+1)] for r in range(k)]
    perp=[(-1)**j*determinant([[v for c,v in enumerate(r) if c!=j] for r in Y]) for j in range(k+1)]
    if not perp[0]:raise ValueError('Point leaves the affine chart: constant cofactor is zero.')
    coeff=[v/perp[0] for v in perp];x=coeff[1:];evals=[evaluate(coeff,ti) for ti in tt]
    signs=[(q>0)-(q<0) for q in evals];expected=list(signs_from_gaps(G,n))
    if signs!=expected:raise RuntimeError('Realized point is not in the selected chamber.')
    minors=[]
    for I in combinations(range(1,n+1),k):
        q=determinant([[r[i-1] for i in I] for r in C])
        if q<0:raise RuntimeError('Negative maximal minor in the block construction.')
        minors.append({'indices':list(I),'exact':str(q),'value':float(q)})
    serialize=lambda A:[[str(v) for v in r] for r in A]
    return {'gaps':list(G),'weights':[str(v) for v in ww],'t':[str(v) for v in tt],
            'C_exact':serialize(C),'C':[[float(x) for x in r] for r in C],
            'Z_exact':serialize(Z),'Y_exact':serialize(Y),'cofactor_exact':[str(q) for q in perp],
            'point_exact':[str(v) for v in x],'point':[float(v) for v in x],
            'evaluations_exact':[str(v) for v in evals],'sigma':signs,
            'inside_selected_tile':True,'minors':minors,'nonzero_minors':sum(v['value']>0 for v in minors),
            'scope':'Exact arithmetic for the chosen positive weights and moment-curve parameters; no optimization or arbitrary-Z assertion.'}

_FAMILIES={}
def register_family_json(raw):
    if len(raw)>20_000_000:raise ValueError('Family file too large.')
    f=json.loads(raw);family_key(f['k'],f['n'])
    if f.get('schema_version')!=1 or f['key']!=f"{f['n']}_{f['k']}":raise ValueError('Family schema mismatch.')
    if len(f['tiles'])!=comb(f['n']-1,f['k']):raise ValueError('Family tile count mismatch.')
    _FAMILIES[f['key']]=f;return f['key']

def inspect_tile(family,idx):
    if family not in _FAMILIES:raise ValueError('Load the family snapshot first.')
    f=_FAMILIES[family];integer(idx,0,len(f['tiles'])-1,'tile index');tile=f['tiles'][idx];cd=tile['cell']
    faces=tile['plabic'].get('face_labels') if tile['plabic'].get('face_labels_supplied') else None
    return pg.build_geometry(cd['permutation'],cd['bridges'],cd['loops'],cd['coloops'],faces,k=f['k'])

def selftest():
    cd=cell([1,3],5);r=realize([1,3],5);f=build_family(2,5)
    ok=(cd['permutation']==[2,1,4,3,5] and len(cd['bridges'])==2 and f['tile_count']==6
        and r['inside_selected_tile'] and r['nonzero_minors']==4)
    return {'ok':ok,'platform':sys.platform,'wasm':sys.platform=='emscripten','version':VERSION,
            'renderer':pg.VERSION,'python':sys.version.split()[0]}

def dispatch_json(raw):
    try:
        if not isinstance(raw,str) or len(raw)>100_000:raise ValueError('Invalid request size.')
        q=json.loads(raw)
        if not isinstance(q,dict):raise ValueError('Request must be an object.')
        a=q.get('action')
        if a=='selftest':r=selftest()
        elif a=='realize':r=realize(q['gaps'],q['n'],q.get('weights'),q.get('t'))
        elif a=='family':r=build_family(q['k'],q['n'],q.get('t'))
        elif a=='plabic':r=inspect_tile(q['family'],q['tile'])
        else:raise ValueError('Unknown action.')
        return json.dumps({'ok':True,'result':r},ensure_ascii=False,allow_nan=False,separators=(',',':'))
    except Exception as e:
        return json.dumps({'ok':False,'error':{'code':type(e).__name__,'message':str(e)}},ensure_ascii=False)
