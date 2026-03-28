# Sicherheitskonzept – VereinApp

**Version:** 0.2
**Datum:** 2026-03-27
**Änderungen v0.2:** 2FA-Konzept (TOTP, ab Stufe 3 verpflichtend), Passwort-Reset-Flow (ab Stufe 2), DSGVO-Datentransparenz ergänzt.

---

## 1. Authentifizierungskonzept

### 1.1 JWT-basierte Authentifizierung

VereinApp verwendet ein **Dual-Token-Konzept** mit kurzlebigen Access Tokens und langlebigen Refresh Tokens.

```
┌──────────────────────────────────────────────────────────────┐
│                    Token-Lebenszyklus                        │
│                                                              │
│  Login ──► Access Token (15 min) + Refresh Token (7 Tage)   │
│                                                              │
│  API-Anfrage: Authorization: Bearer <access-token>           │
│                                                              │
│  Access Token abgelaufen ──► POST /auth/refresh              │
│     mit Refresh Token ──► neues Access Token                 │
│                                                              │
│  Logout ──► Refresh Token wird invalidiert (DB-Eintrag)     │
└──────────────────────────────────────────────────────────────┘
```

**JWT Access Token Payload:**
```json
{
  "sub": "user-uuid",
  "username": "max.mustermann",
  "roles": ["MEMBER"],
  "memberId": "member-uuid",
  "iat": 1711530000,
  "exp": 1711530900
}
```

**Implementierungsdetails:**
- Algorithmus: `RS256` (asymmetrisch) – öffentlicher Schlüssel für Verifikation, privater für Signierung
- Access Token: im Memory des Frontends (nicht in localStorage oder Cookies)
- Refresh Token: HttpOnly-Cookie (CSRF-geschützt) oder in gesichertem Storage
- Refresh Tokens werden in der Datenbank gespeichert und können einzeln invalidiert werden
- Bei Logout: alle Refresh Tokens des Benutzers invalidieren (optional: nur aktuellen)

---

### 1.2 Passwort-Sicherheit

| Maßnahme                     | Details                                              |
|------------------------------|------------------------------------------------------|
| Hashing-Algorithmus          | bcrypt, 12 Runden (anpassbar via Konfiguration)      |
| Mindest-Passwortlänge        | 10 Zeichen                                           |
| Komplexitätsanforderungen    | Mindestens: 1 Großbuchstabe, 1 Ziffer                |
| Passwort-Stärke-Anzeige      | Frontend zeigt Stärkeindikator beim Setzen           |
| Brute-Force-Schutz           | Account-Sperrung nach 5 Fehlversuchen (30 Minuten)   |
| Passwort-Reset               | Einmaliger, zeitbeschränkter Token per E-Mail (1h) – **ab Stufe 2 Pflicht** |
| Initialer Admin              | Muss Passwort beim ersten Login ändern               |

#### Passwort-Reset-Flow (ab Stufe 2)

```
Benutzer                    Backend                     E-Mail
   │                           │                           │
   │── POST /auth/forgot ──────►│                           │
   │   {email}                 │── Lookup: existiert?      │
   │                           │── generiere Token (UUID)  │
   │                           │── hash(token) → DB        │
   │                           │── Ablauf: now + 1h        │
   │◄── 200 (immer gleich) ────│── sende E-Mail ──────────►│
   │                           │                           │
   │          ───────── Benutzer klickt Link in E-Mail ────│
   │                           │                           │
   │── POST /auth/reset ───────►│                           │
   │   {token, newPassword}    │── hash(token) → DB-Lookup │
   │                           │── prüfe Ablauf            │
   │                           │── setze neues Passwort    │
   │                           │── invalidiere Token       │
   │◄── 200 ───────────────────│                           │
```

**Sicherheitsmaßnahmen:**
- Token wird gehasht gespeichert (SHA-256), nie im Klartext
- Antwort ist immer identisch (kein Hinweis ob E-Mail bekannt – verhindert User-Enumeration)
- Token ist nach einmaliger Verwendung oder Ablauf ungültig
- Alle offenen Reset-Tokens eines Users werden bei erfolgreichem Reset invalidiert

