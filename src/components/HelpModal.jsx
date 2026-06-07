import { useEffect } from 'preact/hooks';

export default function HelpModal({ isOpen, onClose }) {
  useEffect(() => {
    if (isOpen) {
      const base = import.meta.env.BASE_URL;
      const pdfUrl = `${base}Bedienungsanleitung.pdf`;
      
      setTimeout(() => {
        window.open(pdfUrl, '_blank', 'noopener,noreferrer');
      }, 100);

      // Modal sofort schließen
      onClose();
    }
  }, [isOpen, onClose]);

  return null;
}