import { Controller, Get, Post, Patch, Body, Param, Request, UseGuards } from '@nestjs/common';
import { DataChangeService } from './data-change.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Controller('members')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DataChangeController {
  constructor(
    private readonly dataChangeService: DataChangeService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('me/change-requests')
  @Roles(Role.MEMBER, Role.MITARBEITER, Role.VORSTAND, Role.SCHATZMEISTER)
  async createRequest(@Request() req: any, @Body() body: { field: string; oldValue?: string; newValue: string; reason?: string }) {
    const member = await this.prisma.member.findUnique({ where: { userId: req.user.userId } });
    if (!member) throw new Error('Member not found');
    return this.dataChangeService.createRequest(member.id, body.field, body.oldValue || null, body.newValue, body.reason);
  }

  @Get('me/change-requests')
  @Roles(Role.MEMBER, Role.MITARBEITER, Role.VORSTAND, Role.SCHATZMEISTER)
  async getMyRequests(@Request() req: any) {
    const member = await this.prisma.member.findUnique({ where: { userId: req.user.userId } });
    if (!member) throw new Error('Member not found');
    return this.dataChangeService.getRequestsByMemberId(member.id);
  }

  @Get('change-requests')
  @Roles(Role.MITARBEITER, Role.VORSTAND)
  getAllPending() {
    return this.dataChangeService.getAllPending();
  }

  @Patch('change-requests/:id')
  @Roles(Role.MITARBEITER, Role.VORSTAND)
  reviewRequest(
    @Param('id') id: string,
    @Body() body: { status: 'APPROVED' | 'REJECTED'; reviewNote?: string },
    @Request() req: any
  ) {
    return this.dataChangeService.reviewRequest(id, body.status, req.user.username, body.reviewNote);
  }
}
