import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FeedbackStatus, FeedbackCategory } from '@prisma/client';

@Injectable()
export class FeedbackService {
  constructor(private prisma: PrismaService) {}

  async create(memberId: string, data: { subject: string; message: string; category?: FeedbackCategory }) {
    if (!memberId) throw new Error('Member ID required for feedback');
    return this.prisma.feedback.create({
      data: {
        memberId,
        subject: data.subject,
        message: data.message,
        category: data.category || 'FEEDBACK',
      },
    });
  }

  async findAll() {
    return this.prisma.feedback.findMany({
      include: {
        member: {
          select: { firstName: true, lastName: true, memberNumber: true }
        },
        replies: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllByMemberId(memberId: string) {
    return this.prisma.feedback.findMany({
      where: { memberId },
      include: {
        replies: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addReply(feedbackId: string, authorId: string, message: string, isInternal: boolean = false) {
    const feedback = await this.prisma.feedback.findUnique({ where: { id: feedbackId } });
    if (!feedback) throw new NotFoundException('Feedback not found');

    return this.prisma.$transaction([
      this.prisma.feedbackReply.create({
        data: {
          feedbackId,
          authorId,
          message,
          isInternal
        }
      }),
      // Automatically mark as ANSWERED if it was OPEN and not an internal-only reply from member side?
      // For now, simple transition:
      this.prisma.feedback.update({
        where: { id: feedbackId },
        data: { status: isInternal ? feedback.status : 'ANSWERED' }
      })
    ]);
  }

  async updateStatus(id: string, status: FeedbackStatus) {
    return this.prisma.feedback.update({
      where: { id },
      data: { status },
      include: {
        member: { select: { firstName: true, lastName: true } },
        replies: true
      }
    });
  }
}
