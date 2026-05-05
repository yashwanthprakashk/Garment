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

  // Alerts
  alertsList:       $('alerts-list'),

  // Buttons
  btnStart:         $('btn-start'),
  btnReset:         $('btn-reset'),
  btnExport:        $('btn-export'),
};

let isRunning = false;
let scanInterval = null;

// ── Utility ─────────────────────────────────────────────────
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

// ── Data Fetchers ───────────────────────────────────────────

async function fetchSystemState() {
  const state = await api('/api/system/state');
  isRunning = state.running;
  dom.operatorName.textContent = state.operator;
  dom.headerBatch.value        = state.currentBatch;
  dom.tableBatch.value         = state.currentBatch;
  updateStartButton();
}

async function fetchBatches() {
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
}

async function fetchStatus() {
  const s = await api('/api/inspection/status');
  dom.sBarcode.textContent    = s.barcode;
  dom.sScan.textContent       = s.scan;
  dom.sInspection.textContent = s.inspection;
  dom.sSorting.textContent    = s.sorting;
  dom.sBatch.textContent      = s.batchType;
}

async function fetchSummary() {
  const batchName = dom.headerBatch.value;
  const s = await api(`/api/batch/${encodeURIComponent(batchName)}/summary`);

  dom.sumTotal.textContent      = s.totalCloth;
  dom.sumAccepted.textContent   = s.acceptedCloth;
  dom.sumEfficiency.textContent = s.efficiency;
  dom.sumInspected.textContent  = s.inspected;
  dom.sumTotal2.textContent     = s.totalCloth;
  dom.sumPercent.textContent    = s.progressPercent + '%';
  dom.sumProgressBar.style.width = s.progressPercent + '%';
}

async function fetchResults() {
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
}

async function fetchRecords() {
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
}

async function fetchAlerts() {
  const alerts = await api('/api/alerts');
  dom.alertsList.innerHTML = '';
  alerts.forEach((a) => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="warning-icon">⚠️</span> ${a.message}`;
    dom.alertsList.appendChild(li);
  });
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
    dom.btnStart.textContent = 'Stop Inspection';
    dom.btnStart.classList.add('running');
  } else {
    dom.btnStart.textContent = 'Start Inspection';
    dom.btnStart.classList.remove('running');
  }
}

async function toggleInspection() {
  if (isRunning) {
    await api('/api/inspection/stop', { method: 'POST' });
    isRunning = false;
    clearInterval(scanInterval);
    scanInterval = null;
    showToast('Inspection stopped');
  } else {
    await api('/api/inspection/start', { method: 'POST' });
    isRunning = true;
    showToast('Inspection started');
    // Auto-scan every 3 seconds
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
  clearInterval(scanInterval);
  scanInterval = null;
  isRunning = false;
  updateStartButton();
  await api('/api/system/reset', { method: 'POST' });
  showToast('System reset complete');
  await refreshAll();
  await fetchStatus();
}

async function exportReport() {
  try {
    const res = await fetch(`${API}/api/system/report`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inspection_report.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Report exported');
  } catch (err) {
    showToast('Export failed', true);
  }
}

async function switchBatch(batchName) {
  await api('/api/batch/current', {
    method: 'PUT',
    body: JSON.stringify({ batch: batchName }),
  });
  // Sync both selects
  dom.headerBatch.value = batchName;
  dom.tableBatch.value  = batchName;
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

  await fetchBatches();
  await fetchSystemState();
  await refreshAll();
})();
