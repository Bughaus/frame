import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DataChangeService {
  constructor(private readonly prisma: PrismaService) {}

  async createRequest(memberId: string, field: string, oldValue: string | null, newValue: string, reason?: string) {
    return this.prisma.dataChangeRequest.create({
      data: { memberId, field, oldValue, newValue, reason }
    });
  }

  async getRequestsByMemberId(memberId: string) {
    return this.prisma.dataChangeRequest.findMany({
      where: { memberId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getAllPending() {
    return this.prisma.dataChangeRequest.findMany({
      where: { status: 'PENDING' },
      include: { member: { select: { firstName: true, lastName: true, memberNumber: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  async reviewRequest(id: string, status: 'APPROVED' | 'REJECTED', reviewedBy: string, reviewNote?: string) {
    const request = await this.prisma.dataChangeRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Antrag nicht gefunden.');

    // If approved, apply the change to the member record
    if (status === 'APPROVED') {
      const updateData: Record<string, any> = {};
      updateData[request.field] = request.newValue;
      await this.prisma.member.update({
        where: { id: request.memberId },
        data: updateData
      });
    }

    return this.prisma.dataChangeRequest.update({
      where: { id },
      data: {
        status,
        reviewedBy,
        reviewedAt: new Date(),
        reviewNote
      }
    });
  }
}
