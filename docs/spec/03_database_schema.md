# Datenbankschema – VereinApp

**Version:** 0.2
**Datum:** 2026-03-27
**Änderungen v0.2:** GuestSlot, GuestTransaction, Eigenbeleg + Anhänge, 2FA-Felder in User, DSGVO-Aktivitätsprotokoll, Passwort-Reset-Token.
**Datenbank:** PostgreSQL 16
**ORM:** Prisma 5

---

## 1. Entity-Relationship-Übersicht

```
┌─────────────┐     ┌─────────────┐     ┌──────────────────┐
│    User     │────►│   Member    │────►│   MemberAccount  │
│ (Auth)      │ 1:1 │ (Stammdaten)│ 1:1 │   (Kasse)        │
└──────┬──────┘     └──────┬──────┘     └────────┬─────────┘
       │                   │                     │
       │            ┌──────┴──────┐       ┌──────┴──────────┐
       │            │  HoursEntry │       │   Transaction   │
       │            │ (Buchung)   │       │   (Buchung)     │
       │            └─────────────┘       └──────┬──────────┘
       │                                         │
       │            ┌─────────────┐       ┌──────┴──────────┐
       │            │  Feedback   │       │    Invoice      │
       │            └─────────────┘       └─────────────────┘
       │
       │     ┌─────────────┐    ┌─────────────┐    ┌──────────────┐
       └────►│  RfidToken  │    │   Article   │    │   Document   │
             └─────────────┘    └─────────────┘    └──────────────┘
                                                   ┌──────────────┐
                                                   │ CalendarEvent│
                                                   └──────────────┘
```

---

## 2. Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────

enum Role {
  MEMBER
  VORSTAND
  SCHATZMEISTER
  ADMIN
}

enum MemberStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  PENDING
}

enum FeedbackStatus {
  OPEN
  IN_PROGRESS
  ANSWERED
  CLOSED
}

enum FeedbackCategory {
  QUESTION
  FEEDBACK
  COMPLAINT
  OTHER
}

enum TransactionType {
  DEBIT   // Belastung (Artikel, Beitrag)
  CREDIT  // Gutschrift
  ADJUSTMENT  // Manuelle Korrektur
}

enum InvoiceStatus {
  DRAFT
  SENT
  PAID
  OVERDUE
  CANCELLED
}

enum HoursStatus {
  PLANNED
  CONFIRMED
  CANCELLED
}

enum ImportSource {
  CAMPEI
  CSV_GENERIC
  MANUAL
}

enum GuestPaymentMethod {
  CASH    // Bar
  PAYPAL  // PayPal (manuell erfasst)
}

enum EigenbelegType {
  INCOME   // Einnahme (Einzahlung)
  EXPENSE  // Ausgabe (Entnahme)
}

// ─────────────────────────────────────────────
// AUTH & USERS
// ─────────────────────────────────────────────

model User {
  id                String    @id @default(uuid())
  username          String    @unique
  passwordHash      String
  roles             Role[]    @default([MEMBER])
  isActive          Boolean   @default(true)
  lastLoginAt       DateTime?
  loginAttempts     Int       @default(0)
  lockedUntil       DateTime?
  language          String    @default("de")
  // 2FA (ab Stufe 3)
  twoFactorEnabled  Boolean   @default(false)
  twoFactorSecret   String?   // verschlüsselt gespeicherter TOTP-Secret
  // Datenschutz
  privacyAcceptedAt DateTime? // Zeitpunkt der Datenschutzbestätigung
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  // Relations
  member            Member?
  rfidTokens        RfidToken[]
  refreshTokens     RefreshToken[]
  passwordResets    PasswordResetToken[]

  @@index([username])
}

model PasswordResetToken {
  id        String   @id @default(uuid())
  userId    String
  tokenHash String   @unique  // Hash des Einmal-Tokens
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([tokenHash])
}

model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())
  revokedAt DateTime?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([userId])
}

model RfidToken {
  id          String    @id @default(uuid())
  tokenHash   String    @unique  // gehashter RFID-Wert
  label       String?            // z.B. "Schlüsselanhänger blau"
  userId      String
  isActive    Boolean   @default(true)
  assignedAt  DateTime  @default(now())
  lastUsedAt  DateTime?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([tokenHash])
  @@index([userId])
}

// ─────────────────────────────────────────────
// MITGLIEDER
// ─────────────────────────────────────────────

