// src/components/HelpModal.jsx
import { useState } from 'preact/hooks';

export default function HelpModal({ isOpen, onClose }) {
  const [loadError, setLoadError] = useState(false);

  if (!isOpen) return null;

  const base = import.meta.env.BASE_URL || '/';
  const pdfUrl = `${base}Bedienungsanleitung.pdf`.replace(/\/\//g, '/');

  const openInNewTab = () => window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  const downloadPdf = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = 'Bedienungsanleitung_Beobachtungsprotokoll.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-6xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Bedienungsanleitung</h2>
            <p className="text-sm text-slate-500">Beobachtungsprotokoll v0.96b</p>
          </div>
          <button
            onClick={onClose}
            className="text-4xl text-slate-400 hover:text-red-600 leading-none"
          >
            ×
          </button>
        </div>

        {/* PDF-Bereich */}
        <div className="flex-1 relative bg-slate-100 min-h-[65vh] overflow-hidden">
          <iframe
            src={pdfUrl}
            className="absolute inset-0 w-full h-full border-0"
            title="Bedienungsanleitung"
            onError={() => setLoadError(true)}
          />

          {loadError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-white">
              <p className="text-xl text-red-600 mb-6">PDF konnte nicht direkt angezeigt werden.</p>
              <div className="flex gap-4">
                <button onClick={openInNewTab} className="px-8 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700">In neuem Tab öffnen</button>
                <button onClick={downloadPdf} className="px-8 py-3 border border-slate-400 rounded-2xl hover:bg-slate-100">Herunterladen</button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>Tipp: Mit zwei Fingern zoomen oder in neuem Tab öffnen</p>
          <div className="flex gap-3">
            <button onClick={openInNewTab} className="px-5 py-2 border rounded-xl hover:bg-slate-100">Neuer Tab</button>
            <button onClick={downloadPdf} className="px-5 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700">Herunterladen</button>
          </div>
        </div>
      </div>
    </div>
  );
}