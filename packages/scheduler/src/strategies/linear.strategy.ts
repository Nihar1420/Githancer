import { SchedulerInput } from '@gtm/common';
import { createPrng } from '../utils/prng.util';
import { addMinutes, adjustToWeekday } from '../utils/date.util';

/**
 * Linear strategy — split the range into `totalCommits` equal intervals and
 * place one commit per interval with ±30min seeded jitter.
 */
export function linearStrategy(input: SchedulerInput): Date[] {
  if (input.totalCommits <= 0) {
    return [];
  }

  const start = new Date(input.startDate).getTime();
  const end = new Date(input.endDate).getTime();
  const interval = (end - start) / input.totalCommits;
  const prng = createPrng(input.seed);
  const out: Date[] = [];

  for (let i = 0; i < input.totalCommits; i++) {
    const base = start + i * interval;
    const jitter = prng() * 60 - 30; // ±30 minutes
    let d = addMinutes(new Date(base), jitter);
    if (input.workingDaysOnly) {
      d = adjustToWeekday(d);
    }
    out.push(d);
  }

  return out;
}
