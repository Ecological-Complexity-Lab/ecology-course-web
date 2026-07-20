// ============================================================
// CLASS 4 — ECOLOGICAL NETWORKS
// showPage(), makeChart(), buildQuiz(), renderSiteNav/Subnav() are
// shared — see js/common.js. This file wires the four interactives:
//   1. network ⇄ matrix builder            (topic 3)
//   2. trophic cascade                      (topic 4)
//   3. connectance calc + structure matrices+ robustness sim  (topic 5)
//   4. self-check quiz                      (topic 6)
// The lesson is conceptual: no heavy math, just the ideas.
// ============================================================

const TEAL = '#0f6e56', AMBER = '#ba7517', CORAL = '#993c1d', PURPLE = '#534ab7';

// ============================================================
// TOPIC 3 — NETWORK ⇄ MATRIX
// A 5-node uni-partite network kept in an adjacency matrix. Clicking
// a matrix cell toggles the link; the SVG redraws; degrees update.
// aij holds a weight 0..3 (binary mode clamps to 0/1).
// ============================================================
const NET_N = 5;
let netAdj = Array.from({ length: NET_N }, () => Array(NET_N).fill(0));
let netDirected = false;
let netWeighted = false;

// node positions on a circle in a 260×260 viewBox
const NET_POS = (() => {
  const cx = 130, cy = 130, r = 92, out = [];
  for (let k = 0; k < NET_N; k++) {
    const a = (-90 + k * (360 / NET_N)) * Math.PI / 180;
    out.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  }
  return out;
})();

function netWidth(w) { return netWeighted ? (w === 1 ? 2 : w === 2 ? 4 : 6) : 3; }

