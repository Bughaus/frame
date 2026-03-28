/**
 * One-time migration to backfill `createdBy` fields in transactions
 * from UUID values to human-readable usernames.
 *
 * Usage: npx ts-node prisma/backfill-createdby.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Get all users to build UUID -> username lookup
  const users = await prisma.user.findMany({ select: { id: true, username: true } })
  const lookup = new Map<string, string>()
  for (const u of users) {
    lookup.set(u.id, u.username)
  }

  console.log(`Found ${users.length} users for lookup.`)

  // Fix Transaction.createdBy
  const transactions = await prisma.transaction.findMany({
    select: { id: true, createdBy: true }
  })

  let fixedCount = 0
  for (const t of transactions) {
    const username = lookup.get(t.createdBy)
    if (username) {
      await prisma.transaction.update({
        where: { id: t.id },
        data: { createdBy: username }
      })
      fixedCount++
    }
  }
  console.log(`Fixed ${fixedCount}/${transactions.length} transactions.`)

  // Fix Invoice.createdBy
  const invoices = await prisma.invoice.findMany({
    select: { id: true, createdBy: true }
  })

  let fixedInvoices = 0
  for (const inv of invoices) {
    const username = lookup.get(inv.createdBy)
    if (username) {
      await prisma.invoice.update({
        where: { id: inv.id },
        data: { createdBy: username }
      })
      fixedInvoices++
    }
  }
  console.log(`Fixed ${fixedInvoices}/${invoices.length} invoices.`)

  console.log('Backfill complete!')
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
