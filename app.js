'use strict';
const VERSION='1.3.0';
const STORAGE_KEY='mon-budget-data-v2';
const OLD_STORAGE_KEY='mon-budget-data-v1';
const money=new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'});
const ICONS=['🏠','🛒','📈','👤','👥','🏦','🚗','💡','📱','🎯','💳','🧾','🍽️','🧸'];
const COLORS=['#1667d9','#2f9e5b','#e58a00','#8e56c7','#dc4451','#665ed1','#128ca8','#a97900'];
const uid=()=>crypto.randomUUID?.()||`${Date.now()}-${Math.random()}`;
const expense=(label,amount)=>({id:uid(),label,amount});
const incomeSource=(label,amount)=>({id:uid(),label,amount});
const envelope=(name,description,icon,color,planned,expenses=[],type='expense')=>({id:uid(),name,description,icon,color,planned,expenses,type});
const seed=()=>({version:VERSION,activeTab:'overview',settings:{privacy:false},spaces:{personal:{name:'Personnel',incomeSources:[incomeSource('Salaire',2709)],envelopes:[
 envelope('Livret A','Charges fixes','🏠','#1667d9',320,[expense('Abonnement YouTube',6.5),expense('Péage et stationnement',8),expense('Assurance automobile',63),expense('Traiteur',115),expense('Carburant',103),expense('Abonnement ChatGPT',23),expense('Abonnement SFR',8)]),
 envelope('Boursobank','Alimentaire et loisirs','🛒','#2f9e5b',200,[expense('Alimentation et restaurant',111.5),expense('Shopping et loisirs',104)]),
 envelope('Revolut','Épargne, crypto et bourse','📈','#e58a00',500,[expense('Épargne Rose',30),expense('Crypto et bourse',470)],'savings'),
 envelope('Alizée Cristel','Virement','👤','#8e56c7',150,[expense('Pension Rose',150)]),
 envelope('Compte commun','Virement vers le foyer','👥','#dc4451',1200,[expense('Virement mensuel',1200)],'transfer'),
 envelope('LEP','Épargne de précaution','🏦','#665ed1',150,[expense('Réserve',150)],'savings')]},shared:{name:'Compte commun',incomeSources:[incomeSource('Votre contribution',1200),incomeSource('Contribution du conjoint',1200)],envelopes:[
 envelope('Logement','Loyer et charges','🏠','#1667d9',1150,[expense('Loyer',950),expense('Électricité',110),expense('Internet',40)]),
 envelope('Courses','Alimentation du foyer','🛒','#2f9e5b',500,[expense('Courses principales',310)]),
 envelope('Transport','Mobilité commune','🚗','#e58a00',220,[expense('Carburant',120)]),
 envelope('Maison','Entretien et équipement','💡','#8e56c7',180,[expense('Produits ménagers',42)]),
 envelope('Loisirs','Sorties et activités','🍽️','#dc4451',200,[expense('Restaurant',75)]),
 envelope('Épargne commune','Projets du foyer','🏦','#665ed1',150,[expense('Virement épargne',150)],'savings')]}}});
