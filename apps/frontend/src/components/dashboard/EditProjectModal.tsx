'use client';

import { useState } from 'react';
import { useUpdateProject } from '@/hooks/useProjects';
import { SchedulingModeSelector } from '@/components/timeline/SchedulingModeSelector';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { Project, SchedulingMode } from '@/lib/types';

const inputClass =
  'w-full rounded-lg border border-gtm-border bg-gtm-surface px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-gtm-accent focus:outline-none';

function hourLabel(h: number): string {
  return `${h % 12 || 12}${h < 12 ? 'am' : 'pm'}`;
}

/** ISO datetime → YYYY-MM-DD for <input type="date">. */
function toDateInput(value: string): string {
  return value.slice(0, 10);
}

interface EditProjectModalProps {
  project: Project;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditProjectModal({ project, onClose, onSuccess }: EditProjectModalProps) {
  const [startDate, setStartDate] = useState(toDateInput(project.startDate));
  const [endDate, setEndDate] = useState(toDateInput(project.endDate));
  const [totalCommits, setTotalCommits] = useState(project.totalCommits);
  const [mode, setMode] = useState<SchedulingMode>(project.schedulingMode);
  const [workingDaysOnly, setWorkingDaysOnly] = useState(project.workingDaysOnly);
  const [preferredHours, setPreferredHours] = useState<number[]>(
    project.preferredHours ?? [10, 14, 16],
  );
  const [branch, setBranch] = useState(project.branch);
  const [error, setError] = useState('');

  const update = useUpdateProject(project.id);

  function toggleHour(h: number) {
    setPreferredHours((prev) =>
      prev.includes(h) ? prev.filter((x) => x !== h) : [...prev, h].sort((a, b) => a - b),
    );
  }

  function validate(): boolean {
    if (!startDate || !endDate) {
      setError('Start and end dates are required.');
      return false;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setError('End date must be after start date.');
      return false;
    }
    if (totalCommits < 1 || totalCommits > 365) {
      setError('Total commits must be between 1 and 365.');
      return false;
    }
    if (!branch.trim()) {
      setError('Branch is required.');
      return false;
    }
    setError('');
    return true;
  }

  async function submit() {
    if (!validate()) return;
    try {
      await update.mutateAsync({
        startDate,
        endDate,
        totalCommits,
        schedulingMode: mode,
        branch: branch.trim(),
        workingDaysOnly,
        preferredHours: mode === 'human_like' ? preferredHours : undefined,
      });
      onSuccess();
      onClose();
    } catch {
      setError('Failed to update project. Please try again.');
    }
  }

  return (
    <Modal open onClose={onClose} title="Edit project">
      <div className="max-h-[70vh] space-y-5 overflow-y-auto pr-1">
        <div className="flex gap-2 rounded border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
          <svg
            className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          </svg>
          <span>
            Saving will regenerate your scheduled queue. Executed commits are kept. Pending commits
            will be recalculated with the new settings.
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm text-gtm-muted">Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gtm-muted">End date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-gtm-muted">Total commits (1–365)</label>
          <input
            type="number"
            min={1}
            max={365}
            value={totalCommits}
            onChange={(e) => setTotalCommits(Number(e.target.value))}
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gtm-muted">Branch</label>
          <input
            type="text"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-gtm-muted">Scheduling mode</label>
          <SchedulingModeSelector value={mode} onChange={setMode} />
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-200">
          <input
            type="checkbox"
            checked={workingDaysOnly}
            onChange={(e) => setWorkingDaysOnly(e.target.checked)}
            className="accent-gtm-accent"
          />
          Working days only (skip weekends)
        </label>

        {mode === 'human_like' && (
          <div>
            <label className="mb-2 block text-sm text-gtm-muted">Preferred hours</label>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 24 }, (_, h) => h).map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => toggleHour(h)}
                  className={`rounded px-2 py-1 text-xs ${
                    preferredHours.includes(h)
                      ? 'bg-gtm-accent text-white'
                      : 'border border-gtm-border bg-gtm-surface text-gtm-muted'
                  }`}
                >
                  {hourLabel(h)}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-sm text-gtm-danger">{error}</p>}
      </div>

      <div className="mt-5 flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button loading={update.isPending} onClick={submit}>
          {update.isPending ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </Modal>
  );
}
