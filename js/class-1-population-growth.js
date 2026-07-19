// showPage(), linreg() and makeChart() are shared — see js/common.js.

// ============================================================
// REAL DATA FROM THE EXERCISE
// ============================================================
const POP123_GEN = [0, 1, 2, 3, 4, 5, 6];
const POP123 = {
  'אוכלוסייה 1': { data: [12, 22, 59, 77, 225, 588, 1002], color: '#0f6e56' },
  'אוכלוסייה 2': { data: [1392, 957, 502, 461, 301, 164, 113], color: '#993c1d' },
  'אוכלוסייה 3': { data: [556, 534, 552, 559, 543, 548, 555], color: '#534ab7' }
};
const POP4 = [3, 5, 8, 13, 19, 29, 40, 57, 79, 100, 119, 142, 158, 171, 181, 202, 200, 203, 199, 204, 200, 201];
const POP4_GEN = POP4.map((_, i) => i);

let POP4_K = POP4.slice(15, 22).reduce((a, b) => a + b, 0) / 7;
let POP4_R = 0;

// ============================================================
// TOPIC 1: EXPONENTIAL GROWTH SIMULATOR
// ============================================================
function getExpParams() {
  return {
    N0: +document.getElementById('expN0').value,
    r: +document.getElementById('expR').value / 100,
    T: +document.getElementById('expT').value
  };
}

function loadExpPreset(n0, rSlider, t) {
  document.getElementById('expN0').value = n0;
  document.getElementById('expR').value = rSlider;
  document.getElementById('expT').value = t;
  updateExp();
}

function updateExp() {
  const { N0, r, T } = getExpParams();
  document.getElementById('expN0val').textContent = N0;
  document.getElementById('expRval').textContent = r.toFixed(2);
  document.getElementById('expTval').textContent = T;

  const pts = [];
  const steps = 40;
  for (let i = 0; i <= steps; i++) {
    const t = T * i / steps;
    pts.push({ x: t, y: N0 * Math.exp(r * t) });
  }
  const finalN = N0 * Math.exp(r * T);

  makeChart('expChart', {
    type: 'line',
    data: { datasets: [{ label: `Nt = ${N0}·e^(${r.toFixed(2)}·t)`, data: pts, borderColor: '#0f6e56', backgroundColor: 'rgba(15,110,86,0.08)', fill: true, borderWidth: 2.5, pointRadius: 0, tension: 0.15 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { font: { family: 'Heebo', size: 11 } } } },
      scales: {
        x: { type: 'linear', title: { display: true, text: 't (זמן)', font: { family: 'Heebo', size: 12 } } },
        y: { title: { display: true, text: 'גודל האוכלוסייה Nt', font: { family: 'Heebo', size: 12 } }, beginAtZero: true }
      }
    }
  });

  document.getElementById('expCalc').textContent =
    `Nt = N0 · e^(r·t) = ${N0} · e^(${r.toFixed(2)} × ${T}) = ${finalN.toFixed(1)}`;

  const doubling = r !== 0 ? Math.abs(Math.log(2) / r) : Infinity;
  document.getElementById('expExplain').innerHTML = r > 0
    ? `<strong>האוכלוסייה גדלה.</strong> לאחר ${T} שנים היא תמנה כ-<strong>${finalN.toFixed(0)}</strong> פרטים. זמן הכפלה (עד שהאוכלוסייה מכפילה את עצמה): ~${doubling.toFixed(1)} שנים.`
    : r < 0
      ? `<strong>האוכלוסייה קטנה.</strong> לאחר ${T} שנים היא תמנה כ-<strong>${finalN.toFixed(0)}</strong> פרטים. זמן מחצית (עד שהאוכלוסייה מתחצה): ~${doubling.toFixed(1)} שנים.`
      : `<strong>r = 0</strong> — האוכלוסייה נשארת יציבה בגודלה (${N0} פרטים).`;
}

