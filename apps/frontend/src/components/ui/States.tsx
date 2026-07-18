import type { ReactNode } from 'react';
import { Spinner } from './Spinner';
import { Button } from './Button';

export function LoadingState() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}

export function ErrorState({
  message = 'Something went wrong.',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-gtm-border bg-gtm-surface p-8 text-center">
      <p className="text-slate-200">{message}</p>
      {onRetry && (
        <Button className="mt-4" variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-gtm-border bg-gtm-surface/50 p-12 text-center">
      <p className="text-lg font-medium text-slate-200">{title}</p>
      {hint && <p className="mt-1 text-sm text-gtm-muted">{hint}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
