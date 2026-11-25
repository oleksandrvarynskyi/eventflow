import {
  BadRequestException,
  Body,
  ConflictException,
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

import { createAttendeeWithNumber, pool } from './create-attendee.js';
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

    // 1. Save attendee
    const attendee = await createAttendeeWithNumber({
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      eventId,
      registrationToken,
    });

    // 2. Find event details
    const events = await db.orm.public.Event.all();
    const event = events.find((item) => item.id === eventId);

    // 3. Send QR ticket
    if (event) {
      try {
        await this.emailService.sendRegistrationConfirmation({
          to: attendee.email,
          firstName: attendee.firstName,
          eventName: event.name,
          eventLocation: event.location,
          eventStartsAt: event.startsAt,
          registrationToken,
        });

        this.logger.log(`Registration ticket sent for attendee ${attendee.id}`);
      } catch (error) {
        this.logger.error(
          `Failed to send registration ticket for attendee ${attendee.id}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    } else {
      this.logger.warn(
        `Event ${eventId} not found. Ticket not sent for attendee ${attendee.id}`,
      );
    }

    return attendee;
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
    const email = body?.email?.trim().toLowerCase();

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

    const duplicate = attendees.some(
      (item) =>
        item.eventId === eventId &&
        item.id !== attendeeId &&
        item.email.trim().toLowerCase() === email,
    );

    if (duplicate) {
      throw new ConflictException(
        'This email is already registered for this event',
      );
    }

    try {
      const result = await pool.query(
        `
    UPDATE public.attendee
    SET
      "firstName" = $1,
      "lastName" = $2,
      "email" = $3,
      "updatedAt" = NOW()
    WHERE id = $4 AND "eventId" = $5
    RETURNING *
    `,
        [firstName, lastName, email, attendeeId, eventId],
      );

      if (result.rowCount === 0) {
        throw new NotFoundException('Attendee not found');
      }

      return result.rows[0];
    } catch (error) {
      const dbError = error as {
        code?: string;
        constraint?: string;
      };

      if (
        dbError.code === '23505' &&
        dbError.constraint === 'attendee_eventId_email_key'
      ) {
        throw new ConflictException(
          'This email is already registered for this event',
        );
      }

      throw error;
    }
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
