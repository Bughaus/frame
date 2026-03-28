# Anforderungsspezifikation – VereinApp

**Version:** 0.2
**Datum:** 2026-03-27
**Änderungen v0.2:** Gästekasse, Eigenbelege, 2FA/Passwort-Reset präzisiert, DSGVO-Transparenz ergänzt, Priorisierungen angepasst.

---

## 1. Funktionale Anforderungen

### 1.1 Authentifizierung & Benutzerverwaltung

| ID    | Anforderung                                                                                         | Priorität | Stufe |
|-------|-----------------------------------------------------------------------------------------------------|-----------|-------|
| A-01  | Benutzer können sich mit Benutzername und Passwort anmelden.                                        | Muss      | 1     |
| A-02  | Benutzer können sich alternativ mit einem RFID-Token anmelden.                                      | Muss      | 1     |
| A-03  | Das System unterstützt RFID-Lesegeräte, die als HID-Gerät (Tastatur-Emulation) arbeiten.           | Muss      | 1     |
| A-04  | Die Authentifizierung basiert auf JWT Access Tokens und Refresh Tokens.                             | Muss      | 1     |
| A-05  | Passwörter werden sicher gehasht (bcrypt, min. 12 Runden).                                          | Muss      | 1     |
| A-06  | Benutzer können ihr eigenes Passwort ändern.                                                        | Muss      | 1     |
| A-07  | Ein Administrator kann Benutzer anlegen, deaktivieren und Rollen zuweisen.                          | Muss      | 1     |
| A-08  | Inaktive Benutzer können sich nicht anmelden.                                                       | Muss      | 1     |
| A-09  | RFID-Tokens können Benutzern durch Admins zugewiesen und entzogen werden.                           | Muss      | 1     |
| A-10  | Sessions laufen nach einer konfigurierbaren Zeit ab (Standard: 8 Stunden).                         | Soll      | 1     |
| A-11  | Mehrfachsessions auf verschiedenen Geräten werden unterstützt.                                      | Soll      | 2     |
| A-12  | Passwort-Reset per E-Mail (einmaliger, zeitbeschränkter Token).                                     | **Muss**  | **2** |
| A-13  | Zwei-Faktor-Authentifizierung (TOTP/Authenticator-App) **für alle Benutzer** verfügbar.            | **Muss**  | **3** |
| A-14  | 2FA ist für Admins und Schatzmeister ab Stufe 3 **verpflichtend** (konfigurierbar).                | **Muss**  | **3** |
| A-15  | 2FA-Einrichtung (QR-Code) und -Deaktivierung im eigenen Profil.                                    | **Muss**  | **3** |
| A-16  | Admin kann 2FA eines Benutzers zurücksetzen (bei verlorenem Gerät).                                 | **Muss**  | **3** |

---

### 1.2 Mitgliederstammdaten

| ID    | Anforderung                                                                                         | Priorität | Stufe |
|-------|-----------------------------------------------------------------------------------------------------|-----------|-------|
| M-01  | Jedes Mitglied kann seine eigenen Stammdaten einsehen (Name, Adresse, E-Mail, Telefon, Mitgliedsnummer). | Muss | 1  |
| M-02  | Mitglieder können Änderungen ihrer Stammdaten beantragen (kein direktes Ändern).                    | Muss      | 1     |
| M-03  | Vorstand/Admin sieht ausstehende Änderungsanträge und kann diese genehmigen oder ablehnen.          | Muss      | 1     |
| M-04  | Das System zeigt Eintrittsdatum, Mitgliedschaftsstatus und Beitragskategorie an.                    | Muss      | 1     |
| M-05  | Admins können alle Mitgliederdaten einsehen und direkt bearbeiten.                                  | Muss      | 1     |
| M-06  | Mitgliedsdaten können aus externen Systemen importiert werden (Campei, CSV).                        | Muss      | 1     |
| M-07  | Beim Import wird Duplikat-Erkennung (per Mitgliedsnummer oder Name+Geburtsdatum) durchgeführt.     | Muss      | 1     |
| M-08  | Mitglieder können ihr Profilfoto hochladen.                                                         | Kann      | 2     |

---

### 1.3 Mitgliederstunden

