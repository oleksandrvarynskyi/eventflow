import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
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

  @Patch(':eventId')
  @UseGuards(AccessGuard, AdminRoleGuard)
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('eventId') eventIdParam: string,
    @Body()
    body: {
      name?: string;
      description?: string | null;
      location?: string | null;
      startsAt?: string;
      endsAt?: string | null;
    },
  ) {
    const admin = request.user!;
    const eventId = Number(eventIdParam);

    // Validate event ID
    if (!Number.isSafeInteger(eventId) || eventId <= 0) {
      throw new BadRequestException('Invalid event ID');
    }

    // Verify administrator
    const users = await db.orm.public.User.all();
    const adminUser = users.find((user) => user.id === admin.id);

    if (!adminUser || !adminUser.isActive || adminUser.role !== 'ADMIN') {
      throw new BadRequestException('Invalid administrator');
    }

    // Find event and verify organization ownership
    const events = await db.orm.public.Event.all();
    const event = events.find((item) => item.id === eventId);

    if (!event || event.organizationId !== adminUser.organizationId) {
      throw new NotFoundException('Event not found');
    }

    // Prepare updates
    const updates: {
      name?: string;
      description?: string | null;
      location?: string | null;
      startsAt?: string;
      endsAt?: string | null;
    } = {};

    // Validate name
    if (body.name !== undefined) {
      if (typeof body.name !== 'string') {
        throw new BadRequestException('Invalid event name');
      }

      const name = body.name.trim();

      if (name.length < 3 || name.length > 150) {
        throw new BadRequestException(
          'Event name must contain 3-150 characters',
        );
      }

      updates.name = name;
    }

    // Validate description
    if (body.description !== undefined) {
      if (body.description !== null && typeof body.description !== 'string') {
        throw new BadRequestException('Invalid description');
      }

      updates.description = body.description?.trim() || null;
    }

    // Validate location
    if (body.location !== undefined) {
      if (body.location !== null && typeof body.location !== 'string') {
        throw new BadRequestException('Invalid location');
      }

      updates.location = body.location?.trim() || null;
    }

    // Validate start date
    if (body.startsAt !== undefined) {
      if (
        typeof body.startsAt !== 'string' ||
        !body.startsAt.trim() ||
        !Number.isFinite(Date.parse(body.startsAt))
      ) {
        throw new BadRequestException('Invalid start date');
      }

      updates.startsAt = new Date(body.startsAt).toISOString();
    }

    // Validate end date
    if (body.endsAt !== undefined) {
      if (body.endsAt === null || body.endsAt === '') {
        updates.endsAt = null;
      } else {
        if (
          typeof body.endsAt !== 'string' ||
          !Number.isFinite(Date.parse(body.endsAt))
        ) {
          throw new BadRequestException('Invalid end date');
        }

        updates.endsAt = new Date(body.endsAt).toISOString();
      }
    }

    // Validate final date range
    const finalStartsAt = new Date(updates.startsAt ?? event.startsAt);

    const finalEndsAt =
      updates.endsAt !== undefined ? updates.endsAt : event.endsAt;

    if (finalEndsAt && new Date(finalEndsAt) <= finalStartsAt) {
      throw new BadRequestException('End date must be later than start date');
    }

    if (Object.keys(updates).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    // Update event
    await db.orm.public.Event.where({ id: eventId }).update(updates);

    // Return updated event
    const updatedEvents = await db.orm.public.Event.all();
    const updatedEvent = updatedEvents.find((item) => item.id === eventId);

    if (!updatedEvent) {
      throw new NotFoundException('Event not found after update');
    }

    return updatedEvent;
  }
}
