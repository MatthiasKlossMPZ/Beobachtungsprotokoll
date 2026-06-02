import { useState, useEffect, useRef, useMemo } from 'preact/hooks';
import { Link, route } from 'preact-router';
import Chart from 'chart.js/auto';
import { 
  printSingleIncident, 
  printStudentReportWithChart, 
  getVorfallFullName, 
  getSchulbegleiterText 
} from '../utils/printUtils.js';
import { db } from '../db.js';

export default function StudentDetail({ students = [], incidents = [], id }) {
  const [student, setStudent] = useState(null);
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const studentIncidents = useMemo(() => {
  return incidents
    .filter(i => i.studentId === id)
    .sort((a, b) => {
      const dateA = new Date(a.datum);
      const dateB = new Date(b.datum);

      // Fallback für ungültige Daten
      if (isNaN(dateA.getTime())) return 1;
      if (isNaN(dateB.getTime())) return -1;

      return dateB.getTime() - dateA.getTime();
    });
}, [incidents, id]);

  // Student laden
  useEffect(() => {
    const found = students.find(s => s.id === id);
    if (found) setStudent(found);
    else route('/');
  }, [students, id]);

// Diagramm
useEffect(() => {
  if (chartInstanceRef.current) {
    chartInstanceRef.current.destroy();
    chartInstanceRef.current = null;
  }

  if (studentIncidents.length === 0) return;

  const createChart = () => {
    if (!chartRef.current) {
      requestAnimationFrame(createChart);
      return;
    }

    try {
      // Für das Diagramm chronologisch sortieren: älteste zuerst
      const chartIncidents = [...studentIncidents].sort((a, b) => {
        return new Date(a.datum) - new Date(b.datum);
      });

      const labels = chartIncidents.map(i => {
        const date = new Date(i.datum);
        return date.toLocaleDateString('de-DE', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      });

      chartInstanceRef.current = new Chart(chartRef.current, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Intensität',
              data: chartIncidents.map(i => i.intensitaet === 0 ? null : i.intensitaet),
              borderColor: '#e11d48',
              backgroundColor: 'rgba(225, 29, 72, 0.1)',
              borderWidth: 4,
              tension: 0.35,
              pointRadius: 5,
              spanGaps: false,
            },
            {
              label: 'Wiederholungsgefahr',
              data: chartIncidents.map(i => i.wiederholungsgefahr === 0 ? null : i.wiederholungsgefahr),
              borderColor: '#d97706',
              backgroundColor: 'rgba(217, 119, 6, 0.1)',
              borderWidth: 3,
              tension: 0.35,
              spanGaps: false,
            },
            {
              label: 'Wirkung der Maßnahme',
              data: chartIncidents.map(i => i.wirkung === 0 ? null : i.wirkung),
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderWidth: 3,
              tension: 0.35,
              spanGaps: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top' },
            tooltip: {
              callbacks: {
                label: (context) => {
                  if (context.raw === null || context.raw === 0) return 'nicht bekannt';
                  return context.raw;
                }
              }
            }
          },
          scales: {
            x: { reverse: false },
            y: { 
              min: 0,
              max: 5, 
              ticks: { 
              stepSize: 1,
              callback: function(value) {
              if (value === 0) return 'nicht bekannt';
              return value;
          }
    }
  }
          },
        },
      });
    } catch (e) {
      console.error('❌ Chart Fehler:', e);
    }
  };

  requestAnimationFrame(() => requestAnimationFrame(createChart));
}, [studentIncidents]);

  const getIntensityStyle = (level) => {
    switch (level) {
      case 1: return "bg-emerald-100 text-emerald-700";
      case 2: return "bg-yellow-100 text-yellow-700";
      case 3: return "bg-orange-100 text-orange-700";
      case 4: return "bg-red-100 text-red-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };  
  
  const handlePrintIncident = (incident) => {
    if (student) printSingleIncident(incident, student.name);
  };

  const handlePrintFullReport = () => {
    if (student && studentIncidents.length > 0) {
      printStudentReportWithChart(
        { name: student.name, klasse: student.klasse },
        studentIncidents,
        chartInstanceRef
      );
    }
  };

  // ==================== LÖSCH-FUNKTION ====================
  const handleDeleteIncident = async (incident) => {
    const confirmText = `Soll der Vorfall vom ${new Date(incident.datum).toLocaleDateString('de-DE')} wirklich GELÖSCHT werden?\n\nDiese Aktion kann NICHT rückgängig gemacht werden!`;

    if (!window.confirm(confirmText)) return;

    try {
      await db.deleteIncident(incident.id);
      alert('✅ Der Vorfall wurde erfolgreich gelöscht.');
      window.location.reload();
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('❌ Fehler beim Löschen des Vorfalls.');
    }
  };

  if (!student) return <div className="p-8 text-center">Lade Schüler...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-blue-700 text-white p-4 shadow sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-white/80 hover:text-white">← Alle Schüler</Link>
            <div>
              <h2 className="text-3xl font-bold">{student.name}</h2>
              <p className="text-blue-100">{student.klasse}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href={`/new/${id}`} className="bg-white text-blue-700 px-6 py-3 rounded-2xl font-medium">
              + Neuer Vorfall
            </Link>
            <button onClick={handlePrintFullReport} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-medium">
              📄 Gesamtbericht drucken
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 pt-8 pb-12">
        {/* Statistik */}
<div className="grid md:grid-cols-3 gap-6 mb-10">
  <div className="bg-white rounded-3xl p-6 text-center shadow-sm">
    <p className="text-slate-500">Vorfälle</p>
    <p className="text-5xl font-bold mt-2">{studentIncidents.length}</p>
  </div>
  
  <div className="bg-white rounded-3xl p-6 text-center shadow-sm">
    <p className="text-slate-500">Ø Intensität</p>
    <p className="text-5xl font-bold text-rose-600 mt-2">
      {(() => {
        const valid = studentIncidents.filter(i => i.intensitaet > 0);
        return valid.length 
          ? (valid.reduce((sum, i) => sum + i.intensitaet, 0) / valid.length).toFixed(1) 
          : '—';
      })()}
    </p>
  </div>

  <div className="bg-white rounded-3xl p-6 text-center shadow-sm">
    <p className="text-slate-500">Ø Wirkung</p>
    <p className="text-5xl font-bold text-emerald-600 mt-2">
      {(() => {
        const valid = studentIncidents.filter(i => i.wirkung > 0);
        return valid.length 
          ? (valid.reduce((sum, i) => sum + i.wirkung, 0) / valid.length).toFixed(1) 
          : '—';
      })()}
    </p>
  </div>
</div>

        {/* Diagramm */}
        {studentIncidents.length > 0 && (
          <div className="bg-white rounded-3xl p-8 shadow mb-10">
            <h3 className="font-semibold mb-6 text-lg">Entwicklung über die Zeit</h3>
            <div className="h-[420px] w-full border border-slate-100 rounded-2xl overflow-hidden">
              <canvas ref={chartRef} className="w-full h-full" />
            </div>
          </div>
        )}

        {/* Vorfall-Liste */}
        <div className="space-y-6">
          <h3 className="font-semibold text-lg mb-4">Dokumentierte Vorfälle ({studentIncidents.length})</h3>
          
          {studentIncidents.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-500">
              Noch keine Vorfälle dokumentiert.
            </div>
          ) : (
            studentIncidents.map((inc) => (
              <div key={inc.id} className="bg-white rounded-3xl p-6 shadow hover:shadow-md transition">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    {/* Kopfzeile */}
                    <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mb-4">
                      <div className="font-semibold text-lg text-slate-800">
                        {inc.vorfallCodes && inc.vorfallCodes.length > 0
                          ? inc.vorfallCodes.map(code => getVorfallFullName(code)).join(' / ')
                          : 'Unbekannter Vorfall'}
                      </div>
                      <p className="text-sm text-slate-500">
                        {new Date(inc.datum).toLocaleDateString('de-DE', {
                        weekday: 'short',
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                        })}
                      </p>
                      <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${getIntensityStyle(inc.intensitaet)}`}>
                        {inc.intensitaet}
                      </span>
                    </div>

                    {/* Beschreibung */}
                    <p className="text-slate-700 leading-relaxed mb-5">
                      {inc.vorfallBeschreibung || 'Keine Beschreibung vorhanden.'}
                    </p>

                    {/* Unten: Maßnahmen + Schulbegleiter */}
                    <div className="space-y-4">
                      {inc.massnahmenCodes?.length > 0 && (
                        <div>
                          <p className="text-xs uppercase tracking-widest text-emerald-600 mb-1">Ergriffene Maßnahmen</p>
                          <div className="flex flex-wrap gap-2">
                            {inc.massnahmenCodes.map(c => (
                              <span key={c} className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {inc.schulbegleiterCode && (
                        <div>
                          <p className="text-xs uppercase tracking-widest text-slate-600 mb-1">Schulbegleiter</p>
                          <p className="text-sm font-medium text-slate-700">
                            {getSchulbegleiterText(inc.schulbegleiterCode)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-col gap-3 w-40">
                    <button
                      onClick={() => handlePrintIncident(inc)}
                      className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-medium transition"
                    >
                      📄 Einzeln drucken
                    </button>
                    <Link
                      href={`/edit/${inc.id}`}
                      className="px-5 py-3 bg-amber-600 hover:bg-amber-700 text-white text-center rounded-2xl text-sm font-medium transition"
                    >
                      ✏️ Bearbeiten
                    </Link>
                    <button
                      onClick={() => handleDeleteIncident(inc)}
                      className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-sm font-medium transition flex items-center justify-center gap-2"
  >
                      🗑️ Löschen
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}