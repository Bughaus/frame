import { Module } from '@nestjs/common';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { DataChangeController } from './data-change.controller';
import { DataChangeService } from './data-change.service';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';

@Module({
  controllers: [MembersController, DataChangeController, FeedbackController],
  providers: [MembersService, DataChangeService, FeedbackService]
})
export class MembersModule {}
