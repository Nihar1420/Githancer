import axios from 'axios';
import type {
  Analytics,
  CreateProjectDto,
  PaginatedQueue,
  ProjectWithStats,
  RepoSummary,
  User,
} from './types';
import * as mock from './mock-data';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
/** Mock mode is ON unless explicitly disabled — lets the UI run without a backend. */
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';

const http = axios.create({ baseURL: BASE_URL, withCredentials: true });

http.interceptors.response.use(
  (res) => res,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      typeof window !== 'undefined'
    ) {
      window.location.href = '/';
    }
    return Promise.reject(error);
  },
);

/** Simulate network latency for mock responses so loading states are visible. */
const mocked = <T>(data: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(data), 150));

export const api = {
  auth: {
    async logout(): Promise<void> {
      if (USE_MOCK) return mocked(undefined);
      await http.post('/api/v1/auth/logout');
    },
  },
  users: {
    async getMe(): Promise<User> {
      if (USE_MOCK) return mocked(mock.mockUser);
      return (await http.get<User>('/api/v1/users/me')).data;
    },
    async updateTimezone(timezone: string): Promise<User> {
      if (USE_MOCK) return mocked({ ...mock.mockUser, timezone });
      return (await http.patch<User>('/api/v1/users/me', { timezone })).data;
    },
  },
  github: {
    async listRepos(): Promise<RepoSummary[]> {
      if (USE_MOCK) return mocked(mock.mockRepos);
      return (await http.get<RepoSummary[]>('/api/v1/github/repos')).data;
    },
    async listBranches(owner: string, repo: string): Promise<string[]> {
      if (USE_MOCK) return mocked(mock.mockBranches);
      return (await http.get<string[]>(`/api/v1/github/repos/${owner}/${repo}/branches`)).data;
    },
  },
  projects: {
    async list(): Promise<ProjectWithStats[]> {
      if (USE_MOCK) return mocked(mock.mockProjects);
      return (await http.get<ProjectWithStats[]>('/api/v1/projects')).data;
    },
    async get(id: string): Promise<ProjectWithStats> {
      if (USE_MOCK) return mocked(mock.getMockProject(id));
      return (await http.get<ProjectWithStats>(`/api/v1/projects/${id}`)).data;
    },
    async create(dto: CreateProjectDto): Promise<ProjectWithStats> {
      if (USE_MOCK) return mocked(mock.createMockProject(dto));
      return (await http.post<ProjectWithStats>('/api/v1/projects', dto)).data;
    },
    async delete(id: string): Promise<void> {
      if (USE_MOCK) return mocked(undefined);
      await http.delete(`/api/v1/projects/${id}`);
    },
  },
  queue: {
    async getNext(projectId: string): Promise<{ id: string; scheduledAt: string }> {
      if (USE_MOCK) {
        const next = mock.getMockQueueEntries(projectId).find((e) => e.status === 'pending');
        return mocked({ id: next?.id ?? '', scheduledAt: next?.scheduledAt ?? '' });
      }
      return (await http.get<{ id: string; scheduledAt: string }>(
        `/api/v1/projects/${projectId}/next-commit`,
      )).data;
    },
    async markExecuted(entryId: string, hash: string): Promise<void> {
      if (USE_MOCK) return mocked(undefined);
      await http.patch(`/api/v1/commit-queue/${entryId}`, { commitHash: hash, status: 'executed' });
    },
    async getQueue(projectId: string, page: number, limit: number): Promise<PaginatedQueue> {
      if (USE_MOCK) return mocked(mock.getMockQueue(projectId, page, limit));
      return (await http.get<PaginatedQueue>(`/api/v1/projects/${projectId}/queue`, {
        params: { page, limit },
      })).data;
    },
    async reorder(projectId: string, ids: string[]): Promise<void> {
      if (USE_MOCK) return mocked(undefined);
      await http.put(`/api/v1/projects/${projectId}/queue/reorder`, { order: ids });
    },
  },
  analytics: {
    async get(projectId: string): Promise<Analytics> {
      if (USE_MOCK) return mocked(mock.getMockAnalytics(projectId));
      return (await http.get<Analytics>(`/api/v1/analytics/${projectId}`)).data;
    },
  },
};
