/**
 * Garment Inspection System – Frontend Application
 * Fetches all data from the Express backend and drives the UI.
 */

const API = '';  // same-origin, served by Express

// ── DOM References ──────────────────────────────────────────
const $ = (id) => document.getElementById(id);

const dom = {
  // Header
  operatorName:     $('operator-name'),
  headerBatch:      $('header-batch-select'),
  clockMain:        $('clock-main'),
  clockSub:         $('clock-sub'),

  // Current Status
  sBarcode:         $('s-barcode'),
  sScan:            $('s-scan'),
  sInspection:      $('s-inspection'),
  sSorting:         $('s-sorting'),
  sBatch:           $('s-batch'),

  // Production Summary
  sumTotal:         $('sum-total'),
  sumAccepted:      $('sum-accepted'),
  sumEfficiency:    $('sum-efficiency'),
  sumInspected:     $('sum-inspected'),
  sumTotal2:        $('sum-total2'),
  sumPercent:       $('sum-percent'),
  sumProgressBar:   $('sum-progress-bar'),

  // Inspection Results
  resPassCount:     $('res-pass-count'),
  resPassTotal:     $('res-pass-total'),
  resPassBar:       $('res-pass-bar'),
  resPassDest:      $('res-pass-dest'),
  resPassEff:       $('res-pass-eff'),
  resRejCount:      $('res-rej-count'),
  resRejTotal:      $('res-rej-total'),
  resRejBar:        $('res-rej-bar'),
  resRejDest:       $('res-rej-dest'),
  resRejEff:        $('res-rej-eff'),

  // Table
  tableBatch:       $('table-batch-select'),
  recordsTbody:     $('records-tbody'),

  // Batch Info
  batchInfoSection: $('batch-info-section'),
  batchGarmentType: $('batch-garment-type'),
  sizeAccordion:    $('size-accordion'),

  // Alerts
  alertsHardware:   $('alerts-hardware'),
  alertsDefect:     $('alerts-defect'),

  // Buttons
  btnStart:         $('btn-start'),
  btnReset:         $('btn-reset'),
  btnExport:        $('btn-export'),
};

let isRunning = false;
let scanInterval = null;
let selectedSize    = null;   // tracks size selection
let selectedFabric  = null;   // tracks fabric type selection
let selectedCountry = null;   // tracks country selection

