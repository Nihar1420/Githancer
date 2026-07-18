'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useRepos, useBranches } from '@/hooks/useGithub';
import { useCreateProject } from '@/hooks/useProjects';
import { SchedulingModeSelector } from '@/components/timeline/SchedulingModeSelector';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, ErrorState } from '@/components/ui/States';
import { SCHEDULING_MODES, type RepoSummary, type SchedulingMode } from '@/lib/types';

function hourLabel(h: number): string {
  return `${h % 12 || 12}${h < 12 ? 'am' : 'pm'}`;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-gtm-border/50 py-2 last:border-0">
      <span className="text-gtm-muted">{label}</span>
      <span className="text-slate-200">{value}</span>
    </div>
  );
}

const inputClass =
  'w-full rounded-lg border border-gtm-border bg-gtm-surface px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-gtm-accent focus:outline-none';

export default function NewProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const [repo, setRepo] = useState<RepoSummary | null>(null);
  const [branch, setBranch] = useState('main');
  const [search, setSearch] = useState('');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalCommits, setTotalCommits] = useState(30);
  const [mode, setMode] = useState<SchedulingMode>('linear');
  const [workingDaysOnly, setWorkingDaysOnly] = useState(false);
  const [preferredHours, setPreferredHours] = useState<number[]>([10, 14, 16]);
  const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const [error, setError] = useState('');

  const reposQuery = useRepos();
  const [owner, repoName] = repo ? repo.fullName.split('/') : ['', ''];
  const branchesQuery = useBranches(owner, repoName);
  const create = useCreateProject();

  const filteredRepos = (reposQuery.data ?? []).filter((r) =>
    r.fullName.toLowerCase().includes(search.toLowerCase()),
  );

  function selectRepo(r: RepoSummary) {
    setRepo(r);
    setBranch(r.defaultBranch);
  }

  function toggleHour(h: number) {
    setPreferredHours((prev) =>
      prev.includes(h) ? prev.filter((x) => x !== h) : [...prev, h].sort((a, b) => a - b),
    );
  }

  function validateStep2(): boolean {
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
    setError('');
    return true;
  }

  async function submit() {
    if (!repo) return;
    try {
      const result = await create.mutateAsync({
        repoFullName: repo.fullName,
        branch,
        startDate,
        endDate,
        totalCommits,
        schedulingMode: mode,
        workingDaysOnly,
        preferredHours: mode === 'human_like' ? preferredHours : undefined,
      });
      router.push(`/projects/${result.project.id}`);
    } catch {
      setError('Failed to create project. Please try again.');
    }
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-1 text-2xl font-bold text-slate-100">New Project</h1>
        <p className="mb-6 text-sm text-gtm-muted">Step {step} of 3</p>

        {step === 1 && (
          <section className="space-y-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search repositories…"
              className={inputClass}
            />
            {reposQuery.isLoading && <LoadingState />}
            {reposQuery.isError && (
              <ErrorState message="Could not load repositories." onRetry={() => reposQuery.refetch()} />
            )}
            <div className="space-y-2">
              {filteredRepos.map((r) => (
                <button
                  key={r.fullName}
                  onClick={() => selectRepo(r)}
                  className={`flex w-full items-center justify-between rounded-lg border p-3 text-left ${
                    repo?.fullName === r.fullName
                      ? 'border-gtm-accent bg-gtm-accent/10'
                      : 'border-gtm-border bg-gtm-surface hover:border-slate-600'
                  }`}
                >
                  <span className="text-sm text-slate-100">{r.fullName}</span>
                  <span className="flex items-center gap-2">
                    <Badge variant={r.isPrivate ? 'warning' : 'neutral'}>
                      {r.isPrivate ? 'private' : 'public'}
                    </Badge>
                    {r.pushedAt && (
                      <span className="text-xs text-gtm-muted">{format(new Date(r.pushedAt), 'MMM d')}</span>
                    )}
                  </span>
                </button>
              ))}
            </div>
            {repo && (
              <div>
                <label className="mb-1 block text-sm text-gtm-muted">Branch</label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className={inputClass}
                >
                  {(branchesQuery.data ?? [branch]).map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex justify-end">
              <Button disabled={!repo} onClick={() => setStep(2)}>
                Next
              </Button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm text-gtm-muted">Start date</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gtm-muted">End date</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
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
            <div className="text-sm text-gtm-muted">
              Timezone: <span className="text-slate-300">{timezone}</span>{' '}
              <span className="text-xs text-slate-500">(auto-detected)</span>
            </div>
            {error && <p className="text-sm text-gtm-danger">{error}</p>}
            <div className="flex justify-between">
              <Button variant="secondary" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                onClick={() => {
                  if (validateStep2()) setStep(3);
                }}
              >
                Next
              </Button>
            </div>
          </section>
        )}

        {step === 3 && repo && (
          <section className="space-y-4">
            <div className="rounded-xl border border-gtm-border bg-gtm-surface p-5 text-sm">
              <SummaryRow label="Repository" value={`${repo.fullName} · ${branch}`} />
              <SummaryRow label="Range" value={`${startDate} → ${endDate}`} />
              <SummaryRow label="Total commits" value={String(totalCommits)} />
              <SummaryRow
                label="Mode"
                value={SCHEDULING_MODES.find((m) => m.value === mode)?.label ?? mode}
              />
              <SummaryRow label="Working days only" value={workingDaysOnly ? 'Yes' : 'No'} />
              {mode === 'human_like' && (
                <SummaryRow label="Preferred hours" value={preferredHours.map(hourLabel).join(', ')} />
              )}
              <SummaryRow label="Timezone" value={timezone} />
            </div>
            {error && <p className="text-sm text-gtm-danger">{error}</p>}
            <div className="flex justify-between">
              <Button variant="secondary" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button loading={create.isPending} onClick={submit}>
                Create Project
              </Button>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
