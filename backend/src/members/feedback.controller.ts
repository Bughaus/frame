import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role, FeedbackStatus, FeedbackCategory } from '@prisma/client';

@Controller('members/feedback')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  async create(@Request() req: any, @Body() data: { subject: string; message: string; category?: FeedbackCategory }) {
    if (!req.user.memberId) {
      throw new UnauthorizedException('User has no linked member account');
    }
    return this.feedbackService.create(req.user.memberId, data);
  }

  @Get()
  @Roles(Role.VORSTAND, Role.MITARBEITER)
  async findAll() {
    return this.feedbackService.findAll();
  }

  @Get('me')
  async findMyFeedback(@Request() req: any) {
    if (!req.user.memberId) {
      throw new UnauthorizedException('User has no linked member account');
    }
    return this.feedbackService.findAllByMemberId(req.user.memberId);
  }

  @Post(':id/reply')
  async addReply(
    @Param('id') id: string,
    @Request() req: any,
    @Body() data: { message: string; isInternal?: boolean }
  ) {
    // Determine if user is board or member
    const isBoard = req.user.roles.includes(Role.VORSTAND) || req.user.roles.includes(Role.MITARBEITER);
    
    // If internal note, only board can post/see it (enforcement during read is in service/DB)
    const isInternal = data.isInternal || false;
    if (isInternal && !isBoard) {
      throw new ForbiddenException('Only board members can post internal notes');
    }

    return this.feedbackService.addReply(id, req.user.username, data.message, isInternal);
  }

  @Patch(':id/status')
  @Roles(Role.VORSTAND, Role.MITARBEITER)
  async updateStatus(@Param('id') id: string, @Body('status') status: FeedbackStatus) {
    return this.feedbackService.updateStatus(id, status);
  }
}
