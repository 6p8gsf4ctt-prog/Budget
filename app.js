'use strict';

const VERSION = '4.0.0';
const SCHEMA_VERSION = 1;
const APP_NAME = 'Budget';
const LEGACY_APP_IDS = new Set(['Budget', 'mon-organisation-financiere', 'mon-finances', 'organisation-financiere']);
const uid = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

const ICONS = {
  summary: '<path class="fillable" d="M4.5 11.5 12 5l7.5 6.5v7.2a1.8 1.8 0 0 1-1.8 1.8H6.3a1.8 1.8 0 0 1-1.8-1.8Z"/><path d="M9 20.5v-6h6v6"/>',
  budget: '<path class="fillable" d="M5 6.5h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z"/><path d="M16 11.5h5M7 6.5V5a2 2 0 0 1 2-2h8"/>',
  calendar: '<rect class="fillable" x="3.5" y="5.5" width="17" height="15" rx="3"/><path d="M8 3.5v4M16 3.5v4M3.5 10h17M8 14h3M13.5 14h2.5M8 17h3"/>',
  settings: '<circle class="fillable" cx="12" cy="12" r="3"/><path d="M19.2 13.4a7.7 7.7 0 0 0 0-2.8l2-1.5-2-3.5-2.5 1a8 8 0 0 0-2.4-1.4L14 2.5h-4l-.3 2.7a8 8 0 0 0-2.4 1.4l-2.5-1-2 3.5 2 1.5a7.7 7.7 0 0 0 0 2.8l-2 1.5 2 3.5 2.5-1a8 8 0 0 0 2.4 1.4l.3 2.7h4l.3-2.7a8 8 0 0 0 2.4-1.4l2.5 1 2-3.5Z"/>',
  eye: '<path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6S2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.8"/>',
  eyeOff: '<path d="m3 3 18 18M10.6 6.2A9 9 0 0 1 12 6c6 0 9.5 6 9.5 6a15 15 0 0 1-2.3 3M7.2 7.3C4.2 9 2.5 12 2.5 12s3.5 6 9.5 6c1 0 1.9-.2 2.7-.4M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  close: '<path d="m7.5 7.5 9 9m0-9-9 9"/>',
  person: '<circle cx="12" cy="8" r="3.3"/><path d="M5.5 20c.6-4 2.8-6 6.5-6s5.9 2 6.5 6"/>',
  people: '<circle cx="9" cy="8.5" r="3"/><circle cx="16.5" cy="9.5" r="2.5"/><path d="M3.5 20c.5-4 2.4-6 5.5-6s5 2 5.5 6M14 14.8c3.5-.4 5.6 1.3 6.1 5.2"/>',
  income: '<path d="M12 3v13m0 0-4.5-4.5M12 16l4.5-4.5M5 20h14"/>',
  expense: '<path d="M12 21V8m0 0L7.5 12.5M12 8l4.5 4.5M5 4h14"/>',
  transfer: '<path d="M5 8h13m0 0-3-3m3 3-3 3M19 16H6m0 0 3 3m-3-3 3-3"/>',
  savings: '<path class="fillable" d="M4 9.5h16v9H4zM7 9.5V7.8C7 5.7 8.8 4 11 4h2c2.2 0 4 1.7 4 3.8v1.7M8 14h.01M16 14h.01"/>',
  more: '<circle cx="6" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="18" cy="12" r="1" fill="currentColor" stroke="none"/>',
  check: '<circle cx="12" cy="12" r="8.5"/><path d="m8.2 12.2 2.5 2.5 5.3-5.5"/>',
  circle: '<circle cx="12" cy="12" r="8.5"/>',
  category: '<path d="M4 5.5h6v6H4zM14 5.5h6v6h-6zM4 15.5h6v4H4zM14 15.5h6v4h-6z"/>',
  home: '<path d="m3.5 11 8.5-7 8.5 7v9h-6v-6h-5v6h-6Z"/>',
  cart: '<path d="M3.5 5h2l1.5 9h10.5l2-6H6.2M9 19h.01M16 19h.01"/>',
  transport: '<path d="M5 16.5h14l-1-7a2 2 0 0 0-2-1.7H8a2 2 0 0 0-2 1.7Zm2-8.7L8.5 5h7L17 7.8M7.5 13h.01M16.5 13h.01M6 16.5v2M18 16.5v2"/>',
  dining: '<path d="M7 3v8M4.5 3v5A3 3 0 0 0 7 11v10M9.5 3v5A3 3 0 0 1 7 11M16 3c-2 3-2 7 0 9v9M16 3c3 2 4 6 3 9h-3"/>',
  health: '<path d="M12 20s-7-4.2-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.8-7 10-7 10Z"/><path d="M8 12h2l1-2 2 4 1-2h2"/>',
  leisure: '<path d="M7 8h10l2 8a2.5 2.5 0 0 1-4.4 2l-1.3-2h-2.6l-1.3 2A2.5 2.5 0 0 1 5 16Z"/><path d="M8 11v4M6 13h4M15.5 12h.01M17.5 14h.01"/>',
  document: '<path d="M6 3.5h8l4 4v13H6zM14 3.5v4h4M9 12h6M9 16h6"/>',
  forecast: '<path d="M4 18.5 9 13l3 3 7-8M15 8h4v4"/>',
  date: '<rect x="4" y="5.5" width="16" height="15" rx="3"/><path d="M8 3.5v4M16 3.5v4M4 10h16M8 14h3"/>',
  repeat: '<path d="M17 7H7a4 4 0 0 0-4 4v1M7 4 4 7l3 3M7 17h10a4 4 0 0 0 4-4v-1M17 20l3-3-3-3"/>',
  save: '<path d="M5 4h12l2 2v14H5zM8 4v6h8V4M8 16h8"/>',
  edit: '<path d="m4 16-.7 4.7L8 20l11-11-4-4ZM13.5 6.5l4 4"/>',
  transaction: '<path d="M5 8h14M8 5 5 8l3 3M19 16H5m11-3 3 3-3 3"/>',
  copy: '<rect x="7" y="7" width="12" height="13" rx="2"/><path d="M5 16H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1"/>',
  database: '<ellipse cx="12" cy="5.5" rx="8" ry="3"/><path d="M4 5.5v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6M4 11.5v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
  export: '<path d="M12 4v13m0 0 5-5m-5 5-5-5M5 20h14"/>',
  import: '<path d="M12 17V4m0 0L7 9m5-5 5 5M5 20h14"/>',
  restore: '<path d="M5 7v5h5M6 11a7 7 0 1 1 1 6"/>',
  decimal: '<path d="M7 6h4M9 4v12M5 16h8M17 17h.01"/>',
  currency: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.2a4.7 4.7 0 1 0 0 7.6M7.5 10.5h7M7.5 13.5h6"/>',
  numbers: '<path d="M7 5 5 19M12 5l-2 14M3 10h15M2 15h15"/>',
  motion: '<path d="M3 12h4M17 12h4M6 7l3 3M18 7l-3 3M6 17l3-3M18 17l-3-3"/><circle cx="12" cy="12" r="2"/>',
  storage: '<path d="M4 6.5h16v12H4zM8 10h8M8 14h5"/>',
  trash: '<path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  warning: '<path d="M12 3 2.8 20h18.4ZM12 9v4M12 17h.01"/>',
  offline: '<path d="m3 3 18 18M8.5 8.7A8.5 8.5 0 0 1 20 10M4 10a8.6 8.6 0 0 1 1.6-2.2M7 14a7 7 0 0 1 6.8-1M10 18a3.5 3.5 0 0 1 4 0M12 21h.01"/>',
  refresh: '<path d="M20 6v5h-5M4 18v-5h5M18.5 11a7 7 0 0 0-12-4M5.5 13a7 7 0 0 0 12 4"/>',
  spinner: '<path d="M20 12a8 8 0 1 1-5.7-7.7"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>'
};

function icon(name, selected = false) {
  const content = ICONS[name] || ICONS.category;
  return `<svg class="${selected ? 'is-selected' : ''}" aria-hidden="true" viewBox="0 0 24 24">${content}</svg>`;
}

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}

function incomeSource(label, amount, extras = {}) {
  return { id: uid(), label, amount: Number(amount || 0), recurring: true, recurrence: 'monthly', ...extras };
}

function expenseLine(label, amount, extras = {}) {
  return { id: uid(), label, amount: Number(amount || 0), date: '', recurring: false, recurrence: 'monthly', note: '', ...extras };
}

function category(name, description = '', type = 'expense', extras = {}) {
  return {
    id: uid(),
    name,
    description,
    type,
    iconName: inferCategoryIcon({ name, description, type }),
    color: '#FF9F0A',
    planned: 0,
    expenses: [],
    ...extras
  };
}

function forecastItem(kind, label, amount, extras = {}) {
  return {
    id: uid(),
    kind: kind === 'receipt' ? 'receipt' : 'payment',
    label,
    amount: Number(amount || 0),
    date: '',
    status: 'planned',
    source: 'current',
    space: 'personal',
    recurring: false,
    recurrence: 'monthly',
    note: '',
    ...extras
  };
}

function seed() {
  const now = new Date().toISOString();
  return {
    version: VERSION,
    schemaVersion: SCHEMA_VERSION,
    activeTab: 'future',
    activeSpace: 'personal',
    settings: {
      privacy: false,
      showCents: true,
      currency: 'EUR',
      numberLocale: 'fr-FR',
      includePlannedForecast: true,
      reduceMotion: false,
      periodStartDay: 1,
      periodType: 'monthly'
    },
    meta: {
      createdAt: now,
      revision: 0,
      lastSavedAt: null,
      lastModifiedAt: null,
      lastExportAt: null,
      lastExportFilename: null,
      migratedAt: null
    },
    forecast: {
      buffer: { target: 5000, current: 5000, configured: true },
      items: []
    },
    spaces: {
      personal: { name: 'Personnel', incomeSources: [], envelopes: [] },
      shared: { name: 'Commun', incomeSources: [], envelopes: [] }
    },
    history: []
  };
}

