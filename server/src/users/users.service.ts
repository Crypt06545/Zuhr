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
    // সফল লগইনে আগের ভুল চেষ্টা আর লক মুছে যায় (আলাদা লেখার দরকার হয় না)
    await this.userModel.updateOne(
      { _id: userId },
      {
        $set: {
          lastLoginAt: new Date(),
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      },
    );
  }

  /**
   * লগইনের একটা "সুযোগ" atomic ভাবে দখল করে এবং পাসওয়ার্ড-সহ ইউজার ফেরত দেয়।
   * অ্যাকাউন্ট লক থাকলে বা ইমেইল না মিললে null।
   *
   * দুই ধাপ, দুটোই একটা করে atomic কোয়েরি:
   *  ১) সাধারণ সুযোগ: গণনা (maxAttempts - 1) এর নিচে থাকলে এক বাড়ায়
   *  ২) শেষ সুযোগ: সুযোগ দেওয়ার সাথে সাথে একই কোয়েরিতে লক বসিয়ে দেয়
   * তাই একসাথে হাজারটা রিকোয়েস্ট এলেও ঠিক maxAttempts টা যাচাই হয়, আর
   * "গণনা শেষ কিন্তু লক বসেনি" এমন মাঝামাঝি অবস্থা তৈরি হয় না।
   */
  async reserveLoginAttempt(
    email: string,
    maxAttempts: number,
    lockMs: number,
  ): Promise<UserDocument | null> {
    const now = new Date();
    const notLocked = {
      $or: [{ lockedUntil: null }, { lockedUntil: { $lte: now } }],
    };

    const normal = await this.userModel
      .findOneAndUpdate(
        {
          email,
          $and: [
            notLocked,
            {
              // null মানে গণনা নেই বা ফিল্ডই নেই (পুরনো ডকুমেন্ট), সেটাকেও ০ ধরা হয়
              $or: [
                { failedLoginAttempts: null },
                { failedLoginAttempts: { $lt: maxAttempts - 1 } },
              ],
            },
          ],
        },
        { $inc: { failedLoginAttempts: 1 } },
        { returnDocument: 'after' },
      )
      .select('+password')
      .exec();

    if (normal) return normal;

    return this.userModel
      .findOneAndUpdate(
        { email, ...notLocked, failedLoginAttempts: maxAttempts - 1 },
        {
          $set: {
            failedLoginAttempts: 0,
            lockedUntil: new Date(now.getTime() + lockMs),
          },
        },
        { returnDocument: 'after' },
      )
      .select('+password')
      .exec();
  }

  /** পাসওয়ার্ড ঠিক ছিল কিন্তু অন্য কারণে আটকেছে: এই চেষ্টা ভুল চেষ্টা হিসেবে গোনা হয় না */
  async resetLoginFailures(userId: string) {
    await this.userModel.updateOne(
      { _id: userId },
      { $set: { failedLoginAttempts: 0, lockedUntil: null } },
    );
  }

  /** অ্যাকাউন্টের অবস্থা (Active/Inactive/Suspended)। ইউজার না থাকলে null। */
  async getUserStatus(userId: string): Promise<UserStatus | null> {
    const user = await this.userModel
      .findById(userId)
      .select('status')
      .lean<{ status?: UserStatus }>()
      .exec();

    if (!user) return null;

    // status ফিল্ড না থাকা পুরনো ডকুমেন্টকে Active ধরা হয় (স্কিমার ডিফল্টের মতো)
    return user.status ?? UserStatus.ACTIVE;
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
   * Atomic রোটেশন: শুধু তখনই আপডেট হয় যখন সেশনের tokenHash এখনো expectedTokenHash।
   * একসাথে দুটো রিকোয়েস্ট এলে শুধু একটা জেতে (true), অন্যটা false পায়।
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

  /**
   * নতুন OTP বসায়। আগের OTP পাঠানোর পর `cooldownMs` সময় না গেলে কিছু করে না
   * (false দেয়)। তাই বারবার "forgot password" চেয়ে চেষ্টার গণনা শূন্য করা যায় না।
   * অপেক্ষার সময় যাচাই আর লেখা একই atomic কোয়েরিতে হয়।
   */
  async setPasswordResetOtp(
    email: string,
    otpHash: string,
    expiresAt: Date,
    cooldownMs: number,
  ): Promise<boolean> {
    const now = new Date();
    const cooldownLimit = new Date(now.getTime() - cooldownMs);

    const result = await this.userModel.updateOne(
      {
        email,
        // null মানে কখনো পাঠানো হয়নি (ফিল্ড না থাকলেও null-এর মতো মেলে)
        $or: [
          { passwordResetOtpSentAt: null },
          { passwordResetOtpSentAt: { $lte: cooldownLimit } },
        ],
      },
      {
        $set: {
          passwordResetOtpHash: otpHash,
          passwordResetOtpExpiresAt: expiresAt,
          passwordResetOtpSentAt: now,
          passwordResetAttempts: 0,
        },
      },
    );

    return result.modifiedCount === 1;
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

  /**
   * একটা অনুমানের "সুযোগ" atomic ভাবে দখল করে এবং OTP হ্যাশ ফেরত দেয়।
   * ফিল্টারে `attempts < max` আর মেয়াদের শর্ত আছে, তাই একসাথে ১০০০টা রিকোয়েস্ট
   * পাঠালেও শুধু `max` টা রিকোয়েস্ট হ্যাশ পাবে, বাকিরা null পাবে।
   */
  async reservePasswordResetAttempt(
    email: string,
    maxAttempts: number,
  ): Promise<{ userId: string; otpHash: string } | null> {
    const user = await this.userModel
      .findOneAndUpdate(
        {
          email,
          passwordResetOtpHash: { $ne: null },
          passwordResetOtpExpiresAt: { $gt: new Date() },
          passwordResetAttempts: { $lt: maxAttempts },
        },
        { $inc: { passwordResetAttempts: 1 } },
        { returnDocument: 'after' },
      )
      .select('+passwordResetOtpHash')
      .exec();

    if (!user?.passwordResetOtpHash) return null;

    return { userId: user._id.toString(), otpHash: user.passwordResetOtpHash };
  }

  /**
   * OTP শুধু একবার কাজ করবে: হ্যাশ এখনো আগের মতো থাকলেই মোছা হয়।
   * দুটো রিকোয়েস্ট একসাথে ঠিক OTP দিলেও শুধু একটা true পাবে।
   */
  async consumePasswordResetOtp(
    email: string,
    otpHash: string,
  ): Promise<boolean> {
    const result = await this.userModel.updateOne(
      { email, passwordResetOtpHash: otpHash },
      {
        $set: {
          passwordResetOtpHash: null,
          passwordResetOtpExpiresAt: null,
          passwordResetAttempts: 0,
        },
      },
    );

    return result.modifiedCount === 1;
  }

  async updatePassword(userId: string, newPasswordHash: string) {
    await this.userModel.updateOne(
      { _id: userId },
      {
        $set: {
          password: newPasswordHash,
          passwordChangedAt: new Date(),
          // ইমেইলের OTP দিয়ে মালিকানা প্রমাণ হয়েছে, তাই লক খুলে যায়
          failedLoginAttempts: 0,
          lockedUntil: null,
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

  /**
   * নতুন (এখনো চালু না হওয়া) 2FA secret বসায়। ২FA ইতিমধ্যে চালু থাকলে কিছুই বদলায় না
   * এবং false দেয়। শর্ত যাচাই আর লেখা একই atomic কোয়েরিতে, তাই যাচাই আর লেখার
   * মাঝখানে অন্য রিকোয়েস্ট ২FA চালু করে ফেললেও চালু থাকা secret কখনো বদলাবে না।
   */
  async setTwoFactorSecret(userId: string, secret: string): Promise<boolean> {
    const result = await this.userModel.updateOne(
      { _id: userId, twoFactorEnabled: { $ne: true } },
      { $set: { twoFactorSecret: secret } },
    );

    return result.matchedCount === 1;
  }

  /**
   * ২FA চালু করে। শুধু তখনই চালু হয় যখন এখনো চালু হয়নি এবং সংরক্ষিত secret ঠিক
   * সেটাই যেটার কোড ইউজার যাচাই করেছে (expectedSecret)। তাই দুটো রিকোয়েস্ট
   * একসাথে এলে একটাই জেতে, আর যাচাইয়ের মাঝখানে secret বদলে গেলে চালু হয় না।
   */
  async enableTwoFactor(
    userId: string,
    recoveryCodeHashes: string[],
    expectedSecret: string,
  ): Promise<boolean> {
    const result = await this.userModel.updateOne(
      {
        _id: userId,
        twoFactorEnabled: { $ne: true },
        twoFactorSecret: expectedSecret,
      },
      {
        $set: {
          twoFactorEnabled: true,
          twoFactorRecoveryCodeHashes: recoveryCodeHashes,
        },
      },
    );

    return result.modifiedCount === 1;
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
