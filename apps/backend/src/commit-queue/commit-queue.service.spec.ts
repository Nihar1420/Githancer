import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CommitQueueService } from './commit-queue.service';
import { CommitQueue, CommitStatus } from './commit-queue.entity';
import { Project } from '../projects/project.entity';

describe('CommitQueueService', () => {
  let service: CommitQueueService;

  const queueRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    update: jest.fn(),
  };
  const projectRepo = {
    count: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    queueRepo.save.mockImplementation(async (e) => e);
    projectRepo.count.mockResolvedValue(1); // owner by default

    const moduleRef = await Test.createTestingModule({
      providers: [
        CommitQueueService,
        { provide: getRepositoryToken(CommitQueue), useValue: queueRepo },
        { provide: getRepositoryToken(Project), useValue: projectRepo },
      ],
    }).compile();

    service = moduleRef.get(CommitQueueService);
  });

  it('locks the next pending entry as IN_FLIGHT', async () => {
    queueRepo.findOne.mockResolvedValue({
      id: 'q1',
      status: CommitStatus.PENDING,
      scheduledAt: new Date('2026-01-01T00:00:00Z'),
      queueIndex: 0,
    });

    const res = await service.nextCommit('user-1', 'proj-1');

    expect(res.id).toBe('q1');
    expect(queueRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: CommitStatus.IN_FLIGHT }),
    );
  });

  it('rejects next-commit when the caller does not own the project', async () => {
    projectRepo.count.mockResolvedValue(0);
    await expect(service.nextCommit('intruder', 'proj-1')).rejects.toThrow();
  });

  it('throws when there are no pending commits', async () => {
    queueRepo.findOne.mockResolvedValue(null);
    await expect(service.nextCommit('user-1', 'proj-1')).rejects.toThrow();
  });

  it('enforces the per-project rate limit after 10 requests', async () => {
    queueRepo.findOne.mockResolvedValue({
      id: 'q1',
      status: CommitStatus.PENDING,
      scheduledAt: new Date('2026-01-01T00:00:00Z'),
      queueIndex: 0,
    });

    for (let i = 0; i < 10; i++) {
      await service.nextCommit('user-1', 'proj-rate');
    }
    await expect(service.nextCommit('user-1', 'proj-rate')).rejects.toMatchObject({
      status: 429,
    });
  });

  it('marks an owned entry executed with commit hash and executedAt', async () => {
    queueRepo.findOne.mockResolvedValue({
      id: 'q1',
      status: CommitStatus.IN_FLIGHT,
      project: { owner: { id: 'user-1' } },
    });

    const res = await service.markExecuted('user-1', 'q1', CommitStatus.EXECUTED, 'abc123');

    expect(res.status).toBe(CommitStatus.EXECUTED);
    expect(res.commitHash).toBe('abc123');
    expect(res.executedAt).toBeInstanceOf(Date);
  });

  it('rejects mark-executed on an entry the caller does not own', async () => {
    queueRepo.findOne.mockResolvedValue({
      id: 'q1',
      status: CommitStatus.IN_FLIGHT,
      project: { owner: { id: 'someone-else' } },
    });
    await expect(
      service.markExecuted('user-1', 'q1', CommitStatus.EXECUTED, 'abc'),
    ).rejects.toThrow();
  });
});
