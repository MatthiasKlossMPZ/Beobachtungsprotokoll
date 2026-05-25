import jsPDF from 'jspdf';
import {
  VORFALL_CODES,
  MASSNAHMEN_CODES,
  SCHULBEGLEITER_CODES,
  WIEDERHOLUNGSGEFAHR,
  WIRKUNG,
  INTENSITAET
} from '../constants.js';

// ==================== HILFSFUNKTIONEN ====================
const getVorfallText = (code) => VORFALL_CODES.find(v => v.code === code)?.bedeutung || code;
const getMassnahmeText = (code) => MASSNAHMEN_CODES.find(m => m.code === code)?.bedeutung || code;
const getIntensityText = (wert) => INTENSITAET.find(i => i.wert === wert)?.text || wert;
const getWiederholungText = (wert) => WIEDERHOLUNGSGEFAHR.find(w => w.wert === wert)?.text || wert;
const getWirkungText = (wert) => WIRKUNG.find(w => w.wert === wert)?.text || wert;

// Neue Hilfsfunktionen
export const getVorfallFullName = (code) => {
  const mapping = {
    'TD': 'Tötungsandrohung',
    'KV': 'Körperverletzung / Androhung',
    'SS': 'Schwere Sachbeschädigung',
    'ER': 'Erpressung',
    'DI': 'Diffamierung',
    'EX': 'Extremistischer Hintergrund',
    // Hier weitere Codes ergänzen
  };
  return mapping[code] || code;
};

export const getSchulbegleiterText = (code) => {
  const map = {
    'deeskalierend': 'deeskalierend',
    'eingreifend': 'eingreifend',
    'beobachtend': 'beobachtend',
    'keine': 'keine erkennbare Handlung',
  };
  return map[code] || code || 'keine Angabe';
};

// Farben für Intensität
const intensityColors = {
  1: [52, 211, 153],  // grün
  2: [234, 179, 8],   // gelb
  3: [249, 115, 22],  // orange
  4: [225, 29, 72]    // rot
};

// ==================== EINZELPROTOKOLL ====================
export const printSingleIncident = async (incident, studentName) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = 22;

  // HEADER
  doc.setFontSize(24);
  doc.setTextColor(30, 64, 175);
  doc.text('Beobachtungsprotokoll', 20, y);
  y += 12;
  doc.setFontSize(15);
  doc.setTextColor(0);
  doc.text(studentName, 20, y);
  y += 18;

  // Art des Vorfalls
  doc.setFontSize(14);
  doc.text('Art des Vorfalls', 20, y);
  y += 8;
  const vorfallTexts = (incident.vorfallCodes || []).map(getVorfallText);
  doc.setFontSize(12);
  doc.text(vorfallTexts.join(' • '), 20, y);
  y += 14;

  // Datum & Uhrzeit
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

  // Detaillierte Beschreibung
  doc.setFontSize(14);
  doc.text('Detaillierte Beschreibung', 20, y);
  y += 9;
  doc.setFontSize(11.5);
  const descLines = doc.splitTextToSize(incident.vorfallBeschreibung || 'Keine Beschreibung vorhanden.', 165);
  doc.text(descLines, 20, y);
  y += descLines.length * 6.8 + 16;

  // Ergriffene Maßnahmen
  if (incident.massnahmenCodes?.length > 0) {
    doc.setFontSize(14);
    doc.text('Ergriffene Maßnahmen', 20, y);
    y += 9;
    doc.setFontSize(11.5);
    const massnahmenTexts = (incident.massnahmenCodes || []).map(getMassnahmeText);
    doc.text('• ' + massnahmenTexts.join('\n• '), 20, y);
    y += massnahmenTexts.length * 7.2 + 12;
  }

  // Schulbegleiter
  if (incident.schulbegleiterCode) {
    doc.setFontSize(14);
    doc.text('Schulbegleiter', 20, y);
    y += 9;
    doc.setFontSize(12);
    doc.text(getSchulbegleiterText(incident.schulbegleiterCode), 20, y);
    y += 16;
  }

  // Einschätzungen
  doc.setFontSize(14);
  doc.text('Einschätzungen', 20, y);
  y += 12;
  doc.setFontSize(12);

  // Wiederholungsgefahr
  doc.text('Wiederholungsgefahr', 25, y);
  doc.text(`${incident.wiederholungsgefahr} – ${getWiederholungText(incident.wiederholungsgefahr)}`, 88, y);
  y += 11;

  // Wirkung der Maßnahme
  doc.text('Wirkung der Maßnahme', 25, y);
  doc.text(`${incident.wirkung} – ${getWirkungText(incident.wirkung)}`, 88, y);
  y += 11;

  // Intensität
  doc.text('Intensität', 25, y);
  const color = intensityColors[incident.intensitaet] || [100, 100, 100];
  doc.setTextColor(...color);
  doc.setFontSize(12.5);
  doc.text(incident.intensitaet.toString(), 88, y);
  doc.setTextColor(0);
  doc.setFontSize(12);
  doc.text(` – ${getIntensityText(incident.intensitaet)}`, 97, y);
  y += 20;

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text('Erstellt mit dem digitalen Beobachtungsprotokoll', 20, y + 15);

  doc.save(`Protokoll_${studentName.replace(/\s+/g, '_')}_${new Date(incident.datum).toISOString().slice(0,10)}.pdf`);
};

