import { Link } from 'preact-router';
import { useState } from 'preact/hooks';
import EditStudentModal from './EditStudentModal.jsx';

export default function StudentList({ students = [], incidents = [], refresh, saveStudents }) {
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentKlasse, setNewStudentKlasse] = useState('');
  const [editingStudent, setEditingStudent] = useState(null);

  const addNewStudent = async () => {
    if (!newStudentName.trim()) return alert('Bitte einen Namen eingeben');

    const newStudent = {
      id: 's_' + Date.now(),
      name: newStudentName.trim(),
      klasse: newStudentKlasse.trim() || 'unbekannt',
    };

    const all = [...students, newStudent];
    await saveStudents(all);

    setNewStudentName('');
    setNewStudentKlasse('');
  };

  const startEdit = (student) => {
    setEditingStudent(student);
  };

  const handleSaveEdit = (updatedStudent) => {
    const updatedList = students.map(s =>
      s.id === updatedStudent.id ? updatedStudent : s
    );
    saveStudents(updatedList);
    setEditingStudent(null);
  };

  const deleteStudent = async (student) => {
    if (!confirm(`Soll "${student.name}" wirklich gelöscht werden?\n\nAlle Vorfälle bleiben erhalten.`)) return;

    const updated = students.filter(s => s.id !== student.id);
    await saveStudents(updated);
    if (typeof refresh === 'function') refresh();
  };

  const getLastIncident = (studentId) => {
    return incidents
      .filter(i => i.studentId === studentId)
      .sort((a, b) => new Date(b.datum) - new Date(a.datum))[0];
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Schüler:innen ({students.length})</h2>
        <Link href="/new" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-medium">
          + Neuer Vorfall
        </Link>
      </div>

      {/* Neuer Schüler */}
      <div className="bg-white rounded-3xl p-6 mb-10 shadow">
        <h3 className="font-semibold mb-4">Neuen Schüler hinzufügen</h3>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Name des Schülers"
            value={newStudentName}
            onInput={(e) => setNewStudentName(e.target.value)}
            className="flex-1 px-5 py-4 border border-slate-300 rounded-2xl focus:outline-none focus:border-blue-500"
          />
          <input
            type="text"
            placeholder="Klasse"
            value={newStudentKlasse}
            onInput={(e) => setNewStudentKlasse(e.target.value)}
            className="w-32 px-5 py-4 border border-slate-300 rounded-2xl focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={addNewStudent}
            className="px-8 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl font-medium"
          >
            Hinzufügen
          </button>
        </div>
      </div>

      {/* Schülerliste */}
      <div className="space-y-4">
        {students.length === 0 ? (
          <p className="text-center text-slate-500 py-12">Noch keine Schüler angelegt.</p>
        ) : (
          students.map(student => {
            const last = getLastIncident(student.id);
            return (
              <div key={student.id} className="bg-white rounded-3xl p-6 shadow hover:shadow-lg transition group flex justify-between items-center">
                <Link href={`/student/${student.id}`} className="flex-1">
                  <h3 className="text-xl font-semibold">{student.name}</h3>
                  <p className="text-slate-600">{student.klasse}</p>
                  {last && (
                    <p className="text-xs text-slate-500 mt-1">
                      Letzter Vorfall: {new Date(last.datum).toLocaleDateString('de-DE')}
                    </p>
                  )}
                </Link>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => startEdit(student)}
                    className="px-5 py-3 text-amber-600 hover:bg-amber-50 rounded-2xl text-sm font-medium"
                  >
                    ✏️ Bearbeiten
                  </button>
                  <button
                    onClick={() => deleteStudent(student)}
                    className="px-5 py-3 text-red-600 hover:bg-red-50 rounded-2xl text-sm font-medium"
                  >
                    🗑️ Löschen
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Modal */}
      {editingStudent && (
        <EditStudentModal
          student={editingStudent}
          onSave={handleSaveEdit}
          onClose={() => setEditingStudent(null)}
        />
      )}
    </div>
  );
}