let state=null;let openEnvelopeId=null;let editorContext=null;let storageInfo={source:'none',persisted:false,snapshotCount:0};
const $=s=>document.querySelector(s);
const els={overviewView:$('#overviewView'),combinedAvailable:$('#combinedAvailable'),overviewMessage:$('#overviewMessage'),spaceOverviewCards:$('#spaceOverviewCards'),screenEyebrow:$('#screenEyebrow'),screenTitle:$('#screenTitle'),quickEditBtn:$('#quickEditBtn'),privacyBtn:$('#privacyBtn'),privacyPreview:$('#privacyPreview'),privacySwitch:$('#privacySwitch'),incomeSourceList:$('#incomeSourceList'),budgetView:$('#budgetView'),settingsView:$('#settingsView'),available:$('#availableAmount'),income:$('#incomeAmount'),planned:$('#plannedAmount'),spent:$('#spentAmount'),heroMessage:$('#heroMessage'),heroPercent:$('#heroPercent'),heroOrb:$('.hero-orb'),list:$('#envelopeList'),template:$('#envelopeTemplate'),dialog:$('#editorDialog'),form:$('#editorForm'),fields:$('#editorFields'),dialogTitle:$('#dialogTitle'),dialogEyebrow:$('#dialogEyebrow'),deleteArea:$('#deleteArea'),personalNamePreview:$('#personalNamePreview'),sharedNamePreview:$('#sharedNamePreview'),storageStatus:$('#storageStatus'),storageStatusIcon:$('#storageStatusIcon'),storageStatusTitle:$('#storageStatusTitle'),storageStatusDetail:$('#storageStatusDetail'),lastSavedPreview:$('#lastSavedPreview'),snapshotCountPreview:$('#snapshotCountPreview'),importDialog:$('#importDialog'),importSummary:$('#importSummary')};
async function loadState(){
  const loaded=await BudgetStorage.load();
  storageInfo.source=loaded.source;
  let candidate=loaded.state;
  if(candidate?.months){
    const latest=candidate.months[candidate.selectedMonth]||Object.values(candidate.months)[0];
    const fresh=seed();
    if(latest){fresh.spaces.personal.incomeSources=[incomeSource('Salaire',Number(latest.income||0))];fresh.spaces.personal.envelopes=latest.envelopes||[]}
    candidate=fresh;
  }
  if(!candidate?.spaces?.personal||!candidate?.spaces?.shared)candidate=seed();
  state=candidate;
  state.settings??={privacy:false};
  state.meta??={createdAt:new Date().toISOString(),revision:0,lastSavedAt:null};
  if(!['overview','personal','shared','settings'].includes(state.activeTab))state.activeTab='overview';
  migrateIncomeSources();
  migrateEnvelopeTypes();
  if(loaded.source!=='indexeddb')await save({snapshot:false});
  await refreshStorageInfo();
}
function migrateIncomeSources(){for(const key of ['personal','shared']){const space=state.spaces[key];if(!Array.isArray(space.incomeSources)){space.incomeSources=[incomeSource(key==='personal'?'Revenu principal':'Contributions',Number(space.income||0))]}delete space.income}}
function migrateEnvelopeTypes(){for(const [key,space] of Object.entries(state.spaces)){for(const env of space.envelopes||[]){if(!['expense','savings','transfer'].includes(env.type)){const name=(env.name+' '+(env.description||'')).toLowerCase();env.type=key==='personal'&&name.includes('compte commun')?'transfer':/(épargne|livret|lep|bourse|crypto)/i.test(name)?'savings':'expense';}}}}
let saveTimer=null;
function save(options={}){
  state.version=VERSION;
  state.meta??={createdAt:new Date().toISOString(),revision:0,lastSavedAt:null};
  state.meta.revision=Number(state.meta.revision||0)+1;
  state.meta.lastSavedAt=new Date().toISOString();
  clearTimeout(saveTimer);
  saveTimer=setTimeout(async()=>{
    try{
      await BudgetStorage.save(structuredClone(state),{snapshot:options.snapshot!==false});
      await refreshStorageInfo();
    }catch(error){
      console.error('Sauvegarde impossible',error);
      alert('La sauvegarde a échoué. Exportez immédiatement vos données depuis Réglages.');
    }
  },options.immediate?0:180);
  return true;
}
async function refreshStorageInfo(){
  try{
    const [snapshots,persisted]=await Promise.all([BudgetStorage.listSnapshots(),navigator.storage?.persisted?.().catch(()=>false)]);
    storageInfo.snapshotCount=snapshots.length;storageInfo.persisted=Boolean(persisted);
    renderStorageStatus();
  }catch(error){console.warn(error)}
}
function formatSavedDate(value){if(!value)return 'Jamais';try{return new Intl.DateTimeFormat('fr-FR',{dateStyle:'short',timeStyle:'short'}).format(new Date(value))}catch{return '—'}}
function renderStorageStatus(){
  if(!els.storageStatus)return;
  const protectedStore=storageInfo.source==='indexeddb';
  els.storageStatus.classList.toggle('good',protectedStore);
  els.storageStatus.classList.toggle('warning',!protectedStore);
  els.storageStatusIcon.textContent=protectedStore?'✓':'!';
  els.storageStatusTitle.textContent=protectedStore?'Sauvegarde locale renforcée':'Protection limitée';
  els.storageStatusDetail.textContent=storageInfo.persisted?'Stockage persistant accordé par l’appareil.':'IndexedDB actif avec copie de secours locale.';
  els.lastSavedPreview.textContent=formatSavedDate(state?.meta?.lastSavedAt);
  els.snapshotCountPreview.textContent=String(storageInfo.snapshotCount||0);
}
function activeSpace(){return state.spaces[state.activeTab]}
function spent(e){return e.expenses.reduce((s,x)=>s+Number(x.amount||0),0)}
function totals(space=activeSpace()){const planned=space.envelopes.reduce((s,e)=>s+Number(e.planned||0),0);const actual=space.envelopes.reduce((s,e)=>s+spent(e),0);const income=(space.incomeSources||[]).reduce((sum,x)=>sum+Number(x.amount||0),0);return{income,planned,actual,available:income-actual}}
function fmt(n){return state.settings?.privacy?'•••• €':money.format(Number(n||0))}
function render(){
  const overview=state.activeTab==='overview',settings=state.activeTab==='settings',budget=!overview&&!settings;
  els.overviewView.classList.toggle('active',overview);els.budgetView.classList.toggle('active',budget);els.settingsView.classList.toggle('active',settings);
  document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===state.activeTab));
  els.quickEditBtn.hidden=!budget;els.privacyBtn.hidden=settings;els.privacyBtn.textContent=state.settings?.privacy?'◎':'◉';els.privacyBtn.setAttribute('aria-label',state.settings?.privacy?'Afficher les montants':'Masquer les montants');els.privacyPreview.textContent=state.settings?.privacy?'Activé':'Désactivé';els.privacySwitch.textContent=state.settings?.privacy?'●':'○';els.privacySwitch.classList.toggle('active',Boolean(state.settings?.privacy));
  els.screenEyebrow.textContent=overview?'SYNTHÈSE':settings?'APPLICATION':state.activeTab==='personal'?'ESPACE PERSONNEL':'ESPACE PARTAGÉ';
  els.screenTitle.textContent=overview?'Organisation':settings?'Réglages':activeSpace().name;
  els.personalNamePreview.textContent=state.spaces.personal.name;els.sharedNamePreview.textContent=state.spaces.shared.name;
  if(overview){renderOverview();return}if(settings){renderStorageStatus();return;}
  const t=totals();els.available.textContent=fmt(t.available);els.income.textContent=fmt(t.income);els.planned.textContent=fmt(t.planned);els.spent.textContent=fmt(t.actual);
  const rate=t.income>0?Math.round(t.actual/t.income*100):0;els.heroPercent.textContent=`${rate}%`;els.heroOrb.style.setProperty('--progress',`${Math.min(rate,100)}%`);els.available.classList.toggle('negative',t.available<0);
  els.heroMessage.textContent=t.available<0?'La répartition dépasse les revenus saisis.':'Photographie permanente de votre organisation.';
  renderIncomeSources();els.list.replaceChildren();if(!activeSpace().envelopes.length){const p=document.createElement('p');p.className='empty-state';p.textContent='Aucune enveloppe. Ajoutez votre première répartition.';els.list.append(p)}else activeSpace().envelopes.forEach(e=>els.list.append(renderEnvelope(e)))
}
function renderIncomeSources(){
  els.incomeSourceList.replaceChildren();
  const sources=activeSpace().incomeSources||[];
  if(!sources.length){const p=document.createElement('p');p.className='empty-state';p.textContent='Aucune source de revenu. Ajoutez une entrée pour calculer le disponible.';els.incomeSourceList.append(p);return}
  sources.forEach(source=>{const row=document.createElement('button');row.type='button';row.className='income-source-row';row.innerHTML='<span class="income-source-icon">＋</span><span class="income-source-copy"><strong></strong><small>Revenu permanent</small></span><strong class="income-source-amount"></strong><span class="income-source-arrow">›</span>';row.querySelector('.income-source-copy strong').textContent=source.label;row.querySelector('.income-source-amount').textContent=fmt(source.amount);row.onclick=()=>openIncomeSourceEditor(source.id);els.incomeSourceList.append(row)})
}

