'use strict';

const STORAGE_KEY = 'mes-habitudes-v1';
const DAY_MS = 86400000;
const importedCompletionDates = [
  '2026-07-11','2026-07-12','2026-07-13','2026-07-14','2026-07-15',
  '2026-07-17','2026-07-18','2026-07-19','2026-07-20',
  '2026-07-22','2026-07-23','2026-07-24'
];

const seedState = () => ({
  version: 1,
  habits: [
    { id:'HAB-001', name:'Jeûne intermittent', icon:'⏱️', category:'Santé', frequency:'daily', weekdays:[0,1,2,3,4,5,6], goal:1, unit:'validation', startDate:'2026-07-01', endDate:'2026-07-31', active:true, archivedAt:null, order:1 },
    { id:'HAB-002', name:'Lecture', icon:'📚', category:'Développement', frequency:'daily', weekdays:[0,1,2,3,4,5,6], goal:1, unit:'validation', startDate:'2026-07-01', endDate:'', active:true, archivedAt:null, order:2 },
    { id:'HAB-003', name:'Hydratation', icon:'💧', category:'Santé', frequency:'daily', weekdays:[0,1,2,3,4,5,6], goal:1, unit:'validation', startDate:'2026-07-01', endDate:'', active:true, archivedAt:null, order:3 },
    { id:'HAB-004', name:'Sport', icon:'🏃', category:'Forme', frequency:'daily', weekdays:[0,1,2,3,4,5,6], goal:1, unit:'validation', startDate:'2026-08-01', endDate:'', active:true, archivedAt:null, order:4 }
  ],
  entries: Object.fromEntries(importedCompletionDates.map(date => [`${date}::HAB-001`, { value:1, updatedAt:new Date().toISOString() }])),
  createdAt: new Date().toISOString()
});

let state = loadState();
let selectedDate = todayISO();
let historyMonth = selectedDate.slice(0,7);
let currentView = 'today';
let deferredInstallPrompt = null;
let toastTimer = null;

