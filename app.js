'use strict';

const VERSION = '1.0.3';
const STORAGE_KEY = 'mon-budget-data-v1';
const monthFormatter = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });
const moneyFormatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

const ICONS = ['🏠','🛒','📈','👤','👥','🏦','🚗','💡','📱','🎯','💳','🧾'];
const COLORS = ['#3b82f6','#35c759','#ff9f0a','#af52de','#ff375f','#5e5ce6','#64d2ff','#ffd60a'];

const defaultMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const seed = {
  selectedMonth: defaultMonth(),
  months: {
    [defaultMonth()]: {
      income: 2709,
      envelopes: [
        { id: crypto.randomUUID(), name: 'Livret A', description: 'Charges fixes', icon: '🏠', color: '#3b82f6', planned: 320, expenses: [
          { id: crypto.randomUUID(), label: 'Abonnement YouTube', amount: 6.5 },
          { id: crypto.randomUUID(), label: 'Péage et stationnement', amount: 8 },
          { id: crypto.randomUUID(), label: 'Assurance automobile', amount: 63 },
          { id: crypto.randomUUID(), label: 'Traiteur', amount: 115 },
          { id: crypto.randomUUID(), label: 'Carburant', amount: 103 },
          { id: crypto.randomUUID(), label: 'Abonnement ChatGPT', amount: 23 },
          { id: crypto.randomUUID(), label: 'Abonnement SFR', amount: 8 }
        ]},
        { id: crypto.randomUUID(), name: 'Boursobank', description: 'Alimentaire & loisirs', icon: '🛒', color: '#35c759', planned: 200, expenses: [
          { id: crypto.randomUUID(), label: 'Alimentation + restaurant', amount: 111.5 },
          { id: crypto.randomUUID(), label: 'Shopping & loisir', amount: 104 }
        ]},
        { id: crypto.randomUUID(), name: 'Revolut', description: 'Épargne, crypto & bourse', icon: '📈', color: '#ff9f0a', planned: 500, expenses: [
          { id: crypto.randomUUID(), label: 'Épargne Rose', amount: 30 },
          { id: crypto.randomUUID(), label: 'Crypto + Bourse', amount: 470 }
        ]},
        { id: crypto.randomUUID(), name: 'Alizée Cristel', description: 'Virement', icon: '👤', color: '#af52de', planned: 150, expenses: [{ id: crypto.randomUUID(), label: 'Pension Rose', amount: 150 }]},
        { id: crypto.randomUUID(), name: 'Compte commun', description: 'Dépenses du foyer', icon: '👥', color: '#ff375f', planned: 1200, expenses: [{ id: crypto.randomUUID(), label: 'Compte commun', amount: 1200 }]},
        { id: crypto.randomUUID(), name: 'LEP', description: 'Épargne', icon: '🏦', color: '#5e5ce6', planned: 150, expenses: [{ id: crypto.randomUUID(), label: 'Réserve compte commun', amount: 150 }]}
      ]
    }
  }
};

let state = loadState();
let openEnvelopeId = null;
let editorContext = null;

const els = {
  monthLabel: document.querySelector('#monthLabel'),
  envelopeList: document.querySelector('#envelopeList'),
  incomeAmount: document.querySelector('#incomeAmount'),
  plannedAmount: document.querySelector('#plannedAmount'),
  spentAmount: document.querySelector('#spentAmount'),
  availableAmount: document.querySelector('#availableAmount'),
  summaryIncome: document.querySelector('#summaryIncome'),
  summaryPlanned: document.querySelector('#summaryPlanned'),
  summarySpent: document.querySelector('#summarySpent'),
  summaryAvailable: document.querySelector('#summaryAvailable'),
  summaryStatus: document.querySelector('#summaryStatus'),
  template: document.querySelector('#envelopeTemplate'),
  editorDialog: document.querySelector('#editorDialog'),
  editorForm: document.querySelector('#editorForm'),
  editorFields: document.querySelector('#editorFields'),
  dialogTitle: document.querySelector('#dialogTitle'),
  dialogEyebrow: document.querySelector('#dialogEyebrow'),
  monthDialog: document.querySelector('#monthDialog'),
  monthOptions: document.querySelector('#monthOptions')
};

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (parsed?.months && parsed?.selectedMonth) return parsed;
  } catch (error) { console.warn('Données locales illisibles', error); }
  return structuredClone(seed);
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function currentBudget() {
  if (!state.months[state.selectedMonth]) state.months[state.selectedMonth] = { income: 0, envelopes: [] };
  return state.months[state.selectedMonth];
}

