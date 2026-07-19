// ============================================================
// COURSE-WIDE CLASS REGISTRY
// One entry per lesson. Add `ready:true` and create the matching
// HTML file to make a lesson appear in the toolbar and home grid.
// ============================================================
// `topics` drives the in-lesson subnav (rendered by renderSubnav). Each topic
// id must match the id of a <div class="page"> in that lesson's HTML file.
const ECOLOGY_CLASSES = [
  { num: 1, label: 'גידול אוכלוסייה',        file: 'class-1-population-growth.html',   desc: 'גידול אקספוננציאלי, טרנספורמציית ln, כושר נשיאה K וגידול לוגיסטי.', ready: true,
    topics: [
      { id: 'p1', label: 'גידול אקספוננציאלי' },
      { id: 'p2', label: 'הערכת r מנתונים' },
      { id: 'p3', label: 'גידול לוגיסטי ו-K' },
      { id: 'p4', label: 'תחזית, Allee ותרגול' },
    ] },
  { num: 2, label: 'מבנה חברה',               file: 'class-2-community-structure.html', desc: 'עושר מינים, שפע יחסי, מדד שאנון, מגוון α β γ והקשר שטח-מינים.', ready: true,
    topics: [
      { id: 'p1', label: 'תיאור חברה' },
      { id: 'p2', label: 'עקומת צבירה' },
      { id: 'p3', label: 'מגוון α β γ' },
      { id: 'p4', label: 'שטח–מינים' },
    ] },
  { num: 3, label: 'לוטקה-וולטרה',            file: 'class-3-lotka-volterra.html',       desc: 'תחרות בין-מינית, מקדמי תחרות, איזוקלינות ה-0 וארבע תוצאות התחרות.', ready: true,
    topics: [
      { id: 'p1', label: 'מה זה תחרות?' },
      { id: 'p2', label: 'משוואות לוטקה-וולטרה' },
      { id: 'p3', label: 'איזוקלינות ותוצאות' },
      { id: 'p4', label: 'סימולטור ותרגול' },
    ] },
  { num: 4, label: 'רשתות אקולוגיות',         file: 'class-4-scientific-paper.html',     desc: 'קריאת מאמר מדעי ורשתות אינטראקציה אקולוגיות.', ready: false },
  { num: 5, label: 'הכנה לסיור',              file: 'class-5-pre-trip.html',              desc: 'הכנה לסיור השדה — שיטות דגימה ותכנון.', ready: false },
  { num: 6, label: 'TIME',                    file: 'class-6-time.html',                 desc: 'דינמיקה בזמן וניתוח סדרות עתיות אקולוגיות.', ready: false },
];

// Look up the lesson whose file matches the page currently being viewed.
function currentClass() {
  const currentFile = location.pathname.split('/').pop() || 'index.html';
  return ECOLOGY_CLASSES.find(c => c.file === currentFile) || null;
}

// ============================================================
// SITE-WIDE TOOLBAR (lesson picker)
// Renders into <nav id="siteNav"> on every page.
// ============================================================
function renderSiteNav() {
  const nav = document.getElementById('siteNav');
  if (!nav) return;
  const currentFile = location.pathname.split('/').pop() || 'index.html';
  const ready = ECOLOGY_CLASSES.filter(c => c.ready).sort((a, b) => a.num - b.num);
  const btn = (file, label, isActive) =>
    `<button class="nav-btn ${isActive ? 'active' : ''}" onclick="location.href='${file}'">${label}</button>`;

  nav.innerHTML = [
    `<span class="nav-title">מבוא <span>לאקולוגיה</span></span>`,
    btn('index.html', 'כל השיעורים', currentFile === 'index.html' || currentFile === ''),
    `<span class="nav-sep"></span>`,
    ...ready.map(c => btn(c.file, `שיעור ${c.num}: ${c.label}`, currentFile === c.file))
  ].join('');
}

// ============================================================
// WITHIN-LESSON TOPIC NAV (subnav)
// Rendered from the current lesson's `topics` in the registry, so a
// new lesson only declares its topics once — no hand-written buttons.
// ============================================================
function renderSubnav() {
  const nav = document.getElementById('classSubnav');
  if (!nav) return;
  const cls = currentClass();
  if (!cls || !cls.topics) return;
  const btn = (page, label, isActive) =>
    `<button class="nav-btn ${isActive ? 'active' : ''}" data-page="${page}" onclick="showPage('${page}')">${label}</button>`;
  nav.innerHTML = [
    btn('home', 'ראשי', true),
    ...cls.topics.map((t, i) => btn(t.id, `${i + 1}. ${t.label}`, false))
  ].join('');
}

