// src/auth/auth.service.ts
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import ms from 'ms';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { UsersService, DeviceInfo } from '../users/users.service.js';
import { MailerService } from '../common/mailer/mailer.service.js';
import crypto from 'crypto';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
  ) {}

  // ─── Register ───

  async register(registerDto: RegisterDto) {
    const hash = await bcrypt.hash(registerDto.password, 12);

    const user = await this.userService.createUser({
      ...registerDto,
      password: hash,
    });

    return {
      message: 'User created successfully. Please login to continue.',
      data: user,
    };
  }

  // ─── Login ───

  async login(loginDto: LoginDto, deviceInfo: DeviceInfo) {
    const user = await this.userService.getUserForLogin(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const userId = user._id.toString();

    // Device limit চেক করে পুরানো session সরানো
    const maxSessions = Number(process.env.MAX_ACTIVE_SESSIONS ?? 3);

    console.log('maxSessions:', maxSessions); // ⚠️ যোগ করো
    await this.userService.enforceSessionLimit(userId, maxSessions);
    console.log('enforceSessionLimit called'); // ⚠️ যোগ করো
    // আগে session বানাই (id লাগবে refresh token payload এ),
    // তারপর token generate করে session এ hash বসাবো
    const refreshExpiresAt = this.calculateExpiryDate(
      process.env.JWT_REFRESH_EXPIRES ?? '7d',
    );

    const placeholderHash = 'pending';
    const session = await this.userService.createSession(
      userId,
      placeholderHash,
      deviceInfo,
      refreshExpiresAt,
    );

    const { accessToken, refreshToken } = await this.generateTokens(
      userId,
      user.email,
      session._id.toString(),
    );

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.userService.replaceSessionToken(
      session._id.toString(),
      refreshTokenHash,
      refreshExpiresAt,
    );

    await this.userService.updateLastLogin(userId);

    return {
      accessToken,
      refreshToken,
      user: {
        id: userId,
        name: user.name,
        email: user.email,
      },
    };
  }

  // ─── Refresh Access Token ───

  async refreshTokens(
    sessionId: string,
    userId: string,
    email: string,
    providedRefreshToken: string,
  ) {
    const session = await this.userService.findSessionById(sessionId);

    if (!session || session.isRevoked || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session expired. Please login again.');
    }

    const isTokenValid = await bcrypt.compare(
      providedRefreshToken,
      session.tokenHash,
    );

    if (!isTokenValid) {
      // token mismatch মানে সম্ভবত leaked/reused token — নিরাপত্তার জন্য পুরো session বাতিল
      await this.userService.revokeSession(sessionId);
      throw new UnauthorizedException('Invalid session. Please login again.');
    }

    // Refresh token rotation — প্রতিবার নতুন refresh token ইস্যু করি, পুরানোটা আর কাজ করবে না
    const refreshExpiresAt = this.calculateExpiryDate(
      process.env.JWT_REFRESH_EXPIRES ?? '7d',
    );

    const { accessToken, refreshToken } = await this.generateTokens(
      userId,
      email,
      sessionId,
    );

    const newHash = await bcrypt.hash(refreshToken, 10);
    await this.userService.replaceSessionToken(
      sessionId,
      newHash,
      refreshExpiresAt,
    );

    return { accessToken, refreshToken };
  }

  // ─── Logout ───

  async logout(sessionId: string) {
    await this.userService.revokeSession(sessionId);
    return { message: 'Logged out successfully.' };
  }

  async logoutAllDevices(userId: string) {
    await this.userService.revokeAllSessions(userId);
    return { message: 'Logged out from all devices successfully.' };
  }

  async getActiveSessions(userId: string) {
    const sessions = await this.userService.getActiveSessions(userId);
    return {
      message: 'Active sessions fetched successfully.',
      data: sessions,
    };
  }

  // ─── Helpers ───

  private async generateTokens(
    userId: string,
    email: string,
    sessionId: string,
  ) {
    const accessPayload = { sub: userId, email };
    const refreshPayload = { sub: userId, email, sessionId };

    const accessToken = await this.jwtService.signAsync(accessPayload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: (process.env.JWT_ACCESS_EXPIRES || '15m') as any,
    });

    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: (process.env.JWT_REFRESH_EXPIRES || '7d') as any,
    });

    return { accessToken, refreshToken };
  }

  private calculateExpiryDate(duration: string): Date {
    const durationMs = ms(duration as any) as unknown as number;
    return new Date(Date.now() + durationMs);
  }

  // ─── Forgot Password ───

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userService.getUserByEmail(dto.email);

    // Security practice: user না থাকলেও same success message দিবো,
    // যাতে কেউ email enumerate করে বুঝতে না পারে কোন email account এ registered আছে
    if (!user) {
      return {
        message: 'If this email is registered, an OTP has been sent.',
      };
    }

    // 6-digit random OTP বানাচ্ছি
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    const expiresMinutes = Number(process.env.OTP_EXPIRES_MINUTES ?? 5);
    const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);

    await this.userService.setPasswordResetOtp(dto.email, otpHash, expiresAt);

    await this.mailerService.sendOtpEmail(dto.email, otp);

    return {
      message: 'If this email is registered, an OTP has been sent.',
    };
  }

  // ─── Verify OTP ───

  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.userService.getUserForPasswordReset(dto.email);

    if (
      !user ||
      !user.passwordResetOtpHash ||
      !user.passwordResetOtpExpiresAt
    ) {
      throw new BadRequestException('Invalid or expired OTP.');
    }

    if (user.passwordResetAttempts >= 5) {
      await this.userService.clearPasswordResetOtp(dto.email);
      throw new BadRequestException(
        'Too many failed attempts. Please request a new OTP.',
      );
    }

    if (user.passwordResetOtpExpiresAt < new Date()) {
      await this.userService.clearPasswordResetOtp(dto.email);
      throw new BadRequestException(
        'OTP has expired. Please request a new one.',
      );
    }

    const isOtpValid = await bcrypt.compare(dto.otp, user.passwordResetOtpHash);

    if (!isOtpValid) {
      await this.userService.incrementResetAttempts(dto.email);
      throw new BadRequestException('Invalid OTP.');
    }

    // OTP সঠিক হলে ব্যবহার করা শেষ, সাথে সাথে clear করে দিচ্ছি (one-time use)
    await this.userService.clearPasswordResetOtp(dto.email);

    // এখন একটা short-lived resetToken দিচ্ছি, শুধু password reset করার জন্যই valid
    const resetToken = await this.jwtService.signAsync(
      { sub: user._id.toString(), purpose: 'password-reset' },
      {
        secret: process.env.PASSWORD_RESET_TOKEN_SECRET,
        expiresIn: (process.env.PASSWORD_RESET_TOKEN_EXPIRES || '10m') as any,
      },
    );

    return {
      message: 'OTP verified successfully.',
      data: { resetToken },
    };
  }

  // ─── Reset Password ───

  async resetPassword(dto: ResetPasswordDto) {
    let payload: { sub: string; purpose: string };

    try {
      payload = await this.jwtService.verifyAsync(dto.resetToken, {
        secret: process.env.PASSWORD_RESET_TOKEN_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired reset token.');
    }

    // এই টোকেন শুধুই password-reset এর জন্য বানানো হয়েছিল কিনা যাচাই করছি,
    // যাতে অন্য কোনো JWT (access/refresh) দিয়ে কেউ password reset করতে না পারে
    if (payload.purpose !== 'password-reset') {
      throw new UnauthorizedException('Invalid reset token.');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.userService.updatePassword(payload.sub, newPasswordHash);

    // Password change হলে সব device থেকে logout করে দেওয়া security best practice —
    // কেউ যদি password compromise করেও থাকে, নতুন password সেট হওয়ার পর সব session invalid হয়ে যাবে
    await this.userService.revokeAllSessions(payload.sub);

    return {
      message:
        'Password reset successfully. Please login with your new password.',
    };
  }
}