// ============================================================
// TOPIC 2: LN-LINEARIZATION & ESTIMATING r FROM REAL DATA
// ============================================================
function buildPop123Table() {
  const names = Object.keys(POP123);
  let html = '<thead><tr><th>דור</th>' + names.map(n => `<th style="color:${POP123[n].color}">${n}</th>`).join('') + '</tr></thead><tbody>';
  POP123_GEN.forEach((g, i) => {
    html += `<tr><td>${g}</td>` + names.map(n => `<td>${POP123[n].data[i]}</td>`).join('') + '</tr>';
  });
  html += '</tbody>';
  document.getElementById('pop123Table').innerHTML = html;
}

function renderRawAndLnCharts() {
  const names = Object.keys(POP123);
  const rawDatasets = [];
  const lnDatasets = [];
  const rRows = [];

  names.forEach(name => {
    const { data, color } = POP123[name];
    const lnData = data.map(n => Math.log(n));
    const { slope, intercept } = linreg(POP123_GEN, lnData);

    // raw scatter + fitted exponential curve
    rawDatasets.push({
      label: name, data: POP123_GEN.map((g, i) => ({ x: g, y: data[i] })),
      showLine: false, backgroundColor: color, borderColor: color, pointRadius: 5
    });
    const fitPts = [];
    for (let i = 0; i <= 30; i++) {
      const t = 6 * i / 30;
      fitPts.push({ x: t, y: Math.exp(intercept + slope * t) });
    }
    rawDatasets.push({
      label: name + ' (מגמה)', data: fitPts, type: 'line', borderColor: color, backgroundColor: 'transparent',
      borderDash: [5, 3], borderWidth: 1.5, pointRadius: 0, tension: 0
    });

    // ln scatter + linear regression line
    lnDatasets.push({
      label: name, data: POP123_GEN.map((g, i) => ({ x: g, y: lnData[i] })),
      showLine: false, backgroundColor: color, borderColor: color, pointRadius: 5
    });
    lnDatasets.push({
      label: name + ' (קו מגמה)', data: [{ x: 0, y: intercept }, { x: 6, y: intercept + slope * 6 }],
      type: 'line', borderColor: color, backgroundColor: 'transparent', borderWidth: 2, pointRadius: 0
    });

    rRows.push({ name, slope });
  });

  makeChart('rawChart', {
    type: 'scatter',
    data: { datasets: rawDatasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { font: { family: 'Heebo', size: 10 }, boxWidth: 10, filter: (i) => !i.text.includes('מגמה') } } },
      scales: {
        x: { title: { display: true, text: 'דור', font: { family: 'Heebo', size: 12 } } },
        y: { title: { display: true, text: 'גודל אוכלוסייה N', font: { family: 'Heebo', size: 12 } } }
      }
    }
  });

  makeChart('lnChart', {
    type: 'scatter',
    data: { datasets: lnDatasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { font: { family: 'Heebo', size: 10 }, boxWidth: 10, filter: (i) => !i.text.includes('קו מגמה') } } },
      scales: {
        x: { title: { display: true, text: 'דור', font: { family: 'Heebo', size: 12 } } },
        y: { title: { display: true, text: 'ln(N)', font: { family: 'Heebo', size: 12 } } }
      }
    }
  });

  rRows.sort((a, b) => Math.abs(b.slope) - Math.abs(a.slope));
  document.getElementById('rTableBody').innerHTML = rRows.map((row, i) => {
    const trend = row.slope > 0.01 ? 'עולה 📈' : row.slope < -0.01 ? 'יורדת 📉' : 'יציבה ➖';
    return `<tr><td style="color:${POP123[row.name].color};font-weight:600">${row.name}${i === 0 ? ' (המהירה ביותר)' : ''}</td><td>${row.slope.toFixed(3)}</td><td>${trend}</td></tr>`;
  }).join('');

  document.getElementById('rExplain').innerHTML =
    `<strong>${rRows[0].name} משתנה בקצב המהיר ביותר</strong> — |r| הגבוה ביותר (${rRows[0].slope.toFixed(3)}). שיפוע חיובי = גידול, שיפוע שלילי = ירידה, שיפוע קרוב לאפס = יציבות (כפי שרואים באוכלוסייה 3).`;
}

