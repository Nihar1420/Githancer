'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { useQueue } from '@/hooks/useCommitQueue';
import { useSuggestCommit } from '@/hooks/useAI';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { LoadingState, ErrorState } from '@/components/ui/States';
import type { CommitStatus } from '@/lib/types';

const statusVariant: Record<CommitStatus, 'neutral' | 'info' | 'success' | 'warning'> = {
  pending: 'neutral',
  in_flight: 'info',
  executed: 'success',
  skipped: 'warning',
};

interface SuggestionState {
  loading: boolean;
  text?: string;
  error?: boolean;
}

export function CommitQueueTable({
  projectId,
  repoFullName,
  branch,
}: {
  projectId: string;
  repoFullName?: string;
  branch?: string;
}) {
  const [page, setPage] = useState(1);
  const [suggestions, setSuggestions] = useState<Record<string, SuggestionState>>({});
  const { data, isLoading, isError, refetch } = useQueue(projectId, page);
  const suggest = useSuggestCommit();

  async function handleSuggest(entryId: string) {
    setSuggestions((s) => ({ ...s, [entryId]: { loading: true } }));
    try {
      const res = await suggest.mutateAsync({
        repoFullName: repoFullName ?? '',
        branch: branch ?? 'main',
        recentMessages: [],
      });
      setSuggestions((s) => ({ ...s, [entryId]: { loading: false, text: res.suggestion } }));
    } catch {
      setSuggestions((s) => ({ ...s, [entryId]: { loading: false, error: true } }));
    }
  }

  if (isLoading) return <LoadingState />;
  if (isError || !data) return <ErrorState message="Could not load the queue." onRetry={() => refetch()} />;

  const totalPages = Math.max(1, Math.ceil(data.total / data.limit));

  return (
    <div className="overflow-hidden rounded-xl border border-gtm-border bg-gtm-surface">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gtm-border text-left text-gtm-muted">
              <th className="px-3 py-2 font-medium">#</th>
              <th className="px-3 py-2 font-medium">Scheduled</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Hash</th>
              <th className="px-3 py-2 font-medium">AI</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((entry) => {
              const suggestion = suggestions[entry.id];
              return (
                <tr key={entry.id} className="border-b border-gtm-border/50 align-top last:border-0">
                  <td className="px-3 py-2 text-gtm-muted">{entry.queueIndex}</td>
                  <td className="px-3 py-2 text-slate-200">
                    {format(new Date(entry.scheduledAt), 'MMM d, HH:mm')}
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant={statusVariant[entry.status]}>{entry.status}</Badge>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-gtm-muted">
                    {entry.commitHash ? entry.commitHash.slice(0, 7) : '—'}
                  </td>
                  <td className="px-3 py-2">
                    {entry.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleSuggest(entry.id)}
                          className="inline-flex items-center gap-1 text-xs text-gtm-accent hover:underline"
                        >
                          {suggestion?.loading ? <Spinner size="sm" /> : 'Suggest'}
                        </button>
                        {suggestion?.error && (
                          <div className="mt-1 text-xs text-gtm-muted">AI not available</div>
                        )}
                        {suggestion?.text && (
                          <div className="mt-2 rounded bg-slate-700 p-3 text-xs">
                            <div className="text-slate-200">AI suggests: {suggestion.text}</div>
                            <button
                              onClick={() => navigator.clipboard.writeText(suggestion.text ?? '')}
                              className="mt-2 text-gtm-accent hover:underline"
                            >
                              Copy
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
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
