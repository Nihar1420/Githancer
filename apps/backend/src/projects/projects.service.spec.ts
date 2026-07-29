import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProjectsService } from './projects.service';
import { Project, SchedulingMode } from './project.entity';
import { CommitQueue, CommitStatus } from '../commit-queue/commit-queue.entity';
import { GithubService } from '../github/github.service';
import { UsersService } from '../users/users.service';
import { CreateProjectDto } from './dtos/create-project.dto';
import { UpdateProjectDto } from './dtos/update-project.dto';
import { ProjectStatus } from './project.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

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

  describe('update', () => {
    const activeProject = {
      id: 'proj-1',
      owner: { id: 'user-1' },
      repoFullName: 'nihar/demo',
      branch: 'main',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-06-30'),
      totalCommits: 10,
      schedulingMode: SchedulingMode.LINEAR,
      status: ProjectStatus.ACTIVE,
      workingDaysOnly: false,
      preferredHours: null,
    };

    const updateDto: UpdateProjectDto = { totalCommits: 3 };

    it('regenerates the pending queue and keeps executed entries', async () => {
      projectRepo.findOne.mockResolvedValue({ ...activeProject });
      // Last kept (executed/skipped) row sits at queueIndex 4 -> 5 executed rows.
      queueRepo.findOne.mockImplementation(async (opts: any) => {
        if (opts?.order?.queueIndex === 'DESC') return { queueIndex: 4 };
        return null;
      });

      await service.update('user-1', 'proj-1', updateDto);

      // Only pending/in-flight rows are deleted — executed history survives.
      expect(queueRepo.delete).toHaveBeenCalledTimes(1);
      const deleteArg = queueRepo.delete.mock.calls[0][0];
      expect(deleteArg.project).toEqual({ id: 'proj-1' });
      expect(deleteArg.status.value).toEqual([
        CommitStatus.PENDING,
        CommitStatus.IN_FLIGHT,
      ]);

      // New rows continue after the last executed index (4) -> start at 5.
      expect(savedQueueRows).toHaveLength(3);
      expect(savedQueueRows.every((r) => r.status === CommitStatus.PENDING)).toBe(true);
      expect(savedQueueRows.map((r) => r.queueIndex)).toEqual([5, 6, 7]);
    });

    it('throws 400 when the project is completed', async () => {
      projectRepo.findOne.mockResolvedValue({
        ...activeProject,
        status: ProjectStatus.COMPLETED,
      });

      await expect(service.update('user-1', 'proj-1', updateDto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(queueRepo.delete).not.toHaveBeenCalled();
    });

    it('throws 404 when the caller is not the owner', async () => {
      projectRepo.findOne.mockResolvedValue({
        ...activeProject,
        owner: { id: 'someone-else' },
      });

      await expect(service.update('user-1', 'proj-1', updateDto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(queueRepo.delete).not.toHaveBeenCalled();
    });
  });
});
