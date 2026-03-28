# API-Spezifikation – VereinApp

**Version:** 0.2
**Datum:** 2026-03-27
**Änderungen v0.2:** Gästekasse, Eigenbelege, 2FA-Endpunkte, Passwort-Reset, DSGVO-Export.
**Base URL:** `/api/v1`
**Format:** JSON
**Auth:** Bearer JWT (Authorization: Bearer `<token>`)

> Die vollständige, interaktive API-Dokumentation wird automatisch durch NestJS/Swagger unter `/api/docs` generiert.

---

## 1. Konventionen

### HTTP-Statuscodes

| Code | Bedeutung                                      |
|------|------------------------------------------------|
| 200  | OK – Anfrage erfolgreich                       |
| 201  | Created – Ressource erstellt                   |
| 204  | No Content – Erfolgreich, kein Rückgabewert    |
| 400  | Bad Request – Validierungsfehler               |
| 401  | Unauthorized – Nicht angemeldet                |
| 403  | Forbidden – Keine Berechtigung                 |
| 404  | Not Found – Ressource nicht gefunden           |
| 409  | Conflict – z.B. Duplikat                       |
| 422  | Unprocessable Entity – Geschäftslogikfehler    |
| 500  | Internal Server Error                          |

### Rollen-Kürzel in dieser Dokumentation

| Kürzel | Rolle                                                    |
|--------|----------------------------------------------------------|
| `*`    | Alle authentifizierten Benutzer                          |
| `M`    | MEMBER                                                   |
| `V`    | VORSTAND                                                 |
| `S`    | SCHATZMEISTER                                            |
| `A`    | ADMIN                                                    |

### Paginierung