function renderOverview(){
  const entries=['personal','shared'].map(key=>({key,space:state.spaces[key],totals:totals(state.spaces[key])}));
  const combined=entries.reduce((sum,x)=>sum+x.totals.available,0);els.combinedAvailable.textContent=fmt(combined);els.combinedAvailable.classList.toggle('negative',combined<0);els.overviewMessage.textContent='Disponible cumulé des deux espaces, affichés séparément';
  els.spaceOverviewCards.replaceChildren();entries.forEach(({key,space,totals:t})=>{const card=document.createElement('button');card.type='button';card.className='space-overview-card';card.innerHTML='<div class="space-card-head"><span></span><div><small></small><strong></strong></div><b>›</b></div><div class="space-card-values"><div><span>Revenus</span><strong></strong></div><div><span>Réparti</span><strong></strong></div><div><span>Disponible</span><strong></strong></div></div>';card.querySelector('.space-card-head>span').textContent=key==='personal'?'⌂':'♧';card.querySelector('.space-card-head small').textContent=key==='personal'?'BUDGET PERSONNEL':'COMPTE COMMUN';card.querySelector('.space-card-head strong').textContent=space.name;const vals=card.querySelectorAll('.space-card-values strong');vals[0].textContent=fmt(t.income);vals[1].textContent=fmt(t.actual);vals[2].textContent=fmt(t.available);vals[2].classList.toggle('negative',t.available<0);card.onclick=()=>{state.activeTab=key;save();render()};els.spaceOverviewCards.append(card)});
} 

