import { SchedulerInput, TeamConfig } from '@gtm/common';
import { humanStrategy } from './human.strategy';
import { linearStrategy } from './linear.strategy';
import { addMinutes } from '../utils/date.util';

const DEFAULT_TEAM: TeamConfig = {
  teamSize: 1,
  userIndex: 0,
  spreadHours: 8,
};

/**
 * Team strategy — build a base schedule (human-like, or linear when no preferred
 * hours are given) and offset every timestamp by this user's slot in the team
 * spread window: userIndex * (spreadHours / teamSize) * 60 minutes.
 */
export function teamStrategy(input: SchedulerInput): Date[] {
  const cfg = input.team ?? DEFAULT_TEAM;
  const base =
    input.preferredHours && input.preferredHours.length > 0
      ? humanStrategy(input)
      : linearStrategy(input);

  const offsetMinutes =
    cfg.teamSize > 0 ? cfg.userIndex * (cfg.spreadHours / cfg.teamSize) * 60 : 0;

  return base.map((d) => addMinutes(d, offsetMinutes));
}
