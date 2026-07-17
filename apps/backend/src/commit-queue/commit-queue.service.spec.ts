import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CommitQueueService } from './commit-queue.service';
import { CommitQueue, CommitStatus } from './commit-queue.entity';

describe('CommitQueueService', () => {
  let service: CommitQueueService;

  const repo = {
    findOne: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    repo.save.mockImplementation(async (e) => e);

    const moduleRef = await Test.createTestingModule({
      providers: [
        CommitQueueService,
        { provide: getRepositoryToken(CommitQueue), useValue: repo },
      ],
    }).compile();

    service = moduleRef.get(CommitQueueService);
  });

  it('locks the next pending entry as IN_FLIGHT', async () => {
    repo.findOne.mockResolvedValue({
      id: 'q1',
      status: CommitStatus.PENDING,
      scheduledAt: new Date('2026-01-01T00:00:00Z'),
      queueIndex: 0,
    });

    const res = await service.nextCommit('proj-1');

    expect(res.id).toBe('q1');
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: CommitStatus.IN_FLIGHT }),
    );
  });

  it('throws when there are no pending commits', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.nextCommit('proj-1')).rejects.toThrow();
  });

  it('marks an entry executed with commit hash and executedAt', async () => {
    repo.findOne.mockResolvedValue({ id: 'q1', status: CommitStatus.IN_FLIGHT });

    const res = await service.markExecuted('q1', CommitStatus.EXECUTED, 'abc123');

    expect(res.status).toBe(CommitStatus.EXECUTED);
    expect(res.commitHash).toBe('abc123');
    expect(res.executedAt).toBeInstanceOf(Date);
  });
});
