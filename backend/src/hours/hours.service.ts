import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HoursStatus } from '@prisma/client';
import { CreateQuotaDto } from './dto/create-quota.dto';
import { CreateEventDto } from './dto/create-event.dto';
import { CreateEntryDto } from './dto/create-entry.dto';

@Injectable()
export class HoursService {
  constructor(private prisma: PrismaService) {}

  // -- QUOTA --
  async getQuota(year: number) {
    return this.prisma.hoursQuota.findUnique({ where: { year } });
  }

  async upsertQuota(dto: CreateQuotaDto) {
    return this.prisma.hoursQuota.upsert({
      where: { year: dto.year },
      update: { requiredHours: dto.requiredHours, description: dto.description },
      create: { year: dto.year, requiredHours: dto.requiredHours, description: dto.description }
    });
  }

  // -- EVENTS --
  async getEvents() {
    return this.prisma.hoursEvent.findMany({
      include: { _count: { select: { entries: true } } },
      orderBy: { date: 'desc' }
    });
  }

  async createEvent(dto: CreateEventDto, userId: string) {
    return this.prisma.hoursEvent.create({
      data: {
        title: dto.title,
        description: dto.description,
        date: new Date(dto.date),
        maxSlots: dto.maxSlots,
        hoursValue: dto.hoursValue,
        location: dto.location,
        createdBy: userId
      }
    });
  }

  async deleteEvent(id: string) {
    return this.prisma.hoursEvent.delete({ where: { id } });
  }

  // -- ENTRIES --
  async getMemberEntries(userId: string, year: number) {
    const member = await this.prisma.member.findUnique({ where: { userId } });
    if (!member) throw new NotFoundException('Mitglied nicht gefunden.');

    const entries = await this.prisma.hoursEntry.findMany({
      where: { memberId: member.id, year },
      include: { event: true },
      orderBy: { date: 'desc' }
    });

    const confirmedSum = await this.prisma.hoursEntry.aggregate({
      where: { memberId: member.id, year, status: HoursStatus.CONFIRMED },
      _sum: { hours: true }
    });

    const totalSum = await this.prisma.hoursEntry.aggregate({
      where: { memberId: member.id, year, status: { notIn: [(HoursStatus as any).REJECTED] } },
      _sum: { hours: true }
    });

    return {
      entries,
      stats: {
        confirmedHours: Number(confirmedSum._sum.hours || 0),
        totalHours: Number(totalSum._sum.hours || 0)
      }
    };
  }

  async signupToEvent(userId: string, eventId: string) {
    const member = await this.prisma.member.findUnique({ where: { userId } });
    if (!member) throw new NotFoundException('Mitglied nicht gefunden.');

    const event = await this.prisma.hoursEvent.findUnique({
      where: { id: eventId },
      include: { entries: true }
    });
    if (!event) throw new NotFoundException('Event nicht gefunden.');

    if (event.maxSlots && event.entries.length >= event.maxSlots) {
      throw new BadRequestException('Keine freien Plätze mehr verfügbar.');
    }

    const existing = await this.prisma.hoursEntry.findFirst({
      where: { memberId: member.id, eventId }
    });
    if (existing) throw new BadRequestException('Bereits für diesen Einsatz angemeldet.');

    return this.prisma.hoursEntry.create({
      data: {
        memberId: member.id,
        eventId: event.id,
        date: event.date,
        hours: event.hoursValue,
        description: `Teilnahme: ${event.title}`,
        status: HoursStatus.PLANNED,
        year: event.date.getFullYear()
      }
    });
  }

  async createManualEntry(userId: string, dto: CreateEntryDto) {
    const member = await this.prisma.member.findUnique({ where: { userId } });
    if (!member) throw new NotFoundException('Mitglied nicht gefunden.');

    return this.prisma.hoursEntry.create({
      data: {
        memberId: member.id,
        date: new Date(dto.date),
        hours: dto.hours,
        description: dto.description,
        status: (HoursStatus as any).COMPLETED, // Manual entries are directly completed
        year: dto.year
      }
    });
  }

  async deleteEntry(entryId: string, userId: string) {
      const entry = await this.prisma.hoursEntry.findUnique({ where: { id: entryId }, include: { member: true } });
      if (!entry) throw new NotFoundException();
      
      // Safety: only allow deletion if not confirmed or if admin
      // For now simple delete.
      return this.prisma.hoursEntry.delete({ where: { id: entryId } });
  }

  async updateEntryStatus(entryId: string, status: HoursStatus, reviewerId: string) {
    return this.prisma.hoursEntry.update({
      where: { id: entryId },
      data: {
        status,
        confirmedBy: reviewerId,
        confirmedAt: new Date()
      }
    });
  }
  
  async getPendingEntries() {
      return this.prisma.hoursEntry.findMany({
          where: { status: (HoursStatus as any).COMPLETED },
          include: { member: true, event: true },
          orderBy: { createdAt: 'asc' }
      });
  }

  async getAllMembersProgress(year: number) {
    const members = await this.prisma.member.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        memberNumber: true,
        hoursEntries: {
          where: { year },
          select: { hours: true, status: true }
        }
      }
    });

    const quota = await this.getQuota(year);
    const requiredHours = quota?.requiredHours || 0;

    return members.map(m => {
      const confirmed = m.hoursEntries
        .filter(e => e.status === HoursStatus.CONFIRMED)
        .reduce((sum, e) => sum + Number(e.hours), 0);
      
      const total = m.hoursEntries
        .filter(e => e.status !== (HoursStatus as any).REJECTED)
        .reduce((sum, e) => sum + Number(e.hours), 0);

      return {
        id: m.id,
        firstName: m.firstName,
        lastName: m.lastName,
        memberNumber: m.memberNumber,
        confirmedHours: confirmed,
        totalHours: total,
        requiredHours,
        isFulfilled: Number(confirmed) >= Number(requiredHours)
      };
    });
  }
}
