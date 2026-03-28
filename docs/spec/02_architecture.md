# Systemarchitektur – VereinApp

**Version:** 0.2
**Datum:** 2026-03-27
**Änderungen v0.2:** Rollentrennung Admin/Vorstand präzisiert; Admin hat keinen Standardzugriff auf Mitglieder-Stammdaten; temporäres Zugriffsfreigabe-Konzept (AdminAccessGrant) eingeführt.

---

## 1. Überblick

VereinApp folgt einer klassischen **Three-Tier-Architektur** mit klarer Trennung zwischen Präsentation, Anwendungslogik und Datenhaltung. Alle Komponenten laufen containerisiert (Docker) und kommunizieren über wohldefinierte Schnittstellen.

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                     │
│              Vue 3 SPA (Vuetify 3 + vue-i18n)           │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTPS / REST API + JWT
┌───────────────────────▼─────────────────────────────────┐
│                  BACKEND (NestJS)                        │
│   Auth │ Members │ Hours │ Feedback │ Docs │ Kassensystem│
│                      Prisma ORM                          │
└───────────────────────┬─────────────────────────────────┘
                        │ TCP (Prisma Client)
┌───────────────────────▼─────────────────────────────────┐
│                   PostgreSQL 16                          │
│                  (Docker Volume)                         │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Tech-Stack

### 2.1 Backend

| Komponente          | Technologie / Version     | Begründung                                              |
|---------------------|---------------------------|---------------------------------------------------------|
| Runtime             | Node.js 22 LTS            | Aktuell, langfristiger Support                          |
| Framework           | NestJS 10                 | Strukturiert, TypeScript-first, DI, Modularität         |
| Sprache             | TypeScript 5              | Typsicherheit, bessere Wartbarkeit                      |
| ORM                 | Prisma 5                  | Schema-first, Migrations, typsichere Queries            |
| HTTP-Bibliothek     | Fastify (NestJS-Adapter)  | Höhere Performance als Express                          |
| Authentifizierung   | @nestjs/jwt + Passport    | JWT, Refresh Tokens, Guards                             |
| Validierung         | class-validator + class-transformer | Eingehende Datenvalidierung              |
| API-Dokumentation   | @nestjs/swagger           | OpenAPI 3.0 automatisch generiert                       |
| Dateiverarbeitung   | Multer                    | Datei-Uploads (Dokumente, Profilbilder)                 |
| E-Mail              | Nodemailer + Handlebars   | SMTP mit Template-Support                               |
| PDF-Generierung     | Puppeteer / PDFKit        | Rechnungserstellung als PDF                             |
| Logging             | Pino                      | Strukturiertes Logging, geringe Overhead                |
| Testing             | Jest + Supertest          | Unit- und E2E-Tests                                     |
| Linting             | ESLint + Prettier         | Code-Qualität und Konsistenz                            |

### 2.2 Frontend

| Komponente          | Technologie / Version     | Begründung                                              |
|---------------------|---------------------------|---------------------------------------------------------|
| Framework           | Vue 3 (Composition API)   | Modern, reaktiv, gute Performance                       |
| Build-Tool          | Vite 5                    | Schnelles Dev-Server-Startup, optimiertes Bundling      |
| UI-Komponenten      | Vuetify 3                 | Material Design, responsive, barrierefrei               |
| State Management    | Pinia                     | Offizieller Vue-3-Store, einfacher als Vuex             |
| Routing             | Vue Router 4              | Offizieller Router, Guards für Auth                     |
| HTTP-Client         | Axios                     | Interceptors für Token-Handling, gut etabliert          |
| Internationalisierung | vue-i18n 9              | Offizielles i18n-Plugin, Lazy Loading                   |
| Kalender            | FullCalendar (Vue-Plugin) | Feature-reicher Kalender                                |
| Formulare           | vee-validate + yup        | Formularvalidierung mit Schema-Definition               |
| Charts              | Chart.js + vue-chartjs    | Statistiken (Stunden, Kasse)                            |
| Testing             | Vitest + Vue Testing Library | Unit-Tests, E2E mit Playwright                    |