// ============================================================
// TOPIC 3: LOGISTIC GROWTH & CARRYING CAPACITY
// ============================================================
function buildPop4Table() {
  let html = '<thead><tr><th>דור</th>' + POP4_GEN.map(g => `<th>${g}</th>`).join('') + '</tr></thead><tbody><tr><td>N</td>' +
    POP4.map((n, i) => `<td${i >= 15 ? ' style="background:var(--purple-light);font-weight:600"' : ''}>${n}</td>`).join('') + '</tr></tbody>';
  document.getElementById('pop4Table').innerHTML = html;
}

function computeKAndR() {
  const last7 = POP4.slice(15, 22);
  POP4_K = last7.reduce((a, b) => a + b, 0) / 7;
  document.getElementById('kCalc').textContent =
    `K = ממוצע(דורות 15–21) = (${last7.join(' + ')}) / 7 = ${POP4_K.toFixed(2)} ≈ ${Math.round(POP4_K)}`;

  // linearize generations 0-14 with the computed K
  const gens = POP4_GEN.slice(0, 15);
  const ys = gens.map(g => Math.log((POP4_K - POP4[g]) / POP4[g]));
  const { slope, intercept } = linreg(gens, ys);
  POP4_R = -slope;

  const scatter = gens.map((g, i) => ({ x: g, y: ys[i] }));
  const line = [{ x: 0, y: intercept }, { x: 14, y: intercept + slope * 14 }];

  makeChart('logLinChart', {
    type: 'scatter',
    data: {
      datasets: [
        { label: 'ln((K−Nt)/Nt)', data: scatter, backgroundColor: '#534ab7', borderColor: '#534ab7', pointRadius: 5 },
        { label: 'קו מגמה', data: line, type: 'line', borderColor: '#534ab7', backgroundColor: 'transparent', borderWidth: 2, pointRadius: 0 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { font: { family: 'Heebo', size: 11 }, filter: (i) => i.text !== 'קו מגמה' } } },
      scales: {
        x: { title: { display: true, text: 'דור (0–14)', font: { family: 'Heebo', size: 12 } } },
        y: { title: { display: true, text: 'ln((K−Nt)/Nt)', font: { family: 'Heebo', size: 12 } } }
      }
    }
  });

  document.getElementById('logLinExplain').innerHTML =
    `שיפוע הקו הוא <strong>−r</strong>, כלומר r = ${POP4_R.toFixed(3)} ≈ 0.45. יחד עם K ≈ ${Math.round(POP4_K)}, אלו הפרמטרים המלאים של מודל הגידול הלוגיסטי עבור אוכלוסייה 4.`;
}

function getLogParams() {
  return {
    N0: +document.getElementById('logN0').value,
    K: +document.getElementById('logK').value,
    r: +document.getElementById('logR').value / 100,
    T: +document.getElementById('logT').value
  };
}

function loadLogPreset(n0, k, rSlider, t) {
  document.getElementById('logN0').value = n0;
  document.getElementById('logK').value = k;
  document.getElementById('logR').value = rSlider;
  document.getElementById('logT').value = t;
  updateLogistic();
}

function loadLogPresetFromPop4() {
  loadLogPreset(POP4[0], Math.round(POP4_K), Math.round(POP4_R * 100), 21);
}