| ID    | Anforderung                                                                                         | Priorität | Stufe |
|-------|-----------------------------------------------------------------------------------------------------|-----------|-------|
| S-01  | Jedes Mitglied hat ein Jahres-Kontingent an zu leistenden Stunden.                                  | Muss      | 1     |
| S-02  | Mitglieder können ihren Stundenstand (geleistet / gesamt) einsehen.                                 | Muss      | 1     |
| S-03  | Mitglieder können sich für Stundenaktionen/-einsätze anmelden (Buchung).                            | Muss      | 1     |
| S-04  | Vorstand/Admin kann Stundeneinsätze anlegen, bearbeiten und löschen.                                | Muss      | 1     |
| S-05  | Stunden können vom Vorstand nach Abschluss eines Einsatzes für Mitglieder bestätigt werden.         | Muss      | 1     |
| S-06  | Das System zeigt an, wenn ein Mitglied sein Kontingent nicht erfüllt hat.                           | Muss      | 1     |
| S-07  | Jahresübersicht der geleisteten Stunden je Mitglied (für Admin/Vorstand).                           | Soll      | 1     |
| S-08  | Erinnerungs-E-Mails an Mitglieder, die ihr Kontingent noch nicht erfüllt haben.                    | Kann      | 2     |

---

### 1.4 Feedback & Kommunikation

| ID    | Anforderung                                                                                         | Priorität | Stufe |
|-------|-----------------------------------------------------------------------------------------------------|-----------|-------|
| F-01  | Mitglieder können Fragen oder Feedback-Nachrichten an den Vorstand senden.                          | Muss      | 1     |
| F-02  | Nachrichten werden kategorisiert (z.B. Frage, Feedback, Beschwerde, Sonstiges).                    | Soll      | 1     |
| F-03  | Vorstand kann Nachrichten einsehen, beantworten und als erledigt markieren.                         | Muss      | 1     |
| F-04  | Mitglieder sehen den Status ihrer Anfrage (offen, in Bearbeitung, beantwortet).                     | Muss      | 1     |
| F-05  | Benachrichtigung des Vorstands bei neuen Nachrichten (in-App).                                      | Soll      | 1     |
| F-06  | Benachrichtigung per E-Mail bei neuen Nachrichten (konfigurierbar).                                 | Kann      | 2     |

---

### 1.5 Dokumentenverwaltung

| ID    | Anforderung                                                                                         | Priorität | Stufe |
|-------|-----------------------------------------------------------------------------------------------------|-----------|-------|
| D-01  | Dokumente werden in Kategorien strukturiert (Satzung, Beitragsordnung, Hausordnung, etc.).          | Muss      | 1     |
| D-02  | Alle angemeldeten Mitglieder können Dokumente einsehen und herunterladen.                           | Muss      | 1     |
| D-03  | Vorstand/Admin kann Dokumente hochladen, umbenennen und löschen.                                    | Muss      | 1     |
| D-04  | Unterstützte Formate: PDF, DOCX, XLSX, Bilder (JPG/PNG).                                           | Muss      | 1     |
| D-05  | Dokumente haben Metadaten: Titel, Kategorie, Hochladedatum, Version.                                | Soll      | 1     |
| D-06  | Versionierung von Dokumenten (ältere Versionen bleiben abrufbar).                                  | Kann      | 2     |

---

### 1.6 Vereinskalender

| ID    | Anforderung                                                                                         | Priorität | Stufe |
|-------|-----------------------------------------------------------------------------------------------------|-----------|-------|
| K-01  | Alle Mitglieder können den Vereinskalender mit Veranstaltungen einsehen.                            | Muss      | 1     |
| K-02  | Veranstaltungen haben: Titel, Beschreibung, Datum/Zeit, Ort, Kategorie.                             | Muss      | 1     |
| K-03  | Vorstand/Admin kann Veranstaltungen anlegen, bearbeiten und löschen.                                | Muss      | 1     |
| K-04  | Mitglieder können sich für Veranstaltungen anmelden/abmelden (optional).                            | Soll      | 1     |
| K-05  | Kalenderansicht (Monat, Woche, Liste).                                                              | Soll      | 1     |
| K-06  | Export von Veranstaltungen als iCal (.ics).                                                         | Kann      | 2     |

---

### 1.7 Kassensystem – Mitglieder

