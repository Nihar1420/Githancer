import type { SchedulerInput, Timestamp } from '@gtm/common';

/** Random strategy — seeded PRNG distribution across the range. Phase 2. */
export function randomStrategy(_input: SchedulerInput): Timestamp[] {
  throw new Error('randomStrategy not implemented — Phase 2');
}
