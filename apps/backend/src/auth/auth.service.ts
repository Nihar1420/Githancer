import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import type { QueueStats } from '@gtm/common';
import { User } from '../users/user.entity';
import { ProjectsService } from '../projects/projects.service';

const BCRYPT_ROUNDS = 10;

export interface CliSetupProject {
  id: string;
  repoFullName: string;
  branch: string;
  status: string;
  queueStats: QueueStats;
}

export interface CliSetupData {
  userId: string;
  username: string;
  apiKey: string; // masked for display
  apiKeyFull: string | null; // full key — only present when freshly generated
  hasKey: boolean;
  projects: CliSetupProject[];
}

function maskKey(raw: string): string {
  return `••••••••${raw.slice(-8)}`;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly projectsService: ProjectsService,
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

  /**
   * Everything the CLI-setup page needs in one call. Because only the bcrypt
   * hash of the CLI key is stored, the full key can only be returned when we
   * generate it here (first-time). If a key already exists, `apiKey` is a
   * generic mask and `apiKeyFull` is null — the user regenerates to get a fresh
   * full key.
   */
  async getCliSetup(userId: string): Promise<CliSetupData> {
    const user = await this.users.findOne({
      where: { id: userId },
      select: ['id', 'username', 'cliApiKeyHash'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    let apiKeyFull: string | null = null;
    let apiKey: string;
    if (!user.cliApiKeyHash) {
      apiKeyFull = await this.generateCliToken(userId);
      apiKey = maskKey(apiKeyFull);
    } else {
      apiKey = '••••••••••••'; // cannot recover a stored hash
    }

    const projects = (await this.projectsService.list(userId)).map((p) => ({
      id: p.project.id,
      repoFullName: p.project.repoFullName,
      branch: p.project.branch,
      status: p.project.status,
      queueStats: p.queueStats,
    }));

    return {
      userId: user.id,
      username: user.username,
      apiKey,
      apiKeyFull,
      hasKey: apiKeyFull !== null || Boolean(user.cliApiKeyHash),
      projects,
    };
  }
}
