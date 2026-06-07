import { useState, useEffect } from 'preact/hooks';

export default function HelpModal({ isOpen, onClose }) {
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const base = import.meta.env.BASE_URL;
  const pdfUrl = `${base}Bedienungsanleitung.pdf`;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[2000] p-4">
      <div className="bg-white w-full max-w-5xl h-[95vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-slate-800">
            Bedienungsanleitung
          </h2>
          <button
            onClick={onClose}
            className="text-3xl leading-none text-slate-400 hover:text-red-600 transition-colors"
          >
            ×
          </button>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 bg-slate-100 p-2 overflow-hidden relative">
          {!error ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full rounded-lg border border-slate-200"
              title="Bedienungsanleitung"
              onError={() => setError(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <p className="text-red-600 text-lg mb-4">PDF konnte nicht geladen werden</p>
              <p className="text-slate-600 mb-6">Versuche es stattdessen in einem neuen Tab:</p>
              <button
                onClick={() => window.open(pdfUrl, '_blank')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
              >
                Bedienungsanleitung im neuen Tab öffnen
              </button>
            </div>
          )}
        </div>

        <div className="p-3 text-center text-xs text-slate-500 border-t">
          URL: {pdfUrl}
        </div>
      </div>
    </div>
  );
}