// ============================================================
// WITHIN-LESSON TOPIC NAV (subnav)
// ============================================================
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('#classSubnav .nav-btn').forEach(b => b.classList.toggle('active', b.dataset.page === id));
  window.scrollTo(0, 0);
}

// ============================================================
// TOPIC 1: COMMUNITY METRICS
// ============================================================
const SPECIES_COLORS = {
  'אדום':'#E24B4A','ורוד':'#D4537E','כחול':'#378ADD',
  'ירוק':'#639922','שחור':'#2C2C2A','כתום':'#EF9F27',
  'סגול':'#7F77DD','צהוב':'#BA7517','אפור':'#888780'
};

let commAvals = {'אדום':9,'ורוד':5,'כחול':3,'ירוק':2,'שחור':1,'כתום':1};
let commBvals = {'אדום':3,'ורוד':3,'כחול':3,'ירוק':3,'שחור':3,'כתום':3};

function buildSliders(container, vals, id) {
  container.innerHTML = '';
  Object.entries(vals).forEach(([sp, n]) => {
    const row = document.createElement('div');
    row.className = 'sp-slider-row';
    row.innerHTML = `
      <div class="sp-label">
        <span class="sp-dot" style="background:${SPECIES_COLORS[sp]}"></span>
        <span style="font-size:.78rem">${sp}</span>
      </div>
      <input type="range" min="0" max="20" value="${n}"
        oninput="updateComm('${id}','${sp}',+this.value);document.getElementById('${id}lbl${sp}').textContent=this.value">
      <span class="sp-val" id="${id}lbl${sp}">${n}</span>
    `;
    container.appendChild(row);
  });
}

function updateComm(comm, sp, val) {
  if (comm==='A') { commAvals[sp]=val; } else { commBvals[sp]=val; }
  renderComm('A'); renderComm('B'); renderCompare();
}

function calcMetrics(vals) {
  const entries = Object.entries(vals).filter(([,n]) => n > 0);
  const S = entries.length;
  const N = entries.reduce((s,[,n]) => s+n, 0);
  if (!S || !N) return {S:0,N:0,H:0,J:0,entries:[]};
  const pis = entries.map(([sp,n]) => [sp, n/N, n]);
  const H = -pis.reduce((s,[,p]) => s + p*Math.log(p), 0);
  const J = S > 1 ? H/Math.log(S) : 1;
  return {S, N, H, J, entries: pis};
}

function renderDots(container, vals) {
  container.innerHTML = '';
  const pool = [];
  Object.entries(vals).forEach(([sp, n]) => {
    for (let i=0; i<n; i++) pool.push(sp);
  });
  for (let i=pool.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [pool[i],pool[j]]=[pool[j],pool[i]];
  }
  pool.forEach(sp => {
    const d = document.createElement('div');
    d.className = 'h-dot';
    d.style.background = SPECIES_COLORS[sp]||'#888';
    d.title = sp;
    container.appendChild(d);
  });
}

function renderMetrics(container, m) {
  container.innerHTML = `
    <div class="metric"><div class="m-label">עושר S</div><div class="m-val teal">${m.S}</div></div>
    <div class="metric"><div class="m-label">שאנון H</div><div class="m-val amber">${m.H.toFixed(3)}</div></div>
    <div class="metric"><div class="m-label">שוויון J</div><div class="m-val purple">${m.J.toFixed(3)}</div></div>
  `;
}

function renderCalc(container, m) {
  if (!m.S) { container.textContent = 'אין נתונים'; return; }
  const header = `H = −∑ pᵢ · ln(pᵢ)\n\n`;
  const hdr = `${'מין'.padEnd(5)}  ni   pi      ln(pi)   pi·ln(pi)\n` + '─'.repeat(44) + '\n';
  const rows = m.entries.map(([sp, p, ni]) => {
    const lnp = Math.log(p);
    const contrib = p * lnp;
    return `${sp.padEnd(5)}  ${String(ni).padStart(2)}   ${p.toFixed(3)}  ${lnp.toFixed(3)}   ${contrib.toFixed(4)}`;
  }).join('\n');
  const sum = m.entries.reduce((s,[,p]) => s + p*Math.log(p), 0);
  const footer = '\n' + '─'.repeat(44) + `\nH = −(${sum.toFixed(4)}) = ${m.H.toFixed(4)}\nln(S) = ln(${m.S}) = ${Math.log(m.S).toFixed(4)}\nJ = ${m.H.toFixed(4)} / ${Math.log(m.S).toFixed(4)} = ${m.J.toFixed(4)}`;
  container.textContent = header + hdr + rows + footer;
}