function updateLogistic() {
  const { N0, K, r, T } = getLogParams();
  document.getElementById('logN0val').textContent = N0;
  document.getElementById('logKval').textContent = K;
  document.getElementById('logRval').textContent = r.toFixed(2);
  document.getElementById('logTval').textContent = T;

  const pts = [];
  const steps = 50;
  for (let i = 0; i <= steps; i++) {
    const t = T * i / steps;
    const Nt = K / (1 + ((K - N0) / N0) * Math.exp(-r * t));
    pts.push({ x: t, y: Nt });
  }
  const finalN = K / (1 + ((K - N0) / N0) * Math.exp(-r * T));

  makeChart('simChart', {
    type: 'line',
    data: {
      datasets: [
        { label: 'Nt', data: pts, borderColor: '#534ab7', backgroundColor: 'rgba(83,74,183,0.08)', fill: true, borderWidth: 2.5, pointRadius: 0, tension: 0.15 },
        { label: 'K', data: [{ x: 0, y: K }, { x: T, y: K }], borderColor: '#ba7517', borderDash: [6, 4], borderWidth: 1.5, pointRadius: 0 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { font: { family: 'Heebo', size: 10 }, boxWidth: 10 } } },
      scales: {
        x: { type: 'linear', title: { display: true, text: 't', font: { family: 'Heebo', size: 11 } } },
        y: { title: { display: true, text: 'N', font: { family: 'Heebo', size: 11 } }, beginAtZero: true, suggestedMax: K * 1.15 }
      }
    }
  });

  const ddPts = [];
  for (let i = 0; i <= 40; i++) {
    const N = K * i / 40;
    ddPts.push({ x: N, y: r * N * (K - N) / K });
  }
  makeChart('ddChart', {
    type: 'line',
    data: { datasets: [{ label: 'dN/dt', data: ddPts, borderColor: '#993c1d', backgroundColor: 'rgba(153,60,29,0.08)', fill: true, borderWidth: 2.5, pointRadius: 0, tension: 0.3 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { font: { family: 'Heebo', size: 10 } } } },
      scales: {
        x: { type: 'linear', title: { display: true, text: 'N', font: { family: 'Heebo', size: 11 } } },
        y: { title: { display: true, text: 'dN/dt', font: { family: 'Heebo', size: 11 } } }
      }
    }
  });

  document.getElementById('logCalc').textContent =
    `Nt = K/(1+((K−N0)/N0)·e^(−r·t)) = ${K}/(1+((${K}−${N0})/${N0})·e^(−${r.toFixed(2)}×${T})) = ${finalN.toFixed(1)}`;
  document.getElementById('logExplain').innerHTML =
    `לאחר ${T} שנים האוכלוסייה צפויה למנות כ-<strong>${finalN.toFixed(0)}</strong> פרטים (מתוך K = ${K}). שימו לב: קצב הגידול dN/dt הוא הגבוה ביותר סביב N = K/2 = ${(K / 2).toFixed(0)}, ויורד לאפס כאשר N מתקרב ל-0 או ל-K.`;
}

// ============================================================
// TOPIC 4: OBSERVED VS EXPECTED
// ============================================================
function renderObsVsExp() {
  const K = 200, r = 0.4532, N0 = 3;
  const expected = POP4_GEN.map(t => ({ x: t, y: K / (1 + ((K - N0) / N0) * Math.exp(-r * t)) }));
  const observed = POP4_GEN.map((t, i) => ({ x: t, y: POP4[i] }));

  makeChart('ovsExpChart', {
    type: 'scatter',
    data: {
      datasets: [
        { label: 'Observed (נצפה)', data: observed, backgroundColor: '#0f6e56', borderColor: '#0f6e56', pointRadius: 5 },
        { label: 'Expected (צפוי ע"י המודל)', data: expected, type: 'line', borderColor: '#993c1d', backgroundColor: 'transparent', borderWidth: 2.5, pointRadius: 0, tension: 0.15 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { font: { family: 'Heebo', size: 11 } } } },
      scales: {
        x: { title: { display: true, text: 'דור', font: { family: 'Heebo', size: 12 } } },
        y: { title: { display: true, text: 'גודל אוכלוסייה', font: { family: 'Heebo', size: 12 } } }
      }
    }
  });
}

