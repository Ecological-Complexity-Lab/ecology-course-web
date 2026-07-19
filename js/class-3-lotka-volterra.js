// showPage(), makeChart() and buildQuiz() are shared — see js/common.js.
// Lotka-Volterra interspecific competition:
//   dN1/dt = r1·N1·(K1 − N1 − α12·N2)/K1
//   dN2/dt = r2·N2·(K2 − N2 − α21·N1)/K2

const SP1_COLOR = '#993c1d';   // מין 1 — coral
const SP2_COLOR = '#534ab7';   // מין 2 — purple

// ============================================================
// SHARED MODEL HELPERS
// ============================================================
// Classify the four LV competition outcomes from the two carrying
// capacities and the two competition coefficients (Mittelbach 2019).
function lvOutcome(K1, K2, a12, a21) {
  // Degenerate case: the two isoclines coincide (identical slope & intercept).
  // Happens e.g. when the species are identical with α=1 — a neutral, non-
  // generic state (assignment Q1a: "do the isoclines overlap?").
  if (a12 > 0 && Math.abs(K1 / a12 - K2) < 0.6 && Math.abs(1 / a12 - a21) < 0.03)
    return { key: 'overlap', label: 'איזוקלינות חופפות (מצב מנוון)', cls: 'amber', color: '#ba7517' };
  const A = a21 > 0 ? K2 / a21 : Infinity;   // compare with K1
  const B = a12 > 0 ? K1 / a12 : Infinity;   // compare with K2
  const k1big = K1 > A;   // K1 > K2/α21
  const k2big = K2 > B;   // K2 > K1/α12
  if (k1big && !k2big)  return { key: 'sp1',      label: 'מין 1 דוחק את מין 2',                cls: 'coral',  color: SP1_COLOR };
  if (!k1big && k2big)  return { key: 'sp2',      label: 'מין 2 דוחק את מין 1',                cls: 'purple', color: SP2_COLOR };
  if (!k1big && !k2big) return { key: 'stable',   label: 'דו-קיום יציב',                       cls: 'teal',   color: '#0f6e56' };
  return                       { key: 'unstable', label: 'דו-קיום לא-יציב (תלוי בתנאי התחלה)', cls: 'amber',  color: '#ba7517' };
}

// RK4 integration of the coupled system.
function simulateLV(p, tMax, steps) {
  let N1 = p.N1, N2 = p.N2;
  const dt = tMax / steps;
  const f1 = (n1, n2) => p.r1 * n1 * (p.K1 - n1 - p.a12 * n2) / p.K1;
  const f2 = (n1, n2) => p.r2 * n2 * (p.K2 - n2 - p.a21 * n1) / p.K2;
  const t = [0], x1 = [N1], x2 = [N2];
  for (let i = 0; i < steps; i++) {
    const a1 = f1(N1, N2),                             a2 = f2(N1, N2);
    const b1 = f1(N1 + dt / 2 * a1, N2 + dt / 2 * a2), b2 = f2(N1 + dt / 2 * a1, N2 + dt / 2 * a2);
    const c1 = f1(N1 + dt / 2 * b1, N2 + dt / 2 * b2), c2 = f2(N1 + dt / 2 * b1, N2 + dt / 2 * b2);
    const d1 = f1(N1 + dt * c1, N2 + dt * c2),         d2 = f2(N1 + dt * c1, N2 + dt * c2);
    N1 = Math.max(0, N1 + dt / 6 * (a1 + 2 * b1 + 2 * c1 + d1));
    N2 = Math.max(0, N2 + dt / 6 * (a2 + 2 * b2 + 2 * c2 + d2));
    t.push((i + 1) * dt); x1.push(N1); x2.push(N2);
  }
  return { t, x1, x2 };
}