let state;
let editor = null;
let pendingImport = null;
let openCategoryId = null;
let saveTimer = null;
let saveQueue = Promise.resolve();
let saveStatus = 'saved';
let saveError = null;
let toastTimer = null;
let alertResolver = null;
let latestSnapshot = null;

const els = {
  header: $('#appHeader'),
  title: $('#screenTitle'),
  subtitle: $('#screenSubtitle'),
  privacy: $('#privacyBtn'),
  quickAdd: $('#quickAddBtn'),
  budgetView: $('#budgetView'),
  futureView: $('#futureView'),
  settingsView: $('#settingsView'),
  editorDialog: $('#editorDialog'),
  editorForm: $('#editorForm'),
  editorFields: $('#editorFields'),
  dialogTitle: $('#dialogTitle'),
  dialogSubtitle: $('#dialogSubtitle'),
  submitDialog: $('#submitDialogBtn'),
  deleteArea: $('#deleteArea'),
  importDialog: $('#importDialog'),
  importSummary: $('#importSummary'),
  alertDialog: $('#alertDialog'),
  alertIcon: $('#alertIcon'),
  alertTitle: $('#alertTitle'),
  alertMessage: $('#alertMessage'),
  alertCancel: $('#alertCancelBtn'),
  alertConfirm: $('#alertConfirmBtn'),
  toast: $('#toast')
};

function clone(value) {
  return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

function unwrapBackup(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (raw.app === APP_NAME && raw.data) {
    return { ...raw.data, settings: raw.settings || raw.data.settings };
  }
  return raw.state || raw.data || raw;
}

function normalize(raw) {
  if (!raw) return null;
  let data = clone(unwrapBackup(raw));
  if (!data) return null;

  if (data.months) {
    const empty = seed();
    const latest = data.months[data.selectedMonth] || Object.values(data.months)[0];
    if (latest) {
      empty.spaces.personal.incomeSources = [incomeSource('Revenu principal', Number(latest.income || 0))];
      empty.spaces.personal.envelopes = Array.isArray(latest.envelopes) ? latest.envelopes : [];
    }
    data = empty;
  }

  if (!data.spaces?.personal || !data.spaces?.shared) return null;

  const defaults = seed();
  data.settings = { ...defaults.settings, ...(data.settings || {}) };
  data.settings.periodStartDay = Math.min(28, Math.max(1, Number(data.settings.periodStartDay || 1)));
  data.settings.currency = ['EUR', 'CHF', 'GBP', 'USD'].includes(data.settings.currency) ? data.settings.currency : 'EUR';
  data.settings.numberLocale = ['fr-FR', 'en-IE'].includes(data.settings.numberLocale) ? data.settings.numberLocale : 'fr-FR';
  data.settings.showCents = data.settings.showCents !== false;
  data.settings.includePlannedForecast = data.settings.includePlannedForecast !== false;
  data.settings.reduceMotion = Boolean(data.settings.reduceMotion);

  data.meta = { ...defaults.meta, ...(data.meta || {}) };
  data.meta.lastModifiedAt ||= data.meta.lastSavedAt || null;
  data.meta.lastExportAt ||= null;
  data.meta.lastExportFilename ||= null;

  const legacyTab = data.activeTab;
  if (legacyTab === 'overview' || legacyTab === 'summary') data.activeTab = 'future';
  else if (legacyTab === 'personal' || legacyTab === 'shared') {
    data.activeTab = 'budget';
    data.activeSpace = legacyTab;
  }
  if (!['budget', 'future', 'settings'].includes(data.activeTab)) data.activeTab = 'future';
  if (!['personal', 'shared'].includes(data.activeSpace)) data.activeSpace = 'personal';

  for (const key of ['personal', 'shared']) {
    const space = data.spaces[key];
    space.name ||= key === 'personal' ? 'Personnel' : 'Commun';
    if (!Array.isArray(space.incomeSources)) {
      space.incomeSources = [incomeSource(key === 'personal' ? 'Revenu principal' : 'Contributions', Number(space.income || 0))];
    }
    space.incomeSources = space.incomeSources.map(source => ({
      id: source.id || uid(),
      label: source.label || 'Revenu',
      amount: Number(source.amount || 0),
      recurring: source.recurring !== false,
      recurrence: source.recurrence || 'monthly',
      date: source.date || '',
      note: source.note || '',
      ...source
    }));

    space.envelopes = Array.isArray(space.envelopes) ? space.envelopes : [];
    for (const envelope of space.envelopes) {
      envelope.id ||= uid();
      envelope.name ||= 'Catégorie';
      envelope.description ||= '';
      envelope.type = ['expense', 'savings', 'transfer'].includes(envelope.type)
        ? envelope.type
        : (key === 'personal' && /compte commun|transfert|virement/i.test(envelope.name)
          ? 'transfer'
          : /épargne|livret|crypto|bourse|invest/i.test(`${envelope.name} ${envelope.description}`)
            ? 'savings'
            : 'expense');
      envelope.iconName ||= legacyCategoryIcon(envelope.icon) || inferCategoryIcon(envelope);
      envelope.color = '#FF9F0A';
      envelope.planned = Number(envelope.planned || 0);
      envelope.expenses = Array.isArray(envelope.expenses) ? envelope.expenses : [];
      envelope.expenses = envelope.expenses.map(line => ({
        id: line.id || uid(),
        label: line.label || 'Opération',
        amount: Number(line.amount || 0),
        date: line.date || '',
        recurring: Boolean(line.recurring),
        recurrence: line.recurrence || 'monthly',
        note: line.note || '',
        ...line
      }));
    }
    delete space.income;
  }

  data.forecast = data.forecast || {};
  const rawBuffer = data.forecast.buffer || {};
  const hasConfiguredReserve = rawBuffer.configured === true || (
    rawBuffer.configured == null && (Number(rawBuffer.target || 0) !== 0 || Number(rawBuffer.current || 0) !== 0)
  );
  data.forecast.buffer = hasConfiguredReserve
    ? {
        target: Number(rawBuffer.target || 5000),
        current: Number(rawBuffer.current ?? rawBuffer.target ?? 5000),
        configured: true
      }
    : { target: 5000, current: 5000, configured: true };
  data.forecast.items = Array.isArray(data.forecast.items) ? data.forecast.items : [];
  data.forecast.items = data.forecast.items.map(item => ({
    id: item.id || uid(),
    kind: item.kind === 'receipt' ? 'receipt' : 'payment',
    label: item.label || 'Opération',
    amount: Number(item.amount || 0),
    date: item.date || '',
    status: ['planned', 'confirmed', 'done'].includes(item.status) ? item.status : 'planned',
    source: item.source || 'current',
    space: ['personal', 'shared'].includes(item.space) ? item.space : 'personal',
    recurring: Boolean(item.recurring),
    recurrence: item.recurrence || 'monthly',
    note: item.note || '',
    ...item
  }));

  data.history = Array.isArray(data.history) ? data.history : [];
  data.version = VERSION;
  data.schemaVersion = SCHEMA_VERSION;
  return data;
}

function legacyCategoryIcon(value) {
  const mapping = {
    '🏠': 'home',
    '🛒': 'cart',
    '👥': 'transfer',
    '📈': 'savings',
    '🚗': 'transport',
    '🍽️': 'dining',
    '❤️': 'health',
    '🎮': 'leisure'
  };
  return mapping[value] || null;
}

function inferCategoryIcon(item) {
  const text = `${item?.name || ''} ${item?.description || ''}`.toLowerCase();
  if (item?.type === 'transfer' || /transfert|virement|commun/.test(text)) return 'transfer';
  if (item?.type === 'savings' || /épargne|livret|invest|bourse|crypto/.test(text)) return 'savings';
  if (/logement|loyer|maison|électricité|internet|assurance/.test(text)) return 'home';
  if (/course|aliment|supermarché/.test(text)) return 'cart';
  if (/voiture|transport|essence|train|bus|entretien/.test(text)) return 'transport';
  if (/restaurant|repas|café/.test(text)) return 'dining';
  if (/santé|médecin|pharmacie|psy/.test(text)) return 'health';
  if (/loisir|cinéma|jeu|vacance|voyage|airbnb/.test(text)) return 'leisure';
  return 'category';
}

function sum(values) {
  return values.reduce((total, value) => total + Number(value || 0), 0);
}

function categorySpent(item) {
  return sum((item.expenses || []).map(line => line.amount));
}

function totals(space) {
  const income = sum((space.incomeSources || []).map(source => source.amount));
  const outgoing = sum((space.envelopes || []).map(categorySpent));
  const planned = sum((space.envelopes || []).map(item => item.planned));
  return { income, outgoing, planned, available: income - outgoing };
}

function aggregateTotals() {
  const personal = totals(state.spaces.personal);
  const shared = totals(state.spaces.shared);
  return {
    income: personal.income + shared.income,
    outgoing: personal.outgoing + shared.outgoing,
    planned: personal.planned + shared.planned,
    available: personal.available + shared.available
  };
}

function activeSpace() {
  return state.spaces[state.activeSpace];
}

function formatter() {
  return new Intl.NumberFormat(state.settings.numberLocale, {
    style: 'currency',
    currency: state.settings.currency,
    minimumFractionDigits: state.settings.showCents ? 2 : 0,
    maximumFractionDigits: state.settings.showCents ? 2 : 0
  });
}

function formatMoney(value, { signed = false } = {}) {
  if (state.settings.privacy) return '••••';
  const number = Number(value || 0);
  const prefix = signed && number > 0 ? '+' : '';
  return `${prefix}${formatter().format(number)}`;
}

function fullMoneyLabel(value) {
  const number = Number(value || 0);
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: state.settings.currency, minimumFractionDigits: 2, maximumFractionDigits: 2
  }).format(number);
}

function setMoney(element, value, options = {}) {
  if (!element) return;
  element.textContent = formatMoney(value, options);
  element.setAttribute('aria-label', state.settings.privacy ? 'Montant masqué' : fullMoneyLabel(value));
  element.classList.toggle('financial-negative', Number(value) < 0);
}

function plural(value, singular, pluralForm = `${singular}s`) {
  return `${value} ${value > 1 ? pluralForm : singular}`;
}

function localDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseLocalDate(value) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, 12, 0, 0);
}

