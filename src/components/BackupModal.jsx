import { useState } from 'preact/hooks';
import { db } from '../db.js';

export default function BackupModal({ onClose }) {
  const [mode, setMode] = useState('export'); // 'export' | 'import'
  const [backupPassword, setBackupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');

  const handleExport = async () => {
    if (!backupPassword) {
      setMessage('Bitte ein Backup-Passwort eingeben.');
      return;
    }
    if (backupPassword.length < 6) {
      setMessage('Das Backup-Passwort sollte mindestens 6 Zeichen lang sein.');
      return;
    }

    setIsProcessing(true);
    setMessage('');

    try {
      await db.exportBackup(backupPassword);
      setMessage('✅ Backup erfolgreich heruntergeladen!');
      setTimeout(onClose, 1500);
    } catch (err) {
      console.error(err);
      setMessage('❌ Fehler beim Export: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setMessage('Bitte eine Backup-Datei auswählen.');
      return;
    }
    if (!backupPassword) {
      setMessage('Bitte das Backup-Passwort eingeben.');
      return;
    }

    if (!confirm('⚠️ ACHTUNG: Alle aktuellen Daten werden überschrieben!\n\nWirklich fortfahren?')) {
      return;
    }

    setIsProcessing(true);
    setMessage('');

    try {
      await db.importBackup(selectedFile, backupPassword);
      // Wird in importBackup bereits neu geladen
    } catch (err) {
      console.error(err);
      setMessage('❌ Import fehlgeschlagen: ' + err.message);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Backup & Wiederherstellung</h2>
          <button onClick={onClose} className="text-3xl leading-none text-slate-400 hover:text-slate-600">×</button>
        </div>

        <div className="p-6">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6">
            <button
              onClick={() => setMode('export')}
              className={`flex-1 py-3 text-center font-medium rounded-t-xl ${mode === 'export' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              Backup erstellen
            </button>
            <button
              onClick={() => setMode('import')}
              className={`flex-1 py-3 text-center font-medium rounded-t-xl ${mode === 'import' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              Backup einspielen
            </button>
          </div>

          {mode === 'export' && (
            <div className="space-y-5">
              <p className="text-slate-600 dark:text-slate-400">
                Erstelle eine verschlüsselte Sicherungskopie. Verwende ein starkes Passwort.
              </p>
              <input
                type="password"
                placeholder="Backup-Passwort"
                value={backupPassword}
                onInput={(e) => setBackupPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-2xl focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleExport}
                disabled={isProcessing}
                className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-2xl transition disabled:opacity-70"
              >
                {isProcessing ? 'Wird erstellt...' : 'Backup herunterladen'}
              </button>
            </div>
          )}

          {mode === 'import' && (
            <div className="space-y-5">
              <p className="text-amber-600 dark:text-amber-400 font-medium">
                ⚠️ Alle aktuellen Daten werden ersetzt!
              </p>
              
              <input
                type="file"
                accept=".enc.json"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                className="w-full text-sm"
              />

              <input
                type="password"
                placeholder="Backup-Passwort"
                value={backupPassword}
                onInput={(e) => setBackupPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-2xl focus:outline-none focus:border-blue-500"
              />

              <button
                onClick={handleImport}
                disabled={isProcessing || !selectedFile}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-2xl transition disabled:opacity-70"
              >
                {isProcessing ? 'Wird wiederhergestellt...' : 'Backup einspielen'}
              </button>
            </div>
          )}

          {message && (
            <p className="mt-4 text-center text-sm font-medium p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}