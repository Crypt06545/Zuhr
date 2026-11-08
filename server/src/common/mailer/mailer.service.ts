import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';

import { otpEmail, verificationEmail } from './mailer.templates.js';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendOtpEmail(to: string, otp: string) {
    try {
      const { subject, html, text } = otpEmail(otp);

      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to,
        subject,
        html,
        text,
      });
    } catch (error) {
      // Email পাঠাতে ব্যর্থ হলেও পুরো request crash করানো ঠিক না,
      // log করে রাখছি যাতে debug করা যায়
      this.logger.error('Failed to send OTP email', error);
      throw error;
    }
  }

  async sendVerificationEmail(to: string, verificationLink: string) {
    try {
      const { subject, html, text } = verificationEmail(verificationLink);

      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to,
        subject,
        html,
        text,
      });
    } catch (error) {
      this.logger.error('Failed to send verification email', error);
      throw error;
    }
  }
}