// ── Batch Configuration Data ─────────────────────────────────
// Batch-001 supports multiple fabric types; operator must select fabric then size.
// Other batches have a single garment type with direct size selection.
const BATCH_CONFIG = {
  'Batch-001': {
    multiFabric: true,   // flag: show fabric-type selector first
    fabricTypes: {
      'T-Shirt': {
        icon: '👕',
        sizes: {
          S:   { length: 68, width: 46, breadth: 2, adjustable: '1–4 cm' },
          M:   { length: 71, width: 50, breadth: 2, adjustable: '1–5 cm' },
          L:   { length: 74, width: 54, breadth: 2, adjustable: '1–5 cm' },
          XL:  { length: 77, width: 58, breadth: 2, adjustable: '1–6 cm' },
          XXL: { length: 80, width: 62, breadth: 2, adjustable: '1–6 cm' },
        },
      },
      'Shirt': {
        icon: '👔',
        sizes: {
          S:   { length: 70, width: 42, breadth: 2, adjustable: '1–3 cm' },
          M:   { length: 73, width: 46, breadth: 2, adjustable: '1–4 cm' },
          L:   { length: 76, width: 50, breadth: 2, adjustable: '1–5 cm' },
          XL:  { length: 79, width: 54, breadth: 2, adjustable: '1–5 cm' },
          XXL: { length: 82, width: 58, breadth: 2, adjustable: '1–6 cm' },
        },
      },
      'Full Trouser': {
        icon: '👖',
        sizes: {
          S:   { length: 98,  width: 34, breadth: 3, adjustable: '1–3 cm' },
          M:   { length: 100, width: 36, breadth: 3, adjustable: '1–4 cm' },
          L:   { length: 102, width: 38, breadth: 3, adjustable: '1–5 cm' },
          XL:  { length: 104, width: 40, breadth: 3, adjustable: '1–5 cm' },
          XXL: { length: 106, width: 42, breadth: 3, adjustable: '1–6 cm' },
        },
      },
      'Half Trouser': {
        icon: '🩳',
        sizes: {
          S:   { length: 52, width: 34, breadth: 2, adjustable: '1–3 cm' },
          M:   { length: 54, width: 36, breadth: 2, adjustable: '1–4 cm' },
          L:   { length: 56, width: 38, breadth: 2, adjustable: '1–4 cm' },
          XL:  { length: 58, width: 40, breadth: 2, adjustable: '1–5 cm' },
          XXL: { length: 60, width: 42, breadth: 2, adjustable: '1–5 cm' },
        },
      },
      'Jacket': {
        icon: '🧥',
        sizes: {
          S:   { length: 65, width: 48, breadth: 3, adjustable: '1–3 cm' },
          M:   { length: 68, width: 52, breadth: 3, adjustable: '1–4 cm' },
          L:   { length: 71, width: 56, breadth: 3, adjustable: '1–5 cm' },
          XL:  { length: 74, width: 60, breadth: 3, adjustable: '1–5 cm' },
          XXL: { length: 77, width: 64, breadth: 3, adjustable: '1–6 cm' },
        },
      },
      'Kurta': {
        icon: '🥻',
        sizes: {
          S:   { length: 40, width: 40, breadth: 2, adjustable: '1–3 cm' },
          M:   { length: 42, width: 42, breadth: 2, adjustable: '1–4 cm' },
          L:   { length: 44, width: 44, breadth: 2, adjustable: '1–5 cm' },
          XL:  { length: 46, width: 46, breadth: 2, adjustable: '1–5 cm' },
          XXL: { length: 48, width: 48, breadth: 2, adjustable: '1–6 cm' },
        },
      },
    },
  },
  'Batch-002': {
    multiFabric: true,
    fabricTypes: {
      'T-Shirt':      { icon: '👕', sizes: { S:{length:68,width:46,breadth:2,adjustable:'1–4 cm'}, M:{length:71,width:50,breadth:2,adjustable:'1–5 cm'}, L:{length:74,width:54,breadth:2,adjustable:'1–5 cm'}, XL:{length:77,width:58,breadth:2,adjustable:'1–6 cm'}, XXL:{length:80,width:62,breadth:2,adjustable:'1–6 cm'} } },
      'Shirt':        { icon: '👔', sizes: { S:{length:70,width:42,breadth:2,adjustable:'1–3 cm'}, M:{length:73,width:46,breadth:2,adjustable:'1–4 cm'}, L:{length:76,width:50,breadth:2,adjustable:'1–5 cm'}, XL:{length:79,width:54,breadth:2,adjustable:'1–5 cm'}, XXL:{length:82,width:58,breadth:2,adjustable:'1–6 cm'} } },
      'Full Trouser': { icon: '👖', sizes: { S:{length:98,width:34,breadth:3,adjustable:'1–3 cm'},  M:{length:100,width:36,breadth:3,adjustable:'1–4 cm'}, L:{length:102,width:38,breadth:3,adjustable:'1–5 cm'}, XL:{length:104,width:40,breadth:3,adjustable:'1–5 cm'}, XXL:{length:106,width:42,breadth:3,adjustable:'1–6 cm'} } },
      'Half Trouser': { icon: '🩳', sizes: { S:{length:52,width:34,breadth:2,adjustable:'1–3 cm'},  M:{length:54,width:36,breadth:2,adjustable:'1–4 cm'}, L:{length:56,width:38,breadth:2,adjustable:'1–4 cm'}, XL:{length:58,width:40,breadth:2,adjustable:'1–5 cm'}, XXL:{length:60,width:42,breadth:2,adjustable:'1–5 cm'} } },
      'Jacket':       { icon: '🧥', sizes: { S:{length:65,width:48,breadth:3,adjustable:'1–3 cm'},  M:{length:68,width:52,breadth:3,adjustable:'1–4 cm'}, L:{length:71,width:56,breadth:3,adjustable:'1–5 cm'}, XL:{length:74,width:60,breadth:3,adjustable:'1–5 cm'}, XXL:{length:77,width:64,breadth:3,adjustable:'1–6 cm'} } },
      'Kurta':        { icon: '🥻', sizes: { S:{length:40,width:40,breadth:2,adjustable:'1–3 cm'},  M:{length:42,width:42,breadth:2,adjustable:'1–4 cm'}, L:{length:44,width:44,breadth:2,adjustable:'1–5 cm'}, XL:{length:46,width:46,breadth:2,adjustable:'1–5 cm'}, XXL:{length:48,width:48,breadth:2,adjustable:'1–6 cm'} } },
    },
  },
  'Batch-003': {
    multiFabric: true,
    fabricTypes: {
      'T-Shirt':      { icon: '👕', sizes: { S:{length:68,width:46,breadth:2,adjustable:'1–4 cm'}, M:{length:71,width:50,breadth:2,adjustable:'1–5 cm'}, L:{length:74,width:54,breadth:2,adjustable:'1–5 cm'}, XL:{length:77,width:58,breadth:2,adjustable:'1–6 cm'}, XXL:{length:80,width:62,breadth:2,adjustable:'1–6 cm'} } },
      'Shirt':        { icon: '👔', sizes: { S:{length:70,width:42,breadth:2,adjustable:'1–3 cm'}, M:{length:73,width:46,breadth:2,adjustable:'1–4 cm'}, L:{length:76,width:50,breadth:2,adjustable:'1–5 cm'}, XL:{length:79,width:54,breadth:2,adjustable:'1–5 cm'}, XXL:{length:82,width:58,breadth:2,adjustable:'1–6 cm'} } },
      'Full Trouser': { icon: '👖', sizes: { S:{length:98,width:34,breadth:3,adjustable:'1–3 cm'},  M:{length:100,width:36,breadth:3,adjustable:'1–4 cm'}, L:{length:102,width:38,breadth:3,adjustable:'1–5 cm'}, XL:{length:104,width:40,breadth:3,adjustable:'1–5 cm'}, XXL:{length:106,width:42,breadth:3,adjustable:'1–6 cm'} } },
      'Half Trouser': { icon: '🩳', sizes: { S:{length:52,width:34,breadth:2,adjustable:'1–3 cm'},  M:{length:54,width:36,breadth:2,adjustable:'1–4 cm'}, L:{length:56,width:38,breadth:2,adjustable:'1–4 cm'}, XL:{length:58,width:40,breadth:2,adjustable:'1–5 cm'}, XXL:{length:60,width:42,breadth:2,adjustable:'1–5 cm'} } },
      'Jacket':       { icon: '🧥', sizes: { S:{length:65,width:48,breadth:3,adjustable:'1–3 cm'},  M:{length:68,width:52,breadth:3,adjustable:'1–4 cm'}, L:{length:71,width:56,breadth:3,adjustable:'1–5 cm'}, XL:{length:74,width:60,breadth:3,adjustable:'1–5 cm'}, XXL:{length:77,width:64,breadth:3,adjustable:'1–6 cm'} } },
      'Kurta':        { icon: '🥻', sizes: { S:{length:40,width:40,breadth:2,adjustable:'1–3 cm'},  M:{length:42,width:42,breadth:2,adjustable:'1–4 cm'}, L:{length:44,width:44,breadth:2,adjustable:'1–5 cm'}, XL:{length:46,width:46,breadth:2,adjustable:'1–5 cm'}, XXL:{length:48,width:48,breadth:2,adjustable:'1–6 cm'} } },
    },
  },
};

