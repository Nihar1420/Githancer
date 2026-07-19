import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProjectsService } from './projects.service';
import { Project, SchedulingMode } from './project.entity';
import { CommitQueue, CommitStatus } from '../commit-queue/commit-queue.entity';
import { GithubService } from '../github/github.service';
import { UsersService } from '../users/users.service';
import { CreateProjectDto } from './dtos/create-project.dto';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let savedQueueRows: CommitQueue[];

  const projectRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
  };
  const queueRepo = {
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };
  const github = { validateBranch: jest.fn() };
  const users = { getDecryptedToken: jest.fn(), findById: jest.fn() };

  const dto: CreateProjectDto = {
    repoFullName: 'nihar/demo',
    branch: 'main',
    startDate: '2026-01-01',
    endDate: '2026-06-30',
    totalCommits: 10,
    schedulingMode: SchedulingMode.LINEAR,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    savedQueueRows = [];

    projectRepo.create.mockImplementation((x) => x);
    projectRepo.save.mockImplementation(async (p) => ({ ...p, id: 'proj-1' }));
    projectRepo.findOne.mockResolvedValue({ id: 'proj-1', owner: { id: 'user-1' } });
    queueRepo.create.mockImplementation((x) => x);
    queueRepo.save.mockImplementation(async (rows) => {
      savedQueueRows = rows as CommitQueue[];
      return rows;
    });
    queueRepo.count.mockResolvedValue(0);
    queueRepo.findOne.mockResolvedValue(null);
    github.validateBranch.mockResolvedValue(true);
    users.getDecryptedToken.mockResolvedValue('tok');
    users.findById.mockResolvedValue({ id: 'user-1' });

    const moduleRef = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: getRepositoryToken(Project), useValue: projectRepo },
        { provide: getRepositoryToken(CommitQueue), useValue: queueRepo },
        { provide: GithubService, useValue: github },
        { provide: UsersService, useValue: users },
      ],
    }).compile();

    service = moduleRef.get(ProjectsService);
  });

  it('creates one PENDING queue row per commit, indexed sequentially, with unique timestamps', async () => {
    await service.create('user-1', dto);

    expect(savedQueueRows).toHaveLength(10);
    expect(savedQueueRows.every((r) => r.status === CommitStatus.PENDING)).toBe(true);
    expect(savedQueueRows.map((r) => r.queueIndex)).toEqual(
      Array.from({ length: 10 }, (_v, i) => i),
    );
    const iso = savedQueueRows.map((r) => r.scheduledAt.toISOString());
    expect(new Set(iso).size).toBe(10);
  });

  it('still creates the project when branch validation is inconclusive (advisory only)', async () => {
    github.validateBranch.mockResolvedValue(false);
    await expect(service.create('user-1', dto)).resolves.toBeDefined();
    expect(savedQueueRows).toHaveLength(10);
  });

  it('still creates the project when branch validation throws (auth/scope error)', async () => {
    github.validateBranch.mockRejectedValue(new Error('GitHub auth failed (403)'));
    await expect(service.create('user-1', dto)).resolves.toBeDefined();
    expect(savedQueueRows).toHaveLength(10);
  });
});