Listenendpunkte unterstützen Query-Parameter:
```
?page=1&limit=20&sortBy=createdAt&sortOrder=desc
```
Antwortformat:
```json
{
  "data": [...],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

---

## 2. Authentifizierung (`/auth`)

### POST `/auth/login`
Anmeldung mit Benutzername und Passwort.

**Zugriff:** Öffentlich

**Request:**
```json
{
  "username": "max.mustermann",
  "password": "Geheimwort123!"
}
```

**Response 200:**
```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci...",
  "expiresIn": 900,
  "user": {
    "id": "uuid",
    "username": "max.mustermann",
    "roles": ["MEMBER"],
    "language": "de"
  }
}
```

---

### POST `/auth/rfid`
Anmeldung per RFID-Token.

**Zugriff:** Öffentlich

**Request:**
```json
{
  "rfidToken": "0123456789ABCDEF"
}
```

**Response 200:** Gleich wie `/auth/login`

---

### POST `/auth/refresh`
Erneuert das Access Token.

**Zugriff:** Öffentlich (mit gültigem Refresh Token)

**Request:**
```json
{
  "refreshToken": "eyJhbGci..."
}
```

---

### POST `/auth/logout`
Invalidiert das Refresh Token.

**Zugriff:** `*`

---

### POST `/auth/change-password`
Passwort ändern.

**Zugriff:** `*`

**Request:**
```json
{
  "currentPassword": "AltesPasswort1",
  "newPassword": "NeuesPasswort123!"
}
```

---

### POST `/auth/forgot-password`
Passwort-Reset-E-Mail anfordern. *(ab Stufe 2)*

**Zugriff:** Öffentlich

**Request:**
```json
{ "email": "max@example.com" }
```

**Response 200:** Immer gleiche Antwort (kein Hinweis ob E-Mail existiert – Schutz vor User-Enumeration):
```json
{ "message": "Wenn die E-Mail bekannt ist, wurde eine Nachricht gesendet." }
```

---

### POST `/auth/reset-password`
Passwort mit Reset-Token zurücksetzen. *(ab Stufe 2)*

**Zugriff:** Öffentlich

**Request:**
```json
{
  "token": "abc123...",
  "newPassword": "NeuesPasswort123!"
}
```

---

### POST `/auth/2fa/setup`
2FA einrichten – gibt TOTP-Secret und QR-Code zurück. *(ab Stufe 3)*

**Zugriff:** `*`

**Response 200:**
```json
{
  "secret": "BASE32SECRET",
  "qrCodeDataUrl": "data:image/png;base64,..."
}
```

---

### POST `/auth/2fa/verify`
2FA-Code bestätigen und aktivieren. *(ab Stufe 3)*

**Zugriff:** `*`

**Request:**
```json
{ "code": "123456" }
```

---

### DELETE `/auth/2fa`
2FA deaktivieren (Passwort + aktueller TOTP-Code erforderlich). *(ab Stufe 3)*

**Zugriff:** `*`

**Request:**
```json
{
  "password": "MeinPasswort",
  "code": "123456"
}
```

---

### POST `/auth/login/2fa`
Zweiten Faktor nach erfolgreichem Passwort-Login eingeben. *(ab Stufe 3)*

**Zugriff:** Öffentlich (temporärer Pre-Auth-Token aus `/auth/login` erforderlich)

**Request:**
```json
{
  "preAuthToken": "...",
  "code": "123456"
}
```

**Response 200:** Gleich wie `/auth/login` (vollständiger accessToken).

---

## 3. Eigenes Profil (`/me`)

### GET `/me`
Eigene Mitgliederdaten abrufen.

**Zugriff:** `*`

**Response 200:**
```json
{
  "id": "uuid",
  "memberNumber": "M-0042",
  "firstName": "Max",
  "lastName": "Mustermann",
  "email": "max@example.com",
  "phone": "+49 123 456789",
  "street": "Musterstraße 1",
  "postalCode": "12345",
  "city": "Musterstadt",
  "status": "ACTIVE",
  "memberSince": "2020-01-15",
  "contributionTier": "Erwachsener"
}
```

---

### POST `/me/change-request`
Änderungsantrag für eigene Daten stellen.

**Zugriff:** `*`

**Request:**
```json
{
  "field": "email",
  "newValue": "neue@email.de",
  "reason": "E-Mail-Adresse geändert"
}
```

---

### GET `/me/hours`
Eigene Stunden-Übersicht.

**Zugriff:** `*`

**Query:** `?year=2026`

**Response 200:**
```json
{
  "year": 2026,
  "required": 10.0,
  "confirmed": 6.5,
  "planned": 2.0,
  "remaining": 1.5,
  "entries": [...]
}
```

---

### GET `/me/account`
Eigenes Kassenkonto einsehen.

**Zugriff:** `*`

**Response 200:**
```json
{
  "id": "uuid",
  "balance": -12.50,
  "currency": "EUR"
}
```

---

### GET `/me/transactions`
Eigene Transaktionshistorie.

**Zugriff:** `*`

**Query:** `?page=1&limit=20&from=2026-01-01&to=2026-12-31`

---

### GET `/me/invoices`
Eigene Rechnungen.

**Zugriff:** `*`

---

### GET `/me/invoices/:id/pdf`
Rechnung als PDF herunterladen.

**Zugriff:** `*` (nur eigene Rechnungen)

---

## 4. Mitglieder (`/members`)

### GET `/members`
Liste aller Mitglieder.

**Zugriff:** `V`, `S`, `A`

**Query:** `?page=1&limit=20&search=Mustermann&status=ACTIVE`

---

### GET `/members/:id`
Einzelnes Mitglied abrufen.

**Zugriff:** `V`, `A`

---

### POST `/members`
Neues Mitglied anlegen.

**Zugriff:** `A`

**Request:**
```json
{
  "memberNumber": "M-0043",
  "firstName": "Erika",
  "lastName": "Musterfrau",
  "email": "erika@example.com",
  "birthDate": "1985-06-15",
  "street": "Beispielweg 2",
  "postalCode": "12345",
  "city": "Musterstadt",
  "contributionTier": "Erwachsener"
}
```

---

### PATCH `/members/:id`
Mitgliederdaten aktualisieren.

**Zugriff:** `A`

---

### PATCH `/members/:id/status`
Status eines Mitglieds ändern.

**Zugriff:** `A`

**Request:**
```json
{
  "status": "INACTIVE",
  "reason": "Austritt zum 31.12.2026"
}
```

---

### GET `/members/:id/hours`
Stunden eines Mitglieds einsehen.

**Zugriff:** `V`, `A`

---

### GET `/members/change-requests`
Ausstehende Änderungsanträge.

**Zugriff:** `V`, `A`

---

### PATCH `/members/change-requests/:id`
Änderungsantrag genehmigen oder ablehnen.

**Zugriff:** `V`, `A`

**Request:**
```json
{
  "action": "APPROVE",
  "note": "Bestätigt nach Rücksprache."
}
```

---

## 5. Mitgliederstunden (`/hours`)

### GET `/hours/events`
Alle Stundenaktionen auflisten.

**Zugriff:** `*`

---

### POST `/hours/events`
Neue Stundenaktion anlegen.

**Zugriff:** `V`, `A`

**Request:**
```json
{
  "title": "Rasenmähen Vereinsgelände",
  "description": "Frühjahrsputz",
  "date": "2026-04-15T09:00:00",
  "maxSlots": 10,
  "hoursValue": 3.0,
  "location": "Vereinsheim"
}
```

---

### POST `/hours/events/:id/register`
Für eine Stundenaktion anmelden.

**Zugriff:** `*` (eigene Anmeldung), `V`, `A` (für andere Mitglieder)

---

### PATCH `/hours/entries/:id/confirm`
Stunden bestätigen.

**Zugriff:** `V`, `A`

---

### POST `/hours/entries`
Stunden manuell buchen (ohne Event).

**Zugriff:** `V`, `A`

---

## 6. Feedback (`/feedback`)

### GET `/feedback`
Alle Feedback-Einträge (Vorstand-Ansicht).

**Zugriff:** `V`, `A`

**Query:** `?status=OPEN&category=QUESTION`

---

### POST `/feedback`
Neues Feedback oder Frage einreichen.

**Zugriff:** `*`

**Request:**
```json
{
  "category": "QUESTION",
  "subject": "Frage zu Beitragsrechnung",
  "message": "Hallo, ich habe eine Frage zu meiner Rechnung vom..."
}
```

---

### GET `/feedback/my`
Eigene Feedback-Einträge einsehen.

**Zugriff:** `*`

---

### GET `/feedback/:id`
Einzelnen Feedback-Eintrag abrufen.

**Zugriff:** `*` (nur eigene), `V`, `A` (alle)

---

### POST `/feedback/:id/replies`
Antwort auf Feedback schreiben.

**Zugriff:** `V`, `A` (immer), `*` (nur auf eigene, nur nicht-interne)

**Request:**
```json
{
  "message": "Vielen Dank für Ihre Anfrage...",
  "isInternal": false
}
```

---

### PATCH `/feedback/:id/status`
Feedback-Status ändern.

**Zugriff:** `V`, `A`

---

## 7. Dokumente (`/documents`)

### GET `/documents/categories`
Alle Dokumentkategorien.

**Zugriff:** `*`

---

### GET `/documents`
Alle Dokumente auflisten.

**Zugriff:** `*`

**Query:** `?categoryId=uuid&search=Satzung`

---

### GET `/documents/:id/download`
Dokument herunterladen.

**Zugriff:** `*`

---

### POST `/documents`
Dokument hochladen.

**Zugriff:** `V`, `A`

**Request:** `multipart/form-data`
```
file: <binary>
title: "Satzung 2026"
categoryId: "uuid"
description: "Aktualisierte Vereinssatzung"
```

---

### DELETE `/documents/:id`
Dokument löschen (deaktivieren).

**Zugriff:** `A`

---

## 8. Kalender (`/calendar`)

### GET `/calendar/events`
Alle Kalendereinträge.

**Zugriff:** `*`

**Query:** `?from=2026-04-01&to=2026-04-30`

---

### POST `/calendar/events`
Neuen Termin anlegen.

**Zugriff:** `V`, `A`

**Request:**
```json
{
  "title": "Jahreshauptversammlung",
  "description": "Ordentliche JHV mit Vorstandswahl",
  "startDate": "2026-05-10T18:00:00",
  "endDate": "2026-05-10T21:00:00",
  "location": "Vereinsheim, großer Saal",
  "category": "Versammlung",
  "maxAttendees": 100
}
```

---

### PATCH `/calendar/events/:id`
Termin bearbeiten.

**Zugriff:** `V`, `A`

---

### DELETE `/calendar/events/:id`
Termin löschen.

**Zugriff:** `V`, `A`

---

### POST `/calendar/events/:id/attend`
Für Termin anmelden.

**Zugriff:** `*`

---

### DELETE `/calendar/events/:id/attend`
Anmeldung zurückziehen.

**Zugriff:** `*`

---

### GET `/calendar/events/:id/ical`
Termin als iCal-Datei herunterladen.

**Zugriff:** `*`

---

## 9. Kassensystem (`/cash-register`)

### Artikel

#### GET `/cash-register/articles`
Alle Artikel auflisten.

**Zugriff:** `*`

---

#### POST `/cash-register/articles`
Artikel anlegen.

**Zugriff:** `A`, `S`

**Request:**
```json
{
  "sku": "GETR-001",
  "name": "Wasser 0,5l",
  "nameEn": "Water 0.5l",
  "price": 1.50,
  "taxRate": 7.0,
  "category": "Getränke"
}
```

---

#### PATCH `/cash-register/articles/:id`
Artikel bearbeiten.

**Zugriff:** `A`, `S`

---

### Buchungen

#### POST `/cash-register/transactions`
Artikel auf Konto buchen.

**Zugriff:** `*` (eigenes Konto), `A`, `S` (alle Konten)

**Request:**
```json
{
  "accountId": "uuid",
  "items": [
    {
      "articleId": "uuid",
      "quantity": 2
    }
  ],
  "description": "Getränkekauf Trainingsbetrieb"
}
```

---

#### POST `/cash-register/transactions/:id/reverse`
Buchung stornieren.

**Zugriff:** `A`, `S`

---

### Konten

#### GET `/cash-register/accounts`
Alle Mitgliederkonten (Übersicht).

**Zugriff:** `S`, `A`

---

#### GET `/cash-register/accounts/:id`
Einzelnes Konto.

**Zugriff:** `S`, `A`

---

### Rechnungen

#### POST `/cash-register/invoices`
Rechnung(en) erstellen.

**Zugriff:** `S`, `A`

**Request:**
```json
{
  "accountIds": ["uuid1", "uuid2"],
  "periodStart": "2026-01-01",
  "periodEnd": "2026-03-31",
  "dueDate": "2026-04-30",
  "notes": "Q1 2026"
}
```

---

#### GET `/cash-register/invoices`
Alle Rechnungen.

**Zugriff:** `S`, `A`

---

#### GET `/cash-register/invoices/:id/pdf`
Rechnung als PDF.

**Zugriff:** `S`, `A` (alle), `*` (nur eigene via `/me/invoices`)

---

#### GET `/cash-register/sepa-export`
SEPA-Lastschrift-XML generieren.

**Zugriff:** `S`, `A`

**Query:** `?invoiceIds=uuid1,uuid2`

**Response:** `application/xml` (ISO 20022 pain.008)

---

## 10. Administration (`/admin`)

### Benutzerverwaltung

#### GET `/admin/users`
**Zugriff:** `A`

#### POST `/admin/users`
Benutzer anlegen.
**Zugriff:** `A`

#### PATCH `/admin/users/:id/roles`
Rollen zuweisen.
**Zugriff:** `A`

#### PATCH `/admin/users/:id/activate`
Benutzer aktivieren/deaktivieren.
**Zugriff:** `A`

---

### RFID-Token

#### GET `/admin/rfid-tokens`
**Zugriff:** `A`

#### POST `/admin/rfid-tokens`
Token einem Benutzer zuweisen.
**Zugriff:** `A`

**Request:**
```json
{
  "userId": "uuid",
  "rfidToken": "0123456789ABCDEF",
  "label": "Schlüsselanhänger rot"
}
```

#### DELETE `/admin/rfid-tokens/:id`
Token entziehen.
**Zugriff:** `A`

---

### Import

#### POST `/admin/import/preview`
Import-Vorschau anzeigen.
**Zugriff:** `A`

**Request:** `multipart/form-data`
```
file: <csv>
source: CAMPEI | CSV_GENERIC
columnMapping: {"firstName": "Vorname", "lastName": "Nachname", ...}
```

**Response 200:**
```json
{
  "previewRows": [...],
  "totalRows": 150,
  "detectedDuplicates": 3,
  "newRecords": 147
}
```

---

#### POST `/admin/import/execute`
Import ausführen.
**Zugriff:** `A`

---

#### GET `/admin/import/logs`
Import-Protokolle anzeigen.
**Zugriff:** `A`

---

### Systemkonfiguration

#### GET `/admin/config`
Alle Systemkonfigurationen.
**Zugriff:** `A`

#### PATCH `/admin/config`
Konfigurationseinträge aktualisieren.
**Zugriff:** `A`

**Request:**
```json
{
  "updates": [
    { "key": "hours.quota.default", "value": "10" },
    { "key": "session.timeout.hours", "value": "8" },
    { "key": "guest.slots.count", "value": "20" }
  ]
}
```

---

### 2FA-Verwaltung (Admin)

#### DELETE `/admin/users/:id/2fa`
2FA eines Benutzers zurücksetzen (bei verlorenem Gerät). *(ab Stufe 3)*
**Zugriff:** `A`

---

## 11. Gästekasse (`/cash-register/guests`)

### GET `/cash-register/guests/slots`
Alle Gäste-Slots auflisten (Nummer, Name, Status).

**Zugriff:** `*`

**Response 200:**
```json
[
  { "id": "uuid", "slotNumber": 1, "displayName": "Herr Müller", "reservedBy": "memberId", "isActive": true },
  { "id": "uuid", "slotNumber": 2, "displayName": null, "reservedBy": null, "isActive": true }
]
```

---

### POST `/cash-register/guests/slots/:id/reserve`
Gäste-Slot für sich reservieren und optionalen Namen setzen.

**Zugriff:** `*`

**Request:**
```json
{ "displayName": "Familie Schmidt" }
```

---

### DELETE `/cash-register/guests/slots/:id/reserve`
Reservierung aufheben (ohne Abrechnung).

**Zugriff:** `*` (eigene Reservierung), `A`, `S`

---

### POST `/cash-register/guests/slots/:id/transactions`
Artikel auf Gäste-Slot buchen.

**Zugriff:** `*` (nur eigener reservierter Slot), `A`, `S`

**Request:**
```json
{
  "items": [
    { "articleId": "uuid", "quantity": 2 }
  ],
  "eventId": "uuid"
}
```

---

### POST `/cash-register/guests/slots/:id/settle`
Gäste-Slot abrechnen und zurücksetzen.

**Zugriff:** `*` (eigener Slot), `A`, `S`

**Request:**
```json
{
  "paymentMethod": "CASH",
  "paypalReference": null,
  "notes": "Trainingsgast"
}
```

**Response 200:**
```json
{
  "transactionId": "uuid",
  "totalAmount": 4.50,
  "paymentMethod": "CASH",
  "settledAt": "2026-04-15T18:30:00Z",
  "slotReset": true
}
```

---

### GET `/cash-register/guests/transactions`
Alle abgeschlossenen Gäste-Abrechnungen.

**Zugriff:** `S`, `A`

**Query:** `?from=2026-01-01&to=2026-12-31&eventId=uuid`

---

## 12. Eigenbelege (`/cash-register/eigenbelege`)

### GET `/cash-register/eigenbelege`
Alle Eigenbelege auflisten.

**Zugriff:** `V`, `S`, `A`

**Query:** `?from=2026-01-01&to=2026-12-31&type=EXPENSE`

---

### POST `/cash-register/eigenbelege`
Neuen Eigenbeleg anlegen.

**Zugriff:** `V`, `S`, `A`

**Request:** `multipart/form-data`
```
type: INCOME | EXPENSE
amount: 45.00
date: 2026-04-15
description: Einkauf Vereinsbedarf
category: Materialeinkauf
attachments[]: <file1.pdf>
attachments[]: <file2.jpg>
```

**Response 201:**
```json
{
  "id": "uuid",
  "type": "EXPENSE",
  "amount": 45.00,
  "date": "2026-04-15",
  "description": "Einkauf Vereinsbedarf",
  "attachments": [
    { "id": "uuid", "fileName": "quittung.pdf", "fileSize": 123456 }
  ]
}
```

---

### GET `/cash-register/eigenbelege/:id`
Einzelnen Eigenbeleg abrufen.

**Zugriff:** `V`, `S`, `A`

---

### GET `/cash-register/eigenbelege/:id/attachments/:attachmentId`
Anhang eines Eigenbelegs herunterladen.

**Zugriff:** `V`, `S`, `A`

---

### POST `/cash-register/eigenbelege/:id/reverse`
Eigenbeleg stornieren.

**Zugriff:** `S`, `A`

**Request:**
```json
{ "reason": "Doppelt erfasst" }
```

---

## 13. DSGVO – Datentransparenz (`/me/privacy` und `/admin/privacy`)

### GET `/me/activity`
Eigenes Aktivitätsprotokoll abrufen (alle Aktionen, die das eigene Konto betreffen).

**Zugriff:** `*`

**Query:** `?page=1&limit=50&module=cash-register&from=2026-01-01`

**Response 200:**
```json
{
  "data": [
    {
      "action": "BOOKING_CREATED",
      "module": "cash-register",
      "description": "Buchung: 2x Wasser 0,5l auf Konto",
      "actorId": "uuid",
      "actorName": "Max Mustermann",
      "createdAt": "2026-04-15T18:30:00Z"
    }
  ],
  "meta": { "total": 248, "page": 1, "limit": 50 }
}
```

---

### POST `/me/privacy/export`
DSGVO-Datenexport anfordern. *(ab Stufe 2)*

**Zugriff:** `*`

**Request:**
```json
{ "format": "JSON" }
```

**Response 202:** Export wird asynchron erstellt.
```json
{ "jobId": "uuid", "message": "Export wird vorbereitet. Sie werden benachrichtigt." }
```

---

### GET `/me/privacy/export/:jobId`
Status und Download des DSGVO-Exports abrufen. *(ab Stufe 2)*

**Zugriff:** `*`

**Response 200 (fertig):**
```json
{
  "status": "READY",
  "downloadUrl": "/api/v1/me/privacy/export/uuid/download",
  "expiresAt": "2026-04-16T18:30:00Z"
}
```

---

### GET `/admin/members/:id/activity`
Aktivitätsprotokoll eines Mitglieds (Admin-Sicht, vollständig).

**Zugriff:** `A`

---

### POST `/admin/members/:id/privacy/export`
DSGVO-Export für ein Mitglied erstellen (auf schriftliche Anfrage). *(ab Stufe 2)*

**Zugriff:** `A`