// Chart.js plugin: draw a normalized direction (vector) field behind the
// datasets. getField() returns a (n1,n2)→{dx,dy} function or null.
function vectorFieldPlugin(getField) {
  return {
    id: 'vfield',
    beforeDatasetsDraw(chart) {
      const f = getField && getField();
      if (!f) return;
      const { ctx, scales: { x, y } } = chart;
      const nx = 13, ny = 13, LEN = 9;
      ctx.save();
      ctx.strokeStyle = 'rgba(120,120,110,0.45)';
      ctx.fillStyle = 'rgba(120,120,110,0.45)';
      ctx.lineWidth = 1;
      for (let i = 0; i < nx; i++) {
        for (let j = 0; j < ny; j++) {
          const dataX = x.min + (x.max - x.min) * i / (nx - 1);
          const dataY = y.min + (y.max - y.min) * j / (ny - 1);
          const d = f(dataX, dataY);
          // Convert the data-space vector into pixel space (handles axis
          // scaling and the inverted y pixel axis correctly).
          let vx = x.getPixelForValue(dataX + d.dx) - x.getPixelForValue(dataX);
          let vy = y.getPixelForValue(dataY + d.dy) - y.getPixelForValue(dataY);
          const mag = Math.hypot(vx, vy);
          if (mag < 1e-9) continue;
          vx = vx / mag * LEN; vy = vy / mag * LEN;
          const px = x.getPixelForValue(dataX), py = y.getPixelForValue(dataY);
          const ex = px + vx, ey = py + vy;
          ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(ex, ey); ctx.stroke();
          // arrowhead
          const ang = Math.atan2(vy, vx), h = 3.2;
          ctx.beginPath();
          ctx.moveTo(ex, ey);
          ctx.lineTo(ex - h * Math.cos(ang - 0.5), ey - h * Math.sin(ang - 0.5));
          ctx.lineTo(ex - h * Math.cos(ang + 0.5), ey - h * Math.sin(ang + 0.5));
          ctx.closePath(); ctx.fill();
        }
      }
      ctx.restore();
    }
  };
}

// ============================================================
// TOPIC 1: NICHE OVERLAP → COMPETITION COEFFICIENT
// ============================================================
function normPdf(x, m, s) { return Math.exp(-0.5 * ((x - m) / s) ** 2) / (s * Math.sqrt(2 * Math.PI)); }
function erf(x) {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return x >= 0 ? y : -y;
}
const NICHE_SIGMA = 12;

function updateNiche() {
  const sep = +document.getElementById('nicheSep').value;   // 0..40
  document.getElementById('nicheSepVal').textContent = (sep / 10).toFixed(1);
  const m1 = 50 - sep / 2, m2 = 50 + sep / 2;

  const c1 = [], c2 = [];
  for (let x = 0; x <= 100; x += 1) {
    c1.push({ x, y: normPdf(x, m1, NICHE_SIGMA) });
    c2.push({ x, y: normPdf(x, m2, NICHE_SIGMA) });
  }
  // Overlap of two equal-variance normals separated by d: 2·Φ(−d/2σ).
  const overlap = 2 * 0.5 * (1 + erf(-(sep / 2) / (NICHE_SIGMA * Math.SQRT2)));
  const alpha = overlap;   // proxy: full overlap → α≈1

  makeChart('nicheChart', {
    type: 'line',
    data: {
      datasets: [
        { label: 'מין 1', data: c1, borderColor: SP1_COLOR, backgroundColor: 'rgba(153,60,29,0.12)', fill: true, borderWidth: 2, pointRadius: 0, tension: 0.3 },
        { label: 'מין 2', data: c2, borderColor: SP2_COLOR, backgroundColor: 'rgba(83,74,183,0.12)', fill: true, borderWidth: 2, pointRadius: 0, tension: 0.3 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { font: { family: 'Heebo', size: 11 }, boxWidth: 10 } } },
      scales: {
        x: { type: 'linear', title: { display: true, text: 'ציר משאב (למשל גודל זרעים)', font: { family: 'Heebo', size: 11 } } },
        y: { title: { display: true, text: 'שיעור השימוש במשאב', font: { family: 'Heebo', size: 11 } }, ticks: { display: false } }
      }
    }
  });

  document.getElementById('nicheOverlap').textContent = (overlap * 100).toFixed(0) + '%';
  document.getElementById('nicheAlpha').textContent = alpha.toFixed(2);
  document.getElementById('nicheExplain').innerHTML = overlap > 0.66
    ? `<strong>חפיפה גבוהה (α ≈ ${alpha.toFixed(2)}).</strong> שני המינים מנצלים כמעט את אותם משאבים — כל פרט מתחרה "מפריע" למין השני כמעט כמו פרט מאותו מין. התחרות הבין-מינית עזה.`
    : overlap > 0.25
      ? `<strong>חפיפה בינונית (α ≈ ${alpha.toFixed(2)}).</strong> יש שיתוף חלקי במשאבים; התחרות הבין-מינית קיימת אך חלשה מהתוך-מינית.`
      : `<strong>חפיפה נמוכה (α ≈ ${alpha.toFixed(2)}).</strong> המינים "התחלקו" במשאב (הפרדת נישות) — התחרות הבין-מינית כמעט זניחה, ודו-קיום סביר.`;
}

