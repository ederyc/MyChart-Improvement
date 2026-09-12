let zipMap = {};
let allCounties = [];
let allStates = [];

const STATE_NAMES = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
  IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
  ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan',
  MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana',
  NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota',
  OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania',
  PR: 'Puerto Rico', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah',
  VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia',
  WI: 'Wisconsin', WY: 'Wyoming',
};

let currentMode = 'before';
let timerHandle = null;
let timerStart = 0;

const els = {
  modeBtns: document.querySelectorAll('.mode-btn'),
  form: document.getElementById('addressForm'),
  cityInput: document.getElementById('cityInput'),
  stateInput: document.getElementById('stateInput'),
  zipInput: document.getElementById('zipInput'),

  countyStep: document.getElementById('countyStep'),
  beforeCounty: document.getElementById('beforeCounty'),
  afterCounty: document.getElementById('afterCounty'),

  countyTotalCount: document.getElementById('countyTotalCount'),
  countySelectBefore: document.getElementById('countySelectBefore'),
  confirmBefore: document.getElementById('confirmBefore'),
  timerBefore: document.getElementById('timerBefore'),

  afterResult: document.getElementById('afterResult'),
  revealManual: document.getElementById('revealManual'),
  manualFallback: document.getElementById('manualFallback'),
  countyStateCount: document.getElementById('countyStateCount'),
  countySelectAfter: document.getElementById('countySelectAfter'),
  confirmAfter: document.getElementById('confirmAfter'),
  timerAfter: document.getElementById('timerAfter'),

  doneStep: document.getElementById('doneStep'),
  doneDetail: document.getElementById('doneDetail'),
  tryAgain: document.getElementById('tryAgain'),
};

async function loadData() {
  const [zipRes, countyRes] = await Promise.all([
    fetch('data/zip_to_county.json'),
    fetch('data/all_counties.json'),
  ]);
  zipMap = await zipRes.json();
  allCounties = await countyRes.json();
  allStates = [...new Set(allCounties.map((c) => c.split(', ').pop()))].sort();

  els.countyTotalCount.textContent = allCounties.length.toLocaleString();

  allStates
    .map((abbr) => ({ abbr, name: STATE_NAMES[abbr] || abbr }))
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach(({ abbr, name }) => {
      const opt = document.createElement('option');
      opt.value = abbr;
      opt.textContent = name;
      els.stateInput.appendChild(opt);
    });

  populateSelect(els.countySelectBefore, allCounties, 'Choose a county\u2026');
}

function populateSelect(selectEl, list, placeholder) {
  selectEl.innerHTML = '';
  const ph = document.createElement('option');
  ph.value = '';
  ph.textContent = placeholder;
  selectEl.appendChild(ph);
  list.forEach((c) => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    selectEl.appendChild(opt);
  });
}

function startTimer(displayEl) {
  timerStart = performance.now();
  clearInterval(timerHandle);
  timerHandle = setInterval(() => {
    const elapsed = (performance.now() - timerStart) / 1000;
    displayEl.textContent = elapsed.toFixed(1) + 's';
  }, 100);
}

function stopTimer() {
  clearInterval(timerHandle);
  return (performance.now() - timerStart) / 1000;
}

function resetToForm() {
  clearInterval(timerHandle);
  els.form.reset();
  els.form.hidden = false;
  els.countyStep.hidden = true;
  els.beforeCounty.hidden = true;
  els.afterCounty.hidden = true;
  els.doneStep.hidden = true;
  els.manualFallback.hidden = true;
  els.confirmBefore.disabled = true;
  els.confirmAfter.disabled = true;
  els.timerBefore.textContent = '0.0s';
  els.timerAfter.textContent = '0.0s';
}

/* ---------- Mode toggle ---------- */

els.modeBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    currentMode = btn.dataset.mode;
    els.modeBtns.forEach((b) => {
      b.classList.toggle('active', b === btn);
      b.setAttribute('aria-selected', String(b === btn));
    });
    resetToForm();
  });
});

