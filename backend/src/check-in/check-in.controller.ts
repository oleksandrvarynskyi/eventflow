import { Body, Controller, Param, ParseIntPipe, Post } from '@nestjs/common';
import { db } from '../prisma/db.js';

@Controller('events/:eventId/check-in')
export class CheckInController {
  @Post()
  async checkIn(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Body() body: { registrationToken: string },
  ) {
    const attendees = await db.orm.public.Attendee.all();

    const attendee = attendees.find(
      (item) =>
        item.registrationToken === body.registrationToken &&
        item.eventId === eventId,
    );

    if (!attendee) {
      return {
        status: 'INVALID_TICKET',
        message: 'Ticket not found for this event',
      };
    }

    if (attendee.checkedInAt) {
      return {
        status: 'ALREADY_CHECKED_IN',
        message: 'This ticket has already been used',
        checkedInAt: attendee.checkedInAt,
      };
    }

    const checkedInAt = new Date().toISOString();

    const updatedAttendee = await db.orm.public.Attendee.where({
      id: attendee.id,
      eventId,
      checkedInAt: null,
    }).update({ checkedInAt });

    if (!updatedAttendee) {
      return {
        status: 'ALREADY_CHECKED_IN',
        message: 'This ticket has already been used',
      };
    }

    return {
      status: 'ACCESS_GRANTED',
      message: 'Check-in successful',
      attendeeId: attendee.id,
      attendeeName: `${attendee.firstName} ${attendee.lastName}`,
      checkedInAt: updatedAttendee.checkedInAt,
    };
  }
}