// ── Country-specific size data ───────────────────────────────
// Sizes vary by export market: India (South Asian), Canada (North American), Malaysia (South-East Asian)
const COUNTRY_SIZES = {
  '🇮🇳 India': {
    'T-Shirt':      { S:{length:68,width:46,breadth:44,adjustable:'1–2 cm'}, M:{length:71,width:50,breadth:48,adjustable:'1–2 cm'}, L:{length:74,width:54,breadth:52,adjustable:'1–3 cm'}, XL:{length:77,width:58,breadth:56,adjustable:'1–3 cm'}, XXL:{length:80,width:62,breadth:60,adjustable:'1–4 cm'} },
    'Shirt':        { S:{length:72,width:40,breadth:38,adjustable:'1–2 cm'}, M:{length:75,width:43,breadth:41,adjustable:'1–2 cm'}, L:{length:78,width:46,breadth:44,adjustable:'1–3 cm'}, XL:{length:81,width:49,breadth:47,adjustable:'1–3 cm'}, XXL:{length:84,width:52,breadth:50,adjustable:'1–4 cm'} },
    'Full Trouser': { '28"':{length:98,width:38,breadth:36,adjustable:'1–2 cm'}, '30"':{length:100,width:40,breadth:38,adjustable:'1–2 cm'}, '32"':{length:102,width:42,breadth:40,adjustable:'1–3 cm'}, '34"':{length:104,width:44,breadth:42,adjustable:'1–3 cm'}, '36"':{length:106,width:46,breadth:44,adjustable:'1–4 cm'} },
    'Half Trouser': { S:{length:52,width:36,breadth:34,adjustable:'1–2 cm'}, M:{length:54,width:38,breadth:36,adjustable:'1–2 cm'}, L:{length:56,width:40,breadth:38,adjustable:'1–3 cm'}, XL:{length:58,width:42,breadth:40,adjustable:'1–3 cm'}, XXL:{length:60,width:44,breadth:42,adjustable:'1–3 cm'} },
    'Jacket':       { S:{length:70,width:48,breadth:46,adjustable:'1–2 cm'}, M:{length:73,width:51,breadth:49,adjustable:'1–2 cm'}, L:{length:76,width:54,breadth:52,adjustable:'1–3 cm'}, XL:{length:79,width:57,breadth:55,adjustable:'1–3 cm'}, XXL:{length:82,width:60,breadth:58,adjustable:'1–4 cm'} },
    'Kurta':        { S:{length:100,width:42,breadth:40,adjustable:'1–2 cm'}, M:{length:103,width:44,breadth:42,adjustable:'1–2 cm'}, L:{length:106,width:46,breadth:44,adjustable:'1–3 cm'}, XL:{length:109,width:48,breadth:46,adjustable:'1–3 cm'}, XXL:{length:112,width:50,breadth:48,adjustable:'1–4 cm'} },
  },
  '🇨🇦 Canada': {
    'T-Shirt':      { S:{length:72,width:52,breadth:50,adjustable:'1–3 cm'}, M:{length:75,width:55,breadth:53,adjustable:'1–3 cm'}, L:{length:78,width:58,breadth:56,adjustable:'1–4 cm'}, XL:{length:81,width:61,breadth:59,adjustable:'1–4 cm'}, XXL:{length:84,width:64,breadth:62,adjustable:'1–5 cm'}, XXXL:{length:87,width:67,breadth:65,adjustable:'1–5 cm'} },
    'Shirt':        { S:{length:76,width:46,breadth:44,adjustable:'1–3 cm'}, M:{length:79,width:49,breadth:47,adjustable:'1–3 cm'}, L:{length:82,width:52,breadth:50,adjustable:'1–4 cm'}, XL:{length:85,width:55,breadth:53,adjustable:'1–4 cm'}, XXL:{length:88,width:58,breadth:56,adjustable:'1–5 cm'} },
    'Full Trouser': { '30"':{length:102,width:44,breadth:42,adjustable:'1–3 cm'}, '32"':{length:104,width:46,breadth:44,adjustable:'1–3 cm'}, '34"':{length:106,width:48,breadth:46,adjustable:'1–4 cm'}, '36"':{length:108,width:50,breadth:48,adjustable:'1–4 cm'}, '38"':{length:110,width:52,breadth:50,adjustable:'1–5 cm'} },
    'Half Trouser': { S:{length:56,width:42,breadth:40,adjustable:'1–3 cm'}, M:{length:58,width:44,breadth:42,adjustable:'1–3 cm'}, L:{length:60,width:46,breadth:44,adjustable:'1–4 cm'}, XL:{length:62,width:48,breadth:46,adjustable:'1–4 cm'}, XXL:{length:64,width:50,breadth:48,adjustable:'1–5 cm'} },
    'Jacket':       { S:{length:74,width:54,breadth:52,adjustable:'1–3 cm'}, M:{length:77,width:57,breadth:55,adjustable:'1–3 cm'}, L:{length:80,width:60,breadth:58,adjustable:'1–4 cm'}, XL:{length:83,width:63,breadth:61,adjustable:'1–4 cm'}, XXL:{length:86,width:66,breadth:64,adjustable:'1–5 cm'} },
    'Kurta':        { S:{length:104,width:48,breadth:46,adjustable:'1–3 cm'}, M:{length:107,width:50,breadth:48,adjustable:'1–3 cm'}, L:{length:110,width:52,breadth:50,adjustable:'1–4 cm'}, XL:{length:113,width:54,breadth:52,adjustable:'1–4 cm'}, XXL:{length:116,width:56,breadth:54,adjustable:'1–5 cm'} },
  },
  '🇲🇾 Malaysia': {
    'T-Shirt':      { S:{length:70,width:48,breadth:46,adjustable:'1–2 cm'}, M:{length:73,width:51,breadth:49,adjustable:'1–2 cm'}, L:{length:76,width:54,breadth:52,adjustable:'1–3 cm'}, XL:{length:79,width:57,breadth:55,adjustable:'1–3 cm'}, XXL:{length:82,width:60,breadth:58,adjustable:'1–4 cm'} },
    'Shirt':        { S:{length:74,width:42,breadth:40,adjustable:'1–2 cm'}, M:{length:77,width:45,breadth:43,adjustable:'1–2 cm'}, L:{length:80,width:48,breadth:46,adjustable:'1–3 cm'}, XL:{length:83,width:51,breadth:49,adjustable:'1–3 cm'}, XXL:{length:86,width:54,breadth:52,adjustable:'1–4 cm'} },
    'Full Trouser': { '28"':{length:100,width:40,breadth:38,adjustable:'1–2 cm'}, '30"':{length:102,width:42,breadth:40,adjustable:'1–2 cm'}, '32"':{length:104,width:44,breadth:42,adjustable:'1–3 cm'}, '34"':{length:106,width:46,breadth:44,adjustable:'1–3 cm'}, '36"':{length:108,width:48,breadth:46,adjustable:'1–4 cm'} },
    'Half Trouser': { S:{length:54,width:38,breadth:36,adjustable:'1–2 cm'}, M:{length:56,width:40,breadth:38,adjustable:'1–2 cm'}, L:{length:58,width:42,breadth:40,adjustable:'1–3 cm'}, XL:{length:60,width:44,breadth:42,adjustable:'1–3 cm'}, XXL:{length:62,width:46,breadth:44,adjustable:'1–4 cm'} },
    'Jacket':       { S:{length:72,width:50,breadth:48,adjustable:'1–2 cm'}, M:{length:75,width:53,breadth:51,adjustable:'1–2 cm'}, L:{length:78,width:56,breadth:54,adjustable:'1–3 cm'}, XL:{length:81,width:59,breadth:57,adjustable:'1–3 cm'}, XXL:{length:84,width:62,breadth:60,adjustable:'1–4 cm'} },
    'Kurta':        { S:{length:102,width:44,breadth:42,adjustable:'1–2 cm'}, M:{length:105,width:46,breadth:44,adjustable:'1–2 cm'}, L:{length:108,width:48,breadth:46,adjustable:'1–3 cm'}, XL:{length:111,width:50,breadth:48,adjustable:'1–3 cm'}, XXL:{length:114,width:52,breadth:50,adjustable:'1–4 cm'} },
  },
};

