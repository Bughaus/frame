# Entwicklungs-Roadmap – VereinApp

**Version:** 0.2
**Datum:** 2026-03-27
**Änderungen v0.2:** Gästekasse, Eigenbelege und DSGVO-Aktivitätsprotokoll in Stufe 1 eingearbeitet; Passwort-Reset auf Stufe 2 (Muss); 2FA auf Stufe 3 (Muss); Priorisierung aller Sprints überarbeitet.

---

## Überblick

Die Entwicklung ist in drei Hauptphasen gegliedert, die den Ausbaustufen entsprechen. Innerhalb jeder Phase sind die Arbeitspakete nach Abhängigkeiten geordnet.

```
Phase 1 (Stufe 1)          Phase 2 (Stufe 2)         Phase 3 (Stufe 3)
────────────────           ─────────────────          ─────────────────
Fundament & Core           Mobile & Komfort           Server & Skalierung
ca. 8–12 Wochen            ca. 4–6 Wochen             ca. 4–6 Wochen
```

---

## Phase 1: Fundament & Kernfunktionen (Stufe 1)

### Sprint 1 – Projektsetup & Infrastruktur (Woche 1–2)

**Ziel:** Lauffähige Entwicklungsumgebung, leere App erreichbar.

| Aufgabe                                              | Details                                              |
|------------------------------------------------------|------------------------------------------------------|
| Repository-Struktur anlegen                          | Monorepo: `backend/`, `frontend/`, `docs/`           |
| Docker Compose (Dev) einrichten                      | PostgreSQL, Backend (NestJS), Frontend (Vite)        |
| NestJS-Projekt initialisieren                        | TypeScript, Fastify-Adapter, Config-Modul            |
| Prisma-Schema anlegen und erste Migration            | User, Member, RefreshToken                           |
| Vue 3 + Vite + Vuetify einrichten                    | Router, Pinia, vue-i18n, Axios                       |
| CI-Pipeline (GitHub Actions)                         | Lint, Test, Build bei Push                           |
| `.env.example` dokumentieren                         | Alle Konfigurationsvariablen beschreiben             |

**Definition of Done:** `docker compose up` startet alle Dienste, Login-Seite erreichbar.

---

### Sprint 2 – Authentifizierung & Benutzerverwaltung (Woche 3–4)

**Ziel:** Benutzer können sich anmelden, Rollen werden durchgesetzt.

| Aufgabe                                              | Details                                              |
|------------------------------------------------------|------------------------------------------------------|
| Auth-Modul (Backend)                                 | Login, Refresh, Logout, JWT-Guards                   |
| Passwort-Hashing (bcrypt)                            | 12 Runden, Passwort-Reset-Flow vorbereiten           |
| RBAC-System                                          | `@Roles()` Decorator, `RolesGuard`                   |
| RFID-Authentifizierung                               | `RfidInput`-Komponente, `/auth/rfid`-Endpunkt        |
| Brute-Force-Schutz                                   | Login-Sperrung nach 5 Fehlversuchen                  |
| Login-View (Frontend)                                | Benutzername/Passwort + RFID-Modus                   |
| Auth-Store (Pinia)                                   | Token-Management, Auto-Refresh                       |
| Navigation Guards (Router)                           | Weiterleitung wenn nicht angemeldet                  |
| Rate Limiting                                        | @nestjs/throttler für Auth-Endpunkte                 |
| Audit-Log: Login-Ereignisse                          | Erfolg und Fehlschlag protokollieren                 |

**Definition of Done:** Anmeldung mit Benutzername/Passwort und RFID funktioniert. Unbefugter Zugriff auf geschützte Routen wird verhindert.

---

### Sprint 3 – Mitgliederverwaltung & Import (Woche 5–6)

**Ziel:** Mitglieder können ihre Daten sehen, Admins können verwalten und importieren.

