import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secretKey',
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({ 
      where: { id: payload.sub },
      include: { member: { select: { id: true } } }
    });
    if (!user || user.isActive === false) {
      throw new UnauthorizedException();
    }
    return { 
      userId: payload.sub, 
      username: payload.username, 
      roles: payload.roles,
      memberId: user.member?.id 
    };
  }
}