const COUNTRIES = Object.keys(COUNTRY_SIZES);

// ── Alert Definitions ───────────────────────────────────────
const ALERT_TYPES = {
  hardware: [
    { id: 'label-missing',  msg: 'Label Missing',   icon: '🏷️' },
    { id: 'conveyor-jam',   msg: 'Conveyor Jam',     icon: '⚙️' },
    { id: 'camera-error',   msg: 'Camera Error',     icon: '📷' },
  ],
  defect: [
    { id: 'torn-cloth',     msg: 'Torn Clothes',     icon: '🪡' },
    { id: 'size-mismatch',  msg: 'Size Mismatch',    icon: '📏' },
    { id: 'faded-fabric',   msg: 'Faded Fabric',     icon: '🎨' },
    { id: 'stain',          msg: 'Stain Detected',   icon: '💧' },
    { id: 'loose-thread',   msg: 'Loose Thread',     icon: '🧵' },
  ],
};

// Render all alert items — active IDs glow, rest are idle
function renderAlerts(activeIds = []) {
  const active = new Set(activeIds);

  // Hardware list
  const hwList = dom.alertsHardware;
  if (hwList) {
    hwList.innerHTML = '';
    ALERT_TYPES.hardware.forEach(alert => {
      const isActive = active.has(alert.id);
      const li = document.createElement('li');
      li.className = `alert-item ${isActive ? 'alert-active-hw' : 'alert-idle'}`;
      li.innerHTML = `
        <span class="alert-ico">${alert.icon}</span>
        <span class="alert-msg">${alert.msg}</span>
        ${isActive ? '<span class="alert-dot alert-dot-hw"></span>' : ''}
      `;
      hwList.appendChild(li);
    });
  }

  // Defect list
  const defList = dom.alertsDefect;
  if (defList) {
    defList.innerHTML = '';
    ALERT_TYPES.defect.forEach(alert => {
      const isActive = active.has(alert.id);
      const li = document.createElement('li');
      li.className = `alert-item ${isActive ? 'alert-active-def' : 'alert-idle'}`;
      li.innerHTML = `
        <span class="alert-ico">${alert.icon}</span>
        <span class="alert-msg">${alert.msg}</span>
        ${isActive ? '<span class="alert-dot alert-dot-def"></span>' : ''}
      `;
      defList.appendChild(li);
    });
  }
}

