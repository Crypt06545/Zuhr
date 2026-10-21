// src/users/users.controller.ts

import { Body, Controller, Patch, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { JwtAccessGuard } from '../auth/guards/jwt-access.guard.js';

import { UsersService } from './users.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';

// userId সবসময় token থেকে আসে (JwtAccessGuard-এর req.user), request body বা URL থেকে নয়:
// তাই কেউ অন্য কারো প্রোফাইল বদলাতে পারে না।
@UseGuards(JwtAccessGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // প্রোফাইল পড়া হয় GET /auth/me দিয়ে, তাই এখানে শুধু আপডেট
  @Patch('me')
  updateProfile(@Req() req: Request, @Body() dto: UpdateProfileDto) {
    const user = req.user as { userId: string };

    return this.usersService.updateProfile(user.userId, dto.name);
  }
}
