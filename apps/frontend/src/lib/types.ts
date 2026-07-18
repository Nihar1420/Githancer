export type SchedulingMode = 'linear' | 'random' | 'sprint' | 'human_like' | 'team';
export type ProjectStatus = 'active' | 'paused' | 'completed';
export type CommitStatus = 'pending' | 'in_flight' | 'executed' | 'skipped';

export interface User {
  id: string;
  username: string;
  avatarUrl: string;
  timezone: string;
}

export interface QueueStats {
  total: number;
  pending: number;
  executed: number;
}

export interface Project {
  id: string;
  repoFullName: string;
  branch: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  totalCommits: number;
  schedulingMode: SchedulingMode;
  workingDaysOnly: boolean;
  preferredHours: number[] | null;
  createdAt: string;
}

export interface ProjectWithStats {
  project: Project;
  queueStats: QueueStats;
  nextScheduledAt?: string | null;
}

export interface CommitQueueEntry {
  id: string;
  scheduledAt: string;
  status: CommitStatus;
  commitHash: string | null;
  executedAt: string | null;
  queueIndex: number;
}

export interface PaginatedQueue {
  items: CommitQueueEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface RepoSummary {
  fullName: string;
  defaultBranch: string;
  isPrivate: boolean;
  pushedAt: string | null;
}

export interface CreateProjectDto {
  repoFullName: string;
  branch: string;
  startDate: string;
  endDate: string;
  totalCommits: number;
  schedulingMode: SchedulingMode;
  workingDaysOnly?: boolean;
  preferredHours?: number[];
}

export interface DailyCommit {
  date: string;
  count: number;
}

export interface ActiveHourCell {
  day: number; // 0 = Monday .. 6 = Sunday
  hour: number; // 0..23
  count: number;
}

export interface Analytics {
  totalCommits: number;
  completed: number;
  longestStreak: number;
  peakHour: number;
  dailyCommits: DailyCommit[];
  activeHours: ActiveHourCell[];
}

export interface CommitMessageContext {
  repoFullName: string;
  branch: string;
  recentMessages: string[];
  projectDescription?: string;
}

export const SCHEDULING_MODES: { value: SchedulingMode; label: string; description: string }[] = [
  { value: 'linear', label: 'Linear', description: 'Even spread across your date range' },
  { value: 'random', label: 'Random', description: 'Randomized distribution, seeded for reproducibility' },
  { value: 'sprint', label: 'Sprint', description: 'Burst periods followed by quiet periods' },
  { value: 'human_like', label: 'Human-like', description: 'Natural Gaussian spread around preferred hours' },
  { value: 'team', label: 'Team', description: 'Coordinated spread across team members' },
];