function monthDate(key) {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month - 1, 1);
}

function money(value) { return moneyFormatter.format(Number(value || 0)); }
function spent(envelope) { return envelope.expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0); }
function totals() {
  const budget = currentBudget();
  const planned = budget.envelopes.reduce((sum, e) => sum + Number(e.planned || 0), 0);
  const actual = budget.envelopes.reduce((sum, e) => sum + spent(e), 0);
  return { income: Number(budget.income || 0), planned, actual, available: Number(budget.income || 0) - actual };
}

function render() {
  const budget = currentBudget();
  const total = totals();
  els.monthLabel.textContent = capitalize(monthFormatter.format(monthDate(state.selectedMonth)));
  els.incomeAmount.textContent = money(total.income);
  els.plannedAmount.textContent = money(total.planned);
  els.spentAmount.textContent = money(total.actual);
  els.availableAmount.textContent = money(total.available);
  els.availableAmount.style.color = total.available < 0 ? 'var(--negative)' : 'var(--text)';
  els.summaryIncome.textContent = money(total.income);
  els.summaryPlanned.textContent = money(total.planned);
  els.summarySpent.textContent = money(total.actual);
  els.summaryAvailable.textContent = money(total.available);
  els.summaryAvailable.style.color = total.available < 0 ? 'var(--negative)' : 'var(--positive)';
  els.summaryStatus.textContent = total.available < 0 ? 'À corriger' : 'Sous contrôle';
  els.summaryStatus.classList.toggle('alert', total.available < 0);

  els.envelopeList.replaceChildren();
  if (!budget.envelopes.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'Aucune enveloppe pour ce mois.';
    els.envelopeList.append(empty);
    return;
  }
  budget.envelopes.forEach(envelope => els.envelopeList.append(renderEnvelope(envelope)));
}

