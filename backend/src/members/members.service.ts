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

    const tempPassword = await bcrypt.hash('start123', 12);
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
        }
      });

      if (roles && roles.length > 0) {
        // Protect: Prevent removing VORSTAND from yourself
        if (currentUserId && member.userId === currentUserId && !roles.includes('VORSTAND' as any)) {
          throw new ConflictException('Du kannst dir selbst nicht die Vorstand-Berechtigung entziehen.');
        }
        
        await tx.user.update({
          where: { id: member.userId },
          data: { roles }
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
    
    // Clear old tokens for this user
    await this.prisma.rfidToken.deleteMany({ where: { userId: member.userId } });
    
    return this.prisma.rfidToken.create({
      data: { userId: member.userId, tokenHash: hash }
    });
  }

  async resetPassword(memberId: string) {
    const member = await this.prisma.member.findUnique({ where: { id: memberId } });
    if (!member) throw new NotFoundException('Mitglied nicht gefunden.');
    
    const tempPassword = 'start123';
    const hash = await bcrypt.hash(tempPassword, 12);
    
    await this.prisma.user.update({ 
      where: { id: member.userId }, 
      data: { passwordHash: hash } 
    });
    
    return { message: `Passwort für ${member.firstName} ${member.lastName} wurde auf 'start123' zurückgesetzt.` };
  }
}
