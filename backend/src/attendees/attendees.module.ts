import { Module } from '@nestjs/common';

import { AttendeesController } from './attendees.controller.js';
import { EmailModule } from '../email/email.module.js';

@Module({
  imports: [EmailModule],
  controllers: [AttendeesController],
})
export class AttendeesModule {}