// ============================================================
// TOPIC 2: COMPETITION EFFECT ON EQUILIBRIUM
// ============================================================
function updateCompEffect() {
  const K1 = +document.getElementById('ceK1').value;
  const a12 = +document.getElementById('ceA').value / 100;
  const N2 = +document.getElementById('ceN2').value;
  document.getElementById('ceK1val').textContent = K1;
  document.getElementById('ceAval').textContent = a12.toFixed(2);
  document.getElementById('ceN2val').textContent = N2;

  const Keff = Math.max(0, K1 - a12 * N2);
  const r = 0.5, N0 = 4, T = 40, steps = 60;
  const withComp = [], withoutComp = [];
  const logistic = (K, t) => K > 0 ? K / (1 + ((K - N0) / N0) * Math.exp(-r * t)) : 0;
  for (let i = 0; i <= steps; i++) {
    const t = T * i / steps;
    withoutComp.push({ x: t, y: logistic(K1, t) });
    withComp.push({ x: t, y: logistic(Keff, t) });
  }

  makeChart('compEffectChart', {
    type: 'line',
    data: {
      datasets: [
        { label: 'מין 1 ללא תחרות (→ K₁)', data: withoutComp, borderColor: '#b7b0b0', borderDash: [6, 4], backgroundColor: 'transparent', borderWidth: 1.8, pointRadius: 0, tension: 0.15 },
        { label: 'מין 1 עם תחרות (→ K₁−α₁₂N₂)', data: withComp, borderColor: SP1_COLOR, backgroundColor: 'rgba(153,60,29,0.08)', fill: true, borderWidth: 2.5, pointRadius: 0, tension: 0.15 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { font: { family: 'Heebo', size: 10 }, boxWidth: 10 } } },
      scales: {
        x: { type: 'linear', title: { display: true, text: 'זמן', font: { family: 'Heebo', size: 11 } } },
        y: { title: { display: true, text: 'גודל אוכלוסיית מין 1', font: { family: 'Heebo', size: 11 } }, beginAtZero: true, suggestedMax: K1 * 1.1 }
      }
    }
  });

  document.getElementById('ceExplain').innerHTML = Keff > 0
    ? `כושר הנשיאה האפקטיבי של מין 1 יורד מ-<strong>${K1}</strong> ל-<strong>K₁ − α₁₂·N₂ = ${K1} − ${a12.toFixed(2)}·${N2} = ${Keff.toFixed(1)}</strong>. עצם נוכחות המתחרה "גוזלת מקום" בכושר הנשיאה, ומין 1 מתייצב על גודל נמוך יותר.`
    : `אפקט התחרות (α₁₂·N₂ = ${(a12 * N2).toFixed(1)}) גדול מכושר הנשיאה של מין 1 (${K1}). בתנאים אלה מין 1 לא יכול לשרוד — אוכלוסייתו קורסת ל-0.`;
}