model Member {
  id               String       @id @default(uuid())
  memberNumber     String       @unique
  userId           String       @unique
  firstName        String
  lastName         String
  email            String       @unique
  phone            String?
  mobile           String?
  birthDate        DateTime?
  street           String?
  postalCode       String?
  city             String?
  country          String       @default("DE")
  status           MemberStatus @default(ACTIVE)
  memberSince      DateTime     @default(now())
  memberUntil      DateTime?
  contributionTier String?      // z.B. "Erwachsener", "Jugendlicher", "Ermäßigt"
  avatarUrl        String?
  importSource     ImportSource?
  externalId       String?      // ID im Quellsystem (Campei etc.)
  notes            String?      // Interne Notizen (nur Admin/Vorstand)
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt

  // Relations
  user             User         @relation(fields: [userId], references: [id])
  account          MemberAccount?
  hoursEntries     HoursEntry[]
  feedbacks        Feedback[]
  dataChangeRequests DataChangeRequest[]

  @@index([memberNumber])
  @@index([lastName, firstName])
  @@index([email])
}

model DataChangeRequest {
  id          String    @id @default(uuid())
  memberId    String
  field       String    // z.B. "email", "phone", "address"
  oldValue    String?
  newValue    String
  reason      String?
  status      String    @default("PENDING") // PENDING, APPROVED, REJECTED
  reviewedBy  String?
  reviewedAt  DateTime?
  reviewNote  String?
  createdAt   DateTime  @default(now())

  member Member @relation(fields: [memberId], references: [id], onDelete: Cascade)
}

// ─────────────────────────────────────────────
// MITGLIEDERSTUNDEN
// ─────────────────────────────────────────────

model HoursQuota {
  id           String   @id @default(uuid())
  year         Int
  requiredHours Decimal  @db.Decimal(6, 2)  // z.B. 10.00
  description  String?
  createdAt    DateTime @default(now())

  @@unique([year])
}

model HoursEvent {
  id           String       @id @default(uuid())
  title        String
  description  String?
  date         DateTime
  maxSlots     Int?         // null = unbegrenzt
  hoursValue   Decimal      @db.Decimal(6, 2)  // Anzahl anrechenbarer Stunden
  location     String?
  createdBy    String
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  entries HoursEntry[]
}

model HoursEntry {
  id          String       @id @default(uuid())
  memberId    String
  eventId     String?      // optional: Referenz auf HoursEvent
  date        DateTime
  hours       Decimal      @db.Decimal(6, 2)
  description String?
  status      HoursStatus  @default(PLANNED)
  confirmedBy String?
  confirmedAt DateTime?
  year        Int          // Für schnelles Filtern nach Jahr
  createdAt   DateTime     @default(now())

  member Member     @relation(fields: [memberId], references: [id], onDelete: Cascade)
  event  HoursEvent? @relation(fields: [eventId], references: [id])

  @@index([memberId, year])
}

// ─────────────────────────────────────────────
// FEEDBACK & KOMMUNIKATION
// ─────────────────────────────────────────────

model Feedback {
  id          String           @id @default(uuid())
  memberId    String
  category    FeedbackCategory @default(OTHER)
  subject     String
  message     String
  status      FeedbackStatus   @default(OPEN)
  assignedTo  String?
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  member  Member           @relation(fields: [memberId], references: [id])
  replies FeedbackReply[]

  @@index([memberId])
  @@index([status])
}

model FeedbackReply {
  id          String   @id @default(uuid())
  feedbackId  String
  authorId    String
  message     String
  isInternal  Boolean  @default(false) // Interne Notizen nicht für Mitglied sichtbar
  createdAt   DateTime @default(now())

  feedback Feedback @relation(fields: [feedbackId], references: [id], onDelete: Cascade)

  @@index([feedbackId])
}

// ─────────────────────────────────────────────
// DOKUMENTE
// ─────────────────────────────────────────────

model DocumentCategory {
  id        String     @id @default(uuid())
  name      String     @unique
  nameEn    String?
  sortOrder Int        @default(0)
  documents Document[]
}

model Document {
  id          String   @id @default(uuid())
  categoryId  String
  title       String
  titleEn     String?
  description String?
  fileName    String
  filePath    String
  fileSize    Int      // in Bytes
  mimeType    String
  version     String   @default("1.0")
  uploadedBy  String
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  category DocumentCategory @relation(fields: [categoryId], references: [id])

  @@index([categoryId])
}

// ─────────────────────────────────────────────
// KALENDER & VERANSTALTUNGEN
// ─────────────────────────────────────────────

model CalendarEvent {
  id           String    @id @default(uuid())
  title        String
  titleEn      String?
  description  String?
  descriptionEn String?
  startDate    DateTime
  endDate      DateTime
  allDay       Boolean   @default(false)
  location     String?
  category     String?
  color        String?   // Hex-Farbe für Kalenderdarstellung
  maxAttendees Int?
  isPublic     Boolean   @default(true)
  createdBy    String
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  attendees EventAttendee[]
}

