// ============================================================
// CLASS 4 — ECOLOGICAL NETWORKS
// showPage(), makeChart(), buildQuiz(), renderSiteNav/Subnav() are
// shared — see js/common.js. This file wires the interactives:
//   1. network ⇄ matrix builder  (topic 3) — uni/bi + slide toggles
//   2. trophic cascade           (topic 4)
//   3. self-check quiz           (topic 5)
// The lesson is conceptual: no heavy math, just the ideas.
// ============================================================

const TEAL = '#0f6e56', AMBER = '#ba7517', CORAL = '#993c1d', PURPLE = '#534ab7';

// ============================================================
// TOPIC 3 — NETWORK ⇄ MATRIX BUILDER
// Two modes:
//   uni : 5-node uni-partite adjacency matrix (N×N)
//   bi  : 4 pollinators × 3 plants incidence matrix (M×N)
// Slide toggles switch uni/bi, binary/weighted, undirected/directed.
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
  if (netWeighted) { uniAdj[0][1] = uniAdj[1][0] = 2; biInc[0][0] = 3; }  // a little variety when weighted
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
    links += `<line x1="${BI_AX[a]}" y1="${BI_AY + BI_AR}" x2="${BI_PX[p]}" y2="${BI_PY - BI_PS / 2}" stroke="${TEAL}" stroke-width="${netWidth(biInc[a][p])}"/>`;
  }
  let nodes = '';
  for (let a = 0; a < BI_A; a++)
    nodes += `<circle cx="${BI_AX[a]}" cy="${BI_AY}" r="${BI_AR}" fill="#faeeda" stroke="${AMBER}" stroke-width="2.5"/>` +
             `<text x="${BI_AX[a]}" y="${BI_AY + 4}" font-size="12" fill="${AMBER}" text-anchor="middle" font-weight="600">${a + 1}</text>`;
  for (let p = 0; p < BI_P; p++)
    nodes += `<rect x="${BI_PX[p] - BI_PS / 2}" y="${BI_PY - BI_PS / 2}" width="${BI_PS}" height="${BI_PS}" rx="4" fill="#e1f5ee" stroke="${TEAL}" stroke-width="2.5"/>` +
             `<text x="${BI_PX[p]}" y="${BI_PY + 4}" font-size="12" fill="${TEAL}" text-anchor="middle" font-weight="600">${p + 1}</text>`;
  document.getElementById('netSvg').innerHTML = links + nodes +
    `<text x="140" y="20" font-size="11.5" fill="${AMBER}" text-anchor="middle" font-weight="600">מאביקים (pollinators)</text>` +
    `<text x="140" y="232" font-size="11.5" fill="${TEAL}" text-anchor="middle" font-weight="600">צמחים (plants)</text>`;
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
    for (let p = 0; p < BI_P; p++) html += `<th>צמח${p + 1}</th>`;
    html += '</tr></thead><tbody>';
    for (let a = 0; a < BI_A; a++) {
      html += `<tr><th>מאביק${a + 1}</th>`;
      for (let p = 0; p < BI_P; p++) html += cellHtml(biInc[a][p], `biCell(${a},${p})`);
      html += '</tr>';
    }
    t.innerHTML = html + '</tbody>';
    document.getElementById('adjHint').innerHTML = 'שורה = מאביק · עמודה = צמח &nbsp;·&nbsp; לחצו על תא לשינוי';
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
  if (netMode === 'uni') {
    for (let k = 0; k < UNI_N; k++) {
      if (netWeighted) {
        if (netDirected) {
          let sin = 0, sout = 0;
          for (let j = 0; j < UNI_N; j++) { if (j === k) continue; sout += uniAdj[k][j]; sin += uniAdj[j][k]; }
          chips += chip(`צומת ${k + 1}: s<sub>in</sub>=${sin}, s<sub>out</sub>=${sout}`);
        } else {
          let s = 0; for (let j = 0; j < UNI_N; j++) if (j !== k) s += uniAdj[k][j];
          chips += chip(`צומת ${k + 1}: s=${s}`);
        }
      } else {
        if (netDirected) {
          let din = 0, dout = 0;
          for (let j = 0; j < UNI_N; j++) { if (j === k) continue; if (uniAdj[k][j] > 0) dout++; if (uniAdj[j][k] > 0) din++; }
          chips += chip(`צומת ${k + 1}: k<sub>in</sub>=${din}, k<sub>out</sub>=${dout}`);
        } else {
          let d = 0; for (let j = 0; j < UNI_N; j++) if (j !== k && uniAdj[k][j] > 0) d++;
          chips += chip(`צומת ${k + 1}: k=${d}`);
        }
      }
    }
  } else {
    for (let a = 0; a < BI_A; a++) {
      const arr = biInc[a];
      const val = netWeighted ? arr.reduce((x, y) => x + y, 0) : arr.filter(v => v > 0).length;
      chips += chip(`מאביק ${a + 1}: ${netWeighted ? 's' : 'k'}=${val}`, AMBER);
    }
    for (let p = 0; p < BI_P; p++) {
      let val = 0; for (let a = 0; a < BI_A; a++) val += netWeighted ? biInc[a][p] : (biInc[a][p] > 0 ? 1 : 0);
      chips += chip(`צמח ${p + 1}: ${netWeighted ? 's' : 'k'}=${val}`, TEAL);
    }
  }
  document.getElementById('degList').innerHTML = chips;

  // legend — define exactly the symbols shown
  const bits = ['<b>k</b> = דרגה (degree) — מספר הקשתות של הצומת.'];
  if (netWeighted) bits.push('<b>s</b> = strength (עוצמה) — סכום משקלי הקשתות של הצומת (במקום ספירה, סוכמים ערכים).');
  if (netMode === 'uni' && netDirected) bits.push('<b>in</b>/<b>out</b> = דרגה נכנסת/יוצאת — כמה קשתות מצביעות <em>אל</em> הצומת וכמה <em>ממנו</em>.');
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
    document.getElementById('netExplain').innerHTML =
      `רשת <strong>דו-צדדית (bipartite)</strong>, ${netWeighted ? '<strong>משוקללת</strong>' : '<strong>בינארית</strong>'}. ` +
      `המטריצה מלבנית ${BI_A}×${BI_P} (מטריצת שכיחות / incidence): שורות = מאביקים, עמודות = צמחים. סה"כ ${links} קשתות. ` +
      'קשתות קיימות רק <em>בין</em> שתי הקבוצות — אף פעם לא בתוך אותה קבוצה, ולכן אין אלכסון.';
  }
}

