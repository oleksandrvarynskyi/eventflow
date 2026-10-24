import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import * as QRCode from 'qrcode';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');

    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    this.resend = new Resend(apiKey);

    this.fromEmail =
      this.configService.get<string>('RESEND_FROM_EMAIL') ??
      'onboarding@resend.dev';
  }

  async sendTestEmail(to: string): Promise<void> {
    const { data, error } = await this.resend.emails.send({
      from: this.fromEmail,
      to,
      subject: 'EventFlow - Email Integration Test',
      html: `
        <div style="font-family:Arial,sans-serif;padding:24px">
          <h1 style="color:#2563eb">EventFlow</h1>
          <h2>Email integration successful!</h2>
          <p>Your NestJS backend is now connected to Resend.</p>
          <p>Next step: sending event registration confirmations with QR tickets.</p>
        </div>
      `,
    });

    if (error) {
      this.logger.error(`Resend error: ${error.message}`);
      throw new Error('Failed to send test email');
    }

    this.logger.log(`Test email accepted by Resend: ${data?.id}`);
  }

  async sendRegistrationConfirmation(params: {
    to: string;
    firstName: string;
    eventName: string;
    eventLocation?: string | null;
    eventStartsAt: string | Date;
    registrationToken: string;
  }): Promise<void> {
    const {
      to,
      firstName,
      eventName,
      eventLocation,
      eventStartsAt,
      registrationToken,
    } = params;

    const eventDate = new Intl.DateTimeFormat('en-CA', {
      dateStyle: 'long',
      timeStyle: 'short',
      timeZone: 'America/Edmonton',
    }).format(new Date(eventStartsAt));

    const escapeHtml = (value: string): string =>
      value.replace(/[&<>"']/g, (char) => {
        const entities: Record<string, string> = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        };

        return entities[char];
      });

    const safeFirstName = escapeHtml(firstName);
    const safeEventName = escapeHtml(eventName);
    const safeEventLocation = eventLocation
      ? escapeHtml(eventLocation)
      : 'To be announced';

    const qrBuffer = await QRCode.toBuffer(registrationToken, {
      type: 'png',
      width: 400,
      margin: 2,
      errorCorrectionLevel: 'H',
    });

    const { data, error } = await this.resend.emails.send({
      from: this.fromEmail,
      to,
      subject: `Your ticket for ${eventName.replace(/[\r\n]/g, ' ')}`,
      html: `
  <div style="background:#f3f4f6;padding:40px 16px;font-family:Arial,sans-serif">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden">

      <div style="background:#111827;padding:28px;text-align:center">
        <h1 style="color:#ffffff;margin:0;font-size:28px">
          EventFlow
        </h1>
      </div>

      <div style="padding:32px;text-align:center">
        <h2 style="color:#111827;margin-top:0">
          Registration Confirmed!
        </h2>
<p style="color:#4b5563">
  Hello ${safeFirstName},
</p>

<p style="color:#4b5563">
  You're registered for
</p>

<h3 style="color:#111827;font-size:22px">
  ${safeEventName}
</h3>

<div style="background:#f9fafb;border-radius:12px;padding:20px;margin:24px 0;text-align:left">

  <p style="margin:0 0 14px;color:#374151;font-size:14px">
    <strong>Date & Time</strong><br />
    ${eventDate} (Calgary time)
  </p>

  <p style="margin:0;color:#374151;font-size:14px">
    <strong>Location</strong><br />
    ${safeEventLocation}
  </p>

</div>

        <div style="margin:28px 0;padding:20px;border:1px solid #e5e7eb;border-radius:12px">
          <img
            src="cid:eventflow-ticket"
            alt="Your EventFlow QR Ticket"
            width="240"
            height="240"
            style="display:block;margin:0 auto"
          />
        </div>

        <p style="color:#374151;font-weight:bold">
          Present this QR code at the entrance.
        </p>

        <p style="color:#6b7280;font-size:13px">
          Your ticket is also attached to this email.
        </p>
      </div>

      <div style="background:#f9fafb;padding:18px;text-align:center">
        <p style="color:#9ca3af;font-size:12px;margin:0">
          Powered by EventFlow
        </p>
      </div>

    </div>
  </div>
`,
      attachments: [
        {
          filename: 'eventflow-ticket.png',
          content: qrBuffer.toString('base64'),
          contentId: 'eventflow-ticket',
        },
      ],
    });

    if (error) {
      this.logger.error(`Registration email failed: ${error.message}`);
      throw new Error('Failed to send registration confirmation');
    }

    this.logger.log(`Registration email accepted: ${data?.id}`);
  }
}
