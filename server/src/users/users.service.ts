import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RegisterDto } from '../auth/dto/register.dto.js';
import { CloudinaryService } from '../common/cloudinary/cloudinary.service.js';
import {
  User,
  UserDocument,
  UserStatus,
  UserType,
} from './schemas/user.schema.js';
import {
  RefreshToken,
  RefreshTokenDocument,
} from './schemas/refresh-token.schema.js';

export interface DeviceInfo {
  deviceName: string;
  userAgent: string | null;
  ipAddress: string | null;
}

const AVATAR_FOLDER = 'zuhr/avatars';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(RefreshToken.name)
    private refreshTokenModel: Model<RefreshToken>,
    private readonly cloudinary: CloudinaryService,
  ) {}

  // ─── User ───

  async createUser(registerDto: RegisterDto) {
    const existingUser = await this.userModel.findOne({
      email: registerDto.email,
    });

    if (existingUser) {
      throw new ConflictException('This email is already registered.');
    }

    const newUser = await this.userModel.create(registerDto);

    return {
      id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
    };
  }

  async getUserForLogin(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).select('+password');
  }

  async getUserByEmail(email: string) {
    return this.userModel.findOne({ email });
  }

  async updateLastLogin(userId: string) {
    await this.userModel.updateOne(
      { _id: userId },
      { $set: { lastLoginAt: new Date() } },
    );
  }

  // ─── Profile ───

  async updateProfile(userId: string, name: string) {
    const user = await this.userModel
      .findByIdAndUpdate(userId, { $set: { name } }, { new: true })
      .select('name email')
      .lean<{ name: string; email: string }>()
      .exec();

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return { name: user.name, email: user.email };
  }

  async updateAvatar(userId: string, file: Express.Multer.File) {
    const current = await this.userModel
      .findById(userId)
      .select('+avatarPublicId')
      .lean<{ avatarPublicId?: string }>()
      .exec();

    if (!current) {
      throw new NotFoundException('User not found.');
    }

    const uploaded = await this.cloudinary.uploadImage(file, AVATAR_FOLDER);

    try {
      await this.userModel.updateOne(
        { _id: userId },
        {
          $set: {
            avatar: uploaded.url,
            avatarPublicId: uploaded.publicId,
          },
        },
      );
    } catch (error) {
      // DB ব্যর্থ: নতুন ছবি ফেলে দিই, যেন Cloudinary-তে এতিম ফাইল না থাকে
      await this.cloudinary
        .deleteImage(uploaded.publicId)
        .catch(() => undefined);

      throw error;
    }

    // সফল: পুরনো ছবি মুছি। মুছতে না পারলে ব্যবহারকারীর ফলাফল নষ্ট হয় না
    if (current.avatarPublicId) {
      await this.cloudinary
        .deleteImage(current.avatarPublicId)
        .catch(() => undefined);
    }

    return { avatarUrl: uploaded.url };
  }

  // ─── Refresh Token / Session Management ───

  async createSession(
    userId: string,
    tokenHash: string,
    deviceInfo: DeviceInfo,
    expiresAt: Date,
    trustedDeviceTokenHash: string | null = null,
    trustedDeviceExpiresAt: Date | null = null,
    twoFactorVerifiedAt: Date | null = null,
  ) {
    return this.refreshTokenModel.create({
      user: new Types.ObjectId(userId),
      tokenHash,
      deviceName: deviceInfo.deviceName,
      userAgent: deviceInfo.userAgent,
      ipAddress: deviceInfo.ipAddress,
      expiresAt,
      trustedDeviceTokenHash,
      trustedDeviceExpiresAt,
      twoFactorVerifiedAt,
    });
  }

  async enforceSessionLimit(userId: string, maxSessions: number) {
    const activeSessions = await this.refreshTokenModel
      .find({
        user: new Types.ObjectId(userId),
        isRevoked: false,
        expiresAt: { $gt: new Date() },
      })
      .sort({ createdAt: 1 });

    if (activeSessions.length >= maxSessions) {
      const excessCount = activeSessions.length - maxSessions + 1;
      const sessionsToRemove = activeSessions.slice(0, excessCount);

      await this.refreshTokenModel.deleteMany({
        _id: { $in: sessionsToRemove.map((s) => s._id) },
      });
    }
  }

  async findSessionById(
    sessionId: string,
  ): Promise<RefreshTokenDocument | null> {
    return this.refreshTokenModel
      .findById(sessionId)
      .select(
        '+tokenHash +trustedDeviceTokenHash +prevTokenHash +prevTokenValidUntil',
      );
  }

  async revokeSession(sessionId: string) {
    await this.refreshTokenModel.updateOne(
      { _id: sessionId },
      {
        $set: {
          isRevoked: true,
        },
      },
    );

    return {
      message: 'Logged out successfully.',
    };
  }

  async getActiveSessions(userId: string) {
    return this.refreshTokenModel
      .find({
        user: new Types.ObjectId(userId),
        isRevoked: false,
        expiresAt: { $gt: new Date() },
      })
      .select('-tokenHash')
      .sort({ createdAt: -1 });
  }

  async revokeAllSessions(userId: string) {
    await this.refreshTokenModel.updateMany(
      {
        user: new Types.ObjectId(userId),
      },
      {
        $set: {
          isRevoked: true,
          trustedDeviceTokenHash: null,
          trustedDeviceExpiresAt: null,
        },
      },
    );
  }

  async replaceSessionToken(
    sessionId: string,
    newTokenHash: string,
    newExpiresAt: Date,
  ) {
    await this.refreshTokenModel.updateOne(
      { _id: sessionId },
      { $set: { tokenHash: newTokenHash, expiresAt: newExpiresAt } },
    );
  }

  /**
   * Atomic rotation: shudhu tokhon-i update hoy jokhon session er tokenHash ekhono
   * expectedTokenHash. Ek sathe duita request ashle shudhu ekta jite (true),
   * onnota false pay.
   */
  async rotateSessionToken(
    sessionId: string,
    expectedTokenHash: string,
    newTokenHash: string,
    newExpiresAt: Date,
    previousValidUntil: Date,
  ): Promise<boolean> {
    const result = await this.refreshTokenModel.updateOne(
      { _id: sessionId, tokenHash: expectedTokenHash, isRevoked: false },
      {
        $set: {
          tokenHash: newTokenHash,
          expiresAt: newExpiresAt,
          prevTokenHash: expectedTokenHash,
          prevTokenValidUntil: previousValidUntil,
        },
      },
    );

    return result.modifiedCount === 1;
  }

  async setPasswordResetOtp(email: string, otpHash: string, expiresAt: Date) {
    await this.userModel.updateOne(
      { email },
      {
        $set: {
          passwordResetOtpHash: otpHash,
          passwordResetOtpExpiresAt: expiresAt,
          passwordResetAttempts: 0,
        },
      },
    );
  }

  async getUserType(userId: string): Promise<UserType> {
    const user = await this.userModel
      .findById(userId)
      .select('userType status')
      .lean<{ userType?: UserType; status?: UserStatus }>()
      .exec();

    if (!user || user.status !== UserStatus.ACTIVE) {
      return UserType.USER; // suspended / inactive user ke admin treat korbo na
    }

    return user.userType ?? UserType.USER;
  }

  async getUserForPasswordReset(email: string) {
    return this.userModel
      .findOne({ email })
      .select(
        '+passwordResetOtpHash +passwordResetOtpExpiresAt +passwordResetAttempts',
      );
  }

  async incrementResetAttempts(email: string) {
    await this.userModel.updateOne(
      { email },
      { $inc: { passwordResetAttempts: 1 } },
    );
  }

  async clearPasswordResetOtp(email: string) {
    await this.userModel.updateOne(
      { email },
      {
        $set: {
          passwordResetOtpHash: null,
          passwordResetOtpExpiresAt: null,
          passwordResetAttempts: 0,
        },
      },
    );
  }

  async updatePassword(userId: string, newPasswordHash: string) {
    await this.userModel.updateOne(
      { _id: userId },
      {
        $set: {
          password: newPasswordHash,
          passwordChangedAt: new Date(),
        },
      },
    );
  }

  async markEmailVerified(userId: string) {
    await this.userModel.updateOne(
      { _id: userId },
      { $set: { emailVerifiedAt: new Date() } },
    );
  }

  async getUserById(userId: string) {
    return this.userModel.findById(userId);
  }

  async getUserForTwoFactorSetup(userId: string) {
    return this.userModel
      .findById(userId)
      .select('+twoFactorSecret +twoFactorRecoveryCodeHashes');
  }

  async setTwoFactorSecret(userId: string, secret: string) {
    await this.userModel.updateOne(
      { _id: userId },
      { $set: { twoFactorSecret: secret } },
    );
  }

  async enableTwoFactor(userId: string, recoveryCodeHashes: string[]) {
    await this.userModel.updateOne(
      { _id: userId },
      {
        $set: {
          twoFactorEnabled: true,
          twoFactorRecoveryCodeHashes: recoveryCodeHashes,
        },
      },
    );
  }

  async disableTwoFactor(userId: string) {
    await this.userModel.updateOne(
      { _id: userId },
      {
        $set: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
          twoFactorRecoveryCodeHashes: [],
        },
      },
    );

    await this.refreshTokenModel.updateMany(
      { user: new Types.ObjectId(userId) },
      {
        $set: {
          trustedDeviceTokenHash: null,
          trustedDeviceExpiresAt: null,
        },
      },
    );
  }

  async getUserForRecoveryVerification(userId: string) {
    return this.userModel
      .findById(userId)
      .select('+twoFactorRecoveryCodeHashes');
  }

  async consumeRecoveryCode(userId: string, remainingHashes: string[]) {
    await this.userModel.updateOne(
      { _id: userId },
      { $set: { twoFactorRecoveryCodeHashes: remainingHashes } },
    );
  }

  async findTrustedDeviceSession(
    userId: string,
    trustedDeviceTokenHash: string,
  ): Promise<RefreshTokenDocument | null> {
    return this.refreshTokenModel
      .findOne({
        user: new Types.ObjectId(userId),
        trustedDeviceTokenHash,
        trustedDeviceExpiresAt: { $gt: new Date() },
      })
      .select('+trustedDeviceTokenHash');
  }

  async clearTrustedDevice(sessionId: string) {
    await this.refreshTokenModel.updateOne(
      { _id: sessionId },
      {
        $set: {
          trustedDeviceTokenHash: null,
          trustedDeviceExpiresAt: null,
        },
      },
    );
  }
}
