import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Strategy, Profile } from 'passport-github2';
import { UsersService } from '../users/users.service';

export interface AuthedUser {
  userId: string;
  username: string;
}

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    config: ConfigService,
    private readonly users: UsersService,
  ) {
    super({
      clientID: config.get<string>('GITHUB_CLIENT_ID') ?? '',
      clientSecret: config.get<string>('GITHUB_CLIENT_SECRET') ?? '',
      callbackURL: config.get<string>('GITHUB_CALLBACK_URL') ?? '',
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): Promise<AuthedUser> {
    const user = await this.users.findOrCreate(
      profile.id,
      profile.username ?? profile.displayName ?? 'unknown',
      profile.photos?.[0]?.value ?? '',
    );
    await this.users.storeEncryptedToken(user.id, accessToken);
    return { userId: user.id, username: user.username };
  }
}
