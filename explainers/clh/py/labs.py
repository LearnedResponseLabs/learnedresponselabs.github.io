"""Visual experiments for the Conjecture 4.3 paper (CLH) and its companion manuscript (in preparation).

Numerical evidence is not a proof. og_bridge.py is an unmodified ogcanon source
file, used for the actual curve measurement, left twist and dual measurement.
All angles here are radians. Unlike ogcanon's numerical modulo helper, the
adapter validates the fixed affine chamber BEFORE evaluating its functions.
"""
from __future__ import annotations
import itertools
import json
import math
import sys
from functools import lru_cache
import numpy as np
import og_bridge as og

PI=math.pi
VERSION='0.1.0'
PAIRS=((1,5),(2,6),(3,8),(4,7))
F=og.BoundedAffinePermutation
FIXTURES={
 'triangle': (3,4,5),
 'polygon4': (4,5,6,7),
 'dense5': (4,5,6,7,8),
 'nontop8': (6,8,7,9,10,12,11,13),
}
# zeta(2m), m=1..24. Constants only; no special-function runtime dependency.
ZETA=(1.6449340668482264,1.0823232337111382,1.0173430619844492,
 1.0040773561979444,1.000994575127818,1.000246086553308,
 1.0000612481350587,1.0000152822594086,1.0000038172932649,
 1.0000009539620338,1.0000002384505027,1.000000059608189,
 1.0000000149015549,1.000000003725334,1.0000000009313275,
 1.0000000002328311,1.0000000000582077,1.000000000014552,
 1.000000000003638,1.0000000000009095,1.0000000000002274,
 1.0000000000000568,1.0000000000000142,1.0000000000000036)

def finite_array(value,length,name):
    a=np.asarray(value,dtype=float)
    if a.shape!=(length,) or not np.all(np.isfinite(a)):
        raise ValueError(f'{name} must contain {length} finite numbers')
    return a

def lobachevsky(x):
    """Lambda on [0,pi]. Convergent integrated log(sin(x)/x) series.

    Reflection reduces x to [0,pi/2], so series ratio <=1/4; 24 terms.
    Removable endpoint is evaluated by its exact continuous limit.
    """
    a=np.asarray(x,dtype=float)
    if np.any(a<0) or np.any(a>PI) or not np.all(np.isfinite(a)):
        raise ValueError('Lobachevsky input outside [0, pi]')
    t=np.minimum(a,PI-a); safe=np.maximum(t,1e-300)
    ans=np.where(t==0,0,t*(1-np.log(2*safe)))
    ratio=(t/PI)**2; power=ratio.copy()
    for m,z in enumerate(ZETA,1):
        ans=ans+t*z*power/(m*(2*m+1)); power*=ratio
    ans=np.where(a>PI/2,-ans,ans)
    return float(ans) if ans.ndim==0 else ans

def edges_for(f): return og._directed_crossing_edges(f)
def lifted_angles(theta,edges):
    return np.array([theta[q-1]-theta[p-1]+(PI if p>q else 0) for p,q in edges])
def validate_theta(f,theta,eps=1e-11):
    a=finite_array(theta,f.n,'theta');d=lifted_angles(a,edges_for(f))
    if len(d) and (min(d)<=eps or max(d)>=PI-eps):
        raise ValueError('Outside the fixed affine chamber: every lifted crossing angle must lie strictly between 0 and pi.')
    return a

def field(theta,edges):
    d=lifted_angles(theta,edges)
    if len(d) and (np.min(d)<=0 or np.max(d)>=PI): raise ValueError('Invalid lifted crossing angles')
    b=og._incidence(len(theta),edges)
    g=b@np.log(np.sin(d))
    h=(b*(1/np.tan(d)))@b.T
    # L=-Lambda-u log2; every balanced winding partition makes sum(delta) constant.
    volume=float(np.sum(lobachevsky(d)))
    return d,g,h,-volume-float(np.sum(d))*math.log(2)

