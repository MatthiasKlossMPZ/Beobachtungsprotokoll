import { useState } from 'preact/hooks';
import HelpModal from './HelpModal';

export default function HelpButton() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          boxShadow: '0 6px 16px rgba(59, 130, 246, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '34px',
          fontWeight: 'bold',
          cursor: 'pointer',
          zIndex: 1000,
          transition: 'all 0.2s ease'
        }}
        title="Bedienungsanleitung öffnen"
      >
        ?
      </button>

      <HelpModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}