// ============================================================
// TOPIC 3: ISOCLINE CLASSIFIER (phase-plane geometry only)
// ============================================================
function getIsoclineParams() {
  return {
    K1: +document.getElementById('icK1').value,
    K2: +document.getElementById('icK2').value,
    a12: +document.getElementById('icA12').value / 100,
    a21: +document.getElementById('icA21').value / 100
  };
}
function loadIsoclinePreset(kind) {
  const set = (id, v) => document.getElementById(id).value = v;
  const P = {
    sp1:      { K1: 80, K2: 40, a12: 60,  a21: 60 },
    sp2:      { K1: 40, K2: 80, a12: 60,  a21: 60 },
    stable:   { K1: 60, K2: 55, a12: 60,  a21: 55 },
    unstable: { K1: 60, K2: 55, a12: 150, a21: 160 }
  }[kind];
  set('icK1', P.K1); set('icK2', P.K2); set('icA12', P.a12); set('icA21', P.a21);
  updateIsocline();
}

function drawPhasePlane(canvasId, p, extras) {
  // Isocline endpoints (clamp intercepts so a tiny α doesn't blow up the axis).
  const clamp = v => Math.min(v, 400);
  const iso1_yInt = p.a12 > 0 ? clamp(p.K1 / p.a12) : 400;   // N1=0
  const iso2_xInt = p.a21 > 0 ? clamp(p.K2 / p.a21) : 400;   // N2=0
  const iso1 = [{ x: 0, y: iso1_yInt }, { x: p.K1, y: 0 }];
  const iso2 = [{ x: 0, y: p.K2 }, { x: iso2_xInt, y: 0 }];

  // Axis scaled to the carrying capacities / trajectory — NOT to the isocline
  // intercepts, which explode when a competition coefficient is small. The
  // isocline segments simply clip at the axis edge.
  const axMax = Math.min(400, Math.ceil(Math.max(p.K1, p.K2, extras.axMin || 0) * 1.15 / 10) * 10);

  const datasets = [
    { label: 'איזוקלינת מין 1', data: iso1, borderColor: SP1_COLOR, borderDash: [6, 4], backgroundColor: 'transparent', borderWidth: 2.2, pointRadius: 0 },
    { label: 'איזוקלינת מין 2', data: iso2, borderColor: SP2_COLOR, borderDash: [6, 4], backgroundColor: 'transparent', borderWidth: 2.2, pointRadius: 0 }
  ];
  (extras.datasets || []).forEach(d => datasets.push(d));

  makeChart(canvasId, {
    type: 'scatter',
    data: { datasets },
    plugins: [vectorFieldPlugin(extras.field)],
    options: {
      responsive: true, maintainAspectRatio: false,
      showLine: true,
      plugins: { legend: { labels: { font: { family: 'Heebo', size: 10 }, boxWidth: 10, filter: i => i.text !== '' } } },
      scales: {
        x: { type: 'linear', min: 0, max: axMax, title: { display: true, text: 'גודל אוכלוסיית מין 1 (N₁)', font: { family: 'Heebo', size: 11 } } },
        y: { type: 'linear', min: 0, max: axMax, title: { display: true, text: 'גודל אוכלוסיית מין 2 (N₂)', font: { family: 'Heebo', size: 11 } } }
      }
    }
  });
  return axMax;
}