function renderComm(id) {
  const vals = id==='A' ? commAvals : commBvals;
  const m = calcMetrics(vals);
  renderDots(document.getElementById('dots'+id), vals);
  renderMetrics(document.getElementById('metrics'+id), m);
  renderCalc(document.getElementById('calc'+id), m);
}

function renderCompare() {
  const mA = calcMetrics(commAvals);
  const mB = calcMetrics(commBvals);
  const winner = (a,b,lbl) => a>b
    ? `<span style="color:var(--teal);font-weight:600">א' (${lbl})</span>`
    : b>a ? `<span style="color:var(--purple);font-weight:600">ב' (${lbl})</span>` : 'שווה';
  document.getElementById('compareBody').innerHTML = `
    <tr><td>עושר מינים (S)</td><td>${mA.S}</td><td>${mB.S}</td><td>${winner(mA.S,mB.S,Math.max(mA.S,mB.S))}</td></tr>
    <tr><td>סה"כ פרטים (N)</td><td>${mA.N}</td><td>${mB.N}</td><td>—</td></tr>
    <tr><td>שאנון H</td><td>${mA.H.toFixed(3)}</td><td>${mB.H.toFixed(3)}</td><td>${winner(mA.H,mB.H,Math.max(mA.H,mB.H).toFixed(3))}</td></tr>
    <tr><td>שוויון J</td><td>${mA.J.toFixed(3)}</td><td>${mB.J.toFixed(3)}</td><td>${winner(mA.J,mB.J,Math.max(mA.J,mB.J).toFixed(3))}</td></tr>
  `;
  const more = mA.H>mB.H?'חברה א׳ מגוונת יותר':mB.H>mA.H?'חברה ב׳ מגוונת יותר':'מגוון שווה';
  document.getElementById('compareExplain').innerHTML = `<strong>${more}</strong> — מדד שאנון H לוקח בחשבון גם עושר וגם שוויון.`;
}

// ============================================================
// TOPIC 2: ACCUMULATION CURVE
// ============================================================
let accumChart=null, accumRuns=[];

function getAccumParams() {
  return {
    S: +document.getElementById('accumS').value,
    E: +document.getElementById('accumE').value / 100,
    N: +document.getElementById('accumN').value
  };
}

function updateAccumLabels() {
  const {S, E, N} = getAccumParams();
  document.getElementById('accumSval').textContent = S;
  document.getElementById('accumNval').textContent = N;
  document.getElementById('accumEval').textContent = E.toFixed(2);
}

function makeCommunity(S, E, N) {
  const r = Math.pow(0.01, 1 - E);
  const abundances = Array.from({length:S}, (_,i) => Math.pow(r, i));
  const total = abundances.reduce((a,b)=>a+b,0);
  const probs = abundances.map(a=>a/total);
  const pool = [];
  for (let i=0;i<S;i++) {
    const count = Math.max(1, Math.round(probs[i]*N));
    for (let j=0;j<count;j++) pool.push(i);
  }
  while(pool.length<N) pool.push(0);
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  return pool.slice(0,N);
}

function accumulate(pool){const seen=new Set();return pool.map(sp=>{seen.add(sp);return seen.size;});}
const ACCUM_COLORS=['#0f6e56','#534ab7','#ba7517','#993c1d','#185fa5'];

function runAccum(add) {
  if (!add) accumRuns = [];
  const {S,E,N} = getAccumParams();
  const pool = makeCommunity(S,E,N);
  const curve = accumulate(pool);
  accumRuns.push({S, E, N, curve, pool});
  renderAccumChart();
  renderAccumCommunity(accumRuns[accumRuns.length-1]);
}

