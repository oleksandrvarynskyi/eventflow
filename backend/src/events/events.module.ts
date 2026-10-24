import { Module } from '@nestjs/common';

import { EventsController } from './events.controller.js';
import { PublicRegistrationController } from './public-registration.controller.js';
import { EmailModule } from '../email/email.module.js';

@Module({
  imports: [EmailModule],
  controllers: [EventsController, PublicRegistrationController],
})
export class EventsModule {}
