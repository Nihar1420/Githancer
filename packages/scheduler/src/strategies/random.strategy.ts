import { SchedulerInput } from '@gtm/common';
import { createPrng } from '../utils/prng.util';
import { isWeekend } from '../utils/date.util';

const WORK_HOUR_START = 9;
const WORK_HOUR_SPAN = 9; // 09:00–17:59

/**
 * Random strategy — seeded uniform distribution across the range, biased toward
 * working hours. Weekends are rejected when `workingDaysOnly` is set.
 */
export function randomStrategy(input: SchedulerInput): Date[] {
  if (input.totalCommits <= 0) {
    return [];
  }

  const start = new Date(input.startDate).getTime();
  const end = new Date(input.endDate).getTime();
  const prng = createPrng(input.seed);
  const out: Date[] = [];
  const maxAttempts = input.totalCommits * 50;
  let attempts = 0;

  while (out.length < input.totalCommits && attempts < maxAttempts) {
    attempts++;
    const t = start + prng() * (end - start);
    const day = new Date(t);
    const hour = WORK_HOUR_START + Math.floor(prng() * WORK_HOUR_SPAN);
    const minute = Math.floor(prng() * 60);
    const d = new Date(
      Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), hour, minute),
    );
    if (input.workingDaysOnly && isWeekend(d)) {
      continue;
    }
    out.push(d);
  }

  return out;
}
