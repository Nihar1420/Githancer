import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import type { ProjectWithStats } from '@/lib/types';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

const data: ProjectWithStats = {
  project: {
    id: 'p1',
    repoFullName: 'nihar/portfolio',
    branch: 'main',
    status: 'active',
    startDate: '2026-01-01',
    endDate: '2026-06-30',
    totalCommits: 40,
    schedulingMode: 'linear',
    workingDaysOnly: false,
    preferredHours: null,
    createdAt: '2026-01-01T00:00:00Z',
  },
  queueStats: { total: 40, pending: 28, executed: 12 },
  nextScheduledAt: '2026-03-01T10:00:00Z',
};

describe('ProjectCard', () => {
  it('renders repo name, status badge, and progress stats', () => {
    render(<ProjectCard data={data} />);
    expect(screen.getByText('nihar/portfolio')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText(/12 completed/)).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument(); // 12 / 40
  });
});
