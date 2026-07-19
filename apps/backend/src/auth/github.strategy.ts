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
    // passport-oauth2 rejects an empty clientID, so fall back to a placeholder
    // when GitHub OAuth isn't configured yet. This lets the app boot (health,
    // API, mock frontend all work); the OAuth login flow only functions once
    // real GITHUB_CLIENT_ID / SECRET are set.
    super({
      clientID: config.get<string>('GITHUB_CLIENT_ID') || 'not-configured',
      clientSecret: config.get<string>('GITHUB_CLIENT_SECRET') || 'not-configured',
      callbackURL:
        config.get<string>('GITHUB_CALLBACK_URL') ||
        'http://localhost:3001/api/v1/auth/github/callback',
      // 'repo' is required for classic OAuth to see private repositories.
      // (GitHub has no read-only private scope for OAuth Apps.) Expanding the
      // scope also forces existing users to re-authorize on their next login.
      scope: ['user:email', 'repo'],
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
