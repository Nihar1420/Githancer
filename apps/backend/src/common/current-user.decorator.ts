import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

/**
 * Resolves the current user id.
 *
 * TODO(Phase 3): replace the `x-user-id` header lookup with JwtAuthGuard +
 * request.user once GitHub OAuth / JWT is implemented.
 */
export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<{ headers: Record<string, unknown> }>();
    const userId = request.headers['x-user-id'];
    if (typeof userId !== 'string' || userId.length === 0) {
      throw new UnauthorizedException('Missing x-user-id header (temporary until Phase 3 auth)');
    }
    return userId;
  },
);
