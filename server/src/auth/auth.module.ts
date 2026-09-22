import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module.js';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import {
  UserSession,
  UserSessionSchema,
} from './schemas/user-session.schema.js';
import {
  EmailVerification,
  EmailVerificationSchema,
} from './schemas/email-verification.schema.js';
import {
  PasswordResetOtp,
  PasswordResetOtpSchema,
} from './schemas/password-reset-otp.schema.js';
import {
  TwoFactorOtp,
  TwoFactorOtpSchema,
} from './schemas/two-factor-otp.schema.js';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({}), // sign() কল করার সময় secret আলাদা করে দেব, তাই এখানে খালি
    MongooseModule.forFeature([
      { name: UserSession.name, schema: UserSessionSchema },
      { name: EmailVerification.name, schema: EmailVerificationSchema },
      { name: PasswordResetOtp.name, schema: PasswordResetOtpSchema },
      { name: TwoFactorOtp.name, schema: TwoFactorOtpSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