/* ---------- Form submit ---------- */

els.form.addEventListener('submit', (e) => {
  e.preventDefault();
  const zip = els.zipInput.value.trim();
  const state = els.stateInput.value;

  els.form.hidden = true;
  els.countyStep.hidden = false;

  if (currentMode === 'before') {
    els.beforeCounty.hidden = false;
    els.afterCounty.hidden = true;
    els.countySelectBefore.value = '';
    els.confirmBefore.disabled = true;
    startTimer(els.timerBefore);
  } else {
    els.beforeCounty.hidden = true;
    els.afterCounty.hidden = false;
    els.manualFallback.hidden = true;
    startTimer(els.timerAfter);
    renderAfterResult(zip, state);
  }
});

/* ---------- Before flow ---------- */

els.countySelectBefore.addEventListener('change', () => {
  els.confirmBefore.disabled = !els.countySelectBefore.value;
});

els.confirmBefore.addEventListener('click', () => {
  const elapsed = stopTimer();
  const zip = els.zipInput.value.trim();
  const picked = els.countySelectBefore.value;
  const correct = zipMap[zip] ? `${zipMap[zip].county}, ${zipMap[zip].state}` : null;

  let detail = `You searched a list of ${allCounties.length.toLocaleString()} counties and picked "${picked}" in ${elapsed.toFixed(1)}s.`;
  if (correct && picked !== correct) {
    detail += ` That doesn't actually match ZIP ${zip} (should be ${correct}), but the current flow never checks.`;
  }
  showDone(detail);
});

/* ---------- After flow ---------- */

function renderAfterResult(zip, state) {
  const match = zipMap[zip];
  if (match) {
    const correct = `${match.county}, ${match.state}`;
    els.afterResult.className = 'after-result';
    els.afterResult.innerHTML = `
      <span class="check">&#10003;</span>County: <strong>${correct}</strong>
      <span class="sub">Detected automatically from ZIP ${zip} (${match.city}, ${match.state}). No list to search.</span>
      <button type="button" id="confirmAfterAuto" class="btn btn-primary" style="margin-top:14px;">Confirm</button>
    `;
    document.getElementById('confirmAfterAuto').addEventListener('click', () => {
      const elapsed = stopTimer();
      showDone(`Confirmed "${correct}" automatically in ${elapsed.toFixed(1)}s. No manual search needed.`);
    });
  } else {
    els.afterResult.className = 'after-result not-found';
    els.afterResult.innerHTML = `
      <span class="check">&#8288;</span>We couldn't automatically match ZIP "${zip}".
      <span class="sub">Falling back to a manual pick, still narrowed to your state instead of the whole country.</span>
    `;
    revealManualFallback(state);
  }
}

function revealManualFallback(state) {
  els.manualFallback.hidden = false;
  const filtered = state
    ? allCounties.filter((c) => c.endsWith(', ' + state))
    : allCounties;
  els.countyStateCount.textContent = filtered.length.toLocaleString();
  populateSelect(els.countySelectAfter, filtered, 'Choose a county\u2026');
  els.confirmAfter.disabled = true;
}

els.revealManual.addEventListener('click', () => {
  const state = els.stateInput.value;
  revealManualFallback(state);
});

els.countySelectAfter.addEventListener('change', () => {
  els.confirmAfter.disabled = !els.countySelectAfter.value;
});

els.confirmAfter.addEventListener('click', () => {
  const elapsed = stopTimer();
  const picked = els.countySelectAfter.value;
  const count = els.countyStateCount.textContent;
  showDone(`You picked "${picked}" from a list narrowed to ${count} counties in ${elapsed.toFixed(1)}s.`);
});

/* ---------- Done ---------- */

function showDone(detail) {
  els.countyStep.hidden = true;
  els.doneStep.hidden = false;
  els.doneDetail.textContent = detail;
}

els.tryAgain.addEventListener('click', resetToForm);

loadData();