---

### 1.3 Zwei-Faktor-Authentifizierung (2FA) – ab Stufe 3

#### Überblick

VereinApp unterstützt TOTP (Time-based One-Time Password) als zweiten Faktor, kompatibel mit allen gängigen Authenticator-Apps (Google Authenticator, Authy, Bitwarden, etc.).

**Verpflichtende 2FA für:**
- Alle Benutzer mit Rolle `ADMIN`
- Alle Benutzer mit Rolle `SCHATZMEISTER`

**Freiwillige 2FA für:**
- Alle anderen Benutzer (`MEMBER`, `VORSTAND`)

#### Login-Flow mit 2FA

```
Benutzer                    Backend
   │                           │
   │── POST /auth/login ───────►│
   │   {username, password}    │── Credentials prüfen ──►│
   │                           │   2FA aktiviert?
   │                           │
   │   2FA nicht aktiv ────────►── normaler JWT-Response
   │
   │   2FA aktiv:              │
   │◄── 200 {preAuthToken} ────│  (kurze Gültigkeit: 5 min)
   │                           │
   │── POST /auth/login/2fa ──►│
   │   {preAuthToken, code}    │── TOTP verifizieren
   │                           │── (otplib: totp.check())
   │◄── 200 {accessToken} ─────│
```

#### 2FA-Einrichtung

```
Benutzer                    Backend
   │                           │
   │── POST /auth/2fa/setup ──►│
   │                           │── generiere TOTP-Secret
   │                           │── verschlüssele Secret (AES-256)
   │                           │── speichere als pending (noch nicht aktiv)
   │◄── {secret, qrCodeUrl} ──│
   │                           │
   │  [Scan QR-Code in App]    │
   │                           │
   │── POST /auth/2fa/verify ─►│
   │   {code: "123456"}        │── TOTP-Code prüfen
   │                           │── markiere 2FA als aktiv
   │◄── 200 {backupCodes} ────│  (einmalige Backup-Codes)
```

#### Implementierungsdetails

```typescript
// Abhängigkeiten
import { authenticator } from 'otplib'
import * as CryptoJS from 'crypto-js'

// Secret-Generierung
const secret = authenticator.generateSecret() // 20-Byte Base32

// Secret-Speicherung (AES-256 verschlüsselt mit APP_SECRET)
const encryptedSecret = CryptoJS.AES.encrypt(
  secret,
  process.env.APP_ENCRYPTION_KEY
).toString()

// Token-Verifikation
const isValid = authenticator.check(userInputCode, decryptedSecret)
// Standard-Fenster: ±1 Zeitschritt (30s), also 90s Toleranz
```

#### Backup-Codes
- Bei 2FA-Aktivierung werden 8 einmalige Backup-Codes generiert
- Codes werden gehasht gespeichert, dem Benutzer einmalig angezeigt
- Jeder Code kann nur einmal verwendet werden
- Bei Verbrauch oder Verlust kann Admin 2FA-Reset durchführen

---

### 1.4 RFID-Authentifizierung

#### Hardwareagnostisches Design

Die RFID-Integration ist so konzipiert, dass sie mit verschiedenen Lesegeräten funktioniert, ohne Codeänderungen zu erfordern.

**Primär unterstützter Modus: HID-Emulation (USB)**

Viele handelsübliche RFID-Lesegeräte senden den Token-Wert als Tastatureingabe (das Gerät verhält sich wie eine Tastatur). Das Login-Formular enthält ein spezielles, verstecktes Eingabefeld, das diesen Eingabestream verarbeitet.

