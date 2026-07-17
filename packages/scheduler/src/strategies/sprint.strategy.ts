import { SchedulerInput, SprintConfig } from '@gtm/common';
import { createPrng } from '../utils/prng.util';
import { addDays, adjustToWeekday, startOfDayUTC } from '../utils/date.util';

const DEFAULT_SPRINT: SprintConfig = {
  sprintDays: 5,
  quietDays: 2,
  commitsPerSprint: 10,
};

const WORK_HOUR_START = 9;
const WORK_HOUR_SPAN = 9;

/**
 * Sprint strategy — alternate burst and quiet cycles. Commits are placed densely
 * during each burst window; quiet windows get none.
 */
export function sprintStrategy(input: SchedulerInput): Date[] {
  if (input.totalCommits <= 0) {
    return [];
  }

  const cfg = input.sprint ?? DEFAULT_SPRINT;
  const cycleLen = cfg.sprintDays + cfg.quietDays;
  const prng = createPrng(input.seed);
  const end = new Date(input.endDate);
  const out: Date[] = [];

  let cycleStart = startOfDayUTC(new Date(input.startDate));
  while (cycleStart.getTime() <= end.getTime() && out.length < input.totalCommits) {
    const thisSprint = Math.min(cfg.commitsPerSprint, input.totalCommits - out.length);
    for (let i = 0; i < thisSprint; i++) {
      const dayOffset = Math.floor(prng() * cfg.sprintDays);
      const hour = WORK_HOUR_START + Math.floor(prng() * WORK_HOUR_SPAN);
      const minute = Math.floor(prng() * 60);
      const base = addDays(cycleStart, dayOffset);
      let d = new Date(
        Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), hour, minute),
      );
      if (input.workingDaysOnly) {
        d = adjustToWeekday(d);
      }
      if (d.getTime() <= end.getTime()) {
        out.push(d);
      }
    }
    cycleStart = addDays(cycleStart, cycleLen);
  }

  return out;
}
