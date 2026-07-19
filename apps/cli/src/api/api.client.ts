import axios, { AxiosInstance } from 'axios';
import { TimelineConfig } from '../config/config.service';

export class CLIAuthError extends Error {}
export class CLIOfflineError extends Error {}

interface NextCommitResponse {
  id: string;
  scheduledAt: string;
}

interface QueueItem {
  id: string;
  status: string;
  scheduledAt: string;
  queueIndex: number;
}

interface QueueResponse {
  items: QueueItem[];
  total: number;
  page: number;
  limit: number;
}

interface ProjectDetailResponse {
  queueStats: { total: number; pending: number; executed: number };
}

export interface StatusSummary {
  completed: number;
  remaining: number;
  nextScheduledAt: string | null;
}

export interface CommitMessageContext {
  repoFullName: string;
  branch: string;
  recentMessages: string[];
  projectDescription?: string;
}

export class ApiClient {
  private readonly http: AxiosInstance;

  constructor(config: TimelineConfig) {
    this.http = axios.create({
      baseURL: config.apiUrl,
      timeout: 10_000,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'X-User-Id': config.userId,
      },
    });
  }

  private fail(error: unknown): never {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new CLIAuthError('Run "timeline init" to re-authenticate');
      }
      if (!error.response) {
        throw new CLIOfflineError('No connection — using cached timestamps');
      }
    }
    throw error instanceof Error ? error : new Error(String(error));
  }

  async getNextCommit(projectId: string): Promise<NextCommitResponse> {
    try {
      const { data } = await this.http.get<NextCommitResponse>(
        `/api/v1/projects/${projectId}/next-commit`,
      );
      return data;
    } catch (error) {
      return this.fail(error);
    }
  }

  async markExecuted(entryId: string, commitHash: string): Promise<void> {
    try {
      await this.http.patch(`/api/v1/commit-queue/${entryId}`, {
        commitHash,
        status: 'executed',
      });
    } catch (error) {
      this.fail(error);
    }
  }

  async syncTimestamps(projectId: string): Promise<string[]> {
    try {
      const { data } = await this.http.get<QueueResponse>(
        `/api/v1/projects/${projectId}/queue`,
        { params: { page: 1, limit: 1000 } },
      );
      return data.items
        .filter((item) => item.status === 'pending')
        .map((item) => new Date(item.scheduledAt).toISOString());
    } catch (error) {
      return this.fail(error);
    }
  }

  async getStatus(projectId: string): Promise<StatusSummary> {
    try {
      const { data } = await this.http.get<ProjectDetailResponse>(
        `/api/v1/projects/${projectId}`,
      );
      return {
        completed: data.queueStats.executed,
        remaining: data.queueStats.pending,
        nextScheduledAt: null,
      };
    } catch (error) {
      return this.fail(error);
    }
  }

  /** Ask the backend for an AI commit-message suggestion. Returns null if unavailable. */
  async suggestCommit(context: CommitMessageContext): Promise<string | null> {
    try {
      const { data } = await this.http.post<{ suggestion: string }>(
        '/api/v1/ai/suggest-commit',
        context,
      );
      return data.suggestion;
    } catch {
      // AI not configured (503), offline, or rate-limited — fall back silently.
      return null;
    }
  }
}
