import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { HoursService } from './hours.service';
import { CreateQuotaDto } from './dto/create-quota.dto';
import { CreateEventDto } from './dto/create-event.dto';
import { CreateEntryDto } from './dto/create-entry.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role, HoursStatus } from '@prisma/client';

@Controller('hours')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HoursController {
  constructor(private readonly hoursService: HoursService) {}

  // -- QUOTA --
  @Get('quota/:year')
  getQuota(@Param('year') year: string) {
    return this.hoursService.getQuota(parseInt(year));
  }

  @Post('quota')
  @Roles(Role.VORSTAND)
  upsertQuota(@Body() dto: CreateQuotaDto) {
    return this.hoursService.upsertQuota(dto);
  }

  // -- EVENTS --
  @Get('events')
  getEvents() {
    return this.hoursService.getEvents();
  }

  @Post('events')
  @Roles(Role.VORSTAND)
  createEvent(@Body() dto: CreateEventDto, @Request() req: any) {
    return this.hoursService.createEvent(dto, req.user.userId);
  }

  @Delete('events/:id')
  @Roles(Role.VORSTAND)
  deleteEvent(@Param('id') id: string) {
    return this.hoursService.deleteEvent(id);
  }

  // -- ENTRIES --
  @Get('entries/my')
  getMyEntries(@Request() req: any, @Query('year') year: string) {
    const y = year ? parseInt(year) : new Date().getFullYear();
    return this.hoursService.getMemberEntries(req.user.userId, y);
  }

  @Post('signup/:eventId')
  signupToEvent(@Param('eventId') eventId: string, @Request() req: any) {
    return this.hoursService.signupToEvent(req.user.userId, eventId);
  }

  @Post('entries/manual')
  createManualEntry(@Body() dto: CreateEntryDto, @Request() req: any) {
    return this.hoursService.createManualEntry(req.user.userId, dto);
  }

  @Get('entries/pending')
  @Roles(Role.VORSTAND)
  getPendingEntries() {
    return this.hoursService.getPendingEntries();
  }

  @Put('entries/:id/status')
  @Roles(Role.VORSTAND)
  updateStatus(@Param('id') id: string, @Body() body: { status: HoursStatus }, @Request() req: any) {
    return this.hoursService.updateEntryStatus(id, body.status, req.user.userId);
  }

  @Delete('entries/:id')
  deleteEntry(@Param('id') id: string, @Request() req: any) {
    // Only allow deletion if own entry or admin
    return this.hoursService.deleteEntry(id, req.user.userId);
  }

  @Get('summary/:year')
  @Roles(Role.VORSTAND)
  getSummary(@Param('year') year: string) {
    return this.hoursService.getAllMembersProgress(parseInt(year));
  }
}
