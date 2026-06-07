import { useEffect } from 'preact/hooks';

export default function HelpModal({ isOpen, onClose }) {
  useEffect(() => {
    if (isOpen) {
      const base = import.meta.env.BASE_URL;
      const pdfUrl = `${base}Bedienungsanleitung.pdf`;
      
      window.open(pdfUrl, '_blank');
      onClose();
    }
  }, [isOpen, onClose]);

  return null;
}