// ============================================================
// CLASS 4 — ECOLOGICAL NETWORKS
// showPage(), buildQuiz(), renderSiteNav/Subnav() are shared — see
// js/common.js. This file wires the interactives:
//   1. network ⇄ matrix builder  (topic 3) — uni/bi + dropdowns
//   2. self-check quiz            (topic 4)
// The lesson is conceptual: no heavy math, just the ideas.
// ============================================================

const TEAL = '#0f6e56', AMBER = '#ba7517', CORAL = '#993c1d', PURPLE = '#534ab7';

// ============================================================
// TOPIC 3 — NETWORK ⇄ MATRIX BUILDER
// Two modes:
//   uni : 5-node uni-partite adjacency matrix (N×N)
//   bi  : 4 pollinators × 3 plants incidence matrix (M×N)
// Dropdowns switch uni/bi, binary/weighted, undirected/directed.
// Cell values hold a weight 0..3 (binary mode clamps to 0/1).
// ============================================================
let netMode = 'uni';       // 'uni' | 'bi'
let netWeighted = false;   // binary ⇄ weighted
let netDirected = false;   // undirected ⇄ directed (uni only)

const UNI_N = 5;
const BI_A = 4, BI_P = 3;  // pollinators (rows) × plants (cols)
let uniAdj, biInc;

// fixed node layouts (viewBox 280×240)
const UNI_POS = [{ x: 75, y: 60 }, { x: 205, y: 55 }, { x: 235, y: 155 }, { x: 120, y: 200 }, { x: 45, y: 150 }];
const BI_AX = [46, 110, 174, 238], BI_AY = 54, BI_AR = 15;
const BI_PX = [72, 140, 208], BI_PY = 188, BI_PS = 26;

function loadExample() {
  uniAdj = Array.from({ length: UNI_N }, () => Array(UNI_N).fill(0));
  [[0, 1], [1, 2], [2, 4], [0, 3], [3, 4]].forEach(([i, j]) => { uniAdj[i][j] = 1; uniAdj[j][i] = 1; });
  biInc = Array.from({ length: BI_A }, () => Array(BI_P).fill(0));
  [[0, 0], [0, 1], [1, 1], [2, 1], [2, 2], [3, 0]].forEach(([a, p]) => { biInc[a][p] = 1; });
  if (netWeighted) { uniAdj[0][1] = uniAdj[1][0] = 2; biInc[0][0] = 3; }  // some variety when weighted
}

function netWidth(w) { return netWeighted ? (w === 1 ? 2 : w === 2 ? 4 : 6) : 3; }

// ---------- SVG ----------
function renderUniSvg() {
  const R = 18;
  let edges = '';
  for (let i = 0; i < UNI_N; i++) for (let j = 0; j < UNI_N; j++) {
    if (i === j || uniAdj[i][j] <= 0) continue;
    if (!netDirected && i > j) continue;
    const a = UNI_POS[i], b = UNI_POS[j];
    if (netDirected) {
      const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
      edges += `<line x1="${a.x + ux * R}" y1="${a.y + uy * R}" x2="${b.x - ux * (R + 6)}" y2="${b.y - uy * (R + 6)}" stroke="${TEAL}" stroke-width="${netWidth(uniAdj[i][j])}" marker-end="url(#netArrow)"/>`;
    } else {
      edges += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${TEAL}" stroke-width="${netWidth(uniAdj[i][j])}"/>`;
    }
  }
  let nodes = '';
  for (let k = 0; k < UNI_N; k++) {
    const p = UNI_POS[k];
    nodes += `<circle cx="${p.x}" cy="${p.y}" r="${R}" fill="#cfe9e0" stroke="${TEAL}" stroke-width="2.5"/>` +
             `<text x="${p.x}" y="${p.y + 5}" font-size="14" fill="${TEAL}" text-anchor="middle" font-weight="600">${k + 1}</text>`;
  }
  document.getElementById('netSvg').innerHTML =
    `<defs><marker id="netArrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="${TEAL}"/></marker></defs>` +
    edges + nodes;
}

