import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  ActiveHour,
  AnalyticsSummary,
  DailyCommit,
  FullAnalytics,
  WeeklyTrend,
} from '@gtm/common';
import { CommitQueue, CommitStatus } from '../commit-queue/commit-queue.entity';
import { Project } from '../projects/project.entity';

const DAY_MS = 86_400_000;

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(CommitQueue)
    private readonly queue: Repository<CommitQueue>,
    @InjectRepository(Project)
    private readonly projects: Repository<Project>,
  ) {}

  private async assertOwnership(userId: string, projectId: string): Promise<void> {
    const owned = await this.projects.count({
      where: { id: projectId, owner: { id: userId } },
    });
    if (owned === 0) {
      throw new NotFoundException('Project not found');
    }
  }

  async getDailyCommits(projectId: string): Promise<DailyCommit[]> {
    const rows = await this.queue
      .createQueryBuilder('cq')
      .innerJoin('cq.project', 'project')
      .select("TO_CHAR(cq.executedAt, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('project.id = :projectId', { projectId })
      .andWhere('cq.status = :status', { status: CommitStatus.EXECUTED })
      .andWhere('cq.executedAt IS NOT NULL')
      .groupBy("TO_CHAR(cq.executedAt, 'YYYY-MM-DD')")
      .orderBy('date', 'ASC')
      .getRawMany<{ date: string; count: string }>();
    return rows.map((r) => ({ date: r.date, count: Number(r.count) }));
  }

  async getWeeklyTrends(projectId: string): Promise<WeeklyTrend[]> {
    const rows = await this.queue
      .createQueryBuilder('cq')
      .innerJoin('cq.project', 'project')
      .select("TO_CHAR(DATE_TRUNC('week', cq.executedAt), 'YYYY-MM-DD')", 'weekStart')
      .addSelect('COUNT(*)', 'count')
      .where('project.id = :projectId', { projectId })
      .andWhere('cq.status = :status', { status: CommitStatus.EXECUTED })
      .andWhere('cq.executedAt IS NOT NULL')
      .groupBy("DATE_TRUNC('week', cq.executedAt)")
      .orderBy("DATE_TRUNC('week', cq.executedAt)", 'ASC')
      .getRawMany<{ weekStart: string; count: string }>();
    return rows.map((r) => ({ weekStart: r.weekStart, count: Number(r.count) }));
  }

  /** Fetch execution dates and compute the longest run of consecutive days (pure JS). */
  async getLongestStreak(projectId: string): Promise<number> {
    const rows = await this.queue.find({
      where: { project: { id: projectId }, status: CommitStatus.EXECUTED },
      select: ['id', 'executedAt'],
    });
    const days = Array.from(
      new Set(
        rows
          .filter((r) => r.executedAt)
          .map((r) => new Date(r.executedAt).toISOString().slice(0, 10)),
      ),
    ).sort();

    let max = 0;
    let current = 0;
    let prev: number | null = null;
    for (const day of days) {
      const t = new Date(`${day}T00:00:00Z`).getTime();
      current = prev !== null && t - prev === DAY_MS ? current + 1 : 1;
      if (current > max) max = current;
      prev = t;
    }
    return max;
  }

  async getActiveHours(projectId: string): Promise<ActiveHour[]> {
    const rows = await this.queue
      .createQueryBuilder('cq')
      .innerJoin('cq.project', 'project')
      .select('EXTRACT(DOW FROM cq.executedAt)', 'dayOfWeek')
      .addSelect('EXTRACT(HOUR FROM cq.executedAt)', 'hour')
      .addSelect('COUNT(*)', 'count')
      .where('project.id = :projectId', { projectId })
      .andWhere('cq.status = :status', { status: CommitStatus.EXECUTED })
      .andWhere('cq.executedAt IS NOT NULL')
      .groupBy('EXTRACT(DOW FROM cq.executedAt)')
      .addGroupBy('EXTRACT(HOUR FROM cq.executedAt)')
      .getRawMany<{ dayOfWeek: string; hour: string; count: string }>();
    return rows.map((r) => ({
      dayOfWeek: Number(r.dayOfWeek),
      hour: Number(r.hour),
      count: Number(r.count),
    }));
  }

  async getSummary(projectId: string): Promise<AnalyticsSummary> {
    const [total, executed, pending] = await Promise.all([
      this.queue.count({ where: { project: { id: projectId } } }),
      this.queue.count({ where: { project: { id: projectId }, status: CommitStatus.EXECUTED } }),
      this.queue.count({
        where: {
          project: { id: projectId },
          status: In([CommitStatus.PENDING, CommitStatus.IN_FLIGHT]),
        },
      }),
    ]);
    const [longestStreak, activeHours] = await Promise.all([
      this.getLongestStreak(projectId),
      this.getActiveHours(projectId),
    ]);
    const peak = activeHours.reduce<ActiveHour>(
      (best, cur) => (cur.count > best.count ? cur : best),
      { dayOfWeek: 0, hour: 0, count: 0 },
    );
    return {
      totalCommits: total,
      executedCommits: executed,
      pendingCommits: pending,
      longestStreak,
      peakHour: peak.hour,
      peakDay: peak.dayOfWeek,
      completionPercentage: total > 0 ? Math.round((executed / total) * 100) : 0,
    };
  }

  async getFullAnalytics(userId: string, projectId: string): Promise<FullAnalytics> {
    await this.assertOwnership(userId, projectId);
    const [summary, dailyCommits, weeklyTrends, activeHours] = await Promise.all([
      this.getSummary(projectId),
      this.getDailyCommits(projectId),
      this.getWeeklyTrends(projectId),
      this.getActiveHours(projectId),
    ]);
    return { summary, dailyCommits, weeklyTrends, activeHours };
  }
}
