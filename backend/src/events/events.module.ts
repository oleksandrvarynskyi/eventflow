import { Module } from '@nestjs/common';

import { EmailModule } from '../email/email.module.js';

import { EventsController } from './events.controller.js';
import { PublicEventController } from './public-event.controller.js';
import { PublicRegistrationController } from './public-registration.controller.js';

@Module({
  imports: [EmailModule],
  controllers: [
    EventsController,
    PublicRegistrationController,
    PublicEventController,
  ],
})
export class EventsModule {}