function renderBiSvg() {
  let links = '';
  for (let a = 0; a < BI_A; a++) for (let p = 0; p < BI_P; p++) {
    if (biInc[a][p] <= 0) continue;
    const x1 = BI_AX[a], y1 = BI_AY + BI_AR, x2 = BI_PX[p], y2 = BI_PY - BI_PS / 2;
    if (netDirected) {   // bipartite can be directed too (link A → B)
      const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
      links += `<line x1="${x1}" y1="${y1}" x2="${x2 - dx / len * 8}" y2="${y2 - dy / len * 8}" stroke="${TEAL}" stroke-width="${netWidth(biInc[a][p])}" marker-end="url(#biArrow)"/>`;
    } else {
      links += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${TEAL}" stroke-width="${netWidth(biInc[a][p])}"/>`;
    }
  }
  let nodes = '';   // nodes labelled A1..A4 / B1..B3 to match the matrix
  for (let a = 0; a < BI_A; a++)
    nodes += `<circle cx="${BI_AX[a]}" cy="${BI_AY}" r="${BI_AR}" fill="#faeeda" stroke="${AMBER}" stroke-width="2.5"/>` +
             `<text x="${BI_AX[a]}" y="${BI_AY + 4}" font-size="11" fill="${AMBER}" text-anchor="middle" font-weight="600">A${a + 1}</text>`;
  for (let p = 0; p < BI_P; p++)
    nodes += `<rect x="${BI_PX[p] - BI_PS / 2}" y="${BI_PY - BI_PS / 2}" width="${BI_PS}" height="${BI_PS}" rx="4" fill="#e1f5ee" stroke="${TEAL}" stroke-width="2.5"/>` +
             `<text x="${BI_PX[p]}" y="${BI_PY + 4}" font-size="11" fill="${TEAL}" text-anchor="middle" font-weight="600">B${p + 1}</text>`;
  const defs = netDirected ? `<defs><marker id="biArrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="${TEAL}"/></marker></defs>` : '';
  document.getElementById('netSvg').innerHTML = defs + links + nodes +
    `<text x="140" y="20" font-size="11.5" fill="${AMBER}" text-anchor="middle" font-weight="600">קבוצה A (Set A)</text>` +
    `<text x="140" y="232" font-size="11.5" fill="${TEAL}" text-anchor="middle" font-weight="600">קבוצה B (Set B)</text>`;
}

// ---------- matrix table ----------
function renderMatrix() {
  const t = document.getElementById('adjTable');
  if (netMode === 'uni') {
    let html = '<thead><tr><th></th>';
    for (let j = 0; j < UNI_N; j++) html += `<th>${j + 1}</th>`;
    html += '</tr></thead><tbody>';
    for (let i = 0; i < UNI_N; i++) {
      html += `<tr><th>${i + 1}</th>`;
      for (let j = 0; j < UNI_N; j++) {
        if (i === j) { html += `<td class="cell diag">–</td>`; continue; }
        html += cellHtml(uniAdj[i][j], `uniCell(${i},${j})`);
      }
      html += '</tr>';
    }
    t.innerHTML = html + '</tbody>';
    document.getElementById('adjHint').innerHTML = 'שורה i → עמודה j &nbsp;·&nbsp; לחצו על תא לשינוי';
  } else {
    let html = '<thead><tr><th></th>';
    for (let p = 0; p < BI_P; p++) html += `<th>B${p + 1}</th>`;
    html += '</tr></thead><tbody>';
    for (let a = 0; a < BI_A; a++) {
      html += `<tr><th>A${a + 1}</th>`;
      for (let p = 0; p < BI_P; p++) html += cellHtml(biInc[a][p], `biCell(${a},${p})`);
      html += '</tr>';
    }
    t.innerHTML = html + '</tbody>';
    document.getElementById('adjHint').innerHTML = 'שורה = קבוצה A · עמודה = קבוצה B &nbsp;·&nbsp; לחצו על תא לשינוי';
  }
}

function cellHtml(w, onclick) {
  const on = w > 0;
  const wc = netWeighted && on ? ` w${Math.min(w, 3)}` : '';
  const val = netWeighted ? w : (on ? 1 : 0);
  return `<td class="cell ${on ? 'on' : 'off'}${wc}" onclick="${onclick}">${val}</td>`;
}

function bump(v) { return netWeighted ? (v + 1) % 4 : (v > 0 ? 0 : 1); }

function uniCell(i, j) {
  if (i === j) return;
  uniAdj[i][j] = bump(uniAdj[i][j]);
  if (!netDirected) uniAdj[j][i] = uniAdj[i][j];
  render3();
}
function biCell(a, p) { biInc[a][p] = bump(biInc[a][p]); render3(); }

