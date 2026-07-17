import type { SchedulerInput, Timestamp } from '@gtm/common';

/** Sprint strategy — burst periods followed by quiet periods. Phase 2. */
export function sprintStrategy(_input: SchedulerInput): Timestamp[] {
  throw new Error('sprintStrategy not implemented — Phase 2');
}
