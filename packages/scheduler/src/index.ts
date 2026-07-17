import type { SchedulerInput, SchedulerOutput } from '@gtm/common';

/**
 * Generate a deterministic commit schedule from the given input.
 *
 * Contract:
 * - Pure function — no side effects.
 * - Deterministic — same input (including `seed`) always yields the same output.
 *
 * Strategy implementations land in Phase 2.
 */
export function generateSchedule(_input: SchedulerInput): SchedulerOutput {
  throw new Error('generateSchedule not implemented — Phase 2');
}

export * from './strategies/linear.strategy';
export * from './strategies/random.strategy';
export * from './strategies/sprint.strategy';
export * from './strategies/human.strategy';
export * from './strategies/team.strategy';
export * from './utils/collision-detector';
export * from './utils/gap-finder';
