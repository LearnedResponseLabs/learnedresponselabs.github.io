# Validation record — CLH geometric labs v0.1.0

## Passed in the authoring environment

- 62 Python tests: actual measured inverse recovery; original twist/gradient
  comparisons; exact finite winding covers; derivatives; high-precision independent
  Lobachevsky quadrature; fan telescoping; non-top shift and off-isotropy controls;
  collision limits; necklace integer identities; dense-five equality cases;
  malformed-input and fixed-affine-chamber rejection.
- 7 selected upstream ogcanon tests for critical shift, matching shift, necklaces
  and ordinary/dual measurements passed in the extracted original repository.
- 11 JavaScript tests: matrix sums, the Jacobi spectrum against NumPy, an indefinite
  control, Unicode state serialization, invalid state guards and simplex helpers.
- 88 browser checks passed with no page errors. Real Plotly/SVG interactions,
  live numerical controls through an explicit native CPython test binding, mesh
  clicks, SVG sample selection, keyboard 3D rotation, solver playback, recorded
  examples, numerical countercontrols and JSON exports were exercised.
- All six pages were rendered at 1440x1000 and 390x844 with no page-level horizontal
  overflow. The software 3D SVG renderer avoids a WebGL requirement.
- Four upstream source artifacts are copied byte-for-byte: the two PDFs, the
  numerical bridge module and the N=4 fixture.

## What these checks do not establish

The browser sandbox rejects HTTP navigation with ERR_BLOCKED_BY_ADMINISTRATOR;
the container cannot resolve the Pyodide CDN. The browser tests therefore inline
local assets and use a clearly labelled native CPython binding. They do NOT test
WebAssembly, normal site routing, the production worker download, CDN availability,
a deployed Content Security Policy, or access to a GPU. They are not a mathematical
proof audit or a certificate of the theorems of the paper or of the companion manuscript (in preparation).

Production contains no native Python service. Its worker requires an emscripten
platform check. Use `runtime-check.html` on the actual host to obtain a real-runtime
receipt. It runs the production worker and has no snapshot fallback.

## Reproduce

```sh
python -m pytest -q tests/test_labs.py
node --test tests/test_ui.mjs
python tests/browser_check.py
python tools/static_audit.py
```

The browser-check script requires Playwright and a Chromium executable at
`/usr/bin/chromium` in its current environment configuration. The native binding is
installed explicitly by that test; it is not a production server endpoint.

See `python-tests.txt`, `js-tests.txt`, `browser-tests.json`,
`ogcanon-original-tests.txt`, `static-audit.json`, and
`real-runtime-attempt.json` for the separate records.
