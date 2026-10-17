import {
  Body,
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  StreamableFile,
} from '@nestjs/common';

import { randomUUID } from 'node:crypto';
import * as QRCode from 'qrcode';

import { db } from '../prisma/db.js';

@Controller('events/:eventId/attendees')
export class AttendeesController {
  // GET /api/events/:eventId/attendees
  @Get()
  async findAll(@Param('eventId', ParseIntPipe) eventId: number) {
    const attendees = await db.orm.public.Attendee.all();

    return attendees.filter((attendee) => attendee.eventId === eventId);
  }

  // POST /api/events/:eventId/attendees
  @Post()
  async create(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Body()
    body: {
      firstName: string;
      lastName: string;
      email: string;
    },
  ) {
    const registrationToken = randomUUID();

    return db.orm.public.Attendee.create({
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      eventId,
      registrationToken,
    });
  }

  // GET /api/events/:eventId/attendees/:attendeeId/qr
  @Get(':attendeeId/qr')
  @Header('Content-Type', 'image/png')
  async getQrCode(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Param('attendeeId', ParseIntPipe) attendeeId: number,
  ): Promise<StreamableFile> {
    const attendees = await db.orm.public.Attendee.all();

    const attendee = attendees.find(
      (item) => item.id === attendeeId && item.eventId === eventId,
    );

    if (!attendee) {
      throw new NotFoundException('Attendee not found');
    }

    if (!attendee.registrationToken) {
      throw new NotFoundException('Registration token not found');
    }

    const qrBuffer = await QRCode.toBuffer(attendee.registrationToken, {
      type: 'png',
      width: 400,
      margin: 2,
      errorCorrectionLevel: 'H',
    });

    return new StreamableFile(qrBuffer);
  }
}