import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { MembersModule } from './members/members.module';
import { ArticlesModule } from './articles/articles.module';
import { CashRegisterModule } from './cash-register/cash-register.module';
import { HoursModule } from './hours/hours.module';
import { DevicesModule } from './devices/devices.module';

@Module({
  imports: [AuthModule, UsersModule, PrismaModule, MembersModule, ArticlesModule, CashRegisterModule, HoursModule, DevicesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