function formatDate(value, options = { day: 'numeric', month: 'short', year: 'numeric' }) {
  const date = typeof value === 'string' ? parseLocalDate(value) || new Date(value) : value;
  if (!date || Number.isNaN(date.getTime())) return 'Date non renseignée';
  return new Intl.DateTimeFormat('fr-FR', options).format(date);
}

function sameDay(a, b) {
  return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const now = new Date();
  const time = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(date);
  if (sameDay(date, now)) return `Aujourd’hui à ${time}`;
  return `Le ${new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)} à ${time}`;
}

function periodInfo() {
  const now = new Date();
  const day = state.settings.periodStartDay;
  const start = now.getDate() >= day
    ? new Date(now.getFullYear(), now.getMonth(), day)
    : new Date(now.getFullYear(), now.getMonth() - 1, day);
  const next = new Date(start.getFullYear(), start.getMonth() + 1, day);
  const end = new Date(next.getTime() - 86400000);
  const elapsed = Math.floor((now.setHours(0, 0, 0, 0) - start.getTime()) / 86400000) + 1;
  const duration = Math.floor((next.getTime() - start.getTime()) / 86400000);
  const percent = Math.min(100, Math.max(0, (elapsed / duration) * 100));
  const label = day === 1
    ? new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(start).replace(/^./, c => c.toUpperCase())
    : `${formatDate(start, { day: 'numeric', month: 'short' })} – ${formatDate(end, { day: 'numeric', month: 'short', year: 'numeric' })}`;
  return { start, end, percent, label };
}

function futureActiveItems() {
  return state.forecast.items.filter(item => {
    if (item.status === 'done') return false;
    if (!state.settings.includePlannedForecast && item.status === 'planned') return false;
    return true;
  });
}

function futureTotals() {
  const items = futureActiveItems();
  const payments = sum(items.filter(item => item.kind === 'payment').map(item => item.amount));
  const receipts = sum(items.filter(item => item.kind === 'receipt').map(item => item.amount));
  return { payments, receipts, net: receipts - payments };
}

function operationCount(data = state) {
  const income = sum(Object.values(data.spaces).map(space => space.incomeSources.length));
  const expenses = sum(Object.values(data.spaces).flatMap(space => space.envelopes.map(item => item.expenses.length)));
  return income + expenses + data.forecast.items.length;
}

function categoryCount(data = state) {
  return sum(Object.values(data.spaces).map(space => space.envelopes.length));
}

function recurringCounts() {
  const incomes = sum(Object.values(state.spaces).map(space => space.incomeSources.filter(source => source.recurring).length));
  const expenses = sum(Object.values(state.spaces).map(space => space.envelopes.flatMap(item => item.expenses).filter(line => line.recurring).length));
  return { incomes, expenses };
}

function pushHistory(type, label) {
  state.history.unshift({ id: uid(), type, label, at: new Date().toISOString() });
  state.history = state.history.slice(0, 200);
}

async function load() {
  renderSkeletons();
  const loaded = await BudgetStorage.load();
  const storedData = unwrapBackup(loaded.state);
  const needsMigration = Boolean(loaded.state && (String(storedData?.version || '') !== VERSION || Number(storedData?.schemaVersion || 0) !== SCHEMA_VERSION));
  if (needsMigration) {
    try {
      await BudgetStorage.createSnapshot(clone(loaded.state), 'before-migration');
    } catch (error) {
      console.warn('Copie préalable à la migration impossible', error);
    }
  }
  const normalized = normalize(loaded.state);
  state = normalized || seed();
  if (needsMigration && normalized) state.meta.migratedAt = new Date().toISOString();
  applyStaticIcons();
  bindEvents();
  applyMotionPreference();
  await refreshStorageDetails();
  render();
  if (loaded.source !== 'indexeddb' || !loaded.state || needsMigration) commit({ modified: false, snapshot: false });
  BudgetStorage.requestPersistence().catch(() => {});
}

function renderSkeletons() {
  const timeline = $('#futureTimeline');
  if (timeline) timeline.innerHTML = '<div class="timeline-list"><div class="timeline-row"><span class="timeline-symbol skeleton"></span><span class="row-copy"><strong class="skeleton" style="height:16px;width:58%"></strong><small class="skeleton" style="height:12px;width:42%;margin-top:7px"></small></span></div></div>';
}

function commit({ modified = true, snapshot = false, reason = 'automatic' } = {}) {
  if (!state) return;
  if (modified) {
    state.meta.lastModifiedAt = new Date().toISOString();
    state.meta.revision = Number(state.meta.revision || 0) + 1;
  }
  state.version = VERSION;
  state.schemaVersion = SCHEMA_VERSION;
  saveStatus = 'saving';
  saveError = null;
  renderDataStatus();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => persistState({ snapshot, reason }), 220);
}

async function persistState({ snapshot = false, reason = 'automatic' } = {}) {
  clearTimeout(saveTimer);
  if (!state) return;
  state.meta.lastSavedAt = new Date().toISOString();
  const payload = clone(state);
  try {
    saveQueue = saveQueue.then(() => BudgetStorage.save(payload, { snapshot, snapshotReason: reason }));
    await saveQueue;
    saveStatus = 'saved';
    saveError = null;
  } catch (error) {
    console.error(error);
    saveStatus = 'error';
    saveError = error;
  }
  renderDataStatus();
  renderSettings();
}

async function flushSave() {
  if (!state) return;
  if (saveTimer) await persistState({ snapshot: false, reason: 'flush' });
  else await saveQueue.catch(() => {});
}

function retrySave() {
  saveStatus = 'saving';
  renderDataStatus();
  persistState({ snapshot: false, reason: 'retry' });
}

function applyStaticIcons() {
  $$('[data-icon]').forEach(node => {
    const name = node.dataset.icon;
    node.innerHTML = icon(name);
  });
  $$('.chevron-icon').forEach(node => { node.innerHTML = icon('chevron'); });
  els.privacy.innerHTML = icon('eye');
  els.quickAdd.innerHTML = icon('plus');
  $('#addIncomeBtn').innerHTML = icon('plus');
  $('#addCategoryBtn').innerHTML = icon('plus');
  $('#addFutureBtn').innerHTML = icon('plus');
  $('#editBufferBtn').innerHTML = icon('edit');
  $('#reserveAdjustmentIcon').innerHTML = icon('savings');
  $('#closeDialogBtn').innerHTML = icon('close');
  $('#closeImportBtn').innerHTML = icon('close');
}

function render() {
  const period = periodInfo();
  const target = Number(state.forecast.buffer.target || 5000);
  const titles = {
    future: ['Épargne de précaution', `Objectif permanent · ${formatMoney(target)}`],
    budget: ['Budget', period.label],
    settings: ['Réglages', 'Budget · Données · Affichage']
  };
  const [title, subtitle] = titles[state.activeTab] || titles.future;
  els.title.textContent = title;
  els.subtitle.textContent = subtitle;

  const views = {
    future: els.futureView,
    budget: els.budgetView,
    settings: els.settingsView
  };
  Object.entries(views).forEach(([name, view]) => view.classList.toggle('active', name === state.activeTab));

  const tabIcons = { future: 'savings', budget: 'budget', settings: 'settings' };
  $$('.tab').forEach(tab => {
    const active = tab.dataset.tab === state.activeTab;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-current', active ? 'page' : 'false');
    tab.querySelector('.tab-icon').innerHTML = icon(tabIcons[tab.dataset.tab] || 'category', active);
  });

  const financialScreen = state.activeTab !== 'settings';
  els.privacy.hidden = !financialScreen;
  els.quickAdd.hidden = !financialScreen;
  els.quickAdd.setAttribute('aria-label', state.activeTab === 'future' ? 'Ajouter une prévision à l’épargne de précaution' : 'Ajouter une opération au budget');
  els.privacy.innerHTML = icon(state.settings.privacy ? 'eyeOff' : 'eye');
  els.privacy.setAttribute('aria-label', state.settings.privacy ? 'Afficher les montants' : 'Masquer les montants');

  applyMotionPreference();
  renderFuture();
  renderBudget();
  renderSettings();
  renderDataStatus();
}

function renderBudget() {
  const space = activeSpace();
  const total = totals(space);
  const segment = $('#spaceSegment');
  segment.querySelector('[data-space="personal"]').innerHTML = `${icon('person')}<span>${esc(state.spaces.personal.name)}</span>`;
  segment.querySelector('[data-space="shared"]').innerHTML = `${icon('people')}<span>${esc(state.spaces.shared.name)}</span>`;
  segment.querySelectorAll('button').forEach(button => {
    const active = button.dataset.space === state.activeSpace;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });

  setMoney($('#budgetAvailable'), total.available);
  setMoney($('#budgetPlanned'), total.planned);
  setMoney($('#budgetUsed'), total.outgoing);
  setMoney($('#budgetIncome'), total.income);
  $('#budgetSpaceIcon').innerHTML = icon(state.activeSpace === 'personal' ? 'person' : 'people');

  renderIncomeSources(space);
  renderCategories(space);
}

function renderIncomeSources(space) {
  const box = $('#incomeSourceList');
  box.replaceChildren();
  if (!space.incomeSources.length) {
    box.innerHTML = emptyState('income', 'Aucun revenu pour cette période', 'Ajoutez un revenu pour calculer le montant disponible.', [{ label: 'Ajouter un revenu', action: 'add-income' }]);
    return;
  }
  space.incomeSources.forEach(source => {
    const row = document.createElement('div');
    row.className = 'ios-row';
    row.innerHTML = `
      <span class="row-symbol" style="color:var(--green);background:rgba(48,209,88,.12)">${icon('income')}</span>
      <span class="row-copy"><strong>${esc(source.label)}</strong><small>${source.recurring ? `Récurrent · ${recurrenceLabel(source.recurrence)}` : source.date ? formatDate(source.date) : 'Revenu de la période'}</small></span>
      <span class="row-value financial-positive">${formatMoney(source.amount)}</span>
      <button class="row-more" type="button" aria-label="Modifier ${esc(source.label)}">${icon('more')}</button>`;
    row.querySelector('button').onclick = () => openIncome(source.id);
    box.append(row);
  });
}

