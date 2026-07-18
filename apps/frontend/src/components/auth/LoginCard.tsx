const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export function LoginCard({ useMock }: { useMock: boolean }) {
  const href = useMock ? '/dashboard' : `${API}/api/v1/auth/github`;
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-gtm-border bg-gtm-surface p-8 text-center">
        <h1 className="text-3xl font-bold text-slate-100">Githancer</h1>
        <p className="mt-2 text-sm text-gtm-muted">Git timeline management for developers</p>
        <a
          href={href}
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gtm-accent px-6 py-3 font-medium text-white transition-colors hover:bg-gtm-accent-hover"
        >
          Sign in with GitHub
        </a>
        <p className="mt-6 text-xs text-slate-500">For internal use — trusted team only</p>
      </div>
    </main>
  );
}