function renderEnvelope(envelope) {
  const node = els.template.content.firstElementChild.cloneNode(true);
  const actual = spent(envelope);
  const diff = actual - Number(envelope.planned || 0);
  const ratio = envelope.planned > 0 ? actual / envelope.planned : (actual > 0 ? 1 : 0);
  const percent = Math.round(ratio * 100);
  const isOpen = openEnvelopeId === envelope.id;
  node.dataset.id = envelope.id;
  node.style.setProperty('--card-accent', envelope.color || '#3b82f6');
  node.classList.toggle('open', isOpen);
  node.querySelector('.envelope-summary').setAttribute('aria-expanded', String(isOpen));
  node.querySelector('.envelope-icon').textContent = envelope.icon || '💳';
  node.querySelector('.envelope-name').textContent = envelope.name;
  node.querySelector('.envelope-description').textContent = envelope.description || 'Sans description';
  node.querySelector('.envelope-amount').textContent = money(actual);
  node.querySelector('.planned-value').textContent = money(envelope.planned);
  node.querySelector('.spent-value').textContent = money(actual);
  const diffEl = node.querySelector('.difference-value');
  diffEl.textContent = `${diff > 0 ? '+' : ''}${money(diff)}`;
  diffEl.classList.add(diff > 0 ? 'negative' : 'positive');
  const fill = node.querySelector('.progress-fill');
  fill.style.width = `${Math.min(Math.max(ratio * 100, 0), 100)}%`;
  fill.style.background = ratio > 1 ? 'var(--negative)' : ratio >= .85 ? 'var(--warning)' : 'var(--positive)';
  const badge = node.querySelector('.progress-badge');
  badge.textContent = `${percent}%`;
  badge.style.color = ratio > 1 ? 'var(--negative)' : ratio >= .85 ? 'var(--warning)' : 'var(--positive)';
  const message = node.querySelector('.envelope-message');
  if (diff > 0) {
    message.textContent = `${money(diff)} au-dessus du budget`;
    message.classList.add('negative');
  } else if (diff < 0) {
    message.textContent = `${money(Math.abs(diff))} encore disponible`;
    message.classList.add('positive');
  } else {
    message.textContent = 'Budget parfaitement équilibré';
    message.classList.add('positive');
  }
  node.querySelector('.expense-count').textContent = `DÉPENSES (${envelope.expenses.length})`;
  const list = node.querySelector('.expense-list');
  if (!envelope.expenses.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state'; empty.textContent = 'Aucune dépense enregistrée.'; list.append(empty);
  } else {
    envelope.expenses.forEach(expense => {
      const row = document.createElement('div'); row.className = 'expense-row';
      row.innerHTML = `<strong></strong><span></span><button type="button" aria-label="Modifier la dépense">•••</button>`;
      row.querySelector('strong').textContent = expense.label;
      row.querySelector('span').textContent = money(expense.amount);
      row.querySelector('button').addEventListener('click', () => openExpenseEditor(envelope.id, expense.id));
      list.append(row);
    });
  }
  node.querySelector('.envelope-summary').addEventListener('click', () => {
    openEnvelopeId = openEnvelopeId === envelope.id ? null : envelope.id;
    navigator.vibrate?.(8);
    render();
    if (openEnvelopeId) requestAnimationFrame(() => document.querySelector(`[data-id="${CSS.escape(envelope.id)}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
  });
  node.querySelector('.edit-envelope').addEventListener('click', () => openEnvelopeEditor(envelope.id));
  node.querySelector('.add-expense').addEventListener('click', () => openExpenseEditor(envelope.id));
  return node;
}

function capitalize(text) { return text.charAt(0).toUpperCase() + text.slice(1); }
function inputField(name, label, value = '', type = 'text', attrs = '') {
  return `<div class="form-field"><label for="${name}">${label}</label><input id="${name}" name="${name}" type="${type}" value="${escapeAttr(value)}" ${attrs}></div>`;
}
function selectField(name, label, values, selected) {
  return `<div class="form-field"><label for="${name}">${label}</label><select id="${name}" name="${name}">${values.map(v => `<option value="${escapeAttr(v)}" ${v === selected ? 'selected' : ''}>${v}</option>`).join('')}</select></div>`;
}
function escapeAttr(value) { return String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }
function showEditor({ title, eyebrow, fields, context }) {
  editorContext = context;
  els.dialogTitle.textContent = title;
  els.dialogEyebrow.textContent = eyebrow;
  els.editorFields.innerHTML = fields;
  els.editorDialog.showModal();
  requestAnimationFrame(() => els.editorFields.querySelector('input')?.focus());
}
function openIncomeEditor() {
  showEditor({ title: 'Revenus du mois', eyebrow: 'BUDGET', context: { type: 'income' }, fields: inputField('income','Montant des revenus',currentBudget().income,'number','min="0" step="0.01" inputmode="decimal" required') });
}
function openEnvelopeEditor(envelopeId = null) {
  const envelope = envelopeId ? currentBudget().envelopes.find(e => e.id === envelopeId) : null;
  const fields = [
    inputField('name','Nom de l’enveloppe', envelope?.name || '', 'text', 'maxlength="40" required'),
    inputField('description','Description', envelope?.description || '', 'text', 'maxlength="70"'),
    inputField('planned','Budget prévu', envelope?.planned ?? '', 'number', 'min="0" step="0.01" inputmode="decimal" required'),
    selectField('icon','Icône', ICONS, envelope?.icon || ICONS[0]),
    selectField('color','Couleur', COLORS, envelope?.color || COLORS[0])
  ].join('');
  showEditor({ title: envelope ? 'Modifier l’enveloppe' : 'Nouvelle enveloppe', eyebrow: 'ENVELOPPE', context: { type: 'envelope', envelopeId }, fields });
}
function openExpenseEditor(envelopeId, expenseId = null) {
  const envelope = currentBudget().envelopes.find(e => e.id === envelopeId);
  const expense = expenseId ? envelope.expenses.find(e => e.id === expenseId) : null;
  showEditor({ title: expense ? 'Modifier la dépense' : 'Nouvelle dépense', eyebrow: envelope.name.toUpperCase(), context: { type: 'expense', envelopeId, expenseId }, fields: [
    inputField('label','Libellé', expense?.label || '', 'text', 'maxlength="60" required'),
    inputField('amount','Montant', expense?.amount ?? '', 'number', 'min="0" step="0.01" inputmode="decimal" required')
  ].join('') });
}

els.editorForm.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(els.editorForm);
  if (editorContext.type === 'income') currentBudget().income = Number(data.get('income'));
  if (editorContext.type === 'envelope') {
    const payload = { name: String(data.get('name')).trim(), description: String(data.get('description')).trim(), planned: Number(data.get('planned')), icon: String(data.get('icon')), color: String(data.get('color')) };
    if (editorContext.envelopeId) Object.assign(currentBudget().envelopes.find(e => e.id === editorContext.envelopeId), payload);
    else {
      const id = crypto.randomUUID(); currentBudget().envelopes.push({ id, ...payload, expenses: [] }); openEnvelopeId = id;
    }
  }
  if (editorContext.type === 'expense') {
    const envelope = currentBudget().envelopes.find(e => e.id === editorContext.envelopeId);
    const payload = { label: String(data.get('label')).trim(), amount: Number(data.get('amount')) };
    if (editorContext.expenseId) Object.assign(envelope.expenses.find(e => e.id === editorContext.expenseId), payload);
    else envelope.expenses.push({ id: crypto.randomUUID(), ...payload });
    openEnvelopeId = envelope.id;
  }
  saveState(); els.editorDialog.close(); render();
});
document.querySelector('#cancelDialogBtn').addEventListener('click', () => els.editorDialog.close());
document.querySelector('#editIncomeBtn').addEventListener('click', openIncomeEditor);
document.querySelector('#addEnvelopeBtn').addEventListener('click', () => openEnvelopeEditor());
document.querySelector('#resetBtn').addEventListener('click', () => {
  if (!confirm('Réinitialiser toutes les données de l’application ?')) return;
  state = structuredClone(seed); openEnvelopeId = null; saveState(); render();
});

document.querySelector('#prevMonth').addEventListener('click', () => shiftMonth(-1));
document.querySelector('#nextMonth').addEventListener('click', () => shiftMonth(1));
function shiftMonth(delta) {
  const date = monthDate(state.selectedMonth); date.setMonth(date.getMonth() + delta);
  state.selectedMonth = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
  currentBudget(); saveState(); openEnvelopeId = null; render();
}

document.querySelector('#monthButton').addEventListener('click', () => {
  els.monthOptions.replaceChildren();
  const center = monthDate(state.selectedMonth);
  for (let i = -6; i <= 6; i++) {
    const date = new Date(center); date.setMonth(center.getMonth() + i);
    const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
    const button = document.createElement('button');
    button.type = 'button'; button.className = `month-option${key === state.selectedMonth ? ' active' : ''}`;
    button.textContent = capitalize(monthFormatter.format(date));
    button.addEventListener('click', () => { state.selectedMonth = key; currentBudget(); saveState(); openEnvelopeId = null; els.monthDialog.close(); render(); });
    els.monthOptions.append(button);
  }
  els.monthDialog.showModal();
});

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(console.error));

console.info(`Mon Budget v${VERSION}`);
render();
