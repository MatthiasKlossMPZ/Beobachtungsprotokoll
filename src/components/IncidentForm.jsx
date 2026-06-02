import { useState, useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import {
  VORFALL_CODES,
  MASSNAHMEN_CODES,
  MASSNAHMEN_FARBEN,
  SCHULBEGLEITER_CODES,
  WIEDERHOLUNGSGEFAHR,
  WIRKUNG,
  INTENSITAET
} from '../constants.js';
import ConfirmModal from './ConfirmModal.jsx';

export default function IncidentForm({
  students = [],
  incidents = [],
  onSave,
  onCancel,
  incidentId
}) {
  const isEdit = !!incidentId;
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [form, setForm] = useState({
    studentId: '',
    datum: new Date().toISOString().slice(0, 16),
    vorfallBeschreibung: '',
    massnahmenBeschreibung: '',
    vorfallCodes: [],
    massnahmenCodes: [],
    schulbegleiterCode: '',
    wiederholungsgefahr: 0,
    wirkung: 0,
    intensitaet: 0
  });

  const [saving, setSaving] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);

  // Vorfall beim Bearbeiten laden
  useEffect(() => {
    if (isEdit && incidents?.length && incidentId) {
      const found = incidents.find(i => i.id === incidentId);
      if (found) {
        setForm({
          studentId: found.studentId || '',
          datum: found.datum?.slice(0, 16) || new Date().toISOString().slice(0, 16),
          vorfallBeschreibung: found.vorfallBeschreibung || '',
          massnahmenBeschreibung: found.massnahmenBeschreibung || '',
          vorfallCodes: found.vorfallCodes || [],
          massnahmenCodes: found.massnahmenCodes || [],
          schulbegleiterCode: found.schulbegleiterCode || '',
          wiederholungsgefahr: found.wiederholungsgefahr || 0,
          wirkung: found.wirkung || 0,
          intensitaet: found.intensitaet || 0
        });
      }
    }
  }, [isEdit, incidentId, incidents]);

  // Dirty-Check für Abbrechen
  const isDirty = form.vorfallBeschreibung.trim() !== '' ||
                  form.massnahmenBeschreibung.trim() !== '' ||
                  form.vorfallCodes.length > 0 ||
                  form.massnahmenCodes.length > 0 ||
                  form.schulbegleiterCode !== '';

  const toggleCode = (field, code) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(code)
        ? prev[field].filter(c => c !== code)
        : [...prev[field], code]
    }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  // Neue Sicherung gegen Abbruch
  if (isCancelled) return;

  if (!form.studentId) {
    alert("Bitte einen Schüler auswählen!");
    return;
  }

  setSaving(true);

  const incident = {
    ...form,
    id: isEdit ? incidentId : 'inc_' + Date.now(),
    createdAt: isEdit ? form.createdAt : new Date().toISOString()
  };

  try {
    await onSave(incident, isEdit);
    // Navigation nur, wenn nicht abgebrochen
    setTimeout(() => {
      route(`/student/${form.studentId}`);
    }, 800);
  } catch (err) {
    console.error(err);
  } finally {
    setSaving(false);
  }
};

// ==================== ABBRUCH-LOGIK ====================
const handleCancel = () => {
  const hasChanges = 
    form.studentId ||
    (form.vorfallBeschreibung && form.vorfallBeschreibung.trim() !== '') ||
    (form.vorfallCodes?.length > 0) ||
    (form.massnahmenCodes?.length > 0) ||
    form.schulbegleiterCode ||
    form.wiederholungsgefahr !== 0 ||   // Default-Wert
    form.wirkung !== 0 ||
    form.intensitaet !== 0;

  if (hasChanges) {
    setShowCancelModal(true);
  } else {
    if (form.studentId) {
      route(`/student/${form.studentId}`);
    } else {
      route('/');
    }
  }
};

