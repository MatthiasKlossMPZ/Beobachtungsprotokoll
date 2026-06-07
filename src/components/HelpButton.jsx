// src/components/HelpButton.jsx
import { useState } from 'preact/hooks';
import HelpModal from './HelpModal';

export default function HelpButton() {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowHelp(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white text-4xl rounded-full shadow-2xl flex items-center justify-center z-[1100] transition-all active:scale-95"
        title="Bedienungsanleitung"
        aria-label="Hilfe"
      >
        ?
      </button>

      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </>
  );
}