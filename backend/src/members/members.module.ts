import { Module } from '@nestjs/common';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { DataChangeController } from './data-change.controller';
import { DataChangeService } from './data-change.service';

@Module({
  controllers: [MembersController, DataChangeController],
  providers: [MembersService, DataChangeService]
})
export class MembersModule {}
