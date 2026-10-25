"""Additional CLH lesson entry points, reusing the existing numerical source."""
import json
import math
import numpy as np
import labs

CELLS = {
    'triangle': (3,4,5),
    'disconnected': (3,7,8,6,10,11),
    'coloop': (3,5,6,8),
}

def recover(request):
    key = request.get('fixture','triangle')
    if key not in CELLS: raise ValueError('Unknown angle fixture')
    f = labs.F(CELLS[key]); edges = labs.edges_for(f)
    comps,free = labs.component_basis(f.n,edges)
    default = np.arange(f.n)*math.pi/(f.n+1)
    move = float(request.get('move',0)); shift = float(request.get('shift',0))
    if not math.isfinite(move) or abs(move)>.12: raise ValueError('Move outside supported slice')
    if not math.isfinite(shift) or abs(shift)>.06: raise ValueError('Shift outside supported chart')
    default[free[0]] += move*math.pi
    default[comps[0]] += shift*math.pi
    theta = labs.validate_theta(f,request.get('theta',default))
    gauged = theta.copy(); offsets = np.zeros(f.n)
    for c in comps:
        offsets[c]=theta[min(c)]; gauged[c]-=theta[min(c)]
    d,g,h,potential = labs.field(theta,edges)
    matrix = labs.og._gamma_matrix(f,theta)
    if np.linalg.matrix_rank(matrix)!=f.rank: raise ValueError('Displayed coefficient chart has lost rank')
    r,diag = labs.og._r_coordinate(f,matrix,edges)
    # The optional target alteration is an explicit defect control.
    target = labs.finite_array(request.get('target',r),f.n,'target')
    start = np.arange(f.n)*math.pi/(f.n+1)
    start[free] += .018*math.pi
    inverse = labs.inverse_gradient(f,target,start)
    # Restore separated component offsets to avoid a singular Fourier frame.
    restored = np.array(inverse['theta'])+offsets
    measured = labs.og._gamma_matrix(f,restored)
    labels,p = labs.plucker(matrix); _,q = labs.plucker(measured)
    twist = labs.og._left_twist(f,matrix)
    logs = [math.log(abs(labs.og._plucker(twist,tuple(row)))) for row in labs.og.grassmann_necklace(f)]
    indicators = np.array([[int(i in c) for i in range(f.n)] for c in comps]).T
    return {'fixture':key,'window':list(f.window),'theta':theta.tolist(),
        'gauge_theta':gauged.tolist(),'components':[[i+1 for i in c] for c in comps],
        'fixed_labels':[min(c)+1 for c in comps],'free_labels':[i+1 for i in free],
        'edges':[list(e) for e in edges],'deltas':d.tolist(),'potential':potential,
        'gradient':g.tolist(),'r':r.tolist(),'log_necklace':logs,'matrix':matrix.tolist(),
        'hessian':h.tolist(),'gauge_hessian':h[np.ix_(free,free)].tolist(),
        'kernel_basis':indicators.tolist(),'kernel_residual':float(np.max(abs(h@indicators))),
        'eigenvalues':np.linalg.eigvalsh(h).tolist(),
        'gauge_eigenvalues':np.linalg.eigvalsh(h[np.ix_(free,free)]).tolist(),
        'identity_residual':float(np.max(abs(g-r))),'twist_residual':diag['twist_equation_max_residual'],
        'inverse':inverse,'recovery_error':float(np.max(abs(np.array(inverse['theta'])-gauged))),
        'remeasure_error':float(np.max(abs(p-q))),'plucker':p.tolist(),'recovered_plucker':q.tolist(),
        'labels':labels}

def winding(request):
    key=request.get('fixture','triangle')
    if key not in ('triangle','dense5'): raise ValueError('Unknown winding fixture')
    n=len(labs.FIXTURES[key]);gaps=labs.finite_array(request.get('gaps',[.08]*(n-1)+[1-.08*(n-1)]),n,'gaps')
    # Unlike the legacy weight sliders these are actual gap fractions, not weights.
    if abs(float(sum(gaps))-1)>1e-12: raise ValueError('Winding constraint FAIL: gap fractions must sum to one')
    result=labs.cycles({'fixture':key,'gaps':gaps,'direction':request.get('direction',.7)})
    result['incidence']=labs.og._incidence(n,[tuple(e) for e in result['edges']]).astype(int).tolist()
    return result

def dispatch(request):
    if request.get('action')=='recover': return recover(request)
    if request.get('action')=='winding': return winding(request)
    return labs.dispatch(request)

def dispatch_json(raw):
    try:
        request=json.loads(raw)
        if not isinstance(request,dict): raise ValueError('Request must be an object')
        return json.dumps({'ok':True,'result':dispatch(request)},allow_nan=False)
    except Exception as exc:
        return json.dumps({'ok':False,'error':f'{type(exc).__name__}: {exc}'})
