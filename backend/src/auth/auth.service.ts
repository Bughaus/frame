import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByUsername(loginDto.username);
    if (!user || user.isActive === false) {
      throw new UnauthorizedException('Invalid credentials or account inactive');
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isMatch) {
      // Simulate lockout behavior in real app
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, username: user.username, roles: user.roles };
    const accessToken = this.jwtService.sign(payload);
    
    // Create random refresh token
    const refreshString = await bcrypt.hash(user.id + Date.now().toString(), 10);
    const refreshToken = await this.prisma.refreshToken.create({
      data: {
        token: refreshString,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      }
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    return {
      accessToken,
      refreshToken: refreshToken.token,
      expiresIn: 900,
      user: {
        id: user.id,
        username: user.username,
        roles: user.roles,
        language: user.language,
        lastLoginAt: user.lastLoginAt // Return the PREVIOUS last login
      }
    };
  }

  async loginRfid(token: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const rfidEntry = await this.prisma.rfidToken.findUnique({
      where: { tokenHash },
      include: { user: true }
    });

    if (!rfidEntry || !rfidEntry.isActive || !rfidEntry.user.isActive) {
      throw new UnauthorizedException('Invalid RFID token');
    }

    await this.prisma.rfidToken.update({ 
      where: { id: rfidEntry.id }, 
      data: { lastUsedAt: new Date() } 
    });

    const user = rfidEntry.user;
    const payload = { sub: user.id, username: user.username, roles: user.roles };
    const accessToken = this.jwtService.sign(payload);
    
    const refreshString = await bcrypt.hash(user.id + Date.now().toString(), 10);
    const refreshToken = await this.prisma.refreshToken.create({
      data: {
        token: refreshString,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    return {
      accessToken,
      refreshToken: refreshToken.token,
      expiresIn: 900,
      user: {
        id: user.id,
        username: user.username,
        roles: user.roles,
        language: user.language,
        lastLoginAt: user.lastLoginAt
      }
    };
  }
}