const handleCancelConfirm = () => {
  setShowCancelModal(false);
  setIsCancelled(true);

  if (form.studentId) {
    setTimeout(() => {
      route(`/student/${form.studentId}`);
    }, 80);
  } else {
    setTimeout(() => {
      route('/');
    }, 80);
  }
};
  // Esc-Taste zum Abbrechen
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') handleCancel();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isDirty]);

  return (
  <>
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">
        {isEdit ? "Vorfall bearbeiten" : "Neuer Vorfall"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Schüler */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Schüler:in <span className="text-red-500">*</span>
          </label>
          <select
            value={form.studentId}
            onChange={e => setForm({ ...form, studentId: e.target.value })}
            className="w-full p-4 border rounded-2xl bg-white focus:ring-2 focus:ring-blue-500"
            required
            disabled={students.length === 0}
          >
            <option value="">— Schüler auswählen —</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.klasse})
              </option>
            ))}
          </select>
          {students.length === 0 && (
            <div className="mt-3 bg-amber-50 border border-amber-300 rounded-2xl p-4">
              <p className="text-amber-800 font-medium">Noch keine Schüler erfasst.</p>
              <button
                type="button"
                onClick={() => route('/students')}
                className="mt-2 text-blue-600 hover:underline font-medium"
              >
                → Jetzt Schüler anlegen
              </button>
            </div>
          )}
        </div>

        {/* Datum */}
        <div>
          <label className="block text-sm font-medium mb-2">Datum & Uhrzeit</label>
          <input
            type="datetime-local"
            value={form.datum}
            onChange={e => setForm({ ...form, datum: e.target.value })}
            className="w-full p-4 border rounded-2xl focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Vorfall Codes */}
        <div>
          <label className="block text-sm font-medium mb-3">Art des Vorfalls (Mehrfachauswahl)</label>
          <div className="flex flex-wrap gap-3">
            {VORFALL_CODES.map(item => (
              <button
                type="button"
                key={item.code}
                onClick={() => toggleCode('vorfallCodes', item.code)}
                className={`px-5 py-3 rounded-2xl text-sm font-medium transition-all border
                  ${form.vorfallCodes.includes(item.code)
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white border-slate-300 hover:border-slate-400'}`}
              >
                <strong>{item.code}</strong> — {item.bedeutung}
              </button>
            ))}
          </div>
        </div>

        {/* Beschreibung */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Detaillierte Beschreibung <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.vorfallBeschreibung}
            onChange={e => setForm({ ...form, vorfallBeschreibung: e.target.value })}
            rows="4"
            className="w-full p-4 border rounded-3xl focus:ring-2 focus:ring-blue-500"
            placeholder="Was genau ist passiert?"
            required
          />
        </div>

        {/* Maßnahmen */}
        <div>
          <label className="block text-sm font-medium mb-3">Ergriffene Maßnahmen</label>
          <div className="flex flex-wrap gap-3">
            {MASSNAHMEN_CODES.map((item) => {
              const isSelected = form.massnahmenCodes.includes(item.code);
              const farbe = MASSNAHMEN_FARBEN[item.code];     // Holt "amber" oder undefined

              return (
               <button
                type="button"
                key={item.code}
                onClick={() => toggleCode('massnahmenCodes', item.code)}
                className={`px-4 py-3 rounded-2xl text-sm font-medium border transition-all
                  ${isSelected 
                    ? farbe 
                      ? `bg-amber-600 text-white border-amber-600 shadow-sm` 
                      : `bg-emerald-600 text-white border-emerald-600`
                    : farbe 
                      ? `bg-amber-100 border-amber-200 hover:bg-amber-200 text-amber-800` 
                      : `bg-white border-slate-300 hover:bg-slate-50 hover:border-slate-400`
                  }`}
                >
                  {item.code} — {item.bedeutung}
                </button>
              );
            })}
          </div>
        </div>

        {/* Schulbegleiter */}
        <div>
          <label className="block text-sm font-medium mb-3">Schulbegleiter</label>
          <div className="grid grid-cols-2 gap-3">
            {SCHULBEGLEITER_CODES.map(item => (
              <label
                key={item.code}
                className={`flex items-center gap-2 p-4 border rounded-2xl cursor-pointer transition-all
                  ${form.schulbegleiterCode === item.code
                    ? 'bg-blue-100 border-blue-600'
                    : 'bg-white border-slate-300 hover:border-slate-400'}`}
              >
                <input
                  type="radio"
                  name="schulbegleiter"
                  checked={form.schulbegleiterCode === item.code}
                  onChange={() => setForm({ ...form, schulbegleiterCode: item.code })}
                  className="hidden"
                />
                <span>{item.code} – {item.bedeutung}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Skalen */}
        <div className="grid md:grid-cols-3 gap-8">
          <ScaleSelector
            label="Wiederholungsgefahr"
            options={WIEDERHOLUNGSGEFAHR}
            value={form.wiederholungsgefahr}
            onChange={v => setForm({ ...form, wiederholungsgefahr: v })}
          />
          <ScaleSelector
            label="Wirkung der Maßnahme"
            options={WIRKUNG}
            value={form.wirkung}
            onChange={v => setForm({ ...form, wirkung: v })}
          />
          <ScaleSelector
            label="Intensität"
            options={INTENSITAET}
            value={form.intensitaet}
            onChange={v => setForm({ ...form, intensitaet: v })}
          />
        </div>

        {/* Buttons */}
<div className="flex gap-4 pt-8 border-t">
  <button
    type="button"                    // ← Das war das Hauptproblem!
    onClick={handleCancel}
    className="px-6 py-3 text-slate-600 font-medium hover:bg-slate-100 rounded-2xl transition flex items-center gap-2"
  >
    Abbrechen
  </button>

  <button
    type="submit"
    disabled={saving || !form.studentId}
    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white py-5 rounded-3xl text-lg font-semibold transition"
  >
    {saving ? 'Speichere...' : (isEdit ? "Änderungen speichern" : "Vorfall speichern")}
  </button>
        </div>
      </form>
    </div>

    {/* ==================== CONFIRM MODAL ==================== */}
    <ConfirmModal
      isOpen={showCancelModal}
      title="Vorgang abbrechen?"
      message="Möchtest du wirklich abbrechen? Alle eingegebenen Daten gehen verloren."
      confirmText="Ja, verwerfen"
      cancelText="Zurück zum Formular"
      danger={true}
      onConfirm={handleCancelConfirm}
      onCancel={() => setShowCancelModal(false)}
    />
  </>
);
}

// ScaleSelector Komponente
function ScaleSelector({ label, options, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-3 text-slate-700">{label}</label>
      <div className="flex gap-3 justify-center">
        {options.map(opt => {
          const isSelected = value === opt.wert;
          return (
            <button
              key={opt.wert}
              type="button"
              onClick={() => onChange(opt.wert)}
              className={`w-16 h-16 rounded-3xl flex items-center justify-center text-3xl font-black transition-all border-2 shadow-md
                ${isSelected
                  ? 'bg-blue-700 text-white border-white scale-110 shadow-2xl ring-4 ring-blue-300'
                  : 'bg-white border-slate-300 hover:border-slate-400 hover:shadow-lg text-slate-900'}`}
            >
              {opt.wert}
            </button>
          );
        })}
      </div>
      <p className="text-center text-sm font-medium text-slate-600 mt-3">
        {options.find(o => o.wert === value)?.text || ' '}
      </p>
    </div>
  );
}