function renderCategories(space) {
  const box = $('#categoryList');
  box.replaceChildren();
  if (!space.envelopes.length) {
    box.innerHTML = `<div class="ios-list">${emptyState('category', 'Aucune catégorie personnalisée', 'Créez une catégorie pour répartir votre budget.', [{ label: 'Créer une catégorie', action: 'add-category' }])}</div>`;
    return;
  }
  space.envelopes.forEach(item => box.append(categoryCard(item)));
}

function categoryCard(item) {
  const used = categorySpent(item);
  const planned = Number(item.planned || 0);
  const remaining = planned - used;
  const ratio = planned > 0 ? used / planned : 0;
  const percent = planned > 0 ? Math.round(ratio * 100) : null;
  const card = document.createElement('article');
  card.className = `category-card ${openCategoryId === item.id ? 'open' : ''}`;
  card.dataset.id = item.id;

  const statusClass = ratio > 1 ? 'danger' : ratio >= .85 ? 'warning' : '';
  const statusText = planned <= 0
    ? 'Budget à définir'
    : ratio > 1
      ? `Budget dépassé de ${formatMoney(Math.abs(remaining))}`
      : ratio >= .85
        ? 'Limite bientôt atteinte'
        : `${percent} % utilisé`;

  card.innerHTML = `
    <button class="category-summary" type="button" aria-expanded="${openCategoryId === item.id}">
      <span class="category-symbol">${icon(item.iconName || inferCategoryIcon(item))}</span>
      <span class="category-copy"><strong>${esc(item.name)}</strong><small>${typeLabel(item.type)} · ${plural(item.expenses.length, 'opération')}</small></span>
      <span class="category-total"><strong>${formatMoney(used)}</strong><small>${planned > 0 ? `sur ${formatMoney(planned)}` : 'utilisé'}</small></span>
    </button>
    <div class="category-progress-wrap">
      <div class="category-progress"><i style="width:${Math.min(100, ratio * 100)}%;background:${ratio > 1 ? 'var(--red)' : ratio >= .85 ? 'var(--orange-warning)' : planned > 0 ? 'var(--accent)' : 'var(--surface-tertiary)'}"></i></div>
      <div class="category-status"><span class="${statusClass}">${statusText}</span><span>${planned > 0 ? `${formatMoney(Math.max(0, remaining))} restant` : esc(item.description || 'Sans description')}</span></div>
    </div>
    <div class="category-details">
      <div class="category-lines"></div>
      <div class="category-actions"><button type="button" data-category-action="add">Ajouter une dépense</button><button type="button" data-category-action="edit">Modifier la catégorie</button></div>
    </div>`;

  card.querySelector('.category-summary').onclick = () => {
    openCategoryId = openCategoryId === item.id ? null : item.id;
    renderBudget();
  };
  card.querySelector('[data-category-action="add"]').onclick = () => openExpense(item.id);
  card.querySelector('[data-category-action="edit"]').onclick = () => openCategory(item.id);

  const lines = card.querySelector('.category-lines');
  if (!item.expenses.length) {
    lines.innerHTML = '<div class="empty-state" style="padding:22px"><strong>Aucune dépense</strong><p>Les opérations de cette catégorie apparaîtront ici.</p></div>';
  } else {
    item.expenses.forEach(line => {
      const row = document.createElement('div');
      row.className = 'category-line';
      row.innerHTML = `<span class="category-line-copy"><strong>${esc(line.label)}</strong><small>${line.date ? formatDate(line.date) : line.recurring ? `Récurrent · ${recurrenceLabel(line.recurrence)}` : 'Date non renseignée'}</small></span><span>${formatMoney(line.amount)}</span><button class="row-more" type="button" aria-label="Modifier ${esc(line.label)}">${icon('more')}</button>`;
      row.querySelector('button').onclick = () => openExpense(item.id, line.id);
      lines.append(row);
    });
  }
  return card;
}

function renderFuture() {
  const total = futureTotals();
  const reserve = state.forecast.buffer;
  const current = Number(reserve.current || 0);
  const target = Number(reserve.target || 5000);
  const projected = current + total.net;
  const gap = target - projected;
  const ratio = target > 0 ? projected / target : 1;
  const percent = Math.round(Math.max(0, ratio) * 100);

  setMoney($('#forecastBalance'), projected);
  setMoney($('#reserveCurrent'), current);
  setMoney($('#forecastIncome'), total.receipts);
  setMoney($('#forecastPayments'), total.payments);
  $('#forecastBalance').classList.toggle('financial-negative', projected < 0);
  $('#forecastBalance').classList.toggle('financial-positive', projected >= target);
  $('#forecastProjectionCaption').textContent = state.settings.includePlannedForecast
    ? 'Après toutes les opérations prévues et confirmées'
    : 'Après les opérations confirmées uniquement';

  const progress = $('#reserveProgress');
  progress.style.width = `${Math.min(100, Math.max(0, ratio * 100))}%`;
  progress.style.background = projected < 0 ? 'var(--red)' : projected >= target ? 'var(--green)' : 'var(--accent)';
  $('#reserveProgressCurrent').textContent = `${percent} % de l’objectif`;
  $('#reserveTargetLabel').textContent = `Objectif ${formatMoney(target)}`;

  const status = $('#forecastRisk');
  const adjustmentCard = $('#reserveAdjustmentCard');
  const adjustmentIcon = $('#reserveAdjustmentIcon');
  const adjustmentLabel = $('#reserveAdjustmentLabel');
  const adjustmentAmount = $('#reserveAdjustmentAmount');
  const adjustmentDetail = $('#reserveAdjustmentDetail');
  status.className = 'reserve-status';
  adjustmentCard.className = 'reserve-adjustment';

  if (projected < 0) {
    status.classList.add('danger');
    status.innerHTML = `<strong>Réserve déficitaire</strong><span>Les opérations prévues placeraient la réserve à ${formatMoney(projected)}.</span>`;
    adjustmentCard.classList.add('danger');
    adjustmentIcon.innerHTML = icon('warning');
    adjustmentLabel.textContent = 'Montant nécessaire pour retrouver l’objectif';
    setMoney(adjustmentAmount, Math.max(0, gap));
    adjustmentDetail.textContent = 'Un ajustement du budget personnel est nécessaire.';
  } else if (projected < target) {
    status.classList.add('advisory');
    status.innerHTML = `<strong>Objectif non atteint</strong><span>La réserve resterait positive, mais sous l’objectif de ${formatMoney(target)}.</span>`;
    adjustmentCard.classList.add('advisory');
    adjustmentIcon.innerHTML = icon('transfer');
    adjustmentLabel.textContent = 'À renflouer pour retrouver l’objectif';
    setMoney(adjustmentAmount, Math.max(0, gap));
    adjustmentDetail.textContent = 'Vous pouvez adapter le budget personnel pour combler cet écart.';
  } else {
    const surplus = projected - target;
    status.classList.add('success');
    status.innerHTML = `<strong>Objectif maintenu</strong><span>La projection conserve au moins ${formatMoney(target)} dans la réserve.</span>`;
    adjustmentCard.classList.add('success');
    adjustmentIcon.innerHTML = icon('check');
    adjustmentLabel.textContent = surplus > 0 ? 'Marge prévue au-dessus de l’objectif' : 'Écart par rapport à l’objectif';
    setMoney(adjustmentAmount, surplus);
    adjustmentDetail.textContent = surplus > 0 ? 'La réserve reste au-dessus de son niveau cible.' : 'La réserve reste exactement à son niveau cible.';
  }

  renderBudgetGlance();
  renderTimeline();
}

function renderBudgetGlance() {
  const box = $('#budgetGlance');
  box.replaceChildren();
  for (const key of ['personal', 'shared']) {
    const space = state.spaces[key];
    const total = totals(space);
    const row = document.createElement('button');
    row.className = 'ios-row-button budget-glance-row';
    row.type = 'button';
    row.innerHTML = `
      <span class="row-symbol">${icon(key === 'personal' ? 'person' : 'people')}</span>
      <span class="row-copy"><strong>${esc(space.name)}</strong><small>${total.available < 0 ? `Déficit de ${formatMoney(Math.abs(total.available))}` : 'Disponible dans le budget courant'}</small></span>
      <span class="row-value ${total.available < 0 ? 'financial-negative' : ''}">${formatMoney(total.available)}</span>
      <span class="row-chevron">${icon('chevron')}</span>`;
    row.onclick = () => {
      state.activeSpace = key;
      navigate('budget');
    };
    box.append(row);
  }
}

function compareFutureDates(a, b) {
  return (a.date || '9999-12-31').localeCompare(b.date || '9999-12-31') || a.label.localeCompare(b.label, 'fr');
}

function futureDateLabel(item) {
  if (!item.date) return 'Date à définir';
  const date = parseLocalDate(item.date);
  const today = new Date();
  if (sameDay(date, today)) return 'Aujourd’hui';
  return formatDate(date, { day: 'numeric', month: 'short' });
}

function timelineGroup(item) {
  if (!item.date) return 'À planifier';
  const date = parseLocalDate(item.date);
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const diff = Math.round((date - today) / 86400000);
  if (diff < 0) return 'En retard';
  if (diff === 0) return 'Aujourd’hui';
  if (diff <= 7) return 'Cette semaine';
  return 'Plus tard';
}

