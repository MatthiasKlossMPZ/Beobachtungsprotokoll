import jsPDF from 'jspdf';
import { 
  VORFALL_CODES, 
  MASSNAHMEN_CODES, 
  SCHULBEGLEITER_CODES, 
  WIEDERHOLUNGSGEFAHR, 
  WIRKUNG, 
  INTENSITAET 
} from '../constants.js';

// Hilfsfunktionen
const getVorfallText = (code) => VORFALL_CODES.find(v => v.code === code)?.bedeutung || code;
const getMassnahmeText = (code) => MASSNAHMEN_CODES.find(m => m.code === code)?.bedeutung || code;
const getSchulbegleiterText = (code) => SCHULBEGLEITER_CODES.find(s => s.code === code)?.bedeutung || code;

const getIntensityText = (wert) => INTENSITAET.find(i => i.wert === wert)?.text || wert;
const getWiederholungText = (wert) => WIEDERHOLUNGSGEFAHR.find(w => w.wert === wert)?.text || wert;
const getWirkungText = (wert) => WIRKUNG.find(w => w.wert === wert)?.text || wert;

// Farben
const intensityColors = {
  1: [52, 211, 153],   // grün
  2: [234, 179, 8],    // gelb
  3: [249, 115, 22],   // orange
  4: [225, 29, 72]     // rot
};

