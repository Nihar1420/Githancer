import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommitQueue, CommitStatus } from './commit-queue.entity';

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
  constructor(
    @InjectRepository(CommitQueue)
    private readonly queue: Repository<CommitQueue>,
  ) {}

  /** Pop the next pending entry (lowest queueIndex) and lock it as IN_FLIGHT. */
  async nextCommit(projectId: string): Promise<NextCommit> {
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
    id: string,
    status: CommitStatus.EXECUTED | CommitStatus.SKIPPED,
    commitHash?: string,
  ): Promise<CommitQueue> {
    const entry = await this.queue.findOne({ where: { id } });
    if (!entry) {
      throw new NotFoundException('Commit queue entry not found');
    }
    entry.status = status;
    entry.executedAt = new Date();
    if (commitHash) {
      entry.commitHash = commitHash;
    }
    return this.queue.save(entry);
  }

  async list(projectId: string, page = 1, limit = 20): Promise<PaginatedQueue> {
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

  async reorder(projectId: string, order: string[]): Promise<PaginatedQueue> {
    await Promise.all(
      order.map((id, index) => this.queue.update({ id }, { queueIndex: index })),
    );
    return this.list(projectId, 1, order.length);
  }
}