// ==================== GESAMTBERICHT ====================
export const printStudentReportWithChart = async (student, incidents, chartInstanceRef) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = 22;

  // Header
  doc.setFontSize(24);
  doc.setTextColor(30, 64, 175);
  doc.text('Gesamtbericht', 20, y);
  y += 12;
  doc.setFontSize(15);
  doc.setTextColor(0);
  doc.text(`${student.name} • ${student.klasse}`, 20, y);
  y += 18;

  // Diagramm
  if (chartInstanceRef.current) {
    try {
      const chart = chartInstanceRef.current;
      if (!chart._printReady) {
        await new Promise(resolve => setTimeout(resolve, 1200));
      }
      chart.update('none');
      await new Promise(r => setTimeout(r, 100));
      const imgData = chart.toBase64Image('image/png', 1.0);
      doc.addImage(imgData, 'PNG', 20, y, 170, 95);
      y += 105;
    } catch (err) {
      console.error('Diagramm-Fehler:', err);
      y += 20;
    }
  }

  // Vorfälle
  doc.setFontSize(16);
  doc.text('Dokumentierte Vorfälle', 20, y);
  y += 22;

  incidents
    .sort((a, b) => new Date(b.datum) - new Date(a.datum))
    .forEach((inc, i) => {
      if (y > 230) { 
        doc.addPage(); 
        y = 25; 
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      const vorfallTexts = (inc.vorfallCodes || []).map(getVorfallText);
      const datumStr = new Date(inc.datum).toLocaleDateString('de-DE', {
        day: '2-digit', month: 'short', year: 'numeric'
      }) + ' • ' + new Date(inc.datum).toLocaleTimeString('de-DE', {
        hour: '2-digit', minute: '2-digit'
      });

      doc.text(`${i + 1}. ${vorfallTexts.join(' • ')} — ${datumStr}`, 20, y);
      y += 10;

      // Beschreibung
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11.5);
      const descLines = doc.splitTextToSize(inc.vorfallBeschreibung || 'Keine Beschreibung', 165);
      doc.text(descLines, 22, y);
      y += descLines.length * 5.8 + 8;

      // Maßnahmen + Schulbegleiter
      if (inc.massnahmenCodes?.length > 0) {
        const massnahmenTexts = (inc.massnahmenCodes || []).map(getMassnahmeText);
        doc.text('Maßnahmen: ' + massnahmenTexts.join(' • '), 22, y);
        y += 8;
      }
      if (inc.schulbegleiterCode) {
        doc.text(`Schulbegleiter: ${getSchulbegleiterText(inc.schulbegleiterCode)}`, 22, y);
        y += 9;
      }

      // Einschätzungen
      doc.setFontSize(11);
      const labelX = 25;
      const valueX = 78;

      doc.text('Wiederholungsgefahr:', labelX, y);
      doc.text(`${inc.wiederholungsgefahr} – ${getWiederholungText(inc.wiederholungsgefahr)}`, valueX, y);
      y += 7;

      doc.text('Wirkung der Maßnahme:', labelX, y);
      doc.text(`${inc.wirkung} – ${getWirkungText(inc.wirkung)}`, valueX, y);
      y += 7;

      doc.text('Intensität:', labelX, y);
      const color = intensityColors[inc.intensitaet] || [100, 100, 100];
      doc.setTextColor(...color);
      doc.setFontSize(12.5);
      doc.text(inc.intensitaet.toString(), valueX, y + 0.2);
      doc.setTextColor(0);
      doc.setFontSize(11);
      doc.text(` – ${getIntensityText(inc.intensitaet)}`, valueX + 6, y);
      y += 16;
    });

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text('Erstellt mit dem digitalen Beobachtungsprotokoll', 20, y + 12);

  doc.save(`Gesamtbericht_${student.name.replace(/\s+/g, '_')}.pdf`);
};