| Aufgabe                                              | Details                                              |
|------------------------------------------------------|------------------------------------------------------|
| Members-Modul (Backend)                              | CRUD, Statusverwaltung, Änderungsanträge             |
| Import-Modul                                         | CSV-Parser, Campei-Mapping, Vorschau, Duplikat-Erkennung |
| Admin: Benutzerverwaltung                            | User anlegen, Rollen zuweisen, RFID-Token verwalten  |
| Profil-View (Frontend)                               | Eigene Daten, Änderungsantrag-Formular               |
| Admin-Views                                          | Mitgliederliste, Mitglied-Detail, Import-Assistent   |
| Änderungsantrag-Workflow                             | Antrag stellen, genehmigen/ablehnen                  |

**Definition of Done:** Admin kann Mitglied anlegen und per CSV importieren. Mitglied kann eigene Daten sehen und Änderungsantrag stellen.

---

### Sprint 4 – Kassensystem Mitglieder (Woche 7–8)

**Ziel:** Artikel buchbar, Konten sichtbar, Rechnungen erstellbar.

| Aufgabe                                              | Details                                              |
|------------------------------------------------------|------------------------------------------------------|
| Cash-Register-Modul (Backend)                        | Artikel, Konten, Transaktionen                       |
| Rechnungserstellung                                  | PDF-Generierung (PDFKit), Nummerierung               |
| SEPA-Export                                          | pain.008 XML-Generator                               |
| Kassensystem-Views (Frontend)                        | Kontostand, Transaktionsliste, Buchungsformular      |
| Schatzmeister-Views                                  | Alle Konten, Rechnungsläufe, SEPA-Export             |
| Invoice-PDF im Mitgliederkonto                       | Download der eigenen Rechnungen                      |

**Definition of Done:** Artikel buchbar, Rechnung als PDF abrufbar, SEPA-Export generierbar.

---

### Sprint 4b – Gästekasse & Eigenbelege (Woche 9)

**Ziel:** Gäste können abgerechnet werden; Vorstand/Schatzmeister kann Barbelege erfassen.

| Aufgabe                                              | Details                                              |
|------------------------------------------------------|------------------------------------------------------|
| GuestSlot-Modul (Backend)                            | Slot-Pool, Reservierung, Buchung, Abrechnung + Reset |
| GuestTransaction-Persistenz                          | Snapshot der Artikel, Zahlungsart (Bar/PayPal manuell) |
| Gäste-Slots Veranstaltungszuordnung                  | Optionale Verknüpfung mit CalendarEvent              |
| Gästekasse-Views (Frontend)                          | Slot-Liste, Buchungsmaske, Abrechnung                |
| Eigenbeleg-Modul (Backend)                           | Einnahme/Ausgabe, Dateianhänge (PDF/JPG/PNG)         |
| Eigenbeleg-Views (Frontend)                          | Erfassungsformular, Anhang-Upload, Liste             |
| Schatzmeister-Übersicht                              | Eigenbelege + Gäste-Transaktionen in Kassenübersicht |

**Definition of Done:** Gast-Slot reservierbar, Artikel buchbar, Abrechnung setzt Slot zurück. Eigenbeleg mit Anhang erfassbar und stornierbar.

---

### Sprint 5 – Restliche Kernfunktionen (Woche 10–11)

**Ziel:** Alle geplanten Features für Stufe 1 abgeschlossen.

| Aufgabe                                              | Details                                              |
|------------------------------------------------------|------------------------------------------------------|
| Mitgliederstunden-Modul (Backend)                    | Kontingent, Events, Buchungen, Bestätigung           |
| Stunden-Views (Frontend)                             | Übersicht, Fortschrittsbalken, Anmeldung zu Events   |
| Feedback-Modul (Backend)                             | Erstellen, Beantworten, Status-Workflow              |
| Feedback-Views (Frontend)                            | Formular, Liste, Detail mit Antworten                |
| Dokumentenverwaltung (Backend + Frontend)            | Upload, Kategorien, Download                         |
| Kalender-Modul (Backend + Frontend)                  | FullCalendar, Event-CRUD, Anmeldung                  |
| Systemkonfiguration                                  | Stundenquota, Gäste-Slot-Anzahl, Session-Timeout via Admin-UI |
| **DSGVO-Aktivitätsprotokoll (Backend)**              | ActivityLog-Modul, automatische Protokollierung in allen relevanten Modulen |
| **DSGVO-Aktivitätsprotokoll-View (Frontend)**        | `/me/activity` – Mitglied sieht eigene Aktionen, gefiltert nach Modul/Datum |
| **Datenschutzbestätigung bei Erstanmeldung**         | Modal mit Opt-In, `privacyAcceptedAt` speichern      |