function render3() { (netMode === 'uni' ? renderUniSvg : renderBiSvg)(); renderMatrix(); renderDeg(); renderExplain(); }

// ---------- toggles ----------
function setActive(offId, onId, isOn) {
  document.getElementById(offId).classList.toggle('active', !isOn);
  document.getElementById(onId).classList.toggle('active', isOn);
}

function setPartite(checked) {
  netMode = checked ? 'bi' : 'uni';
  setActive('lblUni', 'lblBi', checked);
  // directed is meaningful only for uni-partite networks
  const sw = document.getElementById('swDir');
  if (netMode === 'bi') {
    netDirected = false; sw.checked = false; sw.disabled = true;
    setActive('lblUndir', 'lblDir', false);
    document.getElementById('lblUndir').classList.add('dim');
    document.getElementById('lblDir').classList.add('dim');
  } else {
    sw.disabled = false;
    document.getElementById('lblUndir').classList.remove('dim');
    document.getElementById('lblDir').classList.remove('dim');
  }
  render3();
}

function setWeighted(checked) {
  netWeighted = checked;
  setActive('lblBin', 'lblW', checked);
  if (!netWeighted) {  // clamp everything back to 0/1
    [uniAdj, biInc].forEach(m => m.forEach(row => row.forEach((v, i) => { if (v > 0) row[i] = 1; })));
  }
  render3();
}

