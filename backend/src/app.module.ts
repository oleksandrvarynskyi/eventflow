import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { OrganizationsModule } from './organizations/organizations.module.js';
import { EventsModule } from './events/events.module.js';
import { AttendeesModule } from './attendees/attendees.module.js';
import { CheckInModule } from './check-in/check-in.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    ObserveModule.forRoot({
      appKey: 'YOUR_APP_KEY',
      appSecret: 'YOUR_APP_SECRET',
      serviceId: 'backend',
    }),
    OrganizationsModule,
    EventsModule,
    AttendeesModule,
    CheckInModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
