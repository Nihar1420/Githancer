import { SchedulerInput } from '@gtm/common';
import { createPrng, gaussian, Prng } from '../utils/prng.util';
import { addDays, isWeekend, startOfDayUTC } from '../utils/date.util';

const DEFAULT_PREFERRED_HOURS = [10, 14, 16];
const HOUR_STDDEV = 1.5;

/** Weight a day: Mon–Thu heaviest, Fri lighter, weekends zero. */
function dayWeight(d: Date): number {
  const wd = d.getUTCDay();
  if (wd === 0 || wd === 6) {
    return 0;
  }
  if (wd === 5) {
    return 0.5;
  }
  return 1;
}

/** Pick an index into `weights` proportional to weight; uniform if all zero. */
function pickWeightedIndex(weights: number[], prng: Prng): number {
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) {
    return Math.floor(prng() * weights.length);
  }
  let r = prng() * total;
  let idx = 0;
  for (; idx < weights.length - 1; idx++) {
    r -= weights[idx];
    if (r < 0) {
      break;
    }
  }
  return idx;
}

/**
 * Human-like strategy — Gaussian spread (σ=1.5h) around preferred hours, denser
 * Mon–Thu, lighter Fri, and no weekends when `workingDaysOnly` is set.
 */
export function humanStrategy(input: SchedulerInput): Date[] {
  if (input.totalCommits <= 0) {
    return [];
  }

  const prng = createPrng(input.seed);
  const preferred =
    input.preferredHours && input.preferredHours.length > 0
      ? input.preferredHours
      : DEFAULT_PREFERRED_HOURS;

  const start = startOfDayUTC(new Date(input.startDate));
  const end = new Date(input.endDate);
  const days: Date[] = [];
  for (let d = start; d.getTime() <= end.getTime(); d = addDays(d, 1)) {
    if (input.workingDaysOnly && isWeekend(d)) {
      continue;
    }
    days.push(new Date(d.getTime()));
  }
  if (days.length === 0) {
    return [];
  }

  const weights = days.map(dayWeight);
  const out: Date[] = [];
  for (let i = 0; i < input.totalCommits; i++) {
    const day = days[pickWeightedIndex(weights, prng)];
    const meanHour = preferred[Math.floor(prng() * preferred.length)];
    const rawHour = Math.round(gaussian(prng, meanHour, HOUR_STDDEV));
    const hour = Math.min(23, Math.max(0, rawHour));
    const minute = Math.floor(prng() * 60);
    out.push(
      new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), hour, minute)),
    );
  }

  return out;
}
