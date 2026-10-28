import { openDB } from 'idb';
import { validatePassword } from './utils/passwordPolicy';

// ============== Konstanten ==============
const DB_NAME = 'BeobachtungsprotokollDB';
const STORE_NAME = 'encryptedData';
const DB_VERSION = 1;

let dbPromise = null;
let encryptionKey = null;   // bleibt global im Modul

// ============== Crypto Helper ==============
async function deriveKey(password, salt) {
  const baseKey = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encrypt(data, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(data));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);

  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  return combined;
}

async function decrypt(combined, key) {
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, encrypted);
  return JSON.parse(new TextDecoder().decode(decrypted));
}

function assertStrongPassword(password) {
  const { ok, message } = validatePassword(password);
  if (!ok) throw new Error(message);
}

// ============== getDB ==============
async function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      }
    });
  }
  return dbPromise;
}

export async function resetAppData() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase('BeobachtungsprotokollDB');

    request.onsuccess = () => {
      console.log('[DB] BeobachtungsprotokollDB erfolgreich gelöscht');
      resolve();
    };

    request.onerror = (event) => {
      console.error('[DB] Fehler beim Löschen der Datenbank', event);
      reject(event.target.error);
    };

    request.onblocked = () => {
      console.warn('[DB] Datenbank-Löschung blockiert (offene Verbindungen). Seite wird neu geladen...');
      // Fallback: nach kurzer Zeit neu laden
      setTimeout(() => window.location.reload(), 500);
    };
  });
}