def component_basis(n,edges):
    comps=og._graph_components(n,edges)
    representatives={min(c) for c in comps}
    free=[i for i in range(n) if i not in representatives]
    return comps,free

def inverse_gradient(f,target,start,max_steps=80):
    """Chamber-preserving damped Newton, with every accepted state recorded.

    No clamping and no modulo folding. It is a local numerical method; no
    global convergence claim is made. The full residual is reported.
    """
    edges=edges_for(f);comps,free=component_basis(f.n,edges)
    x=validate_theta(f,start).copy();target=finite_array(target,f.n,'target')
    for c in comps: x[c]-=x[min(c)]
    if any(abs(float(np.sum(target[c])))>1e-8 for c in comps):
        raise ValueError('Target is outside im(B): each component sum must vanish')
    history=[];reason='iteration_limit';accepted_scale=0.
    for it in range(max_steps+1):
        d,g,h,psi=field(x,edges);r=g-target;err=float(np.linalg.norm(r))
        history.append({'theta':x.tolist(),'gradient':g.tolist(),'residual':err,
            'minimum_gap':float(np.min(d)) if len(d) else 0,
            'step_scale':accepted_scale,'objective':float(psi-target@x)})
        if err<2e-10: reason='converged';break
        if it==max_steps: break
        step=np.linalg.solve(h[np.ix_(free,free)],-r[free])
        accepted=False
        for j in range(35):
            scale=2.**(-j);cand=x.copy();cand[free]+=scale*step
            cd=lifted_angles(cand,edges)
            if min(cd)<=1e-10 or max(cd)>=PI-1e-10: continue
            ng=field(cand,edges)[1]
            if np.linalg.norm(ng-target)<(1-1e-4*scale)*err:
                x=cand;accepted_scale=scale;accepted=True;break
        if not accepted: reason='line_search_failed';break
    return {'converged':reason=='converged','reason':reason,'history':history,
            'theta':x.tolist(),'iterations':len(history)-1,'residual':history[-1]['residual']}

@lru_cache(maxsize=20)
def cycle_partition(window):
    """Exact finite edge cover for these small fixtures, NOT the uniform proof.

    A winding-one simple cycle is the increasing cyclic order of its support.
    Enumerate supports and find an edge-disjoint exact cover by backtracking.
    """
    n=len(window);edges=edges_for(F(window));es=set(edges);options=[]
    for r in range(3,n+1):
        for s in itertools.combinations(range(1,n+1),r):
            ce=tuple(zip(s,s[1:]+s[:1]))
            if set(ce)<=es:options.append((s,frozenset(ce)))
    def solve(left):
        if not left:return []
        e=min(left,key=lambda e:sum(e in cs and cs<=left for _,cs in options))
        for nodes,cs in options:
            if e in cs and cs<=left:
                rest=solve(left-cs)
                if rest is not None:return [nodes]+rest
        return None
    result=solve(frozenset(es))
    if result is None: raise ValueError('No winding-one exact cover in this finite fixture')
    return tuple(result)

def plucker(matrix):
    labels,p=og._plucker_vector(np.asarray(matrix))
    # Projective orientation and L1 normalization; no sign clipping.
    pivot=int(np.argmax(np.abs(p)))
    if p[pivot]<0:p=-p
    total=float(np.sum(abs(p)))
    if total<=1e-300:raise ValueError('Zero Plucker vector')
    return [list(x) for x in labels],p/total

