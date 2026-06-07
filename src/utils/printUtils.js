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

// ==================== SCHULBEGLEITER ====================
export const getSchulbegleiterText = (code) => {
  if (!code) return 'keine Angabe';
  
  const found = SCHULBEGLEITER_CODES.find(s => s.code === code);
  return found ? found.bedeutung : code;
};

export const getSchulbegleiterFull = (code) => {
  if (!code) return 'keine Angabe';
  
  const found = SCHULBEGLEITER_CODES.find(s => s.code === code);
  return found ? `${code} – ${found.bedeutung}` : code;
};

// ==================== VORFALL FULL NAME (besteht schon) ====================
export const getVorfallFullName = (code) => {
  const mapping = {
    'TD': 'Tötungsandrohung',
    'KV': 'Körperverletzung / Androhung',
    'SS': 'Schwere Sachbeschädigung',
    'ER': 'Erpressung',
    'DI': 'Diffamierung',
    'EX': 'Extremistischer Hintergrund',
  };
  return mapping[code] || code;
};

// Farben für Intensität
const intensityColors = {
  1: [52, 211, 153],  // grün
  2: [234, 179, 8],   // gelb
  3: [249, 115, 22],  // orange
  4: [225, 29, 72]    // rot
};

// ==================== EINZELPROTOKOLL (mit festem Footer) ====================
export const printSingleIncident = async (incident, studentName, studentKlasse = '') => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = 20;

  // ==================== HEADER ====================
  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text('BEOBACHTUNGSPROTOKOLL', 20, 18);

  doc.setFontSize(11);
  doc.setTextColor(220, 220, 255);
  doc.text('Einzelfall-Dokumentation', 20, 25);

  y = 45;

  // Schülername + Klasse
  const fullName = studentKlasse 
    ? `${studentName} (${studentKlasse})` 
    : studentName;

  doc.setTextColor(30, 64, 175);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(fullName, 20, y);
  y += 10;

  doc.setDrawColor(30, 64, 175);
  doc.setLineWidth(0.8);
  doc.line(20, y, 190, y);
  y += 20;

  // ==================== VORFALL ====================
  doc.setFontSize(14);
  doc.setTextColor(220, 38, 38);
  doc.setFont("helvetica", "bold");
  doc.text('VORFALL', 20, y);
  y += 8;

  doc.setTextColor(0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");

  const vorfallTexts = (incident.vorfallCodes || []).map(getVorfallText);
  let infoLine = vorfallTexts.join(' / ');

  const datum = new Date(incident.datum);
  const datumText = datum.toLocaleDateString('de-DE', { 
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' 
  });
  const uhrzeitText = datum.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

  infoLine += ` • ${datumText} • ${uhrzeitText} Uhr`;

  doc.text(infoLine, 20, y);
  y += 20;

  // ==================== BESCHREIBUNG ====================
  doc.setFontSize(14);
  doc.setTextColor(30, 64, 175);
  doc.setFont("helvetica", "bold");
  doc.text('DETAILLIERTE BESCHREIBUNG', 20, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(0);
  doc.setFontSize(11.5);
  
  const descLines = doc.splitTextToSize(
    incident.vorfallBeschreibung || 'Keine Beschreibung vorhanden.', 
    165
  );
  doc.text(descLines, 20, y);
  y += descLines.length * 6.8 + 16;

  // ==================== MASSNAHMEN ====================
  if (incident.massnahmenCodes?.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(34, 197, 151);
    doc.setFont("helvetica", "bold");
    doc.text('ER GRIFFENE MASSNAHMEN', 20, y);
    y += 8;

    doc.setFontSize(11.5);
    doc.setTextColor(0);
    doc.setFont("helvetica", "normal");

    const massnahmenTexts = (incident.massnahmenCodes || []).map(getMassnahmeText);
    massnahmenTexts.forEach(text => {
      doc.text('• ' + text, 20, y);
      y += 6.8;
    });
    y += 10;
  }

  // ==================== SCHULBEGLEITER ====================
  if (incident.schulbegleiterCode) {
    doc.setFontSize(14);
    doc.setTextColor(59, 130, 246);
    doc.setFont("helvetica", "bold");
    doc.text('SCHULBEGLEITER-EINSATZ', 20, y);
    y += 8;

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont("helvetica", "normal");
    doc.text(getSchulbegleiterFull(incident.schulbegleiterCode), 20, y);
    y += 16;
  }

  // ==================== EINSCHÄTZUNGEN ====================
  doc.setFontSize(14);
  doc.setTextColor(30, 64, 175);
  doc.setFont("helvetica", "bold");
  doc.text('EINSCHÄTZUNGEN', 20, y);
  y += 10;

  doc.setFontSize(11.5);
  doc.setFont("helvetica", "normal");

  const scales = [
    { label: 'Wiederholungsgefahr', value: incident.wiederholungsgefahr, text: getWiederholungText(incident.wiederholungsgefahr) },
    { label: 'Wirkung der Maßnahme', value: incident.wirkung, text: getWirkungText(incident.wirkung) },
    { label: 'Intensität', value: incident.intensitaet, text: getIntensityText(incident.intensitaet) }
  ];

  scales.forEach((scale) => {
    doc.setTextColor(0);
    doc.text(scale.label + ':', 25, y);
    
    doc.setFont("helvetica", "bold");
    const color = scale.label === 'Intensität' 
      ? (intensityColors[scale.value] || [100,100,100]) 
      : [30, 64, 175];
    doc.setTextColor(...color);
    
    doc.text(`${scale.value} — ${scale.text}`, 105, y);
    doc.setFont("helvetica", "normal");
    y += 10.5;
  });

  // ==================== FESTER FOOTER (immer am unteren Rand) ====================
  const footerY = 285;   // fester Abstand vom oberen Rand (A4 = 297mm)

  doc.setDrawColor(200);
  doc.setLineWidth(0.4);
  doc.line(20, footerY - 6, 190, footerY - 6);

  doc.setFontSize(10);
  doc.setTextColor(140);
  doc.text('Erstellt mit dem digitalen Beobachtungsprotokoll', 20, footerY);
  doc.text(new Date().toLocaleDateString('de-DE'), 170, footerY);

  // Datei speichern
  const fileName = `Protokoll_${studentName.replace(/\s+/g, '_')}_${new Date(incident.datum).toISOString().slice(0,10)}.pdf`;
  doc.save(fileName);
};

// ==================== GESAMTBERICHT ====================
export const printStudentReportWithChart = async (student, incidents, chartInstanceRef) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = 20;

  // ==================== HEADER ====================
  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text('BEOBACHTUNGSPROTOKOLL', 20, 18);
  doc.setFontSize(11);
  doc.setTextColor(220, 220, 255);
  doc.text('Gesamtbericht', 20, 25);

  y = 45;

  // Schülername
  const fullName = student.klasse 
    ? `${student.name} (${student.klasse})` 
    : student.name;
  
  doc.setTextColor(30, 64, 175);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(fullName, 20, y);
  y += 8;
  doc.setDrawColor(30, 64, 175);
  doc.setLineWidth(0.8);
  doc.line(20, y, 190, y);
  y += 22;

  // ==================== DIAGRAMM ====================
  doc.setFontSize(14);
  doc.setTextColor(30, 64, 175);
  doc.setFont("helvetica", "bold");
  doc.text('ENTWICKLUNG DER VORFÄLLE', 20, y);
  y += 10;

  if (chartInstanceRef.current) {
    try {
      const chart = chartInstanceRef.current;
      if (!chart._printReady) {
        await new Promise(resolve => setTimeout(resolve, 1200));
      }
      chart.update('none');
      await new Promise(r => setTimeout(r, 150));

      const imgData = chart.toBase64Image('image/png', 1.0);
      doc.addImage(imgData, 'PNG', 20, y, 170, 95);
      y += 105;
    } catch (err) {
      console.error('Diagramm-Fehler:', err);
      y += 25;
    }
  } else {
    y += 20;
  }

  // ==================== VORFÄLLE ====================
  doc.setFontSize(16);
  doc.setTextColor(30, 64, 175);
  doc.setFont("helvetica", "bold");
  doc.text(`DOKUMENTIERTE VORFÄLLE (${incidents.length})`, 20, y);
  y += 18;

  incidents
    .sort((a, b) => new Date(b.datum) - new Date(a.datum))
    .forEach((inc, i) => {
      if (y > 245) {           // Sicherheitsabstand zum Seitenende
        doc.addPage();
        y = 25;
      }

      // Kleiner Trenner zwischen Vorfällen
      if (i > 0) {
        doc.setDrawColor(220);
        doc.setLineWidth(0.3);
        doc.line(20, y - 8, 190, y - 8);
        y += 6;
      }

      // Vorfall-Überschrift
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(220, 38, 38); // Rot wie im Einzeldruck
      const vorfallTexts = (inc.vorfallCodes || []).map(getVorfallText);
      const datumStr = new Date(inc.datum).toLocaleDateString('de-DE', {
        weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
      }) + ' • ' + new Date(inc.datum).toLocaleTimeString('de-DE', {
        hour: '2-digit', minute: '2-digit'
      });

      doc.text(`${i + 1}. ${vorfallTexts.join(' • ')}`, 20, y);
      doc.setFontSize(10.5);
      doc.setTextColor(100);
      doc.text(datumStr, 145, y);
      y += 11;

      // Beschreibung
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11.5);
      doc.setTextColor(0);
      const descLines = doc.splitTextToSize(
        inc.vorfallBeschreibung || 'Keine Beschreibung vorhanden.', 
        165
      );
      doc.text(descLines, 22, y);
      y += descLines.length * 6.2 + 8;

            // Maßnahmen
      if (inc.massnahmenCodes?.length > 0) {
        doc.setFontSize(11.5);
        doc.setTextColor(34, 197, 151);
        doc.setFont("helvetica", "bold");
        doc.text('Maßnahmen:', 22, y);
        doc.setTextColor(0);
        doc.setFont("helvetica", "normal");
        
        const massnahmenTexts = (inc.massnahmenCodes || []).map(getMassnahmeText);
        doc.text(massnahmenTexts.join(' • '), 55, y);
        y += 9;
      }

      // Schulbegleiter
      if (inc.schulbegleiterCode) {
        doc.setTextColor(59, 130, 246);
        doc.setFont("helvetica", "bold");
        doc.text('Schulbegleiter:', 22, y);
        doc.setTextColor(0);
        doc.setFont("helvetica", "normal");
        doc.text(getSchulbegleiterText(inc.schulbegleiterCode), 55, y); 
        y += 9;
      }

      // Einschätzungen
      doc.setFontSize(11);
      const labelX = 25;
      const valueX = 82;

      // Wiederholungsgefahr
      doc.setTextColor(0);
      doc.text('Wiederholungsgefahr:', labelX, y);
      doc.text(`${inc.wiederholungsgefahr} – ${getWiederholungText(inc.wiederholungsgefahr)}`, valueX, y);
      y += 7.5;

      // Wirkung
      doc.text('Wirkung der Maßnahme:', labelX, y);
      doc.text(`${inc.wirkung} – ${getWirkungText(inc.wirkung)}`, valueX, y);
      y += 7.5;

      // Intensität 
      doc.text('Intensität:', labelX, y);
      const color = intensityColors[inc.intensitaet] || [100, 100, 100];
      doc.setTextColor(...color);
      doc.setFont("helvetica", "bold");
      doc.text(inc.intensitaet.toString(), valueX, y + 0.3);
      
      doc.setTextColor(0);
      doc.setFont("helvetica", "normal");
      doc.text(` – ${getIntensityText(inc.intensitaet)}`, valueX + 2.5, y);
      y += 16;
    });

  // ==================== FESTER FOOTER ====================
  const footerY = 285;
  doc.setDrawColor(200);
  doc.setLineWidth(0.4);
  doc.line(20, footerY - 6, 190, footerY - 6);

  doc.setFontSize(10);
  doc.setTextColor(140);
  doc.text('Erstellt mit dem digitalen Beobachtungsprotokoll', 20, footerY);
  doc.text(new Date().toLocaleDateString('de-DE'), 165, footerY);

  // Datei speichern
  const fileName = `Gesamtbericht_${student.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`;
  doc.save(fileName);
};