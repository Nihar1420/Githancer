import type {
  Analytics,
  CommitQueueEntry,
  CreateProjectDto,
  PaginatedQueue,
  Project,
  ProjectWithStats,
  RepoSummary,
  UpdateProjectDto,
  User,
} from './types';

export const mockUser: User = {
  id: 'u1',
  username: 'nihar',
  avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4',
  timezone: 'UTC',
};

const DAY_MS = 86_400_000;

function buildQueue(projectId: string, total: number, executed: number): CommitQueueEntry[] {
  const start = new Date('2026-01-05T09:30:00Z').getTime();
  const items: CommitQueueEntry[] = [];
  for (let i = 0; i < total; i++) {
    const scheduledAt = new Date(start + i * 1.5 * DAY_MS).toISOString();
    const done = i < executed;
    items.push({
      id: `${projectId}-q${i}`,
      scheduledAt,
      status: done ? 'executed' : 'pending',
      commitHash: done ? `c${i.toString(16).padStart(6, '0')}` : null,
      executedAt: done ? scheduledAt : null,
      queueIndex: i,
    });
  }
  return items;
}

const projectsSeed: Project[] = [
  {
    id: 'proj-1',
    repoFullName: 'nihar/portfolio',
    branch: 'main',
    status: 'active',
    startDate: '2026-01-05',
    endDate: '2026-06-30',
    totalCommits: 40,
    schedulingMode: 'human_like',
    workingDaysOnly: true,
    preferredHours: [10, 14, 16],
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'proj-2',
    repoFullName: 'nihar/api-server',
    branch: 'develop',
    status: 'paused',
    startDate: '2026-02-01',
    endDate: '2026-08-01',
    totalCommits: 60,
    schedulingMode: 'linear',
    workingDaysOnly: false,
    preferredHours: null,
    createdAt: '2026-01-15T00:00:00Z',
  },
  {
    id: 'proj-3',
    repoFullName: 'nihar/dotfiles',
    branch: 'main',
    status: 'completed',
    startDate: '2025-09-01',
    endDate: '2025-12-31',
    totalCommits: 30,
    schedulingMode: 'sprint',
    workingDaysOnly: true,
    preferredHours: null,
    createdAt: '2025-08-20T00:00:00Z',
  },
];

const statsSeed: Record<string, { total: number; executed: number }> = {
  'proj-1': { total: 40, executed: 12 },
  'proj-2': { total: 60, executed: 0 },
  'proj-3': { total: 30, executed: 30 },
};

const queues: Record<string, CommitQueueEntry[]> = Object.fromEntries(
  projectsSeed.map((p) => [p.id, buildQueue(p.id, statsSeed[p.id].total, statsSeed[p.id].executed)]),
);

function toWithStats(project: Project): ProjectWithStats {
  const q = queues[project.id] ?? [];
  const executed = q.filter((e) => e.status === 'executed').length;
  const next = q.find((e) => e.status === 'pending');
  return {
    project,
    queueStats: { total: q.length, pending: q.filter((e) => e.status === 'pending').length, executed },
    nextScheduledAt: next?.scheduledAt ?? null,
  };
}

export const mockProjects: ProjectWithStats[] = projectsSeed.map(toWithStats);

export function getMockProject(id: string): ProjectWithStats {
  const found = projectsSeed.find((p) => p.id === id);
  return toWithStats(found ?? projectsSeed[0]);
}

export function getMockQueueEntries(projectId: string): CommitQueueEntry[] {
  return queues[projectId] ?? queues['proj-1'];
}

export function getMockQueue(projectId: string, page: number, limit: number): PaginatedQueue {
  const all = getMockQueueEntries(projectId);
  const startIndex = (page - 1) * limit;
  return { items: all.slice(startIndex, startIndex + limit), total: all.length, page, limit };
}

export function createMockProject(dto: CreateProjectDto): ProjectWithStats {
  const project: Project = {
    id: `proj-${Date.now()}`,
    repoFullName: dto.repoFullName,
    branch: dto.branch,
    status: 'active',
    startDate: dto.startDate,
    endDate: dto.endDate,
    totalCommits: dto.totalCommits,
    schedulingMode: dto.schedulingMode,
    workingDaysOnly: dto.workingDaysOnly ?? false,
    preferredHours: dto.preferredHours ?? null,
    createdAt: new Date().toISOString(),
  };
  queues[project.id] = buildQueue(project.id, dto.totalCommits, 0);
  return { project, queueStats: { total: dto.totalCommits, pending: dto.totalCommits, executed: 0 } };
}

export function updateMockProject(id: string, dto: UpdateProjectDto): ProjectWithStats {
  const current = getMockProject(id);
  const totalCommits = dto.totalCommits ?? current.project.totalCommits;
  const project: Project = {
    ...current.project,
    branch: dto.branch ?? current.project.branch,
    startDate: dto.startDate ?? current.project.startDate,
    endDate: dto.endDate ?? current.project.endDate,
    totalCommits,
    schedulingMode: dto.schedulingMode ?? current.project.schedulingMode,
    workingDaysOnly: dto.workingDaysOnly ?? current.project.workingDaysOnly,
    preferredHours: dto.preferredHours ?? current.project.preferredHours,
  };
  const executed = current.queueStats.executed;
  // Preserve executed history, then append the regenerated pending rows.
  queues[project.id] = buildQueue(project.id, executed + totalCommits, executed);
  return {
    project,
    queueStats: { total: executed + totalCommits, pending: totalCommits, executed },
  };
}

export const mockRepos: RepoSummary[] = [
  { fullName: 'nihar/portfolio', defaultBranch: 'main', isPrivate: false, pushedAt: '2026-07-10T12:00:00Z' },
  { fullName: 'nihar/api-server', defaultBranch: 'develop', isPrivate: true, pushedAt: '2026-07-01T09:00:00Z' },
  { fullName: 'nihar/dotfiles', defaultBranch: 'main', isPrivate: false, pushedAt: '2026-06-22T18:30:00Z' },
  { fullName: 'nihar/experiments', defaultBranch: 'main', isPrivate: true, pushedAt: '2026-05-14T08:15:00Z' },
];

export const mockBranches: string[] = ['main', 'develop', 'feature/ui', 'release/1.0'];

export function getMockAnalytics(projectId: string): Analytics {
  const entries = getMockQueueEntries(projectId);
  const byDay = new Map<string, number>();
  const activeHours = new Map<string, number>();
  for (const e of entries) {
    const d = new Date(e.scheduledAt);
    const dayKey = e.scheduledAt.slice(0, 10);
    byDay.set(dayKey, (byDay.get(dayKey) ?? 0) + 1);
    const dow = (d.getUTCDay() + 6) % 7; // Monday = 0
    const key = `${dow}:${d.getUTCHours()}`;
    activeHours.set(key, (activeHours.get(key) ?? 0) + 1);
  }
  const dailyCommits = Array.from(byDay.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 30);
  const activeHoursArr = Array.from(activeHours.entries()).map(([k, count]) => {
    const [day, hour] = k.split(':').map(Number);
    return { day, hour, count };
  });
  const peakHour = activeHoursArr.reduce((peak, cur) => (cur.count > peak.count ? cur : peak), {
    day: 0,
    hour: 10,
    count: 0,
  }).hour;
  return {
    totalCommits: entries.length,
    completed: entries.filter((e) => e.status === 'executed').length,
    longestStreak: 5,
    peakHour,
    dailyCommits,
    activeHours: activeHoursArr,
  };
}