function setDirected(checked) {
  if (netMode === 'bi') return;
  netDirected = checked;
  setActive('lblUndir', 'lblDir', checked);
  if (!netDirected) {  // symmetrize
    for (let i = 0; i < UNI_N; i++) for (let j = i + 1; j < UNI_N; j++) {
      const v = Math.max(uniAdj[i][j], uniAdj[j][i]); uniAdj[i][j] = uniAdj[j][i] = v;
    }
  }
  render3();
}

function resetNet() { loadExample(); render3(); }

// ============================================================
// TOPIC 4 — TROPHIC CASCADE (otter → urchin → kelp)
// ============================================================
let cascadeRemoved = false;

function drawCascade() {
  const on = !cascadeRemoved;
  const otter = on ? 60 : 0, urchin = on ? 25 : 92, kelp = on ? 85 : 12;
  makeChart('cascadeChart', {
    type: 'bar',
    data: {
      labels: ['🦦 לוטרות ים', '🦔 קיפודי ים', '🌿 יער אצות'],
      datasets: [{ label: 'שפע יחסי', data: [otter, urchin, kelp], backgroundColor: [CORAL, AMBER, TEAL], borderRadius: 6 }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, max: 100, title: { display: true, text: 'שפע יחסי' } } }
    }
  });
  document.getElementById('cascadeExplain').innerHTML = on
    ? '<strong>מצב תקין:</strong> הלוטרות טורפות את קיפודי הים ושומרות על אוכלוסייתם נמוכה — כך שיער האצות משגשג. שימו לב: הלוטרה משפיעה על האצות <em>בעקיפין</em>, דרך רמה טרופית אחת באמצע. זהו ויסות <em>מלמעלה למטה</em>.'
    : '<strong>מפל טרופי!</strong> ללא הלוטרות, קיפודי הים מתרבים ללא בקרה וכורתים את יער האצות עד להיעלמותו. השפעת הטורף העליון "מחלחלת" שתי רמות מטה ומשנה את בית-הגידול כולו — דוגמה קלאסית של מפל טרופי (Estes et al.).';
}

function toggleCascade() {
  cascadeRemoved = !cascadeRemoved;
  document.getElementById('cascBtn').textContent = cascadeRemoved ? '🔄 החזירו את הלוטרות' : '🗑️ הסירו את הלוטרות';
  drawCascade();
}
function resetCascade() {
  cascadeRemoved = false;
  document.getElementById('cascBtn').textContent = '🗑️ הסירו את הלוטרות';
  drawCascade();
}

// ============================================================
// TOPIC 5 — SELF-CHECK QUIZ
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
      q: 'הוסר טורף עליון והדבר גרם לפריחת אוכלוסיית הטרף שלו ולקריסת הצומח שהטרף אוכל. איך נקרא התהליך?',
      opts: ['תחרות בין-מינית', 'מפל טרופי (trophic cascade)', 'קינון', 'ויסות מלמטה למעלה'],
      correct: 1,
      feedback: 'מפל טרופי: השפעת הטורף "מחלחלת" מטה דרך רמה טרופית נוספת ומשנה את שפע/התנהגות הטרף-של-הטרף (למשל לוטרה→קיפוד ים→אצות).'
    },
    {
      q: 'מהו ההבדל בין "מין מפתח" (keystone) ל"מין דומיננטי"?',
      opts: [
        'אין הבדל — אלו שמות שונים לאותו דבר',
        'מין מפתח משפיע באופן לא-פרופורציונלי לביומסה שלו; מין דומיננטי משפיע בזכות ביומסה גבוהה',
        'מין מפתח הוא תמיד הנפוץ ביותר',
        'מין דומיננטי נמצא תמיד בבסיס שרשרת המזון'
      ],
      correct: 1,
      feedback: 'מין מפתח (כמו Pisaster בניסוי של Paine) בעל השפעה עצומה על החברה גם כשהוא נדיר; מין דומיננטי משפיע בזכות שפע/ביומסה גבוהים.'
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
      feedback: 'רשת רב-שכבתית מאגדת כמה שכבות (למשל סוגי אינטראקציה שונים, עונות או אתרים) עם קשתות בין-שכבתיות. לחקירה אינטראקטיבית ראו את הכלי MiRA שבנושא 5.'
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
drawCascade();
initQuiz();