def landscape(request):
    uv=finite_array(request.get('uv',[.18,.76]),2,'uv')
    theta=validate_theta(F(FIXTURES['triangle']),[0,PI*uv[0],PI*uv[1]])
    f=F(FIXTURES['triangle']);edges=edges_for(f)
    d,g,h,psi=field(theta,edges)
    c=og._gamma_matrix(f,theta);twist=og._left_twist(f,c);r,diag=og._r_coordinate(f,c,edges)
    start=np.array(request.get('start',[0,.34,.69]))*PI
    inv=inverse_gradient(f,r,start)
    labels,p=plucker(c)
    return {'uv':uv.tolist(),'theta':theta.tolist(),'deltas':d.tolist(),
        'gradient':g.tolist(),'hessian':h.tolist(),'slice_hessian':h[1:,1:].tolist(),
        'slice_eigenvalues':np.linalg.eigvalsh(h[1:,1:]).tolist(),'potential':psi,
        'volume':float(np.sum(lobachevsky(d))), 'matrix':c.tolist(),'twist':twist.tolist(),
        'r':r.tolist(),'identity_residual':float(np.max(abs(r-g))),
        'twist_residual':diag['twist_equation_max_residual'],'minors':p.tolist(),'labels':labels,
        'inverse':inv,'recovery_error':float(np.max(abs(np.array(inv['theta'])-theta)))}

def cycles(request):
    fixture=request.get('fixture','dense5')
    if fixture not in FIXTURES:raise ValueError('Unknown cycle fixture')
    f=F(FIXTURES[fixture]);n=f.n;edges=edges_for(f)
    gaps=finite_array(request.get('gaps',[.07]*(n-1)+[1-.07*(n-1)]),n,'gaps')
    if min(gaps)<=0:raise ValueError('Every gap must be positive')
    gaps=gaps/np.sum(gaps)*PI
    theta=np.r_[0,np.cumsum(gaps[:-1])];theta=validate_theta(f,theta)
    d,g,h,psi=field(theta,edges);part=cycle_partition(f.window)
    angle=float(request.get('direction',.7));mode=int(request.get('mode',1))
    if not math.isfinite(angle) or not 1<=mode<=n:raise ValueError('Invalid perturbation direction')
    perturb=np.cos(np.arange(n)*2*PI*mode/n+angle);perturb-=perturb.mean()
    if np.linalg.norm(perturb)<1e-9:perturb=np.linspace(-1,1,n)
    perturb/=np.linalg.norm(perturb)
    contributions=[]
    for nodes in part:
        ce=tuple(zip(nodes,nodes[1:]+nodes[:1]));dd,_,hh,_=field(theta,ce)
        contributions.append({'nodes':list(nodes),'edges':[list(e) for e in ce],
            'deltas':dd.tolist(),'angle_sum':float(sum(dd)), 'hessian':hh.tolist(),
            'eigenvalues':np.linalg.eigvalsh(hh).tolist(),'energy':float(perturb@hh@perturb)})
    b=og._incidence(n,edges);energies=(1/np.tan(d))*(b.T@perturb)**2
    comps,_=component_basis(n,edges)
    return {'fixture':fixture,'window':list(f.window),'n':n,'theta':theta.tolist(),
        'gaps':(gaps/PI).tolist(),'edges':[list(e) for e in edges],
        'deltas':d.tolist(),'cotangents':(1/np.tan(d)).tolist(),'perturbation':perturb.tolist(),
        'edge_energies':energies.tolist(),'energy':float(sum(energies)),
        'hessian':h.tolist(),'eigenvalues':np.linalg.eigvalsh(h).tolist(),
        'component_count':len(comps),'cycles':contributions,'potential':psi}

def volume(request):
    n=int(request.get('n',4))
    if n not in (3,4,5):raise ValueError('Volume lab supports triangles, quadrilaterals and pentagons')
    gap=finite_array(request.get('gaps',[.11]*(n-1)+[1-.11*(n-1)]),n,'gaps')
    if min(gap)<.002:raise ValueError('Gap weights must be at least 0.002')
    alpha=PI*gap/sum(gap);A=np.cumsum(alpha);theta=np.r_[0,A[:-1]]
    lam=lobachevsky(alpha);fans=[]
    # Paper p.4: j=2..m-1, angles delta_j, pi-A_j, A_(j-1).
    for j in range(1,n-1):
        angles=[alpha[j],PI-A[j],A[j-1]]
        vals=lobachevsky(angles)
        fans.append({'indices':[0,j,j+1], 'angles':angles,
            'lobachevsky':vals.tolist(),'volume':float(sum(vals))})
    total=float(sum(lam));fan_total=sum(t['volume'] for t in fans)
    return {'n':n,'theta':theta.tolist(),'gaps':(alpha/PI).tolist(),'alpha':alpha.tolist(),
        'lobachevsky':lam.tolist(),'volume':total,'fans':fans,'fan_total':fan_total,
        'telescoping_residual':abs(total-fan_total),'psi_plus_constant':-total}

