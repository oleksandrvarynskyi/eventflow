import {
  BadRequestException,
  Controller,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Body,
} from '@nestjs/common';

import { Logger } from '@nestjs/common';
import { EmailService } from '../email/email.service.js';

import { randomUUID } from 'node:crypto';
import { db } from '../prisma/db.js';

@Controller('events/:eventId/register')
export class PublicRegistrationController {
  private readonly logger = new Logger(PublicRegistrationController.name);

  constructor(private readonly emailService: EmailService) {}

  @Post()
  async register(
    @Param('eventId', ParseIntPipe) eventId: number,
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

    // Check that the event exists
    const events = await db.orm.public.Event.all();
    const event = events.find((item) => item.id === eventId);

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Prevent duplicate registrations
    const attendees = await db.orm.public.Attendee.all();

    const alreadyRegistered = attendees.some(
      (attendee) =>
        attendee.eventId === eventId && attendee.email.toLowerCase() === email,
    );

    if (alreadyRegistered) {
      throw new BadRequestException(
        'This email is already registered for this event',
      );
    }

    // Generate a unique ticket token
    const registrationToken = randomUUID();

    // Save registration
    const attendee = await db.orm.public.Attendee.create({
      firstName,
      lastName,
      email,
      eventId,
      registrationToken,
    });

    // Send confirmation email without cancelling registration on failure
    try {
      await this.emailService.sendRegistrationConfirmation({
        to: email,
        firstName,
        eventName: event.name,
        eventLocation: event.location,
        eventStartsAt: event.startsAt,
        registrationToken,
      });
    } catch (error) {
      this.logger.error(
        'Registration saved, but confirmation email could not be sent',
        error instanceof Error ? error.stack : String(error),
      );
    }

    return {
      success: true,
      message: 'Registration successful',
      attendee: {
        id: attendee.id,
        registrationToken: attendee.registrationToken,
      },
    };
  }
}