function renderAccumCommunity(run) {
  const dotsContainer = document.getElementById('accumDots');
  dotsContainer.innerHTML = '';
  const color = i => `hsl(${Math.round(i*360/run.S)}, 55%, 45%)`;
  run.pool.forEach(spIndex => {
    const d = document.createElement('div');
    d.className = 'h-dot';
    d.style.background = color(spIndex);
    d.title = `מין ${spIndex+1}`;
    dotsContainer.appendChild(d);
  });

  const counts = {};
  run.pool.forEach(sp => counts[sp] = (counts[sp]||0)+1);
  const foundS = Object.keys(counts).length;
  const probs = Object.values(counts).map(n => n/run.N);
  const H = -probs.reduce((s,p)=> s + p*Math.log(p), 0);
  const realizedJ = foundS>1 ? H/Math.log(foundS) : 1;

  document.getElementById('accumMetrics').innerHTML = `
    <div class="metric"><div class="m-label">עושר בפועל</div><div class="m-val teal">${foundS}/${run.S}</div></div>
    <div class="metric"><div class="m-label">שוויון בפועל (J)</div><div class="m-val amber">${realizedJ.toFixed(3)}</div></div>
    <div class="metric"><div class="m-label">פרטים שנדגמו (N)</div><div class="m-val purple">${run.N}</div></div>
  `;
}

function renderAccumChart() {
  const datasets = accumRuns.map((run, ri) => ({
    label:`הרצה ${ri+1} (S=${run.S}, J=${run.E.toFixed(2)}, N=${run.N})`,
    data:run.curve.map((y,x)=>({x:x+1,y})),
    borderColor:ACCUM_COLORS[ri%ACCUM_COLORS.length],
    backgroundColor:'transparent',
    borderWidth:ri===accumRuns.length-1?2.5:1.2,
    pointRadius:0,tension:.3
  }));
  const maxN = Math.max(...accumRuns.map(r => r.N));
  const maxS = Math.max(...accumRuns.map(r => r.S));

  if(accumChart) accumChart.destroy();
  const ctx=document.getElementById('accumChart').getContext('2d');
  accumChart=new Chart(ctx,{
    type:'line',data:{datasets},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:accumRuns.length>1,labels:{font:{family:'Heebo',size:11},boxWidth:12,padding:8}}},
      scales:{
        x:{type:'linear',title:{display:true,text:'מספר פרטים שנדגמו',font:{family:'Heebo',size:12}},min:1,max:maxN},
        y:{title:{display:true,text:'מספר מינים מצטבר',font:{family:'Heebo',size:12}},min:0,max:maxS+1,ticks:{stepSize:1}}
      }
    }
  });

  const last = accumRuns[accumRuns.length-1];
  const finalS = last.curve[last.curve.length-1];
  const sameParams = accumRuns.every(r => r.S===last.S && r.E===last.E && r.N===last.N);
  document.getElementById('accumExplain').innerHTML=`
    <strong>הרצה ${accumRuns.length} (S=${last.S}, J=${last.E.toFixed(2)}, N=${last.N}):</strong> נמצאו <strong>${finalS}/${last.S}</strong> מינים לאחר דגימת ${last.N} פרטים.
    ${finalS<last.S?`<span style="color:var(--coral)"> ${last.S-finalS} מינים לא נתגלו.</span>`:'<span style="color:var(--teal)"> כל המינים נמצאו.</span>'}
    ${accumRuns.length>1?(sameParams
      ?`<br>ההרצות שונות בשל <strong>סטוכסטיות</strong> — סדר הדגימה האקראי משנה אילו מינים מתגלים ראשונים.`
      :`<br>ההרצות משתמשות בפרמטרים שונים — השוו כיצד עושר, שוויון ומספר פרטים משנים את צורת העקומה.`):''}
  `;
}

function clearAccum(){
  accumRuns=[];
  if(accumChart){accumChart.destroy();accumChart=null;}
  document.getElementById('accumExplain').innerHTML='לחצו על <strong>דגום פעם אחת</strong> כדי ליצור עקומה.';
  document.getElementById('accumDots').innerHTML='';
  document.getElementById('accumMetrics').innerHTML='';
}