function renderEnvelope(e){const node=els.template.content.firstElementChild.cloneNode(true);const actual=spent(e),planned=Number(e.planned||0),diff=planned-actual,ratio=planned?actual/planned:(actual?1:0),open=e.id===openEnvelopeId;node.dataset.id=e.id;node.style.setProperty('--card-accent',e.color||COLORS[0]);node.classList.toggle('open',open);const summary=node.querySelector('.envelope-summary');summary.setAttribute('aria-expanded',String(open));node.querySelector('.envelope-icon').textContent=e.icon||'💳';node.querySelector('.envelope-name').textContent=e.name;node.querySelector('.envelope-description').textContent=`${typeLabel(e.type)} · ${e.description||'Sans description'}`;node.querySelector('.envelope-amount').textContent=fmt(actual);node.querySelector('.envelope-progress-label').textContent=`Prévu ${fmt(planned)}`;node.querySelector('.planned-value').textContent=fmt(planned);node.querySelector('.spent-value').textContent=fmt(actual);const d=node.querySelector('.difference-value');d.textContent=`${diff<0?'−':''}${fmt(Math.abs(diff))}`;d.classList.add(diff<0?'negative':'positive');const fill=node.querySelector('.progress-fill');fill.style.width=`${Math.min(Math.max(ratio*100,0),100)}%`;fill.style.background='var(--positive)';node.querySelector('.expense-count').textContent=`DÉPENSES (${e.expenses.length})`;const list=node.querySelector('.expense-list');if(!e.expenses.length){const p=document.createElement('p');p.className='empty-state';p.textContent='Aucune dépense enregistrée.';list.append(p)}else e.expenses.forEach(x=>{const row=document.createElement('div');row.className='expense-row';row.innerHTML='<strong></strong><span></span><button type="button" aria-label="Modifier">•••</button>';row.querySelector('strong').textContent=x.label;row.querySelector('span').textContent=fmt(x.amount);row.querySelector('button').onclick=()=>openExpenseEditor(e.id,x.id);list.append(row)});summary.onclick=()=>{openEnvelopeId=open?null:e.id;navigator.vibrate?.(8);render()};node.querySelector('.edit-envelope').onclick=()=>openEnvelopeEditor(e.id);node.querySelector('.add-expense').onclick=()=>openExpenseEditor(e.id);const tools=node.querySelector('.expense-header>div');tools.insertAdjacentHTML('afterbegin','<button class="text-button duplicate-envelope" type="button">Dupliquer</button>');tools.querySelector('.duplicate-envelope').onclick=()=>duplicateEnvelope(e.id);const index=activeSpace().envelopes.findIndex(x=>x.id===e.id);const up=node.querySelector('.move-up'),down=node.querySelector('.move-down');up.disabled=index===0;down.disabled=index===activeSpace().envelopes.length-1;up.onclick=()=>moveEnvelope(e.id,-1);down.onclick=()=>moveEnvelope(e.id,1);return node}

