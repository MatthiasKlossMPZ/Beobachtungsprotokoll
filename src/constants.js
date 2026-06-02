export const VORFALL_CODES = [
  { code: "KV", bedeutung: "Körperverletzung / Androhung" },
  { code: "SS", bedeutung: "Schwere Sachbeschädigung" },
  { code: "ER", bedeutung: "Erpressung" },
  { code: "TD", bedeutung: "Tötungsandrohung" },
  { code: "DI", bedeutung: "Diffamierung" },
  { code: "EX", bedeutung: "Extremistischer Hintergrund" }
];

export const MASSNAHMEN_CODES = [
  { code: "ERM", bedeutung: "Ermahnung" },
  { code: "PGE",  bedeutung: "pädagogisches Gespräch" },
  { code: "GG",  bedeutung: "Gruppengespräch" },
  { code: "AS",  bedeutung: "Ausschluss aus der laufenden Stunde" },
  { code: "EL",  bedeutung: "Elternkontakt" },
  { code: "SL",  bedeutung: "Schulleitung einbezogen" },
  { code: "SSA", bedeutung: "Schulsozialarbeit" },
  { code: "NF",  bedeutung: "Notfallmeldung" },
  { code: "GA",  bedeutung: "gemeinsame Absprachen" },
  { code: "WG",  bedeutung: "Wiedergutmachung" },
  { code: "EKL",  bedeutung: "Eintrag ins Klassenbuch" },
  { code: "TAD",  bedeutung: "mündlicher / schriftlicher Tadel" },
  { code: "NAA",  bedeutung: "Nacharbeit und Aufsicht" },
  { code: "EVG",  bedeutung: "vorübergehende Entziehung von Gegenständen" }
];

export const MASSNAHMEN_FARBEN = {
  "PGE": "amber",
  "AS":  "amber",
  "GA":  "amber",
  "WG":  "amber",
  "EKL": "amber",
  "TAD": "amber",
  "NAA": "amber",
  "EVG": "amber",
};

export const SCHULBEGLEITER_CODES = [
  { code: "B",  bedeutung: "beobachtend" },
  { code: "DE", bedeutung: "deeskalierend" },
  { code: "E",  bedeutung: "eingreifend" },
  { code: "U",  bedeutung: "unterstützend" },
  { code: "K",  bedeutung: "keine erkennbare Handlung" }
];

export const WIEDERHOLUNGSGEFAHR = [
  { wert: 0, text: "nicht bekannt" },
  { wert: 1, text: "nein" },
  { wert: 2, text: "eher nein" },
  { wert: 3, text: "unsicher" },
  { wert: 4, text: "eher ja" },
  { wert: 5, text: "ja" }
];

export const WIRKUNG = [
  { wert: 0, text: "nicht bekannt" },
  { wert: 1, text: "Eskalation" },
  { wert: 2, text: "keine Veränderung" },
  { wert: 3, text: "kurzfristige Beruhigung" },
  { wert: 4, text: "nachhaltige Verbesserung" }
];

export const INTENSITAET = [
  { wert: 0, text: "nicht bekannt" },
  { wert: 1, text: "gering (kaum störend)" },
  { wert: 2, text: "mittel (deutlich störend)" },
  { wert: 3, text: "hoch (massiv störend)" },
  { wert: 4, text: "akut gefährdend" }
];