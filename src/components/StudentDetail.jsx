import { useState, useEffect, useRef, useMemo } from 'preact/hooks';
import { Link, route } from 'preact-router';
import Chart from 'chart.js/auto';
import { printSingleIncident, printStudentReportWithChart } from '../utils/printUtils.js';

export default function StudentDetail({ students = [], incidents = [], id }) {
  const [student, setStudent] = useState(null);
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const studentIncidents = useMemo(() => 
    incidents
      .filter(i => i.studentId === id)
      .sort((a, b) => new Date(b.datum) - new Date(a.datum))
  , [incidents, id]);

  // Student laden
  useEffect(() => {
    const found = students.find(s => s.id === id);
    if (found) setStudent(found);
    else route('/');
  }, [students, id]);

  // Diagramm – robustes Timing
  useEffect(() => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    if (studentIncidents.length === 0) return;

    // Warte, bis das Canvas wirklich im DOM ist
    const createChart = () => {
      if (!chartRef.current) {
        console.log('⏳ Canvas noch nicht bereit – versuche erneut...');
        requestAnimationFrame(createChart);
        return;
      }

      try {
        const dates = studentIncidents.map(i => 
          new Date(i.datum).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })
        );

        chartInstanceRef.current = new Chart(chartRef.current, {
          type: 'line',
          data: {
            labels: dates,
            datasets: [
              {
                label: 'Intensität',
                data: studentIncidents.map(i => i.intensitaet),
                borderColor: '#e11d48',
                backgroundColor: 'rgba(225, 29, 72, 0.1)',
                borderWidth: 4,
                tension: 0.35,
                pointRadius: 5,
              },
              {
                label: 'Wiederholungsgefahr',
                data: studentIncidents.map(i => i.wiederholungsgefahr),
                borderColor: '#d97706',
                backgroundColor: 'rgba(217, 119, 6, 0.1)',
                borderWidth: 3,
                tension: 0.35,
              },
              {
                label: 'Wirkung der Maßnahme',
                data: studentIncidents.map(i => i.wirkung),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 3,
                tension: 0.35,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: { y: { min: 1, max: 5, ticks: { stepSize: 1 } } },

            animation: {
      duration: 800, 
      onComplete: function() {
         chartInstanceRef.current._printReady = true;
        console.log('✅ Chart ist druckbereit');
      }
    }

          },
        });
        console.log('✅ Chart erfolgreich erstellt!');
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
              {studentIncidents.length ? (studentIncidents.reduce((a,b)=>a+b.intensitaet,0)/studentIncidents.length).toFixed(1) : '—'}
            </p>
          </div>
          <div className="bg-white rounded-3xl p-6 text-center shadow-sm">
            <p className="text-slate-500">Ø Wirkung</p>
            <p className="text-5xl font-bold text-emerald-600 mt-2">
              {studentIncidents.length ? (studentIncidents.reduce((a,b)=>a+b.wirkung,0)/studentIncidents.length).toFixed(1) : '—'}
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
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${getIntensityStyle(inc.intensitaet)}`}>
                        Intensität {inc.intensitaet}
                      </span>
                      <p className="text-sm text-slate-500">
                        {new Date(inc.datum).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'long' })}
                      </p>
                    </div>
                    <p className="text-slate-700 leading-relaxed mb-4">
                      {inc.vorfallBeschreibung || 'Keine Beschreibung vorhanden.'}
                    </p>
                    {(inc.vorfallCodes?.length > 0 || inc.massnahmenCodes?.length > 0) && (
                      <div className="flex flex-wrap gap-2">
                        {inc.vorfallCodes?.map(c => <span key={c} className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full">{c}</span>)}
                        {inc.massnahmenCodes?.map(c => <span key={c} className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">{c}</span>)}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-3 w-40">
                    <button onClick={() => handlePrintIncident(inc)} className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-medium transition">
                      📄 Einzeln drucken
                    </button>
                    <Link href={`/edit/${inc.id}`} className="px-5 py-3 bg-amber-600 hover:bg-amber-700 text-white text-center rounded-2xl text-sm font-medium transition">
                      ✏️ Bearbeiten
                    </Link>
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