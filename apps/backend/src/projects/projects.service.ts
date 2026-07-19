import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { QueueStats, SchedulerInput, SchedulingMode } from '@gtm/common';
import { generateSchedule } from '@gtm/scheduler';
import { Project } from './project.entity';
import { CommitQueue, CommitStatus } from '../commit-queue/commit-queue.entity';
import { CreateProjectDto } from './dtos/create-project.dto';
import { GithubService } from '../github/github.service';
import { UsersService } from '../users/users.service';

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_resolve, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms),
    ),
  ]);
}

export interface ProjectDetail {
  project: Project;
  queueStats: QueueStats;
  nextScheduledAt: Date | null;
}

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projects: Repository<Project>,
    @InjectRepository(CommitQueue)
    private readonly queue: Repository<CommitQueue>,
    private readonly github: GithubService,
    private readonly users: UsersService,
  ) {}

  async create(userId: string, dto: CreateProjectDto): Promise<ProjectDetail> {
    const [owner, repo] = dto.repoFullName.split('/');
    if (!owner || !repo) {
      throw new BadRequestException('repoFullName must be in "owner/repo" form');
    }

    // Best-effort branch validation — never block creation on it. Auth/scope,
    // rate-limit, 404, or timeout issues just log a warning and proceed; a real
    // branch problem surfaces later when the CLI pushes.
    try {
      const token = await this.users.getDecryptedToken(userId);
      const branchOk = await withTimeout(
        this.github.validateBranch(token, owner, repo, dto.branch),
        5000,
      );
      if (!branchOk) {
        console.warn(
          `[projects] Could not confirm ${dto.repoFullName}#${dto.branch}; creating anyway.`,
        );
      }
    } catch (error) {
      console.warn(
        `[projects] Skipping branch validation for ${dto.repoFullName}#${dto.branch}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    const input: SchedulerInput = {
      mode: dto.schedulingMode as unknown as SchedulingMode,
      startDate: dto.startDate,
      endDate: dto.endDate,
      totalCommits: dto.totalCommits,
      seed: `${userId}:${dto.repoFullName}:${dto.startDate}:${dto.endDate}`,
      workingDaysOnly: dto.workingDaysOnly,
      preferredHours: dto.preferredHours,
    };
    const schedule = generateSchedule(input);

    const user = await this.users.findById(userId);
    const saved = await this.projects.save(
      this.projects.create({
        owner: user,
        repoFullName: dto.repoFullName,
        branch: dto.branch,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        totalCommits: dto.totalCommits,
        schedulingMode: dto.schedulingMode,
        status: undefined,
        schedulerConfig: dto.schedulerConfig ?? null,
        workingDaysOnly: dto.workingDaysOnly ?? false,
        preferredHours: dto.preferredHours ?? null,
      }),
    );

    const rows = schedule.timestamps.map((ts, index) =>
      this.queue.create({
        project: saved,
        scheduledAt: new Date(ts),
        status: CommitStatus.PENDING,
        queueIndex: index,
      }),
    );
    await this.queue.save(rows);

    return this.detail(userId, saved.id);
  }

  async list(userId: string): Promise<ProjectDetail[]> {
    const projects = await this.projects.find({
      where: { owner: { id: userId } },
      order: { createdAt: 'DESC' },
    });
    return Promise.all(
      projects.map(async (project) => ({ project, ...(await this.buildStats(project.id)) })),
    );
  }

  async detail(userId: string, id: string): Promise<ProjectDetail> {
    const project = await this.projects.findOne({
      where: { id },
      relations: { owner: true },
    });
    if (!project || project.owner.id !== userId) {
      throw new NotFoundException('Project not found');
    }
    return { project, ...(await this.buildStats(id)) };
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.detail(userId, id); // asserts existence + ownership
    await this.queue.delete({ project: { id } });
    await this.projects.delete({ id });
  }

  private async buildStats(
    projectId: string,
  ): Promise<{ queueStats: QueueStats; nextScheduledAt: Date | null }> {
    const [total, executed, skipped, pending] = await Promise.all([
      this.queue.count({ where: { project: { id: projectId } } }),
      this.queue.count({ where: { project: { id: projectId }, status: CommitStatus.EXECUTED } }),
      this.queue.count({ where: { project: { id: projectId }, status: CommitStatus.SKIPPED } }),
      this.queue.count({
        where: {
          project: { id: projectId },
          status: In([CommitStatus.PENDING, CommitStatus.IN_FLIGHT]),
        },
      }),
    ]);
    const next = await this.queue.findOne({
      where: { project: { id: projectId }, status: CommitStatus.PENDING },
      order: { queueIndex: 'ASC' },
    });
    return {
      queueStats: { total, executed, pending, skipped },
      nextScheduledAt: next?.scheduledAt ?? null,
    };
  }
}
