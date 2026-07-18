import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { CommitQueue } from '../commit-queue/commit-queue.entity';
import { Project } from '../projects/project.entity';

/* eslint-disable @typescript-eslint/no-explicit-any */
function makeQb(raw: unknown[]): any {
  const qb: any = {};
  ['innerJoin', 'select', 'addSelect', 'where', 'andWhere', 'groupBy', 'addGroupBy', 'orderBy'].forEach(
    (m) => {
      qb[m] = jest.fn(() => qb);
    },
  );
  qb.getRawMany = jest.fn(() => Promise.resolve(raw));
  return qb;
}

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  const queueRepo: any = { createQueryBuilder: jest.fn(), find: jest.fn(), count: jest.fn() };
  const projectRepo: any = { count: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    projectRepo.count.mockResolvedValue(1);
    queueRepo.count.mockResolvedValue(0);

    const moduleRef = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: getRepositoryToken(CommitQueue), useValue: queueRepo },
        { provide: getRepositoryToken(Project), useValue: projectRepo },
      ],
    }).compile();
    service = moduleRef.get(AnalyticsService);
  });

  it('getDailyCommits maps grouped rows to typed counts', async () => {
    queueRepo.createQueryBuilder.mockReturnValue(
      makeQb([
        { date: '2026-01-01', count: '3' },
        { date: '2026-01-02', count: '1' },
      ]),
    );
    expect(await service.getDailyCommits('p1')).toEqual([
      { date: '2026-01-01', count: 3 },
      { date: '2026-01-02', count: 1 },
    ]);
  });

  it('getActiveHours maps DOW/hour buckets', async () => {
    queueRepo.createQueryBuilder.mockReturnValue(makeQb([{ dayOfWeek: '1', hour: '10', count: '5' }]));
    expect(await service.getActiveHours('p1')).toEqual([{ dayOfWeek: 1, hour: 10, count: 5 }]);
  });

  describe('getLongestStreak', () => {
    const exec = (d: string) => ({ executedAt: new Date(`${d}T10:00:00Z`) });

    it('returns 0 when there are no commits', async () => {
      queueRepo.find.mockResolvedValue([]);
      expect(await service.getLongestStreak('p1')).toBe(0);
    });

    it('returns 1 when all commits are on the same day', async () => {
      queueRepo.find.mockResolvedValue([exec('2026-01-01'), exec('2026-01-01'), exec('2026-01-01')]);
      expect(await service.getLongestStreak('p1')).toBe(1);
    });

    it('finds the longest run across a gap', async () => {
      queueRepo.find.mockResolvedValue([
        exec('2026-01-01'),
        exec('2026-01-02'),
        exec('2026-01-03'),
        exec('2026-01-05'),
        exec('2026-01-06'),
      ]);
      expect(await service.getLongestStreak('p1')).toBe(3);
    });
  });

  it('getFullAnalytics asserts ownership and returns the combined shape', async () => {
    queueRepo.createQueryBuilder.mockReturnValue(makeQb([]));
    queueRepo.find.mockResolvedValue([]);
    const result = await service.getFullAnalytics('user-1', 'p1');
    expect(projectRepo.count).toHaveBeenCalled();
    expect(result).toHaveProperty('summary');
    expect(result).toHaveProperty('dailyCommits');
    expect(result).toHaveProperty('weeklyTrends');
    expect(result).toHaveProperty('activeHours');
  });

  it('getFullAnalytics rejects when the project is not owned', async () => {
    projectRepo.count.mockResolvedValue(0);
    await expect(service.getFullAnalytics('intruder', 'p1')).rejects.toThrow();
  });
});