async function api(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  return res.json();
}

function formatClock() {
  const now = new Date();
  const day   = String(now.getDate()).padStart(2, '0');
  const month = now.toLocaleString('en-US', { month: 'short' });
  const year  = now.getFullYear();
  let hours   = now.getHours();
  const ampm  = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const mins  = String(now.getMinutes()).padStart(2, '0');
  return `${day}-${month}-${year} ${hours}:${mins} ${ampm}`;
}

function showToast(message, isError = false) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.toggle('error', isError);
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ── Clock ───────────────────────────────────────────────────
function tickClock() {
  const t = formatClock();
  dom.clockMain.textContent = t;
  dom.clockSub.textContent  = t;
}

// ── Batch Info Renderer ──────────────────────────────────────
function renderBatchInfo(batchName) {
  const config = BATCH_CONFIG[batchName];

  selectedCountry = null;
  selectedFabric  = null;
  selectedSize    = null;
  dom.btnStart.disabled = true;

  if (!config) {
    dom.batchInfoSection.style.display = 'none';
    const idleMsg = document.getElementById('setup-idle-msg');
    if (idleMsg) idleMsg.style.display = 'block';
    return;
  }

  // Hide selected bar until country is chosen
  const selBar = dom.batchInfoSection.querySelector('.selected-type-bar');
  if (selBar) selBar.style.display = 'none';
  dom.batchGarmentType.textContent = '—';

  // Build Step 0: country selection
  dom.sizeAccordion.innerHTML = '';
  buildCountryStep(batchName);

  dom.batchInfoSection.style.display = 'block';
  const idleMsg = document.getElementById('setup-idle-msg');
  if (idleMsg) idleMsg.style.display = 'none';
  dom.btnStart.disabled = true;
}

// ── Step 0: Country Selection ─────────────────────────────────
function buildCountryStep(batchName) {
  const label = document.createElement('div');
  label.className = 'step-label';
  label.id = 'step0-label';
  label.innerHTML = '<span class="step-tag step-tag-0">Step 1</span> Select Country';
  dom.sizeAccordion.appendChild(label);

  const grid = document.createElement('div');
  grid.className = 'country-grid';
  grid.id = 'country-grid';

  COUNTRIES.forEach(country => {
    const btn = document.createElement('button');
    btn.className = 'country-btn';
    btn.dataset.country = country;
    btn.textContent = country;
    btn.addEventListener('click', () => selectCountry(batchName, country));
    grid.appendChild(btn);
  });

  dom.sizeAccordion.appendChild(grid);
}

// Called when operator selects a country
function selectCountry(batchName, country) {
  selectedCountry = country;
  selectedFabric  = null;
  selectedSize    = null;
  dom.btnStart.disabled = true;

  // Collapse country grid to chip
  const grid  = document.getElementById('country-grid');
  const label = document.getElementById('step0-label');
  if (grid)  grid.outerHTML  = `<div class="country-chip" id="country-grid"><span>${country}</span><button class="fabric-change-btn" onclick="resetCountry('${batchName}')">✕ Change</button></div>`;
  if (label) label.remove();

  // Show Step 2: fabric grid
  const config = BATCH_CONFIG[batchName];
  buildFabricGrid(batchName, config);

  // Prepare Step 3 area
  const existing = document.getElementById('step2-area');
  if (!existing) {
    const step2Area = document.createElement('div');
    step2Area.id = 'step2-area';
    step2Area.style.display = 'none';
    step2Area.innerHTML = `
      <div class="step-label" style="margin-top:8px">
        <span class="step-tag step-tag-2">Step 3</span> Choose Size
      </div>
      <div class="size-row" id="fabric-size-btn-row"></div>
      <div class="spec-row" id="size-detail-box" style="display:none"></div>
    `;
    dom.sizeAccordion.appendChild(step2Area);
  }
}

// Reset back to country selection
function resetCountry(batchName) {
  selectedCountry = null;
  selectedFabric  = null;
  selectedSize    = null;
  dom.btnStart.disabled = true;

  const selBar = dom.batchInfoSection.querySelector('.selected-type-bar');
  if (selBar) selBar.style.display = 'none';
  dom.batchGarmentType.textContent = '—';

  dom.sizeAccordion.innerHTML = '';
  buildCountryStep(batchName);
}


