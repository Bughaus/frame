import { PrismaClient, Role } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import * as crypto from 'crypto'

const prisma = new PrismaClient()

async function main() {
  const isProduction = process.env.NODE_ENV === 'production'
  
  // 1. Determine Admin Credentials
  const adminUsername: string = process.env.INITIAL_ADMIN_USERNAME || 'admin'
  const adminPassword: string | undefined = process.env.INITIAL_ADMIN_PASSWORD
  const adminEmailEnv: string | undefined = process.env.INITIAL_ADMIN_EMAIL
  const adminEmail: string = adminEmailEnv || `${adminUsername}@verein.local`

  if (isProduction && !adminPassword) {
    throw new Error('CRITICAL SECURITY ERROR: INITIAL_ADMIN_PASSWORD must be set in production mode!')
  }

  const defaultPassword = adminPassword || 'start123'
  const passwordHash = await bcrypt.hash(defaultPassword, 12)
  
  console.log(`Seeding database (Mode: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'})...`)

  // 1. Create Staff Members (Roles)
  const rolesData = isProduction 
    ? [{ username: adminUsername, roles: [Role.VORSTAND, Role.MEMBER], firstName: 'Alexander', lastName: 'Admin', memberNumber: 'A-001' }]
    : [
        { username: 'admin', roles: [Role.VORSTAND, Role.MEMBER], firstName: 'Alexander', lastName: 'Admin', memberNumber: 'A-001' },
        { username: 'vorstand', roles: [Role.VORSTAND, Role.MEMBER], firstName: 'Stefan', lastName: 'Vorstand', memberNumber: 'V-001' },
        { username: 'mitarbeiter', roles: [Role.MITARBEITER, Role.MEMBER], firstName: 'Max', lastName: 'Mitarbeiter', memberNumber: 'M-001' },
        { username: 'mitglied', roles: [Role.MEMBER], firstName: 'Markus', lastName: 'Mitglied', memberNumber: 'L-001' },
      ]

  // Add more members only in development
  const moreMembers = isProduction ? [] : [
    { username: 'jdoe', firstName: 'John', lastName: 'Doe', memberNumber: 'L-002' },
    { username: 'asmith', firstName: 'Alice', lastName: 'Smith', memberNumber: 'L-003' },
    { username: 'rjones', firstName: 'Robert', lastName: 'Jones', memberNumber: 'L-004' },
    { username: 'mgarcia', firstName: 'Maria', lastName: 'Garcia', memberNumber: 'L-005' },
    { username: 'dmiller', firstName: 'David', lastName: 'Miller', memberNumber: 'L-006' },
    { username: 'swhite', firstName: 'Sarah', lastName: 'White', memberNumber: 'L-007' },
    { username: 'jblack', firstName: 'James', lastName: 'Black', memberNumber: 'L-008' },
    { username: 'kbrown', firstName: 'Karen', lastName: 'Brown', memberNumber: 'L-009' },
    { username: 'twilson', firstName: 'Thomas', lastName: 'Wilson', memberNumber: 'L-010' },
    { username: 'emartinez', firstName: 'Emma', lastName: 'Martinez', memberNumber: 'L-011' },
    { username: 'clin', firstName: 'Christopher', lastName: 'Lin', memberNumber: 'L-012' },
    { username: 'sharris', firstName: 'Sophia', lastName: 'Harris', memberNumber: 'L-013' },
    { username: 'bclark', firstName: 'Benjamin', lastName: 'Clark', memberNumber: 'L-014' },
    { username: 'mlewis', firstName: 'Mia', lastName: 'Lewis', memberNumber: 'L-015' },
    { username: 'awalker', firstName: 'Andrew', lastName: 'Walker', memberNumber: 'L-016' },
  ]

  const allStaffAndMembers = [...rolesData, ...moreMembers.map(m => ({ ...m, roles: [Role.MEMBER] }))]

  for (const data of allStaffAndMembers) {
    const user = await prisma.user.upsert({
      where: { username: data.username },
      update: { roles: data.roles },
      create: {
        username: data.username,
        passwordHash,
        roles: data.roles,
        language: "de",
      },
    })

    const userEmail: string = (data.username === adminUsername && adminEmail) ? adminEmail : `${data.username}@verein.local`

    const member = await prisma.member.upsert({
      where: { memberNumber: data.memberNumber },
      update: {},
      create: {
        memberNumber: data.memberNumber,
        userId: user.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: userEmail,
        status: 'ACTIVE',
      }
    })

    await prisma.memberAccount.upsert({
      where: { memberId: member.id },
      update: {},
      create: { memberId: member.id }
    })
    
    // Create RFID Token for Admin (only in dev, or if specifically requested)
    if (data.username === 'admin' && !isProduction) {
      const rfidTokenPlainText = 'dev-rfid-12345'
      const tokenHash = crypto.createHash('sha256').update(rfidTokenPlainText).digest('hex')
      await prisma.rfidToken.upsert({
        where: { tokenHash },
        update: {},
        create: {
          tokenHash,
          label: 'Dev Emulator Token',
          userId: user.id,
        }
      })
    }
  }

  // 2. Seed Articles - Defaulting taxRate to 0
  const articlesData = [
    // Getränke
    { sku: 'BEV-001', name: 'Mineralwasser 0,5l', category: 'Getränke', price: 1.50, taxRate: 0 },
    { sku: 'BEV-002', name: 'Spezi 0,5l', category: 'Getränke', price: 2.00, taxRate: 0 },
    { sku: 'BEV-003', name: 'Club Mate 0,5l', category: 'Getränke', price: 2.50, taxRate: 0 },
    { sku: 'BEV-004', name: 'Bier 0,5l (Helles)', category: 'Getränke', price: 2.50, taxRate: 0 },
    { sku: 'BEV-005', name: 'Bier 0,5l (Pils)', category: 'Getränke', price: 2.50, taxRate: 0 },
    { sku: 'BEV-006', name: 'Weizenbier 0,5l', category: 'Getränke', price: 3.00, taxRate: 0 },
    { sku: 'BEV-007', name: 'Apfelschorle 0,5l', category: 'Getränke', price: 2.00, taxRate: 0 },
    { sku: 'BEV-008', name: 'Cola 0,33l', category: 'Getränke', price: 1.80, taxRate: 0 },
    { sku: 'BEV-009', name: 'Energy Drink 0,25l', category: 'Getränke', price: 2.50, taxRate: 0 },
    
    // Snacks
    { sku: 'FOD-001', name: 'Butterbrezel', category: 'Snacks', price: 1.20, taxRate: 0 },
    { sku: 'FOD-002', name: 'Schokoriegel', category: 'Snacks', price: 1.00, taxRate: 0 },
    { sku: 'FOD-003', name: 'Kartoffelchips', category: 'Snacks', price: 1.50, taxRate: 0 },
    { sku: 'FOD-004', name: 'Erdnüsse', category: 'Snacks', price: 1.50, taxRate: 0 },
    { sku: 'FOD-005', name: 'Gummibärchen', category: 'Snacks', price: 1.20, taxRate: 0 },
    { sku: 'FOD-006', name: 'Müsliriegel', category: 'Snacks', price: 1.00, taxRate: 0 },
    
    // Merchandise / Hardware
    { sku: 'MER-001', name: 'Vereins T-Shirt', category: 'Merch', price: 15.00, taxRate: 0 },
    { sku: 'MER-002', name: 'Vereins Cap', category: 'Merch', price: 12.00, taxRate: 0 },
    { sku: 'MER-003', name: 'Aufkleber-Set', category: 'Merch', price: 2.50, taxRate: 0 },
    { sku: 'HDW-001', name: 'Lötlitze 1m', category: 'Hardware', price: 0.50, taxRate: 0 },
    { sku: 'HDW-002', name: 'ESP32 DevKit', category: 'Hardware', price: 8.50, taxRate: 0 },
    { sku: 'HDW-003', name: 'Arduino Nano', category: 'Hardware', price: 5.00, taxRate: 0 },
    { sku: 'HDW-004', name: 'Steckboard (Small)', category: 'Hardware', price: 3.50, taxRate: 0 },
  ]

  for (const art of articlesData) {
    await prisma.article.upsert({
      where: { sku: art.sku },
      update: art,
      create: art
    })
  }

  // 3. Seed Guest Slots
  for (let i = 1; i <= 20; i++) {
    await prisma.guestSlot.upsert({
      where: { slotNumber: i },
      update: {},
      create: { slotNumber: i, displayName: `Gast ${i}` }
    })
  }

  // 4. Seed System Config
  const systemConfigs = [
    { key: 'CLUB_NAME', value: 'Bughaus Frame Club', group: 'GENERAL', label: 'Vereinsname' },
    { key: 'CLUB_LOGO_URL', value: '/logo.png', group: 'GENERAL', label: 'Logo URL' },
    { key: 'CLUB_ADDRESS_STREET', value: 'Musterstraße 1', group: 'GENERAL', label: 'Straße' },
    { key: 'CLUB_ADDRESS_CITY', value: '12345 Musterstadt', group: 'GENERAL', label: 'Stadt' },
    { key: 'CLUB_ADDRESS_COUNTRY', value: 'Deutschland', group: 'GENERAL', label: 'Land' },
    { key: 'CLUB_IBAN', value: 'DE12 3456 7890 1234 5678 90', group: 'FINANCE', label: 'IBAN' },
    { key: 'CLUB_BIC', value: 'GENO DE FF XXX', group: 'FINANCE', label: 'BIC' },
    { key: 'CLUB_VORSTAND_NAMES', value: 'Alexander Admin, Stefan Vorstand', group: 'GENERAL', label: 'Vorstand Namen' },
    { key: 'CLUB_EMAIL', value: 'vorstand@snooker-club.de', group: 'GENERAL', label: 'Club Email' },
    { key: 'CLUB_DISCLAIMER', value: 'Diese Rechnung wurde maschinell erstellt und ist ohne Unterschrift gültig. Bitte überweisen Sie den Betrag innerhalb von 14 Tagen.', group: 'GENERAL', label: 'Rechtlicher Hinweis / Disclaimer' },
    { key: 'CLUB_WEBSITE_DISCLAIMER', value: 'Dies ist eine vereinsinterne Software. Alle Angaben ohne Gewähr.', group: 'GENERAL', label: 'Website Hinweis / Footer' },
    { key: 'AUTH_RFID_ENABLED', value: 'true', group: 'SECURITY', label: 'RFID Login global aktiviert' },
    { key: 'MAIL_SMTP_HOST', value: 'smtp.example.com', group: 'MAIL', label: 'SMTP Host' },
    { key: 'MAIL_SMTP_PORT', value: '587', group: 'MAIL', label: 'SMTP Port' },
    { key: 'MAIL_SMTP_USER', value: 'user@example.com', group: 'MAIL', label: 'SMTP User' },
    { key: 'MAIL_SMTP_PASS', value: 'password', group: 'MAIL', label: 'SMTP Password' },
    { key: 'MAIL_FROM_ADDRESS', value: 'noreply@example.com', group: 'MAIL', label: 'Sender Email' },
    { key: 'MAIL_FROM_NAME', value: 'FRAME', group: 'MAIL', label: 'Sender Name' },
    { key: 'MAIL_SMTP_SECURE', value: 'false', group: 'MAIL', label: 'SMTP Secure (SSL/TLS)' },
  ]

  for (const conf of systemConfigs) {
    await prisma.systemConfig.upsert({
      where: { key: conf.key },
      update: {},
      create: conf
    })
  }

  console.log('Seed completed successfully.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
