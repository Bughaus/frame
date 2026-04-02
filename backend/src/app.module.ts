import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
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
import { SystemConfigModule } from './system-config/system-config.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    AuthModule, 
    UsersModule, 
    PrismaModule, 
    MembersModule, 
    ArticlesModule, 
    CashRegisterModule, 
    HoursModule, 
    DevicesModule, 
    SystemConfigModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
