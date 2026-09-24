// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import ms from 'ms';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { UsersService, DeviceInfo } from '../users/users.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
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
}
