import { Module } from '@nestjs/common';

import { AttendeesController } from './attendees.controller.js';
import { EmailModule } from '../email/email.module.js';
import { ReceptionAttendeesController } from './reception-attendees.controller.js';

@Module({
  imports: [EmailModule],
  controllers: [AttendeesController, ReceptionAttendeesController],
})
export class AttendeesModule {}
