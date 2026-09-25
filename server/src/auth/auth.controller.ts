import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { AuthService } from './auth.service.js';
import { JwtAccessGuard } from './guards/jwt-access.guard.js';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { ResendVerificationDto } from './dto/resend-verification.dto.js';

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_MAX_AGE = Number(
  process.env.REFRESH_TOKEN_COOKIE_MAX_AGE ?? 7 * 24 * 60 * 60 * 1000,
);

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const deviceInfo = this.extractDeviceInfo(req);
    const result = await this.authService.login(loginDto, deviceInfo);

    this.setRefreshCookie(res, result.refreshToken);

    return {
      message: 'Logged in successfully.',
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    };
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user as {
      userId: string;
      email: string;
      sessionId: string;
      refreshToken: string;
    };

    if (!user?.refreshToken) {
      throw new UnauthorizedException('Refresh token missing.');
    }

    const result = await this.authService.refreshTokens(
      user.sessionId,
      user.userId,
      user.email,
      user.refreshToken,
    );

    this.setRefreshCookie(res, result.refreshToken);

    return {
      message: 'Token refreshed successfully.',
      data: { accessToken: result.accessToken },
    };
  }

  @UseGuards(JwtRefreshGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = req.user as { sessionId: string };
    const result = await this.authService.logout(user.sessionId);

    res.clearCookie(REFRESH_COOKIE_NAME);
    return result;
  }

  @UseGuards(JwtAccessGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user as { userId: string };
    const result = await this.authService.logoutAllDevices(user.userId);

    res.clearCookie(REFRESH_COOKIE_NAME);
    return result;
  }

  @UseGuards(JwtAccessGuard)
  @Get('sessions')
  getSessions(@Req() req: Request) {
    const user = req.user as { userId: string };
    return this.authService.getActiveSessions(user.userId);
  }

  @UseGuards(JwtAccessGuard)
  @Get('me')
  getProfile(@Req() req: Request) {
    return { message: 'Profile fetched successfully.', data: req.user };
  }

  // ─── Helpers ───

  private setRefreshCookie(res: Response, refreshToken: string) {
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_COOKIE_MAX_AGE,
    });
  }

  private extractDeviceInfo(req: Request) {
    const userAgent = req.headers['user-agent'] || null;
    const ipAddress = (req.ip || req.socket.remoteAddress || null) as
      string | null;

    let deviceName = 'Unknown Device';
    if (userAgent) {
      if (/mobile/i.test(userAgent)) deviceName = 'Mobile Device';
      else if (/windows/i.test(userAgent)) deviceName = 'Windows PC';
      else if (/mac/i.test(userAgent)) deviceName = 'Mac';
      else if (/linux/i.test(userAgent)) deviceName = 'Linux';
    }

    return { deviceName, userAgent, ipAddress };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Get('verify-email')
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerificationEmail(dto);
  }
}
