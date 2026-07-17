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
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      secretOrKey: config.get<string>('JWT_SECRET') ?? '',
      ignoreExpiration: false,
    });
  }

  validate(payload: JwtPayload): AuthedUser {
    return { userId: payload.sub, username: payload.username };
  }
}