// ============== Haupt-DB API ==============
export const db = {
  async initPassword(password) {
    assertStrongPassword(password);

    const salt = crypto.getRandomValues(new Uint8Array(16));
    encryptionKey = await deriveKey(password, salt);

    const emptyData = { students: [], incidents: [] };
    const encrypted = await encrypt(emptyData, encryptionKey);

    const dbInstance = await getDB();
    await dbInstance.put(STORE_NAME, encrypted, 'data');
    await dbInstance.put(STORE_NAME, salt, 'salt');
  },

  async unlock(password) {
    const dbInstance = await getDB();
    const salt = await dbInstance.get(STORE_NAME, 'salt');
    if (!salt) throw new Error('No password set yet');

    encryptionKey = await deriveKey(password, salt);

    const encrypted = await dbInstance.get(STORE_NAME, 'data');
    await decrypt(encrypted, encryptionKey); // Test

    return true;
  },

  // === Verbesserte Methoden mit besserem Schutz ===
  async getStudents() {
    if (!encryptionKey) throw new Error('Database not unlocked - encryptionKey missing');
    const dbInstance = await getDB();
    const encrypted = await dbInstance.get(STORE_NAME, 'data');
    const data = await decrypt(encrypted, encryptionKey);
    return data.students || [];
  },

  async getIncidents() {
    if (!encryptionKey) throw new Error('Database not unlocked - encryptionKey missing');
    const dbInstance = await getDB();
    const encrypted = await dbInstance.get(STORE_NAME, 'data');
    const data = await decrypt(encrypted, encryptionKey);
    return data.incidents || [];
  },

  async saveStudents(students) {
    if (!encryptionKey) throw new Error('Database not unlocked - encryptionKey missing');
    const dbInstance = await getDB();
    const encryptedData = await dbInstance.get(STORE_NAME, 'data');
    let current = await decrypt(encryptedData, encryptionKey);

    current.students = students;

    const newEncrypted = await encrypt(current, encryptionKey);
    await dbInstance.put(STORE_NAME, newEncrypted, 'data');
  },

  async saveIncidents(incidents) {
    if (!encryptionKey) throw new Error('Database not unlocked - encryptionKey missing');
    const dbInstance = await getDB();
    const encryptedData = await dbInstance.get(STORE_NAME, 'data');
    let current = await decrypt(encryptedData, encryptionKey);

    current.incidents = incidents;

    const newEncrypted = await encrypt(current, encryptionKey);
    await dbInstance.put(STORE_NAME, newEncrypted, 'data');
  },

  async exportEncrypted() {
    const dbInstance = await getDB();
    const data = await dbInstance.get(STORE_NAME, 'data');
    const salt = await dbInstance.get(STORE_NAME, 'salt');

    const blob = new Blob([JSON.stringify({
      data: Array.from(data),
      salt: Array.from(salt)
    })], { type: 'application/json' });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beobachtungsprotokoll_backup_${new Date().toISOString().slice(0,10)}.enc.json`;
    a.click();
  },

// ==================== BACKUP & RESTORE ====================

async exportBackup(backupPassword) {
  if (!encryptionKey) throw new Error('Datenbank muss entsperrt sein');
  assertStrongPassword(backupPassword);

  const students = await this.getStudents();
  const incidents = await this.getIncidents();

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const backupKey = await deriveKey(backupPassword, salt);

  const payload = {
    version: 2,
    timestamp: new Date().toISOString(),
    students,
    incidents
  };

  const encrypted = await encrypt(payload, backupKey);

  const backupBlob = new Blob([JSON.stringify({
    version: 2,
    salt: Array.from(salt),
    encrypted: Array.from(encrypted)
  })], { type: 'application/json' });

  const url = URL.createObjectURL(backupBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `beobachtungsprotokoll_backup_${new Date().toISOString().slice(0, 10)}.enc.json`;
  a.click();
  URL.revokeObjectURL(url);
},

async importBackup(file, backupPassword) {
  if (!encryptionKey) throw new Error('Datenbank muss entsperrt sein');
  if (!file) throw new Error('Keine Datei ausgewählt');

  const text = await file.text();
  const backup = JSON.parse(text);

  // === Neues Format (Version 2) ===
  if (backup.version === 2) {
    const data = await this._decryptBackupV2(backup, backupPassword);

    await this.saveStudents(data.students || []);
    await this.saveIncidents(data.incidents || []);

    window.location.reload();
    return;
  }

  // === Altes Format (ohne version oder version !== 2) ===
  try {
    const salt = new Uint8Array(backup.salt);
    const backupKey = await deriveKey(backupPassword, salt);
    const encryptedData = new Uint8Array(backup.encrypted);
    const decrypted = await decrypt(encryptedData, backupKey);

    const dbInstance = await getDB();
    await dbInstance.put(STORE_NAME, new Uint8Array(decrypted.data), 'data');
    await dbInstance.put(STORE_NAME, salt, 'salt');

    window.location.reload();
  } catch (err) {
    console.error(err);
    throw new Error('Backup konnte nicht gelesen werden. Falsches Passwort oder beschädigte Datei.');
  }
},

async importMerge(file, backupPassword) {
  if (!encryptionKey) throw new Error('Datenbank muss entsperrt sein');
  if (!file) throw new Error('Keine Datei ausgewählt');

  const text = await file.text();
  const backup = JSON.parse(text);

  if (backup.version !== 2) {
    throw new Error('Dieses Backup-Format unterstützt keinen Teilimport. Bitte zuerst ein neues Backup erstellen.');
  }

  const backupData = await this._decryptBackupV2(backup, backupPassword);
  const backupStudents = backupData.students || [];
  const backupIncidents = backupData.incidents || [];

  const localStudents = await this.getStudents();
  const localIncidents = await this.getIncidents();

  const normalize = (name) => name.trim().toLowerCase().replace(/\s+/g, ' ');

  // Schüler-Mapping
  const studentMap = new Map(); // backupId → localId
  const localByName = new Map();
  for (const s of localStudents) {
    localByName.set(normalize(s.name), s);
  }

  const mergedStudents = [...localStudents];

  for (const bs of backupStudents) {
    const key = normalize(bs.name);
    if (localByName.has(key)) {
      studentMap.set(bs.id, localByName.get(key).id);
    } else {
      const newId = 's_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
      const newStudent = { ...bs, id: newId };
      mergedStudents.push(newStudent);
      localByName.set(key, newStudent);
      studentMap.set(bs.id, newId);
    }
  }

  // Fingerprint für Duplikat-Erkennung
  const fingerprint = (inc) => [
    inc.datum || '',
    (inc.vorfallBeschreibung || '').trim(),
    (inc.massnahmenBeschreibung || '').trim(),
    JSON.stringify([...(inc.vorfallCodes || [])].sort()),
    JSON.stringify([...(inc.massnahmenCodes || [])].sort()),
    inc.schulbegleiterCode || '',
    inc.wiederholungsgefahr ?? '',
    inc.wirkung ?? '',
    inc.intensitaet ?? ''
  ].join('|');

  const existing = new Set();
  for (const inc of localIncidents) {
    existing.add(inc.studentId + '|' + fingerprint(inc));
  }

  const mergedIncidents = [...localIncidents];
  let added = 0;

  for (const bi of backupIncidents) {
    const localStudentId = studentMap.get(bi.studentId);
    if (!localStudentId) continue;

    const fp = localStudentId + '|' + fingerprint(bi);
    if (existing.has(fp)) continue;

    const newInc = {
      ...bi,
      id: 'inc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      studentId: localStudentId
    };
    mergedIncidents.push(newInc);
    existing.add(fp);
    added++;
  }

  await this.saveStudents(mergedStudents);
  await this.saveIncidents(mergedIncidents);

  return {
    studentsAdded: mergedStudents.length - localStudents.length,
    incidentsAdded: added,
    incidentsSkipped: backupIncidents.length - added
  };
},

// Hilfsfunktion nur für neues Format (Version 2)
async _decryptBackupV2(backup, backupPassword) {
  const salt = new Uint8Array(backup.salt);
  const backupKey = await deriveKey(backupPassword, salt);
  const decrypted = await decrypt(new Uint8Array(backup.encrypted), backupKey);

  if (!decrypted.students && !decrypted.incidents) {
    throw new Error('Ungültiges Backup-Format');
  }

  return decrypted; // { version, timestamp, students, incidents }
},


// ==================== DELETE INCIDENT ====================
async deleteIncident(incidentId) {
  if (!encryptionKey) throw new Error('Database not unlocked');

  const dbInstance = await getDB();
  const encryptedData = await dbInstance.get(STORE_NAME, 'data');
  let current = await decrypt(encryptedData, encryptionKey);

  // Vorfall löschen
  const initialLength = current.incidents.length;
  current.incidents = current.incidents.filter(inc => inc.id !== incidentId);

  if (current.incidents.length === initialLength) {
    throw new Error('Vorfall nicht gefunden');
  }

  // Wieder verschlüsseln und speichern
  const newEncrypted = await encrypt(current, encryptionKey);
  await dbInstance.put(STORE_NAME, newEncrypted, 'data');

  console.log(`✅ Vorfall ${incidentId} gelöscht`);
  return true;
},

  // ==================== DELETE STUDENT ====================
  async deleteStudent(studentId) {
    if (!encryptionKey) throw new Error('Database not unlocked');

    const dbInstance = await getDB();
    const encryptedData = await dbInstance.get(STORE_NAME, 'data');
    let current = await decrypt(encryptedData, encryptionKey);

    // Schüler löschen
    const initialStudentCount = current.students.length;
    current.students = current.students.filter(s => s.id !== studentId);

    if (current.students.length === initialStudentCount) {
      throw new Error('Schüler nicht gefunden');
    }

    // Zugehörige Vorfälle ebenfalls löschen (wie im Modal angekündigt)
    current.incidents = current.incidents.filter(inc => inc.studentId !== studentId);

    // Wieder verschlüsseln und speichern
    const newEncrypted = await encrypt(current, encryptionKey);
    await dbInstance.put(STORE_NAME, newEncrypted, 'data');

    console.log(`✅ Schüler ${studentId} und zugehörige Vorfälle gelöscht`);
    return true;
  },

};

export { getDB };