### 2.3 Datenbank & Infrastruktur

| Komponente          | Technologie / Version     | Begründung                                              |
|---------------------|---------------------------|---------------------------------------------------------|
| Datenbank           | PostgreSQL 16             | Stabil, feature-reich, JSONB für flexible Felder        |
| Containerisierung   | Docker + Docker Compose   | Reproduzierbare Umgebungen, einfaches Deployment        |
| Reverse Proxy       | Nginx (ab Stufe 2)        | HTTPS-Terminierung, statische Dateien                   |
| Datei-Storage       | Lokales Filesystem        | Für Stufe 1/2; in Stufe 3 erweiterbar auf S3-kompatibel |

---

## 3. Verzeichnisstruktur des Projekts

```
vereinapp/
├── backend/                        # NestJS Backend
│   ├── src/
│   │   ├── app.module.ts           # Root-Modul
│   │   ├── main.ts                 # Einstiegspunkt
│   │   ├── config/                 # Konfigurationsmodule
│   │   ├── common/                 # Shared Decorators, Guards, Pipes
│   │   │   ├── guards/
│   │   │   ├── decorators/
│   │   │   └── filters/
│   │   ├── auth/                   # Authentifizierungsmodul
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/         # JWT, RFID
│   │   │   └── dto/
│   │   ├── users/                  # Benutzerverwaltung
│   │   ├── members/                # Mitgliederdaten
│   │   ├── hours/                  # Mitgliederstunden
│   │   ├── feedback/               # Feedback & Kommunikation
│   │   ├── documents/              # Dokumentenverwaltung
│   │   ├── calendar/               # Kalender & Events
│   │   ├── cash-register/          # Kassensystem
│   │   │   ├── accounts/           # Mitgliederkonten
│   │   │   ├── articles/           # Artikelverwaltung
│   │   │   ├── transactions/       # Buchungen
│   │   │   └── invoices/           # Rechnungen
│   │   ├── import/                 # Datenimport (Campei, CSV)
│   │   └── admin/                  # Admin-Funktionen
│   ├── prisma/
│   │   ├── schema.prisma           # Datenbankschema
│   │   └── migrations/
│   ├── test/                       # E2E-Tests
│   ├── uploads/                    # Datei-Storage (lokal)
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                       # Vue 3 Frontend
│   ├── src/
│   │   ├── main.ts
│   │   ├── App.vue
│   │   ├── router/                 # Vue Router
│   │   ├── stores/                 # Pinia Stores
│   │   │   ├── auth.store.ts
│   │   │   ├── member.store.ts
│   │   │   └── ...
│   │   ├── views/                  # Seiten-Komponenten
│   │   │   ├── auth/               # Login, Passwort-Reset
│   │   │   ├── dashboard/
│   │   │   ├── profile/
│   │   │   ├── hours/
│   │   │   ├── feedback/
│   │   │   ├── documents/
│   │   │   ├── calendar/
│   │   │   ├── cash-register/
│   │   │   └── admin/
│   │   ├── components/             # Wiederverwendbare Komponenten
│   │   ├── composables/            # Vue Composables
│   │   ├── services/               # API-Service-Schicht (Axios)
│   │   ├── i18n/                   # Übersetzungsdateien
│   │   │   ├── de.json
│   │   │   └── en.json
│   │   └── assets/
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml              # Produktions-Compose
├── docker-compose.dev.yml          # Entwicklungs-Compose
├── nginx/
│   └── nginx.conf                  # Reverse Proxy Konfiguration
├── docs/                           # Diese Spezifikation
└── README.md
```

---

## 4. Modularer Aufbau des Backends

Jedes fachliche Modul folgt dem gleichen Muster:

