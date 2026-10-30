import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import {
  AccessGuard,
  EventAccessGuard,
  AttendeeManagementGuard,
  AdminRoleGuard,
} from './access.guard.js';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    AccessGuard,
    EventAccessGuard,
    AttendeeManagementGuard,
    AdminRoleGuard,
  ],
  exports: [
    AuthService,
    AccessGuard,
    EventAccessGuard,
    AttendeeManagementGuard,
    AdminRoleGuard,
  ],
})
export class AuthModule {}