// Build the 2-column fabric grid for Step 2
function buildFabricGrid(batchName, config) {
  const label = document.createElement('div');
  label.className = 'step-label';
  label.id = 'step1-label';
  label.innerHTML = '<span class="step-tag step-tag-1">Step 2</span> Choose Fabric Type';
  dom.sizeAccordion.insertBefore(label, dom.sizeAccordion.querySelector('#step2-area') || null);

  const fabricGrid = document.createElement('div');
  fabricGrid.className = 'fabric-grid';
  fabricGrid.id = 'fabric-btn-grid';

  Object.entries(config.fabricTypes).forEach(([fabricName, fabricData]) => {
    const btn = document.createElement('button');
    btn.className = 'fabric-btn';
    btn.dataset.fabric = fabricName;
    btn.innerHTML = `<span class="f-ico">${fabricData.icon}</span><span class="f-lbl">${fabricName}</span>`;
    btn.addEventListener('click', () => selectFabric(batchName, fabricName));
    fabricGrid.appendChild(btn);
  });

  const insertBefore = dom.sizeAccordion.querySelector('#step2-area');
  dom.sizeAccordion.insertBefore(fabricGrid, insertBefore || null);
}


// Expand fabric grid back (called by Change button)
function showFabricGrid(batchName) {
  const config = BATCH_CONFIG[batchName];
  if (!config) return;

  const existingGrid  = document.getElementById('fabric-btn-grid');
  const existingLabel = document.getElementById('step1-label');
  if (existingGrid)  existingGrid.remove();
  if (existingLabel) existingLabel.remove();

  selectedFabric = null;
  selectedSize   = null;
  dom.btnStart.disabled = true;

  const selBar = dom.batchInfoSection.querySelector('.selected-type-bar');
  if (selBar) selBar.style.display = 'none';

  const step2Area = document.getElementById('step2-area');
  if (step2Area) step2Area.style.display = 'none';

  buildFabricGrid(batchName, config);
}


// Called when operator selects a fabric type
function selectFabric(batchName, fabricName) {
  const config = BATCH_CONFIG[batchName];
  if (!config) return;
  const fabricData = config.fabricTypes[fabricName];
  if (!fabricData) return;
  if (!selectedCountry) return;

  selectedFabric = fabricName;
  selectedSize   = null;
  dom.btnStart.disabled = true;

  // Show selected-type bar
  const selBar = dom.batchInfoSection.querySelector('.selected-type-bar');
  if (selBar) selBar.style.display = 'flex';
  dom.batchGarmentType.textContent = `${fabricData.icon} ${fabricName}`;

  // Collapse fabric grid to compact chip
  const fabricGrid  = document.getElementById('fabric-btn-grid');
  const step1Label  = document.getElementById('step1-label');
  if (fabricGrid) {
    fabricGrid.outerHTML = `
      <div class="fabric-chip" id="fabric-btn-grid">
        <span class="f-ico">${fabricData.icon}</span>
        <span class="fabric-chip-name">${fabricName}</span>
        <button class="fabric-change-btn" onclick="showFabricGrid('${batchName}')">✕ Change</button>
      </div>
    `;
  }
  if (step1Label) step1Label.remove();

  // Show Step 3: sizes from country lookup
  const step2Area = document.getElementById('step2-area');
  if (!step2Area) return;
  step2Area.style.display = 'block';

  const sizeBtnRow = document.getElementById('fabric-size-btn-row');
  sizeBtnRow.innerHTML = '';

  // Get sizes from COUNTRY_SIZES using selected country + fabric
  const countrySizes = (COUNTRY_SIZES[selectedCountry] || {})[fabricName] || {};

  Object.keys(countrySizes).forEach((size) => {
    const btn = document.createElement('button');
    btn.className = 'size-btn';
    btn.textContent = size;
    btn.dataset.size = size;
    btn.addEventListener('click', () => selectSizeForFabric(countrySizes, size));
    sizeBtnRow.appendChild(btn);
  });

  const detailBox = document.getElementById('size-detail-box');
  if (detailBox) { detailBox.style.display = 'none'; detailBox.innerHTML = ''; }
}


// Called when operator clicks a size within the fabric flow
function selectSizeForFabric(sizes, size) {
  const spec = sizes[size];
  if (!spec) return;

  selectedSize = size;

  document.querySelectorAll('#fabric-size-btn-row .size-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.size === size);
  });

  const detailBox = document.getElementById('size-detail-box');
  if (detailBox) {
    detailBox.style.display = 'flex';
    detailBox.innerHTML = `
      <div class="spec-cell">
        <div class="spec-lbl">Length</div>
        <div class="spec-val">${spec.length}<span class="spec-unit">cm</span></div>
      </div>
      <div class="spec-cell">
        <div class="spec-lbl">Width</div>
        <div class="spec-val">${spec.width}<span class="spec-unit">cm</span></div>
      </div>
      <div class="spec-cell">
        <div class="spec-lbl">Breadth</div>
        <div class="spec-val">${spec.breadth}<span class="spec-unit">cm</span></div>
      </div>
      <div class="spec-cell adj">
        <div class="spec-lbl">Adjustable</div>
        <div class="spec-val adj-val">${spec.adjustable}</div>
      </div>
    `;
  }

  dom.btnStart.disabled = false;
}


// ── Single-fabric selectSize (kept for backward compat, not used in current UI) ──
function selectSize(batchName, size) {
  // All batches now use the country → fabric → size flow via selectSizeForFabric()
  console.warn('selectSize() called — this path is deprecated.');
}


