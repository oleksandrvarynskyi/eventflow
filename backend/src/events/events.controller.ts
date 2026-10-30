import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';

import {
  AccessGuard,
  AdminRoleGuard,
  type AuthenticatedRequest,
} from '../auth/access.guard.js';

import { db } from '../prisma/db.js';

@Controller('events')
export class EventsController {
  @Get()
  @UseGuards(AccessGuard)
  async findAll(@Req() request: AuthenticatedRequest) {
    const user = request.user!;
    const events = await db.orm.public.Event.all();

    if (user.role === 'ADMIN') {
      return events;
    }

    const assignments = await db.orm.public.UserEvent.all();

    const allowedEventIds = new Set(
      assignments
        .filter((item) => item.userId === user.id)
        .map((item) => item.eventId),
    );

    return events.filter((event) => allowedEventIds.has(event.id));
  }

  @Post()
  @UseGuards(AccessGuard, AdminRoleGuard)
  async create(
    @Body()
    body: {
      name: string;
      description?: string;
      location?: string;
      startsAt: string;
      endsAt?: string;
      organizationId: number;
    },
  ) {
    return db.orm.public.Event.create({
      name: body.name,
      description: body.description,
      location: body.location,
      startsAt: body.startsAt,
      endsAt: body.endsAt,
      organizationId: body.organizationId,
    });
  }
}
