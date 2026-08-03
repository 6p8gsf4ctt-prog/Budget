'use strict';

const BudgetStorage = (() => {
  const DB_NAME = 'mon-budget-secure-db';
  const DB_VERSION = 1;
  const STATE_STORE = 'state';
  const SNAPSHOT_STORE = 'snapshots';
  const CURRENT_KEY = 'current';
  const MIRROR_KEY = 'mon-budget-data-v3';
  const LEGACY_KEYS = ['mon-budget-data-v2', 'mon-budget-data-v1'];
  const LOCAL_SNAPSHOT_KEY = 'budget-local-snapshot-v1';
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
        if (!db.objectStoreNames.contains(SNAPSHOT_STORE)) {
          db.createObjectStore(SNAPSHOT_STORE, { keyPath: 'id', autoIncrement: true });
        }
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

  function writeMirror(value) {
    try {
      localStorage.setItem(MIRROR_KEY, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn('Copie miroir locale impossible', error);
      return false;
    }
  }

  function writeLocalSnapshot(value, reason, createdAt = new Date().toISOString()) {
    const snapshot = {
      createdAt,
      reason: reason || 'automatic',
      state: value
    };
    try {
      localStorage.setItem(LOCAL_SNAPSHOT_KEY, JSON.stringify(snapshot));
      return snapshot;
    } catch (error) {
      console.warn('Copie locale précédente impossible', error);
      return null;
    }
  }

  function readLocalSnapshot() {
    try {
      const value = JSON.parse(localStorage.getItem(LOCAL_SNAPSHOT_KEY));
      return value?.state ? value : null;
    } catch {
      return null;
    }
  }

  async function load() {
    try {
      const indexed = await getFromIndexedDB();
      if (indexed?.spaces?.personal && indexed?.spaces?.shared) {
        return { state: indexed, source: 'indexeddb' };
      }
    } catch (error) {
      console.warn('IndexedDB indisponible', error);
    }

    const local = readLocalStorage();
    if (local) return { state: local.value, source: local.source };
    return { state: null, source: 'none' };
  }

  async function save(value, { snapshot = false, snapshotReason = 'automatic' } = {}) {
    const mirror = writeMirror(value);
    const snapshotCreatedAt = snapshot ? new Date().toISOString() : null;
    if (snapshot) writeLocalSnapshot(value, snapshotReason, snapshotCreatedAt);

    const db = await openDB();
    if (!db) return { indexedDB: false, mirror };

    await new Promise((resolve, reject) => {
      const stores = snapshot ? [STATE_STORE, SNAPSHOT_STORE] : [STATE_STORE];
      const tx = db.transaction(stores, 'readwrite');
      tx.objectStore(STATE_STORE).put(value, CURRENT_KEY);
      if (snapshot) {
        tx.objectStore(SNAPSHOT_STORE).add({
          createdAt: snapshotCreatedAt,
          reason: snapshotReason,
          state: value
        });
      }
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });

    if (snapshot) await trimSnapshots();
    return { indexedDB: true, mirror };
  }

  async function createSnapshot(value, reason = 'manual') {
    const createdAt = new Date().toISOString();
    writeLocalSnapshot(value, reason, createdAt);
    const db = await openDB();
    if (!db) return { indexedDB: false };
    await new Promise((resolve, reject) => {
      const tx = db.transaction(SNAPSHOT_STORE, 'readwrite');
      tx.objectStore(SNAPSHOT_STORE).add({
        createdAt,
        reason,
        state: value
      });
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    await trimSnapshots();
    return { indexedDB: true };
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
    let indexedSnapshots = [];
    try {
      const db = await openDB();
      if (db) {
        const tx = db.transaction(SNAPSHOT_STORE, 'readonly');
        indexedSnapshots = await requestToPromise(tx.objectStore(SNAPSHOT_STORE).getAll());
      }
    } catch (error) {
      console.warn('Lecture des instantanés impossible', error);
    }

    const local = readLocalSnapshot();
    const all = [...indexedSnapshots];
    if (local && !all.some(item => item.createdAt === local.createdAt)) all.push({ id: Number.MAX_SAFE_INTEGER, ...local });
    return all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async function clear({ keepSnapshots = true } = {}) {
    try {
      localStorage.removeItem(MIRROR_KEY);
      for (const key of LEGACY_KEYS) localStorage.removeItem(key);
      if (!keepSnapshots) localStorage.removeItem(LOCAL_SNAPSHOT_KEY);
    } catch {}

    const db = await openDB();
    if (!db) return;
    await new Promise((resolve, reject) => {
      const stores = keepSnapshots ? [STATE_STORE] : [STATE_STORE, SNAPSHOT_STORE];
      const tx = db.transaction(stores, 'readwrite');
      tx.objectStore(STATE_STORE).clear();
      if (!keepSnapshots) tx.objectStore(SNAPSHOT_STORE).clear();
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
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
    try {
      return await navigator.storage.estimate();
    } catch {
      return null;
    }
  }

  async function storageMode() {
    let indexedDBAvailable = false;
    try {
      indexedDBAvailable = Boolean(await openDB());
    } catch {}
    return {
      indexedDB: indexedDBAvailable,
      localStorage: typeof localStorage !== 'undefined'
    };
  }

  return {
    load,
    save,
    createSnapshot,
    listSnapshots,
    clear,
    requestPersistence,
    estimate,
    storageMode,
    MIRROR_KEY,
    LOCAL_SNAPSHOT_KEY
  };
})();