function renderNet() {
  const R = 18;
  let edges = '';
  const seen = new Set();
  for (let i = 0; i < NET_N; i++) for (let j = 0; j < NET_N; j++) {
    if (i === j || netAdj[i][j] <= 0) continue;
    if (!netDirected) { if (i > j) continue; }  // draw each undirected pair once
    const a = NET_POS[i], b = NET_POS[j];
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    if (netDirected) {
      // shorten both ends so the arrowhead sits at the node edge
      const x1 = a.x + ux * R, y1 = a.y + uy * R;
      const x2 = b.x - ux * (R + 6), y2 = b.y - uy * (R + 6);
      edges += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${TEAL}" stroke-width="${netWidth(netAdj[i][j])}" marker-end="url(#netArrow)"/>`;
    } else {
      edges += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${TEAL}" stroke-width="${netWidth(netAdj[i][j])}"/>`;
    }
  }
  let nodes = '';
  for (let k = 0; k < NET_N; k++) {
    const p = NET_POS[k];
    nodes += `<circle cx="${p.x}" cy="${p.y}" r="${R}" fill="#cfe9e0" stroke="${TEAL}" stroke-width="2.5"/>` +
             `<text x="${p.x}" y="${p.y + 5}" font-size="14" fill="${TEAL}" text-anchor="middle" font-weight="600">${k + 1}</text>`;
  }
  document.getElementById('netSvg').innerHTML =
    `<defs><marker id="netArrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="${TEAL}"/></marker></defs>` +
    edges + nodes;
}

function renderAdj() {
  let html = '<thead><tr><th></th>';
  for (let j = 0; j < NET_N; j++) html += `<th>${j + 1}</th>`;
  html += '</tr></thead><tbody>';
  for (let i = 0; i < NET_N; i++) {
    html += `<tr><th>${i + 1}</th>`;
    for (let j = 0; j < NET_N; j++) {
      if (i === j) { html += `<td class="cell diag">–</td>`; continue; }
      const w = netAdj[i][j];
      const on = w > 0;
      const wc = netWeighted && on ? ` w${Math.min(w, 3)}` : '';
      const val = netWeighted ? w : (on ? 1 : 0);
      html += `<td class="cell ${on ? 'on' : 'off'}${wc}" onclick="netCell(${i},${j})">${val}</td>`;
    }
    html += '</tr>';
  }
  document.getElementById('adjTable').innerHTML = html + '</tbody>';
}

function netCell(i, j) {
  if (i === j) return;
  if (netWeighted) netAdj[i][j] = (netAdj[i][j] + 1) % 4;       // cycle 0→1→2→3→0
  else netAdj[i][j] = netAdj[i][j] > 0 ? 0 : 1;                 // toggle
  if (!netDirected) netAdj[j][i] = netAdj[i][j];               // mirror
  renderNet(); renderAdj(); renderDegrees();
}

function renderDegrees() {
  let chips = '';
  let totalLinks = 0;
  for (let i = 0; i < NET_N; i++) for (let j = 0; j < NET_N; j++) {
    if (i === j || netAdj[i][j] <= 0) continue;
    if (netDirected) totalLinks++; else if (i < j) totalLinks++;
  }
  for (let k = 0; k < NET_N; k++) {
    let txt;
    if (netWeighted) {
      let s = 0;
      for (let j = 0; j < NET_N; j++) { if (j !== k) s += netAdj[k][j]; if (netDirected && j !== k) s += 0; }
      if (netDirected) {
        let sin = 0, sout = 0;
        for (let j = 0; j < NET_N; j++) { if (j === k) continue; sout += netAdj[k][j]; sin += netAdj[j][k]; }
        txt = `צומת ${k + 1}: s<sub>in</sub>=${sin}, s<sub>out</sub>=${sout}`;
      } else txt = `צומת ${k + 1}: strength=${s}`;
    } else {
      if (netDirected) {
        let din = 0, dout = 0;
        for (let j = 0; j < NET_N; j++) { if (j === k) continue; if (netAdj[k][j] > 0) dout++; if (netAdj[j][k] > 0) din++; }
        txt = `צומת ${k + 1}: in=${din}, out=${dout}`;
      } else {
        let d = 0;
        for (let j = 0; j < NET_N; j++) if (j !== k && netAdj[k][j] > 0) d++;
        txt = `צומת ${k + 1}: k=${d}`;
      }
    }
    chips += `<span class="deg-chip">${txt}</span>`;
  }
  document.getElementById('degList').innerHTML = chips;

  const modeBits = [];
  modeBits.push(netWeighted ? '<strong>משוקללת</strong> (עוצמה לכל קשת)' : '<strong>בינארית</strong> (קיים/לא קיים)');
  modeBits.push(netDirected ? '<strong>מכוונת</strong> (המטריצה אסימטרית)' : '<strong>לא-מכוונת</strong> (המטריצה סימטרית: a<sub>ij</sub>=a<sub>ji</sub>)');
  const degName = netWeighted ? (netDirected ? 'עוצמה נכנסת/יוצאת' : 'עוצמה (strength)') : (netDirected ? 'דרגה נכנסת/יוצאת (in/out-degree)' : 'דרגה (degree)');
  document.getElementById('netExplain').innerHTML =
    `הרשת כרגע ${modeBits.join(' · ')}. סה"כ ${totalLinks} קשתות. ` +
    `מדד רמת-הצומת המתאים כאן הוא <strong>${degName}</strong> — ראו את הצ'יפים למעלה. ` +
    (netDirected ? 'שימו לב שקשת i→j אינה גוררת קשת j→i.' : 'כל קשת מופיעה פעמיים במטריצה (מעל ומתחת לאלכסון).');
}

function toggleNetOpt(opt) {
  if (opt === 'directed') {
    netDirected = !netDirected;
    if (!netDirected) {  // symmetrize on switching to undirected
      for (let i = 0; i < NET_N; i++) for (let j = i + 1; j < NET_N; j++) {
        const v = Math.max(netAdj[i][j], netAdj[j][i]);
        netAdj[i][j] = netAdj[j][i] = v;
      }
    }
    const b = document.getElementById('tgDir');
    b.textContent = netDirected ? 'מכוון ✓' : 'לא-מכוון';
    b.className = netDirected ? 'btn' : 'btn secondary';
  } else if (opt === 'weighted') {
    netWeighted = !netWeighted;
    if (!netWeighted) {  // clamp to binary
      for (let i = 0; i < NET_N; i++) for (let j = 0; j < NET_N; j++) if (netAdj[i][j] > 0) netAdj[i][j] = 1;
    }
    const b = document.getElementById('tgW');
    b.textContent = netWeighted ? 'משוקלל ✓' : 'בינארי';
    b.className = netWeighted ? 'btn' : 'btn secondary';
  }
  renderNet(); renderAdj(); renderDegrees();
}

function loadNetPreset(name) {
  netAdj = Array.from({ length: NET_N }, () => Array(NET_N).fill(0));
  const link = (i, j) => { netAdj[i][j] = 1; if (!netDirected) netAdj[j][i] = 1; };
  if (name === 'star') { for (let j = 1; j < NET_N; j++) link(0, j); }
  else if (name === 'chain') { for (let i = 0; i < NET_N - 1; i++) link(i, i + 1); }
  // 'clear' leaves it empty
  renderNet(); renderAdj(); renderDegrees();
}

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
// TOPIC 5a — CONNECTANCE CALCULATOR
// ============================================================
function updateConnectance() {
  const S = +document.getElementById('cnS').value;
  const cnL = document.getElementById('cnL');
  const maxL = S * (S - 1) / 2;
  cnL.max = maxL;
  if (+cnL.value > maxL) cnL.value = maxL;
  const L = +cnL.value;
  const C = maxL > 0 ? L / maxL : 0;
  const k = 2 * L / S;
  document.getElementById('cnSval').textContent = S;
  document.getElementById('cnLval').textContent = L;
  document.getElementById('cnMax').textContent = maxL;
  document.getElementById('cnC').textContent = C.toFixed(2);
  document.getElementById('cnK').textContent = k.toFixed(1);
  const dense = C > 0.5 ? 'צפופה מאוד — כמעט כל צמד צמתים מחובר' : C > 0.2 ? 'בעלת קישוריות בינונית' : 'דלילה — מעט אינטראקציות ביחס לפוטנציאל';
  document.getElementById('cnExplain').innerHTML =
    `עם ${S} צמתים יש עד ${maxL} קשתות אפשריות. הרשת ${dense} (C = ${C.toFixed(2)}). ` +
    `<strong>קישוריות</strong> היא מדד רמת-רשת בסיסי: היא משפיעה על זרימת אנרגיה, על התפשטות הפרעות ועל היציבות. רשתות אקולוגיות אמיתיות נוטות להיות דלילות יחסית.`;
}

// ============================================================
// TOPIC 5b — NESTED vs MODULAR structure matrices (illustration)
// ============================================================
function renderStructMatrices() {
  const N = 6, s = 19, ox = 38, oy = 6;
  const rect = (x, y, fill) => `<rect x="${x}" y="${y}" width="${s - 2}" height="${s - 2}" rx="2" fill="${fill}"/>`;
  let nested = '', modular = '';
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const x = ox + j * s, y = oy + i * s;
    nested += rect(x, y, (j < N - i) ? TEAL : '#e6ece8');
    modular += rect(x, y, (Math.floor(i / 2) === Math.floor(j / 2)) ? PURPLE : '#eae9f4');
  }
  document.getElementById('nestedMat').innerHTML = nested;
  document.getElementById('modularMat').innerHTML = modular;
}

