import { useEffect } from 'preact/hooks';

export default function HelpModal({ isOpen, onClose }) {
  useEffect(() => {
    if (isOpen) {
      // Raw GitHub URL – umgeht die meisten GitHub-Pages-Probleme
      const pdfUrl = "https://raw.githubusercontent.com/matthiasklossmpz/Beobachtungsprotokoll/main/public/Bedienungsanleitung.pdf";
      
      console.log('Öffne PDF via raw:', pdfUrl);
      
      setTimeout(() => {
        window.open(pdfUrl, '_blank', 'noopener,noreferrer');
      }, 150);

      onClose();
    }
  }, [isOpen, onClose]);

  return null;
}