// ============================================================
// TOPIC 3: BETA DIVERSITY — animal icons as mini SVGs
// ============================================================
const SPECIES_ICONS = {
  'ציפור':  `<svg width="18" height="18" viewBox="0 0 18 18"><ellipse cx="8" cy="10" rx="6" ry="4" fill="currentColor" opacity=".8"/><circle cx="13" cy="6" r="2.5" fill="currentColor" opacity=".85"/><polygon points="15.5,6 18,5.3 15.5,7.3" fill="currentColor" opacity=".9"/><path d="M4 9 Q0 7 2 11" fill="currentColor" opacity=".6"/></svg>`,
  'ארנב':   `<svg width="18" height="18" viewBox="0 0 18 18"><ellipse cx="9" cy="12" rx="5" ry="4" fill="currentColor" opacity=".8"/><circle cx="9" cy="7" r="3" fill="currentColor" opacity=".85"/><ellipse cx="7" cy="2" rx="1.2" ry="4" fill="currentColor" opacity=".7"/><ellipse cx="11" cy="2" rx="1.2" ry="4" fill="currentColor" opacity=".7"/></svg>`,
  'שועל':   `<svg width="18" height="18" viewBox="0 0 18 18"><path d="M4 13 Q4 6 9 6 Q14 6 14 13 Z" fill="currentColor" opacity=".8"/><polygon points="4,7 2,2 7,6" fill="currentColor" opacity=".85"/><polygon points="14,7 16,2 11,6" fill="currentColor" opacity=".85"/></svg>`,
  'צבי':    `<svg width="18" height="18" viewBox="0 0 18 18"><ellipse cx="9" cy="12" rx="5" ry="4" fill="currentColor" opacity=".8"/><circle cx="9" cy="6" r="2.5" fill="currentColor" opacity=".85"/><path d="M7 4 Q5 2 3 3 M7 4 Q6 1 4 1 M11 4 Q13 2 15 3 M11 4 Q12 1 14 1" stroke="currentColor" stroke-width="1" fill="none" opacity=".7"/></svg>`,
  'נחש':    `<svg width="18" height="18" viewBox="0 0 18 18"><path d="M3 15 Q3 11 7 11 Q11 11 11 7 Q11 3 7 3" stroke="currentColor" stroke-width="2.2" fill="none" opacity=".8"/><circle cx="6.3" cy="3" r="1.6" fill="currentColor" opacity=".9"/></svg>`,
  'חיפושית':`<svg width="18" height="18" viewBox="0 0 18 18"><ellipse cx="9" cy="10" rx="4" ry="6" fill="currentColor" opacity=".8"/><circle cx="9" cy="4" r="2" fill="currentColor" opacity=".85"/><path d="M5 8 L2 6 M5 11 L2 11 M5 14 L2 16 M13 8 L16 6 M13 11 L16 11 M13 14 L16 16" stroke="currentColor" stroke-width="1" opacity=".7"/></svg>`,
  'צפרדע':  `<svg width="18" height="18" viewBox="0 0 18 18"><ellipse cx="9" cy="11" rx="6" ry="4.5" fill="currentColor" opacity=".8"/><circle cx="6" cy="6" r="2" fill="currentColor" opacity=".85"/><circle cx="12" cy="6" r="2" fill="currentColor" opacity=".85"/><ellipse cx="3" cy="14" rx="2" ry="1.2" fill="currentColor" opacity=".6"/><ellipse cx="15" cy="14" rx="2" ry="1.2" fill="currentColor" opacity=".6"/></svg>`,
  'עכבר':   `<svg width="18" height="18" viewBox="0 0 18 18"><ellipse cx="8" cy="11" rx="5" ry="4" fill="currentColor" opacity=".8"/><circle cx="12" cy="7" r="3" fill="currentColor" opacity=".85"/><circle cx="10.5" cy="4.5" r="1.3" fill="currentColor" opacity=".7"/><circle cx="13.5" cy="4.8" r="1.3" fill="currentColor" opacity=".7"/><path d="M3 11 Q0 13 1 16" stroke="currentColor" stroke-width="1" fill="none" opacity=".6"/></svg>`,
  'פרפר':   `<svg width="18" height="18" viewBox="0 0 18 18"><ellipse cx="9" cy="9" rx="1" ry="6" fill="currentColor" opacity=".9"/><ellipse cx="5" cy="6" rx="4" ry="3" fill="currentColor" opacity=".7"/><ellipse cx="13" cy="6" rx="4" ry="3" fill="currentColor" opacity=".7"/><ellipse cx="5" cy="11" rx="3" ry="2.5" fill="currentColor" opacity=".6"/><ellipse cx="13" cy="11" rx="3" ry="2.5" fill="currentColor" opacity=".6"/></svg>`,
  'צב':     `<svg width="18" height="18" viewBox="0 0 18 18"><ellipse cx="9" cy="10" rx="6" ry="5" fill="currentColor" opacity=".8"/><path d="M9 5 L9 15 M4 7 L14 7 M4 13 L14 13" stroke="currentColor" stroke-width=".8" opacity=".4"/><circle cx="9" cy="3.5" r="2" fill="currentColor" opacity=".85"/><ellipse cx="2.5" cy="9" rx="1.5" ry="2" fill="currentColor" opacity=".7"/><ellipse cx="15.5" cy="9" rx="1.5" ry="2" fill="currentColor" opacity=".7"/></svg>`
};

