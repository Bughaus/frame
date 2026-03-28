import { Controller, Patch, Post, Body, Request, UseGuards, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('me/password')
  async changePassword(@Request() req: any, @Body() body: any) {
    const { oldPassword, newPassword } = body;
    if (!oldPassword || !newPassword) throw new BadRequestException('Missing passwords');
    
    return this.usersService.updatePassword(req.user.userId, oldPassword, newPassword);
  }
}
