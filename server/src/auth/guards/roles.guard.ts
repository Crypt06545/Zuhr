import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import { UsersService } from '../../users/users.service.js';
import type { UserType } from '../../users/schemas/user.schema.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';

// Always use AFTER JwtAccessGuard: @UseGuards(JwtAccessGuard, RolesGuard)
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<
      UserType[] | undefined
    >(ROLES_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    // JwtStrategy validate() tomar ki return kore seta jani na —
    // { userId } ba { sub } — duita handle korchi
    const user = request.user as { userId?: string; sub?: string } | undefined;

    const userId = user?.userId ?? user?.sub;

    if (!userId) {
      throw new UnauthorizedException();
    }

    // DB theke porchi, tai admin revoke korle sathe sathe effective
    const userType = await this.usersService.getUserType(userId);

    if (!requiredRoles.includes(userType)) {
      throw new ForbiddenException(
        'You do not have permission to perform this action',
      );
    }

    return true;
  }
}