// ============================================================
// TOPIC 4: WILD DONKEY (Asiatic wild ass) PROJECTION
// ============================================================
const DONKEY_N0 = 37, DONKEY_R = 0.22;

function updateDonkey() {
  const sources = +document.getElementById('donkeySrc').value;
  const cap = +document.getElementById('donkeyCap').value;
  const t = +document.getElementById('donkeyT').value;
  document.getElementById('donkeySrcVal').textContent = sources;
  document.getElementById('donkeyCapVal').textContent = cap;
  document.getElementById('donkeyTVal').textContent = t;

  const K = sources * cap;
  const nt = (T) => K / (1 + ((K - DONKEY_N0) / DONKEY_N0) * Math.exp(-DONKEY_R * T));

  const pts = [];
  for (let i = 0; i <= 60; i++) pts.push({ x: i, y: nt(i) });
  const current = nt(t);

  makeChart('donkeyChart', {
    type: 'line',
    data: {
      datasets: [
        { label: 'גודל אוכלוסייה', data: pts, borderColor: '#993c1d', backgroundColor: 'rgba(153,60,29,0.08)', fill: true, borderWidth: 2.5, pointRadius: 0, tension: 0.15 },
        { label: `כיום (t=${t})`, data: [{ x: t, y: current }], type: 'scatter', backgroundColor: '#0f6e56', borderColor: '#0f6e56', pointRadius: 6 },
        { label: 'K', data: [{ x: 0, y: K }, { x: 60, y: K }], borderColor: '#ba7517', borderDash: [6, 4], borderWidth: 1.5, pointRadius: 0 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { font: { family: 'Heebo', size: 10 }, boxWidth: 10 } } },
      scales: {
        x: { type: 'linear', title: { display: true, text: 'שנים מאז 1995', font: { family: 'Heebo', size: 11 } } },
        y: { title: { display: true, text: 'גודל אוכלוסייה', font: { family: 'Heebo', size: 11 } }, beginAtZero: true }
      }
    }
  });

  document.getElementById('donkeyCalc').textContent =
    `K = ${sources} × ${cap} = ${K}   |   Nt = ${K}/(1+((${K}−37)/37)·e^(−0.22×${t})) = ${current.toFixed(1)}`;

  const pct = current / K;
  document.getElementById('donkeyExplain').innerHTML = pct > 0.95
    ? `<strong>האוכלוסייה קרובה מאוד ל-K</strong> (${(pct * 100).toFixed(0)}% ממנה) — קצב הגידול כבר איטי מאוד. כדי לאפשר לאוכלוסייה להמשיך לגדול, צריך להגדיל את K עצמו — למשל להוסיף מקורות מים או להגדיל את קיבולתם.`
    : `לאחר ${t} שנים, האוכלוסייה צפויה למנות כ-<strong>${current.toFixed(0)}</strong> פרטים מתוך K = ${K} (${(pct * 100).toFixed(0)}%).`;
}

// ============================================================
// TOPIC 4: ALLEE EFFECT
// ============================================================
const ALLEE_K = 100, ALLEE_R = 0.1;