model EventAttendee {
  id        String   @id @default(uuid())
  eventId   String
  memberId  String
  status    String   @default("REGISTERED") // REGISTERED, CANCELLED
  createdAt DateTime @default(now())

  event CalendarEvent @relation(fields: [eventId], references: [id], onDelete: Cascade)

  @@unique([eventId, memberId])
}

// ─────────────────────────────────────────────
// KASSENSYSTEM
// ─────────────────────────────────────────────

model Article {
  id          String   @id @default(uuid())
  sku         String   @unique  // Artikelnummer
  name        String
  nameEn      String?
  description String?
  price       Decimal  @db.Decimal(10, 2)
  taxRate     Decimal  @db.Decimal(5, 2) @default(0)
  category    String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  transactionItems TransactionItem[]
}

model MemberAccount {
  id        String   @id @default(uuid())
  memberId  String   @unique
  balance   Decimal  @db.Decimal(10, 2) @default(0)
  iban      String?  // Für SEPA-Lastschrift
  bic       String?
  mandateId String?  // SEPA-Mandatsreferenz
  mandateDate DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  member       Member        @relation(fields: [memberId], references: [id])
  transactions Transaction[]
  invoices     Invoice[]
}

model Transaction {
  id          String          @id @default(uuid())
  accountId   String
  type        TransactionType
  amount      Decimal         @db.Decimal(10, 2)
  description String
  reference   String?         // Interne Referenz / Belegnummer
  invoiceId   String?
  createdBy   String
  reversedBy  String?         // ID der Storno-Transaktion
  createdAt   DateTime        @default(now())

  account MemberAccount    @relation(fields: [accountId], references: [id])
  items   TransactionItem[]
  invoice Invoice?          @relation(fields: [invoiceId], references: [id])

  @@index([accountId])
  @@index([createdAt])
}

model TransactionItem {
  id            String      @id @default(uuid())
  transactionId String
  articleId     String?
  quantity      Decimal     @db.Decimal(8, 2) @default(1)
  unitPrice     Decimal     @db.Decimal(10, 2)
  taxRate       Decimal     @db.Decimal(5, 2) @default(0)
  description   String

  transaction Transaction @relation(fields: [transactionId], references: [id], onDelete: Cascade)
  article     Article?    @relation(fields: [articleId], references: [id])
}

model Invoice {
  id             String        @id @default(uuid())
  invoiceNumber  String        @unique
  accountId      String
  status         InvoiceStatus @default(DRAFT)
  dueDate        DateTime?
  pdfPath        String?
  notes          String?
  periodStart    DateTime?
  periodEnd      DateTime?
  totalNet       Decimal       @db.Decimal(10, 2)
  totalTax       Decimal       @db.Decimal(10, 2)
  totalGross     Decimal       @db.Decimal(10, 2)
  createdBy      String
  sentAt         DateTime?
  paidAt         DateTime?
  cancelledAt    DateTime?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  account      MemberAccount @relation(fields: [accountId], references: [id])
  transactions Transaction[]

  @@index([accountId])
  @@index([status])
  @@index([invoiceNumber])
}

// ─────────────────────────────────────────────
// GÄSTEKASSE
// ─────────────────────────────────────────────

model GuestSlot {
  id             String    @id @default(uuid())
  slotNumber     Int       @unique  // z.B. 1–20
  displayName    String?            // temporärer Name, wird nach Abrechnung gelöscht
  reservedBy     String?            // memberId des verantwortlichen Mitglieds
  reservedAt     DateTime?
  isActive       Boolean   @default(true)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  transactions   GuestTransaction[]

  @@index([slotNumber])
  @@index([reservedBy])
}

model GuestTransaction {
  id              String             @id @default(uuid())
  slotId          String
  eventId         String?            // optionale Zuordnung zu Veranstaltung
  responsibleMemberId String         // welches Mitglied hat abgerechnet
  items           Json               // Snapshot: [{articleId, name, qty, unitPrice}]
  totalAmount     Decimal            @db.Decimal(10, 2)
  paymentMethod   GuestPaymentMethod
  paypalReference String?            // z.B. "PP-12345" (manuell eingetragen)
  notes           String?
  settledAt       DateTime?          // Zeitpunkt der Abrechnung / Slot-Reset
  createdAt       DateTime           @default(now())

  slot   GuestSlot      @relation(fields: [slotId], references: [id])
  event  CalendarEvent? @relation(fields: [eventId], references: [id])

  @@index([slotId])
  @@index([responsibleMemberId])
  @@index([settledAt])
}

// ─────────────────────────────────────────────
// EIGENBELEGE
// ─────────────────────────────────────────────

model Eigenbeleg {
  id           String         @id @default(uuid())
  type         EigenbelegType
  amount       Decimal        @db.Decimal(10, 2)
  date         DateTime
  description  String
  category     String?        // z.B. "Materialeinkauf", "Vereinsveranstaltung"
  createdBy    String         // userId
  isReversed   Boolean        @default(false)
  reversalNote String?
  reversedAt   DateTime?
  reversedBy   String?
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  attachments  EigenbelegAttachment[]

  @@index([date])
  @@index([createdBy])
}

