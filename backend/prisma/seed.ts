import { PrismaClient, Role } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import * as crypto from 'crypto'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 12)
  
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash,
      roles: [Role.VORSTAND, Role.MEMBER],
      language: "de",
    },
  })

  const adminMember = await prisma.member.upsert({
    where: { memberNumber: 'A-001' },
    update: {},
    create: {
      memberNumber: 'A-001',
      userId: admin.id,
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@verein.local',
      status: 'ACTIVE',
    }
  })

  await prisma.memberAccount.upsert({
    where: { memberId: adminMember.id },
    update: {},
    create: { memberId: adminMember.id }
  })

  // Create mocked Admin RFID token
  const rfidTokenPlainText = 'dev-rfid-12345'
  const tokenHash = crypto.createHash('sha256').update(rfidTokenPlainText).digest('hex')

  await prisma.rfidToken.upsert({
    where: { tokenHash },
    update: {},
    create: {
      tokenHash,
      label: 'Dev Emulator Token',
      userId: admin.id,
    }
  })

  await prisma.article.upsert({ where: { sku: 'BEV-001' }, update: {}, create: { sku: 'BEV-001', name: 'Mineralwasser 0,5l', price: 1.50, taxRate: 7.0 } })
  await prisma.article.upsert({ where: { sku: 'BEV-002' }, update: {}, create: { sku: 'BEV-002', name: 'Spezi 0,5l', price: 2.00, taxRate: 19.0 } })
  await prisma.article.upsert({ where: { sku: 'FOD-001' }, update: {}, create: { sku: 'FOD-001', name: 'Butterbrezel', price: 1.20, taxRate: 7.0 } })

  // Seed 20 Guest Slots
  for (let i = 1; i <= 20; i++) {
    await prisma.guestSlot.upsert({
      where: { slotNumber: i },
      update: {},
      create: { slotNumber: i, displayName: `Gast ${i}` }
    })
  }

  console.log('Seeded Admin User:', admin.username)
  console.log('Seeded Dev RFID Token:', rfidTokenPlainText)
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
