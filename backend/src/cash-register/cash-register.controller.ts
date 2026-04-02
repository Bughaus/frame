import { Controller, Get, Post, Patch, Body, Param, Request, UseGuards, Res, Query, UseInterceptors, UploadedFile, Delete } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Response } from 'express';
import { CashRegisterService } from './cash-register.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CreateGuestTransactionDto } from './dto/create-guest-transaction.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { SecureDeviceGuard } from '../common/guards/secure-device.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('cash-register')
@UseGuards(JwtAuthGuard, RolesGuard, SecureDeviceGuard)
export class CashRegisterController {
  constructor(private readonly cashRegisterService: CashRegisterService) { }

  @Get('accounts')
  @Roles(Role.VORSTAND)
  findAllAccounts() {
    return this.cashRegisterService.getAccounts();
  }

  @Get('accounts/me')
  @Roles(Role.MEMBER, (Role as any).MITARBEITER, Role.VORSTAND)
  findMyAccount(@Request() req: any) {
    return this.cashRegisterService.getAccountByUserId(req.user.userId);
  }

  @Get('accounts/:id')
  @Roles(Role.VORSTAND)
  findOneAccount(@Param('id') id: string) {
    return this.cashRegisterService.getAccount(id);
  }

  @Post('transactions')
  @Roles(Role.MEMBER, Role.VORSTAND, Role.MITARBEITER)
  createTransaction(@Body() createTransactionDto: CreateTransactionDto, @Request() req: any) {
    return this.cashRegisterService.createTransaction(createTransactionDto, req.user.username);
  }

  @Delete('transactions/:id')
  @Roles(Role.MEMBER, Role.VORSTAND, Role.MITARBEITER)
  deleteTransaction(@Param('id') id: string, @Request() req: any) {
    return this.cashRegisterService.deleteTransaction(id, req.user.username);
  }

  @Post('invoices')
  @Roles(Role.VORSTAND)
  createInvoices(@Body() body: { accountIds: string[], dueDate: string }, @Request() req: any) {
    return this.cashRegisterService.generateInvoices(body.accountIds, new Date(body.dueDate), req.user.username);
  }

  @Get('invoices/me')
  @Roles(Role.MEMBER, (Role as any).MITARBEITER, Role.VORSTAND)
  getMyInvoices(@Request() req: any) {
    return this.cashRegisterService.getInvoicesByUserId(req.user.userId);
  }

  @Get('invoices')
  @Roles(Role.VORSTAND)
  getInvoices() {
    return this.cashRegisterService.getInvoices();
  }

  @Patch('invoices/:id/status')
  @Roles(Role.VORSTAND)
  updateInvoiceStatus(@Param('id') id: string, @Body() body: { status: 'PAID' | 'CANCELLED' }) {
    return this.cashRegisterService.updateInvoiceStatus(id, body.status);
  }

  @Get('invoices/:id/pdf')
  @Roles(Role.MEMBER, (Role as any).MITARBEITER, Role.VORSTAND)
  async getInvoicePdf(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.cashRegisterService.generateInvoicePdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Rechnung-${id}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('sepa-export')
  @Roles(Role.VORSTAND)
  async getSepaExport(@Query('invoiceIds') invoiceIds: string, @Res() res: Response) {
    const ids = invoiceIds.split(',');
    const xml = await this.cashRegisterService.generateSepaXml(ids);
    res.set({
      'Content-Type': 'application/xml',
      'Content-Disposition': `attachment; filename="SEPA-${Date.now()}.xml"`,
    });
    res.send(xml);
  }

  @Get('guest-slots')
  @Roles(Role.MITARBEITER, Role.VORSTAND)
  getGuestSlots() {
    return this.cashRegisterService.getGuestSlots();
  }

  @Patch('guest-slots/:id')
  @Roles((Role as any).MITARBEITER, Role.VORSTAND)
  updateGuestSlot(@Param('id') id: string, @Body() body: { displayName: string }) {
    return this.cashRegisterService.updateGuestSlot(id, body);
  }

  @Get('global-transactions')
  @Roles(Role.VORSTAND)
  getGlobalTransactions() {
    return this.cashRegisterService.getGlobalTransactions();
  }

  @Post('guest-transactions')
  createGuestTransaction(@Body() createGuestTransactionDto: CreateGuestTransactionDto, @Request() req: any) {
    return this.cashRegisterService.createGuestTransaction(createGuestTransactionDto, req.user.username);
  }

  @Post('guest-slots/:id/clear')
  @Roles((Role as any).MITARBEITER, Role.VORSTAND)
  clearGuestSlot(@Param('id') id: string, @Body() body: { paymentMethod: 'CASH' | 'PAYPAL', paypalReference?: string, tipAmount?: number }, @Request() req: any) {
    return this.cashRegisterService.clearGuestSlot(id, body.paymentMethod, body.paypalReference, req.user.username, body.tipAmount);
  }

  @Get('guest-transactions/:id/receipt')
  @Roles((Role as any).MITARBEITER, Role.VORSTAND)
  async getGuestReceiptPdf(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.cashRegisterService.generateGuestReceiptPdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Quittung-${id}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('eigenbelege')
  @Roles(Role.VORSTAND)
  getEigenbelege() {
    return this.cashRegisterService.getEigenbelege();
  }

  @Post('eigenbelege')
  @Roles(Role.VORSTAND)
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/receipts',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
      }
    })
  }))
  createEigenbeleg(
    @Body() body: { type: 'INCOME' | 'EXPENSE', amount: string, description: string, date: string, category: string },
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any
  ) {
    return this.cashRegisterService.createEigenbeleg(body.type, Number(body.amount), body.description, body.date, body.category, file, req.user.username);
  }
}
