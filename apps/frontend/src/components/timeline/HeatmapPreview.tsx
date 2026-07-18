import { format } from 'date-fns';
import type { CommitStatus } from '@/lib/types';

const WEEKS = 52;
const DAY_MS = 86_400_000;

export interface HeatmapEntry {
  scheduledAt: string;
  status: CommitStatus;
}

function colorClass(count: number, executed: boolean): string {
  if (count === 0) return 'bg-slate-700';
  if (executed) {
    return count >= 4 ? 'bg-green-300' : count === 3 ? 'bg-green-500' : count === 2 ? 'bg-green-700' : 'bg-green-900';
  }
  return count >= 4 ? 'bg-indigo-300' : count === 3 ? 'bg-indigo-500' : count === 2 ? 'bg-indigo-700' : 'bg-indigo-900';
}

export function HeatmapPreview({ commitQueue }: { commitQueue: HeatmapEntry[] }) {
  const counts = new Map<string, { count: number; executed: number }>();
  let maxTime = 0;
  for (const entry of commitQueue) {
    const key = entry.scheduledAt.slice(0, 10);
    const cur = counts.get(key) ?? { count: 0, executed: 0 };
    cur.count += 1;
    if (entry.status === 'executed') cur.executed += 1;
    counts.set(key, cur);
    maxTime = Math.max(maxTime, new Date(entry.scheduledAt).getTime());
  }

  const end = maxTime > 0 ? new Date(maxTime) : new Date();
  const endAligned = new Date(end);
  endAligned.setUTCDate(endAligned.getUTCDate() + (6 - endAligned.getUTCDay())); // to Saturday
  const totalDays = WEEKS * 7;
  const startTime = endAligned.getTime() - (totalDays - 1) * DAY_MS;

  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  return (
    <div className="overflow-x-auto rounded-xl border border-gtm-border bg-gtm-surface p-4">
      <div className="flex gap-[3px]">
        <div className="mr-1 flex flex-col gap-[3px]">
          {dayLabels.map((label, i) => (
            <div key={i} className="h-[10px] text-[8px] leading-[10px] text-gtm-muted">
              {label}
            </div>
          ))}
        </div>
        {Array.from({ length: WEEKS }, (_, w) => (
          <div key={w} className="flex flex-col gap-[3px]">
            {Array.from({ length: 7 }, (_, d) => {
              const date = new Date(startTime + (w * 7 + d) * DAY_MS);
              const key = date.toISOString().slice(0, 10);
              const info = counts.get(key) ?? { count: 0, executed: 0 };
              return (
                <div
                  key={key}
                  data-testid="heatmap-cell"
                  title={`${info.count} commit${info.count === 1 ? '' : 's'} on ${format(date, 'MMM d, yyyy')}`}
                  className={`h-[10px] w-[10px] rounded-sm ${colorClass(info.count, info.executed > 0)}`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
