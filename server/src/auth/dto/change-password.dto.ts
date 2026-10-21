// src/auth/dto/change-password.dto.ts

import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  currentPassword: string;

  // bcrypt 72 byte-এর পরের অংশ ধরে না, তাই ওপরসীমা 72
  // (RegisterDto/ResetPasswordDto-র পাসওয়ার্ড নিয়মের সঙ্গে মিলিয়ে নাও)
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  newPassword: string;
}