function renderTimeline() {
  const active = state.forecast.items.filter(item => item.status !== 'done').sort(compareFutureDates);
  const done = state.forecast.items.filter(item => item.status === 'done').sort(compareFutureDates);
  const box = $('#futureTimeline');
  box.replaceChildren();

  if (!active.length) {
    box.innerHTML = `<div class="ios-list">${emptyState('savings', 'Aucun mouvement prévu', 'Ajoutez les dépenses et rentrées futures pour anticiper le niveau de votre réserve.', [{ label: 'Ajouter une dépense', action: 'add-future-payment' }, { label: 'Ajouter une rentrée', action: 'add-future-receipt' }])}</div>`;
  } else {
    const groups = ['En retard', 'Aujourd’hui', 'Cette semaine', 'Plus tard', 'À planifier'];
    groups.forEach(groupName => {
      const items = active.filter(item => timelineGroup(item) === groupName);
      if (!items.length) return;
      const group = document.createElement('section');
      group.className = 'timeline-group';
      group.innerHTML = `<h3>${groupName}</h3><div class="timeline-list"></div>`;
      items.forEach(item => group.querySelector('.timeline-list').append(timelineRow(item)));
      box.append(group);
    });
  }

  const toggle = $('#toggleCompletedBtn');
  toggle.hidden = !done.length;
  toggle.innerHTML = `${$('#completedTimeline').hidden ? 'Afficher' : 'Masquer'} les opérations terminées`;
  const completed = $('#completedTimeline');
  completed.replaceChildren();
  if (done.length) {
    const group = document.createElement('section');
    group.className = 'timeline-group';
    group.innerHTML = '<h3>Terminées</h3><div class="timeline-list"></div>';
    done.forEach(item => group.querySelector('.timeline-list').append(timelineRow(item)));
    completed.append(group);
  }
}

function timelineRow(item) {
  const row = document.createElement('article');
  row.className = 'timeline-row';
  const status = item.status === 'confirmed' ? 'Confirmé' : item.status === 'done' ? 'Terminé' : 'Prévu';
  row.innerHTML = `
    ${item.status === 'confirmed' ? '<span class="timeline-indicator" aria-label="Échéance confirmée"></span>' : ''}
    <span class="timeline-symbol ${item.kind === 'receipt' ? 'receipt' : ''}">${icon(item.kind === 'receipt' ? 'income' : 'expense')}</span>
    <button class="timeline-content" type="button"><strong>${esc(item.label)}</strong><small>${futureDateLabel(item)} · ${esc(state.spaces[item.space]?.name || 'Personnel')} · ${status}</small></button>
    <span class="timeline-amount ${item.kind === 'receipt' ? 'financial-positive' : ''}">${formatMoney(item.kind === 'receipt' ? item.amount : -item.amount, { signed: item.kind === 'receipt' })}</span>
    <button class="timeline-check ${item.status === 'done' ? 'done' : ''}" type="button" aria-label="${item.status === 'done' ? 'Réactiver' : 'Marquer comme terminée'}">${icon(item.status === 'done' ? 'check' : 'circle')}</button>`;
  row.querySelector('.timeline-content').onclick = () => openFuture(item.id);
  row.querySelector('.timeline-check').onclick = () => {
    item.status = item.status === 'done' ? 'planned' : 'done';
    pushHistory('forecast-status', item.label);
    commit();
    render();
  };
  return row;
}

async function renderSettings() {
  if (!state) return;
  const recurring = recurringCounts();
  const countCategories = categoryCount();
  const countOperations = operationCount();
  $('#periodStartPreview').textContent = state.settings.periodStartDay === 1 ? 'Premier jour du mois' : `Le ${state.settings.periodStartDay} de chaque mois`;
  $('#categoryCountPreview').textContent = plural(countCategories, 'catégorie');
  $('#spacesPreview').textContent = `${state.spaces.personal.name} · ${state.spaces.shared.name}`;
  $('#recurringIncomePreview').textContent = plural(recurring.incomes, 'revenu');
  $('#recurringExpensePreview').textContent = plural(recurring.expenses, 'dépense');
  $('#forecastCountPreview').textContent = `Objectif ${formatMoney(state.forecast.buffer.target)} · ${plural(state.forecast.items.length, 'opération')}`;
  $('#lastSavedPreview').textContent = formatDateTime(state.meta.lastSavedAt);
  $('#lastModifiedPreview').textContent = formatDateTime(state.meta.lastModifiedAt);
  $('#operationCountPreview').textContent = String(countOperations);
  $('#dataCategoryCountPreview').textContent = String(countCategories);
  $('#lastExportPreview').textContent = state.meta.lastExportAt ? formatDateTime(state.meta.lastExportAt) : 'Aucune sauvegarde exportée';
  $('#versionPreview').textContent = `Version ${VERSION}`;

  $('#privacySwitch').checked = state.settings.privacy;
  $('#centsSwitch').checked = state.settings.showCents;
  $('#currencySelect').value = state.settings.currency;
  $('#numberLocaleSelect').value = state.settings.numberLocale;
  $('#forecastSwitch').checked = state.settings.includePlannedForecast;
  $('#motionSwitch').checked = state.settings.reduceMotion;

  const reminder = $('#backupReminder');
  const exportAge = state.meta.lastExportAt ? (Date.now() - new Date(state.meta.lastExportAt).getTime()) / 86400000 : Infinity;
  reminder.hidden = exportAge <= 30;
  reminder.innerHTML = '<strong>Sauvegarde recommandée</strong><small>La dernière sauvegarde date de plus de 30 jours.</small>';

  if (latestSnapshot) {
    const text = formatDateTime(latestSnapshot.createdAt);
    $('#localCopyPreview').textContent = `Créée ${text.toLowerCase()}`;
    $('#restoreLocalPreview').textContent = `Créée ${text.toLowerCase()}`;
    $('#restoreLocalBtn').disabled = false;
  } else {
    $('#localCopyPreview').textContent = 'Aucune copie locale disponible';
    $('#restoreLocalPreview').textContent = 'Aucune copie locale disponible';
    $('#restoreLocalBtn').disabled = true;
  }

  const mode = await BudgetStorage.storageMode().catch(() => ({ indexedDB: false, localStorage: true }));
  $('#storageModePreview').textContent = mode.indexedDB ? 'IndexedDB et copie locale' : 'Copie locale du navigateur';

  const online = navigator.onLine;
  $('#dataCurrentState').textContent = saveStatus === 'error' ? 'Échec de l’enregistrement' : saveStatus === 'saving' ? 'Enregistrement en cours' : online ? 'Données enregistrées' : 'Fonctionnement hors ligne';
  $('#dataCurrentDetail').textContent = saveStatus === 'error' ? 'Touchez un état des données pour réessayer' : online ? 'Stockage local actif sur cet appareil' : 'Les données restent enregistrées sur cet appareil';
}

async function refreshStorageDetails() {
  const [snapshots, estimate] = await Promise.all([
    BudgetStorage.listSnapshots().catch(() => []),
    BudgetStorage.estimate().catch(() => null)
  ]);
  latestSnapshot = snapshots[0] || null;
  if (estimate) {
    const used = Number(estimate.usage || 0);
    $('#storageEstimatePreview').textContent = used < 1024
      ? `${used} octets utilisés`
      : used < 1024 * 1024
        ? `${(used / 1024).toFixed(1).replace('.', ',')} Ko utilisés`
        : `${(used / 1024 / 1024).toFixed(1).replace('.', ',')} Mo utilisés`;
  } else {
    $('#storageEstimatePreview').textContent = 'Stockage local actif';
  }
}

function renderDataStatus() {
  if (!state) return;
  const offline = !navigator.onLine;
  let mode = saveStatus;
  if (offline && saveStatus !== 'error') mode = 'offline';
  const configurations = {
    saved: { icon: 'check', title: 'Données enregistrées', detail: `Dernier enregistrement ${formatDateTime(state.meta.lastSavedAt).toLowerCase()}` },
    saving: { icon: 'spinner', title: 'Enregistrement en cours', detail: 'Enregistrement…' },
    error: { icon: 'warning', title: 'Échec de l’enregistrement', detail: 'Touchez pour réessayer' },
    offline: { icon: 'offline', title: 'Fonctionnement hors ligne', detail: 'Les données restent enregistrées sur cet appareil' }
  };
  const config = configurations[mode];
  $$('[data-status-card]').forEach(card => {
    card.dataset.state = mode;
    card.innerHTML = `<span class="data-status-icon">${icon(config.icon)}</span><span class="data-status-copy"><strong>${config.title}</strong><small>${config.detail}</small></span>`;
    card.onclick = mode === 'error' ? retrySave : null;
    card.style.cursor = mode === 'error' ? 'pointer' : 'default';
  });
}

function emptyState(iconName, title, text, actions = []) {
  const buttons = actions.map(action => `<button type="button" data-empty-action="${esc(action.action)}">${esc(action.label)}</button>`).join('');
  return `<div class="empty-state"><span class="empty-icon">${icon(iconName)}</span><strong>${esc(title)}</strong><p>${esc(text)}</p>${buttons ? `<div class="empty-actions">${buttons}</div>` : ''}</div>`;
}

function typeLabel(type) {
  return type === 'transfer' ? 'Transfert' : type === 'savings' ? 'Épargne' : 'Dépense';
}

function recurrenceLabel(value) {
  return ({ monthly: 'Chaque mois', weekly: 'Chaque semaine', yearly: 'Chaque année' })[value] || 'Chaque mois';
}

function field(name, label, value = '', type = 'text', attributes = '') {
  const numberAttributes = type === 'number' ? 'min="0" step="0.01" inputmode="decimal"' : '';
  return `<div class="form-field"><label for="field-${esc(name)}">${esc(label)}</label><input id="field-${esc(name)}" name="${esc(name)}" type="${esc(type)}" value="${esc(value)}" ${numberAttributes} ${attributes}></div>`;
}

function textareaField(name, label, value = '', placeholder = '') {
  return `<div class="form-field"><label for="field-${esc(name)}">${esc(label)}</label><textarea id="field-${esc(name)}" name="${esc(name)}" placeholder="${esc(placeholder)}">${esc(value)}</textarea></div>`;
}

function selectField(name, label, options, value, attributes = '') {
  const html = options.map(option => {
    const optionValue = typeof option === 'string' ? option : option.value;
    const optionLabel = typeof option === 'string' ? option : option.label;
    return `<option value="${esc(optionValue)}" ${optionValue === value ? 'selected' : ''}>${esc(optionLabel)}</option>`;
  }).join('');
  return `<div class="form-field"><label for="field-${esc(name)}">${esc(label)}</label><select id="field-${esc(name)}" name="${esc(name)}" ${attributes}>${html}</select></div>`;
}

function segmentField(name, options, value) {
  return `<div class="form-segment" style="--segment-count:${options.length}">${options.map(option => `<label><input type="radio" name="${esc(name)}" value="${esc(option.value)}" ${option.value === value ? 'checked' : ''}><span>${esc(option.label)}</span></label>`).join('')}</div>`;
}

