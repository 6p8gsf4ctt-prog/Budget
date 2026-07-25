const STORAGE_KEY = 'mon-budget-pwa-v1';
const COLORS = ['#0071e3', '#34c759', '#ff9f0a', '#af52de', '#ff375f', '#5e5ce6'];
const formatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const monthFormatter = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });

const icons = {
  home: '<svg viewBox="0 0 24 24"><path d="m3 11 9-8 9 8"/><path d="M5.5 9.5V21h13V9.5M9.5 21v-7h5v7"/></svg>',
  cart: '<svg viewBox="0 0 24 24"><path d="M3 4h2l2.1 10.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L20 8H6"/><circle cx="9" cy="20" r="1"/><circle cx="17" cy="20" r="1"/></svg>',
  chart: '<svg viewBox="0 0 24 24"><path d="M4 20V10m6 10V4m6 16v-7m4 7H2"/></svg>',
  person: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
  people: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2.5 21a6.5 6.5 0 0 1 13 0M14 15a5.5 5.5 0 0 1 7.5 5"/></svg>',
  safe: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="12" cy="12" r="3"/><path d="M12 9V7m3 5h2m-5 3v2m-3-5H7"/></svg>'
};

function uid() { return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`; }
function currentMonth() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; }
function parseMoney(value) { return Number(String(value).replace(/\s/g,'').replace(',', '.').replace(/[^0-9.-]/g,'')) || 0; }
function moneyInput(value) { return Number(value).toFixed(2).replace('.', ','); }
function monthDate(key) { const [y,m] = key.split('-').map(Number); return new Date(y, m-1, 1); }

const sampleMonth = {
  income: 2709,
  envelopes: [
    { id: uid(), name: 'Livret A', subtitle: 'Charges fixes', planned: 320, icon: 'home', color: COLORS[0], open: true, entries: [
      {id:uid(),label:'Assurance Auto',amount:86.50},{id:uid(),label:'Électricité',amount:55},{id:uid(),label:'Taxe foncière',amount:110},{id:uid(),label:'Mutuelle',amount:75}
    ]},
    { id: uid(), name: 'Boursobank', subtitle: 'Alimentaire & loisirs', planned: 200, icon: 'cart', color: COLORS[1], open: false, entries: [
      {id:uid(),label:'Nourriture',amount:150},{id:uid(),label:'Sport',amount:25.50},{id:uid(),label:'Activités',amount:40}
    ]},
    { id: uid(), name: 'Revolut', subtitle: 'Épargne, crypto & bourse', planned: 500, icon: 'chart', color: COLORS[2], open: false, entries: [
      {id:uid(),label:'Épargne',amount:200},{id:uid(),label:'Crypto',amount:50},{id:uid(),label:'Bourse',amount:250}
    ]},
    { id: uid(), name: 'Alizée Cristel', subtitle: 'Virement', planned: 150, icon: 'person', color: COLORS[3], open: false, entries: [{id:uid(),label:'Virement mensuel',amount:150}]},
    { id: uid(), name: 'Compte commun', subtitle: 'Dépenses du foyer', planned: 1200, icon: 'people', color: COLORS[4], open: false, entries: [{id:uid(),label:'Versement mensuel',amount:1200}]},
    { id: uid(), name: 'LEP', subtitle: 'Épargne', planned: 150, icon: 'safe', color: COLORS[5], open: false, entries: [{id:uid(),label:'Versement mensuel',amount:150}]}
  ]
};

let state = loadState();
let deferredInstallPrompt = null;

const el = id => document.getElementById(id);
const envelopeList = el('envelopeList');

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.months && saved?.selectedMonth) return saved;
  } catch (_) {}
  const key = currentMonth();
  return { selectedMonth: key, months: { [key]: structuredClone(sampleMonth) } };
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function ensureMonth(key) {
  if (!state.months[key]) {
    const previous = state.months[state.selectedMonth];
    state.months[key] = previous ? { income: previous.income, envelopes: previous.envelopes.map(e => ({...e,id:uid(),open:false,entries:e.entries.map(x=>({...x,id:uid()}))})) } : structuredClone(sampleMonth);
  }
}
function getMonth() { ensureMonth(state.selectedMonth); return state.months[state.selectedMonth]; }
function sumEntries(envelope) { return envelope.entries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0); }

function render() {
  const month = getMonth();
  el('monthLabel').textContent = monthFormatter.format(monthDate(state.selectedMonth));
  el('monthPicker').value = state.selectedMonth;
  el('incomeInput').value = moneyInput(month.income);
  envelopeList.innerHTML = '';
  month.envelopes.forEach((envelope) => envelopeList.appendChild(renderEnvelope(envelope)));
  renderTotals();
  saveState();
}

function renderEnvelope(envelope) {
  const actual = sumEntries(envelope);
  const planned = Number(envelope.planned || 0);
  const difference = actual - planned;
  const ratio = planned > 0 ? actual / planned : (actual > 0 ? 1 : 0);
  const percent = Math.max(0, Math.round(ratio * 100));
  const progress = Math.min(100, percent);
  const statusClass = Math.abs(difference) < .005 ? 'status-ok' : difference > 0 ? 'status-over' : 'status-under';
  const differenceText = Math.abs(difference) < .005
    ? 'Équilibré'
    : difference > 0
      ? `+${formatter.format(difference)}`
      : formatter.format(Math.abs(difference));
  const progressClass = percent > 100 ? 'over' : percent >= 85 ? 'warn' : '';

  const article = document.createElement('article');
  article.className = `envelope${envelope.open ? ' open' : ''}`;
  article.style.setProperty('--accent', envelope.color);
  article.innerHTML = `
    <button class="envelope-main" type="button" aria-expanded="${envelope.open}">
      <span class="envelope-icon">${icons[envelope.icon] || icons.safe}</span>
      <span class="envelope-copy">
        <span class="envelope-name">${escapeHtml(envelope.name)}</span>
        <span class="envelope-subtitle">${escapeHtml(envelope.subtitle || 'Sans description')}</span>
      </span>
      <span class="envelope-amount-main">
        <strong>${formatter.format(actual)}</strong>
        <small>Dépensé</small>
      </span>
      <span class="envelope-meta">
        <span class="metric"><span>Budget</span><strong>${formatter.format(planned)}</strong></span>
        <span class="metric"><span>Dépensé</span><strong>${formatter.format(actual)}</strong></span>
        <span class="metric ${statusClass}"><span>Écart</span><strong>${differenceText}</strong></span>
      </span>
      <span class="progress-wrap">
        <span class="progress-track"><span class="progress-fill ${progressClass}" style="width:${progress}%"></span></span>
        <span class="progress-percent">${percent}%</span>
      </span>
    </button>
    <div class="envelope-details"><div class="envelope-details-inner"><div class="details-content">
      <div class="entries"></div>
      <div class="envelope-total"><span>Total détaillé</span><span>${formatter.format(actual)}</span></div>
      <div class="envelope-actions"><button class="edit-envelope" type="button">Modifier</button><button class="primary-action add-entry" type="button">＋ Ajouter une ligne</button></div>
    </div></div></div>`;

  article.querySelector('.envelope-main').addEventListener('click', () => {
    const wasOpen = envelope.open;
    getMonth().envelopes.forEach(item => item.open = false);
    envelope.open = !wasOpen;
    render();
  });
  article.querySelector('.edit-envelope').addEventListener('click', () => openEnvelopeDialog(envelope));
  article.querySelector('.add-entry').addEventListener('click', () => openEntryDialog(envelope.id));
  const entries = article.querySelector('.entries');
  if (!envelope.entries.length) entries.innerHTML = '<div class="empty-state">Aucune ligne pour le moment</div>';
  envelope.entries.forEach((entry, index) => {
    const row = document.createElement('div');
    row.className = 'entry-row';
    row.style.animationDelay = `${index * 25}ms`;
    row.innerHTML = `<button type="button"><span class="entry-label">${escapeHtml(entry.label)}</span></button><span class="entry-amount">${formatter.format(entry.amount)}</span>`;
    row.querySelector('button').addEventListener('click', () => openEntryDialog(envelope.id, entry));
    entries.appendChild(row);
  });
  return article;
}

function renderTotals() {
  const month = getMonth();
  const planned = month.envelopes.reduce((s,e)=>s+Number(e.planned||0),0);
  const actual = month.envelopes.reduce((s,e)=>s+sumEntries(e),0);
  const remaining = month.income - actual;
  const used = month.income > 0 ? Math.min(100, Math.max(0, actual / month.income * 100)) : 0;
  el('remainingAmount').textContent = formatter.format(remaining);
  el('remainingCaption').textContent = remaining >= 0 ? 'après toutes les enveloppes' : 'budget dépassé';
  el('usedPercent').textContent = `${Math.round(used)}%`;
  el('ringProgress').style.strokeDashoffset = `${113.1 * (1 - used / 100)}`;
  el('summaryIncome').textContent = formatter.format(month.income);
  el('summaryPlanned').textContent = formatter.format(planned);
  el('summaryActual').textContent = formatter.format(actual);
  el('summaryRemaining').textContent = formatter.format(remaining);
}

function shiftMonth(offset) {
  const date = monthDate(state.selectedMonth); date.setMonth(date.getMonth()+offset);
  const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
  ensureMonth(key); state.selectedMonth = key; render();
}

function openEnvelopeDialog(envelope = null) {
  el('envelopeDialogTitle').textContent = envelope ? 'Modifier l’enveloppe' : 'Nouvelle enveloppe';
  el('editingEnvelopeId').value = envelope?.id || '';
  el('envelopeName').value = envelope?.name || '';
  el('envelopeSubtitle').value = envelope?.subtitle || '';
  el('envelopePlanned').value = envelope ? moneyInput(envelope.planned) : '';
  el('envelopeIcon').value = envelope?.icon || 'home';
  el('deleteEnvelope').classList.toggle('hidden', !envelope);
  el('envelopeDialog').showModal();
  setTimeout(()=>el('envelopeName').focus(),100);
}

function openEntryDialog(envelopeId, entry = null) {
  el('entryDialogTitle').textContent = entry ? 'Modifier la ligne' : 'Nouvelle ligne';
  el('editingEntryEnvelopeId').value = envelopeId;
  el('editingEntryId').value = entry?.id || '';
  el('entryLabel').value = entry?.label || '';
  el('entryAmount').value = entry ? moneyInput(entry.amount) : '';
  el('deleteEntry').classList.toggle('hidden', !entry);
  el('entryDialog').showModal();
  setTimeout(()=>el('entryLabel').focus(),100);
}

el('incomeInput').addEventListener('change', (event) => { getMonth().income = parseMoney(event.target.value); render(); toast('Revenus enregistrés'); });
el('previousMonth').addEventListener('click', ()=>shiftMonth(-1));
el('nextMonth').addEventListener('click', ()=>shiftMonth(1));
el('monthButton').addEventListener('click', ()=> { try { el('monthPicker').showPicker(); } catch { el('monthPicker').click(); } });
el('monthPicker').addEventListener('change', e => { if(e.target.value){ ensureMonth(e.target.value); state.selectedMonth=e.target.value; render(); }});
el('addEnvelope').addEventListener('click', ()=>openEnvelopeDialog());

el('envelopeForm').addEventListener('submit', (event) => {
  if (event.submitter?.value === 'cancel') return;
  event.preventDefault();
  const month = getMonth();
  const id = el('editingEnvelopeId').value;
  const data = { name: el('envelopeName').value.trim(), subtitle: el('envelopeSubtitle').value.trim(), planned: parseMoney(el('envelopePlanned').value), icon: el('envelopeIcon').value };
  if (!data.name) return;
  if (id) Object.assign(month.envelopes.find(e=>e.id===id), data);
  else month.envelopes.push({ id:uid(), ...data, color:COLORS[month.envelopes.length % COLORS.length], open:true, entries:[] });
  el('envelopeDialog').close(); render(); toast(id ? 'Enveloppe modifiée' : 'Enveloppe ajoutée');
});
el('deleteEnvelope').addEventListener('click', () => {
  const id = el('editingEnvelopeId').value;
  if (confirm('Supprimer cette enveloppe et toutes ses lignes ?')) { getMonth().envelopes = getMonth().envelopes.filter(e=>e.id!==id); el('envelopeDialog').close(); render(); toast('Enveloppe supprimée'); }
});

el('entryForm').addEventListener('submit', (event) => {
  if (event.submitter?.value === 'cancel') return;
  event.preventDefault();
  const envelope = getMonth().envelopes.find(e=>e.id===el('editingEntryEnvelopeId').value);
  const id = el('editingEntryId').value;
  const data = { label:el('entryLabel').value.trim(), amount:parseMoney(el('entryAmount').value) };
  if (!data.label || !envelope) return;
  if (id) Object.assign(envelope.entries.find(e=>e.id===id), data); else envelope.entries.push({id:uid(),...data});
  el('entryDialog').close(); render(); toast(id ? 'Ligne modifiée' : 'Ligne ajoutée');
});
el('deleteEntry').addEventListener('click', () => {
  const envelope = getMonth().envelopes.find(e=>e.id===el('editingEntryEnvelopeId').value);
  const id = el('editingEntryId').value;
  if (envelope && confirm('Supprimer cette ligne ?')) { envelope.entries = envelope.entries.filter(e=>e.id!==id); el('entryDialog').close(); render(); toast('Ligne supprimée'); }
});

el('resetButton').addEventListener('click', () => {
  if (confirm('Réinitialiser le mois actuel avec les données de démonstration ?')) { state.months[state.selectedMonth] = structuredClone(sampleMonth); render(); toast('Mois réinitialisé'); }
});

function toast(message) { const node=el('toast'); node.textContent=message; node.classList.add('show'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>node.classList.remove('show'),1800); }
function escapeHtml(text='') { return String(text).replace(/[&<>'"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c])); }

window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); deferredInstallPrompt = event; el('installButton').classList.remove('hidden'); });
el('installButton').addEventListener('click', async () => { if(!deferredInstallPrompt) return; deferredInstallPrompt.prompt(); await deferredInstallPrompt.userChoice; deferredInstallPrompt=null; el('installButton').classList.add('hidden'); });
window.addEventListener('appinstalled', ()=>toast('Application installée'));
if ('serviceWorker' in navigator) window.addEventListener('load', ()=>navigator.serviceWorker.register('./service-worker.js'));
render();
