import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Request, Res } from '@nestjs/common';
import type { Response } from 'express';
import { MembersService } from './members.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('members')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  @Roles(Role.VORSTAND, Role.MITARBEITER)
  create(@Body() createMemberDto: CreateMemberDto) {
    return this.membersService.create(createMemberDto);
  }

  @Get()
  async findAll(@Request() req: any) {
    const members = await this.membersService.findAll();
    const roles = req.user?.roles || [];
    
    // Privacy Redaction: Only VORSTAND and SCHATZMEISTER see full details
    if (!roles.includes(Role.VORSTAND) && !roles.includes(Role.SCHATZMEISTER)) {
      return members.map(m => this.redactMember(m));
    }
    return members;
  }

  @Get('export')
  @Roles(Role.VORSTAND, Role.SCHATZMEISTER) // MITARBEITER cannot export sensitive data
  async exportCsv(@Res() res: Response) {
    const members = await this.membersService.findAll();
    const BOM = '\uFEFF';
    const header = 'Mitglieds-Nr.;Vorname;Nachname;E-Mail;Telefon;Mobil;Straße;PLZ;Ort;Land;Status;Beitragsklasse;Geburtsdatum;Mitglied seit;Notizen';
    const rows = members.map((m: any) =>
      [
        m.memberNumber, 
        m.firstName, 
        m.lastName, 
        m.email, 
        m.phone || '', 
        m.mobile || '', 
        m.street || '', 
        m.postalCode || '', 
        m.city || '', 
        m.country || 'DE',
        m.status, 
        m.contributionTier || '',
        m.birthDate ? new Date(m.birthDate).toLocaleDateString('de-DE') : '', 
        m.memberSince ? new Date(m.memberSince).toLocaleDateString('de-DE') : '',
        (m.notes || '').replace(/[\n\r;]/g, ' ') // Escape semicolon and newlines
      ].join(';')
    );
    const csv = BOM + header + '\n' + rows.join('\n');
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="Mitglieder-Export-${Date.now()}.csv"`,
    });
    res.send(csv);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    const member = await this.membersService.findOne(id);
    const roles = req.user?.roles || [];
    
    if (!roles.includes(Role.VORSTAND) && !roles.includes(Role.SCHATZMEISTER)) {
      return this.redactMember(member);
    }
    return member;
  }

  @Put(':id')
  @Roles(Role.VORSTAND) // Only VORSTAND can edit existing members
  update(@Param('id') id: string, @Body() updateMemberDto: UpdateMemberDto, @Request() req: any) {
    return this.membersService.update(id, updateMemberDto, req.user.userId);
  }

  @Delete(':id')
  @Roles(Role.VORSTAND) // Only VORSTAND can remove members
  remove(@Param('id') id: string) {
    return this.membersService.remove(id);
  }

  @Post(':id/rfid')
  @Roles(Role.VORSTAND, Role.MITARBEITER)
  registerRfid(@Param('id') id: string, @Body() body: { token: string }) {
    return this.membersService.registerRfid(id, body.token);
  }

  @Post(':id/reset-password')
  @Roles(Role.VORSTAND, Role.MITARBEITER)
  resetPassword(@Param('id') id: string) {
    return this.membersService.resetPassword(id);
  }

  private redactMember(member: any) {
    if (!member) return null;
    return {
      ...member,
      email: member.email ? '***@***.***' : null,
      phone: member.phone ? '***' : null,
      mobile: member.mobile ? '***' : null,
      street: '***',
      postalCode: '***',
      city: '***',
      birthDate: null,
      notes: null,
      account: member.account ? { ...member.account, iban: '***', bic: '***' } : undefined
    };
  }
}