const el = id => document.getElementById(id);
const navButtons = [...document.querySelectorAll('.nav-button')];

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedState();
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.habits) || typeof parsed.entries !== 'object') throw new Error('Format invalide');
    return parsed;
  } catch (error) {
    console.warn('Impossible de charger les données locales.', error);
    return seedState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function todayISO() {
  const now = new Date();
  return toISODate(now);
}

function parseISO(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function shiftDate(value, amount) {
  const date = parseISO(value);
  date.setDate(date.getDate() + amount);
  return toISODate(date);
}

function shiftMonth(value, amount) {
  const [year, month] = value.split('-').map(Number);
  const date = new Date(year, month - 1 + amount, 1, 12);
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
}

function formatDate(value, options) {
  return new Intl.DateTimeFormat('fr-FR', options).format(parseISO(value));
}

function isScheduled(habit, dateISO) {
  if (dateISO < habit.startDate) return false;
  if (habit.endDate && dateISO > habit.endDate) return false;
  if (habit.archivedAt && dateISO > habit.archivedAt) return false;
  if (!habit.active && !habit.archivedAt) return false;
  if (habit.frequency === 'weekdays') return habit.weekdays.includes(parseISO(dateISO).getDay());
  return true;
}

function scheduledHabits(dateISO) {
  return state.habits
    .filter(habit => isScheduled(habit, dateISO))
    .sort((a,b) => (a.order ?? 999) - (b.order ?? 999) || a.name.localeCompare(b.name, 'fr'));
}

function entryKey(dateISO, habitId) { return `${dateISO}::${habitId}`; }
function getValue(dateISO, habitId) { return Number(state.entries[entryKey(dateISO, habitId)]?.value || 0); }
function isComplete(dateISO, habit) { return getValue(dateISO, habit.id) >= Number(habit.goal); }

function setValue(dateISO, habit, value) {
  const safe = Math.max(0, Math.round(Number(value) * 10) / 10);
  const key = entryKey(dateISO, habit.id);
  if (safe === 0) delete state.entries[key];
  else state.entries[key] = { value:safe, updatedAt:new Date().toISOString() };
  saveState();
  renderAll();
}

function daySummary(dateISO) {
  const habits = scheduledHabits(dateISO);
  const completed = habits.filter(habit => isComplete(dateISO, habit)).length;
  return { total:habits.length, completed, percent:habits.length ? Math.round(completed / habits.length * 100) : 0 };
}

function renderToday() {
  const date = parseISO(selectedDate);
  el('todayHeading').textContent = selectedDate === todayISO() ? 'Aujourd’hui' : formatDate(selectedDate, { weekday:'long' });
  el('todayDate').textContent = new Intl.DateTimeFormat('fr-FR', { day:'numeric', month:'long', year:'numeric' }).format(date);

  const habits = scheduledHabits(selectedDate);
  const summary = daySummary(selectedDate);
  el('dailyProgressLabel').textContent = `${summary.completed} sur ${summary.total} ${summary.total > 1 ? 'habitudes' : 'habitude'}`;
  el('dailyProgressPercent').textContent = `${summary.percent} %`;
  el('dailyProgressBar').style.width = `${summary.percent}%`;

  const container = el('todayHabits');
  if (!habits.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">🌱</div><strong>Aucune habitude prévue</strong><p>Ajoutez une habitude ou consultez une autre date.</p></div>`;
    return;
  }

  container.innerHTML = habits.map(habit => {
    const value = getValue(selectedDate, habit.id);
    const complete = value >= habit.goal;
    const quantitative = habit.unit !== 'validation' || Number(habit.goal) !== 1;
    const control = quantitative
      ? `<div class="quantity-control" aria-label="Progression de ${escapeHTML(habit.name)}"><button type="button" data-action="decrease" data-id="${habit.id}" aria-label="Diminuer">−</button><span>${formatNumber(value)}</span><button type="button" data-action="increase" data-id="${habit.id}" aria-label="Augmenter">+</button></div>`
      : `<button class="check-button" type="button" data-action="toggle" data-id="${habit.id}" aria-label="${complete ? 'Décocher' : 'Valider'} ${escapeHTML(habit.name)}">✓</button>`;
    return `<article class="habit-card ${complete ? 'complete' : ''}">
      <div class="habit-icon">${escapeHTML(habit.icon || '⭐')}</div>
      <div class="habit-copy"><strong>${escapeHTML(habit.name)}</strong><small>${quantitative ? `${formatNumber(value)} / ${formatNumber(habit.goal)} ${escapeHTML(habit.unit)}` : escapeHTML(habit.category || 'Habitude')}</small></div>
      ${control}
    </article>`;
  }).join('');
}

function renderHistory() {
  const [year, month] = historyMonth.split('-').map(Number);
  el('monthLabel').textContent = new Intl.DateTimeFormat('fr-FR', { month:'long', year:'numeric' }).format(new Date(year, month-1, 1, 12));
  const first = new Date(year, month-1, 1, 12);
  const days = new Date(year, month, 0, 12).getDate();
  const mondayIndex = (first.getDay() + 6) % 7;
  const cells = [];
  for (let i=0; i<mondayIndex; i++) cells.push('<div class="calendar-day outside"></div>');
  for (let day=1; day<=days; day++) {
    const dateISO = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const summary = daySummary(dateISO);
    const status = summary.total === 0 ? '' : summary.completed === 0 ? 'none' : summary.completed === summary.total ? 'complete' : 'partial';
    cells.push(`<button type="button" class="calendar-day ${status} ${dateISO === todayISO() ? 'today' : ''}" data-date="${dateISO}">
      <span class="day-number">${day}</span><span class="day-score">${summary.total ? `${summary.completed}/${summary.total}` : ''}</span>
    </button>`);
  }
  el('calendarGrid').innerHTML = cells.join('');
}

function getStatsRange() {
  const period = el('statsPeriod').value;
  const today = todayISO();
  if (period === '30' || period === '90') return { start:shiftDate(today, -(Number(period)-1)), end:today };
  if (period === 'all') {
    const starts = state.habits.map(h => h.startDate).filter(Boolean).sort();
    return { start:starts[0] || today, end:today };
  }
  return { start:`${today.slice(0,7)}-01`, end:today };
}

function enumerateDates(startISO, endISO) {
  const dates = [];
  let cursor = startISO;
  let guard = 0;
  while (cursor <= endISO && guard < 5000) { dates.push(cursor); cursor = shiftDate(cursor, 1); guard++; }
  return dates;
}

function calculateFullDayStreaks(endISO) {
  const starts = state.habits.map(h => h.startDate).filter(Boolean).sort();
  const startISO = starts[0] || endISO;
  const dates = enumerateDates(startISO, endISO);
  let best = 0, running = 0;
  dates.forEach(date => {
    const s = daySummary(date);
    if (s.total > 0 && s.completed === s.total) { running++; best = Math.max(best, running); }
    else running = 0;
  });
  let current = 0;
  for (let i=dates.length-1; i>=0; i--) {
    const s = daySummary(dates[i]);
    if (s.total > 0 && s.completed === s.total) current++;
    else break;
  }
  return { current, best };
}

function renderStats() {
  const { start, end } = getStatsRange();
  const dates = enumerateDates(start, end);
  let opportunities = 0, completions = 0, fullDays = 0;
  dates.forEach(date => {
    const summary = daySummary(date);
    opportunities += summary.total;
    completions += summary.completed;
    if (summary.total > 0 && summary.completed === summary.total) fullDays++;
  });
  const rate = opportunities ? Math.round(completions / opportunities * 100) : 0;
  const streaks = calculateFullDayStreaks(todayISO());
  const cards = [
    ['Progression', `${rate} %`],
    ['Validations', String(completions)],
    ['Jours complets', String(fullDays)],
    ['Série actuelle', `${streaks.current} j`]
  ];
  el('statsCards').innerHTML = cards.map(([label,value]) => `<article class="stat-card"><small>${label}</small><strong>${value}</strong></article>`).join('');

  const relevantHabits = state.habits.filter(h => h.startDate <= end && (!h.endDate || h.endDate >= start));
  el('habitStats').innerHTML = relevantHabits.length ? relevantHabits.map(habit => {
    let total=0, done=0;
    dates.forEach(date => { if (isScheduled(habit,date)) { total++; if (isComplete(date,habit)) done++; } });
    const percent = total ? Math.round(done/total*100) : 0;
    return `<div class="habit-stat-row"><span class="mini-icon">${escapeHTML(habit.icon || '⭐')}</span><div class="habit-stat-copy"><strong>${escapeHTML(habit.name)}</strong><small>${done} sur ${total}</small><div class="mini-progress"><i style="width:${percent}%"></i></div></div><span class="habit-stat-percent">${percent}%</span></div>`;
  }).join('') : '<p class="empty-state">Aucune donnée pour cette période.</p>';
}

function renderManageHabits() {
  const habits = [...state.habits].sort((a,b) => (a.active === b.active ? 0 : a.active ? -1 : 1) || (a.order ?? 999)-(b.order ?? 999));
  el('manageHabits').innerHTML = habits.map(habit => {
    const frequency = habit.frequency === 'daily' ? 'Tous les jours' : `${habit.weekdays.length} jour(s) par semaine`;
    const status = habit.active ? frequency : 'Archivée';
    return `<article class="manage-card ${habit.active ? '' : 'archived'}"><div class="habit-icon">${escapeHTML(habit.icon || '⭐')}</div><div><strong>${escapeHTML(habit.name)}</strong><small>${escapeHTML(status)} · objectif ${formatNumber(habit.goal)} ${escapeHTML(habit.unit)}</small></div><div class="manage-actions"><button type="button" data-edit="${habit.id}" aria-label="Modifier ${escapeHTML(habit.name)}">✎</button></div></article>`;
  }).join('');
}

function renderAll() {
  renderToday();
  renderHistory();
  renderStats();
  renderManageHabits();
}

function showView(name) {
  currentView = name;
  document.querySelectorAll('.view').forEach(view => view.classList.toggle('active', view.id === `view-${name}`));
  navButtons.forEach(button => button.classList.toggle('active', button.dataset.view === name));
  if (name === 'history') historyMonth = selectedDate.slice(0,7);
  renderAll();
  window.scrollTo({ top:0, behavior:'smooth' });
}

function openHabitDialog(habitId=null) {
  const dialog = el('habitDialog');
  const habit = habitId ? state.habits.find(item => item.id === habitId) : null;
  el('dialogTitle').textContent = habit ? 'Modifier l’habitude' : 'Nouvelle habitude';
  el('habitId').value = habit?.id || '';
  el('habitIcon').value = habit?.icon || '⭐';
  el('habitName').value = habit?.name || '';
  el('habitCategory').value = habit?.category || '';
  el('habitGoal').value = habit?.goal || 1;
  el('habitUnit').value = habit?.unit || 'validation';
  el('habitFrequency').value = habit?.frequency || 'daily';
  el('habitStart').value = habit?.startDate || selectedDate;
  el('habitEnd').value = habit?.endDate || '';
  document.querySelectorAll('#weekdayFieldset input').forEach(input => input.checked = (habit?.weekdays || [0,1,2,3,4,5,6]).includes(Number(input.value)));
  toggleWeekdayFieldset();
  el('archiveHabit').classList.toggle('hidden', !habit || !habit.active);
  dialog.showModal();
  setTimeout(() => el('habitName').focus(), 50);
}

function closeHabitDialog() { el('habitDialog').close(); }
function toggleWeekdayFieldset() { el('weekdayFieldset').classList.toggle('hidden', el('habitFrequency').value !== 'weekdays'); }

function saveHabitFromForm(event) {
  event.preventDefault();
  const id = el('habitId').value;
  const weekdays = [...document.querySelectorAll('#weekdayFieldset input:checked')].map(input => Number(input.value));
  const habitData = {
    name:el('habitName').value.trim(), icon:el('habitIcon').value.trim() || '⭐', category:el('habitCategory').value.trim(),
    goal:Number(el('habitGoal').value), unit:el('habitUnit').value, frequency:el('habitFrequency').value,
    weekdays:el('habitFrequency').value === 'daily' ? [0,1,2,3,4,5,6] : weekdays,
    startDate:el('habitStart').value, endDate:el('habitEnd').value
  };
  if (!habitData.name || !habitData.startDate || habitData.goal <= 0) return showToast('Veuillez compléter les champs obligatoires.');
  if (habitData.frequency === 'weekdays' && !habitData.weekdays.length) return showToast('Sélectionnez au moins un jour.');
  if (habitData.endDate && habitData.endDate < habitData.startDate) return showToast('La date de fin doit suivre la date de début.');

  if (id) {
    const habit = state.habits.find(item => item.id === id);
    Object.assign(habit, habitData);
    showToast('Habitude mise à jour.');
  } else {
    const nextId = `HAB-${String(Math.max(0, ...state.habits.map(h => Number(h.id.replace(/\D/g,'')) || 0)) + 1).padStart(3,'0')}`;
    state.habits.push({ id:nextId, ...habitData, active:true, archivedAt:null, order:state.habits.length+1 });
    showToast('Habitude ajoutée.');
  }
  saveState();
  closeHabitDialog();
  renderAll();
}

function archiveCurrentHabit() {
  const id = el('habitId').value;
  const habit = state.habits.find(item => item.id === id);
  if (!habit) return;
  habit.active = false;
  habit.archivedAt = todayISO();
  if (!habit.endDate || habit.endDate > habit.archivedAt) habit.endDate = habit.archivedAt;
  saveState();
  closeHabitDialog();
  renderAll();
  showToast('Habitude archivée, historique conservé.');
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type:'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `mes-habitudes-${todayISO()}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast('Sauvegarde exportée.');
}

async function importData(file) {
  try {
    const parsed = JSON.parse(await file.text());
    if (!Array.isArray(parsed.habits) || typeof parsed.entries !== 'object') throw new Error('Structure invalide');
    state = parsed;
    saveState();
    renderAll();
    showToast('Données importées.');
  } catch (error) {
    console.error(error);
    showToast('Fichier de sauvegarde invalide.');
  } finally { el('importData').value = ''; }
}

function showToast(message) {
  const toast = el('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}

function formatNumber(value) { return new Intl.NumberFormat('fr-FR', { maximumFractionDigits:1 }).format(value); }
function escapeHTML(value='') { return String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char])); }

navButtons.forEach(button => button.addEventListener('click', () => showView(button.dataset.view)));
el('prevDay').addEventListener('click', () => { selectedDate = shiftDate(selectedDate,-1); renderAll(); });
el('nextDay').addEventListener('click', () => { selectedDate = shiftDate(selectedDate,1); renderAll(); });
el('todayDateButton').addEventListener('click', () => { selectedDate = todayISO(); renderAll(); });
el('prevMonth').addEventListener('click', () => { historyMonth = shiftMonth(historyMonth,-1); renderHistory(); });
el('nextMonth').addEventListener('click', () => { historyMonth = shiftMonth(historyMonth,1); renderHistory(); });
el('statsPeriod').addEventListener('change', renderStats);
el('addHabitToday').addEventListener('click', () => openHabitDialog());
el('addHabitSettings').addEventListener('click', () => openHabitDialog());
el('closeDialog').addEventListener('click', closeHabitDialog);
el('cancelHabit').addEventListener('click', closeHabitDialog);
el('habitFrequency').addEventListener('change', toggleWeekdayFieldset);
el('habitForm').addEventListener('submit', saveHabitFromForm);
el('archiveHabit').addEventListener('click', archiveCurrentHabit);
el('exportData').addEventListener('click', exportData);
el('importData').addEventListener('change', event => event.target.files[0] && importData(event.target.files[0]));

el('todayHabits').addEventListener('click', event => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const habit = state.habits.find(item => item.id === button.dataset.id);
  if (!habit) return;
  const value = getValue(selectedDate, habit.id);
  if (button.dataset.action === 'toggle') setValue(selectedDate, habit, value >= habit.goal ? 0 : habit.goal);
  if (button.dataset.action === 'increase') setValue(selectedDate, habit, value + 1);
  if (button.dataset.action === 'decrease') setValue(selectedDate, habit, value - 1);
});

el('calendarGrid').addEventListener('click', event => {
  const button = event.target.closest('[data-date]');
  if (!button) return;
  selectedDate = button.dataset.date;
  showView('today');
});

el('manageHabits').addEventListener('click', event => {
  const button = event.target.closest('[data-edit]');
  if (button) openHabitDialog(button.dataset.edit);
});

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault(); deferredInstallPrompt = event; el('installBtn').classList.remove('hidden');
});
el('installBtn').addEventListener('click', async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  el('installBtn').classList.add('hidden');
});
window.addEventListener('appinstalled', () => showToast('Application installée.'));

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(console.warn));
}

renderAll();
