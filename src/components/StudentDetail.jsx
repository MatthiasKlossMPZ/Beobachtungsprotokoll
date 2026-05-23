import { Link } from 'preact-router';
import { useMemo, useEffect, useRef } from 'preact/hooks';
import Chart from 'chart.js/auto';

export default function StudentDetail({ students = [], incidents = [], id }) {
  const student = students.find(s => s.id === id);

  const studentIncidents = useMemo(() => 
    incidents
      .filter(i => i.studentId === id)
      .sort((a, b) => new Date(b.datum) - new Date(a.datum))
  , [incidents, id]);

  const getIntensityStyle = (level) => {
    switch (level) {
      case 1: return "bg-emerald-100 text-emerald-700";
      case 2: return "bg-yellow-100 text-yellow-700";
      case 3: return "bg-orange-100 text-orange-700";
      case 4: return "bg-red-100 text-red-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const chartRef = useRef(null);

  useEffect(() => {
    if (chartRef.current?.chart) {
      chartRef.current.chart.destroy();
    }
    if (studentIncidents.length === 0) return;

    const dates = studentIncidents.map(i =>
      new Date(i.datum).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })
    );

    chartRef.current.chart = new Chart(chartRef.current, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [
          {
            label: 'Intensität',
            data: studentIncidents.map(i => i.intensitaet),
            borderColor: '#e11d48',
            backgroundColor: 'rgba(225, 29, 72, 0.08)',
            borderWidth: 4,
            tension: 0.35,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: '#fff',
            pointBorderWidth: 3,
          },
          {
            label: 'Wiederholungsgefahr',
            data: studentIncidents.map(i => i.wiederholungsgefahr),
            borderColor: '#d97706',
            backgroundColor: 'rgba(217, 119, 6, 0.08)',
            borderWidth: 3,
            tension: 0.35,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: 'Wirkung der Maßnahme',
            data: studentIncidents.map(i => i.wirkung),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            borderWidth: 3,
            tension: 0.35,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            align: 'start',
            labels: { usePointStyle: true, padding: 18, font: { size: 13 } },
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleFont: { size: 13 },
            bodyFont: { size: 14 },
            padding: 12,
            displayColors: true,
          },
        },
        scales: {
          x: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 12 }, color: '#64748b' } },
          y: { min: 1, max: 5, ticks: { stepSize: 1, font: { size: 13 }, color: '#64748b' }, grid: { color: '#f1f5f9' } },
        },
      },
    });

    return () => {
      if (chartRef.current?.chart) chartRef.current.chart.destroy();
    };
  }, [studentIncidents]);

  if (!student) {
    return <div className="p-8 text-center text-red-600">Schüler nicht gefunden.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-blue-700 text-white p-4 shadow sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-white/80 hover:text-white flex items-center gap-1 text-sm font-medium">
              ← Alle Schüler
            </Link>
            <div>
              <h2 className="text-3xl font-bold">{student.name}</h2>
              <p className="text-blue-100">{student.klasse}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href={`/new/${id}`} className="bg-white text-blue-700 hover:bg-blue-50 px-6 py-3 rounded-2xl font-medium">
              + Neuer Vorfall
            </Link>
            <button
              onClick={() => window.print()}
              className="bg-white text-slate-700 hover:bg-slate-100 px-6 py-3 rounded-2xl font-medium flex items-center gap-2"
            >
              🖨️ Drucken
            </button>
          </div>
        </div>
      </header>

      {/* Hauptinhalt */}
      <div className="max-w-5xl mx-auto px-6 pt-8 pb-12">
        {/* Statistik */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-3xl p-6 shadow-sm text-center">
            <p className="text-sm text-slate-500">Vorfälle gesamt</p>
            <p className="text-5xl font-bold text-slate-800 mt-2">{studentIncidents.length}</p>
          </div>
          <div className="bg-white rounded-3xl p-6 shadow-sm text-center">
            <p className="text-sm text-slate-500">Ø Intensität</p>
            <p className="text-5xl font-bold text-rose-600 mt-2">
              {studentIncidents.length
                ? (studentIncidents.reduce((a, b) => a + b.intensitaet, 0) / studentIncidents.length).toFixed(1)
                : '—'}
            </p>
          </div>
          <div className="bg-white rounded-3xl p-6 shadow-sm text-center">
            <p className="text-sm text-slate-500">Ø Wirkung</p>
            <p className="text-5xl font-bold text-emerald-600 mt-2">
              {studentIncidents.length
                ? (studentIncidents.reduce((a, b) => a + b.wirkung, 0) / studentIncidents.length).toFixed(1)
                : '—'}
            </p>
          </div>
        </div>

        {/* Diagramm */}
        {studentIncidents.length > 0 && (
          <div className="bg-white rounded-3xl p-8 shadow mb-10">
            <h3 className="font-semibold mb-6 text-lg">Entwicklung über die Zeit</h3>
            <canvas ref={chartRef} className="max-h-96 w-full" />
          </div>
        )}

        {/* Kompakte Vorfall-Liste */}
        <div className="space-y-6">
          <h3 className="font-semibold text-lg mb-4">Dokumentierte Vorfälle ({studentIncidents.length})</h3>

          {studentIncidents.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-500">
              Noch keine Vorfälle dokumentiert.
            </div>
          ) : (
            studentIncidents.map((inc) => (
              <div
                key={inc.id}
                className="bg-white rounded-2xl p-5 shadow hover:shadow-md transition"
              >
                <div className="flex justify-between items-start gap-4">
                  {/* Linke Seite */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${getIntensityStyle(inc.intensitaet)}`}>
                        Intensität {inc.intensitaet}
                      </span>
                      <p className="text-sm text-slate-500 whitespace-nowrap">
                        {new Date(inc.datum).toLocaleDateString('de-DE')}
                      </p>
                    </div>

                    <p className="line-clamp-3 text-slate-800 leading-relaxed text-[15px]">
                      {inc.vorfallBeschreibung || 'Keine Beschreibung'}
                    </p>
                  </div>

                  {/* Rechte Seite */}
                  <div className="flex flex-col items-end gap-3 text-right text-sm w-28 flex-shrink-0">
                    <div>
                      <div className="text-slate-500 text-xs">Wiederholung</div>
                      <div className="font-semibold">{inc.wiederholungsgefahr}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-xs">Wirkung</div>
                      <div className="font-semibold text-emerald-600">{inc.wirkung}</div>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {(inc.vorfallCodes?.length > 0 || inc.massnahmenCodes?.length > 0) && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {inc.vorfallCodes?.map(c => (
                      <span key={c} className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full">
                        {c}
                      </span>
                    ))}
                    {inc.massnahmenCodes?.map(c => (
                      <span key={c} className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
                        {c}
                      </span>
                    ))}
                  </div>
                )}

                {/* Bearbeiten-Button */}
                <Link
                  href={`/edit/${inc.id}`}
                  className="mt-5 inline-block w-full text-center bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-2xl text-sm font-medium"
                >
                  ✏️ Vorfall bearbeiten
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}