// ============================================================
// TOPIC 5c — ROBUSTNESS SIMULATOR
// Bipartite: 6 animals (pollinators) × 5 plants. Remove animals;
// a plant goes secondarily extinct once it loses all its pollinators.
// Compare removal orders (random / most-connected / least-connected).
// ============================================================
// incidence[animal][plant] — a nested structure (A0 = generalist)
const robInc = [
  [1, 1, 1, 1, 1],  // A0 visits all 5 plants
  [1, 1, 1, 1, 0],  // A1
  [1, 1, 1, 0, 0],  // A2
  [1, 1, 0, 0, 0],  // A3
  [1, 0, 0, 0, 0],  // A4 (specialist)
  [1, 0, 0, 0, 0],  // A5 (specialist)
];
const ROB_A = 6, ROB_P = 5;
const robDeg = robInc.map(r => r.reduce((a, b) => a + b, 0));
const robMostOrder = [...Array(ROB_A).keys()].sort((a, b) => robDeg[b] - robDeg[a]);   // desc
const robLeastOrder = [...Array(ROB_A).keys()].sort((a, b) => robDeg[a] - robDeg[b]);  // asc
let robRandomOrder = shuffle([...Array(ROB_A).keys()]);
let robStrat = 'random';

// positions
const robAX = i => 28 + i * 49;   // 6 animals: 28..273
const robPX = p => 46 + p * 52;   // 5 plants:  46..254
const ROB_AY = 48, ROB_PY = 178, ROB_AR = 13, ROB_PS = 26;

function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; }

function robOrder() { return robStrat === 'most' ? robMostOrder : robStrat === 'least' ? robLeastOrder : robRandomOrder; }

function robSurvivingPlants(removed) {
  const survive = [];
  for (let p = 0; p < ROB_P; p++) {
    let has = false;
    for (let a = 0; a < ROB_A; a++) if (!removed.has(a) && robInc[a][p]) { has = true; break; }
    survive.push(has);
  }
  return survive;
}

