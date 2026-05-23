import { useState, useEffect } from 'preact/hooks';
import { Router, Route } from 'preact-router';
import { route } from 'preact-router';

import StudentList from './components/StudentList.jsx';
import StudentDetail from './components/StudentDetail.jsx';
import IncidentForm from './components/IncidentForm.jsx';
import PasswordModal from './components/PasswordModal.jsx';
import BackupModal from './components/BackupModal.jsx';
import ConfirmModal from './components/ConfirmModal.jsx';

import { db, getDB } from './db.js';

export default function App() {
  const [students, setStudents] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [unlocked, setUnlocked] = useState(false);
  const [isFirstSetup, setIsFirstSetup] = useState(false);
  const [showModal, setShowModal] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Online/Offline
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Prüfen, ob schon ein Passwort gesetzt ist
  useEffect(() => {
    const checkFirstSetup = async () => {
      try {
        const dbInstance = await getDB();
        const salt = await dbInstance.get('encryptedData', 'salt');
        setIsFirstSetup(!salt);
        setShowModal(true);
      } catch (err) {
        console.error('Init-Fehler:', err);
        setIsFirstSetup(true);
        setShowModal(true);
      }
    };
    checkFirstSetup();
  }, []);

  // Daten laden, sobald entsperrt
  useEffect(() => {
    if (unlocked) {
      refreshData();
    }
  }, [unlocked]);

  const handleUnlock = async (password) => {
    try {
      await db.unlock(password);
      setUnlocked(true);
      setShowModal(false);
      await refreshData();
    } catch (err) {
      console.error(err);
      alert('Falsches Passwort oder Datenbankfehler.');
    }
  };

  const handleSetNewPassword = async (password) => {
    try {
      await db.initPassword(password);
      setUnlocked(true);
      setShowModal(false);
      setIsFirstSetup(false);
      await refreshData();
    } catch (err) {
      console.error(err);
      alert('Fehler beim Setzen des Passworts.');
    }
  };

  const refreshData = async () => {
    if (!unlocked) {
      console.log('⏳ App noch nicht entsperrt');
      return;
    }
    try {
      const freshStudents = await db.getStudents();
      const freshIncidents = await db.getIncidents();

      setStudents(freshStudents);
      setIncidents(freshIncidents);

      console.log(`✅ Geladen: ${freshStudents.length} Schüler, ${freshIncidents.length} Vorfälle`);
    } catch (e) {
      console.error('Fehler beim refreshData:', e);
    }
  };

  const saveIncident = async (newIncident, isEdit = false) => {
  if (!unlocked) return;
  try {
    let allIncidents = await db.getIncidents();
    if (isEdit) {
      allIncidents = allIncidents.map(inc =>
        inc.id === newIncident.id ? newIncident : inc
      );
    } else {
      allIncidents.push({ ...newIncident, id: 'inc_' + Date.now() });
    }
    await db.saveIncidents(allIncidents);
    await refreshData();

    // ← NEU: Success-Modal anzeigen
    setSuccessMessage(isEdit 
      ? "Vorfall erfolgreich aktualisiert!" 
      : "Vorfall erfolgreich gespeichert!"
    );
    setShowSuccessModal(true);

  } catch (e) {
    console.error(e);
    alert('Fehler beim Speichern des Vorfalls.'); // Fehler bleibt als alert (oder auch Modal)
  }
};

  const saveStudents = async (newStudents) => {
    if (!unlocked) return;
    try {
      await db.saveStudents(newStudents);
      await refreshData();
    } catch (e) {
      console.error(e);
    }
  };

  if (showModal) {
    return (
      <PasswordModal
        onUnlock={handleUnlock}
        onSetNewPassword={handleSetNewPassword}
        isFirstSetup={isFirstSetup}
      />
    );
  }

    const handleLogout = () => {
    setUnlocked(false);
    setShowModal(true);
    setStudents([]);
    setIncidents([]);
    
    console.log('👋 Abgemeldet – Passwort wird erneut abgefragt');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="bg-blue-700 text-white shadow-md">
  <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <span className="text-3xl">📋</span>
      <h1 className="text-2xl font-bold">Beobachtungsprotokoll v0.9p</h1>
    </div>
    
    <div className="flex items-center gap-3 text-sm">
  <span className={`px-3 py-1 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}>
    {isOnline ? 'Online' : 'Offline'}
  </span>
  
  <button
    onClick={() => setShowBackupModal(true)}
    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl transition font-medium"
  >
    💾 Backup
  </button>

  <button
    onClick={handleLogout}
    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-xl transition font-medium"
  >
    Abmelden
  </button>
</div>
  </div>
</header>

      <main className="max-w-4xl mx-auto">
        <Router>
          <Route 
            path="/" 
            component={StudentList} 
            students={students} 
            incidents={incidents} 
            refresh={refreshData} 
            saveStudents={saveStudents} 
          />
          <Route 
            path="/student/:id" 
            component={StudentDetail} 
            students={students} 
            incidents={incidents} 
          />

{/* Neuer Vorfall (allgemein) */}
<Route
  path="/new"
  component={IncidentForm}
  students={students}
  incidents={incidents}
  onSave={saveIncident}
  onCancel={() => route('/')}
/>

{/* Neuer Vorfall direkt für einen bestimmten Schüler */}
<Route
  path="/new/:studentId"
  component={IncidentForm}
  students={students}
  incidents={incidents}
  onSave={saveIncident}
  onCancel={(studentId) => route(`/student/${studentId}`)}   // studentId kommt aus URL
/>

{/* Vorfall bearbeiten */}
<Route
  path="/edit/:incidentId"
  component={IncidentForm}
  students={students}
  incidents={incidents}
  onSave={saveIncident}
  onCancel={() => route('/')}
/>
          
          <Route 
            default 
            component={StudentList} 
            students={students} 
            incidents={incidents} 
            refresh={refreshData} 
            saveStudents={saveStudents}
          />
        </Router>
      </main>

      {/* Backup Modal */}
{showBackupModal && (
  <BackupModal onClose={() => setShowBackupModal(false)} />
)}

      {/* NEUES SUCCESS MODAL */}
      {showSuccessModal && (
        <ConfirmModal
          isOpen={true}
          title="✅ Erfolg"
          message={successMessage}
          confirmText="OK"
          cancelText="" 
          onConfirm={() => setShowSuccessModal(false)}
          danger={false}
        />
      )}
    </div>
);
}