// ---------- degrees + legend ----------
function renderDeg() {
  let chips = '';
  const term = netWeighted ? 'strength' : 'degree';
  if (netMode === 'uni') {
    for (let k = 0; k < UNI_N; k++) {
      if (netDirected) {
        let din = 0, dout = 0;
        for (let j = 0; j < UNI_N; j++) {
          if (j === k) continue;
          const outV = netWeighted ? uniAdj[k][j] : (uniAdj[k][j] > 0 ? 1 : 0);
          const inV = netWeighted ? uniAdj[j][k] : (uniAdj[j][k] > 0 ? 1 : 0);
          dout += outV; din += inV;
        }
        chips += chip(`צומת ${k + 1}: in-${term}=${din}, out-${term}=${dout}`);
      } else {
        let d = 0; for (let j = 0; j < UNI_N; j++) if (j !== k) d += netWeighted ? uniAdj[k][j] : (uniAdj[k][j] > 0 ? 1 : 0);
        chips += chip(`צומת ${k + 1}: ${term}=${d}`);
      }
    }
  } else {
    // links go A → B, so under 'directed' set A shows the out-side and set B the in-side
    for (let a = 0; a < BI_A; a++) {
      const arr = biInc[a];
      const val = netWeighted ? arr.reduce((x, y) => x + y, 0) : arr.filter(v => v > 0).length;
      chips += chip(`A${a + 1}: ${netDirected ? 'out-' + term : term}=${val}`, AMBER);
    }
    for (let p = 0; p < BI_P; p++) {
      let val = 0; for (let a = 0; a < BI_A; a++) val += netWeighted ? biInc[a][p] : (biInc[a][p] > 0 ? 1 : 0);
      chips += chip(`B${p + 1}: ${netDirected ? 'in-' + term : term}=${val}`, TEAL);
    }
  }
  document.getElementById('degList').innerHTML = chips;

  // legend — spell out exactly the terms shown
  const bits = ['<b>degree</b> (דרגה) — מספר הקשתות של הצומת.'];
  if (netWeighted) bits.push('<b>strength</b> (עוצמה) — סכום משקלי הקשתות של הצומת (במקום ספירה, סוכמים ערכים).');
  if (netDirected) bits.push('<b>in-degree</b> / <b>out-degree</b> (דרגה נכנסת/יוצאת) — כמה קשתות מצביעות <em>אל</em> הצומת וכמה <em>ממנו</em>.');
  document.getElementById('degLegend').innerHTML = bits.join('<br>');
}

function chip(txt, color) {
  const style = color ? ` style="border-color:${color}"` : '';
  return `<span class="deg-chip"${style}>${txt}</span>`;
}

// ---------- explanation ----------
function renderExplain() {
  let links = 0;
  if (netMode === 'uni') {
    for (let i = 0; i < UNI_N; i++) for (let j = 0; j < UNI_N; j++) {
      if (i === j || uniAdj[i][j] <= 0) continue;
      if (netDirected) links++; else if (i < j) links++;
    }
    const parts = [netWeighted ? '<strong>משוקללת (weighted)</strong>' : '<strong>בינארית (binary)</strong>',
                   netDirected ? '<strong>מכוונת (directed)</strong> — המטריצה אסימטרית' : '<strong>לא-מכוונת (undirected)</strong> — המטריצה סימטרית (a<sub>ij</sub>=a<sub>ji</sub>)'];
    document.getElementById('netExplain').innerHTML =
      `רשת <strong>חד-צדדית (unipartite)</strong>, ${parts.join(' · ')}. סה"כ ${links} קשתות בין 5 צמתים. ` +
      (netDirected ? 'קשת i→j אינה גוררת קשת j→i, ולכן כל תא במטריצה עצמאי.' : 'כל קשת מופיעה פעמיים במטריצה — מעל ומתחת לאלכסון.');
  } else {
    for (let a = 0; a < BI_A; a++) for (let p = 0; p < BI_P; p++) if (biInc[a][p] > 0) links++;
    const dirTxt = netDirected ? '<strong>מכוונת (directed)</strong>' : '<strong>לא-מכוונת (undirected)</strong>';
    document.getElementById('netExplain').innerHTML =
      `רשת <strong>דו-צדדית (bipartite)</strong>, ${netWeighted ? '<strong>משוקללת</strong>' : '<strong>בינארית</strong>'}, ${dirTxt}. ` +
      `המטריצה מלבנית ${BI_A}×${BI_P} (מטריצת שכיחות / incidence): שורות = קבוצה A, עמודות = קבוצה B. סה"כ ${links} קשתות. ` +
      'קשתות קיימות רק <em>בין</em> שתי הקבוצות — אף פעם לא בתוך אותה קבוצה. גם רשת דו-צדדית יכולה להיות מכוונת.';
  }
}

function render3() { (netMode === 'uni' ? renderUniSvg : renderBiSvg)(); renderMatrix(); renderDeg(); renderExplain(); }

// ---------- dropdown handlers ----------
function setPartite(bi) {
  netMode = bi ? 'bi' : 'uni';   // bipartite may be directed too (e.g. host–parasite)
  render3();
}

function setWeighted(w) {
  netWeighted = w;
  if (!netWeighted) {   // clamp everything back to 0/1
    [uniAdj, biInc].forEach(m => m.forEach(row => row.forEach((v, i) => { if (v > 0) row[i] = 1; })));
  }
  render3();
}