function recurringDetails(item = {}) {
  return `<details class="form-details"><summary>Options avancées <span>${icon('chevron')}</span></summary><div class="checkbox-field"><span><strong>Opération récurrente</strong><small>Répétée automatiquement dans l’organisation</small></span><input class="ios-switch" name="recurring" type="checkbox" ${item.recurring ? 'checked' : ''}></div>${selectField('recurrence', 'Récurrence', [
    { value: 'monthly', label: 'Chaque mois' },
    { value: 'weekly', label: 'Chaque semaine' },
    { value: 'yearly', label: 'Chaque année' }
  ], item.recurrence || 'monthly')}${textareaField('note', 'Note', item.note || '', 'Information facultative')}</details>`;
}

function showEditor({ title, subtitle = 'BUDGET', fields, context, submitLabel = 'Enregistrer', deleteLabel = null }) {
  editor = context;
  els.dialogTitle.textContent = title;
  els.dialogSubtitle.textContent = subtitle;
  els.editorFields.innerHTML = fields;
  els.submitDialog.textContent = submitLabel;
  els.deleteArea.innerHTML = deleteLabel ? `<button class="delete-button" id="deleteButton" type="button">${esc(deleteLabel)}</button>` : '';
  if (deleteLabel) $('#deleteButton').onclick = requestDeleteCurrent;
  els.editorDialog.showModal();
  setTimeout(() => els.editorFields.querySelector('input:not([type="radio"]):not([type="checkbox"]), select, textarea')?.focus(), 80);
}

function closeEditor() {
  els.editorDialog.close();
  editor = null;
}

function openUnifiedOperation() {
  const spaces = [
    { value: 'personal', label: state.spaces.personal.name },
    { value: 'shared', label: state.spaces.shared.name }
  ];
  const fields = `
    <div class="field-label" style="margin:0 2px 8px">Type d’opération</div>
    ${segmentField('operationKind', [
      { value: 'expense', label: 'Dépense' },
      { value: 'income', label: 'Revenu' },
      { value: 'transfer', label: 'Transfert' }
    ], 'expense')}
    <div class="form-group" style="margin-top:18px">
      ${field('amount', 'Montant', '', 'number', 'required placeholder="0,00"')}
      ${field('label', 'Libellé', '', 'text', 'required placeholder="Nom de l’opération"')}
      ${field('date', 'Date', localDateKey(), 'date')}
    </div>
    <div class="field-label" style="margin:0 2px 8px">Espace</div>
    ${segmentField('space', spaces, state.activeSpace)}
    <div id="operationCategoryField" class="form-group" style="margin-top:18px"></div>
    ${recurringDetails()}`;
  showEditor({
    title: 'Ajouter une opération',
    subtitle: 'NOUVELLE OPÉRATION',
    fields,
    context: { type: 'operation' },
    submitLabel: 'Ajouter la dépense'
  });
  $$('input[name="operationKind"], input[name="space"]').forEach(input => input.addEventListener('change', updateOperationForm));
  updateOperationForm();
}

function updateOperationForm() {
  const kind = els.editorForm.elements.operationKind?.value || 'expense';
  const spaceKey = els.editorForm.elements.space?.value || state.activeSpace;
  const container = $('#operationCategoryField');
  if (!container) return;
  if (kind === 'income') {
    container.innerHTML = '<div class="form-field"><label>Destination</label><span style="font-size:16px">Sources de revenus</span></div>';
    els.submitDialog.textContent = 'Ajouter le revenu';
    return;
  }
  let categories = state.spaces[spaceKey].envelopes;
  if (kind === 'transfer') categories = categories.filter(item => item.type === 'transfer');
  if (!categories.length) {
    container.innerHTML = `<div class="form-field"><label>Catégorie</label><span style="color:var(--text-secondary);font-size:14px">Une catégorie « ${kind === 'transfer' ? 'Transfert' : 'Dépenses'} » sera créée automatiquement.</span></div>`;
  } else {
    container.innerHTML = selectField('categoryId', 'Catégorie', categories.map(item => ({ value: item.id, label: item.name })), categories[0].id);
  }
  els.submitDialog.textContent = kind === 'transfer' ? 'Ajouter le transfert' : 'Ajouter la dépense';
}

function openIncome(id = null) {
  const source = id ? activeSpace().incomeSources.find(item => item.id === id) : null;
  const fields = `<div class="form-group">${field('label', 'Libellé', source?.label || '', 'text', 'required')}${field('amount', 'Montant', source?.amount ?? '', 'number', 'required')}</div>${recurringDetails(source || { recurring: true })}`;
  showEditor({
    title: source ? 'Modifier le revenu' : 'Nouveau revenu',
    subtitle: activeSpace().name.toUpperCase(),
    fields,
    context: { type: 'income', id },
    submitLabel: source ? 'Enregistrer' : 'Ajouter le revenu',
    deleteLabel: source ? 'Supprimer ce revenu' : null
  });
}

function openCategory(id = null) {
  const item = id ? activeSpace().envelopes.find(value => value.id === id) : null;
  const iconOptions = [
    ['category', 'Général'], ['home', 'Logement'], ['cart', 'Courses'], ['transport', 'Transport'],
    ['dining', 'Repas'], ['health', 'Santé'], ['leisure', 'Loisirs'], ['savings', 'Épargne'], ['transfer', 'Transfert']
  ].map(([value, label]) => ({ value, label }));
  const fields = `<div class="form-group">${field('name', 'Nom', item?.name || '', 'text', 'required')}${field('description', 'Description', item?.description || '')}${field('planned', 'Budget prévu', item?.planned ?? '', 'number', 'placeholder="0,00"')}${selectField('type', 'Nature', [
    { value: 'expense', label: 'Dépense' }, { value: 'savings', label: 'Épargne' }, { value: 'transfer', label: 'Transfert' }
  ], item?.type || 'expense')}${selectField('iconName', 'Icône', iconOptions, item?.iconName || inferCategoryIcon(item || {}))}</div>`;
  showEditor({
    title: item ? 'Modifier la catégorie' : 'Nouvelle catégorie',
    subtitle: activeSpace().name.toUpperCase(),
    fields,
    context: { type: 'category', id },
    submitLabel: item ? 'Enregistrer' : 'Créer la catégorie',
    deleteLabel: item ? 'Supprimer cette catégorie' : null
  });
}

function openExpense(categoryId, id = null) {
  const item = activeSpace().envelopes.find(value => value.id === categoryId);
  const line = id ? item?.expenses.find(value => value.id === id) : null;
  if (!item) return;
  const fields = `<div class="form-group">${field('amount', 'Montant', line?.amount ?? '', 'number', 'required')}${field('label', 'Libellé', line?.label || '', 'text', 'required')}${field('date', 'Date', line?.date || localDateKey(), 'date')}</div>${recurringDetails(line || {})}`;
  showEditor({
    title: line ? 'Modifier la dépense' : 'Nouvelle dépense',
    subtitle: item.name.toUpperCase(),
    fields,
    context: { type: 'expense', categoryId, id },
    submitLabel: line ? 'Enregistrer' : 'Ajouter la dépense',
    deleteLabel: line ? 'Supprimer cette dépense' : null
  });
}

function openFuture(id = null, presetKind = 'payment') {
  const item = id ? state.forecast.items.find(value => value.id === id) : null;
  const kind = item?.kind || presetKind;
  const fields = `
    <div class="field-label" style="margin:0 2px 8px">Type de mouvement</div>
    ${segmentField('kind', [{ value: 'payment', label: 'Dépense' }, { value: 'receipt', label: 'Rentrée' }], kind)}
    <div class="form-group" style="margin-top:18px">${field('amount', 'Montant', item?.amount ?? '', 'number', 'required')}${field('label', 'Libellé', item?.label || '', 'text', 'required')}${field('date', 'Date prévue', item?.date || '', 'date')}${selectField('space', 'Espace', [
      { value: 'personal', label: state.spaces.personal.name }, { value: 'shared', label: state.spaces.shared.name }
    ], item?.space || state.activeSpace)}${selectField('status', 'État', [
      { value: 'planned', label: 'Prévu' }, { value: 'confirmed', label: 'Confirmé' }, { value: 'done', label: 'Terminé' }
    ], item?.status || 'planned')}</div>${recurringDetails(item || {})}`;
  showEditor({
    title: item ? 'Modifier la prévision' : 'Nouvelle prévision',
    subtitle: 'ÉPARGNE DE PRÉCAUTION',
    fields,
    context: { type: 'future', id },
    submitLabel: item ? 'Enregistrer' : kind === 'receipt' ? 'Ajouter la rentrée' : 'Ajouter la dépense',
    deleteLabel: item ? 'Supprimer cette prévision' : null
  });
  els.editorForm.querySelectorAll('input[name="kind"]').forEach(input => input.addEventListener('change', () => {
    els.submitDialog.textContent = input.checked && input.value === 'receipt' ? 'Ajouter la rentrée' : 'Ajouter la dépense';
  }));
}

function openBuffer() {
  const fields = `<p class="form-help">Le solde actuel est la somme réellement disponible dans votre épargne de précaution. L’objectif permanent est le niveau que vous souhaitez maintenir.</p><div class="form-group">${field('current', 'Solde actuel de la réserve', state.forecast.buffer.current, 'number', 'required')}${field('target', 'Objectif permanent', state.forecast.buffer.target, 'number', 'required')}</div>`;
  showEditor({ title: 'Épargne de précaution', subtitle: 'RÉSERVE', fields, context: { type: 'buffer' }, submitLabel: 'Enregistrer' });
}

function openPeriodSettings() {
  const fields = `<p class="form-help">La version actuelle organise les données par période mensuelle. Le jour de début peut être personnalisé séparément.</p><div class="form-group">${selectField('periodType', 'Type de période', [{ value: 'monthly', label: 'Mensuelle' }], 'monthly')}</div>`;
  showEditor({ title: 'Période budgétaire', subtitle: 'BUDGET', fields, context: { type: 'period' }, submitLabel: 'Terminé' });
}

