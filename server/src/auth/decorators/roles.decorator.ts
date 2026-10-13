import { SetMetadata } from '@nestjs/common';

import type { UserType } from '../../users/schemas/user.schema.js';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: UserType[]) => SetMetadata(ROLES_KEY, roles);