function robCurve(order) {
  const arr = [];
  for (let k = 0; k <= ROB_A; k++) {
    const removed = new Set(order.slice(0, k));
    const surv = robSurvivingPlants(removed).filter(Boolean).length;
    arr.push(surv / ROB_P);
  }
  return arr;
}

function renderRobSvg(removedSet, plantSurvive) {
  let links = '', animals = '', plants = '';
  for (let a = 0; a < ROB_A; a++) for (let p = 0; p < ROB_P; p++) {
    if (!robInc[a][p]) continue;
    const faded = removedSet.has(a);
    links += `<line x1="${robAX(a)}" y1="${ROB_AY + ROB_AR}" x2="${robPX(p)}" y2="${ROB_PY - ROB_PS / 2}" stroke="${faded ? '#dcdcdc' : '#8a8a8a'}" stroke-width="${faded ? 1 : 2}"/>`;
  }
  for (let a = 0; a < ROB_A; a++) {
    const gone = removedSet.has(a);
    animals += `<circle cx="${robAX(a)}" cy="${ROB_AY}" r="${ROB_AR}" fill="${gone ? '#dddddd' : '#f0a830'}" stroke="${gone ? '#bbb' : AMBER}" stroke-width="2"/>`;
    if (gone) animals += `<text x="${robAX(a)}" y="${ROB_AY + 5}" font-size="15" fill="#c0392b" text-anchor="middle" font-weight="700">✕</text>`;
  }
  for (let p = 0; p < ROB_P; p++) {
    const alive = plantSurvive[p];
    plants += `<rect x="${robPX(p) - ROB_PS / 2}" y="${ROB_PY - ROB_PS / 2}" width="${ROB_PS}" height="${ROB_PS}" rx="4" fill="${alive ? '#7bc47f' : '#dddddd'}" stroke="${alive ? TEAL : '#bbb'}" stroke-width="2"/>`;
    if (!alive) plants += `<text x="${robPX(p)}" y="${ROB_PY + 5}" font-size="14" fill="#c0392b" text-anchor="middle" font-weight="700">✕</text>`;
  }
  document.getElementById('robSvg').innerHTML =
    links + animals + plants +
    `<text x="150" y="18" font-size="11" fill="${AMBER}" text-anchor="middle" font-weight="600">מאביקים</text>` +
    `<text x="150" y="216" font-size="11" fill="${TEAL}" text-anchor="middle" font-weight="600">צמחים</text>`;
}

function robDrawChart(k) {
  const most = robCurve(robMostOrder), least = robCurve(robLeastOrder), rnd = robCurve(robRandomOrder);
  const labels = [...Array(ROB_A + 1).keys()];
  const pr = (isActive) => labels.map((_, i) => (isActive && i === k) ? 7 : 0);
  const mk = (data, color, dash, strat) => ({
    label: strat === 'most' ? 'מהמקושר ביותר' : strat === 'least' ? 'מהמקושר פחות' : 'אקראי',
    data, borderColor: color, backgroundColor: color,
    borderWidth: robStrat === strat ? 3.5 : 1.5, borderDash: dash,
    pointRadius: pr(robStrat === strat), pointBackgroundColor: color, tension: 0.2
  });
  makeChart('robustChart', {
    type: 'line',
    data: { labels, datasets: [mk(most, CORAL, [], 'most'), mk(least, TEAL, [], 'least'), mk(rnd, AMBER, [6, 4], 'random')] },
    options: {
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 14, font: { size: 11 } } } },
      scales: {
        y: { beginAtZero: true, max: 1.05, title: { display: true, text: 'שבר הצמחים ששרדו' } },
        x: { title: { display: true, text: 'מאביקים שהוסרו' } }
      }
    }
  });
}

