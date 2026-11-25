import { Pool } from 'pg';
import { NotFoundException } from '@nestjs/common';

const pool = new Pool({
  connectionString: process.env['DATABASE_URL'],
});

type CreateAttendeeInput = {
  firstName: string;
  lastName: string;
  email: string;
  eventId: number;
  registrationToken: string;
};

export async function createAttendeeWithNumber(data: CreateAttendeeInput) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Atomically allocate the next registration number
    const eventResult = await client.query(
      `
      UPDATE public.event
      SET "nextRegistrationNumber" = "nextRegistrationNumber" + 1
      WHERE id = $1
      RETURNING "nextRegistrationNumber" - 1 AS "registrationNumber"
      `,
      [data.eventId],
    );

    if (eventResult.rowCount === 0) {
      throw new NotFoundException('Event not found');
    }

    const registrationNumber = eventResult.rows[0].registrationNumber;

    // Create attendee with the allocated number
    const attendeeResult = await client.query(
      `
      INSERT INTO public.attendee (
        "firstName",
        "lastName",
        "email",
        "eventId",
        "registrationToken",
        "registrationNumber",
        "createdAt",
        "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
      `,
      [
        data.firstName,
        data.lastName,
        data.email,
        data.eventId,
        data.registrationToken,
        registrationNumber,
      ],
    );

    await client.query('COMMIT');

    return attendeeResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
