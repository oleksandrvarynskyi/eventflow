import { Controller, Get, NotFoundException, Param } from '@nestjs/common';

import { db } from '../prisma/db.js';

@Controller('events')
export class PublicEventController {
  @Get(':publicSlug/public')
  async getPublicEvent(@Param('publicSlug') publicSlug: string) {
    const events = await db.orm.public.Event.all();

    const event = events.find((item) => item.publicSlug === publicSlug);

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
