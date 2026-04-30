import { EmailClient } from '@azure/communication-email';
import type { FastifyBaseLogger } from 'fastify';
import { config } from '../config/index.js';

export class EmailService {
  private emailClient: EmailClient | null = null;

  constructor() {
    if (config.env === 'production') {
      // Use the connection string provided in AZURE_EMAIL_CONNECTION_STRING or fallback to the pass var if they pasted it there
      const connectionString = process.env.AZURE_EMAIL_CONNECTION_STRING || config.email.pass;
      if (connectionString && connectionString.startsWith('endpoint=')) {
        this.emailClient = new EmailClient(connectionString);
      } else {
        console.warn('[EmailService] Invalid or missing Azure Email Connection String in production.');
      }
    }
  }

  async sendOtpEmail(to: string, otp: string, logger: FastifyBaseLogger | Console = console): Promise<void> {
    if (config.env !== 'production') {
      logger.info({ email: to, otp }, '[EmailService] Dev OTP for email verification');
      return;
    }

    if (!this.emailClient) {
      logger.warn({ email: to, otp }, '[EmailService] EmailClient not initialized! OTP generated but not sent.');
      return;
    }

    try {
      const message = {
        senderAddress: config.email.from,
        content: {
          subject: 'Your Gujarati Connect verification code',
          plainText: `Your Gujarati Connect verification code is:\n\n${otp}\n\nThis code expires in 10 minutes. If you did not request this, you can safely ignore this email.`,
          html: `
            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
              <h2 style="color: #ea580c;">Gujarati Connect</h2>
              <p>Your Gujarati Connect verification code is:</p>
              <h1 style="font-size: 32px; letter-spacing: 4px; color: #111;">${otp}</h1>
              <p style="color: #666; font-size: 14px;">This code expires in 10 minutes.</p>
              <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
              <p style="color: #999; font-size: 12px;">If you did not request this, you can safely ignore this email.</p>
            </div>
          `,
        },
        recipients: {
          to: [{ address: to }],
        },
      };

      const poller = await this.emailClient.beginSend(message);
      await poller.pollUntilDone();
      
      logger.info({ email: to }, '[EmailService] OTP email sent successfully via Azure SDK');
    } catch (error) {
      logger.error({ email: to, otp, err: error instanceof Error ? error.message : 'unknown' }, '[EmailService] Failed to send OTP email. OTP logged for manual verification.');
    }
  }
}

export const emailService = new EmailService();
