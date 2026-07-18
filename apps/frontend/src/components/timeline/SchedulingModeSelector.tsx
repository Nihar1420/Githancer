'use client';

import { SCHEDULING_MODES, type SchedulingMode } from '@/lib/types';

export function SchedulingModeSelector({
  value,
  onChange,
}: {
  value: SchedulingMode;
  onChange: (mode: SchedulingMode) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {SCHEDULING_MODES.map((mode) => {
        const selected = mode.value === value;
        return (
          <button
            key={mode.value}
            type="button"
            onClick={() => onChange(mode.value)}
            className={`rounded-lg border p-4 text-left transition-colors ${
              selected
                ? 'border-gtm-accent bg-gtm-accent/10'
                : 'border-gtm-border bg-gtm-surface hover:border-slate-600'
            }`}
          >
            <div className="font-medium text-slate-100">{mode.label}</div>
            <div className="mt-1 text-xs text-gtm-muted">{mode.description}</div>
          </button>
        );
      })}
    </div>
  );
}