function updateRobust() {
  const k = +document.getElementById('robK').value;
  document.getElementById('robKval').textContent = k;
  const order = robOrder();
  const removed = new Set(order.slice(0, k));
  const survive = robSurvivingPlants(removed);
  const nPlants = survive.filter(Boolean).length;
  renderRobSvg(removed, survive);
  robDrawChart(k);
  document.getElementById('robAnimals').textContent = `${ROB_A - k} / ${ROB_A}`;
  document.getElementById('robPlants').textContent = `${nPlants} / ${ROB_P}`;
  const stratTxt = robStrat === 'most'
    ? 'הסרה <strong>ממוקדת</strong> של הגנרליסטים (המקושרים ביותר) — האסטרטגיה ההרסנית ביותר: כבר בהסרות הראשונות צמחים מאבדים את כל שותפיהם ונכחדים.'
    : robStrat === 'least'
    ? 'הסרה של ה<strong>ספציאליסטים</strong> (המקושרים פחות) קודם — הרשת עמידה במיוחד, כי הגנרליסט ששומר על כל הצמחים נשאר עד הסוף.'
    : 'הסרה <strong>אקראית</strong> — התוצאה בדרך כלל בין שתי האסטרטגיות האחרות. לחצו שוב על "אקראי" לערבוב מחדש וראו כיצד הסדר משנה את העקומה.';
  document.getElementById('robExplain').innerHTML =
    stratTxt + ` כרגע הוסרו ${k} מאביקים, ו-${nPlants} מתוך ${ROB_P} צמחים שרדו. ` +
    'העקומה המודגשת היא האסטרטגיה הנבחרת; הנקודה הגדולה מסמנת את המצב הנוכחי.';
}

function setRobustStrat(strat) {
  if (strat === 'random') robRandomOrder = shuffle([...Array(ROB_A).keys()]);  // reshuffle each click
  robStrat = strat;
  document.querySelectorAll('.robust-strat').forEach(b => b.classList.toggle('active', b.dataset.strat === strat));
  updateRobust();
}

// ============================================================
// TOPIC 6 — SELF-CHECK QUIZ
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
      q: 'מהי "דרגה" (degree) של צומת?',
      opts: ['סכום עוצמות כל האינטראקציות ברשת', 'מספר הקשתות שיש לאותו צומת', 'מספר הצמתים ברשת', 'המרחק לצומת המרכזי'],
      correct: 1,
      feedback: 'דרגה = מספר הקשתות של צומת. ברשת מכוונת מבחינים בין דרגה נכנסת ויוצאת; ברשת משוקללת המקבילה היא "עוצמה" (strength) — סכום ערכי הקשתות.'
    },
    {
      q: 'הוסר טורף עליון והדבר גרם לפריחת אוכלוסיית הטרף שלו ולקריסת הצומח שהטרף אוכל. איך נקרא התהליך?',
      opts: ['תחרות בין-מינית', 'מפל טרופי (trophic cascade)', 'קינון', 'חיווט מחדש'],
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
      q: 'בסימולטור הרובוסטיות, איזו אסטרטגיית הסרה גרמה לקריסה המהירה ביותר של הצמחים?',
      opts: ['הסרה אקראית', 'הסרת המאביקים המקושרים פחות קודם', 'הסרת המאביקים המקושרים ביותר (הגנרליסטים) קודם', 'כל האסטרטגיות זהות'],
      correct: 2,
      feedback: 'הסרה ממוקדת של הגנרליסטים היא ההרסנית ביותר — הם "מחזיקים" צמחים רבים, וצמח שנשען רק עליהם נכחד מיד. הסרה אקראית פחות הרסנית, והסרת ספציאליסטים קודם — הכי פחות.'
    },
    {
      q: 'מהו "הפרדוקס של מיי" (May 1972) בנוגע ליחס מגוון–יציבות?',
      opts: [
        'מגוון גבוה תמיד מגדיל יציבות, כפי שחשבו',
        'במודל של רשת אקראית, מגוון גבוה דווקא מקטין את היציבות',
        'מגוון אינו קשור כלל ליציבות',
        'רק רשתות דו-צדדיות יכולות להיות יציבות'
      ],
      correct: 1,
      feedback: 'בניגוד לאינטואיציה, ניתוח של מטריצות אקראיות הראה שמגוון וקישוריות גבוהים מקטינים יציבות. הפתרון: רשתות טבעיות אינן אקראיות — מבנה (מודולריות, קינון) מחזיר יציבות.'
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
      feedback: 'רשת רב-שכבתית מאגדת כמה שכבות (למשל סוגי אינטראקציה שונים, עונות או אתרים) עם קשתות בין-שכבתיות. לחקירה אינטראקטיבית ראו את הכלי MiRA שבנושא 6.'
    }
  ]);
}

// ============================================================
// PAGE INIT
// ============================================================
renderSiteNav();
renderSubnav();
renderNet();
renderAdj();
renderDegrees();
drawCascade();
updateConnectance();
renderStructMatrices();
updateRobust();
initQuiz();