```
modul/
├── modul.module.ts         # NestJS-Modul-Definition
├── modul.controller.ts     # HTTP-Endpunkte
├── modul.service.ts        # Business-Logik
├── modul.repository.ts     # Datenbankzugriff via Prisma (optional, wenn komplex)
├── dto/                    # Data Transfer Objects (Request/Response)
│   ├── create-modul.dto.ts
│   └── update-modul.dto.ts
└── modul.spec.ts           # Unit-Tests
```

---

## 5. Datenfluss: Authentifizierung

```
Client                Backend                  DB
  │                      │                      │
  │─── POST /auth/login ─►│                      │
  │    {username, pw}     │─── findUser ─────────►│
  │                       │◄── user + pwHash ─────│
  │                       │─── bcrypt.verify ─────┤ (intern)
  │                       │                       │
  │◄── {accessToken,      │                       │
  │     refreshToken} ────│                       │
  │                       │                       │
  │─── GET /members/me ──►│                       │
  │    Authorization:     │─── JWT verify ─────── ┤ (intern)
  │    Bearer <token>     │─── findMember ────────►│
  │                       │◄── memberData ─────────│
  │◄── {memberData} ──────│                       │
```

---

## 6. Datenfluss: RFID-Authentifizierung

RFID-Lesegeräte im HID-Modus senden den Token-Wert als Tastatureingabe. Das Login-Formular enthält ein verstecktes RFID-Input-Feld, das den Token entgegennimmt:

```
RFID-Reader (HID)           Browser (Focused Field)      Backend
       │                              │                      │
       │─── Tastatureingabe: TOKEN ──►│                      │
       │    (Enter am Ende)           │                      │
       │                              │─── POST /auth/rfid ─►│
       │                              │    {rfidToken}        │
       │                              │                      │─── hash(token)
       │                              │                      │─── findByToken
       │                              │◄── {accessToken} ────│
```

---

## 7. API-Architektur

- **Stil:** REST (RESTful, ressourcenorientiert)
- **Präfix:** `/api/v1/`
- **Format:** JSON (application/json)
- **Authentifizierung:** Bearer Token (JWT) im Authorization-Header
- **Fehlerformat:**
  ```json
  {
    "statusCode": 400,
    "message": "Validation failed",
    "errors": [{"field": "email", "message": "Invalid email"}],
    "timestamp": "2026-03-27T10:00:00Z"
  }
  ```
- **Swagger UI:** `/api/docs` (nur in Development/Staging aktiviert)

---

## 8. Rollenbasierte Zugriffskontrolle (RBAC)

```typescript
enum Role {
  MEMBER        = 'member',        // Basis-Zugriff
  VORSTAND      = 'vorstand',      // Mitglieder- und Vereinsverwaltung
  SCHATZMEISTER = 'schatzmeister', // Kassenzugriff
  ADMIN         = 'admin',         // Systemverwaltung (NICHT Mitgliederdaten)
}
```

Jeder Endpunkt wird mit einem `@Roles()` Decorator geschützt. Ein JWT-Guard prüft bei jeder Anfrage das Token und die zugehörigen Rollen. Ein Benutzer kann mehrere Rollen gleichzeitig haben (z.B. `VORSTAND` + `SCHATZMEISTER`).

### 8.1 Prinzip der Rollentrennung: Admin ≠ Mitgliederverwalter

**Kernprinzip:** Die Rolle `ADMIN` ist ausschließlich für die technische Systemverwaltung vorgesehen und hat **keinen standardmäßigen Zugriff auf persönliche Mitgliederdaten**. Dies schützt die Privatsphäre der Mitglieder auch vor internen Akteuren.

