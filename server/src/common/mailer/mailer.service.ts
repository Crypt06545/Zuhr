import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter;

  constructor() {
    // একবার তৈরি করে রাখছি, প্রতি email এ নতুন connection বানানো লাগবে না
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false, // 587 এ TLS ব্যবহার হয়, secure:false রাখতে হয়
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendOtpEmail(to: string, otp: string) {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to,
        subject: 'Password Reset OTP',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
            <h2>Password Reset Request</h2>
            <p>Your OTP code is:</p>
            <h1 style="letter-spacing: 4px;">${otp}</h1>
            <p>This code will expire in ${process.env.OTP_EXPIRES_MINUTES || 5} minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
        `,
      });
    } catch (error) {
      // Email পাঠাতে ব্যর্থ হলেও পুরো request crash করানো ঠিক না,
      // log করে রাখছি যাতে debug করা যায়
      this.logger.error('Failed to send OTP email', error);
      throw error;
    }
  }
}
