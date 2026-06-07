// src/components/HelpModal.jsx
import { useEffect, useState } from 'preact/hooks';

export default function HelpModal({ isOpen, onClose }) {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const pdfUrl = '/Beobachtungsprotokoll/Bedienungsanleitung.pdf'; // Lokaler Pfad (Vite + PWA)

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setLoading(true);

      // Testen, ob die PDF erreichbar ist
      fetch(pdfUrl, { method: 'HEAD' })
        .then(res => {
          if (!res.ok) throw new Error('PDF nicht gefunden');
          setLoading(false);
        })
        .catch(err => {
          console.error('PDF-Ladefehler:', err);
          setError('Die Bedienungsanleitung konnte nicht geladen werden.');
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1100] p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[95vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-6 py-4">
          <h2 className="text-xl font-semibold">Bedienungsanleitung</h2>
          <button
            onClick={onClose}
            className="text-3xl leading-none text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            ×
          </button>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-hidden relative" style={{ minHeight: '70vh' }}>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3"></div>
                <p>Lade Bedienungsanleitung...</p>
              </div>
            </div>
          )}

          {error ? (
            <div className="p-8 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <a
                href={pdfUrl}
                download
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
              >
                PDF herunterladen
              </a>
            </div>
          ) : (
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              title="Bedienungsanleitung"
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500">
          Tipp: Auf mobilen Geräten ggf. mit zwei Fingern zoomen
        </div>
      </div>
    </div>
  );
}