// ── Data Fetchers ───────────────────────────────────────────

async function fetchSystemState() {
  try {
    const state = await api('/api/system/state');
    isRunning = state.running;
    // Always show Admin as operator
    dom.operatorName.textContent = 'Admin';
    dom.headerBatch.value        = state.currentBatch;
    dom.tableBatch.value         = state.currentBatch;
    renderBatchInfo(state.currentBatch);
    updateStartButton();
  } catch (e) {
    dom.operatorName.textContent = 'Admin';
    // Render first batch if available
    const firstBatch = dom.headerBatch.options[0]?.value;
    if (firstBatch) renderBatchInfo(firstBatch);
  }
}

async function fetchBatches() {
  try {
    const batches = await api('/api/batch');
    [dom.headerBatch, dom.tableBatch].forEach((sel) => {
      sel.innerHTML = '';
      batches.forEach((b) => {
        const opt = document.createElement('option');
        opt.value = b.name;
        opt.textContent = b.name;
        sel.appendChild(opt);
      });
    });
  } catch (e) {
    // Fallback: populate from BATCH_CONFIG keys
    const keys = Object.keys(BATCH_CONFIG);
    [dom.headerBatch, dom.tableBatch].forEach((sel) => {
      sel.innerHTML = '';
      keys.forEach((k) => {
        const opt = document.createElement('option');
        opt.value = k;
        opt.textContent = k;
        sel.appendChild(opt);
      });
    });
    // Render first batch info immediately
    renderBatchInfo(keys[0]);
  }
}

async function fetchStatus() {
  try {
    const s = await api('/api/inspection/status');
    dom.sBarcode.textContent    = s.barcode;
    dom.sScan.textContent       = s.scan;
    dom.sInspection.textContent = s.inspection;
    dom.sSorting.textContent    = s.sorting;
    dom.sBatch.textContent      = s.batchType;
  } catch (e) { /* backend unavailable */ }
}

async function fetchSummary() {
  try {
    const batchName = dom.headerBatch.value;
    const s = await api(`/api/batch/${encodeURIComponent(batchName)}/summary`);
    dom.sumTotal.textContent      = s.totalCloth;
    dom.sumAccepted.textContent   = s.acceptedCloth;
    dom.sumEfficiency.textContent = s.efficiency;
    dom.sumInspected.textContent  = s.inspected;
    dom.sumTotal2.textContent     = s.totalCloth;
    dom.sumPercent.textContent    = s.progressPercent + '%';
    dom.sumProgressBar.style.width = s.progressPercent + '%';
  } catch (e) { /* backend unavailable */ }
}

async function fetchResults() {
  try {
    const r = await api('/api/inspection/results');
    // Pass
    dom.resPassCount.textContent  = r.pass.count;
    dom.resPassTotal.textContent  = r.pass.total;
    dom.resPassBar.style.width    = r.pass.efficiency + '%';
    dom.resPassDest.textContent   = r.pass.destination;
    dom.resPassEff.textContent    = r.pass.efficiency + '%';
    // Reject
    dom.resRejCount.textContent   = r.reject.count;
    dom.resRejTotal.textContent   = r.reject.total;
    dom.resRejBar.style.width     = r.reject.efficiency + '%';
    dom.resRejDest.textContent    = r.reject.destination;
    dom.resRejEff.textContent     = r.reject.efficiency + '%';
  } catch (e) { /* backend unavailable */ }
}

async function fetchRecords() {
  try {
    const batchName = dom.tableBatch.value;
    const records = await api(`/api/inspection/records?batch=${encodeURIComponent(batchName)}`);
    dom.recordsTbody.innerHTML = '';
    records.forEach((r, i) => {
      const tr = document.createElement('tr');
      if (i === 0 && isRunning) tr.classList.add('new-row');
      const badgeClass = r.result === 'PASS' ? 'badge-green' : 'badge-red';
      tr.innerHTML = `
        <td>${r.barcode}</td>
        <td><div class="badge ${badgeClass}">${r.result}</div></td>
        <td>${r.bin}</td>
        <td>${r.time}</td>
      `;
      dom.recordsTbody.appendChild(tr);
    });
  } catch (e) { /* backend unavailable */ }
}

async function fetchAlerts() {
  try {
    const alerts = await api('/api/alerts');
    // Backend should return alerts with an `id` field matching ALERT_TYPES ids
    const activeIds = alerts.map(a => a.id).filter(Boolean);
    renderAlerts(activeIds);
  } catch (e) {
    // Backend unavailable — show all alerts as idle
    renderAlerts([]);
  }
}

// ── Refresh All Panels ──────────────────────────────────────
async function refreshAll() {
  await Promise.all([
    fetchStatus(),
    fetchSummary(),
    fetchResults(),
    fetchRecords(),
    fetchAlerts(),
  ]);
}

// ── Actions ─────────────────────────────────────────────────

function updateStartButton() {
  if (isRunning) {
    dom.btnStart.innerHTML = '<span>⏹</span> Stop Inspection';
    dom.btnStart.classList.add('running');
    dom.btnStart.disabled = false;
  } else {
    dom.btnStart.innerHTML = '<span>▶</span> Start Inspection';
    dom.btnStart.classList.remove('running');
    // All batches now require country + fabric + size before starting
    dom.btnStart.disabled = !(selectedCountry && selectedFabric && selectedSize);
  }
}


