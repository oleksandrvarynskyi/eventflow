import { Body, Controller, Get, Post } from '@nestjs/common';
import { db } from '../prisma/db.js';

@Controller('events')
export class EventsController {
  @Get()
  async findAll() {
    return db.orm.public.Event.all();
  }

  @Post()
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