```
RFID-Lesegerät (USB/HID)
         │
         │ Tastatureingabe: "0123456789ABCDEF\n"
         ▼
   Browser (Login-Seite)
   ┌─────────────────────────────────────────────┐
   │  [Benutzername: max.mustermann            ] │
   │  [Passwort: ********                      ] │
   │                                             │
   │  [RFID-Eingabe (versteckt, autofokus)     ] │
   │   ↑ Wenn Cursor hier: Token wird gelesen   │
   └─────────────────────────────────────────────┘
         │
         │ POST /api/v1/auth/rfid
         │ { "rfidToken": "0123456789ABCDEF" }
         ▼
      Backend: hash(token) ──► DB-Lookup ──► JWT
```

**RFID-Token-Verarbeitung:**

```typescript
// Frontend: RFID-Input Handler
const RFID_TERMINATOR = 'Enter'
const RFID_MIN_LENGTH = 8
const RFID_MAX_LENGTH = 64
const RFID_TIMEOUT_MS = 100 // Minimale Eingabe-Geschwindigkeit

// Wenn Eingabe schneller als 100ms zwischen Zeichen → RFID-Reader
// Wenn langsamer → manuelle Tastatureingabe (ignorieren)
```

**Sicherheitsmaßnahmen für RFID:**
- RFID-Token-Werte werden **gehasht** in der DB gespeichert (bcrypt, 10 Runden)
- Ein Token kann nur einem aktiven Benutzer zugewiesen sein
- Deaktivierte Token können nicht zur Anmeldung genutzt werden
- Jede RFID-Anmeldung wird im Audit-Log protokolliert
- Admin kann alle Token eines Benutzers auf einmal invalidieren

**Erweiterungsmöglichkeiten (Stufe 3):**
- Netzwerk-RFID-Reader via REST-Hook (Reader sendet an Backend-Endpoint)
- Serielle Schnittstelle via WebSerial API

---

## 2. Autorisierungskonzept (RBAC)

### 2.1 Rollen und Berechtigungen

```typescript
// Rollen-Hierarchie (nicht kumulativ – explizite Zuweisung)
const ROLE_PERMISSIONS = {
  MEMBER: [
    'own_profile:read',
    'own_profile:change_request',
    'own_hours:read',
    'own_account:read',
    'own_transactions:read',
    'own_invoices:read',
    'hours_events:read',
    'hours_events:register',
    'feedback:create',
    'own_feedback:read',
    'documents:read',
    'documents:download',
    'calendar:read',
    'calendar:attend',
    'articles:read',
    'own_booking:create',
  ],
  VORSTAND: [
    '...all MEMBER permissions',
    'members:read',
    'members:manage_change_requests',
    'hours_events:manage',
    'hours_entries:confirm',
    'hours_entries:manual_create',
    'feedback:read_all',
    'feedback:reply',
    'feedback:manage_status',
    'documents:manage',
    'calendar:manage',
  ],
  SCHATZMEISTER: [
    '...all MEMBER permissions',
    'accounts:read_all',
    'transactions:manage_all',
    'invoices:manage',
    'sepa_export:create',
    'articles:manage',
    'cash_reports:read',
  ],
  ADMIN: [
    '...all permissions',
    'users:manage',
    'rfid:manage',
    'import:execute',
    'system_config:manage',
  ],
}
```

### 2.2 Implementierung via NestJS Guards

```typescript
// Verwendung im Controller
@Get('members')
@Roles(Role.VORSTAND, Role.ADMIN)  // Decorator
@UseGuards(JwtAuthGuard, RolesGuard)  // Guards
async getMembers() { ... }
```

Der `RolesGuard` prüft, ob der im JWT enthaltene Benutzer mindestens eine der erforderlichen Rollen besitzt.

---

## 3. Datensicherheit

### 3.1 Eingabevalidierung

- **Serverseitig** (immer): class-validator mit DTOs
- **Clientseitig** (UX): vee-validate mit yup-Schemas
- **Datenbankebene**: Prisma-Schema-Constraints (NOT NULL, UNIQUE, etc.)
- Alle String-Eingaben werden gegen XSS sanitisiert (DOMPurify im Frontend, sanitize-html im Backend)
- SQL-Injection: vollständig durch Prisma (parametrisierte Queries) verhindert