function moveEnvelope(id,direction){const items=activeSpace().envelopes,index=items.findIndex(e=>e.id===id),next=index+direction;if(index<0||next<0||next>=items.length)return;[items[index],items[next]]=[items[next],items[index]];openEnvelopeId=id;navigator.vibrate?.(10);save();render()}
function duplicateEnvelope(id){const source=activeSpace().envelopes.find(e=>e.id===id);if(!source)return;const copy=structuredClone(source);copy.id=uid();copy.name=`${source.name} – copie`;copy.expenses=copy.expenses.map(x=>({...x,id:uid()}));activeSpace().envelopes.push(copy);openEnvelopeId=copy.id;save();render()}
function esc(v){return String(v??'').replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;')}
function input(name,label,value='',type='text',attrs=''){return `<div class="form-field"><label for="${name}">${label}</label><input id="${name}" name="${name}" type="${type}" value="${esc(value)}" ${attrs}></div>`}
function select(name,label,values,selected){return `<div class="form-field"><label for="${name}">${label}</label><select id="${name}" name="${name}">${values.map(v=>`<option value="${esc(v)}" ${v===selected?'selected':''}>${v}</option>`).join('')}</select></div>`}
function showEditor({title,eyebrow,fields,context,deleteLabel}){editorContext=context;els.dialogTitle.textContent=title;els.dialogEyebrow.textContent=eyebrow;els.fields.innerHTML=fields;els.deleteArea.innerHTML=deleteLabel?`<button class="delete-button" id="deleteButton" type="button">${deleteLabel}</button>`:'';if(deleteLabel)$('#deleteButton').onclick=deleteCurrent;els.dialog.showModal();setTimeout(()=>els.fields.querySelector('input')?.focus(),100)}
function openIncomeSourceEditor(id=null){const source=id?activeSpace().incomeSources.find(x=>x.id===id):null;showEditor({title:source?'Modifier le revenu':'Nouvelle source de revenu',eyebrow:activeSpace().name.toUpperCase(),context:{type:'incomeSource',id},deleteLabel:source?'Supprimer cette source':null,fields:input('label','Libellé',source?.label||'','','maxlength="50" required')+input('amount','Montant',source?.amount??'','number','min="0" step="0.01" inputmode="decimal" required')})}
function typeLabel(type){return type==='transfer'?'Transfert':type==='savings'?'Épargne':'Dépense'}
function openEnvelopeEditor(id=null){const e=id?activeSpace().envelopes.find(x=>x.id===id):null;showEditor({title:e?'Modifier l’enveloppe':'Nouvelle enveloppe',eyebrow:'RÉPARTITION',context:{type:'envelope',id},deleteLabel:e?'Supprimer cette enveloppe':null,fields:[input('name','Nom',e?.name||'','','maxlength="40" required'),input('description','Description',e?.description||'','','maxlength="70"'),select('category','Nature',['Dépense','Épargne','Transfert'],typeLabel(e?.type||'expense')),input('planned','Montant prévu',e?.planned??'','number','min="0" step="0.01" inputmode="decimal" required'),select('icon','Icône',ICONS,e?.icon||ICONS[0]),select('color','Couleur',COLORS,e?.color||COLORS[0])].join('')})}
function openExpenseEditor(envelopeId,id=null){const env=activeSpace().envelopes.find(e=>e.id===envelopeId),x=id?env.expenses.find(y=>y.id===id):null;showEditor({title:x?'Modifier la dépense':'Nouvelle dépense',eyebrow:env.name.toUpperCase(),context:{type:'expense',envelopeId,id},deleteLabel:x?'Supprimer cette dépense':null,fields:input('label','Libellé',x?.label||'','','maxlength="60" required')+input('amount','Montant',x?.amount??'','number','min="0" step="0.01" inputmode="decimal" required')})}
function openRename(spaceKey){showEditor({title:'Renommer l’espace',eyebrow:'RÉGLAGES',context:{type:'rename',spaceKey},fields:input('name','Nom affiché',state.spaces[spaceKey].name,'','maxlength="30" required')})}
function deleteCurrent(){if(editorContext.type==='envelope'&&confirm('Supprimer cette enveloppe et toutes ses dépenses ?'))activeSpace().envelopes=activeSpace().envelopes.filter(e=>e.id!==editorContext.id);else if(editorContext.type==='incomeSource'&&confirm('Supprimer cette source de revenu ?'))activeSpace().incomeSources=activeSpace().incomeSources.filter(x=>x.id!==editorContext.id);else if(editorContext.type==='expense'&&confirm('Supprimer cette dépense ?')){const env=activeSpace().envelopes.find(e=>e.id===editorContext.envelopeId);env.expenses=env.expenses.filter(x=>x.id!==editorContext.id)}else return;save();els.dialog.close();openEnvelopeId=null;render()}
els.form.onsubmit=e=>{e.preventDefault();const f=new FormData(els.form);if(editorContext.type==='incomeSource'){const payload={label:String(f.get('label')).trim(),amount:Number(f.get('amount'))};if(editorContext.id)Object.assign(activeSpace().incomeSources.find(x=>x.id===editorContext.id),payload);else activeSpace().incomeSources.push({id:uid(),...payload})}if(editorContext.type==='rename')state.spaces[editorContext.spaceKey].name=String(f.get('name')).trim();if(editorContext.type==='envelope'){const category=String(f.get('category'));const payload={name:String(f.get('name')).trim(),description:String(f.get('description')).trim(),type:category==='Transfert'?'transfer':category==='Épargne'?'savings':'expense',planned:Number(f.get('planned')),icon:String(f.get('icon')),color:String(f.get('color'))};if(editorContext.id)Object.assign(activeSpace().envelopes.find(x=>x.id===editorContext.id),payload);else{const id=uid();activeSpace().envelopes.push({id,...payload,expenses:[]});openEnvelopeId=id}}if(editorContext.type==='expense'){const env=activeSpace().envelopes.find(x=>x.id===editorContext.envelopeId);const payload={label:String(f.get('label')).trim(),amount:Number(f.get('amount'))};if(editorContext.id)Object.assign(env.expenses.find(x=>x.id===editorContext.id),payload);else env.expenses.push({id:uid(),...payload});openEnvelopeId=env.id}save();els.dialog.close();render()};
$('#cancelDialogBtn').onclick=$('#closeDialogBtn').onclick=()=>els.dialog.close();$('#addEnvelopeBtn').onclick=()=>openEnvelopeEditor();$('#addIncomeBtn').onclick=()=>openIncomeSourceEditor();els.quickEditBtn.onclick=()=>openIncomeSourceEditor();els.privacyBtn.onclick=()=>{state.settings.privacy=!state.settings.privacy;navigator.vibrate?.(8);save();render()};
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{state.activeTab=b.dataset.tab;openEnvelopeId=null;save();render()});
document.querySelectorAll('[data-action]').forEach(b=>b.onclick=async()=>{
  const a=b.dataset.action;
  if(a==='rename-personal')openRename('personal');
  if(a==='rename-shared')openRename('shared');
  if(a==='privacy'){state.settings.privacy=!state.settings.privacy;save();render()}
  if(a==='export')exportBackup();
  if(a==='protect-storage'){
    const result=await BudgetStorage.requestPersistence();
    storageInfo.persisted=result.persisted;
    renderStorageStatus();
    alert(result.persisted?'La conservation renforcée a été accordée par l’appareil.':'L’appareil n’a pas accordé le stockage persistant. Les sauvegardes locales restent actives.');
  }
  if(a==='restore-snapshot')await restoreLatestSnapshot();
  if(a==='reset'&&confirm('Effacer toutes les données de l’application ?')&&confirm('Dernière confirmation : cette action restaurera le modèle initial.')){
    await BudgetStorage.clear();state=seed();await BudgetStorage.save(structuredClone(state));storageInfo.source='indexeddb';await refreshStorageInfo();render();
  }
});
function exportBackup(){
  const payload={...state,exportedAt:new Date().toISOString(),format:'mon-budget-backup-v1'};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download=`mon-budget-${new Date().toISOString().slice(0,10)}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function restoreLatestSnapshot(){
  const snapshots=await BudgetStorage.listSnapshots();
  if(!snapshots.length){alert('Aucune copie de récupération locale n’est disponible.');return}
  const latest=snapshots[0];
  if(!confirm(`Restaurer la copie du ${formatSavedDate(latest.createdAt)} ?`))return;
  state=structuredClone(latest.state);state.activeTab='settings';migrateIncomeSources();await BudgetStorage.save(structuredClone(state),{snapshot:false});await refreshStorageInfo();render();
}

let pendingImport=null;
function normalizeImport(raw){
  let imported=structuredClone(raw);
  if(imported?.state?.spaces)imported=imported.state;
  if(imported?.months){const latest=imported.months[imported.selectedMonth]||Object.values(imported.months)[0];const fresh=seed();if(latest){fresh.spaces.personal.incomeSources=[incomeSource('Revenu principal',Number(latest.income||0))];fresh.spaces.personal.envelopes=latest.envelopes||[]}imported=fresh;}
  if(!imported?.spaces?.personal||!imported?.spaces?.shared)throw new Error('Structure incompatible');
  imported.settings??={privacy:false};imported.meta??={createdAt:new Date().toISOString(),revision:0,lastSavedAt:null};
  for(const key of ['personal','shared']){const space=imported.spaces[key];space.name=String(space.name|| (key==='personal'?'Personnel':'Compte commun'));space.envelopes=Array.isArray(space.envelopes)?space.envelopes:[];if(!Array.isArray(space.incomeSources))space.incomeSources=[incomeSource(key==='personal'?'Revenu principal':'Contributions',Number(space.income||0))];delete space.income;for(const env of space.envelopes){env.id??=uid();env.expenses=Array.isArray(env.expenses)?env.expenses:[];env.expenses.forEach(x=>x.id??=uid());if(!['expense','savings','transfer'].includes(env.type)){const n=(env.name+' '+(env.description||'')).toLowerCase();env.type=key==='personal'&&n.includes('compte commun')?'transfer':/(épargne|livret|lep|bourse|crypto)/i.test(n)?'savings':'expense';}}}
  imported.activeTab='settings';imported.version=VERSION;return imported;
}
function importStats(data){const p=data.spaces.personal,s=data.spaces.shared;return{revenues:(p.incomeSources?.length||0)+(s.incomeSources?.length||0),personal:p.envelopes.length,shared:s.envelopes.length,expenses:[...p.envelopes,...s.envelopes].reduce((n,e)=>n+e.expenses.length,0)}}
$('#importInput').onchange=async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;try{pendingImport=normalizeImport(JSON.parse(await file.text()));const x=importStats(pendingImport);els.importSummary.innerHTML=`<div class="import-file"><strong>${esc(file.name)}</strong><small>Fichier compatible</small></div><div class="import-grid"><div><span>Revenus</span><strong>${x.revenues}</strong></div><div><span>Personnel</span><strong>${x.personal}</strong></div><div><span>Compte commun</span><strong>${x.shared}</strong></div><div><span>Détails</span><strong>${x.expenses}</strong></div></div><p><strong>${esc(pendingImport.spaces.personal.name)}</strong> et <strong>${esc(pendingImport.spaces.shared.name)}</strong> seront restaurés.</p>`;els.importDialog.showModal()}catch(error){console.error(error);alert('Ce fichier JSON n’est pas une sauvegarde Mon Budget compatible. Aucune donnée n’a été modifiée.')}};
$('#cancelImportBtn').onclick=$('#closeImportBtn').onclick=()=>{pendingImport=null;els.importDialog.close()};
$('#confirmImportBtn').onclick=async()=>{if(!pendingImport)return;try{await BudgetStorage.save(structuredClone(state),{snapshot:true});state=pendingImport;pendingImport=null;await BudgetStorage.save(structuredClone(state),{snapshot:true});storageInfo.source='indexeddb';await refreshStorageInfo();els.importDialog.close();render();alert('Votre sauvegarde a été importée avec succès.')}catch(error){console.error(error);alert('L’importation a échoué. Vos données précédentes restent disponibles dans les copies de récupération.')}};
let deferredInstallPrompt=null;
const installButton=document.querySelector('[data-action="install"]');
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredInstallPrompt=event;if(installButton){installButton.hidden=false;installButton.disabled=false}});
window.addEventListener('appinstalled',()=>{deferredInstallPrompt=null;if(installButton){installButton.hidden=true;installButton.disabled=true}});
if(installButton){installButton.onclick=async()=>{if(!deferredInstallPrompt){alert('Sur iPhone : touchez Partager, puis « Sur l’écran d’accueil ». Sur ordinateur ou Android, utilisez le menu du navigateur pour installer l’application.');return}deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;installButton.hidden=true}};
(async()=>{await loadState();render();if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(error=>console.warn('Service worker non enregistré',error)));})();