const SPECIES_HEX = {
  'ציפור':'#378ADD','ארנב':'#BA7517','שועל':'#E2703A','צבי':'#8B5E3C',
  'נחש':'#4C9A2A','חיפושית':'#2C2C2A','צפרדע':'#3FA34D','עכבר':'#888780',
  'פרפר':'#D4537E','צב':'#1D9E75'
};

const BETA_SPECIES = Object.keys(SPECIES_ICONS);
let siteA = new Set(['ציפור','ארנב','שועל','צבי','נחש']);
let siteB = new Set(['ציפור','ארנב','חיפושית','צפרדע','עכבר']);

function buildBetaChips() {
  ['A','B'].forEach(site => {
    const container = document.getElementById('site'+site+'chips');
    const set = site==='A' ? siteA : siteB;
    container.innerHTML = '';
    BETA_SPECIES.forEach(sp => {
      const chip = document.createElement('span');
      const active = set.has(sp);
      chip.className = 's-chip ' + (active ? 'active' : 'inactive');
      const col = active ? 'white' : SPECIES_HEX[sp];
      chip.innerHTML = `<span style="color:${col};display:inline-flex;">${SPECIES_ICONS[sp]}</span>${sp}`;
      chip.onclick = () => {
        if(set.has(sp)) set.delete(sp); else set.add(sp);
        buildBetaChips(); updateBeta();
      };
      container.appendChild(chip);
    });
  });
}

function renderVennIcons(containerId, speciesArr, centerX, y) {
  const container = document.getElementById(containerId);
  const maxIcons = 4;
  const shown = speciesArr.slice(0, maxIcons);
  const extra = speciesArr.length - shown.length;
  const iconSize = 20, gap = 4;
  const totalWidth = shown.length ? shown.length*iconSize + (shown.length-1)*gap : 0;
  const startX = centerX - totalWidth/2;
  container.innerHTML = shown.map(sp => SPECIES_ICONS[sp]).join('');
  Array.from(container.children).forEach((svgEl, i) => {
    svgEl.setAttribute('x', startX + i*(iconSize+gap));
    svgEl.setAttribute('y', y);
    svgEl.setAttribute('width', iconSize);
    svgEl.setAttribute('height', iconSize);
    svgEl.style.color = SPECIES_HEX[shown[i]];
  });
  if (extra > 0) {
    const extraText = document.createElementNS('http://www.w3.org/2000/svg','text');
    extraText.setAttribute('x', startX + totalWidth + 12);
    extraText.setAttribute('y', y + iconSize*0.7);
    extraText.setAttribute('font-size', '12');
    extraText.setAttribute('fill', '#6b6b5e');
    extraText.setAttribute('font-family', 'Heebo,sans-serif');
    extraText.textContent = `+${extra}`;
    container.appendChild(extraText);
  }
}