### 3.2 HTTPS

| Stufe | HTTPS-Anforderung                                             |
|-------|---------------------------------------------------------------|
| 1     | Optional (lokales Netzwerk, HTTP akzeptabel für Entwicklung)  |
| 2     | Empfohlen (Self-Signed-Zertifikat oder Let's Encrypt via Nginx) |
| 3     | Pflicht (Let's Encrypt via Certbot + Nginx-Reverse-Proxy)     |

### 3.3 CORS

```typescript
// NestJS CORS-Konfiguration
app.enableCors({
  origin: process.env.FRONTEND_URL,  // z.B. http://192.168.1.100
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
})
```

### 3.4 Rate Limiting

```typescript
// @nestjs/throttler
ThrottlerModule.forRoot([{
  name: 'short',
  ttl: 60000,   // 1 Minute
  limit: 30,    // 30 Anfragen/Minute
}, {
  name: 'auth',
  ttl: 300000,  // 5 Minuten
  limit: 10,    // 10 Auth-Versuche
}])
```

### 3.5 Sicherheitsheader (Helmet)

```typescript
import helmet from 'helmet'
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Vuetify benötigt inline styles
      imgSrc: ["'self'", "data:"],
    }
  }
}))
```

---

## 4. DSGVO-Compliance

| Anforderung                           | Umsetzung                                                      |
|---------------------------------------|----------------------------------------------------------------|
| Datensparsamkeit                      | Nur notwendige Pflichtfelder; optionale Felder klar markiert   |
| Auskunftsrecht (Art. 15 DSGVO)        | Mitglied kann **alle eigenen Aktionen** im Aktivitätsprotokoll einsehen (`/me/activity`) |
| Datenportabilität (Art. 20 DSGVO)     | DSGVO-Export als JSON abrufbar (ab Stufe 2) – enthält alle Stammdaten, Transaktionen, Rechnungen, Stunden, Logins, Feedback |
| Recht auf Berichtigung (Art. 16)      | Änderungsantragsfunktion; Admin kann direkt ändern            |
| Recht auf Löschung (Art. 17)          | Admin kann Mitglied deaktivieren; vollständige Löschung muss manuell erfolgen (gesetzliche Aufbewahrungspflichten beachten: z.B. Buchungsbelege 10 Jahre) |
| Datentransfer                         | Alle Daten bleiben auf dem Vereinsserver (kein Cloud-Dienst)   |
| Protokollierung                       | `ActivityLog` für alle mitgliedsbezogenen Aktionen; `AuditLog` für sicherheitskritische Systemaktionen |
| Einwilligung                          | Erstanmeldung erfordert Bestätigung der Datenschutzerklärung (datiert gespeichert in `User.privacyAcceptedAt`) |
| Verantwortlichkeit                    | Jede Aktion speichert `actorId` – es ist nachvollziehbar, wer eine Änderung vorgenommen hat |

### 4.1 Zwei-Ebenen-Protokollierung

VereinApp unterscheidet zwischen zwei Protokoll-Typen:

**`ActivityLog` (mitgliedsbezogen, für Betroffene einsehbar):**
Protokolliert alle Aktionen, die ein Mitglied direkt betreffen. Das Mitglied kann dieses Protokoll selbst einsehen (`/me/activity`). Dient der DSGVO-Transparenz.

Beispiele: Buchung angelegt, Rechnung gesendet, Stunden bestätigt, Login, Passwort geändert, Feedback eingereicht.

**`AuditLog` (systemkritisch, nur Admin):**
Protokolliert sicherheitsrelevante und administrative Systemereignisse. Nur für Admins einsehbar.

Beispiele: Rollenänderungen, RFID-Zuweisung/-Entzug, Systemkonfiguration geändert, Datenimport, 2FA-Reset durch Admin, Kontosperrung.

### 4.2 DSGVO-Export (ab Stufe 2)

Der Export wird asynchron als JSON erzeugt und enthält:

```json
{
  "exportDate": "2026-03-27T10:00:00Z",
  "requestedBy": "Mitglied selbst / Admin",
  "member": { ...Stammdaten... },
  "account": {
    "balance": -12.50,
    "transactions": [...],
    "invoices": [...]
  },
  "hours": {
    "entries": [...],
    "totalByYear": [...]
  },
  "feedback": [...],
  "activityLog": [...],
  "privacyConsent": {
    "acceptedAt": "2026-01-01T12:00:00Z"
  }
}
```

---

## 5. Audit-Logging (Systemebene)

Kritische Systemaktionen werden in einer Audit-Tabelle protokolliert (nur Admin-Zugriff):

```prisma
model AuditLog {
  id         String   @id @default(uuid())
  userId     String
  action     String   // z.B. "LOGIN_FAILED", "ROLE_CHANGED", "2FA_RESET"
  entity     String?  // z.B. "User", "Member"
  entityId   String?
  oldValue   Json?
  newValue   Json?
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime @default(now())

  @@index([userId])
  @@index([entity, entityId])
  @@index([createdAt])
}
```

**Im AuditLog protokollierte Ereignisse:**
- Login-Fehlschlag und Account-Sperrung
- Passwortänderung und -Reset
- 2FA-Einrichtung, -Deaktivierung, -Reset durch Admin
- RFID-Token-Zuweisung/-Entzug
- Rollen- und Statusänderungen
- Systemkonfigurationsänderungen
- Datenimporte
- Admin-Aktionen (Direktbearbeitung von Mitgliedsdaten)

**Im ActivityLog protokollierte Ereignisse (mitgliedsseitig einsehbar):**
- Login (Erfolg), Logout
- Passwortänderung (Ereignis, kein Inhalt)
- Buchungen und Stornierungen (eigene + durch Admin)
- Rechnungen erstellt/gesendet
- Stunden bestätigt/storniert
- Feedback eingereicht/beantwortet
- Änderungsanträge gestellt/bearbeitet
- Gäste-Abrechnungen (eigene)

---

## 6. Netzwerksegmentierung (Stufe 3)

In Ausbaustufe 3 werden bestimmte API-Endpunkte nur im internen Netzwerk zugänglich gemacht:

```
Extern (Internet)          Intern (Vereinsnetz)
─────────────────          ─────────────────────
POST /auth/login           POST /auth/login ✓
GET /me/*                  GET /me/* ✓
GET /calendar/*            GET /calendar/* ✓
GET /documents/*           GET /documents/* ✓
                           POST /admin/* ✓
                           POST /cash-register/* ✓
                           GET /members/* ✓
                           POST /hours/events/:id/register ✓
```

Implementierung via Nginx `allow`/`deny` Direktiven basierend auf IP-Bereich:

```nginx
location /api/v1/admin {
    allow 192.168.1.0/24;
    deny all;
    proxy_pass http://backend:3000;
}
```

---

## 7. Datei-Sicherheit

- Uploads werden auf Dateityp (MIME-Type + Magic Bytes) geprüft
- Maximale Dateigröße: 20 MB (konfigurierbar)
- Erlaubte Typen: PDF, DOCX, XLSX, JPG, PNG
- Dateien werden nicht unter dem originalen Namen gespeichert (UUID-basierter Dateiname)
- Upload-Verzeichnis liegt außerhalb des Web-Roots (kein direkter Zugriff via URL)
- Downloads erfolgen nur über authentifizierte API-Endpunkte

---

## 8. Abhängigkeitssicherheit

- `npm audit` wird in der CI-Pipeline ausgeführt
- Dependency Updates via Dependabot (GitHub) oder regelmäßige manuelle Updates
- Keine Verwendung von Paketen mit bekannten kritischen Sicherheitslücken
- Lock-Datei (`package-lock.json`) wird ins Repository eingecheckt
