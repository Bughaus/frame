import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  async create(createMemberDto: CreateMemberDto) {
    const email = createMemberDto.email && createMemberDto.email.trim() !== "" ? createMemberDto.email : null;
    if (email) {
      const existing = await this.prisma.member.findUnique({ where: { email }});
      if (existing) throw new ConflictException('Email already in use');
    }

    const defaultPassword = process.env.DEFAULT_MEMBER_PASSWORD || crypto.randomBytes(8).toString('hex');
    const tempPassword = await bcrypt.hash(defaultPassword, 12);
    const username = `${createMemberDto.firstName} ${createMemberDto.lastName}`;

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username,
          passwordHash: tempPassword,
        }
      });

      const { email: _unused, ...memberData } = createMemberDto;
      const member = await tx.member.create({
        data: {
          ...memberData,
          email: email as any,
          birthDate: createMemberDto.birthDate ? new Date(createMemberDto.birthDate) : null,
          userId: user.id
        }
      });

      await tx.memberAccount.create({ data: { memberId: member.id } });

      return member;
    });
  }

  async findAll() {
    return this.prisma.member.findMany({
      include: { user: { select: { id: true, username: true, roles: true, isActive: true } } }
    });
  }

  async findOne(id: string) {
    const member = await this.prisma.member.findUnique({
      where: { id },
      include: { user: { select: { id: true, username: true, roles: true, isActive: true } }, account: true, hoursEntries: true }
    });
    if (!member) throw new NotFoundException('Member not found');
    return member;
  }

  async update(id: string, updateMemberDto: UpdateMemberDto, currentUserId?: string) {
    const { roles, id: _id, userId, user, account, hoursEntries, feedbacks, dataChangeRequests, createdAt, updatedAt, memberSince, memberUntil, ...memberData } = updateMemberDto as any;
    
    const emailNormalized = memberData.email && memberData.email.trim() !== "" ? memberData.email : null;
    const { email: _unused2, ...restMemberData } = memberData;

    return this.prisma.$transaction(async (tx) => {
      const member = await tx.member.update({
        where: { id },
        data: {
          ...restMemberData,
          email: emailNormalized,
          birthDate: memberData.birthDate ? new Date(memberData.birthDate) : undefined,
        },
        include: { user: true }
      });

      const userUpdate: any = {};
      if (roles && roles.length > 0) {
        // Protect: Prevent removing VORSTAND from yourself
        if (currentUserId && member.userId === currentUserId && !roles.includes('VORSTAND' as any)) {
          throw new ConflictException('Du kannst dir selbst nicht die Vorstand-Berechtigung entziehen.');
        }
        userUpdate.roles = roles;
      }

      if (memberData.username && memberData.username !== member.user.username) {
        const existing = await tx.user.findUnique({ where: { username: memberData.username } });
        if (existing) throw new ConflictException('Dieser Benutzername ist bereits vergeben.');
        userUpdate.username = memberData.username;
      }

      if (Object.keys(userUpdate).length > 0) {
        await tx.user.update({
          where: { id: member.userId },
          data: userUpdate
        });
      }

      return member;
    });
  }

  async remove(id: string) {
    const member = await this.findOne(id);
    return this.prisma.$transaction([
      this.prisma.member.update({ where: { id }, data: { status: 'INACTIVE' } }),
      this.prisma.user.update({ where: { id: member.userId }, data: { isActive: false } })
    ]);
  }

  async registerRfid(memberId: string, token: string) {
    const member = await this.prisma.member.findUnique({ where: { id: memberId } });
    if (!member) throw new NotFoundException('Mitglied nicht gefunden.');

    const hash = crypto.createHash('sha256').update(token).digest('hex');
    
    return this.prisma.$transaction(async (tx) => {
      // Clear old tokens for this user
      await tx.rfidToken.deleteMany({ where: { userId: member.userId } });
      
      try {
        return await tx.rfidToken.create({
          data: { userId: member.userId, tokenHash: hash }
        });
      } catch (e: any) {
        // Prisma error code for unique constraint violation
        if (e.code === 'P2002') {
          throw new ConflictException('Dieser RFID Token ist bereits einem anderen Mitglied zugeordnet.');
        }
        throw e;
      }
    });
  }

  async resetPassword(memberId: string) {
    const member = await this.prisma.member.findUnique({ where: { id: memberId } });
    if (!member) throw new NotFoundException('Mitglied nicht gefunden.');
    
    const defaultPassword = process.env.DEFAULT_MEMBER_PASSWORD || crypto.randomBytes(8).toString('hex');
    const hash = await bcrypt.hash(defaultPassword, 12);
    
    await this.prisma.user.update({ 
      where: { id: member.userId }, 
      data: { passwordHash: hash } 
    });
    
    return { message: `Passwort für ${member.firstName} ${member.lastName} wurde auf das Standard-Passwort (${defaultPassword}) zurückgesetzt.` };
  }
  async identifyByRfid(token: string) {
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const rfidToken = await this.prisma.rfidToken.findUnique({
      where: { tokenHash: hash },
      include: { 
        user: { 
          include: { 
            member: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                memberNumber: true
              }
            } 
          } 
        } 
      }
    });

    if (!rfidToken || !rfidToken.user?.member) {
      throw new NotFoundException('Dieser RFID Token ist keinem Mitglied zugeordnet.');
    }
    
    return rfidToken.user.member;
  }

  async getInboxStatus() {
    const [pendingChanges, openFeedback] = await Promise.all([
      this.prisma.dataChangeRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.feedback.count({ where: { status: 'OPEN' } })
    ]);

    return {
      pendingChanges,
      openFeedback,
      total: pendingChanges + openFeedback
    };
  }

  async getMyInboxStatus(userId: string) {
    const member = await this.prisma.member.findUnique({ where: { userId } });
    if (!member) return { openFeedback: 0, total: 0 };

    const openFeedback = await this.prisma.feedback.count({ 
      where: { 
        memberId: member.id,
        status: 'ANSWERED'
      } 
    });

    return {
      openFeedback,
      total: openFeedback
    };
  }

  async createChangeRequest(userId: string, data: { field: string, oldValue: string, newValue: string, reason?: string }) {
    const member = await this.prisma.member.findUnique({ where: { userId } });
    if (!member) throw new NotFoundException('Mitglied nicht gefunden.');

    return this.prisma.dataChangeRequest.create({
      data: {
        memberId: member.id,
        ...data,
        status: 'PENDING'
      }
    });
  }

  async findMyChangeRequests(userId: string) {
    const member = await this.prisma.member.findUnique({ where: { userId } });
    if (!member) return [];
    return this.prisma.dataChangeRequest.findMany({
      where: { memberId: member.id },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findAllChangeRequests() {
    return this.prisma.dataChangeRequest.findMany({
      include: { member: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateChangeRequestStatus(id: string, status: 'APPROVED' | 'REJECTED') {
    const request = await this.prisma.dataChangeRequest.findUnique({
      where: { id },
      include: { member: true }
    });
    if (!request) throw new NotFoundException('Antrag nicht gefunden.');

    return this.prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.dataChangeRequest.update({
        where: { id },
        data: { status }
      });

      if (status === 'APPROVED') {
        await tx.member.update({
          where: { id: request.memberId },
          data: { [request.field]: request.newValue }
        });
      }

      return updatedRequest;
    });
  }

  async findAllFeedback() {
    return this.prisma.feedback.findMany({
      include: {
        member: true,
        replies: { orderBy: { createdAt: 'asc' } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async addFeedbackReply(feedbackId: string, authorId: string, data: { message: string, isInternal: boolean }) {
    const feedback = await this.prisma.feedback.findUnique({ where: { id: feedbackId } });
    if (!feedback) throw new NotFoundException('Feedback nicht gefunden.');

    return this.prisma.$transaction(async (tx) => {
      const reply = await tx.feedbackReply.create({
        data: {
          feedbackId,
          authorId,
          message: data.message,
          isInternal: data.isInternal
        }
      });

      // Update feedback status to ANSWERED if it's not internal and wasn't already closed
      if (!data.isInternal && feedback.status !== 'CLOSED' as any) {
        await tx.feedback.update({
          where: { id: feedbackId },
          data: { status: 'ANSWERED' as any }
        });
      }

      return reply;
    });
  }

  async updateFeedbackStatus(id: string, status: 'OPEN' | 'ANSWERED' | 'CLOSED') {
    const feedback = await this.prisma.feedback.findUnique({ where: { id } });
    if (!feedback) throw new NotFoundException('Feedback nicht gefunden.');

    return this.prisma.feedback.update({
      where: { id },
      data: { status }
    });
  }
}
