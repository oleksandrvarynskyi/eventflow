import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

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
      const users = await db.orm.public.User.all();

      const adminUser = users.find((item) => item.id === user.id);

      if (!adminUser || !adminUser.isActive || adminUser.role !== 'ADMIN') {
        throw new BadRequestException('Invalid administrator');
      }

      return events.filter(
        (event) => event.organizationId === adminUser.organizationId,
      );
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
    @Req() request: AuthenticatedRequest,
    @Body()
    body: {
      name: string;
      description?: string;
      location?: string;
      startsAt: string;
      endsAt?: string;
    },
  ) {
    const admin = request.user!;

    const users = await db.orm.public.User.all();

    const adminUser = users.find((user) => user.id === admin.id);

    if (!adminUser || !adminUser.isActive || adminUser.role !== 'ADMIN') {
      throw new BadRequestException('Invalid administrator');
    }

    const name = typeof body?.name === 'string' ? body.name.trim() : '';

    if (name.length < 3 || name.length > 150) {
      throw new BadRequestException('Event name must contain 3-150 characters');
    }

    const description =
      typeof body.description === 'string'
        ? body.description.trim() || null
        : null;

    const location =
      typeof body.location === 'string' ? body.location.trim() || null : null;

    if (
      typeof body.startsAt !== 'string' ||
      !body.startsAt.trim() ||
      !Number.isFinite(Date.parse(body.startsAt))
    ) {
      throw new BadRequestException('Invalid start date');
    }

    const startsAt = new Date(body.startsAt);

    let endsAt: Date | null = null;

    if (body.endsAt !== undefined && body.endsAt !== '') {
      if (
        typeof body.endsAt !== 'string' ||
        !Number.isFinite(Date.parse(body.endsAt))
      ) {
        throw new BadRequestException('Invalid end date');
      }

      endsAt = new Date(body.endsAt);

      if (endsAt <= startsAt) {
        throw new BadRequestException('End date must be later than start date');
      }
    }

    return db.orm.public.Event.create({
      name,
      description,
      location,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt?.toISOString() ?? null,
      organizationId: adminUser.organizationId,
    });
  }
}
