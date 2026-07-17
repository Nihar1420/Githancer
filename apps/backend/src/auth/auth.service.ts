import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/user.entity';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  /** Sign a 24h JWT for a dashboard session. */
  issueJwt(userId: string, username: string): string {
    return this.jwt.sign({ sub: userId, username });
  }

  /** Generate a one-time CLI API key; store only its bcrypt hash. */
  async generateCliToken(userId: string): Promise<string> {
    const raw = randomBytes(32).toString('hex');
    const hash = await bcrypt.hash(raw, BCRYPT_ROUNDS);
    await this.users.update({ id: userId }, { cliApiKeyHash: hash });
    return raw;
  }

  async revokeCliToken(userId: string): Promise<void> {
    await this.users.update({ id: userId }, { cliApiKeyHash: null });
  }

  async validateCliToken(userId: string, incomingKey: string): Promise<boolean> {
    const user = await this.users.findOne({
      where: { id: userId },
      select: ['id', 'cliApiKeyHash'],
    });
    if (!user || !user.cliApiKeyHash) {
      return false;
    }
    return bcrypt.compare(incomingKey, user.cliApiKeyHash);
  }
}