**Definition of Done:** Alle Stufe-1-Anforderungen erfüllt. Mitglied kann eigenes Aktivitätsprotokoll einsehen. Vollständig lauffähige App.

---

### Sprint 6 – Qualitätssicherung & Stufe 1 Abschluss (Woche 12–14)

| Aufgabe                                              | Details                                              |
|------------------------------------------------------|------------------------------------------------------|
| Unit-Tests für alle Service-Schichten                | Zielabdeckung > 70%                                  |
| E2E-Tests (Playwright)                               | Login, Buchung, Rechnung, Import                     |
| Swagger-Dokumentation vervollständigen               | Alle Endpunkte mit Beispielen                        |
| i18n: Alle Texte externalisieren                     | Keine Hard-Coded Strings mehr                        |
| Englische Übersetzung erstellen                      | `en.json` vervollständigen                           |
| Docker Compose (Produktion) erstellen                | Stufe-1-Setup dokumentieren und testen               |
| README und Installationsanleitung schreiben          | Für Vereinsmitglieder ohne IT-Kenntnisse             |
| Sicherheitsaudit                                     | OWASP Top 10 Prüfliste abarbeiten                    |
| User Acceptance Testing                              | Test mit echten Vereinsmitgliedern                   |

**Meilenstein:** **Stufe 1 Release** – produktive Installation im Verein.

---

## Phase 2: Mobile-Kompatibilität (Stufe 2)

### Sprint 7 – Mobile UI & Passwort-Reset (Woche 15–18)

| Aufgabe                                              | Details                                              |
|------------------------------------------------------|------------------------------------------------------|
| Responsive Layouts umsetzen                          | Alle Views für `xs`/`sm` optimieren                  |
| Bottom-Navigation für Smartphones                    | Wichtigste Menüpunkte im Tab-Bar                     |
| Touch-Optimierung                                    | Kalender, Tabellen, Formulare                        |
| Nginx-Container + Self-Signed-Zertifikat             | HTTPS im LAN                                         |
| PWA-Konfiguration (optional)                         | vite-plugin-pwa: "Zum Homescreen hinzufügen"         |
| E-Mail-Konfiguration (SMTP) – **Pflicht ab Stufe 2** | Nodemailer + Handlebars Templates                    |
| **Passwort-Reset per E-Mail** – **Muss**             | `PasswordResetToken`, Flow: forgot → reset, User-Enumeration-Schutz |
| **DSGVO-Export (JSON)** – **Muss**                   | Asynchroner Export-Job, Download-Link, Ablauf 24h    |
| **Admin: DSGVO-Export für Mitglied**                 | Auf schriftliche Anfrage nach Art. 15 DSGVO          |
| Performance-Optimierung                              | Lazy Loading, Bundle-Splitting, Image-Optimierung    |

**Meilenstein:** **Stufe 2 Release** – Passwort-Reset verfügbar, DSGVO-Export möglich, Mitglieder können per Smartphone im Verein zugreifen.

---

## Phase 3: Self-Hosted Server (Stufe 3)

### Sprint 8–9 – Server-Deployment & 2FA (Woche 19–24)

| Aufgabe                                              | Details                                              |
|------------------------------------------------------|------------------------------------------------------|
| Server-Setup-Dokumentation                           | Ubuntu, UFW, Docker Installation                     |
| Let's Encrypt + Certbot                              | Automatische Zertifikatserneuerung                   |
| Nginx: intern/extern Trennung                        | Geo-Modul, Zugangsbeschränkungen                     |
| Monitoring einrichten                                | UptimeRobot, Log-Rotation                            |
| Automatische Backups                                 | DB + Uploads täglich, rclone für externes Backup     |
| CI/CD-Pipeline (GitHub Actions)                      | Automatisches Deployment bei Push auf `main`         |
| **2FA (TOTP) für alle Benutzer** – **Muss**          | otplib, QR-Code-Einrichtung, Backup-Codes            |
| **2FA Pflicht-Enforcement für Admin/Schatzmeister**  | Middleware prüft 2FA-Status; Erzwingung bei Login    |
| **2FA-Reset durch Admin**                            | Admin kann 2FA bei verlorenem Gerät zurücksetzen     |
| **Pre-Auth-Token-Flow im Login**                     | Zwei-Schritt-Login: Passwort → 2FA-Code              |
| APP_ENCRYPTION_KEY für TOTP-Secret-Verschlüsselung  | AES-256, in .env, nie in DB im Klartext              |
| VPN-Option dokumentieren                             | WireGuard für sicheren Fernzugriff auf Admin-Bereich |
| Lasttest                                             | k6-Load-Tests auf Produktionsumgebung                |