async function toggleInspection() {
  if (isRunning) {
    try { await api('/api/inspection/stop', { method: 'POST' }); } catch(e) {}
    isRunning = false;
    clearInterval(scanInterval);
    scanInterval = null;
    showToast('Inspection stopped');
  } else {
    const payload = {
      batch:   dom.headerBatch.value,
      country: selectedCountry,
      fabric:  selectedFabric,
      size:    selectedSize,
    };
    try {
      await api('/api/inspection/start', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch(e) {}
    isRunning = true;
    showToast(`Started: ${selectedFabric} · ${selectedSize} · ${selectedCountry}`);
    scanInterval = setInterval(autoScan, 3000);
  }
  updateStartButton();
}


async function autoScan() {
  try {
    const result = await api('/api/inspection/scan', { method: 'POST' });
    if (result.error) {
      showToast(result.error, true);
      clearInterval(scanInterval);
      scanInterval = null;
      isRunning = false;
      updateStartButton();
      return;
    }
    await refreshAll();
  } catch (err) {
    console.error('Scan error:', err);
  }
}

async function resetSystem() {
  if (!confirm('Reset the entire system? All data will be cleared.')) return;

  // Stop any running inspection
  clearInterval(scanInterval);
  scanInterval = null;
  isRunning = false;

  // ── Clear all batch setup selections ──────────────────────
  selectedCountry = null;
  selectedFabric  = null;
  selectedSize    = null;

  // Re-render batch setup back to Step 1 (country selection)
  const currentBatch = dom.tableBatch.value;
  if (currentBatch) renderBatchInfo(currentBatch);

  updateStartButton();

  // API reset
  try { await api('/api/system/reset', { method: 'POST' }); } catch(e) {}
  showToast('System reset — all selections cleared');
  await refreshAll();
  await fetchStatus();
}

function exportReport() {
  try {
    const now   = new Date();
    const dateStr = now.toLocaleDateString('en-GB').replace(/\//g, '-');
    const timeStr = now.toLocaleTimeString('en-GB', { hour12: false }).replace(/:/g, '-');

    // ── Metadata ────────────────────────────────────────────
    const batch   = dom.tableBatch.value  || '—';
    const country = selectedCountry       || '—';
    const fabric  = selectedFabric        || '—';
    const size    = selectedSize          || '—';

    // ── Summary stats from DOM ───────────────────────────────
    const total      = dom.sumTotal.textContent      || '0';
    const accepted   = dom.sumAccepted.textContent   || '0';
    const efficiency = dom.sumEfficiency.textContent || '0%';
    const passCount  = dom.resPassCount.textContent  || '0';
    const rejCount   = dom.resRejCount.textContent   || '0';

    // ── Inspection log rows from table ───────────────────────
    const rows = Array.from(dom.recordsTbody.querySelectorAll('tr'));
    const logLines = rows.map(tr => {
      const cells = tr.querySelectorAll('td');
      const barcode = cells[0]?.textContent.trim() || '';
      const result  = cells[1]?.textContent.trim() || '';
      const bin     = cells[2]?.textContent.trim() || '';
      const time    = cells[3]?.textContent.trim() || '';
      return `"${barcode}","${result}","${bin}","${time}"`;
    });

    // ── Build CSV ────────────────────────────────────────────
    const lines = [
      '# Garment Inspection Report',
      `# Generated:,${dateStr} ${timeStr.replace(/-/g, ':')}`,
      '',
      '# BATCH CONFIGURATION',
      `Batch ID,${batch}`,
      `Country,${country}`,
      `Fabric Type,${fabric}`,
      `Size,${size}`,
      '',
      '# PRODUCTION SUMMARY',
      `Total Cloth,${total}`,
      `Accepted,${accepted}`,
      `Rejected,${rejCount}`,
      `Efficiency,${efficiency}`,
      '',
      '# INSPECTION LOG',
      'Barcode,Result,Bin,Time',
      ...logLines,
    ];

    const csvContent = lines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `inspection_${batch}_${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`Exported: inspection_${batch}_${dateStr}.csv`);
  } catch (err) {
    showToast('Export failed', true);
    console.error('Export error:', err);
  }
}

async function switchBatch(batchName) {
  try {
    await api('/api/batch/current', {
      method: 'PUT',
      body: JSON.stringify({ batch: batchName }),
    });
  } catch(e) {}
  // Sync both selects
  dom.headerBatch.value = batchName;
  dom.tableBatch.value  = batchName;
  // Update batch info panel
  renderBatchInfo(batchName);
  await refreshAll();
}

// ── Event Listeners ─────────────────────────────────────────
dom.btnStart.addEventListener('click', toggleInspection);
dom.btnReset.addEventListener('click', resetSystem);
dom.btnExport.addEventListener('click', exportReport);

dom.headerBatch.addEventListener('change', (e) => switchBatch(e.target.value));
dom.tableBatch.addEventListener('change',  (e) => switchBatch(e.target.value));

// ── Bootstrap ───────────────────────────────────────────────
(async function init() {
  tickClock();
  setInterval(tickClock, 10000);

  renderAlerts([]);          // show all alert rows as idle immediately
  await fetchBatches();
  await fetchSystemState();
  await refreshAll();
})();
