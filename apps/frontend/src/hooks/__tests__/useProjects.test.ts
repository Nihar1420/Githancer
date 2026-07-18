import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { type ReactNode } from 'react';

vi.mock('@/lib/api', () => ({
  api: {
    projects: {
      list: vi.fn(() =>
        Promise.resolve([
          {
            project: { id: 'p1', repoFullName: 'a/b' },
            queueStats: { total: 1, pending: 1, executed: 0 },
          },
        ]),
      ),
      create: vi.fn(() =>
        Promise.resolve({ project: { id: 'p2' }, queueStats: { total: 0, pending: 0, executed: 0 } }),
      ),
    },
  },
}));

import { useProjects, useCreateProject } from '@/hooks/useProjects';
import { api } from '@/lib/api';

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client }, children);
}

describe('project hooks', () => {
  beforeEach(() => vi.clearAllMocks());

  it('useProjects returns data from the mock API', async () => {
    const { result } = renderHook(() => useProjects(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].project.repoFullName).toBe('a/b');
  });

  it('useCreateProject calls the create endpoint', async () => {
    const { result } = renderHook(() => useCreateProject(), { wrapper });
    await result.current.mutateAsync({
      repoFullName: 'a/b',
      branch: 'main',
      startDate: '2026-01-01',
      endDate: '2026-02-01',
      totalCommits: 5,
      schedulingMode: 'linear',
    });
    expect(api.projects.create).toHaveBeenCalledTimes(1);
  });
});
