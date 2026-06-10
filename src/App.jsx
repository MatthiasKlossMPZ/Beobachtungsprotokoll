import { useState, useEffect } from 'preact/hooks';
import { Router, Route } from 'preact-router';
import { route } from 'preact-router';

import StudentList from './components/StudentList.jsx';
import StudentDetail from './components/StudentDetail.jsx';
import IncidentForm from './components/IncidentForm.jsx';
import PasswordModal from './components/PasswordModal.jsx';
import BackupModal from './components/BackupModal.jsx';
import ConfirmModal from './components/ConfirmModal.jsx';
import HelpButton from './components/HelpButton';

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [incidentToDelete, setIncidentToDelete] = useState(null);
  const [currentStudentId, setCurrentStudentId] = useState(null);
  const [showStudentDeleteModal, setShowStudentDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);

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
    alert('Fehler beim Speichern des Vorfalls.'); 
  }
};

  const requestDeleteIncident = (incident, studentId) => {
    setIncidentToDelete(incident);
    setCurrentStudentId(studentId);
    setShowDeleteModal(true);
  };

  const confirmDeleteIncident = async () => {
    if (!incidentToDelete) return;

    try {
      await db.deleteIncident(incidentToDelete.id);
      await refreshData();

      setSuccessMessage("✅ Der Vorfall wurde erfolgreich gelöscht.");
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('❌ Fehler beim Löschen des Vorfalls.'); // Fallback
    } finally {
      setShowDeleteModal(false);
      setIncidentToDelete(null);
      setCurrentStudentId(null);
    }
  };

    const requestDeleteStudent = (student) => {
    setStudentToDelete(student);
    setShowStudentDeleteModal(true);
  };

  const confirmDeleteStudent = async () => {
    if (!studentToDelete) return;

    try {
      await db.deleteStudent(studentToDelete.id);
      await refreshData();

      setSuccessMessage(`✅ Der Schüler "${studentToDelete.name}" wurde erfolgreich gelöscht.`);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Fehler beim Löschen des Schülers:', error);
      alert('❌ Fehler beim Löschen des Schülers.');
    } finally {
      setShowStudentDeleteModal(false);
      setStudentToDelete(null);
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

  useEffect(() => {
    const handleError = (event) => {
      console.error('Globaler Fehler:', event.error);
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

if (showModal) {
  return (
    <>
      <PasswordModal
        onUnlock={handleUnlock}
        onSetNewPassword={handleSetNewPassword}
        isFirstSetup={isFirstSetup}
      />
      <HelpButton />
    </>
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
      {/* Angepasstes Icon mit korrektem Pfad */}
      <img 
  src="/Beobachtungsprotokoll/pwa-192x192.png" 
  alt="Beobachtungsprotokoll Icon" 
  className="w-10 h-10 rounded-xl object-contain bg-white p-0.5 shadow-sm" 
/>
      
      <div>
        <h1 className="text-2xl font-bold">Beobachtungsprotokoll</h1>
        <p className="text-xs text-blue-200 -mt-1">v0.98c</p>
      </div>
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
            onDeleteStudent={requestDeleteStudent}
          />
          <Route 
            path="/student/:id" 
            component={StudentDetail} 
            students={students} 
            incidents={incidents} 
            onDelete={requestDeleteIncident}
            refresh={refreshData}
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
  onCancel={(studentId) => route(`/student/${studentId}`)}
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
            onDeleteStudent={requestDeleteStudent}
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

      {/* Delete Confirm Modal */}
      {showDeleteModal && incidentToDelete && (
        <ConfirmModal
          isOpen={true}
          title="Vorfall löschen"
          message={`Soll der Vorfall vom ${new Date(incidentToDelete.datum).toLocaleDateString('de-DE')} wirklich GELÖSCHT werden?\n\nDiese Aktion kann NICHT rückgängig gemacht werden!`}
          confirmText="Ja, löschen"
          cancelText="Abbrechen"
          onConfirm={confirmDeleteIncident}
          onCancel={() => {
            setShowDeleteModal(false);
            setIncidentToDelete(null);
          }}
          danger={true}
        />
      )}

            {/* Student Delete Confirm Modal */}
      {showStudentDeleteModal && studentToDelete && (
        <ConfirmModal
          isOpen={true}
          title="Schüler löschen"
          message={`Soll der Schüler "${studentToDelete.name}" wirklich GELÖSCHT werden?\n\nAlle zugehörigen Vorfälle werden ebenfalls gelöscht!\n\nDiese Aktion kann NICHT rückgängig gemacht werden!`}
          confirmText="Ja, löschen"
          cancelText="Abbrechen"
          onConfirm={confirmDeleteStudent}
          onCancel={() => {
            setShowStudentDeleteModal(false);
            setStudentToDelete(null);
          }}
          danger={true}
        />
      )}

      {/* Copyright Footer */}
    <footer className="mt-auto fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-2 text-center text-xs text-slate-500 z-50">
      <div className="max-w-5xl mx-auto px-6 flex justify-between items-center">
        <p>© {new Date().getFullYear()} Matthias Kloß • Beobachtungsprotokoll</p>
        <p className="hidden sm:block">Alle Daten bleiben lokal auf diesem Gerät</p>
      </div>
    </footer>

    {/* Floating Help Button */}
      <HelpButton />

    </div>
);
}