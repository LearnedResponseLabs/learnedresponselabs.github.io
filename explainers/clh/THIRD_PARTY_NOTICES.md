# Third-party and source notices

## ogcanon

`py/og_bridge.py` is copied unchanged from `ogcanon/src/ogcanon/bridge.py` in the
uploaded ogcanon archive (0.2.0.dev0 lineage). The N=4 JSON fixture is likewise
unchanged. The package license is reproduced at `source/OGCANON-LICENSE`:
Apache License, Version 2.0. SHA-256 of the two files as shipped (identical to the snapshot they were copied from):
`py/og_bridge.py` e689bf0006cee7bcb89ea7487189d8e6c0ff222d6ca9a79447fd1a63cc4eaf1e;
`source/og4_8_nontop_critical_shift.json` 65f8d6176959bce763d69de0c7567b05e6b9210c62f7699ffedf491c68b38549.

The copied module is used standalone to avoid importing unrelated graph/form and
symbolic backends. No changes are made to its mathematical routines. Validation,
inverse-step recording, finite cycle covers and explanatory views are supplied by
the new adapter rather than silently changing the upstream file.

## Plotly.js

The local Plotly 3.3.1 bundle is reused from the previously supplied viewer.
It retains its original header and MIT license notice. Copyright Plotly, Inc.

## Pyodide and NumPy

Runtime packages are loaded separately from the configured Pyodide distribution.
They are not redistributed in this ZIP. Their upstream licenses and notices apply.

## Source manuscripts

The Conjecture 4.3 paper (CLH) is hosted on this site, and these experiments cite its statements and pages by
reference to that copy. The companion boundary manuscript is in preparation and is not copied.
No new mathematical review status is assigned by the visual experiments.
