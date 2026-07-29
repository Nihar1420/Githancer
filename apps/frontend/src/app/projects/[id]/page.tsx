'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useProject, useDeleteProject } from '@/hooks/useProjects';
import { useFullQueue } from '@/hooks/useCommitQueue';
import { Navbar } from '@/components/layout/Navbar';
import { HeatmapPreview } from '@/components/timeline/HeatmapPreview';
import { TimelineEditor } from '@/components/timeline/TimelineEditor';
import { CommitQueueTable } from '@/components/timeline/CommitQueueTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EditProjectModal } from '@/components/dashboard/EditProjectModal';
import { LoadingState, ErrorState } from '@/components/ui/States';
import type { ProjectStatus } from '@/lib/types';

const statusVariant: Record<ProjectStatus, 'info' | 'warning' | 'success'> = {
  active: 'info',
  paused: 'warning',
  completed: 'success',
};

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useProject(id);
  const queueQuery = useFullQueue(id);
  const del = useDeleteProject();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [toast, setToast] = useState('');

  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-8">
          <LoadingState />
        </main>
      </>
    );
  }
  if (isError || !data) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-8">
          <ErrorState message="Could not load project." onRetry={() => refetch()} />
        </main>
      </>
    );
  }

  const { project, queueStats } = data;
  const percent = queueStats.total > 0 ? Math.round((queueStats.executed / queueStats.total) * 100) : 0;
  const entries = queueQuery.data?.items ?? [];
  const nextPending = entries.find((e) => e.status === 'pending');

  async function onDelete() {
    await del.mutateAsync(id);
    router.push('/dashboard');
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-100">{project.repoFullName}</h1>
              <span className="rounded bg-slate-600 px-1.5 py-0.5 text-xs text-slate-200">
                {project.branch}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <Badge variant={statusVariant[project.status]}>{project.status}</Badge>
              <Link
                href={`/projects/${id}/analytics`}
                className="text-sm text-gtm-accent hover:underline"
              >
                View analytics →
              </Link>
              <Link
                href={`/cli-setup?projectId=${id}`}
                className="text-sm text-gtm-accent hover:underline"
              >
                Set up CLI →
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {project.status !== 'completed' && (
              <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                </svg>
                Edit
              </Button>
            )}
            <Button variant="danger" size="sm" onClick={() => setConfirmOpen(true)}>
              Delete project
            </Button>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-gtm-border bg-gtm-surface p-5">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-slate-200">
              {queueStats.executed} / {queueStats.total} completed
            </span>
            <span className="text-gtm-muted">
              {nextPending
                ? `Next: ${format(new Date(nextPending.scheduledAt), 'MMM d, yyyy HH:mm')}`
                : 'Queue complete'}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-700">
            <div className="h-full bg-gtm-accent" style={{ width: `${percent}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {queueQuery.isLoading ? <LoadingState /> : <HeatmapPreview commitQueue={entries} />}
            {entries.length > 0 && <TimelineEditor projectId={id} queue={entries} />}
          </div>
          <div className="lg:col-span-1">
            <CommitQueueTable
              projectId={id}
              repoFullName={project.repoFullName}
              branch={project.branch}
            />
          </div>
        </div>
      </main>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Delete project?">
        <p className="text-sm text-gtm-muted">
          This permanently removes the project and its commit queue.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" loading={del.isPending} onClick={onDelete}>
            Delete
          </Button>
        </div>
      </Modal>

      {editOpen && (
        <EditProjectModal
          project={project}
          onClose={() => setEditOpen(false)}
          onSuccess={() => {
            setToast('✓ Project updated');
            window.setTimeout(() => setToast(''), 3000);
          }}
        />
      )}

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 rounded-lg border border-gtm-border bg-gtm-surface px-4 py-3 text-sm text-slate-100 shadow-xl"
        >
          {toast}
        </div>
      )}
    </>
  );
}