export const printSingleIncident = async (incident, studentName) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = 22;

  // ==================== HEADER ====================
  doc.setFontSize(24);
  doc.setTextColor(30, 64, 175);
  doc.text('Beobachtungsprotokoll', 20, y);
  y += 12;

  doc.setFontSize(15);
  doc.setTextColor(0);
  doc.text(studentName, 20, y);
  y += 18;

  // ==================== VORFALL (Was passierte) ====================
  doc.setFontSize(14);
  doc.text('Was passierte', 20, y);
  y += 8;

  const vorfallTexts = (incident.vorfallCodes || []).map(getVorfallText);
  doc.setFontSize(12);
  doc.text(vorfallTexts.join(' • '), 20, y);
  y += 14;

  // ==================== DATUM & UHRZEIT ====================
  const datum = new Date(incident.datum);
  doc.setFontSize(13);
  doc.text('Datum & Uhrzeit', 20, y);
  y += 8;
  doc.setFontSize(12);
  doc.text(
    datum.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) +
    ' • ' +
    datum.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
    20, y
  );
  y += 18;

  // ==================== DETALLIERTE BESCHREIBUNG ====================
  doc.setFontSize(14);
  doc.text('Detaillierte Beschreibung', 20, y);
  y += 9;
  doc.setFontSize(11.5);
  const descLines = doc.splitTextToSize(incident.vorfallBeschreibung || 'Keine Beschreibung vorhanden.', 165);
  doc.text(descLines, 20, y);
  y += descLines.length * 6.8 + 16;

  // ==================== MASSNAHMEN ====================
  if (incident.massnahmenCodes?.length > 0) {
    doc.setFontSize(14);
    doc.text('Ergriffene Maßnahmen', 20, y);
    y += 9;
    doc.setFontSize(11.5);
    const massnahmenTexts = (incident.massnahmenCodes || []).map(getMassnahmeText);
    doc.text('• ' + massnahmenTexts.join('\n• '), 20, y);
    y += massnahmenTexts.length * 7.2 + 12;
  }

  // ==================== SCHULBEGLEITER ====================
  if (incident.schulbegleiter) {
    doc.setFontSize(14);
    doc.text('Schulbegleiter', 20, y);
    y += 9;
    doc.setFontSize(12);
    doc.text(getSchulbegleiterText(incident.schulbegleiter), 20, y);
    y += 16;
  }

  // ==================== EINSCHÄTZUNG ====================
  doc.setFontSize(14);
  doc.text('Einschätzung', 20, y);
  y += 12;

  doc.setFontSize(12);

  // Wiederholungsgefahr
  doc.text('Wiederholungsgefahr', 25, y);
  doc.text(`${incident.wiederholungsgefahr} – ${getWiederholungText(incident.wiederholungsgefahr)}`, 90, y);
  y += 11;

  // Wirkung
  doc.text('Wirkung der Maßnahme', 25, y);
  doc.text(`${incident.wirkung} – ${getWirkungText(incident.wirkung)}`, 90, y);
  y += 11;

  // Intensität mit farbigem Kasten
  doc.text('Intensität', 25, y);
  
  const color = intensityColors[incident.intensitaet] || [100, 100, 100];
  doc.setFillColor(...color);
  doc.roundedRect(88, y - 6, 19, 19, 3, 3, 'F');   // Kleineres Rechteck

  doc.setTextColor(255);
  doc.setFontSize(16);
  doc.text(incident.intensitaet.toString(), 93.5, y + 7.5);   // Zentriert

  doc.setTextColor(0);
  doc.setFontSize(12);
  doc.text(getIntensityText(incident.intensitaet), 115, y + 1);
  y += 22;

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text('Erstellt mit dem digitalen Beobachtungsprotokoll', 20, y + 15);

  doc.save(`Protokoll_${studentName.replace(/\s+/g, '_')}_${new Date(incident.datum).toISOString().slice(0,10)}.pdf`);
};
// ====================== GESAMTBERICHT ======================
export const printStudentReportWithChart = async (student, incidents, chartRef) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = 22;

  // ==================== TITEL ====================
  doc.setFontSize(24);
  doc.setTextColor(30, 64, 175);
  doc.text('Gesamtbericht', 20, y);
  y += 12;

  doc.setFontSize(15);
  doc.setTextColor(0);
  doc.text(`${student.name} • ${student.klasse}`, 20, y);
  y += 22;

  // ==================== DIAGRAMM ====================
  if (chartRef.current?.chart) {
    try {
      const imgData = chartRef.current.chart.toBase64Image();
      doc.addImage(imgData, 'PNG', 20, y, 170, 72);
      y += 80;
    } catch (e) {
      console.error(e);
    }
  }

  doc.setFontSize(16);
  doc.text('Dokumentierte Vorfälle', 20, y);
  y += 16;

  // ==================== EINZELVORFÄLLE ====================
  incidents
    .sort((a, b) => new Date(b.datum) - new Date(a.datum))
    .forEach((inc, i) => {
      if (y > 225) {
        doc.addPage();
        y = 25;
      }

      // --- Fette Überschrift ---
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);

      const vorfallTexts = (inc.vorfallCodes || []).map(getVorfallText);
      const datumStr = new Date(inc.datum).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' }) +
                       ' • ' + new Date(inc.datum).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

      const headerText = `${i + 1}. ${vorfallTexts.join(' • ')} — ${datumStr}`;
      doc.text(headerText, 20, y);
      y += 12;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11.5);

      // --- Beschreibung ---
      const shortDesc = (inc.vorfallBeschreibung || 'Keine Beschreibung').substring(0, 220);
      const descLines = doc.splitTextToSize(shortDesc + (shortDesc.length > 220 ? '...' : ''), 165);
      doc.text(descLines, 22, y);
      y += descLines.length * 6.4 + 10;

      // --- Maßnahmen ---
      if (inc.massnahmenCodes?.length > 0) {
        const massnahmenTexts = (inc.massnahmenCodes || []).map(getMassnahmeText);
        doc.text('Maßnahmen: ' + massnahmenTexts.join(' • '), 22, y);
        y += 9;
      }

      // --- Schulbegleiter ---
      if (inc.schulbegleiter) {
        doc.text(`Schulbegleiter: ${getSchulbegleiterText(inc.schulbegleiter)}`, 22, y);
        y += 9;
      }

      // --- Auswertungen (sauber tabellarisch) ---
      doc.setFontSize(11);
      const labelX = 25;
      const valueX = 92;

      // Wiederholungsgefahr
      doc.text('Wiederholungsgefahr:', labelX, y);
      doc.text(`${inc.wiederholungsgefahr} – ${getWiederholungText(inc.wiederholungsgefahr)}`, valueX, y);
      y += 8.5;

      // Wirkung
      doc.text('Wirkung der Maßnahme:', labelX, y);
      doc.text(`${inc.wirkung} – ${getWirkungText(inc.wirkung)}`, valueX, y);
      y += 8.5;

      // Intensität
      doc.text('Intensität:', labelX, y);
      
      const color = intensityColors[inc.intensitaet] || [100, 100, 100];
      doc.setTextColor(...color);
      doc.setFontSize(12.5);
      doc.text(inc.intensitaet.toString(), valueX, y + 0.5);

      doc.setTextColor(0);
      doc.setFontSize(11);
      doc.text(` – ${getIntensityText(inc.intensitaet)}`, valueX + 13, y);
      
      y += 20;   // Abstand zum nächsten Vorfall
    });

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text('Erstellt mit dem digitalen Beobachtungsprotokoll', 20, y + 12);

  doc.save(`Gesamtbericht_${student.name.replace(/\s+/g, '_')}.pdf`);
};