'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { copyToClipboard } from '@/lib/clipboard';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { LoadingState, ErrorState } from '@/components/ui/States';
import type { CliSetupData } from '@/lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://githancer-production.up.railway.app';

function CopyButton({ value, disabled }: { value: string; disabled?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={async () => {
        await copyToClipboard(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="shrink-0 rounded-md border border-gtm-border px-2 py-1 text-xs text-gtm-muted transition-colors hover:text-slate-100 disabled:opacity-40"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

function buildDeepLink(userId: string, apiKey: string, projectId: string | null): string {
  const params = new URLSearchParams({ userId, apiKey, apiUrl: API_URL });
  if (projectId) {
    params.set('projectId', projectId);
  }
  return `githancer://auth?${params.toString()}`;
}

function CliSetupContent() {
  const searchParams = useSearchParams();
  const preselected = searchParams.get('projectId');

  const [data, setData] = useState<CliSetupData | null>(null);
  const [error, setError] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(preselected);
  const [regenOpen, setRegenOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [sent, setSent] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);

  useEffect(() => {
    let active = true;
    api.auth
      .getCliSetup()
      .then((d) => {
        if (active) setData(d);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  if (error) return <ErrorState message="Could not load CLI setup." onRetry={() => location.reload()} />;
  if (!data) return <LoadingState />;

  const fullKey = data.apiKeyFull;
  const displayKey = revealed && fullKey ? fullKey : data.apiKey;
  const selectedProject = data.projects.find((p) => p.id === selectedProjectId) ?? null;
  const preselectMatched = Boolean(preselected && selectedProject?.id === preselected);

  async function handleRegenerate() {
    setRegenerating(true);
    try {
      const { apiKey } = await api.auth.regenerateCliKey();
      setData((prev) =>
        prev ? { ...prev, apiKeyFull: apiKey, apiKey: `••••••••${apiKey.slice(-8)}`, hasKey: true } : prev,
      );
      setRevealed(true);
    } finally {
      setRegenerating(false);
      setRegenOpen(false);
    }
  }

  function handleSend() {
    if (!data || !data.apiKeyFull) return;
    window.location.href = buildDeepLink(data.userId, data.apiKeyFull, selectedProjectId);
    setSent(true);
  }

  const rowClass = 'flex items-center gap-2 rounded-lg border border-gtm-border bg-gtm-bg px-3 py-2';
  const monoClass = 'flex-1 truncate font-mono text-sm text-slate-200';

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-100">CLI Setup</h1>
      <p className="mt-1 text-sm text-gtm-muted">
        Use these to configure the Githancer CLI on any machine.
      </p>

      {/* Section 1 — credentials */}
      <section className="mt-8 space-y-3">
        <h2 className="text-sm font-medium text-slate-200">Your credentials</h2>

        <div>
          <label className="mb-1 block text-xs text-gtm-muted">User ID</label>
          <div className={rowClass}>
            <span className={monoClass}>{data.userId}</span>
            <CopyButton value={data.userId} />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs text-gtm-muted">API Key</label>
          <div className={rowClass}>
            <span className={monoClass}>{displayKey}</span>
            <button
              type="button"
              disabled={!fullKey}
              onClick={() => setRevealed((r) => !r)}
              className="shrink-0 rounded-md border border-gtm-border px-2 py-1 text-xs text-gtm-muted transition-colors hover:text-slate-100 disabled:opacity-40"
            >
              {revealed ? 'Hide' : 'Reveal'}
            </button>
            <CopyButton value={fullKey ?? ''} disabled={!fullKey} />
            <button
              type="button"
              onClick={() => setRegenOpen(true)}
              className="shrink-0 rounded-md border border-gtm-border px-2 py-1 text-xs text-gtm-muted transition-colors hover:text-slate-100"
            >
              Regenerate
            </button>
          </div>
          {!fullKey && (
            <p className="mt-1 text-xs text-gtm-muted">
              A key already exists but can’t be shown again. Regenerate to get a new one (this
              invalidates the old key everywhere).
            </p>
          )}
        </div>
      </section>

      {/* Section 2 — project picker */}
      <section className="mt-8 space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-slate-200">Select a project (optional)</h2>
          {preselectMatched && <Badge variant="info">Pre-selected from your project page</Badge>}
        </div>
        <p className="text-sm text-gtm-muted">Pre-fills the Project ID in your CLI config.</p>

        <div className="space-y-2">
          {data.projects.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedProjectId(p.id)}
              className={`flex w-full items-center justify-between rounded-lg border p-3 text-left ${
                selectedProjectId === p.id
                  ? 'border-gtm-accent bg-gtm-accent/10'
                  : 'border-gtm-border bg-gtm-surface hover:border-slate-600'
              }`}
            >
              <span className="text-sm text-slate-100">{p.repoFullName}</span>
              <span className="flex items-center gap-2">
                <span className="rounded bg-slate-600 px-1.5 py-0.5 text-xs text-slate-200">
                  {p.branch}
                </span>
                <span className="text-xs text-gtm-muted">{p.status}</span>
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSelectedProjectId(null)}
            className={`w-full rounded-lg border p-3 text-left text-sm ${
              selectedProjectId === null
                ? 'border-gtm-accent bg-gtm-accent/10 text-slate-100'
                : 'border-gtm-border bg-gtm-surface text-gtm-muted hover:border-slate-600'
            }`}
          >
            None — I’ll set it up manually
          </button>
        </div>

        {selectedProject && (
          <div className={rowClass}>
            <span className="text-xs text-gtm-muted">Project ID</span>
            <span className={monoClass}>{selectedProject.id}</span>
            <CopyButton value={selectedProject.id} />
          </div>
        )}
      </section>

      {/* Section 3 — send to CLI / manual */}
      <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gtm-border bg-gtm-surface p-5">
          <Button className="w-full" onClick={handleSend} disabled={!fullKey}>
            Send to CLI
          </Button>
          <p className="mt-2 text-xs text-gtm-muted">Opens automatically in your terminal.</p>
          {sent && (
            <p className="mt-2 text-xs text-gtm-success">
              ✓ Sent! If nothing happened, use manual setup.
            </p>
          )}
          {!fullKey && (
            <p className="mt-2 text-xs text-gtm-muted">Regenerate your key first to enable this.</p>
          )}
        </div>

        <div className="rounded-xl border border-gtm-border bg-gtm-surface p-5">
          <button
            type="button"
            onClick={() => setManualOpen((o) => !o)}
            className="text-sm font-medium text-slate-200"
          >
            Manual setup {manualOpen ? '▲' : '▼'}
          </button>
          {manualOpen && (
            <div className="mt-3 space-y-2 text-xs text-gtm-muted">
              <p>Run these in your terminal:</p>
              <pre className="rounded bg-gtm-bg p-2 font-mono text-slate-200">timeline init</pre>
              <pre className="rounded bg-gtm-bg p-2 font-mono text-slate-200">timeline login</pre>
              <p>When prompted, enter:</p>
              <div className={rowClass}>
                <span className={monoClass}>API URL: {API_URL}</span>
                <CopyButton value={API_URL} />
              </div>
              <div className={rowClass}>
                <span className={monoClass}>User ID: {data.userId}</span>
                <CopyButton value={data.userId} />
              </div>
              {selectedProject && (
                <div className={rowClass}>
                  <span className={monoClass}>Project ID: {selectedProject.id}</span>
                  <CopyButton value={selectedProject.id} />
                </div>
              )}
              <div className={rowClass}>
                <span className={monoClass}>API Key: {fullKey ? displayKey : '(regenerate to view)'}</span>
                <CopyButton value={fullKey ?? ''} disabled={!fullKey} />
              </div>
            </div>
          )}
        </div>
      </section>

      <Modal open={regenOpen} onClose={() => setRegenOpen(false)} title="Regenerate CLI key?">
        <p className="text-sm text-gtm-muted">
          This will invalidate your existing CLI key on all machines. Continue?
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setRegenOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" loading={regenerating} onClick={handleRegenerate}>
            Regenerate
          </Button>
        </div>
      </Modal>
    </main>
  );
}

export default function CliSetupPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<LoadingState />}>
        <CliSetupContent />
      </Suspense>
    </>
  );
}
