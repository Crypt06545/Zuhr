// src/users/users.controller.ts

import {
  BadRequestException,
  Body,
  Controller,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Request } from 'express';

import { JwtAccessGuard } from '../auth/guards/jwt-access.guard.js';
import { ImageUpload } from '../common/multer/multer.options.js';

import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UsersService } from './users.service.js';

// userId সবসময় token থেকে আসে (JwtAccessGuard-এর req.user), request body বা URL থেকে নয়:
// তাই কেউ অন্য কারো প্রোফাইল বদলাতে পারে না।
@UseGuards(JwtAccessGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('me')
  updateProfile(@Req() req: Request, @Body() dto: UpdateProfileDto) {
    const user = req.user as { userId: string };

    return this.usersService.updateProfile(user.userId, dto.name);
  }

  @Post('me/avatar')
  @UseInterceptors(ImageUpload())
  uploadAvatar(
    @Req() req: Request,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Image is required');
    }

    const user = req.user as { userId: string };

    return this.usersService.updateAvatar(user.userId, file);
  }
}