function updateIsocline() {
  const p = getIsoclineParams();
  document.getElementById('icK1val').textContent = p.K1;
  document.getElementById('icK2val').textContent = p.K2;
  document.getElementById('icA12val').textContent = p.a12.toFixed(2);
  document.getElementById('icA21val').textContent = p.a21.toFixed(2);

  const out = lvOutcome(p.K1, p.K2, p.a12, p.a21);

  // Equilibrium (intersection of the two isoclines), shown if in the +quadrant.
  const denom = 1 - p.a12 * p.a21;
  let eqPts = [];
  if (Math.abs(denom) > 1e-6) {
    const n1 = (p.K1 - p.a12 * p.K2) / denom;
    const n2 = (p.K2 - p.a21 * p.K1) / denom;
    if (n1 > 0 && n2 > 0) eqPts = [{ x: n1, y: n2 }];
  }

  drawPhasePlane('isoclineChart', p, {
    field: () => (n1, n2) => ({
      dx: 1 * n1 * (p.K1 - n1 - p.a12 * n2) / p.K1,
      dy: 1 * n2 * (p.K2 - n2 - p.a21 * n1) / p.K2
    }),
    datasets: eqPts.length ? [{ label: 'נקודת שיווי משקל', data: eqPts, showLine: false, backgroundColor: out.color, borderColor: '#fff', borderWidth: 2, pointRadius: 7 }] : []
  });

  const box = document.getElementById('outcomeBox');
  box.style.background = `var(--${out.cls}-light)`;
  const lab = document.getElementById('outcomeLabel');
  lab.textContent = out.label;
  lab.style.color = out.color;

  const A = (p.a21 > 0 ? (p.K2 / p.a21) : Infinity), B = (p.a12 > 0 ? (p.K1 / p.a12) : Infinity);
  const fmt = v => v === Infinity ? '∞' : v.toFixed(1);
  const cond = `K₁=${p.K1} מול K₂/α₂₁=${fmt(A)} · K₂=${p.K2} מול K₁/α₁₂=${fmt(B)}`;
  const expl = {
    sp1: 'האיזוקלינה של מין 1 נמצאת כולה מעל זו של מין 2 — כל מצב מוביל לכך שמין 1 גדל ומין 2 נדחק להכחדה.',
    sp2: 'האיזוקלינה של מין 2 נמצאת כולה מעל זו של מין 1 — מין 2 דוחק את מין 1.',
    stable: 'האיזוקלינות נחתכות כך שכל מין מגביל את עצמו יותר משהוא מגביל את המתחרה. הנקודה המשותפת היא שיווי משקל יציב — המערכת מתכנסת אליה מכל תנאי התחלה.',
    unstable: 'האיזוקלינות נחתכות אך כל מין מגביל את המתחרה יותר מאשר את עצמו. נקודת החיתוך אינה יציבה — התוצאה הסופית (מי ידחוק את מי) תלויה בתנאי ההתחלה.',
    overlap: 'שתי האיזוקלינות מונחות זו על זו. זהו מצב מנוון המתאר מינים זהים לחלוטין (חפיפת נישה מושלמת, α=1) — אינו סביר בטבע, וכל נקודה על הישר היא שיווי משקל נייטרלי.'
  }[out.key];
  document.getElementById('isoclineExplain').innerHTML = `<strong>${out.label}.</strong> ${expl}<br><span style="font-family:'DM Mono',monospace;font-size:.8rem;">${cond}</span>`;
}

// ============================================================
// TOPIC 4: FULL DYNAMIC SIMULATOR
// ============================================================
function getSimParams() {
  return {
    r1: +document.getElementById('simR1').value / 100,
    K1: +document.getElementById('simK1').value,
    N1: +document.getElementById('simN1').value,
    a12: +document.getElementById('simA12').value / 100,
    r2: +document.getElementById('simR2').value / 100,
    K2: +document.getElementById('simK2').value,
    N2: +document.getElementById('simN2').value,
    a21: +document.getElementById('simA21').value / 100
  };
}
function loadSimPreset(kind) {
  const s = (id, v) => document.getElementById(id).value = v;
  const P = {
    reset: { r1: 50, K1: 50, N1: 10, a12: 100, r2: 50, K2: 50, N2: 10, a21: 100 },
    equal: { r1: 30, K1: 80, N1: 40, a12: 100, r2: 30, K2: 80, N2: 40, a21: 100 },
    s1:    { r1: 40, K1: 75, N1: 70, a12: 130, r2: 120, K2: 65, N2: 15, a21: 60 },
    s2:    { r1: 40, K1: 95, N1: 20, a12: 100, r2: 40,  K2: 100, N2: 20, a21: 120 },
    s3:    { r1: 90, K1: 100, N1: 120, a12: 30, r2: 70, K2: 50, N2: 20, a21: 60 }
  }[kind];
  s('simR1', P.r1); s('simK1', P.K1); s('simN1', P.N1); s('simA12', P.a12);
  s('simR2', P.r2); s('simK2', P.K2); s('simN2', P.N2); s('simA21', P.a21);
  updateSim();
}

