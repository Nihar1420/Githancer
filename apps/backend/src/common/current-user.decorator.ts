import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

interface AuthedRequest {
  user?: { userId: string; username: string };
}

/** Returns the authenticated user's id, set by JwtAuthGuard / CliOrJwtAuthGuard. */
export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    if (!req.user?.userId) {
      throw new UnauthorizedException('Not authenticated');
    }
    return req.user.userId;
  },
);
