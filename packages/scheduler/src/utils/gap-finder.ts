import { GapInfo } from '@gtm/common';
import { MS_PER_DAY } from './date.util';

/**
 * Find gaps between consecutive timestamps that exceed `thresholdDays`.
 * Pure — sorts a copy of the input.
 */
export function findGaps(timestamps: Date[], thresholdDays: number): GapInfo[] {
  const thresholdMs = thresholdDays * MS_PER_DAY;
  const sorted = [...timestamps].sort((a, b) => a.getTime() - b.getTime());
  const gaps: GapInfo[] = [];

  for (let i = 1; i < sorted.length; i++) {
    const durationMs = sorted[i].getTime() - sorted[i - 1].getTime();
    if (durationMs > thresholdMs) {
      gaps.push({
        start: sorted[i - 1].toISOString(),
        end: sorted[i].toISOString(),
        durationMs,
      });
    }
  }

  return gaps;
}
