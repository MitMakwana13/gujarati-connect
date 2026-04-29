import nodemailer from 'nodemailer';
import type { FastifyBaseLogger } from 'fastify';
import { config } from '../config/index.js';

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    
    // Only initialize the real transporter in production
    if (config.env === 'production') {
      this.transporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.port === 465, // true for 465, false for other ports
        auth: {
          user: config.email.user,
          pass: config.email.pass,
        },
      });
    }
  }

  async sendOtpEmail(to: string, otp: string, logger: FastifyBaseLogger | Console = console): Promise<void> {
    if (config.env !== 'production') {
      // In development/test, just log it. We shouldn't send real emails.
      logger.info({ email: to, otp }, '[EmailService] Dev OTP for email verification');
      return;
    }

    if (!this.transporter) {
      logger.error('[EmailService] Transporter not initialized in production!');
      throw new Error('Email service not configured');
    }

    try {
      await this.transporter.sendMail({
        from: config.email.from,
        to,
        subject: 'Your Gujarati Connect verification code',
        text: `Your Gujarati Connect verification code is:\n\n${otp}\n\nThis code expires in 10 minutes. If you did not request this, you can safely ignore this email.`,
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
      });
      logger.info({ email: to }, '[EmailService] OTP email sent successfully');
    } catch (error) {
      logger.error({ email: to, err: error instanceof Error ? error.message : 'unknown' }, '[EmailService] Failed to send OTP email');
      throw new Error('Failed to send verification email');
    }
  }
}

export const emailService = new EmailService();
