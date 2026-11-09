// src/common/guards/app-throttler.guard.ts

import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Rate limit guard.
 *
 * Request gula kar tar hishab rakhar jonno ekta "tracker key" lage:
 *  - body te email thakle  -> "IP|email"  (login, forgot-password, ...)
 *  - na thakle             -> shudhu IP
 *
 * Email key er sathe mila thakle, ek IP theke onno manusher account e hamla
 * alada kore ganona hoy.
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected override async getTracker(
    req: Record<string, any>,
  ): Promise<string> {
    const email =
      typeof req.body?.email === 'string'
        ? req.body.email.toLowerCase().trim()
        : '';

    return email ? `${req.ip}|${email}` : String(req.ip);
  }
}
