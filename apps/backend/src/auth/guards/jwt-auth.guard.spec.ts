import { UnauthorizedException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';

const ctx = {
  getHandler: () => ({}),
  getClass: () => ({}),
} as unknown as ExecutionContext;

describe('JwtAuthGuard', () => {
  it('allows public routes without authentication', () => {
    const reflector = { getAllAndOverride: () => true } as unknown as Reflector;
    const guard = new JwtAuthGuard(reflector);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('rejects a protected request with no valid token (401)', () => {
    const reflector = { getAllAndOverride: () => false } as unknown as Reflector;
    const guard = new JwtAuthGuard(reflector);
    // handleRequest is what passport calls once no user is resolved.
    expect(() => guard.handleRequest(null, false, null, ctx)).toThrow(UnauthorizedException);
  });
});