function updateBeta() {
  const shared = new Set([...siteA].filter(x => siteB.has(x)));
  const bOnly  = new Set([...siteB].filter(x => !siteA.has(x)));
  const aOnly  = new Set([...siteA].filter(x => !siteB.has(x)));
  const a=shared.size, b=bOnly.size, c=aOnly.size;
  const gamma = new Set([...siteA,...siteB]).size;
  const jaccard = (a+b+c)>0 ? a/(a+b+c) : 0;

  document.getElementById('alphaA').textContent = siteA.size;
  document.getElementById('alphaB').textContent = siteB.size;
  document.getElementById('gammaAB').textContent = gamma;
  document.getElementById('betaJacc').textContent = jaccard.toFixed(3);

  // --- dynamic Venn geometry: circles only overlap if species are shared ---
  const r = 90, centerX = 240, gapWhenSeparate = 24;
  let dist;
  if (a === 0) {
    dist = 2*r + gapWhenSeparate;
  } else {
    const distAtLowOverlap = 2*r - 12;
    dist = distAtLowOverlap * (1 - jaccard);
  }
  const cxA = centerX - dist/2;
  const cxB = centerX + dist/2;
  document.getElementById('vCircleA').setAttribute('cx', cxA);
  document.getElementById('vCircleB').setAttribute('cx', cxB);
  const offsetA = cxA - r*0.55;
  const offsetB = cxB + r*0.55;
  ['vAcount','vALabel'].forEach(id => document.getElementById(id).setAttribute('x', offsetA));
  ['vBcount','vBLabel'].forEach(id => document.getElementById(id).setAttribute('x', offsetB));
  document.getElementById('vSharedCount').setAttribute('x', centerX);
  document.getElementById('vSharedLabel').setAttribute('x', centerX);

  renderVennIcons('vAIcons', [...aOnly], offsetA, 100);
  renderVennIcons('vBIcons', [...bOnly], offsetB, 100);
  renderVennIcons('vSharedIcons', [...shared], centerX, 100);
  document.getElementById('vAcount').textContent = aOnly.size ? `(${aOnly.size})` : '0';
  document.getElementById('vBcount').textContent = bOnly.size ? `(${bOnly.size})` : '0';
  document.getElementById('vSharedCount').textContent = `(${a})`;
  // when circles fully/mostly overlap, aOnly/bOnly are empty — hide the now-crowded captions
  document.getElementById('vALabel').style.display = aOnly.size ? '' : 'none';
  document.getElementById('vBLabel').style.display = bOnly.size ? '' : 'none';

  const interp = jaccard>=0.7 ? 'חברות דומות מאוד — כנראה מחוברות או אותו סוג בית גידול.' :
                 jaccard>=0.4 ? 'דמיון בינוני — מאגר מינים אזורי משותף חלקית.' :
                 jaccard>=0.1 ? 'דמיון נמוך — תחלופת מינים משמעותית בין האתרים.' :
                 'דמיון כמעט אפסי — חברות שונות לחלוטין.';
  document.getElementById('betaExplain').innerHTML =
    `<strong>a=${a}</strong> משותפים, <strong>b=${b}</strong> ייחודיים לב', <strong>c=${c}</strong> ייחודיים לא' → β_Jaccard = ${a}/(${a}+${b}+${c}) = <strong>${jaccard.toFixed(3)}</strong>. ${interp}`;
}

// ============================================================
// TOPIC 4: SPECIES-AREA RELATIONSHIP
// ============================================================
const SIPOO = [
  ['Svartholm',0.01,3],['L.Hogholm',0.02,4],['Ledholmen',0.02,4],
  ['S.Hogholm',0.03,5],['Ramsholmen',0.04,4],['Lill-Klobben',0.05,5],
  ['Hamnholmen',0.08,6],['Klobben',0.12,7],['Granholmen',0.15,6],
  ['Storholm',0.22,8],['Fagerholm',0.35,9],['Stora Pellinki',0.5,10],
  ['Kallbadagrund',0.8,11],['Emsalo',1.2,12],['Pellinki',2.1,14],
  ['Sarvsalo',3.5,15],['Bodo',6.0,17],['Bodo main',12.0,19]
];
let sarChart=null, sarLogMode=false;

