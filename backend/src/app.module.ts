import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { OrganizationsModule } from './organizations/organizations.module.js';
import { EventsModule } from './events/events.module.js';
import { AttendeesModule } from './attendees/attendees.module.js';
import { CheckInModule } from './check-in/check-in.module.js';
import { EmailModule } from './email/email.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ObserveModule.forRoot({
      appKey: 'YOUR_APP_KEY',
      appSecret: 'YOUR_APP_SECRET',
      serviceId: 'backend',
    }),
    OrganizationsModule,
    EventsModule,
    AttendeesModule,
    CheckInModule,
    EmailModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
