import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Logger,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';

import { randomUUID } from 'node:crypto';
import * as QRCode from 'qrcode';

import { db } from '../prisma/db.js';

import { EmailService } from '../email/email.service.js';

import {
  AccessGuard,
  EventAccessGuard,
  AttendeeManagementGuard,
} from '../auth/access.guard.js';

@Controller('events/:eventId/attendees')
export class AttendeesController {
  private readonly logger = new Logger(AttendeesController.name);

  constructor(private readonly emailService: EmailService) {}

  // GET /api/events/:eventId/attendees
  @Get()
  @UseGuards(AccessGuard, EventAccessGuard, AttendeeManagementGuard)
  async findAll(@Param('eventId', ParseIntPipe) eventId: number) {
    const attendees = await db.orm.public.Attendee.all();

    return attendees.filter((attendee) => attendee.eventId === eventId);
  }

  // POST /api/events/:eventId/attendees
  @Post()
  @UseGuards(AccessGuard, EventAccessGuard, AttendeeManagementGuard)
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

  // PATCH /api/events/:eventId/attendees/:attendeeId
  @Patch(':attendeeId')
  @UseGuards(AccessGuard, EventAccessGuard, AttendeeManagementGuard)
  async update(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Param('attendeeId', ParseIntPipe) attendeeId: number,
    @Body()
    body: {
      firstName: string;
      lastName: string;
      email: string;
    },
  ) {
    const firstName = body?.firstName?.trim();
    const lastName = body?.lastName?.trim();
    const email = body?.email?.trim();

    if (!firstName || !lastName || !email) {
      throw new BadRequestException(
        'First name, last name and email are required',
      );
    }

    const attendees = await db.orm.public.Attendee.all();

    const attendee = attendees.find(
      (item) => item.id === attendeeId && item.eventId === eventId,
    );

    if (!attendee) {
      throw new NotFoundException('Attendee not found');
    }

    return db.orm.public.Attendee.where({
      id: attendeeId,
      eventId,
    }).update({
      firstName,
      lastName,
      email,
    });
  }

  // GET /api/events/:eventId/attendees/:attendeeId/qr
  @Get(':attendeeId/qr')
  @UseGuards(AccessGuard, EventAccessGuard, AttendeeManagementGuard)
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

  @Post(':attendeeId/resend-ticket')
  @UseGuards(AccessGuard, EventAccessGuard, AttendeeManagementGuard)
  async resendTicket(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Param('attendeeId', ParseIntPipe) attendeeId: number,
  ) {
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

    const events = await db.orm.public.Event.all();
    const event = events.find((item) => item.id === eventId);

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    await this.emailService.sendRegistrationConfirmation({
      to: attendee.email,
      firstName: attendee.firstName,
      eventName: event.name,
      eventLocation: event.location,
      eventStartsAt: event.startsAt,
      registrationToken: attendee.registrationToken,
    });

    this.logger.log(`Ticket resent for attendee ${attendeeId}`);

    return {
      success: true,
      message: 'Ticket resent successfully',
      attendeeId,
    };
  }

  // DELETE /api/events/:eventId/attendees/:attendeeId
  @Delete(':attendeeId')
  @UseGuards(AccessGuard, EventAccessGuard, AttendeeManagementGuard)
  async remove(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Param('attendeeId', ParseIntPipe) attendeeId: number,
  ) {
    const attendees = await db.orm.public.Attendee.all();

    const attendee = attendees.find(
      (item) => item.id === attendeeId && item.eventId === eventId,
    );

    if (!attendee) {
      throw new NotFoundException('Attendee not found');
    }

    await db.orm.public.Attendee.where({
      id: attendeeId,
      eventId,
    }).delete();

    return {
      success: true,
      message: 'Attendee deleted successfully',
      attendeeId,
    };
  }
}