| ID    | Anforderung                                                                                         | Priorität | Stufe |
|-------|-----------------------------------------------------------------------------------------------------|-----------|-------|
| C-01  | Jedes Mitglied besitzt ein internes Konto im Kassensystem.                                          | Muss      | 1     |
| C-02  | Artikel (Produkte/Dienstleistungen) können angelegt, bearbeitet und deaktiviert werden.             | Muss      | 1     |
| C-03  | Artikel können auf das Konto eines Mitglieds gebucht werden (durch Mitglied oder Admin).            | Muss      | 1     |
| C-04  | Mitglieder können ihren Kontostand und ihre Transaktionshistorie einsehen.                          | Muss      | 1     |
| C-05  | Der Schatzmeister kann Rechnungen für einzelne Mitglieder oder alle Mitglieder erstellen.           | Muss      | 1     |
| C-06  | Rechnungen werden als PDF erstellt und im Mitgliederkonto bereitgestellt.                           | Muss      | 1     |
| C-07  | Das System unterstützt die Vorbereitung von SEPA-Lastschriftläufen (XML-Export nach ISO 20022).    | Muss      | 1     |
| C-08  | Mitgliedsbeiträge können als wiederkehrende Buchung konfiguriert werden.                            | Soll      | 2     |
| C-09  | Kassenbericht (Monats-/Jahresabschluss) für den Schatzmeister.                                     | Soll      | 2     |
| C-10  | Stornierung von Buchungen durch den Schatzmeister/Admin.                                            | Muss      | 1     |

---

### 1.8 Kassensystem – Gästekasse

Mitglieder können Gäste über einen separaten Gästebereich abrechnen. Gäste sind keine Benutzer im System, sondern temporäre Nummern-Slots.

| ID    | Anforderung                                                                                         | Priorität | Stufe |
|-------|-----------------------------------------------------------------------------------------------------|-----------|-------|
| G-01  | Das System verfügt über einen konfigurierbaren Pool nummernbasierter Gäste-Slots (z.B. Gast 1–20). | Muss      | 1     |
| G-02  | Einem Gäste-Slot kann optional ein temporärer Name zugewiesen werden.                               | Soll      | 1     |
| G-03  | Artikel können auf einen Gäste-Slot gebucht werden (durch das verantwortliche Mitglied).           | Muss      | 1     |
| G-04  | Gäste können einer Veranstaltung (CalendarEvent) optional zugeordnet werden.                        | Soll      | 1     |
| G-05  | Gäste bezahlen entweder **bar** oder per **PayPal** (manuelle Erfassung, keine API-Integration).   | Muss      | 1     |
| G-06  | Nach Abschluss der Abrechnung wird der Gäste-Slot zurückgesetzt (Name gelöscht, Saldo auf 0).      | Muss      | 1     |
| G-07  | Gäste-Transaktionen werden in einer separaten Übersicht (Gästekasse) aufgelistet.                   | Muss      | 1     |
| G-08  | Der Schatzmeister kann alle abgeschlossenen Gäste-Abrechnungen einsehen und exportieren.            | Soll      | 1     |
| G-09  | Ein Gäste-Slot kann nur von einem Mitglied gleichzeitig genutzt werden (Reservierung).              | Soll      | 1     |
| G-10  | Gäste-Abrechnungsbeleg kann als PDF ausgedruckt werden.                                             | Kann      | 2     |

