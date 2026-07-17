import { SchedulerInput, SchedulerOutput, SchedulingMode } from '@gtm/common';
import { linearStrategy } from './strategies/linear.strategy';
import { randomStrategy } from './strategies/random.strategy';
import { sprintStrategy } from './strategies/sprint.strategy';
import { humanStrategy } from './strategies/human.strategy';
import { teamStrategy } from './strategies/team.strategy';
import { detectCollisions } from './utils/collision-detector';
import { findGaps } from './utils/gap-finder';

const GAP_THRESHOLD_DAYS = 7;

/**
 * Generate a deterministic commit schedule for the given input.
 * Pure: same input (including `seed`) always yields the same output.
 */
export function generateSchedule(input: SchedulerInput): SchedulerOutput {
  let raw: Date[];
  switch (input.mode) {
    case SchedulingMode.LINEAR:
      raw = linearStrategy(input);
      break;
    case SchedulingMode.RANDOM:
      raw = randomStrategy(input);
      break;
    case SchedulingMode.SPRINT:
      raw = sprintStrategy(input);
      break;
    case SchedulingMode.HUMAN_LIKE:
      raw = humanStrategy(input);
      break;
    case SchedulingMode.TEAM:
      raw = teamStrategy(input);
      break;
    default:
      throw new Error(`Unknown scheduling mode: ${String(input.mode)}`);
  }

  const { resolved, collisionCount } = detectCollisions(raw);
  const sorted = [...resolved].sort((a, b) => a.getTime() - b.getTime());
  const gaps = findGaps(sorted, GAP_THRESHOLD_DAYS);

  return {
    timestamps: sorted.map((d) => d.toISOString()),
    mode: input.mode,
    totalGenerated: sorted.length,
    collisionCount,
    gaps,
  };
}

export {
  linearStrategy,
  randomStrategy,
  sprintStrategy,
  humanStrategy,
  teamStrategy,
};
export { detectCollisions } from './utils/collision-detector';
export { findGaps } from './utils/gap-finder';
export type { CollisionResult } from './utils/collision-detector';
