import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

describe('AuthController', () => {
  it('githubCallback issues a JWT, sets an httpOnly cookie, and redirects to the frontend', () => {
    const authService = { issueJwt: jest.fn(() => 'tok') } as unknown as AuthService;
    const config = { get: jest.fn(() => 'http://localhost:3000') } as unknown as ConfigService;
    const controller = new AuthController(authService, config);

    const res = { cookie: jest.fn(), redirect: jest.fn() } as unknown as Response;
    controller.githubCallback({ user: { userId: 'u1', username: 'nihar' } }, res);

    expect(authService.issueJwt).toHaveBeenCalledWith('u1', 'nihar');
    expect(res.cookie).toHaveBeenCalledWith(
      'gtm_token',
      'tok',
      expect.objectContaining({ httpOnly: true, sameSite: 'none', secure: true }),
    );
    expect(res.redirect).toHaveBeenCalledWith('http://localhost:3000/auth/callback');
  });

  it('logout clears the auth cookie', () => {
    const controller = new AuthController(
      {} as unknown as AuthService,
      {} as unknown as ConfigService,
    );
    const res = { clearCookie: jest.fn() } as unknown as Response;
    const result = controller.logout(res);
    expect(res.clearCookie).toHaveBeenCalledWith(
      'gtm_token',
      expect.objectContaining({ sameSite: 'none', secure: true }),
    );
    expect(result).toEqual({ message: 'Logged out' });
  });
});
