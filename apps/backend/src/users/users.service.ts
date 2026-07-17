import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { encrypt, decrypt } from '../utils/crypto.util';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async findOrCreate(
    githubId: string,
    username: string,
    avatarUrl: string,
    timezone = 'UTC',
  ): Promise<User> {
    const existing = await this.users.findOne({ where: { githubId } });
    if (existing) {
      existing.username = username;
      existing.avatarUrl = avatarUrl;
      return this.users.save(existing);
    }
    const created = this.users.create({
      githubId,
      username,
      avatarUrl,
      timezone,
      accessTokenEncrypted: '',
    });
    return this.users.save(created);
  }

  async findById(id: string): Promise<User> {
    const user = await this.users.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateTimezone(id: string, timezone: string): Promise<User> {
    const user = await this.findById(id);
    user.timezone = timezone;
    return this.users.save(user);
  }

  async storeEncryptedToken(userId: string, rawToken: string): Promise<void> {
    await this.users.update({ id: userId }, { accessTokenEncrypted: encrypt(rawToken) });
  }

  async getDecryptedToken(userId: string): Promise<string> {
    const user = await this.users.findOne({
      where: { id: userId },
      select: ['id', 'accessTokenEncrypted'],
    });
    if (!user || !user.accessTokenEncrypted) {
      throw new NotFoundException('No access token stored for user');
    }
    return decrypt(user.accessTokenEncrypted);
  }
}