function openPeriodStart() {
  const options = Array.from({ length: 28 }, (_, index) => ({ value: String(index + 1), label: index === 0 ? '1 — Premier jour du mois' : String(index + 1) }));
  const fields = `<p class="form-help">La période commence à cette date chaque mois et se termine la veille du même jour le mois suivant.</p><div class="form-group">${selectField('periodStartDay', 'Jour de début', options, String(state.settings.periodStartDay))}</div>`;
  showEditor({ title: 'Début de période', subtitle: 'BUDGET', fields, context: { type: 'period-start' }, submitLabel: 'Enregistrer' });
}

function openSpaces() {
  const fields = `<div class="form-group">${field('personalName', 'Espace personnel', state.spaces.personal.name, 'text', 'required')}${field('sharedName', 'Espace commun', state.spaces.shared.name, 'text', 'required')}</div>`;
  showEditor({ title: 'Espaces budgétaires', subtitle: 'BUDGET', fields, context: { type: 'spaces' }, submitLabel: 'Enregistrer' });
}

function formData() {
  const data = Object.fromEntries(new FormData(els.editorForm));
  data.recurring = els.editorForm.elements.recurring?.checked || false;
  return data;
}

async function submitEditor(event) {
  event.preventDefault();
  if (!editor) return;
  const data = formData();

  if (editor.type === 'operation') {
    const spaceKey = data.space || state.activeSpace;
    const space = state.spaces[spaceKey];
    const kind = data.operationKind;
    if (kind === 'income') {
      space.incomeSources.push(incomeSource(data.label, data.amount, {
        date: data.date || '', recurring: data.recurring, recurrence: data.recurrence, note: data.note || ''
      }));
    } else {
      let item = data.categoryId ? space.envelopes.find(value => value.id === data.categoryId) : null;
      if (!item) {
        item = category(kind === 'transfer' ? 'Transferts' : 'Dépenses', '', kind === 'transfer' ? 'transfer' : 'expense');
        space.envelopes.push(item);
      }
      item.expenses.push(expenseLine(data.label, data.amount, {
        date: data.date || '', recurring: data.recurring, recurrence: data.recurrence, note: data.note || ''
      }));
    }
    state.activeSpace = spaceKey;
    pushHistory('operation-add', data.label);
    showToast('Opération ajoutée');
  }

  if (editor.type === 'income') {
    const source = editor.id ? activeSpace().incomeSources.find(item => item.id === editor.id) : null;
    const value = {
      label: data.label,
      amount: Number(data.amount || 0),
      recurring: data.recurring,
      recurrence: data.recurrence || 'monthly',
      note: data.note || ''
    };
    if (source) Object.assign(source, value);
    else activeSpace().incomeSources.push(incomeSource(value.label, value.amount, value));
    pushHistory(source ? 'income-edit' : 'income-add', value.label);
    showToast(source ? 'Revenu enregistré' : 'Revenu ajouté');
  }

  if (editor.type === 'category') {
    const item = editor.id ? activeSpace().envelopes.find(value => value.id === editor.id) : null;
    const value = {
      name: data.name,
      description: data.description || '',
      planned: Number(data.planned || 0),
      type: data.type,
      iconName: data.iconName,
      color: '#FF9F0A'
    };
    if (item) Object.assign(item, value);
    else activeSpace().envelopes.push(category(value.name, value.description, value.type, value));
    pushHistory(item ? 'category-edit' : 'category-add', value.name);
    showToast(item ? 'Catégorie enregistrée' : 'Catégorie créée');
  }

  if (editor.type === 'expense') {
    const item = activeSpace().envelopes.find(value => value.id === editor.categoryId);
    const line = editor.id ? item?.expenses.find(value => value.id === editor.id) : null;
    const value = {
      label: data.label,
      amount: Number(data.amount || 0),
      date: data.date || '',
      recurring: data.recurring,
      recurrence: data.recurrence || 'monthly',
      note: data.note || ''
    };
    if (line) Object.assign(line, value);
    else item.expenses.push(expenseLine(value.label, value.amount, value));
    pushHistory(line ? 'expense-edit' : 'expense-add', value.label);
    showToast(line ? 'Dépense enregistrée' : 'Dépense ajoutée');
  }

  if (editor.type === 'future') {
    const item = editor.id ? state.forecast.items.find(value => value.id === editor.id) : null;
    const value = {
      kind: data.kind === 'receipt' ? 'receipt' : 'payment',
      label: data.label,
      amount: Number(data.amount || 0),
      date: data.date || '',
      space: data.space || state.activeSpace,
      status: data.status || 'planned',
      recurring: data.recurring,
      recurrence: data.recurrence || 'monthly',
      note: data.note || '',
      source: item?.source || 'current'
    };
    if (item) Object.assign(item, value);
    else state.forecast.items.push(forecastItem(value.kind, value.label, value.amount, value));
    pushHistory(item ? 'forecast-edit' : 'forecast-add', value.label);
    showToast(item ? 'Prévision enregistrée' : 'Prévision ajoutée');
  }

  if (editor.type === 'buffer') {
    state.forecast.buffer.current = Number(data.current || 0);
    state.forecast.buffer.target = Number(data.target || 0);
    state.forecast.buffer.configured = true;
    pushHistory('forecast-buffer', 'Épargne de précaution');
    showToast('Épargne de précaution mise à jour');
  }

  if (editor.type === 'period') {
    state.settings.periodType = 'monthly';
  }

  if (editor.type === 'period-start') {
    state.settings.periodStartDay = Math.min(28, Math.max(1, Number(data.periodStartDay || 1)));
    pushHistory('settings-period', `Début le ${state.settings.periodStartDay}`);
    showToast('Période mise à jour');
  }

  if (editor.type === 'spaces') {
    state.spaces.personal.name = data.personalName.trim() || 'Personnel';
    state.spaces.shared.name = data.sharedName.trim() || 'Commun';
    pushHistory('settings-spaces', 'Espaces renommés');
    showToast('Espaces enregistrés');
  }

  closeEditor();
  commit();
  render();
}

async function requestDeleteCurrent() {
  if (!editor) return;
  let title = 'Supprimer cet élément ?';
  let message = 'Cette action supprimera définitivement cet élément du budget.';
  if (editor.type === 'category') {
    const item = activeSpace().envelopes.find(value => value.id === editor.id);
    if (item?.expenses.length) message = `Cette catégorie contient encore ${plural(item.expenses.length, 'opération')}. Elles seront également supprimées.`;
  }
  const confirmed = await showConfirm({ title, message, confirmLabel: 'Supprimer', danger: true });
  if (!confirmed) return;
  removeCurrent();
}

function removeCurrent() {
  if (editor.type === 'income') activeSpace().incomeSources = activeSpace().incomeSources.filter(item => item.id !== editor.id);
  if (editor.type === 'category') activeSpace().envelopes = activeSpace().envelopes.filter(item => item.id !== editor.id);
  if (editor.type === 'expense') {
    const item = activeSpace().envelopes.find(value => value.id === editor.categoryId);
    if (item) item.expenses = item.expenses.filter(value => value.id !== editor.id);
  }
  if (editor.type === 'future') state.forecast.items = state.forecast.items.filter(item => item.id !== editor.id);
  pushHistory('delete', editor.type);
  closeEditor();
  commit();
  render();
  showToast('Élément supprimé');
}

function showConfirm({ title, message, confirmLabel = 'Confirmer', cancelLabel = 'Annuler', danger = false, iconName = null }) {
  if (els.alertDialog.open) els.alertDialog.close();
  els.alertTitle.textContent = title;
  els.alertMessage.textContent = message;
  els.alertConfirm.textContent = confirmLabel;
  els.alertCancel.textContent = cancelLabel;
  els.alertConfirm.classList.toggle('danger', danger);
  els.alertIcon.classList.toggle('danger', danger);
  els.alertIcon.innerHTML = icon(iconName || (danger ? 'warning' : 'info'));
  els.alertCancel.hidden = false;
  els.alertDialog.showModal();
  return new Promise(resolve => { alertResolver = resolve; });
}

function showMessage({ title, message, buttonLabel = 'OK', danger = false }) {
  if (els.alertDialog.open) els.alertDialog.close();
  els.alertTitle.textContent = title;
  els.alertMessage.textContent = message;
  els.alertConfirm.textContent = buttonLabel;
  els.alertConfirm.classList.toggle('danger', danger);
  els.alertCancel.hidden = true;
  els.alertIcon.classList.toggle('danger', danger);
  els.alertIcon.innerHTML = icon(danger ? 'warning' : 'check');
  els.alertDialog.showModal();
  return new Promise(resolve => { alertResolver = resolve; });
}

function resolveAlert(value) {
  if (els.alertDialog.open) els.alertDialog.close();
  alertResolver?.(value);
  alertResolver = null;
  els.alertCancel.hidden = false;
}

function showToast(message) {
  clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.add('show');
  toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2500);
}

function exportPayload() {
  const data = clone(state);
  delete data.settings;
  return {
    suite: 'Applications personnelles',
    app: APP_NAME,
    schemaVersion: SCHEMA_VERSION,
    appVersion: VERSION,
    exportedAt: new Date().toISOString(),
    data,
    settings: clone(state.settings)
  };
}

function exportFilename(date = new Date()) {
  const day = localDateKey(date);
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `Budget_${day}_${hour}-${minute}.json`;
}

async function exportBackup() {
  await flushSave();
  const payload = exportPayload();
  const filename = exportFilename();
  const file = new File([JSON.stringify(payload, null, 2)], filename, { type: 'application/json' });
  let shared = false;
  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Sauvegarde Budget', text: 'Sauvegarde complète de l’application Budget' });
      shared = true;
    }
  } catch (error) {
    if (error?.name === 'AbortError') return;
  }
  if (!shared) {
    const url = URL.createObjectURL(file);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  state.meta.lastExportAt = payload.exportedAt;
  state.meta.lastExportFilename = filename;
  pushHistory('backup-export', filename);
  commit({ modified: false });
  renderSettings();
  showToast('Sauvegarde exportée');
}

