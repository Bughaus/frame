import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CreateGuestTransactionDto } from './dto/create-guest-transaction.dto';
import { GuestPaymentMethod } from '@prisma/client';
import { SystemConfigService } from '../system-config/system-config.service';
import { join } from 'path';
import { existsSync } from 'fs';

@Injectable()
export class CashRegisterService {
  constructor(
    private prisma: PrismaService,
    private configService: SystemConfigService
  ) {}

  async createTransaction(dto: CreateTransactionDto, userId: string) {
    if (!dto.items || dto.items.length === 0) throw new BadRequestException('Transaction must contain at least one item.');

    return this.prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const dbItems = [];

      for (const item of dto.items) {
        const article = await tx.article.findUnique({ where: { id: item.articleId } });
        if (!article || !article.isActive) throw new BadRequestException(`Article ${item.articleId} is invalid or inactive`);
        
        totalAmount += Number(article.price) * item.quantity;
        dbItems.push({
          articleId: article.id,
          quantity: item.quantity,
          unitPrice: article.price,
          taxRate: article.taxRate,
          description: article.name
        });
      }

      const charge = -Math.abs(totalAmount);

      const transaction = await tx.transaction.create({
        data: {
          accountId: dto.accountId,
          amount: charge,
          type: 'DEBIT',
          description: dto.description || 'Terminalbuchung (System)',
          createdBy: userId,
          items: {
            create: dbItems
          }
        }
      });

      await tx.memberAccount.update({
        where: { id: dto.accountId },
        data: { balance: { increment: charge } }
      });

      return transaction;
    });
  }

  getAccounts() {
    return this.prisma.memberAccount.findMany({ 
      where: { member: { status: 'ACTIVE' } },
      include: { 
        member: { select: { id: true, firstName: true, lastName: true, memberNumber: true } } 
      } 
    });
  }

  getAccount(id: string) {
    return this.prisma.memberAccount.findUnique({ 
      where: { id }, 
      include: { 
        member: true, 
        transactions: { include: { items: { include: { article: true } } }, orderBy: { createdAt: 'desc' } } 
      } 
    });
  }

  async getAccountByUserId(userId: string) {
    const member = await this.prisma.member.findUnique({ where: { userId } });
    if (!member) throw new NotFoundException('Member profile not found.');
    return this.prisma.memberAccount.findUnique({
      where: { memberId: member.id },
      include: {
        member: { include: { user: { select: { id: true, username: true } } } },
        transactions: { include: { items: { include: { article: true } } }, orderBy: { createdAt: 'desc' } }
      }
    });
  }

  // -- INVOICES & EXPORTS --

  async generateInvoices(accountIds: string[], dueDate: Date, userId: string) {
    const createdInvoices = [];
    for (const accountId of accountIds) {
      const invoice = await this.prisma.$transaction(async (tx) => {
        const account = await tx.memberAccount.findUnique({
          where: { id: accountId },
          include: { transactions: { where: { invoiceId: null, type: 'DEBIT' } } }
        });
        if (!account || account.transactions.length === 0) return null;

        const totalAmount = account.transactions.reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);

        const newInvoice = await tx.invoice.create({
          data: {
            invoiceNumber: `INV-${Date.now()}-${Math.floor(Math.random()*1000)}`,
            accountId,
            dueDate: new Date(dueDate),
            totalNet: totalAmount, 
            totalTax: 0,
            totalGross: totalAmount,
            createdBy: userId,
            status: 'DRAFT',
            transactions: { connect: account.transactions.map(t => ({ id: t.id })) }
          }
        });

        return newInvoice;
      });

      if (invoice) createdInvoices.push(invoice);
    }
    return createdInvoices;
  }

  getInvoices() {
    return this.prisma.invoice.findMany({ include: { account: { include: { member: true } } }, orderBy: { createdAt: 'desc' } });
  }

  async updateInvoiceStatus(id: string, status: 'PAID' | 'CANCELLED') {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.update({
        where: { id },
        include: { account: true },
        data: {
          status,
          paidAt: status === 'PAID' ? new Date() : undefined,
          cancelledAt: status === 'CANCELLED' ? new Date() : undefined,
        }
      });

      if (status === 'PAID') {
        // Now settle the balance
        await tx.transaction.create({
          data: {
            accountId: invoice.accountId,
            amount: invoice.totalGross,
            type: 'CREDIT',
            description: `Rechnungsausgleich (Bezahlt): ${invoice.invoiceNumber}`,
            createdBy: 'System', // Or pass user from controller
            invoiceId: invoice.id
          }
        });

        await tx.memberAccount.update({
          where: { id: invoice.accountId },
          data: { balance: { increment: invoice.totalGross } }
        });
      }

      return invoice;
    });
  }

  async getInvoicesByUserId(userId: string) {
    const member = await this.prisma.member.findUnique({ where: { userId } });
    if (!member) throw new NotFoundException('Member profile not found.');
    return this.prisma.invoice.findMany({ 
      where: { account: { memberId: member.id } }, 
      orderBy: { createdAt: 'desc' } 
    });
  }

  async generateInvoicePdf(invoiceId: string): Promise<Buffer> {
    const PDFDocument = require('pdfkit');
    const invoice = await this.prisma.invoice.findUnique({ 
      where: { id: invoiceId }, 
      include: { 
        account: { include: { member: true } }, 
        transactions: { include: { items: { include: { article: true } } } } 
      } 
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ 
        margin: 50, 
        bufferPages: true,
        autoFirstPage: true 
      });
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Recipient info
      doc.fontSize(12).text(`Mitglied: ${invoice.account.member.firstName} ${invoice.account.member.lastName}`, 50, 160);
      doc.text(`Mitglieds-Nr.: ${invoice.account.member.memberNumber}`);
      doc.moveDown();

      const startY = doc.y;
      doc.font('Helvetica-Bold').fontSize(10);
      doc.text('Datum', 50, startY);
      doc.text('Artikel', 130, startY);
      doc.text('Menge', 300, startY);
      doc.text('Preis', 350, startY);
      doc.text('Gebucht von', 420, startY);
      doc.moveTo(50, startY + 15).lineTo(550, startY + 15).stroke();
      
      doc.font('Helvetica').fontSize(9);
      let y = startY + 22;
      for (const t of invoice.transactions) {
        const checkPage = () => {
          if (y > 700) {
            doc.addPage();
            y = 160;
          }
        };

        if (t.items && t.items.length > 0) {
          for (const item of t.items) {
            checkPage();
            doc.text(t.createdAt.toLocaleDateString('de-DE'), 50, y);
            doc.text(item.description || item.article?.name || 'Artikel', 130, y, { width: 160 });
            doc.text(String(Number(item.quantity)), 300, y);
            doc.text(`${Number(item.unitPrice).toFixed(2)} €`, 350, y);
            doc.text(t.createdBy || '-', 420, y, { width: 120 });
            y += 16;
          }
        } else {
          checkPage();
          doc.text(t.createdAt.toLocaleDateString('de-DE'), 50, y);
          doc.text(t.description, 130, y, { width: 160 });
          doc.text('', 300, y);
          doc.text(`${Math.abs(Number(t.amount)).toFixed(2)} €`, 350, y);
          doc.text(t.createdBy || '-', 420, y, { width: 120 });
          y += 16;
        }
      }

      doc.moveTo(50, y + 5).lineTo(550, y + 5).stroke();
      doc.font('Helvetica-Bold').fontSize(12);
      doc.text(`Gesamtbetrag: ${Number(invoice.totalGross).toFixed(2)} EUR`, 50, y + 15, { align: 'right' });
      
      this.finalizeDocument(doc, invoice.invoiceNumber, invoice.createdAt, invoice.dueDate || undefined).then(() => {
        doc.end();
      });
    });
  }

  async generateGuestReceiptPdf(txId: string): Promise<Buffer> {
    const PDFDocument = require('pdfkit');
    const tx = await this.prisma.guestTransaction.findUnique({ where: { id: txId }, include: { slot: true } });
    if (!tx || !tx.settledAt) throw new NotFoundException('Transaction not found or not settled');

    const settledAt = tx.settledAt!;

    const sessionTxs = await this.prisma.guestTransaction.findMany({
      where: { slotId: tx.slotId, settledAt },
      orderBy: { createdAt: 'asc' }
    });

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, bufferPages: true });
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      doc.fontSize(12).text(`Gast: ${tx.slot.displayName || 'Gast'}`, 50, 160);
      doc.text(`Slot: ${tx.slot.slotNumber}`);
      doc.text(`Zahlungsart: ${tx.paymentMethod}`);
      doc.moveDown();

      const startY = doc.y;
      doc.font('Helvetica-Bold').fontSize(10);
      doc.text('Artikel', 50, startY);
      doc.text('Menge', 300, startY);
      doc.text('Preis', 380, startY);
      doc.text('Gesamt', 460, startY);
      doc.moveTo(50, startY + 15).lineTo(550, startY + 15).stroke();

      doc.font('Helvetica').fontSize(9);
      let y = startY + 22;
      let grandTotal = 0;

      for (const stx of sessionTxs) {
        const items = stx.items as any[];
        for (const item of items) {
          if (y > 700) { doc.addPage(); y = 160; }
          const qty = Number(item.qty || item.quantity || 1);
          const price = Number(item.unitPrice || item.article?.price || 0);
          const total = qty * price;
          grandTotal += total;

          doc.text(item.name || item.description || 'Artikel', 50, y, { width: 240 });
          doc.text(String(qty), 300, y);
          doc.text(`${price.toFixed(2)} €`, 380, y);
          doc.text(`${total.toFixed(2)} €`, 460, y);
          y += 16;
        }
      }

      doc.moveTo(50, y + 5).lineTo(550, y + 5).stroke();
      doc.font('Helvetica-Bold').fontSize(12);
      doc.text(`Gesamtbetrag: ${grandTotal.toFixed(2)} EUR`, 50, y + 15, { align: 'right' });
      
      this.finalizeDocument(doc, 'Quittung / Gast-Beleg', settledAt).then(() => {
        doc.end();
      });
    });
  }

  async generateSepaXml(invoiceIds: string[]): Promise<string> {
    const { create } = require('xmlbuilder2');
    const invoices = await this.prisma.invoice.findMany({ where: { id: { in: invoiceIds } }, include: { account: { include: { member: true } } } });
    if (invoices.length === 0) throw new BadRequestException('No valid invoices');

    const doc = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('Document', { xmlns: 'urn:iso:std:iso:20022:tech:xsd:pain.008.001.02' })
        .ele('CstmrDrctDbtInitn')
          .ele('GrpHdr')
            .ele('MsgId').txt(`MSG-${Date.now()}`).up()
            .ele('CreDtTm').txt(new Date().toISOString()).up()
            .ele('NbOfTxs').txt(invoices.length.toString()).up()
            .ele('InitgPty')
              .ele('Nm').txt('VereinApp').up()
            .up()
          .up()
        .up()
      .up();
    return doc.end({ prettyPrint: true });
  }

  // -- GUEST SLOTS & RECEIPT --

  async getGuestSlots() {
    const slots = await this.prisma.guestSlot.findMany({ 
      orderBy: { slotNumber: 'asc' },
      include: { transactions: { where: { settledAt: null } } }
    });
    return slots.map(s => ({
      ...s,
      balance: s.transactions.reduce((acc, t) => acc + Number(t.totalAmount), 0)
    }));
  }

  async updateGuestSlot(id: string, data: { displayName?: string }) {
    return this.prisma.guestSlot.update({
      where: { id },
      data
    });
  }

  getEigenbelege() {
    return this.prisma.eigenbeleg.findMany({ orderBy: { date: 'desc' }, include: { attachments: true } });
  }

  async getGlobalTransactions() {
    const memTx = await this.prisma.transaction.findMany({
      include: { account: { include: { member: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    const guestTx = await this.prisma.guestTransaction.findMany({
      include: { slot: true },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    const combined = [
      ...memTx.map(t => ({
        id: t.id,
        date: t.createdAt,
        amount: Number(t.amount),
        type: t.type,
        source: t.account.member ? `${t.account.member.firstName} ${t.account.member.lastName}` : 'System',
        description: t.description,
        isGuest: false
      })),
      ...guestTx.map(t => ({
        id: t.id,
        date: t.createdAt,
        amount: Number(t.totalAmount) * -1,
        type: 'DEBIT',
        source: t.slot.displayName || `Slot ${t.slot.slotNumber}`,
        description: `Gastbuchung (${t.paymentMethod})`,
        isGuest: true
      }))
    ];

    combined.sort((a, b) => b.date.getTime() - a.date.getTime());
    return combined.slice(0, 100);
  }

  async createGuestTransaction(dto: CreateGuestTransactionDto, userId: string) {
    if (!dto.items || dto.items.length === 0) throw new BadRequestException('Transaction must contain at least one item.');
    let totalAmount = 0;
    const dbItems = [];

    for (const item of dto.items) {
      const article = await this.prisma.article.findUnique({ where: { id: item.articleId } });
      if (!article || !article.isActive) throw new BadRequestException(`Article ${item.articleId} is invalid/inactive`);
      totalAmount += Number(article.price) * item.quantity;
      dbItems.push({
        articleId: article.id,
        name: article.name,
        qty: item.quantity,
        unitPrice: article.price
      });
    }

    const transaction = await this.prisma.guestTransaction.create({
      data: {
        slotId: dto.slotId,
        responsibleMemberId: userId,
        items: dbItems,
        totalAmount,
        paymentMethod: 'PENDING' as any,
        paypalReference: null,
      }
    });

    await this.prisma.guestSlot.update({
      where: { id: dto.slotId },
      data: { isActive: false }
    });

    return transaction;
  }

  async clearGuestSlot(slotId: string, paymentMethod: 'CASH' | 'PAYPAL', paypalReference?: string, userId: string = 'System', tipAmount?: number) {
    if (tipAmount && tipAmount > 0) {
      await this.prisma.guestTransaction.create({
        data: {
          slotId,
          responsibleMemberId: userId,
          items: [{ name: 'Trinkgeld', qty: 1, unitPrice: tipAmount }],
          totalAmount: tipAmount,
          paymentMethod: paymentMethod as any,
          paypalReference: paymentMethod === 'PAYPAL' ? paypalReference : null,
          settledAt: new Date()
        }
      });
    }

    await this.prisma.guestTransaction.updateMany({
        where: { slotId, settledAt: null, paymentMethod: 'PENDING' as any },
        data: { 
          settledAt: new Date(),
          paymentMethod: paymentMethod as any,
          paypalReference: paymentMethod === 'PAYPAL' ? paypalReference : null
        }
    });

    const slot = await this.prisma.guestSlot.findUnique({ where: { id: slotId } });

    const [updatedSlot, sampleTx] = await Promise.all([
      this.prisma.guestSlot.update({
        where: { id: slotId },
        data: { isActive: true, displayName: `Gast ${slot?.slotNumber}` }
      }),
      this.prisma.guestTransaction.findFirst({
        where: { slotId, settledAt: { not: null } },
        orderBy: { settledAt: 'desc' },
        select: { id: true }
      })
    ]);

    return {
      slot: updatedSlot,
      transactionId: sampleTx?.id
    };
  }

  async deleteTransaction(id: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { id },
        include: { account: true }
      });
      if (!transaction) throw new NotFoundException('Transaction not found');
      if (transaction.invoiceId) throw new BadRequestException('Bereits abgerechnete Buchungen können nicht gelöscht werden.');
      if (transaction.type !== 'DEBIT') throw new BadRequestException('Nur Belastungen können gelöscht werden.');

      const refund = Math.abs(Number(transaction.amount));
      await tx.memberAccount.update({
        where: { id: transaction.accountId },
        data: { balance: { increment: refund } }
      });

      return tx.transaction.delete({ where: { id } });
    });
  }

  async createEigenbeleg(type: 'INCOME'|'EXPENSE', amount: number, description: string, date: string, category: string, file: Express.Multer.File, userId: string) {
    return this.prisma.eigenbeleg.create({
        data: {
            type,
            amount,
            description,
            date: new Date(date),
            category,
            createdBy: userId,
            attachments: file ? {
                create: {
                    fileName: file.originalname,
                    filePath: file.path,
                    fileSize: file.size,
                    mimeType: file.mimetype,
                    uploadedBy: userId
                }
            } : undefined
        }
    });
  }

  // PDF Branding Helpers

  private async finalizeDocument(doc: any, title: string, date: Date, dueDate?: Date) {
    const config = await this.configService.getMap();
    const range = doc.bufferedPageRange();
    
    // Disable auto paging during header/footer drawing
    const oldBottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;

    for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        this.drawHeader(doc, config, title, date, dueDate);
        this.drawFooter(doc, config);
    }

    doc.page.margins.bottom = oldBottomMargin;
  }

  private drawHeader(doc: any, config: Record<string, string>, title: string, date: Date, dueDate?: Date) {
    const clubName = config['CLUB_NAME'] || 'FRAME';
    const street = config['CLUB_ADDRESS_STREET'] || '';
    const city = config['CLUB_ADDRESS_CITY'] || '';
    const clubEmail = config['CLUB_EMAIL'] || '';
    const logoUrl = config['CLUB_LOGO_URL'];

    if (logoUrl) {
      const fullPath = join(process.cwd(), logoUrl);
      if (existsSync(fullPath)) {
        try {
          doc.image(fullPath, 50, 45, { width: 60 });
        } catch (e) {
          console.warn('Failed to embed logo to PDF:', e);
        }
      }
    }

    doc.font('Helvetica-Bold').fontSize(16).text(clubName, 120, 50);
    doc.font('Helvetica').fontSize(10).text(street, 120, 70);
    doc.text(city, 120, 82);
    if (clubEmail) doc.text(clubEmail, 120, 94);

    doc.font('Helvetica-Bold').fontSize(18).text(title, 350, 50, { align: 'right' });
    doc.font('Helvetica').fontSize(10).text(`Belegdatum: ${date.toLocaleDateString('de-DE')}`, 350, 75, { align: 'right' });
    if (dueDate) {
      doc.text(`Fälligkeitsdatum: ${dueDate.toLocaleDateString('de-DE')}`, 350, 87, { align: 'right' });
    }

    doc.moveTo(50, 140).lineTo(550, 140).strokeColor('#000000').stroke();
  }

  private drawFooter(doc: any, config: Record<string, string>) {
    const street = config['CLUB_ADDRESS_STREET'] || '';
    const city = config['CLUB_ADDRESS_CITY'] || '';
    const iban = config['CLUB_IBAN'] || '-';
    const bic = config['CLUB_BIC'] || '-';
    const vorstand = config['CLUB_VORSTAND_NAMES'] || '-';
    const disclaimer = config['CLUB_DISCLAIMER'] || '';
    const clubName = config['CLUB_NAME'] || 'FRAME';

    const footerY = 730;
    doc.moveTo(50, footerY - 10).lineTo(550, footerY - 10).strokeColor('#eeeeee').stroke();
    
    // Column 1: Address
    doc.font('Helvetica-Bold').fontSize(8).text('Anschrift:', 50, footerY);
    doc.font('Helvetica').text(clubName, 50, footerY + 10, { lineBreak: false });
    doc.text(street, 50, footerY + 20, { lineBreak: false });
    doc.text(city, 50, footerY + 30, { lineBreak: false });

    // Column 2: Bank
    doc.font('Helvetica-Bold').text('Bankdaten:', 180, footerY);
    doc.font('Helvetica').text(`IBAN: ${iban}`, 180, footerY + 10, { lineBreak: false });
    doc.text(`BIC: ${bic}`, 180, footerY + 20, { lineBreak: false });
    
    // Column 3: Vorstand
    doc.font('Helvetica-Bold').text('Vorstand:', 350, footerY);
    doc.font('Helvetica').text(vorstand, 350, footerY + 10, { width: 200, lineBreak: false });

    if (disclaimer) {
      doc.font('Helvetica-Oblique').fontSize(7).fillColor('#666666').text(disclaimer, 50, footerY + 45, { width: 500, align: 'center', lineBreak: false });
    }
    doc.fillColor('#000000');
  }
}
