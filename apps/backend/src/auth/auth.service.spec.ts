import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { User } from '../users/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  const usersRepo = { update: jest.fn(), findOne: jest.fn() };
  const jwt = { sign: jest.fn(() => 'signed.jwt.token') };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: jwt },
        { provide: getRepositoryToken(User), useValue: usersRepo },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  it('signs a JWT with sub + username', () => {
    expect(service.issueJwt('u1', 'nihar')).toBe('signed.jwt.token');
    expect(jwt.sign).toHaveBeenCalledWith({ sub: 'u1', username: 'nihar' });
  });

  it('generates a CLI token and stores only its bcrypt hash', async () => {
    const raw = await service.generateCliToken('u1');
    expect(raw).toHaveLength(64); // 32 random bytes as hex
    const stored = usersRepo.update.mock.calls[0][1].cliApiKeyHash as string;
    expect(stored).not.toBe(raw);
    expect(await bcrypt.compare(raw, stored)).toBe(true);
  });

  it('validateCliToken returns true for a matching key', async () => {
    const raw = 'deadbeefcafe';
    usersRepo.findOne.mockResolvedValue({ id: 'u1', cliApiKeyHash: await bcrypt.hash(raw, 10) });
    expect(await service.validateCliToken('u1', raw)).toBe(true);
  });

  it('validateCliToken returns false for a wrong key', async () => {
    usersRepo.findOne.mockResolvedValue({ id: 'u1', cliApiKeyHash: await bcrypt.hash('correct', 10) });
    expect(await service.validateCliToken('u1', 'wrong')).toBe(false);
  });

  it('validateCliToken returns false when no hash is stored', async () => {
    usersRepo.findOne.mockResolvedValue({ id: 'u1', cliApiKeyHash: null });
    expect(await service.validateCliToken('u1', 'anything')).toBe(false);
  });
});
