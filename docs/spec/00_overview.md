# Vereins-Webapp – Projektübersicht

**Projektname:** VereinApp
**Version:** 0.1 (Spezifikation)
**Datum:** 2026-03-27
**Status:** Entwurf

---

## 1. Projektziel

VereinApp ist eine webbasierte Mitglieder-Verwaltungsanwendung für Sportvereine. Sie digitalisiert und zentralisiert alle relevanten Vereinsprozesse: Mitgliederverwaltung, Stundenbuchungen, Kassensystem, Dokumentenverwaltung und Kommunikation mit dem Vorstand. Die App ist auf Selbstbetrieb (Self-Hosting) ausgelegt und in drei Ausbaustufen geplant.

---

## 2. Ausbaustufen

| Stufe | Bezeichnung           | Beschreibung                                                                                   |
|-------|-----------------------|-----------------------------------------------------------------------------------------------|
| 1     | Lokaler Betrieb       | Installation auf einem festen Rechner im Verein; Zugriff über Browser im lokalen Netzwerk.    |
| 2     | Mobile-Kompatibilität | Mobile-optimierte UI; Zugriff für Mitglieder via Smartphone im Vereinsnetz.                   |
| 3     | Self-Hosted Server    | Vollständige Deployment-Fähigkeit auf eigenem Server; differenzierter Zugriff intern/extern.  |

---

## 3. Zielgruppe und Nutzerrollen

| Rolle          | Beschreibung                                                                              |
|----------------|------------------------------------------------------------------------------------------|
| **Mitglied**   | Normales Vereinsmitglied; Einsicht eigener Daten, Buchungen, Dokumente, Kalender.         |
| **Vorstand**   | Erweiterte Rechte: Feedback einsehen, Mitglieder verwalten, Dokumente verwalten.          |
| **Schatzmeister** | Kassenzugriff: Konten einsehen, Einzüge vorbereiten, Rechnungen erstellen.            |
| **Admin**      | Systemweiter Zugriff; Benutzerverwaltung, Konfiguration, Import, RFID-Verwaltung.         |

---

## 4. Kernfunktionen (Überblick)

### 4.1 Mitgliederportal
- Einsicht und Änderungsanträge eigener Stammdaten
- Einsicht und Buchung von Mitgliederstunden (Kontingent-Verwaltung)
- Feedback & Fragen an den Vorstand
- Dokumentenzugriff (Satzung, Beitragsordnung, Hausordnung, etc.)
- Vereinskalender (Veranstaltungen)
- Konto im Kassensystem (Artikel buchen, Kontostand einsehen, Rechnungen)

### 4.2 Vorstandsportal
- Mitgliederverwaltung (Stammdaten, Rollen)
- Feedback- und Anfragenmanagement
- Dokumentenverwaltung (Upload, Kategorisierung)
- Kalender- und Veranstaltungsverwaltung

### 4.3 Kassensystem
- Artikelverwaltung (Produkte, Preise)
- Buchungen auf Mitgliederkonten
- Kontoübersicht je Mitglied
- Rechnungserstellung und Bereitstellung in der App
- Vorbereitung von Lastschrift-/Einzugsläufen (SEPA) für den Schatzmeister

### 4.4 Administration
- Benutzerverwaltung (Anlegen, Rollen zuweisen, deaktivieren)
- RFID-Token-Verwaltung (Zuweisung zu Mitgliedern)
- Import von Mitgliederdaten (z. B. aus Campei oder CSV)
- Systemkonfiguration

---

## 5. Technologie-Entscheidungen (Kurzübersicht)

| Bereich       | Technologie                              |
|---------------|------------------------------------------|
| Backend       | Node.js mit NestJS (TypeScript)          |
| Frontend      | Vue 3 (Composition API) mit Vuetify 3   |
| Datenbank     | PostgreSQL 16                            |
| ORM           | Prisma                                   |
| Authentifizierung | JWT + Refresh Tokens, RFID (hardwareagnostisch) |
| i18n          | vue-i18n (Deutsch Standard, Englisch)    |
| Deployment    | Docker / Docker Compose                  |

Detailbeschreibung siehe [02_architecture.md](./02_architecture.md).

---

## 6. Nicht-Ziele (Out of Scope – initial)

- Öffentliche Vereinswebsite / Außendarstellung
- Vollständige Buchhaltungssoftware (nur einfaches Kassensystem)
- Online-Zahlungsabwicklung (Stripe etc.) – nur SEPA-Vorbereitung
- Native Mobile App (iOS/Android) – Mobile Web reicht für Stufe 2

---

## 7. Verwandte Dokumente

| Dokument                              | Inhalt                                   |
|---------------------------------------|------------------------------------------|
| [01_requirements.md](./01_requirements.md)   | Funktionale & nicht-funktionale Anforderungen |
| [02_architecture.md](./02_architecture.md)   | Systemarchitektur & Tech-Stack           |
| [03_database_schema.md](./03_database_schema.md) | Datenbankdesign & Entitäten          |
| [04_api_specification.md](./04_api_specification.md) | REST API Endpunkte               |
| [05_security.md](./05_security.md)           | Sicherheitskonzept & Authentifizierung   |
| [06_frontend.md](./06_frontend.md)           | Frontend-Architektur & i18n              |
| [07_deployment.md](./07_deployment.md)       | Deployment-Strategie (3 Stufen)          |
| [08_roadmap.md](./08_roadmap.md)             | Entwicklungs-Roadmap & Meilensteine      |