function updateSim() {
  const p = getSimParams();
  document.getElementById('simR1val').textContent = p.r1.toFixed(2);
  document.getElementById('simK1val').textContent = p.K1;
  document.getElementById('simN1val').textContent = p.N1;
  document.getElementById('simA12val').textContent = p.a12.toFixed(2);
  document.getElementById('simR2val').textContent = p.r2.toFixed(2);
  document.getElementById('simK2val').textContent = p.K2;
  document.getElementById('simN2val').textContent = p.N2;
  document.getElementById('simA21val').textContent = p.a21.toFixed(2);

  const sim = simulateLV(p, 60, 600);

  // --- time series ---
  makeChart('simTimeChart', {
    type: 'line',
    data: {
      datasets: [
        { label: 'מין 1', data: sim.t.map((t, i) => ({ x: t, y: sim.x1[i] })), borderColor: SP1_COLOR, backgroundColor: 'transparent', borderWidth: 2.5, pointRadius: 0, tension: 0.1 },
        { label: 'מין 2', data: sim.t.map((t, i) => ({ x: t, y: sim.x2[i] })), borderColor: SP2_COLOR, backgroundColor: 'transparent', borderWidth: 2.5, pointRadius: 0, tension: 0.1 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { font: { family: 'Heebo', size: 11 }, boxWidth: 10 } } },
      scales: {
        x: { type: 'linear', title: { display: true, text: 'זמן', font: { family: 'Heebo', size: 11 } } },
        y: { title: { display: true, text: 'גודל אוכלוסייה', font: { family: 'Heebo', size: 11 } }, beginAtZero: true }
      }
    }
  });

  // --- phase plane: isoclines + trajectory + start/end + field ---
  const traj = sim.t.map((_, i) => ({ x: sim.x1[i], y: sim.x2[i] }));
  const trajMax = Math.max(...sim.x1, ...sim.x2);
  drawPhasePlane('simPhaseChart', p, {
    axMin: trajMax,
    field: () => (n1, n2) => ({
      dx: p.r1 * n1 * (p.K1 - n1 - p.a12 * n2) / p.K1,
      dy: p.r2 * n2 * (p.K2 - n2 - p.a21 * n1) / p.K2
    }),
    datasets: [
      { label: 'מסלול', data: traj, showLine: true, borderColor: '#6b6b5e', backgroundColor: 'transparent', borderWidth: 2, pointRadius: 0 },
      { label: 'תנאי התחלה', data: [{ x: p.N1, y: p.N2 }], showLine: false, backgroundColor: '#ba7517', borderColor: '#fff', borderWidth: 2, pointRadius: 7 },
      { label: 'מצב סופי', data: [{ x: sim.x1[sim.x1.length - 1], y: sim.x2[sim.x2.length - 1] }], showLine: false, backgroundColor: '#1a1a16', borderColor: '#fff', borderWidth: 2, pointRadius: 7 }
    ]
  });

  const out = lvOutcome(p.K1, p.K2, p.a12, p.a21);
  const box = document.getElementById('simOutcomeBox');
  box.style.background = `var(--${out.cls}-light)`;
  const lab = document.getElementById('simOutcomeLabel');
  lab.textContent = out.label;
  lab.style.color = out.color;

  const f1 = sim.x1[sim.x1.length - 1], f2 = sim.x2[sim.x2.length - 1];
  document.getElementById('simExplain').innerHTML =
    `לפי הגיאומטריה של האיזוקלינות, התוצאה הצפויה היא <strong style="color:${out.color}">${out.label}</strong>. ` +
    `בסיום ההדמיה (מתנאי ההתחלה N₁=${p.N1}, N₂=${p.N2}): מין 1 ≈ <strong>${f1.toFixed(1)}</strong>, מין 2 ≈ <strong>${f2.toFixed(1)}</strong>. ` +
    `שנו פרמטר בודד וצפו כיצד המסלול, המצב הסופי ולעיתים תוצאת התחרות משתנים.`;
}

