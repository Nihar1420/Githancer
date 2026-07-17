import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommitQueue, CommitStatus } from './commit-queue.entity';
import { Project } from '../projects/project.entity';

export interface NextCommit {
  id: string;
  scheduledAt: Date;
}

export interface PaginatedQueue {
  items: CommitQueue[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class CommitQueueService {
  private readonly rateLog = new Map<string, number[]>();
  private readonly RATE_LIMIT = 10;
  private readonly RATE_WINDOW_MS = 60_000;

  constructor(
    @InjectRepository(CommitQueue)
    private readonly queue: Repository<CommitQueue>,
    @InjectRepository(Project)
    private readonly projects: Repository<Project>,
  ) {}

  /** Per-project sliding-window rate limit (10 requests / 60s). */
  private enforceRateLimit(projectId: string): void {
    const now = Date.now();
    const recent = (this.rateLog.get(projectId) ?? []).filter(
      (t) => now - t < this.RATE_WINDOW_MS,
    );
    if (recent.length >= this.RATE_LIMIT) {
      const retryAfter = Math.ceil((this.RATE_WINDOW_MS - (now - recent[0])) / 1000);
      throw new HttpException(
        { message: 'Rate limit exceeded', retryAfter },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    recent.push(now);
    this.rateLog.set(projectId, recent);
  }

  private async assertOwnership(userId: string, projectId: string): Promise<void> {
    const owned = await this.projects.count({
      where: { id: projectId, owner: { id: userId } },
    });
    if (owned === 0) {
      throw new NotFoundException('Project not found');
    }
  }

  /** Pop the next pending entry (lowest queueIndex) and lock it as IN_FLIGHT. */
  async nextCommit(userId: string, projectId: string): Promise<NextCommit> {
    this.enforceRateLimit(projectId);
    await this.assertOwnership(userId, projectId);
    const next = await this.queue.findOne({
      where: { project: { id: projectId }, status: CommitStatus.PENDING },
      order: { queueIndex: 'ASC' },
    });
    if (!next) {
      throw new NotFoundException('No pending commits in the queue');
    }
    next.status = CommitStatus.IN_FLIGHT;
    const saved = await this.queue.save(next);
    return { id: saved.id, scheduledAt: saved.scheduledAt };
  }

  async markExecuted(
    userId: string,
    id: string,
    status: CommitStatus.EXECUTED | CommitStatus.SKIPPED,
    commitHash?: string,
  ): Promise<CommitQueue> {
    const entry = await this.queue.findOne({
      where: { id },
      relations: { project: { owner: true } },
    });
    if (!entry || entry.project?.owner?.id !== userId) {
      throw new NotFoundException('Commit queue entry not found');
    }
    entry.status = status;
    entry.executedAt = new Date();
    if (commitHash) {
      entry.commitHash = commitHash;
    }
    return this.queue.save(entry);
  }

  async list(
    userId: string,
    projectId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedQueue> {
    await this.assertOwnership(userId, projectId);
    const safePage = page > 0 ? page : 1;
    const safeLimit = limit > 0 ? limit : 20;
    const [items, total] = await this.queue.findAndCount({
      where: { project: { id: projectId } },
      order: { queueIndex: 'ASC' },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    });
    return { items, total, page: safePage, limit: safeLimit };
  }

  async reorder(
    userId: string,
    projectId: string,
    order: string[],
  ): Promise<PaginatedQueue> {
    await this.assertOwnership(userId, projectId);
    await Promise.all(
      order.map((id, index) => this.queue.update({ id }, { queueIndex: index })),
    );
    return this.list(userId, projectId, 1, order.length);
  }
}