@lru_cache(maxsize=1)
def shift_grid():
    source=[];target=[];uv=[]
    f=F(FIXTURES['nontop8']);g=f.shift_down()
    for a in np.linspace(.06,.18,11):
        for b in np.linspace(.19,.39,11):
            theta=shift_theta(a,b,0.)
            c=og._gamma_matrix(f,theta)
            dest=np.asarray(og.dual_critical_measurement_matrix(g,theta))
            source.append(plucker(c)[1]);target.append(plucker(dest)[1]);uv.append([a,b])
    def project(rows):
        rows=np.array(rows);mean=rows.mean(axis=0)
        _,_,vh=np.linalg.svd(rows-mean,full_matrices=False);axes=vh[:3]
        for ax in axes:
            if ax[np.argmax(abs(ax))]<0:ax*=-1
        coords=(rows-mean)@axes.T
        return {'mean':mean.tolist(),'axes':axes.tolist(),'points':coords.tolist()}
    return {'uv':uv,'source':project(source),'target':project(target),'width':11,
            'projection_kind':'fixed PCA of projectively normalized Plucker vectors; display only'}

def shift_theta(a,b,off):
    if not all(math.isfinite(x) for x in (a,b,off)):raise ValueError('Nonfinite shift parameter')
    if not (.04<=a<=.2 and .17<=b<=.41 and 0<=off<=.035):raise ValueError('Outside the supported matching slice')
    return PI*np.array([0,a,b,.3,.5,a+.5,.8,b+.5+off])

def shift(request):
    a,b=finite_array(request.get('uv',[.1,.2]),2,'uv')
    off=float(request.get('off',0.));theta=shift_theta(a,b,off)
    f=F(FIXTURES['nontop8']);g=f.shift_down();edges=edges_for(f)
    theta=validate_theta(f,theta)
    c=og._gamma_matrix(f,theta);r,diag=og._r_coordinate(f,c,edges)
    start=PI*np.array([0,1/12,1/5,17/60,1/2,7/12,4/5,7/10])
    inv=inverse_gradient(f,r,start)
    recovered=np.array(inv['theta']);dest=np.array(og.dual_critical_measurement_matrix(g,recovered))
    direct=np.array(og.dual_critical_measurement_matrix(g,theta));ordinary=og._gamma_matrix(g,theta)
    ls,ps=plucker(c);lt,pt=plucker(dest);_,pd=plucker(direct);_,po=plucker(ordinary)
    alt=np.array([(-1.)**i for i in range(1,9)])
    ortho=dest@np.diag(alt)@dest.T
    normalized_defect=float(np.linalg.norm(ortho)/max(1e-300,np.linalg.norm(dest)**2))
    cp={tuple(k):v for k,v in zip(lt,pt)}
    complement=max(abs(cp[k]-cp[tuple(i for i in range(1,9) if i not in k)]) for k in cp)
    grid=shift_grid()
    s_xyz=(ps-np.array(grid['source']['mean']))@np.array(grid['source']['axes']).T
    t_xyz=(pt-np.array(grid['target']['mean']))@np.array(grid['target']['axes']).T
    tw=og._left_twist(f,c)
    logs=[math.log(abs(og._plucker(tw,tuple(i)))) for i in og.grassmann_necklace(f)]
    return {'uv':[a,b],'off':off,'pairs':[list(p) for p in PAIRS],
        'theta':theta.tolist(),'recovered':recovered.tolist(),'source_window':list(f.window),
        'target_window':list(g.window),'source_matrix':c.tolist(),'target_matrix':dest.tolist(),
        'twist_matrix':tw.tolist(),'log_necklace':logs,'r':r.tolist(),
        'gradient':field(theta,edges)[1].tolist(),'inverse':inv,
        'source_labels':ls,'source_plucker':ps.tolist(),'target_labels':lt,'target_plucker':pt.tolist(),
        'source_xyz':s_xyz.tolist(),'target_xyz':t_xyz.tolist(),
        'identity_residual':float(np.max(abs(r-field(theta,edges)[1]))),
        'twist_residual':diag['twist_equation_max_residual'],
        'recovery_error':float(np.max(abs(recovered-theta))),
        'target_residual':float(np.max(abs(pt-pd))),
        'ordinary_dual_difference':float(np.max(abs(pt-po))),
        'isotropy_defect':normalized_defect,'complement_defect':float(complement),
        'noncrossing_collision':bool(abs(b-.3)<1e-9)}

