import type { SchedulerInput, Timestamp } from '@gtm/common';

/** Team strategy — coordinated multi-user offset over a base strategy. Phase 2. */
export function teamStrategy(_input: SchedulerInput): Timestamp[] {
  throw new Error('teamStrategy not implemented — Phase 2');
}
