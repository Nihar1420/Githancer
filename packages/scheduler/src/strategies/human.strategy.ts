import type { SchedulerInput, Timestamp } from '@gtm/common';

/** Human-like strategy — Gaussian spread around preferred hours. Phase 2. */
export function humanStrategy(_input: SchedulerInput): Timestamp[] {
  throw new Error('humanStrategy not implemented — Phase 2');
}
