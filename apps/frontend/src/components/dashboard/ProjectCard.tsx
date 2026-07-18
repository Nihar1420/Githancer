'use client';

import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import type { ProjectStatus, ProjectWithStats } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';

const statusVariant: Record<ProjectStatus, 'info' | 'warning' | 'success'> = {
  active: 'info',
  paused: 'warning',
  completed: 'success',
};

function ProgressRing({ percent }: { percent: number }) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" className="shrink-0">
      <circle cx="26" cy="26" r={radius} fill="none" stroke="#334155" strokeWidth="5" />
      <circle
        cx="26"
        cy="26"
        r={radius}
        fill="none"
        stroke="#6366f1"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 26 26)"
      />
      <text x="26" y="30" textAnchor="middle" className="fill-slate-100 text-[11px] font-semibold">
        {percent}%
      </text>
    </svg>
  );
}

export function ProjectCard({ data }: { data: ProjectWithStats }) {
  const router = useRouter();
  const { project, queueStats, nextScheduledAt } = data;
  const percent =
    queueStats.total > 0 ? Math.round((queueStats.executed / queueStats.total) * 100) : 0;

  return (
    <button
      onClick={() => router.push(`/projects/${project.id}`)}
      className="w-full rounded-xl border border-gtm-border bg-gtm-surface p-5 text-left transition-colors hover:border-gtm-accent/60"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold text-slate-100">{project.repoFullName}</h3>
            <span className="rounded bg-slate-600 px-1.5 py-0.5 text-xs text-slate-200">
              {project.branch}
            </span>
          </div>
          <div className="mt-2">
            <Badge variant={statusVariant[project.status]}>{project.status}</Badge>
          </div>
        </div>
        <ProgressRing percent={percent} />
      </div>

      <div className="mt-4 text-sm text-gtm-muted">
        {queueStats.executed} completed · {queueStats.pending} remaining
      </div>
      <div className="mt-1 text-sm text-gtm-muted">
        Next commit:{' '}
        <span className="text-slate-300">
          {project.status === 'completed' || !nextScheduledAt
            ? 'Queue complete'
            : format(new Date(nextScheduledAt), 'MMM d, yyyy · HH:mm')}
        </span>
      </div>
    </button>
  );
}
