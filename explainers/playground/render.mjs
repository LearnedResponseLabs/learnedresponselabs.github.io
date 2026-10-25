// DOM renderer and allow-list from the reading edition live engine.
  const SVG = new Set(['svg', 'g', 'circle', 'line', 'path', 'rect', 'text', 'polygon', 'polyline', 'ellipse', 'defs', 'marker', 'title', 'desc']);
  const HTML = new Set(['div', 'span', 'p', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'caption', 'strong', 'em', 'br']);
  const ATTRS = new Set(['width', 'height', 'viewBox', 'x', 'y', 'x1', 'x2', 'y1', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'd', 'points',
    'fill', 'stroke', 'opacity', 'transform', 'id', 'refX', 'refY', 'markerWidth', 'markerHeight', 'orient', 'role', 'aria-label']);
  const REACT = {strokeWidth:'stroke-width', strokeOpacity:'stroke-opacity', fillOpacity:'fill-opacity',
    markerEnd:'marker-end', markerStart:'marker-start', textAnchor:'text-anchor', dominantBaseline:'dominant-baseline',
    fontSize:'font-size', fontWeight:'font-weight', strokeDasharray:'stroke-dasharray', strokeLinecap:'stroke-linecap',
    strokeLinejoin:'stroke-linejoin', className:'class'};
  const STYLES = {display:new Set(['flex','block','inline-block']), flexWrap:new Set(['wrap','nowrap']),
    alignItems:new Set(['flex-start','center','stretch']), gap:/^\d+(?:\.\d+)?(?:px|em|rem)$/};
  let serial = 0;
  function element(doc, tag, text) {
    const el=doc.createElement(tag);
    if (text !== undefined) el.textContent=String(text);
    return el;
  }
  function picture(doc, value, prefix, depth=0, budget={n:0}) {
    if (++budget.n>20000 || depth>80) throw new Error('picture exceeds its rendering limit');
    if (typeof value==='string') return doc.createTextNode(value);
    if (!value || typeof value!=='object' || Array.isArray(value) || !SVG.has(value.t) && !HTML.has(value.t))
      throw new Error('unsupported picture element');
    const el=SVG.has(value.t) ? doc.createElementNS('http://www.w3.org/2000/svg',value.t) : doc.createElement(value.t);
    if (!value.a || Array.isArray(value.a) || typeof value.a!=='object' || !Array.isArray(value.c)) throw new Error('invalid picture');
    for (const [key,v] of Object.entries(value.a)) {
      if (key==='style') {
        if (!v || typeof v!=='object' || Array.isArray(v)) throw new Error('style must be an object');
        for (const [k,s] of Object.entries(v)) {
          const rule=STYLES[k];
          if (!rule || typeof s!=='string' || !(rule instanceof Set ? rule.has(s) : rule.test(s))) throw new Error('unsupported style');
          el.style[k]=s;
        }
        continue;
      }
      if (!ATTRS.has(key) && !Object.hasOwn(REACT,key)) throw new Error('unsupported attribute');
      if (typeof v!=='string' && typeof v!=='number') throw new Error('invalid attribute value');
      let text=String(v);
      if (/url\(/i.test(text)) {
        if (!['markerEnd','markerStart','fill','stroke'].includes(key) || !/^url\(#[A-Za-z][\w-]*\)$/.test(text))
          throw new Error('external picture reference');
        text=text.replace('url(#','url(#'+prefix);
      }
      if (key==='id') {
        if (!/^[A-Za-z][\w-]*$/.test(text)) throw new Error('invalid picture id');
        text=prefix+text;
      }
      el.setAttribute(REACT[key] || key,text);
    }
    for (const c of value.c) el.append(picture(doc,c,prefix,depth+1,budget));
    return el;
  }
  function output(doc, answer) {
    if (!answer || !['html','table','text'].includes(answer.kind)) throw new Error('missing precomputed output');
    const box=element(doc,'div');box.className='live-output';
    if (answer.kind==='html') box.append(picture(doc,answer.value,'live-'+(++serial)+'-'));
    if (answer.kind==='text') box.append(element(doc,'pre',answer.value));
    if (answer.kind==='table') {
      if (!Array.isArray(answer.value)) throw new Error('invalid table');
      for (const data of answer.value) {
        const table=element(doc,'table');table.append(element(doc,'caption',data.title));
        const head=element(doc,'tr');head.append(element(doc,'th','Row'));
        for (const c of data.columns) head.append(element(doc,'th',c));
        table.append(head);
        data.rows.forEach((row,i)=>{
          if (row.length!==data.columns.length) throw new Error('invalid row');
          const tr=element(doc,'tr');tr.append(element(doc,'th',data.labels[i]));
          for (const cell of row) tr.append(element(doc,'td',cell));
          table.append(tr);
        });
        box.append(table);
      }
      if (typeof answer.equal==='boolean') box.append(element(doc,'pre','P*D*M = B: '+answer.equal));
    }
    return box;
  }

export {picture,output};
