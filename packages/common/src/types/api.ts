import type { SchedulingMode } from './scheduler';
import type { ProjectStatus } from './project';

/**
 * API request/response DTOs shared between backend, frontend, and CLI.
 * Stubs for Phase 1 — expanded as endpoints are implemented in Phase 2-3.
 */

export interface CreateProjectDto {
  repoFullName: string;
  branch: string;
  startDate: string;
  endDate: string;
  totalCommits: number;
  schedulingMode: SchedulingMode;
  workingDaysOnly?: boolean;
  preferredHours?: number[];
  schedulerConfig?: Record<string, unknown>;
}

export interface ProjectSummaryDto {
  id: string;
  repoFullName: string;
  branch: string;
  status: ProjectStatus;
  totalCommits: number;
  executedCommits: number;
}

export interface NextCommitDto {
  commitQueueId: string;
  scheduledAt: string;
  queueIndex: number;
}
