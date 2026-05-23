import { useState, useEffect } from 'preact/hooks';

export default function EditStudentModal({ student, onSave, onClose }) {
  const [name, setName] = useState('');
  const [klasse, setKlasse] = useState('');

  useEffect(() => {
    if (student) {
      setName(student.name || '');
      setKlasse(student.klasse || '');
    }
  }, [student]);

  const handleSave = () => {
    if (!name.trim()) {
      alert('Der Name darf nicht leer sein.');
      return;
    }

    onSave({
      ...student,
      name: name.trim(),
      klasse: klasse.trim() || 'unbekannt'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl max-w-md w-full">
        <div className="p-8">
          <h2 className="text-2xl font-bold mb-6">Schüler bearbeiten</h2>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Name des Schülers</label>
              <input
                type="text"
                value={name}
                onInput={(e) => setName(e.target.value)}
                className="w-full px-5 py-4 border border-slate-300 dark:border-slate-600 rounded-2xl focus:outline-none focus:border-blue-500 text-lg"
                placeholder="Vor- und Nachname"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Klasse / Gruppe</label>
              <input
                type="text"
                value={klasse}
                onInput={(e) => setKlasse(e.target.value)}
                className="w-full px-5 py-4 border border-slate-300 dark:border-slate-600 rounded-2xl focus:outline-none focus:border-blue-500"
                placeholder="z.B. 5a, 7b ..."
              />
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <button
              onClick={onClose}
              className="flex-1 py-4 text-lg font-medium border border-slate-300 dark:border-slate-700 rounded-2xl hover:bg-slate-100"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-4 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-2xl"
            >
              Speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}