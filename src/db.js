import { openDB } from 'idb';

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

// ============== Haupt-DB API ==============
export const db = {
  async initPassword(password) {
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

    const dbInstance = await getDB();
    const encryptedData = await dbInstance.get(STORE_NAME, 'data');
    const salt = await dbInstance.get(STORE_NAME, 'salt');

    // Backup mit eigenem Passwort verschlüsseln
    const backupKey = await deriveKey(backupPassword, salt);
    const backupEncrypted = await encrypt({ 
      version: 1, 
      timestamp: new Date().toISOString(),
      data: Array.from(encryptedData) 
    }, backupKey);

    const backupBlob = new Blob([JSON.stringify({
      salt: Array.from(salt),
      encrypted: Array.from(backupEncrypted)
    })], { type: 'application/json' });

    const url = URL.createObjectURL(backupBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beobachtungsprotokoll_backup_${new Date().toISOString().slice(0,10)}.enc.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  async importBackup(file, backupPassword) {
    if (!file) throw new Error('Keine Datei ausgewählt');

    const text = await file.text();
    const backup = JSON.parse(text);

    const salt = new Uint8Array(backup.salt);
    const backupKey = await deriveKey(backupPassword, salt);

    const encryptedData = new Uint8Array(backup.encrypted);
    const decrypted = await decrypt(encryptedData, backupKey);

    // In aktuelle DB übernehmen
    const dbInstance = await getDB();
    await dbInstance.put(STORE_NAME, new Uint8Array(decrypted.data), 'data');
    await dbInstance.put(STORE_NAME, salt, 'salt');

    // App neu starten
    window.location.reload();
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
}

};

export { getDB };