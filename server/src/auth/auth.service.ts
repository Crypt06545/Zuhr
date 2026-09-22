import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'node:crypto';

import { UsersService } from '../users/users.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import {
  EmailVerification,
  EmailVerificationDocument,
} from './schemas/email-verification.schema.js';
import {
  UserSession,
  UserSessionDocument,
} from './schemas/user-session.schema.js';
import {
  MAX_ACTIVE_DEVICES,
  ACCESS_TOKEN_TTL_MS,
  REFRESH_TOKEN_TTL_MS,
} from '../constants/auth.constants.js';

const EMAIL_VERIFY_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectModel(EmailVerification.name)
    private readonly emailVerificationModel: Model<EmailVerificationDocument>,
    @InjectModel(UserSession.name)
    private readonly sessionModel: Model<UserSessionDocument>,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
    });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    await this.emailVerificationModel.create({
      userId: user._id,
      tokenHash,
      expiresAt: new Date(Date.now() + EMAIL_VERIFY_TTL_MS),
    });

    // TODO: MailService দিয়ে verify link পাঠান

    return {
      success: true,
      message: 'Registered. Please check your email to verify your account.',
    };
  }

  async validateUser(dto: LoginDto) {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return user;
  }

  // login সফল হলে এটা call হবে — session বানায়, device limit maintain করে, token রিটার্ন করে
  async createSession(
    userId: Types.ObjectId,
    deviceInfo: {
      deviceLabel: string | null;
      browser: string | null;
      operatingSystem: string | null;
      userAgent: string | null;
      ipAddress: string | null;
    },
  ) {
    // ৩-device limit বলবৎ করা — নতুন session বানানোর ঠিক আগে
    await this.enforceDeviceLimit(userId);

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(rawRefreshToken)
      .digest('hex');

    const session = await this.sessionModel.create({
      userId,
      ...deviceInfo,
      refreshTokenHash,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    });

    // access token-এ sessionId ঢুকিয়ে দিচ্ছি — পরে Guard-এ session valid কিনা চেক করতে লাগবে
    const accessToken = this.jwtService.sign(
      { sub: userId.toString(), sessionId: session._id.toString() },
      { secret: process.env.SECRET_KEY_ACCESSTOKEN, expiresIn: '15m' },
    );

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      sessionId: session._id,
    };
  }

  // একই user-এর active session ৩টার বেশি হলে সবচেয়ে পুরনোটা logout করে দেয়
  private async enforceDeviceLimit(userId: Types.ObjectId) {
    const activeSessions = await this.sessionModel
      .find({ userId, revokedAt: null, expiresAt: { $gt: new Date() } })
      .sort({ lastActiveAt: 1 }); // সবচেয়ে পুরনো আগে

    if (activeSessions.length >= MAX_ACTIVE_DEVICES) {
      const excess = activeSessions.length - MAX_ACTIVE_DEVICES + 1;
      const toRevoke = activeSessions.slice(0, excess);
      await this.sessionModel.updateMany(
        { _id: { $in: toRevoke.map((s) => s._id) } },
        { $set: { revokedAt: new Date() } },
      );
    }
  }

  // "আমার সব device দেখাও" — Manage Devices পেজের জন্য
  listActiveSessions(userId: Types.ObjectId) {
    return this.sessionModel
      .find({ userId, revokedAt: null, expiresAt: { $gt: new Date() } })
      .sort({ lastActiveAt: -1 });
  }

  // "এই device থেকে logout করো" — নির্দিষ্ট session revoke
  async revokeSession(userId: Types.ObjectId, sessionId: string) {
    await this.sessionModel.updateOne(
      { _id: sessionId, userId },
      { $set: { revokedAt: new Date() } },
    );
  }
}