model EigenbelegAttachment {
  id           String   @id @default(uuid())
  eigenbelegId String
  fileName     String   // Originalname für Anzeige
  filePath     String   // interner Speicherpfad (UUID-basiert)
  fileSize     Int      // in Bytes
  mimeType     String
  uploadedBy   String
  createdAt    DateTime @default(now())

  eigenbeleg Eigenbeleg @relation(fields: [eigenbelegId], references: [id], onDelete: Cascade)
}

// ─────────────────────────────────────────────
// DSGVO – AKTIVITÄTSPROTOKOLL
// ─────────────────────────────────────────────

model ActivityLog {
  id         String   @id @default(uuid())
  memberId   String   // betroffenes Mitglied
  actorId    String   // ausführender Benutzer (kann Admin sein)
  action     String   // z.B. "BOOKING_CREATED", "INVOICE_SENT", "HOURS_CONFIRMED"
  module     String   // z.B. "cash-register", "hours", "auth"
  entityId   String?  // ID des betroffenen Datensatzes
  description String  // menschenlesbare Beschreibung
  details    Json?    // strukturierte Zusatzdaten für Export
  createdAt  DateTime @default(now())

  @@index([memberId, createdAt])
  @@index([memberId, module])
}

// ─────────────────────────────────────────────
// SYSTEM-KONFIGURATION
// ─────────────────────────────────────────────

model SystemConfig {
  id        String   @id @default(uuid())
  key       String   @unique
  value     String
  type      String   @default("string") // string, number, boolean, json
  group     String?  // z.B. "general", "cash", "hours"
  label     String?
  updatedBy String?
  updatedAt DateTime @updatedAt
}

// ─────────────────────────────────────────────
// IMPORT-PROTOKOLL
// ─────────────────────────────────────────────

model ImportLog {
  id           String       @id @default(uuid())
  source       ImportSource
  fileName     String?
  totalRows    Int
  importedRows Int
  skippedRows  Int
  errorRows    Int
  status       String       // COMPLETED, FAILED, PARTIAL
  errors       Json?        // Array von Fehlermeldungen
  createdBy    String
  createdAt    DateTime     @default(now())
}
```

---

## 3. Datenbankindizes (Zusammenfassung)

Neben den im Schema definierten Indizes sollten folgende zusammengesetzte Indizes für häufige Abfragen angelegt werden:

```sql
-- Stunden je Mitglied und Jahr
CREATE INDEX idx_hours_member_year ON "HoursEntry" ("memberId", "year", "status");

-- Transaktionen nach Konto und Datum
CREATE INDEX idx_transaction_account_date ON "Transaction" ("accountId", "createdAt" DESC);

-- Aktive Mitglieder
CREATE INDEX idx_member_status ON "Member" ("status") WHERE "status" = 'ACTIVE';

-- Dokumente nach Kategorie (aktiv)
CREATE INDEX idx_document_category_active ON "Document" ("categoryId") WHERE "isActive" = true;

-- Gäste-Transaktionen nach Datum
CREATE INDEX idx_guest_tx_settled ON "GuestTransaction" ("settledAt" DESC);

-- Eigenbelege nach Datum und Typ
CREATE INDEX idx_eigenbeleg_date_type ON "Eigenbeleg" ("date" DESC, "type");

-- Aktivitätsprotokoll nach Mitglied und Modul
CREATE INDEX idx_activity_member_module ON "ActivityLog" ("memberId", "module", "createdAt" DESC);
```

---

## 4. Seed-Daten

Das Projekt enthält eine Seed-Datei (`prisma/seed.ts`) mit:
- Standard-Dokumentkategorien (Satzung, Beitragsordnung, Hausordnung, Protokolle)
- Standard-Systemkonfiguration (Session-Dauer, Stunden-Kontingent, Gäste-Slot-Anzahl: 20)
- Gäste-Slots 1–20 (initial angelegt, inaktive können vom Admin deaktiviert werden)
- Standard-Eigenbeleg-Kategorien (Materialeinkauf, Veranstaltung, Sonstiges)
- Einen initialen Admin-Benutzer (Passwort muss beim ersten Login geändert werden)

---

## 5. Migrationsstrategie

- Alle Schemaänderungen über `prisma migrate dev` (Development) bzw. `prisma migrate deploy` (Production)
- Migrationsdateien werden ins Repository eingecheckt
- Breaking Changes (Spalten löschen, Typ ändern) erfordern separate Migrationsskripte mit Datentransformation
- Backups vor jeder Migration in Produktion sind Pflicht