function validateBackup(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('damaged');
  if (raw.app && !LEGACY_APP_IDS.has(raw.app)) throw new Error('wrong-app');
  if (raw.schemaVersion && Number(raw.schemaVersion) > SCHEMA_VERSION) throw new Error('schema');
  const normalized = normalize(raw);
  if (!normalized) throw new Error('damaged');
  return {
    state: normalized,
    exportedAt: raw.exportedAt || normalized.meta?.lastExportAt || null,
    appVersion: raw.appVersion || raw.version || normalized.version || 'Version antérieure',
    schemaVersion: Number(raw.schemaVersion || 0),
    operationCount: operationCount(normalized),
    categoryCount: categoryCount(normalized),
    spaces: [normalized.spaces.personal.name, normalized.spaces.shared.name]
  };
}

async function previewImport(file) {
  try {
    const text = await file.text();
    let raw;
    try { raw = JSON.parse(text); } catch { throw new Error('damaged'); }
    pendingImport = validateBackup(raw);
    const summary = pendingImport;
    els.importSummary.innerHTML = [
      ['Date d’export', summary.exportedAt ? formatDateTime(summary.exportedAt) : 'Date non disponible'],
      ['Version de l’application', String(summary.appVersion)],
      ['Opérations', String(summary.operationCount)],
      ['Catégories', String(summary.categoryCount)],
      ['Espaces détectés', summary.spaces.join(' · ')]
    ].map(([label, value]) => `<div class="import-summary-row"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('');
    els.importDialog.showModal();
  } catch (error) {
    const messages = {
      'wrong-app': ['Fichier incompatible', 'Ce fichier ne correspond pas à l’application Budget.'],
      schema: ['Version incompatible', 'Cette sauvegarde utilise une version incompatible.'],
      damaged: ['Fichier illisible', 'Le fichier semble endommagé ou incomplet.']
    };
    const [title, message] = messages[error.message] || messages.damaged;
    await showMessage({ title, message, danger: true });
  }
}

async function confirmImport() {
  if (!pendingImport) return;
  try {
    await BudgetStorage.createSnapshot(clone(state), 'before-import');
    state = pendingImport.state;
    state.meta.lastModifiedAt = new Date().toISOString();
    state.meta.revision = Number(state.meta.revision || 0) + 1;
    state.activeTab = 'future';
    pendingImport = null;
    els.importDialog.close();
    await persistState({ snapshot: false, reason: 'import' });
    await refreshStorageDetails();
    render();
    showToast('Données importées');
  } catch (error) {
    console.error(error);
    await showMessage({ title: 'Importation incomplète', message: 'Certaines données n’ont pas pu être restaurées.', danger: true });
  }
}

async function restoreLocalCopy() {
  const snapshots = await BudgetStorage.listSnapshots().catch(() => []);
  const snapshot = snapshots[0];
  if (!snapshot) {
    await showMessage({ title: 'Aucune copie disponible', message: 'Aucune copie locale disponible.' });
    return;
  }
  const confirmed = await showConfirm({
    title: 'Restaurer la copie locale ?',
    message: `La copie créée ${formatDateTime(snapshot.createdAt).toLowerCase()} remplacera les données actuelles. Une copie de sécurité des données présentes sera créée.`,
    confirmLabel: 'Restaurer'
  });
  if (!confirmed) return;
  try {
    await BudgetStorage.createSnapshot(clone(state), 'before-restore');
    state = normalize(snapshot.state) || state;
    state.meta.lastModifiedAt = new Date().toISOString();
    state.activeTab = 'future';
    await persistState({ snapshot: false, reason: 'restore' });
    await refreshStorageDetails();
    render();
    showToast('Copie locale restaurée');
  } catch (error) {
    console.error(error);
    await showMessage({ title: 'Restauration impossible', message: 'La copie locale n’a pas pu être restaurée.', danger: true });
  }
}

async function resetBudget() {
  const first = await showConfirm({
    title: 'Réinitialiser le budget ?',
    message: 'Toutes les données courantes seront supprimées. Une copie locale de sécurité sera créée avant la réinitialisation.',
    confirmLabel: 'Continuer',
    danger: true
  });
  if (!first) return;
  const second = await showConfirm({
    title: 'Confirmer la suppression',
    message: 'Cette action efface les revenus, dépenses, catégories, prévisions de l’épargne de précaution et préférences actuelles.',
    confirmLabel: 'Tout supprimer',
    danger: true
  });
  if (!second) return;
  try {
    await BudgetStorage.createSnapshot(clone(state), 'before-reset');
    await BudgetStorage.clear({ keepSnapshots: true });
    state = seed();
    state.meta.lastModifiedAt = new Date().toISOString();
    await persistState({ snapshot: false, reason: 'reset' });
    await refreshStorageDetails();
    render();
    showToast('Budget réinitialisé');
  } catch (error) {
    console.error(error);
    await showMessage({ title: 'Réinitialisation impossible', message: 'Les données n’ont pas été supprimées.', danger: true });
  }
}

function navigate(tab) {
  if (!['budget', 'future', 'settings'].includes(tab)) return;
  state.activeTab = tab;
  openCategoryId = null;
  commit({ modified: false });
  render();
  window.scrollTo({ top: 0, behavior: state.settings.reduceMotion ? 'auto' : 'smooth' });
}

function applyMotionPreference() {
  document.body.classList.toggle('reduce-motion', Boolean(state?.settings.reduceMotion));
}

function changeSetting(key, value) {
  state.settings[key] = value;
  if (key === 'reduceMotion') applyMotionPreference();
  pushHistory('settings', key);
  commit();
  render();
}

function handleSettingsAction(action) {
  if (action === 'period') openPeriodSettings();
  if (action === 'period-start') openPeriodStart();
  if (action === 'categories') navigate('budget');
  if (action === 'spaces') openSpaces();
  if (action === 'recurring-income') {
    navigate('budget');
    showToast('Les revenus récurrents sont indiqués dans la liste des revenus');
  }
  if (action === 'recurring-expense') {
    navigate('budget');
    showToast('Les dépenses récurrentes sont indiquées dans les catégories');
  }
  if (action === 'forecasts') navigate('future');
  if (action === 'export') exportBackup();
  if (action === 'restore') restoreLocalCopy();
  if (action === 'reset') resetBudget();
}

function handleEmptyAction(action) {
  if (action === 'add-category') {
    if (state.activeTab !== 'budget') navigate('budget');
    openCategory();
  }
  if (action === 'add-income') openIncome();
  if (action === 'add-future') openFuture();
  if (action === 'add-future-payment') openFuture(null, 'payment');
  if (action === 'add-future-receipt') openFuture(null, 'receipt');
}

function bindEvents() {
  $$('.tab').forEach(tab => tab.addEventListener('click', () => navigate(tab.dataset.tab)));
  $$('[data-nav]').forEach(button => button.addEventListener('click', () => navigate(button.dataset.nav)));
  $('#spaceSegment').addEventListener('click', event => {
    const button = event.target.closest('[data-space]');
    if (!button) return;
    state.activeSpace = button.dataset.space;
    openCategoryId = null;
    commit({ modified: false });
    render();
  });

  els.privacy.addEventListener('click', () => changeSetting('privacy', !state.settings.privacy));
  els.quickAdd.addEventListener('click', () => state.activeTab === 'future' ? openFuture() : openUnifiedOperation());
  $('#addIncomeBtn').addEventListener('click', () => openIncome());
  $('#addCategoryBtn').addEventListener('click', () => openCategory());
  $('#addFutureBtn').addEventListener('click', () => openFuture());
  $('#editBufferBtn').addEventListener('click', openBuffer);

  document.addEventListener('click', event => {
    const emptyButton = event.target.closest('[data-empty-action]');
    if (emptyButton) handleEmptyAction(emptyButton.dataset.emptyAction);
    const settingsButton = event.target.closest('[data-action]');
    if (settingsButton && !settingsButton.disabled) handleSettingsAction(settingsButton.dataset.action);
  });

  els.editorForm.addEventListener('submit', submitEditor);
  $('#closeDialogBtn').addEventListener('click', closeEditor);
  $('#cancelDialogBtn').addEventListener('click', closeEditor);
  els.editorDialog.addEventListener('click', event => {
    if (event.target === els.editorDialog) closeEditor();
  });

  $('#importInput').addEventListener('change', event => {
    const file = event.target.files?.[0];
    if (file) previewImport(file);
    event.target.value = '';
  });
  $('#closeImportBtn').addEventListener('click', () => { els.importDialog.close(); pendingImport = null; });
  $('#cancelImportBtn').addEventListener('click', () => { els.importDialog.close(); pendingImport = null; });
  $('#confirmImportBtn').addEventListener('click', confirmImport);

  els.alertCancel.addEventListener('click', () => resolveAlert(false));
  els.alertConfirm.addEventListener('click', () => resolveAlert(true));
  els.alertDialog.addEventListener('cancel', event => { event.preventDefault(); resolveAlert(false); });

  $('#toggleCompletedBtn').addEventListener('click', () => {
    const completed = $('#completedTimeline');
    completed.hidden = !completed.hidden;
    renderTimeline();
  });

  $('#privacySwitch').addEventListener('change', event => changeSetting('privacy', event.target.checked));
  $('#centsSwitch').addEventListener('change', event => changeSetting('showCents', event.target.checked));
  $('#currencySelect').addEventListener('change', event => changeSetting('currency', event.target.value));
  $('#numberLocaleSelect').addEventListener('change', event => changeSetting('numberLocale', event.target.value));
  $('#forecastSwitch').addEventListener('change', event => changeSetting('includePlannedForecast', event.target.checked));
  $('#motionSwitch').addEventListener('change', event => changeSetting('reduceMotion', event.target.checked));

  window.addEventListener('online', () => { renderDataStatus(); renderSettings(); });
  window.addEventListener('offline', () => { renderDataStatus(); renderSettings(); });
  window.addEventListener('pagehide', flushSave);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushSave(); });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(console.warn));
}

load().catch(async error => {
  console.error(error);
  state = seed();
  applyStaticIcons();
  bindEvents();
  render();
  await showMessage({ title: 'Chargement incomplet', message: 'Les données n’ont pas pu être chargées. Une nouvelle session locale a été ouverte.', danger: true });
});
