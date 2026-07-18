import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { AuthedUser } from './github.strategy';

interface JwtPayload {
  sub: string;
  username: string;
}

function cookieExtractor(req: Request): string | null {
  const cookies = req.cookies as Record<string, string> | undefined;
  return cookies?.['gtm_token'] ?? null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      // Prefer the httpOnly cookie; fall back to an Authorization: Bearer token
      // for setups where the cross-origin cookie is blocked.
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: config.get<string>('JWT_SECRET') ?? '',
      ignoreExpiration: false,
    });
  }

  validate(payload: JwtPayload): AuthedUser {
    return { userId: payload.sub, username: payload.username };
  }
}
