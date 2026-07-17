import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../auth.service';

/**
 * Accepts EITHER a CLI Bearer key (Authorization: Bearer <key> + X-User-Id)
 * OR a dashboard JWT cookie. Used on the routes the CLI needs (next-commit,
 * mark-executed). Extends the jwt guard so the cookie path reuses passport.
 */
@Injectable()
export class CliOrJwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly authService: AuthService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, string | undefined>; user?: unknown }>();
    const header = req.headers['authorization'];

    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      const key = header.slice('Bearer '.length);
      const userId = req.headers['x-user-id'];
      if (typeof userId !== 'string' || userId.length === 0) {
        throw new UnauthorizedException('Missing X-User-Id header for CLI authentication');
      }
      const valid = await this.authService.validateCliToken(userId, key);
      if (!valid) {
        throw new UnauthorizedException('Invalid CLI token');
      }
      req.user = { userId, username: 'cli' };
      return true;
    }

    return (await super.canActivate(context)) as boolean;
  }
}
