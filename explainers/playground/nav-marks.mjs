// Marks the examples whose output draws a picture, in the side list and the phone's example list.
const VISUAL = new Set(["Angles", "ComponentShift", "D01_boundary_EX01", "D02_boundary_EX02", "D03_necklace_EX02", "RoundTrip", "SevenCellWitness", "TwoComponents", "item_H1", "item_H2", "item_H3", "item_H4", "item_S46", "item_S47", "item_S48", "item_S49", "item_S50", "item_S51", "item_S52", "item_S53", "item_S54", "item_S55", "item_S56", "item_S57", "item_S58", "item_S59", "item_S60", "item_S61", "item_S62", "item_S63", "item_S64", "item_S65", "item_S66", "item_S67", "item_S68", "item_S69", "item_S70", "item_S71", "item_S72", "item_S73", "item_S74", "item_S75", "item_S76", "item_S77", "item_S78", "item_S79", "item_S80", "item_S81", "item_S82", "item_S83", "item_S84", "item_S85", "item_S86", "item_UF-CONSTRUCT", "item_UF-LOOPS", "item_UF-REDUCTION", "item_UF-SHARP", "item_UF-SHIFT", "item_UF-UNTWISTED", "item_UF-VOLUME", "item_UF-WP-COUNT", "item_UF-WP-DECORATED", "item_UF-WP-STRAND"]);
const ICON = '<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M1 11h10M2 9l3-4 2 2 3-5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function mark() {
  for (const a of document.querySelectorAll('#parts-nav a[data-example]')) {
    if (VISUAL.has(a.dataset.example) && !a.querySelector('.viz')) {
      const s = document.createElement('span');
      s.className = 'viz'; s.title = 'Draws a picture'; s.innerHTML = ICON;
      a.prepend(s);
    }
  }
  for (const o of document.querySelectorAll('#example-select option')) {
    if (VISUAL.has(o.value) && !o.textContent.startsWith('◆ ')) o.textContent = '◆ ' + o.textContent;
  }
}
new MutationObserver(mark).observe(document.body, {childList: true, subtree: true});
mark();