function setDirected(dir) {
  netDirected = dir;
  if (netMode === 'uni' && !netDirected) {   // symmetrize the adjacency matrix
    for (let i = 0; i < UNI_N; i++) for (let j = i + 1; j < UNI_N; j++) {
      const v = Math.max(uniAdj[i][j], uniAdj[j][i]); uniAdj[i][j] = uniAdj[j][i] = v;
    }
  }
  render3();
}

function resetNet() { loadExample(); render3(); }

// ============================================================
// TOPIC 4 — SELF-CHECK QUIZ
// ============================================================
function initQuiz() {
  buildQuiz(document.getElementById('quizBox'), [
    {
      q: 'ברשת אקולוגית, מה מייצגת "קשת" (link)?',
      opts: ['מין בודד במערכת', 'קשר או אינטראקציה בין שני צמתים', 'מספר הפרטים באוכלוסייה', 'רמה טרופית'],
      correct: 1,
      feedback: 'צומת = יחידה (מין/פרט/כתם); קשת = הקשר בין שני צמתים (טריפה, האבקה, הדבקה וכו\').'
    },
    {
      q: 'מה מהבאים משפיע על הסבירות שנצפה באינטראקציה בין שני מינים?',
      opts: [
        'רק השפע היחסי של המינים',
        'רק התאמת התכונות (למשל אורך מקור מול עומק פרח)',
        'שפע, עיתוי (פנולוגיה) והתאמת תכונות — כולם יחד',
        'אף אחד מהם — אינטראקציות הן אקראיות'
      ],
      correct: 2,
      feedback: 'מה שאנחנו מודדים ברשת הוא תוצר של כמה מסננים: שפע (מי נפגש עם מי), עיתוי (מי פעיל מתי) והתאמת תכונות (מי "מתאים" למי).'
    },
    {
      q: 'רשת צמח–מאביק היא דוגמה קלאסית לרשת דו-צדדית (bipartite). מה מאפיין אותה?',
      opts: [
        'כל הצמתים מאותו סוג ומחוברים זה לזה',
        'שתי קבוצות נפרדות של צמתים, וקשתות קיימות רק בין הקבוצות',
        'לכל קשת יש בהכרח כיוון',
        'אין בה יותר מקשת אחת לכל צומת'
      ],
      correct: 1,
      feedback: 'ברשת דו-צדדית יש שתי קבוצות (למשל צמחים ומאביקים), וקשתות מחברות רק בין הקבוצות — אף פעם לא בתוך אותה קבוצה. מייצגים אותה במטריצת שכיחות מלבנית M×N.'
    },
    {
      q: 'מהי "דרגה" (degree, k) של צומת?',
      opts: ['סכום עוצמות כל האינטראקציות ברשת', 'מספר הקשתות שיש לאותו צומת', 'מספר הצמתים ברשת', 'המרחק לצומת המרכזי'],
      correct: 1,
      feedback: 'דרגה (k) = מספר הקשתות של צומת. ברשת מכוונת מבחינים בין דרגה נכנסת ויוצאת; ברשת משוקללת המקבילה היא "עוצמה" (strength, s) — סכום ערכי הקשתות.'
    },
    {
      q: 'במטריצת שכנוּת (adjacency) של רשת לא-מכוונת, מה נכון?',
      opts: [
        'המטריצה תמיד אסימטרית',
        'המטריצה סימטרית: a<sub>ij</sub> = a<sub>ji</sub>, וכל קשת מופיעה פעמיים',
        'יש בה ערכים רק על האלכסון',
        'לא ניתן לייצג רשת לא-מכוונת כמטריצה'
      ],
      correct: 1,
      feedback: 'ברשת לא-מכוונת הקשר סימטרי, ולכן a<sub>ij</sub>=a<sub>ji</sub> — כל קשת מופיעה פעמיים (מעל ומתחת לאלכסון). ברשת מכוונת המטריצה יכולה להיות אסימטרית.'
    },
    {
      q: 'מהי רשת רב-שכבתית (multilayer network)?',
      opts: [
        'רשת עם יותר מ-100 צמתים',
        'ייצוג של כמה סוגי אינטראקציה / זמנים / מקומות יחד, עם קשתות בין-שכבתיות',
        'רשת שאין בה קשתות',
        'רשת דו-צדדית בלבד'
      ],
      correct: 1,
      feedback: 'רשת רב-שכבתית מאגדת כמה שכבות (למשל סוגי אינטראקציה שונים, עונות או אתרים) עם קשתות בין-שכבתיות. לחקירה אינטראקטיבית ראו את הכלי MiRA שבנושא 4.'
    }
  ]);
}

// ============================================================
// PAGE INIT
// ============================================================
renderSiteNav();
renderSubnav();
loadExample();
render3();
initQuiz();
