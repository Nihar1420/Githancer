'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { useQueue } from '@/hooks/useCommitQueue';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, ErrorState } from '@/components/ui/States';
import type { CommitStatus } from '@/lib/types';

const statusVariant: Record<CommitStatus, 'neutral' | 'info' | 'success' | 'warning'> = {
  pending: 'neutral',
  in_flight: 'info',
  executed: 'success',
  skipped: 'warning',
};

export function CommitQueueTable({ projectId }: { projectId: string }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useQueue(projectId, page);

  if (isLoading) return <LoadingState />;
  if (isError || !data) return <ErrorState message="Could not load the queue." onRetry={() => refetch()} />;

  const totalPages = Math.max(1, Math.ceil(data.total / data.limit));

  return (
    <div className="overflow-hidden rounded-xl border border-gtm-border bg-gtm-surface">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gtm-border text-left text-gtm-muted">
              <th className="px-4 py-2 font-medium">#</th>
              <th className="px-4 py-2 font-medium">Scheduled</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Hash</th>
              <th className="px-4 py-2 font-medium">Executed</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((entry) => (
              <tr key={entry.id} className="border-b border-gtm-border/50 last:border-0">
                <td className="px-4 py-2 text-gtm-muted">{entry.queueIndex}</td>
                <td className="px-4 py-2 text-slate-200">
                  {format(new Date(entry.scheduledAt), 'MMM d, yyyy HH:mm')}
                </td>
                <td className="px-4 py-2">
                  <Badge variant={statusVariant[entry.status]}>{entry.status}</Badge>
                </td>
                <td className="px-4 py-2 font-mono text-xs text-gtm-muted">
                  {entry.commitHash ? entry.commitHash.slice(0, 7) : '—'}
                </td>
                <td className="px-4 py-2 text-gtm-muted">
                  {entry.executedAt ? format(new Date(entry.executedAt), 'MMM d, HH:mm') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-4 py-3 text-sm">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
          className="text-gtm-muted transition-colors hover:text-slate-200 disabled:opacity-40"
        >
          Prev
        </button>
        <span className="text-gtm-muted">
          Page {page} of {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="text-gtm-muted transition-colors hover:text-slate-200 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
