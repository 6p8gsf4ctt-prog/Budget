'use strict';

const BudgetStorage = (() => {
  const DB_NAME = 'mon-budget-secure-db';
  const DB_VERSION = 1;
  const STATE_STORE = 'state';
  const SNAPSHOT_STORE = 'snapshots';
  const CURRENT_KEY = 'current';
  const MIRROR_KEY = 'mon-budget-data-v3';
  const LEGACY_KEYS = ['mon-budget-data-v2', 'mon-budget-data-v1'];
  const MAX_SNAPSHOTS = 20;

  let dbPromise;

  function openDB() {
    if (!('indexedDB' in window)) return Promise.resolve(null);
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STATE_STORE)) db.createObjectStore(STATE_STORE);
        if (!db.objectStoreNames.contains(SNAPSHOT_STORE)) db.createObjectStore(SNAPSHOT_STORE, { keyPath: 'id', autoIncrement: true });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return dbPromise;
  }

  function requestToPromise(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function getFromIndexedDB() {
    const db = await openDB();
    if (!db) return null;
    const tx = db.transaction(STATE_STORE, 'readonly');
    return requestToPromise(tx.objectStore(STATE_STORE).get(CURRENT_KEY));
  }

  function readLocalStorage() {
    for (const key of [MIRROR_KEY, ...LEGACY_KEYS]) {
      try {
        const value = JSON.parse(localStorage.getItem(key));
        if (value) return { value, source: key };
      } catch (error) {
        console.warn(`Sauvegarde illisible (${key})`, error);
      }
    }
    return null;
  }

  async function load() {
    try {
      const indexed = await getFromIndexedDB();
      if (indexed?.spaces?.personal && indexed?.spaces?.shared) return { state: indexed, source: 'indexeddb' };
    } catch (error) {
      console.warn('IndexedDB indisponible', error);
    }
    const local = readLocalStorage();
    if (local) return { state: local.value, source: local.source };
    return { state: null, source: 'none' };
  }

  async function save(value, { snapshot = true } = {}) {
    const serialized = JSON.stringify(value);
    try { localStorage.setItem(MIRROR_KEY, serialized); } catch (error) { console.warn('Copie locale impossible', error); }

    const db = await openDB();
    if (!db) return { indexedDB: false, mirror: true };
    await new Promise((resolve, reject) => {
      const tx = db.transaction([STATE_STORE, SNAPSHOT_STORE], 'readwrite');
      tx.objectStore(STATE_STORE).put(value, CURRENT_KEY);
      if (snapshot) tx.objectStore(SNAPSHOT_STORE).add({ createdAt: new Date().toISOString(), state: value });
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    if (snapshot) await trimSnapshots();
    return { indexedDB: true, mirror: true };
  }

  async function trimSnapshots() {
    const db = await openDB();
    if (!db) return;
    const tx = db.transaction(SNAPSHOT_STORE, 'readwrite');
    const store = tx.objectStore(SNAPSHOT_STORE);
    const keys = await requestToPromise(store.getAllKeys());
    const obsolete = keys.slice(0, Math.max(0, keys.length - MAX_SNAPSHOTS));
    obsolete.forEach(key => store.delete(key));
  }

  async function listSnapshots() {
    const db = await openDB();
    if (!db) return [];
    const tx = db.transaction(SNAPSHOT_STORE, 'readonly');
    const all = await requestToPromise(tx.objectStore(SNAPSHOT_STORE).getAll());
    return all.sort((a, b) => b.id - a.id);
  }

  async function clear() {
    try { localStorage.removeItem(MIRROR_KEY); } catch {}
    const db = await openDB();
    if (!db) return;
    await new Promise((resolve, reject) => {
      const tx = db.transaction([STATE_STORE, SNAPSHOT_STORE], 'readwrite');
      tx.objectStore(STATE_STORE).clear();
      tx.objectStore(SNAPSHOT_STORE).clear();
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }

  async function requestPersistence() {
    if (!navigator.storage?.persist) return { supported: false, persisted: false };
    try {
      const already = await navigator.storage.persisted();
      const persisted = already || await navigator.storage.persist();
      return { supported: true, persisted };
    } catch {
      return { supported: true, persisted: false };
    }
  }

  async function estimate() {
    if (!navigator.storage?.estimate) return null;
    try { return await navigator.storage.estimate(); } catch { return null; }
  }

  return { load, save, listSnapshots, clear, requestPersistence, estimate, MIRROR_KEY };
})();