function computeSAR(area,c,z){return c*Math.pow(area,z);}

function updateSAR(){
  const z=+document.getElementById('sarZ').value;
  const c=+document.getElementById('sarC').value;
  document.getElementById('sarZval').textContent=z.toFixed(2);
  document.getElementById('sarCval').textContent=c.toFixed(1);
  renderSAR(z,c);
}

function fitSAR(){
  const pts=SIPOO.map(([,a,s])=>[Math.log(a),Math.log(s)]);
  const n=pts.length;
  const mx=pts.reduce((s,[x])=>s+x,0)/n;
  const my=pts.reduce((s,[,y])=>s+y,0)/n;
  const z=pts.reduce((s,[x,y])=>s+(x-mx)*(y-my),0)/pts.reduce((s,[x])=>s+(x-mx)**2,0);
  const c=Math.exp(my-z*mx);
  document.getElementById('sarZ').value=Math.min(0.65,Math.max(0.05,z)).toFixed(2);
  document.getElementById('sarC').value=Math.min(5,Math.max(0.5,c)).toFixed(1);
  updateSAR();
  document.getElementById('sarExplain').innerHTML=`<strong>התאמה מיטבית:</strong> Z = ${z.toFixed(3)}, a = ${c.toFixed(2)}. ערך Z זה ${z>0.35?'גבוה מהטיפוסי לאזורים יבשתיים':'בטווח הטיפוסי (0.2–0.35) לארכיפלגים של איים'}.`;
}

function toggleLog(){sarLogMode=!sarLogMode;updateSAR();}

function renderSAR(z,c){
  const scatter=SIPOO.map(([name,area,sp])=>({x:sarLogMode?Math.log(area):area,y:sarLogMode?Math.log(sp):sp,name}));
  const lineX=sarLogMode
    ?Array.from({length:50},(_,i)=>Math.log(0.005)+i*(Math.log(15)-Math.log(0.005))/49)
    :Array.from({length:50},(_,i)=>0.005+i*11.995/49);
  const lineY=lineX.map(x=>sarLogMode?Math.log(c)+z*x:computeSAR(x,c,z));

  if(sarChart) sarChart.destroy();
  const ctx=document.getElementById('sarChart').getContext('2d');
  sarChart=new Chart(ctx,{
    type:'scatter',
    data:{datasets:[
      {label:'איים',data:scatter,backgroundColor:'#0f6e5699',pointRadius:6,pointHoverRadius:8,type:'scatter'},
      {label:`SPP = ${c.toFixed(1)} · A^${z.toFixed(2)}`,data:lineX.map((x,i)=>({x,y:lineY[i]})),type:'line',borderColor:'#993c1d',backgroundColor:'transparent',pointRadius:0,borderWidth:2.5,borderDash:[6,3]}
    ]},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{labels:{font:{family:'Heebo',size:11},boxWidth:12}},
        tooltip:{callbacks:{label:(ctx)=>ctx.dataset.label==='איים'?`${scatter[ctx.dataIndex]?.name}: ${sarLogMode?'ln(A)='+ctx.parsed.x.toFixed(2)+', ln(SPP)='+ctx.parsed.y.toFixed(2):'A='+ctx.parsed.x.toFixed(2)+'קמ"ר, SPP='+Math.round(ctx.parsed.y)}`:''}}},
      scales:{
        x:{title:{display:true,text:sarLogMode?'ln(שטח)':'שטח (קמ"ר)',font:{family:'Heebo',size:12}}},
        y:{title:{display:true,text:sarLogMode?'ln(מינים)':'מספר מינים',font:{family:'Heebo',size:12}}}
      }
    }
  });
}

// ============================================================
// PAGE INIT
// ============================================================
renderSiteNav();
buildSliders(document.getElementById('slidersA'), commAvals, 'A');
buildSliders(document.getElementById('slidersB'), commBvals, 'B');
renderComm('A'); renderComm('B'); renderCompare();
buildBetaChips(); updateBeta();
renderSAR(0.28,2.0);
