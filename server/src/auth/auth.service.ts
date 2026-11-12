// src/auth/auth.service.ts
import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import ms from 'ms';
import crypto from 'crypto';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { UsersService, DeviceInfo } from '../users/users.service.js';
import { UserStatus } from '../users/schemas/user.schema.js';
import { MailerService } from '../common/mailer/mailer.service.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';
import { ResendVerificationDto } from './dto/resend-verification.dto.js';
import { TwoFactorService } from './two-factor.service.js';
import { Verify2faLoginDto } from './dto/verify-2fa-login.dto.js';
import { VerifyRecoveryCodeDto } from './dto/verify-recovery-code.dto.js';
import { Enable2faDto } from './dto/enable-2fa.dto.js';
import { Disable2faDto } from './dto/disable-2fa.dto.js';

import {
  LOGIN_LOCK_MS,
  LOGIN_MAX_ATTEMPTS,
  MAX_ACTIVE_DEVICES,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_MS,
  REFRESH_ROTATION_GRACE_MS,
  REFRESH_TOKEN_TTL_MS,
  TRUSTED_DEVICE_TTL_MS,
} from '../constants/auth.constants.js';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

// ─── Login Result Types ───

interface TwoFactorRequiredResult {
  twoFactorRequired: true;
  tempToken: string;
  message: string;
}

interface LoginSuccessResult {
  twoFactorRequired: false;
  accessToken: string;
  refreshToken: string;
  trustedDeviceToken: string | null;
  user: { id: string; name: string; email: string };
}

type LoginResult = TwoFactorRequiredResult | LoginSuccessResult;