// ============================================================
// QUIZ
// ============================================================
function initQuiz() {
  buildQuiz(document.getElementById('quizBox'), [
    {
      q: 'מה מייצג מקדם התחרות α₁₂?',
      opts: [
        'את מספר הפרטים של מין 2',
        'את השפעת פרט ממין 2 על מין 1, ביחס להשפעת פרט ממין 1 על עצמו',
        'את כושר הנשיאה של מין 1',
        'את קצב הגידול המקסימלי של מין 1'
      ],
      correct: 1,
      feedback: 'α₁₂ הוא היחס בין עוצמת התחרות הבין-מינית (פרט ממין 2 על מין 1) לעוצמת התחרות התוך-מינית (פרט ממין 1 על עצמו).'
    },
    {
      q: 'שני מקדמי התחרות שווים ל-1 וכל שאר הפרמטרים זהים בין המינים. מה מצב האיזוקלינות?',
      opts: ['הן מצטלבות בזווית ישרה', 'הן חופפות (מונחות זו על זו)', 'הן מקבילות', 'אין להן חיתוך חיובי'],
      correct: 1,
      feedback: 'כשכל הפרמטרים זהים ו-α=1, שתי האיזוקלינות זהות לחלוטין וחופפות — מצב מנוון שאינו סביר בטבע (חפיפת נישה מושלמת).'
    },
    {
      q: 'מתי מתקבל דו-קיום יציב בין שני המינים?',
      opts: [
        'כאשר שני מקדמי התחרות גדולים מ-1',
        'כאשר כל מין מגביל את עצמו (תחרות תוך-מינית) יותר משהוא מגביל את המתחרה',
        'כאשר כושר הנשיאה של שני המינים זהה',
        'כאשר למין אחד קצב גידול גבוה בהרבה'
      ],
      correct: 1,
      feedback: 'דו-קיום יציב דורש שהתחרות התוך-מינית תהיה הגורם המגביל — כלומר מקדמי תחרות נמוכים דיים (בדרך כלל <1) ופער מתון בין כושרי הנשיאה.'
    },
    {
      q: 'בתרחיש עם α₁₂ ו-α₂₁ שניהם גדולים מ-1, נקודת החיתוך של האיזוקלינות אינה יציבה. מה זה אומר?',
      opts: [
        'תמיד מתקבל דו-קיום',
        'שני המינים תמיד נכחדים',
        'התוצאה הסופית (מי דוחק את מי) תלויה בתנאי ההתחלה',
        'האוכלוסיות מתנודדות ללא הפסקה'
      ],
      correct: 2,
      feedback: 'בדו-קיום לא-יציב כל מין מגביל את המתחרה חזק יותר מאת עצמו; הנקודה המשותפת היא "אוכף" — המערכת גולשת ממנה, והמנצח נקבע לפי מי התחיל בשפע גבוה יותר.'
    }
  ]);
}

// ============================================================
// PAGE INIT
// ============================================================
renderSiteNav();
renderSubnav();
updateNiche();
updateCompEffect();
updateIsocline();
updateSim();
initQuiz();