**Hinweis zu PayPal:** Es erfolgt keine API-Integration mit PayPal. Die Zahlungsart wird lediglich als Datensatz erfasst (z.B. „PayPal – Referenz: PP-12345"). Die eigentliche Zahlung läuft außerhalb des Systems.

---

### 1.9 Kassensystem – Eigenbelege (Vorstand/Schatzmeister)

Eigenbelege ermöglichen die Erfassung von Bareinnahmen und -ausgaben außerhalb des normalen Buchungssystems (z.B. Kassenentnahmen, Einzahlungen, Materialeinkäufe).

| ID    | Anforderung                                                                                         | Priorität | Stufe |
|-------|-----------------------------------------------------------------------------------------------------|-----------|-------|
| E-01  | Vorstand/Schatzmeister kann Eigenbelege anlegen (Einnahme oder Ausgabe).                            | Muss      | 1     |
| E-02  | Jeder Eigenbeleg hat: Betrag, Typ (Einnahme/Ausgabe), Datum, Beschreibung, Kategorie.               | Muss      | 1     |
| E-03  | An jeden Eigenbeleg können Belege (Quittungen, Fotos) als Dateianhang hochgeladen werden.           | Muss      | 1     |
| E-04  | Unterstützte Anhang-Formate: PDF, JPG, PNG (max. 10 MB pro Anhang, max. 5 Anhänge pro Beleg).      | Muss      | 1     |
| E-05  | Eigenbelege werden in der Kassenübersicht des Schatzmeisters separat aufgelistet.                   | Muss      | 1     |
| E-06  | Eigenbelege fließen in den Kassenbericht (Saldo der Barkasse) ein.                                  | Muss      | 1     |
| E-07  | Eigenbelege können storniert werden (mit Pflichtangabe eines Grundes).                              | Muss      | 1     |
| E-08  | Alle Eigenbelege mit Anhängen sind für den Schatzmeister exportierbar (ZIP-Archiv).                 | Soll      | 2     |

---

### 1.10 DSGVO – Datentransparenz

Jedes Mitglied hat nach DSGVO Art. 15 das Recht, alle zu seiner Person gespeicherten Daten und Aktionen einzusehen.

| ID    | Anforderung                                                                                         | Priorität | Stufe |
|-------|-----------------------------------------------------------------------------------------------------|-----------|-------|
| DSG-01 | Jedes Mitglied kann im eigenen Profil alle Aktionen einsehen, die in seinem Namen durchgeführt wurden (Aktivitätsprotokoll). | Muss | 1 |
| DSG-02 | Das Aktivitätsprotokoll zeigt: Login-Ereignisse, Buchungen, Rechnungen, Änderungsanträge, Feedback, Stundenbuchungen. | Muss | 1 |
| DSG-03 | Mitglieder können eine vollständige Kopie ihrer gespeicherten Daten als strukturierten Export anfordern (DSGVO-Export: JSON oder PDF). | Muss | 2 |
| DSG-04 | Der DSGVO-Export enthält: Stammdaten, alle Transaktionen, alle Rechnungen, Stundennachweise, Login-Verlauf, Feedback-Verläufe. | Muss | 2 |
| DSG-05 | Der Export wird asynchron erstellt und dem Mitglied als Download bereitgestellt.                    | Soll      | 2     |
| DSG-06 | Admin kann für jedes Mitglied einen DSGVO-Export erstellen (z.B. auf schriftliche Anfrage).         | Muss      | 2     |
| DSG-07 | Bei Erstanmeldung muss das Mitglied die Datenschutzerklärung aktiv bestätigen (Opt-In, datiert).    | Muss      | 1     |
| DSG-08 | Das Aktivitätsprotokoll ist für Admins vollständig einsehbar (inkl. Aktionen durch andere Benutzer im Namen des Mitglieds). | Muss | 1 |

---

### 1.11 Import / Datenmigration

| ID    | Anforderung                                                                                         | Priorität | Stufe |
|-------|-----------------------------------------------------------------------------------------------------|-----------|-------|
| I-01  | Import von Mitgliederdaten aus Campei (CSV-Export-Format).                                          | Muss      | 1     |
| I-02  | Import von Mitgliederdaten aus generischen CSV-Dateien mit Spaltenmapping.                          | Muss      | 1     |
| I-03  | Vor dem Import wird eine Vorschau der zu importierenden Daten angezeigt.                            | Muss      | 1     |
| I-04  | Duplikate werden erkannt; der Admin entscheidet über Merge oder Überschreiben.                      | Muss      | 1     |
| I-05  | Import-Protokoll (welche Datensätze importiert, übersprungen, fehlerhaft).                          | Muss      | 1     |

---

## 2. Nicht-funktionale Anforderungen

### 2.1 Performance

| ID    | Anforderung                                                                                         |
|-------|-----------------------------------------------------------------------------------------------------|
| P-01  | Seitenlade-Zeit im lokalen Netzwerk: < 2 Sekunden (p95).                                           |
| P-02  | API-Antwortzeiten für Standard-Anfragen: < 500 ms (p95).                                           |
| P-03  | Das System unterstützt bis zu 500 aktive Mitglieder ohne Performance-Degradation.                  |

### 2.2 Sicherheit

| ID    | Anforderung                                                                                         |
|-------|-----------------------------------------------------------------------------------------------------|
| SEC-01 | Alle Datenbankpasswörter und Secrets werden über Umgebungsvariablen / .env-Dateien konfiguriert.  |
| SEC-02 | Kommunikation zwischen Client und Server erfolgt ausschließlich über HTTPS (ab Stufe 2).           |
| SEC-03 | Alle API-Endpunkte sind durch Rollenprüfung geschützt (RBAC – Role-Based Access Control).         |
| SEC-04 | Eingaben werden serverseitig validiert und gegen SQL-Injection / XSS gesichert.                    |
| SEC-05 | Fehlgeschlagene Login-Versuche werden gezählt; nach 5 Fehlversuchen wird das Konto temporär gesperrt. |
| SEC-06 | RFID-Token-Werte werden gehasht in der Datenbank gespeichert.                                      |
| SEC-07 | In Stufe 3: Bestimmte API-Endpunkte sind nur aus dem internen Netzwerk erreichbar.                 |
| SEC-08 | Ab Stufe 3: 2FA ist für Admins und Schatzmeister verpflichtend (erzwungen beim Login).             |
| SEC-09 | Ab Stufe 2: Passwort-Reset per E-Mail (zeitbeschränkter Einmal-Token, 1 Stunde gültig).            |

### 2.3 Wartbarkeit & Erweiterbarkeit

| ID    | Anforderung                                                                                         |
|-------|-----------------------------------------------------------------------------------------------------|
| W-01  | Der Code folgt dem Prinzip der Separation of Concerns (Controller, Service, Repository).           |
| W-02  | Alle API-Endpunkte sind vollständig in OpenAPI/Swagger dokumentiert.                               |
| W-03  | Datenbankmigrationen werden mit Prisma Migrate verwaltet.                                          |
| W-04  | Unit-Tests für alle Service-Schichten (Zielabdeckung: > 70 %).                                     |
| W-05  | E2E-Tests für kritische User Journeys (Login, Buchung, Rechnung).                                  |
| W-06  | Konfigurierbare Parameter (Session-Dauer, Kontingente, etc.) werden in der DB gespeichert.         |

### 2.4 Internationalisierung (i18n)

| ID    | Anforderung                                                                                         |
|-------|-----------------------------------------------------------------------------------------------------|
| L-01  | Die UI ist vollständig in Deutsch (Standard) und Englisch verfügbar.                               |
| L-02  | Die Sprachauswahl wird im Benutzerprofil gespeichert.                                              |
| L-03  | Datum-, Zeit- und Währungsformate passen sich der gewählten Sprache an.                            |
| L-04  | Alle UI-Texte sind in Übersetzungsdateien ausgelagert (kein Hard-Coded Text).                      |

### 2.5 Verfügbarkeit & Backup

| ID    | Anforderung                                                                                         |
|-------|-----------------------------------------------------------------------------------------------------|
| B-01  | Das System ermöglicht tägliche automatische Datenbank-Backups (via Docker Volume / Cron).          |
| B-02  | Eine Wiederherstellungsprozedur für Backups ist dokumentiert.                                      |
| B-03  | In Stufe 1: kein HA-Requirement; Single-Node ist ausreichend.                                      |

---

## 3. Randbedingungen & Annahmen

- Das System wird initial für einen Sportverein mit ca. 50–500 Mitgliedern entwickelt.
- Die primäre Sprache der UI ist Deutsch; Englisch ist vollständig als zweite Sprache verfügbar.
- RFID-Hardware ist noch nicht festgelegt; die Architektur ist hardware-agnostisch (HID-Emulation als Standard-Interface).
- Der Campei-Import basiert auf dem Standard-CSV-Export; das genaue Spaltenformat wird bei der Implementierung konkretisiert.
- Für Stufe 1 ist keine E-Mail-Funktionalität zwingend erforderlich (optional via SMTP-Konfiguration). Ab Stufe 2 ist SMTP Pflicht (Passwort-Reset).
- Rechtliche Anforderungen (DSGVO): Personenbezogene Daten werden ausschließlich auf dem eigenen Server gespeichert.
- PayPal-Zahlungen für Gäste werden nur manuell als Datensatz erfasst; eine API-Integration mit PayPal ist ausdrücklich nicht vorgesehen.
- Der Gäste-Slot-Pool ist initial auf 20 Nummern konfiguriert, konfigurierbar durch Admin.
- Eigenbelege ersetzen keine vollständige Buchhaltungssoftware; sie dienen der einfachen Erfassung von Barbewegungen.

## 4. Priorisierungsübersicht nach Stufen

### Stufe 1 – Muss (MVP)
Authentifizierung (Passwort + RFID), Mitgliederstammdaten + Import, Mitgliederstunden, Kassensystem (Mitglieder + Gästekasse + Eigenbelege), Rechnungs-PDF, SEPA-Export-Vorbereitung, Feedback, Dokumente, Kalender, DSGVO-Aktivitätsprotokoll, Datenschutzbestätigung.

### Stufe 2 – Muss
**Passwort-Reset per E-Mail**, mobile-optimierte UI, HTTPS, DSGVO-Datenexport (JSON/PDF), E-Mail-Benachrichtigungen, wiederkehrende Beiträge.

### Stufe 3 – Muss
**2FA (verpflichtend für Admins/Schatzmeister)**, Self-Hosting auf eigenem Server, intern/extern-Zugriffstrennung, CI/CD.

### Backlog (Post-Stufe 3)
Profilfotos, Dokument-Versionierung, iCal-Export, Gäste-Abrechnungsbeleg PDF, ZIP-Export Eigenbelege, Kassenbericht.
