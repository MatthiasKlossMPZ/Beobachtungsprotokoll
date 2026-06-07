# Beobachtungsprotokoll

Ein **datenschutzkonformes digitales Beobachtungs- und Vorfallprotokoll** für Schulen.

Entwickelt, um Lehrkräfte und Schulbegleiter bei der strukturierten Dokumentation von Vorfällen zu unterstützen – mit Fokus auf Übersichtlichkeit, Datenschutz und einfacher Bedienung.

## ✨ Funktionen

- **Verschlüsselte lokale Speicherung** (IndexedDB + AES-GCM)
- **PWA** – funktioniert offline und kann installiert werden
- **Intuitive Erfassung** von Vorfällen mit:
  - Vorfallart (Mehrfachauswahl)
  - Detaillierter Beschreibung
  - Ergriffenen Maßnahmen
  - Schulbegleiter-Einsatz
  - Einschätzung von Intensität, Wiederholungsgefahr und Wirkung
- **Entwicklungsgrafik** pro Schüler (Intensität, Wiederholungsgefahr, Wirkung)
- **PDF-Export**:
  - Einzelprotokoll
  - Gesamtbericht mit Diagramm
- **Such- und Filterfunktionen**
- **Daten-Export / Backup** (verschlüsselt)

## 🚀 Installation & Nutzung

1. Die App ist eine Progressive Web App (PWA)
2. Öffne die Seite im Browser und klicke auf **„Zum Home-Bildschirm hinzufügen“** / **„Installieren“**
3. Beim ersten Start ein **starkes Passwort** vergeben (wird nur lokal gespeichert)

> **Wichtig:** Das Passwort wird nicht übertragen und kann nicht wiederhergestellt werden. Bei Verlust des Passworts sind die Daten nicht mehr zugänglich.

## Technologie-Stack

- **Frontend:** Preact + Vite
- **Datenbank:** IndexedDB (verschlüsselt)
- **PDF-Generierung:** jsPDF
- **Diagramme:** Chart.js
- **Verschlüsselung:** Web Crypto API (AES-GCM + PBKDF2)

## Datenschutz

- Alle Daten bleiben **ausschließlich auf dem Gerät**
- Keine Cloud, keine Tracking, keine externen Server
- Ende-zu-Ende-Verschlüsselung mit individuellen Passwörtern

## Mitwirken

Beiträge sind willkommen! Einfach Issue oder Pull Request erstellen.

## Lizenz

Dieses Projekt ist unter der [MIT-Lizenz](LICENSE) veröffentlicht.

---

**Made with ❤️ für die Schulpraxis**