def collision(request):
    u=float(request.get('u',.3));eps=float(request.get('epsilon',.08));mode=request.get('mode','packet')
    if not math.isfinite(u) or not .025<=u<=.975:raise ValueError('u outside [0.025,0.975]')
    if not math.isfinite(eps) or not 1e-5<=eps<=.45:raise ValueError('epsilon outside [1e-5,0.45]')
    if mode not in ('packet','edge'):raise ValueError('Unknown collision type')
    theta=PI*np.array([0,eps*u,eps] if mode=='packet' else [0,eps,.67])
    f=F(FIXTURES['triangle']);theta=validate_theta(f,theta)
    c=og._gamma_matrix(f,theta);labels,p=plucker(c);d,g,h,psi=field(theta,edges_for(f))
    # From the actual trigonometric curve: [D12,D13,D23] ~ [sin(theta3-theta2),sin(theta2),sin(theta3)].
    limit=[(1-u)/2,u/2,1/2] if mode=='packet' else [1/2,0,1/2]
    samples=[]
    for ex in np.linspace(-4.5,math.log10(.45),45):
        ee=10**ex;th=PI*np.array([0,ee*u,ee] if mode=='packet' else [0,ee,.67])
        _,pg=plucker(og._gamma_matrix(f,th));dd,gg,hh,ps=field(th,edges_for(f))
        samples.append({'epsilon':ee,'p':pg.tolist(),'gradient_norm':float(np.linalg.norm(gg)),
                        'volume':float(sum(lobachevsky(dd)))})
    return {'u':u,'epsilon':eps,'mode':mode,'theta':theta.tolist(),'deltas':d.tolist(),
            'gradient':g.tolist(),'gradient_norm':float(np.linalg.norm(g)),
            'volume':float(sum(lobachevsky(d))),'plucker':p.tolist(),'limit':limit,
            'limit_error':float(np.max(abs(p-limit))),'samples':samples,'labels':labels}

def necklace(request):
    key=request.get('fixture','dense5')
    if key not in FIXTURES:raise ValueError('Unknown necklace fixture')
    f=F(FIXTURES[key]);n=f.n;edge=edges_for(f);es=set(edge)
    pairs=list(itertools.combinations(range(1,n+1),2));rows=og.grassmann_necklace(f)
    m=np.zeros((n,len(pairs)),dtype=int);inc=np.zeros_like(m)
    classes=[]
    for j,(p,q) in enumerate(pairs):
        e=(p,q) if (p,q) in es else (q,p) if (q,p) in es else None
        classes.append(list(e) if e else None)
        if e:
            tail,head=e
            m[:,j]=[-int(tail in I and head not in I) for I in rows]
            inc[tail-1,j]=-1;inc[head-1,j]=1
    inv=[f.inverse_residue[x]-1 for x in range(1,n+1)]
    original=m.copy();corrupt=bool(request.get('corrupt',False));j=int(request.get('column',0))
    if not 0<=j<len(pairs):raise ValueError('Column outside pair set')
    if corrupt:m[0,j]+=1
    dm=np.roll(m,-1,axis=0)-m;pd=dm[inv]
    return {'fixture':key,'window':list(f.window),'n':n,'pairs':[list(x) for x in pairs],
        'column':j,'corrupt':corrupt,'necklace':[list(x) for x in rows],
        'edges':[list(x) for x in edge],'classes':classes,
        'M':m.tolist(),'original_M':original.tolist(),'D_M':dm.tolist(),'P_D_M':pd.tolist(),
        'B':inc.tolist(),'permutation_rows':[x+1 for x in inv],
        'error':int(np.max(abs(pd-inc))),'difference':(pd-inc).tolist()}

