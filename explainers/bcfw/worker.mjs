/** One serialized Python session, isolated from the UI. No web server callbacks. */
let pyodide = null;
let api = null;
let rootURL = null;
let bootPromise = null;
let queue = Promise.resolve();
const loadedFamilies = new Set();

async function text(url, maxBytes = 25_000_000) {
  const r = await fetch(url, {cache: 'no-cache'});
  if (!r.ok) throw new Error(`Could not load ${new URL(url).pathname}: HTTP ${r.status}`);
  const s = await r.text();
  if (s.length > maxBytes) throw new Error('Resource exceeds the browser size limit.');
  return s;
}
function progress(message) { self.postMessage({type: 'progress', message}); }
async function boot(baseURL) {
  rootURL = new URL(baseURL);
  const config = JSON.parse(await text(new URL('runtime-config.json', rootURL)));
  const indexURL = new URL(config.indexURL, rootURL).href.replace(/\/?$/, '/');
  progress(`Loading Pyodide ${config.pyodideVersion}…`);
  const {loadPyodide} = await import(indexURL + 'pyodide.mjs');
  pyodide = await loadPyodide({indexURL,
    stdout: s => self.postMessage({type: 'log', message: s}),
    stderr: s => self.postMessage({type: 'log', message: s})});
  if (pyodide.version !== config.pyodideVersion) {
    throw new Error(`Runtime version mismatch: expected ${config.pyodideVersion}, got ${pyodide.version}.`);
  }
  progress('Loading the source-derived Python engine…');
  pyodide.FS.mkdirTree('/lrl/py');
  pyodide.FS.mkdirTree('/lrl/data/families');
  for (const name of ['corrected_seed.py', 'core.py']) {
    pyodide.FS.writeFile(`/lrl/py/${name}`, await text(new URL(`py/${name}`, rootURL), 200_000));
  }
  await pyodide.runPythonAsync(`import sys\nsys.path.insert(0, '/lrl/py')\nimport core\ncore.configure('/lrl/data')`);
  api = pyodide.runPython('core.dispatch_json');
  const result = JSON.parse(api(JSON.stringify({action: 'selftest'})));
  if (!result.ok || !result.result.ok) throw new Error('Python startup self-test failed.');
  return {version: pyodide.version, selftest: result.result};
}
async function ensureFamily(key) {
  if (!/^\d{1,2}_\d$/.test(key)) throw new Error('Invalid family key.');
  if (!loadedFamilies.has(key)) {
    const s = await text(new URL(`data/families/${key}.json`, rootURL));
    pyodide.FS.writeFile(`/lrl/data/families/${key}.json`, s);
    loadedFamilies.add(key);
  }
}
async function handle(event) {
  const {id, type, payload, baseURL} = event.data || {};
  try {
    if (type === 'boot') {
      if (!bootPromise) bootPromise = boot(baseURL);
      self.postMessage({type: 'ready', id, result: await bootPromise});
      return;
    }
    if (!bootPromise) throw new Error('Python has not been initialized.');
    await bootPromise;
    if (type !== 'request') throw new Error('Unsupported computation message.');
    if (payload.action !== 'selftest') await ensureFamily(payload.family);
    const result = JSON.parse(api(JSON.stringify(payload)));
    self.postMessage({type: 'result', id, ...result});
  } catch (error) {
    self.postMessage({type: 'error', id, error: {code: 'runtime_error', message: String(error.message || error)}});
  }
}
self.addEventListener('message', event => {
  queue = queue.then(() => handle(event)).catch(error => {
    self.postMessage({type: 'error', error: {code: 'runtime_error', message: String(error)}});
  });
});