| Zuständigkeit                        | ADMIN | VORSTAND |
|--------------------------------------|-------|----------|
| Systemkonfiguration                  | ✅    | ❌       |
| Benutzerkonto anlegen / deaktivieren | ✅    | ❌       |
| RFID-Token zuweisen                  | ✅    | ❌       |
| Dateiimport (Campei/CSV)             | ✅    | ❌       |
| Mitglieder-Stammdaten einsehen       | ❌*   | ✅       |
| Mitglieder-Stammdaten bearbeiten     | ❌*   | ✅       |
| Änderungsanträge genehmigen          | ❌    | ✅       |
| Feedback einsehen / beantworten      | ❌    | ✅       |
| Stunden verwalten / bestätigen       | ❌    | ✅       |
| Dokumente verwalten                  | ❌    | ✅       |
| Veranstaltungen verwalten            | ❌    | ✅       |
| DSGVO-Export erstellen               | ❌*   | ✅       |
| Kassensystem (Konten, Rechnungen)    | ❌    | ❌ (→ SCHATZMEISTER) |

`*` = Nur mit aktiver **temporärer Freigabe durch den Vorstand** (AdminAccessGrant).

### 8.2 Temporäre Admin-Freigabe (AdminAccessGrant)

Wenn ein Admin technische Unterstützung leisten oder einen Fehler in Mitgliederdaten beheben muss, erteilt ein Vorstandsmitglied eine zeitlich begrenzte Freigabe:

```
Vorstand                        Backend                     Admin
   │                               │                           │
   │── POST /admin/access-grants ─►│                           │
   │   {adminUserId, reason,        │── AdminAccessGrant anlegen│
   │    expiresAt, scope}          │── in DB persistieren      │
   │◄── {grantId, expiresAt} ──────│                           │
   │                               │                           │
   │              ──────────────── Admin nutzt die Freigabe ──►│
   │                               │◄── GET /members/:id ──────│
   │                               │── prüfe aktive Grants     │
   │                               │── Grant vorhanden? ───────►── 200 + Daten
   │                               │── kein Grant? ────────────►── 403
   │                               │                           │
   │── DELETE /admin/access-grants/:id (Freigabe entziehen)   │
```

**Grant-Eigenschaften:**
- Zeitliche Begrenzung (Standard: 24 Stunden, konfigurierbar durch Vorstand)
- Scope: `ALL_MEMBERS` (alle Mitglieder) oder `SPECIFIC_MEMBER` (ein Mitglied)
- Pflichtangabe eines Grundes durch den Vorstand
- Jede Nutzung wird im AuditLog protokolliert
- Vorstand kann Freigabe jederzeit vorzeitig entziehen
- Automatisches Ablaufen nach `expiresAt`
- Mehrere gleichzeitige Grants für verschiedene Admins möglich

### 8.3 Was Admin immer kann (ohne Freigabe)

Auch ohne Freigabe kann ein Admin:
- Benutzerliste (nur Benutzername, Rolle, Status – **keine persönlichen Daten**) einsehen
- Benutzerkonten aktivieren / deaktivieren
- RFID-Tokens zuweisen (ohne Einsicht in Stammdaten)
- Importe durchführen (technischer Vorgang)
- Systemkonfiguration verwalten
- Audit-Log einsehen
- Aktive Grants einsehen (welche Freigaben existieren)

Jeder Endpunkt wird mit einem `@Roles()` Decorator geschützt. Endpunkte, die Mitgliedsdaten betreffen, prüfen zusätzlich via `AdminAccessGuard`, ob eine aktive Freigabe vorliegt.

---

## 9. Konfigurationsmanagement

Alle sensitiven und umgebungsabhängigen Konfigurationen werden über `.env`-Dateien verwaltet:

```env
# Server
PORT=3000
NODE_ENV=production

# Datenbank
DATABASE_URL=postgresql://user:password@postgres:5432/vereinapp

# JWT
JWT_SECRET=<sicheres-zufaelliges-secret>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# E-Mail (optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=no-reply@verein.de
SMTP_PASS=<passwort>

# Dateipfade
UPLOAD_PATH=/app/uploads
MAX_FILE_SIZE_MB=20

# RFID
RFID_HASH_ROUNDS=10

# Stufe 3: Netzwerk
INTERNAL_NETWORK_CIDR=192.168.1.0/24
```

Konfigurationsmodule in NestJS nutzen `@nestjs/config` mit Schema-Validierung (Joi).