def dense(request):
    eta=float(request.get('eta',.065))*PI
    if not .005*PI<=eta<.1999*PI:raise ValueError('eta outside supported range')
    bary=finite_array(request.get('bary',[.3,.4,.3]),3,'bary')
    if min(bary)<0 or sum(bary)<=0:raise ValueError('Invalid barycentric coordinates')
    bary=bary/sum(bary);alpha=np.ones(5)*eta;alpha[:3]+=(PI-5*eta)*bary
    theta=np.r_[0,np.cumsum(alpha[:-1])];f=F(FIXTURES['dense5'])
    d,g,h,psi=field(theta,edges_for(f));ev,vec=np.linalg.eigh(h)
    x=math.tan(eta);A=x*(x*x-1)*(x*x-3);B=x**6+5*x*x-10;C=4*x**5-22*x**3+30*x
    disc=B*B-4*A*C
    # Rationalized smaller root avoids cancellation at small eta.
    mu=2*C/(5*(-B+math.sqrt(disc)))
    part=cycle_partition(f.window)
    kappa=min((1/math.tan(eta)-(len(s)-1)/math.tan((len(s)-1)*eta))/len(s) for s in part)
    return {'eta':eta/PI,'bary':bary.tolist(),'alpha':(alpha/PI).tolist(),
        'theta':theta.tolist(),'eigenvalues':ev.tolist(),'least_mode':vec[:,1].tolist(),
        'mu_sharp':mu,'measured_mu':float(ev[1]/5),'cycle_bound':kappa,
        'slack':float(ev[1]/5-mu)}

def selftest():
    a=landscape({});s=shift({});c=collision({'epsilon':1e-4});nc=necklace({})
    checks={'triangle_twist_gradient':a['identity_residual']<1e-10,
        'triangle_inverse':a['inverse']['converged'],'nontop_inverse':s['inverse']['converged'],
        'nontop_dual':s['target_residual']<1e-9,'isotropic_og':s['isotropy_defect']<1e-9,
        'necklace_exact':nc['error']==0,'collision_limit':c['limit_error']<1e-7,
        'dense_vertex':abs(dense({'bary':[1,0,0]})['slack'])<1e-9,
        'volume_telescope':volume({})['telescoping_residual']<1e-10}
    return {'version':VERSION,'wasm':sys.platform=='emscripten','platform':sys.platform,
            'numpy':np.__version__,'checks':checks,'ok':all(checks.values())}

def dispatch(request):
    action=request.get('action','selftest')
    functions={'landscape':landscape,'cycles':cycles,'volume':volume,'shift':shift,
        'collision':collision,'necklace':necklace,'dense':dense}
    if action=='selftest':return selftest()
    if action not in functions:raise ValueError('Unknown action')
    return functions[action](request)

def dispatch_json(raw):
    try:
        record=json.loads(raw)
        if not isinstance(record,dict):raise ValueError('Request must be an object')
        return json.dumps({'ok':True,'result':dispatch(record)},allow_nan=False)
    except Exception as exc:
        return json.dumps({'ok':False,'error':f'{type(exc).__name__}: {exc}'})
