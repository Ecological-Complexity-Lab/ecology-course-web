// ============================================================
// COURSE-WIDE CLASS REGISTRY
// One entry per lesson. Add `ready:true` and create the matching
// HTML file to make a lesson appear in the toolbar and home grid.
// ============================================================
const ECOLOGY_CLASSES = [
  { num: 1, label: 'גידול אוכלוסייה',        file: 'class-1-population-growth.html',   desc: 'גידול אקספוננציאלי, טרנספורמציית ln, כושר נשיאה K וגידול לוגיסטי.', ready: false },
  { num: 2, label: 'מבנה חברה',               file: 'class-2-community-structure.html', desc: 'עושר מינים, שפע יחסי, מדד שאנון, מגוון α β γ והקשר שטח-מינים.', ready: true },
  { num: 3, label: 'לוטקה-וולטרה',            file: 'class-3-lotka-volterra.html',       desc: 'תחרות וטריפה בין שני מינים ודינמיקת שיווי משקל.', ready: false },
  { num: 4, label: 'רשתות אקולוגיות',         file: 'class-4-scientific-paper.html',     desc: 'קריאת מאמר מדעי ורשתות אינטראקציה אקולוגיות.', ready: false },
  { num: 5, label: 'הכנה לסיור',              file: 'class-5-pre-trip.html',              desc: 'הכנה לסיור השדה — שיטות דגימה ותכנון.', ready: false },
  { num: 6, label: 'TIME',                    file: 'class-6-time.html',                 desc: 'דינמיקה בזמן וניתוח סדרות עתיות אקולוגיות.', ready: false },
];

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
