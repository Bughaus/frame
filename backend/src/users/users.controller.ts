import { Controller, Patch, Post, Body, Request, UseGuards, BadRequestException, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('me/password')
  async changePassword(@Request() req: any, @Body() body: any) {
    const { oldPassword, newPassword } = body;
    if (!oldPassword || !newPassword) throw new BadRequestException('Missing passwords');
    
    return this.usersService.updatePassword(req.user.userId, oldPassword, newPassword);
  }

  @Patch(':id/username')
  @Roles(Role.VORSTAND, Role.MITARBEITER)
  async updateUsername(@Param('id') id: string, @Body('username') username: string) {
    if (!username) throw new BadRequestException('Username is required');
    return this.usersService.updateUsername(id, username);
  }
}