**Meilenstein:** **Stufe 3 Release** – 2FA aktiv und für privilegierte Rollen verpflichtend; Verein betreibt eigenen Server, Mitglieder haben Zugriff von zuhause.

---

## Feature-Backlog (Post-Stufe 3)

Diese Features sind bewusst nicht im MVP geplant, können aber nach Stufe 3 umgesetzt werden:

| Feature                                       | Priorität | Aufwand |
|-----------------------------------------------|-----------|---------|
| Kassenbericht (Monats-/Jahresabschluss)       | Hoch      | L       |
| ZIP-Export Eigenbelege (Anhänge + Liste)      | Mittel    | M       |
| Gäste-Abrechnungsbeleg als PDF                | Mittel    | S       |
| Push-Benachrichtigungen (PWA)                 | Mittel    | M       |
| Stunden-Erinnerungs-E-Mails                   | Mittel    | S       |
| Mitglieder-Statistiken (Charts, Dashboard)    | Mittel    | L       |
| Wiederkehrende Mitgliedsbeiträge              | Mittel    | M       |
| Dokument-Versionierung                        | Niedrig   | M       |
| iCal-Export für Kalender                      | Niedrig   | S       |
| Wartelisten für Stundenaktionen               | Niedrig   | S       |
| Gruppen- / Abteilungsverwaltung               | Mittel    | L       |
| Online-Anmeldeformular für neue Mitglieder    | Niedrig   | L       |
| Profilfotos für Mitglieder                    | Niedrig   | S       |
| Interner Chat / Schwarzes Brett               | Niedrig   | XL      |

---

## Technische Schulden & Risiken

| Risiko                                    | Wahrscheinlichkeit | Maßnahme                                            |
|-------------------------------------------|--------------------|-----------------------------------------------------|
| Campei CSV-Format unbekannt               | Mittel             | Vor Sprint 3: echte CSV-Datei vom Verein anfordern  |
| RFID-Hardware-Inkompatibilität            | Niedrig            | HID-Modus funktioniert mit 95% aller USB-Lesegeräte |
| PostgreSQL auf Windows-Host instabil      | Niedrig            | Docker-Volume auf NTFS kann langsam sein; SSD empfohlen |
| SEPA-Format-Anforderungen der Bank        | Mittel             | Vor Produktiveinsatz: Testlauf mit Hausbank         |
| Performance bei vielen gleichzeitigen Zugriffen | Niedrig      | Stufe 1 ist Single-User-Kontext; kein Problem       |
| SMTP-Konfiguration für Passwort-Reset     | Niedrig            | Vor Stufe-2-Release: SMTP-Test mit Vereins-E-Mail-Konto |
| 2FA-Recovery bei verlorenem Gerät         | Mittel             | Admin-Reset-Prozess dokumentieren; Backup-Codes trainieren |
| PayPal-Referenznummern nicht verifizierbar | Niedrig           | Explizit dokumentieren: manuelle Erfassung, keine Validierung |
| DSGVO-Export: sensible Daten im JSON      | Mittel             | Export-Download zeitlich begrenzen (24h), nur für eingeloggten Benutzer |

---

## Definition of Done (global)

Ein Feature gilt als fertig wenn:
- Alle Akzeptanzkriterien erfüllt sind
- Unit-Tests vorhanden und grün
- Swagger-Dokumentation aktualisiert
- i18n-Texte in DE und EN vorhanden
- Code-Review abgeschlossen (mindestens 1 Reviewer)
- Keine bekannten kritischen Bugs
