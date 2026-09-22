import { Controller, Get, NotFoundException, Req } from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from './users.service.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // @UseGuards(JwtAuthGuard) — Guard লেখার পর এখানে বসবে
  @Get('me')
  async me(@Req() req: Request) {
    const userId = (req as any).user?.id;
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    return { success: true, data: user };
  }
}
