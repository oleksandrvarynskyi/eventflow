import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
} from '@nestjs/common';

import { db } from '../prisma/db.js';

@Controller('events')
export class PublicEventController {
  @Get(':eventId/public')
  async getPublicEvent(@Param('eventId', ParseIntPipe) eventId: number) {
    const events = await db.orm.public.Event.all();

    const event = events.find((item) => item.id === eventId);

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return {
      id: event.id,
      name: event.name,
      description: event.description,
      location: event.location,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
    };
  }
}