function updateAllee() {
  const A = +document.getElementById('alleeA').value;
  document.getElementById('alleeAVal').textContent = A;

  const standardPts = [], alleePts = [];
  for (let i = 0; i <= 50; i++) {
    const N = ALLEE_K * i / 50;
    standardPts.push({ x: N, y: ALLEE_R * (1 - N / ALLEE_K) });
    const g = A > 0 ? ALLEE_R * (1 - N / ALLEE_K) * (N / A - 1) : ALLEE_R * (1 - N / ALLEE_K);
    alleePts.push({ x: N, y: g });
  }

  makeChart('alleeChart', {
    type: 'line',
    data: {
      datasets: [
        { label: 'קצב גידול לפרט — לוגיסטי רגיל', data: standardPts, borderColor: '#888780', borderDash: [5, 3], backgroundColor: 'transparent', borderWidth: 2, pointRadius: 0, tension: 0.2 },
        { label: 'קצב גידול לפרט — עם Allee', data: alleePts, borderColor: '#993c1d', backgroundColor: 'rgba(153,60,29,0.08)', fill: true, borderWidth: 2.5, pointRadius: 0, tension: 0.2 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { font: { family: 'Heebo', size: 10 }, boxWidth: 10 } } },
      scales: {
        x: { type: 'linear', title: { display: true, text: 'N (גודל אוכלוסייה)', font: { family: 'Heebo', size: 11 } } },
        y: { title: { display: true, text: 'קצב גידול לפרט (1/N)(dN/dt)', font: { family: 'Heebo', size: 11 } } }
      }
    }
  });

  document.getElementById('alleeExplain').innerHTML = A > 0
    ? `<strong>מתחת לסף A = ${A}</strong> קצב הגידול לפרט <strong>שלילי</strong> — זהו "אזור סכנת הכחדה": אוכלוסייה קטנה מדי לא רק שלא גדלה, אלא ממשיכה לקטון עד הכחדה, גם ללא לחץ חיצוני נוסף. מעל הסף, הקצב חיובי ומגיע לשיא ואז יורד לאפס ב-K, בדיוק כמו במודל הלוגיסטי הרגיל.`
    : `ללא סף Allee (A=0), הקצב לפרט הוא הגבוה ביותר בצפיפויות נמוכות ופוחת ככל שהאוכלוסייה גדלה — כמו במודל הלוגיסטי הרגיל. הזיזו את המחוון כדי להוסיף אפקט Allee.`;
}

// ============================================================
// QUIZ
// ============================================================
function initQuiz() {
  buildQuiz(document.getElementById('quizBox'), [
    {
      q: 'אוכלוסייה בעלת r = −0.2. מה יקרה לה עם הזמן (בהנחת גידול אקספוננציאלי)?',
      opts: ['היא תגדל', 'היא תקטן', 'היא תישאר יציבה', 'אי אפשר לדעת'],
      correct: 1,
      feedback: 'שיפוע שלילי (r<0) פירושו שהאוכלוסייה קטנה עם הזמן — כפי שראינו באוכלוסייה 2 בתרגיל.'
    },
    {
      q: 'לפי המודל הלוגיסטי, מהו קצב הגידול dN/dt כאשר האוכלוסייה נמצאת בדיוק בכושר הנשיאה K?',
      opts: ['הגבוה ביותר האפשרי', 'שלילי', 'אפס', 'תלוי ב-N0'],
      correct: 2,
      feedback: 'בכושר הנשיאה קצב הילודה שווה לקצב התמותה, ולכן dN/dt = 0 והאוכלוסייה מפסיקה לגדול.'
    },
    {
      q: 'מהו אפקט Allee?',
      opts: [
        'ירידה בקצב הגידול ככל שהאוכלוסייה גדלה',
        'עלייה בקצב הגידול ככל שהאוכלוסייה גדלה (בעיקר בצפיפויות נמוכות)',
        'קצב גידול קבוע שאינו תלוי בגודל האוכלוסייה',
        'תופעה שקורית רק באוכלוסיות גדולות מאוד'
      ],
      correct: 1,
      feedback: 'ב-Allee Effect קצב הגידול עולה עם גודל האוכלוסייה (בניגוד לתלות-צפיפות הרגילה) — למשל בשל קושי במציאת בן/בת זוג באוכלוסיות קטנות.'
    }
  ]);
}

// ============================================================
// PAGE INIT
// ============================================================
renderSiteNav();
renderSubnav();
buildPop123Table();
renderRawAndLnCharts();
buildPop4Table();
computeKAndR();
updateExp();
updateLogistic();
renderObsVsExp();
updateDonkey();
updateAllee();
initQuiz();
