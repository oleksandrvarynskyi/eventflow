import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';

import { AccessGuard, EventAccessGuard } from '../auth/access.guard.js';

import { db } from '../prisma/db.js';

@Controller('events/:eventId/reception/attendees')
export class ReceptionAttendeesController {
  @Get()
  @UseGuards(AccessGuard, EventAccessGuard)
  async findAll(@Param('eventId', ParseIntPipe) eventId: number) {
    const attendees = await db.orm.public.Attendee.all();

    return attendees
      .filter((item) => item.eventId === eventId)
      .map((item) => ({
        id: item.id,
        firstName: item.firstName,
        lastName: item.lastName,
        checkedInAt: item.checkedInAt,
      }));
  }
}