// অজানা ইমেইলেও একটা আসল bcrypt যাচাই চালানোর জন্য, যাতে সময় দেখে বোঝা না যায়
// ইমেইলটা নিবন্ধিত কিনা।
const DUMMY_PASSWORD_HASH = bcrypt.hashSync(
  crypto.randomBytes(16).toString('hex'),
  10,
);

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
    private readonly twoFactorService: TwoFactorService,
    @InjectQueue('email-queue') private readonly emailQueue: Queue,
  ) {}

  // ─── Register ───
  async register(registerDto: RegisterDto) {
    const hash = await bcrypt.hash(registerDto.password, 12);

    const user = await this.userService.createUser({
      ...registerDto,
      password: hash,
    });

    const verificationToken = await this.jwtService.signAsync(
      { sub: user.id, purpose: 'email-verify' },
      {
        secret: process.env.EMAIL_VERIFICATION_TOKEN_SECRET,
        expiresIn: (process.env.EMAIL_VERIFICATION_TOKEN_EXPIRES ||
          '24h') as any,
      },
    );

    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    await this.emailQueue.add(
      'send-verification',
      { email: user.email, link: verificationLink },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    return {
      message:
        'User created successfully. Please check your email to verify your account.',
      data: user,
    };
  }

  // ─── Login ───

  async login(
    loginDto: LoginDto,
    deviceInfo: DeviceInfo,
    trustedDeviceToken: string | null,
  ): Promise<LoginResult> {
    // আগে লগইনের "সুযোগ" দখল করি (atomic), তারপর পাসওয়ার্ড মেলাই। একসাথে অনেক
    // রিকোয়েস্ট পাঠালেও শুধু LOGIN_MAX_ATTEMPTS টা যাচাই হয়, তারপর অ্যাকাউন্ট লক।
    const user = await this.userService.reserveLoginAttempt(
      loginDto.email,
      LOGIN_MAX_ATTEMPTS,
      LOGIN_LOCK_MS,
    );

    if (!user) {
      return this.rejectLoginWithoutAttempt(loginDto);
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      // এটা শেষ সুযোগ ছিল আর লক বসে গেছে: ইউজারকে জানিয়ে দিই
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        throw this.accountLockedError(user.lockedUntil);
      }

      throw new UnauthorizedException('Invalid email or password.');
    }

    const userId = user._id.toString();

    // সঠিক পাসওয়ার্ড দেখানো হয়েছে, তাই এখান থেকে আটকে গেলে (সাসপেন্ড, ইমেইল
    // যাচাই বাকি) এই চেষ্টাকে ভুল চেষ্টা হিসেবে ধরি না। স্ট্যাটাস শুধু সঠিক
    // পাসওয়ার্ডের পরেই জানাই, যাতে বাইরে থেকে অ্যাকাউন্টের অবস্থা বোঝা না যায়।
    if ((user.status ?? UserStatus.ACTIVE) !== UserStatus.ACTIVE) {
      await this.userService.resetLoginFailures(userId);
      throw new ForbiddenException(
        'Your account is not active. Please contact support.',
      );
    }

    const requireVerification =
      process.env.REQUIRE_EMAIL_VERIFICATION === 'true';

    if (requireVerification && !user.emailVerifiedAt) {
      await this.userService.resetLoginFailures(userId);
      throw new UnauthorizedException(
        'Please verify your email before logging in. Check your inbox or request a new verification link.',
      );
    }

    /**
     * ------------------------------------------------
     * Trusted Device Check
     * ------------------------------------------------
     */
    if (user.twoFactorEnabled && trustedDeviceToken) {
      const trustedDeviceTokenHash =
        this.hashTrustedDeviceToken(trustedDeviceToken);

      const trustedSession = await this.userService.findTrustedDeviceSession(
        userId,
        trustedDeviceTokenHash,
      );

      if (
        trustedSession &&
        trustedSession.trustedDeviceExpiresAt &&
        trustedSession.trustedDeviceExpiresAt > new Date()
      ) {
        await this.userService.clearTrustedDevice(
          trustedSession._id.toString(),
        );

        return this.completeTwoFactorLogin(
          userId,
          user.email,
          user.name,
          deviceInfo,
          true,
        );
      }
    }

    // ─── 2FA Required ───

    if (user.twoFactorEnabled) {
      // পাসওয়ার্ড ঠিক ছিল, তাই পাসওয়ার্ডের ভুল চেষ্টার গণনা মুছে দিই
      await this.userService.resetLoginFailures(userId);

      const tempToken = await this.jwtService.signAsync(
        { sub: userId, purpose: '2fa-pending' },
        {
          secret: process.env.TWO_FA_PENDING_TOKEN_SECRET,
          expiresIn: (process.env.TWO_FA_PENDING_TOKEN_EXPIRES || '5m') as any,
        },
      );

      return {
        twoFactorRequired: true,
        tempToken,
        message: 'Please provide your 2FA code to complete login.',
      };
    }

    // ─── Normal Login (no 2FA) ───

    await this.userService.enforceSessionLimit(userId, MAX_ACTIVE_DEVICES);

    const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

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

    const refreshTokenHash = this.hashRefreshToken(refreshToken);
    await this.userService.replaceSessionToken(
      session._id.toString(),
      refreshTokenHash,
      refreshExpiresAt,
    );

    await this.userService.updateLastLogin(userId);

    return {
      twoFactorRequired: false,
      accessToken,
      refreshToken,
      trustedDeviceToken: null,
      user: {
        id: userId,
        name: user.name,
        email: user.email,
      },
    };
  }

  // সুযোগ দখল করা যায়নি: হয় অ্যাকাউন্ট লক, নয়তো ইমেইল অজানা
  private async rejectLoginWithoutAttempt(loginDto: LoginDto): Promise<never> {
    const existing = await this.userService.getUserByEmail(loginDto.email);

    if (existing?.lockedUntil && existing.lockedUntil > new Date()) {
      throw this.accountLockedError(existing.lockedUntil);
    }

    if (existing) {
      // ইউজার আছে, লকও নেই, তবু সুযোগ মেলেনি: গণনা অস্বাভাবিক অবস্থায় আটকে আছে
      // (যেমন কেউ হাতে বদলেছে)। ঠিক করে দিই, ইউজার আবার চেষ্টা করলে কাজ করবে।
      await this.userService.resetLoginFailures(existing._id.toString());
    } else {
      // অজানা ইমেইল: সময় যেন নিবন্ধিত ইমেইলের মতোই লাগে তাই একটা নকল যাচাই
      await bcrypt.compare(loginDto.password, DUMMY_PASSWORD_HASH);
    }

    throw new UnauthorizedException('Invalid email or password.');
  }

  private accountLockedError(lockedUntil: Date): HttpException {
    const minutes = Math.max(
      1,
      Math.ceil((lockedUntil.getTime() - Date.now()) / 60_000),
    );

    return new HttpException(
      `Too many failed login attempts. Please try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`,
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  // ─── Email Verification ───

  async verifyEmail(token: string) {
    let payload: { sub: string; purpose: string };

    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.EMAIL_VERIFICATION_TOKEN_SECRET,
      });
    } catch {
      throw new BadRequestException(
        'Invalid or expired verification link. Please request a new one.',
      );
    }

    if (payload.purpose !== 'email-verify') {
      throw new BadRequestException('Invalid verification token.');
    }

    const user = await this.userService.getUserById(payload.sub);

    if (!user) {
      throw new BadRequestException('User not found.');
    }

    if (user.emailVerifiedAt) {
      return { message: 'Email is already verified.' };
    }

    await this.userService.markEmailVerified(payload.sub);

    return { message: 'Email verified successfully. You can now login.' };
  }

  async resendVerificationEmail(dto: ResendVerificationDto) {
    const user = await this.userService.getUserByEmail(dto.email);

    if (!user) {
      return {
        message:
          'If this email is registered, a verification link has been sent.',
      };
    }

    if (user.emailVerifiedAt) {
      return { message: 'This email is already verified.' };
    }

    await this.sendVerificationEmail(user._id.toString(), user.email);

    return {
      message:
        'If this email is registered, a verification link has been sent.',
    };
  }

  // ─── Helper ───

  private async sendVerificationEmail(userId: string, email: string) {
    const verificationToken = await this.jwtService.signAsync(
      { sub: userId, purpose: 'email-verify' },
      {
        secret: process.env.EMAIL_VERIFICATION_TOKEN_SECRET,
        expiresIn: (process.env.EMAIL_VERIFICATION_TOKEN_EXPIRES ||
          '24h') as any,
      },
    );

    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    await this.mailerService.sendVerificationEmail(email, verificationLink);
  }

  // ─── Refresh Access Token ───

  async refreshTokens(
    sessionId: string,
    userId: string,
    email: string,
    providedRefreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string | null }> {
    const session = await this.userService.findSessionById(sessionId);

    if (!session || session.isRevoked || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session expired. Please login again.');
    }

    // bcrypt নয়: bcrypt শুধু প্রথম ৭২ বাইট দেখে, আর JWT-র শুরুর অংশ সব টোকেনে এক।
    // তাই পুরনো টোকেনও মিলে যেত। sha256 পুরো টোকেন ধরে হ্যাশ করে।
    const providedHash = this.hashRefreshToken(providedRefreshToken);

    const isCurrent = this.safeEqual(session.tokenHash, providedHash);

    const isJustRotated =
      !isCurrent &&
      !!session.prevTokenValidUntil &&
      session.prevTokenValidUntil > new Date() &&
      this.safeEqual(session.prevTokenHash, providedHash);

    if (!isCurrent && !isJustRotated) {
      // পুরনো / ভুল / চুরি হওয়া টোকেন: পুরো সেশন বন্ধ
      await this.userService.revokeSession(sessionId);
      throw new UnauthorizedException('Invalid session. Please login again.');
    }

    // অ্যাকাউন্ট সাসপেন্ড বা নিষ্ক্রিয় হলে আর নতুন টোকেন নয়, সব সেশনও বন্ধ
    const status = await this.userService.getUserStatus(userId);

    if (status !== UserStatus.ACTIVE) {
      await this.userService.revokeAllSessions(userId);
      throw new UnauthorizedException(
        'Your account is not active. Please contact support.',
      );
    }

    // একসাথে দুটো রিকোয়েস্ট: আগেরটা রিফ্রেশ টোকেন বদলে ফেলেছে, ব্রাউজারের কুকিতে
    // নতুন টোকেন আছে। আমরা শুধু অ্যাক্সেস টোকেন দিই, রিফ্রেশ টোকেন আর বদলাই না।
    if (isJustRotated) {
      const accessToken = await this.signAccessToken(userId, email);
      return { accessToken, refreshToken: null };
    }

    const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    const { accessToken, refreshToken } = await this.generateTokens(
      userId,
      email,
      sessionId,
    );

    const rotated = await this.userService.rotateSessionToken(
      sessionId,
      session.tokenHash,
      this.hashRefreshToken(refreshToken),
      refreshExpiresAt,
      new Date(Date.now() + REFRESH_ROTATION_GRACE_MS),
    );

    if (!rotated) {
      // সমান্তরাল রিকোয়েস্ট আমাদের আগেই টোকেন বদলে ফেলেছে
      return { accessToken, refreshToken: null };
    }

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

  private async signAccessToken(userId: string, email: string) {
    return this.jwtService.signAsync(
      { sub: userId, email },
      {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: (process.env.JWT_ACCESS_EXPIRES || '15m') as any,
      },
    );
  }

  private async generateTokens(
    userId: string,
    email: string,
    sessionId: string,
  ) {
    const accessToken = await this.signAccessToken(userId, email);

    const refreshToken = await this.jwtService.signAsync(
      { sub: userId, email, sessionId, jti: crypto.randomUUID() },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: (process.env.JWT_REFRESH_EXPIRES || '7d') as any,
      },
    );

    return { accessToken, refreshToken };
  }

  // রিফ্রেশ টোকেনের হ্যাশ। sha256 পুরো টোকেন ধরে (bcrypt-এর ৭২ বাইট সীমা নেই)।
  private hashRefreshToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // সমান সময়ে তুলনা (timing attack ঠেকাতে)
  private safeEqual(a: string | null | undefined, b: string): boolean {
    if (!a) return false;
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
  }

  private calculateExpiryDate(duration: string): Date {
    const durationMs = ms(duration as any) as unknown as number;
    return new Date(Date.now() + durationMs);
  }

  private hashTrustedDeviceToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // ─── Forgot Password ───

  async forgotPassword(dto: ForgotPasswordDto) {
    const genericResponse = {
      message: 'If this email is registered, an OTP has been sent.',
    };

    const user = await this.userService.getUserByEmail(dto.email);

    if (!user) {
      return genericResponse;
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    const expiresMinutes = Number(process.env.OTP_EXPIRES_MINUTES ?? 5);
    const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);

    const created = await this.userService.setPasswordResetOtp(
      dto.email,
      otpHash,
      expiresAt,
      OTP_RESEND_COOLDOWN_MS,
    );

    // অপেক্ষার সময় চলছে: নতুন OTP/ইমেইল পাঠাই না, চেষ্টার গণনাও শূন্য করি না।
    // একই বার্তা দিই, যাতে বাইরে থেকে বোঝা না যায় অ্যাকাউন্ট আছে কিনা বা অপেক্ষায় আছে কিনা।
    if (!created) {
      return genericResponse;
    }

    await this.emailQueue.add(
      'send-otp',
      { email: dto.email, otp },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    return genericResponse;
  }

  // ─── Verify OTP ───

  async verifyOtp(dto: VerifyOtpDto) {
    // আগে অনুমানের সুযোগ দখল করি (atomic), তারপর OTP মেলাই। একসাথে অনেক রিকোয়েস্ট
    // পাঠালেও শুধু OTP_MAX_ATTEMPTS টা রিকোয়েস্ট OTP হ্যাশ পাবে।
    // দখল না হলে: OTP নেই / মেয়াদ শেষ / সুযোগ শেষ / ইমেইল ভুল। সবার জন্য একই বার্তা।
    const reserved = await this.userService.reservePasswordResetAttempt(
      dto.email,
      OTP_MAX_ATTEMPTS,
    );

    if (!reserved) {
      throw new BadRequestException(
        'Invalid or expired OTP. Please request a new one.',
      );
    }

    const isOtpValid = await bcrypt.compare(dto.otp, reserved.otpHash);

    if (!isOtpValid) {
      throw new BadRequestException('Invalid OTP.');
    }

    // OTP শুধু একবার কাজ করবে: একসাথে দুটো ঠিক রিকোয়েস্ট এলে একটাই জিতবে
    const consumed = await this.userService.consumePasswordResetOtp(
      dto.email,
      reserved.otpHash,
    );

    if (!consumed) {
      throw new BadRequestException(
        'Invalid or expired OTP. Please request a new one.',
      );
    }

    const resetToken = await this.jwtService.signAsync(
      { sub: reserved.userId, purpose: 'password-reset' },
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

    if (payload.purpose !== 'password-reset') {
      throw new UnauthorizedException('Invalid reset token.');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.userService.updatePassword(payload.sub, newPasswordHash);

    await this.userService.revokeAllSessions(payload.sub);

    return {
      message:
        'Password reset successfully. Please login with your new password.',
    };
  }

  // ─── Two-Factor Authentication ───

  async generateTwoFactorSecret(userId: string, email: string) {
    const alreadyEnabledError = new BadRequestException(
      '2FA is already enabled. Disable it first to set up a new authenticator.',
    );

    // ২FA চালু থাকলে নতুন secret বসানো যাবে না। না হলে শুধু অ্যাক্সেস টোকেন হাতে পাওয়া
    // কেউ পাসওয়ার্ড ছাড়াই নিজের secret বসিয়ে আসল ইউজারকে বের করে দিতে পারত।
    const user = await this.userService.getUserForTwoFactorSetup(userId);

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    if (user.twoFactorEnabled) {
      throw alreadyEnabledError;
    }

    const secret = this.twoFactorService.generateSecret();

    // লেখার সময় ডাটাবেসও আবার শর্ত দেখে (পড়া আর লেখার মাঝে ২FA চালু হয়ে গেলে false আসে)
    const saved = await this.userService.setTwoFactorSecret(userId, secret);

    if (!saved) {
      throw alreadyEnabledError;
    }

    const qrCodeDataUrl = await this.twoFactorService.generateQrCodeDataUrl(
      email,
      secret,
    );

    return {
      message:
        'Scan this QR code with your authenticator app, then verify with a code to enable 2FA.',
      data: { qrCode: qrCodeDataUrl, secret },
    };
  }
  // ─── Current user ───
  async getProfile(userId: string) {
    const user = await this.userService.getUserById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    // DB theke porchi (RolesGuard er moto), tai role bodlale sathe sathe effective
    const userType = await this.userService.getUserType(userId);

    return {
      userId,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatar || null,
      twoFactorEnabled: Boolean(user.twoFactorEnabled),
      emailVerified: Boolean(user.emailVerifiedAt),
      userType,
    };
  }

  async enableTwoFactor(userId: string, dto: Enable2faDto) {
    const user = await this.userService.getUserForTwoFactorSetup(userId);

    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException(
        'Please generate a 2FA secret first before enabling.',
      );
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException('2FA is already enabled.');
    }

    const isValid = await this.twoFactorService.verifyCode(
      user.twoFactorSecret,
      dto.code,
    );

    if (!isValid) {
      throw new BadRequestException('Invalid 2FA code. Please try again.');
    }

    const recoveryCodes = this.twoFactorService.generateRecoveryCodes();
    const hashedCodes =
      await this.twoFactorService.hashRecoveryCodes(recoveryCodes);

    // শুধু তখনই চালু হয় যখন secret এখনো সেটাই যেটার কোড যাচাই হয়েছে, আর ২FA এখনো বন্ধ
    const enabled = await this.userService.enableTwoFactor(
      userId,
      hashedCodes,
      user.twoFactorSecret,
    );

    if (!enabled) {
      throw new BadRequestException(
        '2FA setup was changed or already completed. Please start the setup again.',
      );
    }

    return {
      message:
        '2FA enabled successfully. Save these recovery codes somewhere safe — they will not be shown again.',
      data: { recoveryCodes },
    };
  }

  async disableTwoFactor(userId: string, dto: Disable2faDto) {
    const userBasic = await this.userService.getUserById(userId);

    if (!userBasic) {
      throw new UnauthorizedException('User not found.');
    }

    const user = await this.userService.getUserForLogin(userBasic.email);

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Incorrect password.');
    }

    const userWithSecret =
      await this.userService.getUserForTwoFactorSetup(userId);

    if (!userWithSecret?.twoFactorEnabled || !userWithSecret.twoFactorSecret) {
      throw new BadRequestException('2FA is not enabled.');
    }

    const isCodeValid = await this.twoFactorService.verifyCode(
      userWithSecret.twoFactorSecret,
      dto.code,
    );
    if (!isCodeValid) {
      throw new BadRequestException('Invalid 2FA code.');
    }

    await this.userService.disableTwoFactor(userId);

    return { message: '2FA disabled successfully.' };
  }

  // Login step 2 — tempToken + TOTP code
  async verifyTwoFactorLogin(
    dto: Verify2faLoginDto,
    deviceInfo: DeviceInfo,
  ): Promise<LoginSuccessResult> {
    const payload = await this.verifyPendingToken(dto.tempToken);

    const user = await this.userService.getUserForTwoFactorSetup(payload.sub);

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new UnauthorizedException('2FA is not properly configured.');
    }

    // পাসওয়ার্ড ধাপের পর অ্যাকাউন্ট সাসপেন্ড হয়ে থাকতে পারে
    if ((user.status ?? UserStatus.ACTIVE) !== UserStatus.ACTIVE) {
      throw new ForbiddenException(
        'Your account is not active. Please contact support.',
      );
    }

    const isValid = await this.twoFactorService.verifyCode(
      user.twoFactorSecret,
      dto.code,
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid 2FA code.');
    }

    return this.completeTwoFactorLogin(
      user._id.toString(),
      user.email,
      user.name,
      deviceInfo,
      dto.trustDevice,
    );
  }

  // Recovery code দিয়ে login
  async verifyRecoveryCodeLogin(
    dto: VerifyRecoveryCodeDto,
    deviceInfo: DeviceInfo,
  ): Promise<LoginSuccessResult> {
    const payload = await this.verifyPendingToken(dto.tempToken);

    const user = await this.userService.getUserForRecoveryVerification(
      payload.sub,
    );

    if (!user || !user.twoFactorEnabled) {
      throw new UnauthorizedException('2FA is not enabled for this account.');
    }

    if ((user.status ?? UserStatus.ACTIVE) !== UserStatus.ACTIVE) {
      throw new ForbiddenException(
        'Your account is not active. Please contact support.',
      );
    }

    let matchedIndex = -1;
    for (let i = 0; i < user.twoFactorRecoveryCodeHashes.length; i++) {
      const isMatch = await bcrypt.compare(
        dto.recoveryCode,
        user.twoFactorRecoveryCodeHashes[i],
      );
      if (isMatch) {
        matchedIndex = i;
        break;
      }
    }

    if (matchedIndex === -1) {
      throw new UnauthorizedException('Invalid or already used recovery code.');
    }

    const remainingHashes = user.twoFactorRecoveryCodeHashes.filter(
      (_, index) => index !== matchedIndex,
    );
    await this.userService.consumeRecoveryCode(
      user._id.toString(),
      remainingHashes,
    );

    return this.completeTwoFactorLogin(
      user._id.toString(),
      user.email,
      user.name,
      deviceInfo,
      dto.trustDevice,
    );
  }

  // ─── 2FA Helpers (private) ───

  private async verifyPendingToken(
    tempToken: string,
  ): Promise<{ sub: string; purpose: string }> {
    let payload: { sub: string; purpose: string };

    try {
      payload = await this.jwtService.verifyAsync(tempToken, {
        secret: process.env.TWO_FA_PENDING_TOKEN_SECRET,
      });
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired session. Please login again.',
      );
    }

    if (payload.purpose !== '2fa-pending') {
      throw new UnauthorizedException('Invalid token.');
    }

    return payload;
  }

  private async completeTwoFactorLogin(
    userId: string,
    email: string,
    name: string,
    deviceInfo: DeviceInfo,
    trustDevice: boolean,
  ): Promise<LoginSuccessResult> {
    await this.userService.enforceSessionLimit(userId, MAX_ACTIVE_DEVICES);

    const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    let trustedDeviceToken: string | null = null;
    let trustedDeviceTokenHash: string | null = null;
    let trustedDeviceExpiresAt: Date | null = null;
    const twoFactorVerifiedAt: Date = new Date();

    if (trustDevice) {
      trustedDeviceToken = crypto.randomBytes(32).toString('hex');
      trustedDeviceTokenHash = this.hashTrustedDeviceToken(trustedDeviceToken);
      trustedDeviceExpiresAt = new Date(Date.now() + TRUSTED_DEVICE_TTL_MS);
    }

    const placeholderHash = 'pending';
    const session = await this.userService.createSession(
      userId,
      placeholderHash,
      deviceInfo,
      refreshExpiresAt,
      trustedDeviceTokenHash,
      trustedDeviceExpiresAt,
      twoFactorVerifiedAt,
    );

    const { accessToken, refreshToken } = await this.generateTokens(
      userId,
      email,
      session._id.toString(),
    );

    const refreshTokenHash = this.hashRefreshToken(refreshToken);
    await this.userService.replaceSessionToken(
      session._id.toString(),
      refreshTokenHash,
      refreshExpiresAt,
    );

    await this.userService.updateLastLogin(userId);

    return {
      twoFactorRequired: false,
      accessToken,
      refreshToken,
      trustedDeviceToken,
      user: { id: userId, name, email },
    };
  }
}