// ============================================================
// PAGE SWITCHING (shared by every lesson)
// Shows one <div class="page"> and syncs the subnav's active button.
// ============================================================
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');
  document.querySelectorAll('#classSubnav .nav-btn').forEach(b => b.classList.toggle('active', b.dataset.page === id));
  window.scrollTo(0, 0);
  // A chart created while its tab was display:none renders into a 0-size
  // canvas. Chart.js v4 self-heals via ResizeObserver, but nudging it here
  // avoids any first-paint flicker when the tab becomes visible.
  if (typeof Chart !== 'undefined') {
    setTimeout(() => Object.values(Chart.instances).forEach(c => { c.resize(); c.update(); }), 50);
  }
}

// ============================================================
// SHARED MATH: simple least-squares linear regression.
// Returns { slope, intercept } for y = slope·x + intercept.
// ============================================================
function linreg(xs, ys) {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0;
  for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; }
  const slope = sxy / sxx;
  return { slope, intercept: my - slope * mx };
}

// ============================================================
// SHARED CHART FACTORY
// makeChart(canvasId, config) destroys any prior chart on that canvas,
// applies the site-wide responsive/RTL defaults, and returns the chart.
// Charts are tracked by canvas id, so callers no longer keep handles.
// ============================================================
if (typeof Chart !== 'undefined') {
  Chart.defaults.font.family = 'Heebo';
}
const _charts = {};
function makeChart(canvasId, config) {
  if (_charts[canvasId]) _charts[canvasId].destroy();
  config.options = config.options || {};
  if (config.options.responsive === undefined) config.options.responsive = true;
  if (config.options.maintainAspectRatio === undefined) config.options.maintainAspectRatio = false;
  const ctx = document.getElementById(canvasId).getContext('2d');
  _charts[canvasId] = new Chart(ctx, config);
  return _charts[canvasId];
}
function destroyChart(canvasId) {
  if (_charts[canvasId]) { _charts[canvasId].destroy(); delete _charts[canvasId]; }
}

// ============================================================
// HOME GRID (lesson cards) — only lists ready lessons.
// Renders into the element with the given id.
// ============================================================
function renderClassGrid(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const palette = ['t1', 't2', 't3', 't4'];
  const ready = ECOLOGY_CLASSES.filter(c => c.ready).sort((a, b) => a.num - b.num);
  container.innerHTML = ready.map((c, i) => `
    <div class="topic-card ${palette[i % palette.length]}" onclick="location.href='${c.file}'">
      <div class="topic-num">שיעור ${c.num}</div>
      <h3>${c.label}</h3>
      <p>${c.desc}</p>
    </div>
  `).join('');
}

// ============================================================
// SHARED QUIZ WIDGET
// buildQuiz(container, [{q, opts, correct, feedback}, ...])
// Each quiz instance is self-contained (event listeners with
// closures) so multiple quizzes can coexist on one page.
// ============================================================
function buildQuiz(container, data) {
  data.forEach(q => {
    const wrap = document.createElement('div');

    const qEl = document.createElement('div');
    qEl.className = 'quiz-q';
    qEl.textContent = q.q;
    wrap.appendChild(qEl);

    const optsWrap = document.createElement('div');
    optsWrap.className = 'quiz-options';
    wrap.appendChild(optsWrap);

    const fb = document.createElement('div');
    fb.style.display = 'none';
    wrap.appendChild(fb);

    const buttons = q.opts.map((opt, oi) => {
      const b = document.createElement('button');
      b.className = 'quiz-opt';
      b.textContent = opt;
      b.addEventListener('click', () => {
        buttons.forEach((btn2, i) => {
          btn2.classList.remove('correct', 'wrong');
          if (i === q.correct) btn2.classList.add('correct');
          else if (i === oi) btn2.classList.add('wrong');
          btn2.disabled = true;
        });
        fb.style.display = 'block';
        fb.className = `quiz-feedback ${oi === q.correct ? 'ok' : 'no'}`;
        fb.textContent = (oi === q.correct ? '✓ ' : '✗ לא בדיוק. ') + q.feedback;
      });
      optsWrap.appendChild(b);
      return b;
    });

    container.appendChild(wrap);
  });
}
