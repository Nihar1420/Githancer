import type { SchedulerInput, Timestamp } from '@gtm/common';

/** Linear strategy — even spread across the date range (with jitter). Phase 2. */
export function linearStrategy(_input: SchedulerInput): Timestamp[] {
  throw new Error('linearStrategy not implemented — Phase 2');
}
