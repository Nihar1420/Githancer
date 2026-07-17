import { SchedulerInput, SchedulingMode } from '@gtm/common';
import {
  generateSchedule,
  linearStrategy,
  randomStrategy,
  sprintStrategy,
  humanStrategy,
  teamStrategy,
  detectCollisions,
  findGaps,
} from '../index';

const base = (over: Partial<SchedulerInput> = {}): SchedulerInput => ({
  mode: SchedulingMode.LINEAR,
  startDate: '2026-01-01',
  endDate: '2026-06-30',
  totalCommits: 50,
  seed: 'test-seed',
  ...over,
});

const isoDay = (s: string): number => new Date(s).getUTCDay();
const noWeekends = (list: Date[]): boolean =>
  list.every((d) => d.getUTCDay() !== 0 && d.getUTCDay() !== 6);
const uniqueIso = (list: string[]): boolean => new Set(list).size === list.length;

describe('collision-detector', () => {
  it('returns empty for empty input', () => {
    const { resolved, collisionCount } = detectCollisions([]);
    expect(resolved).toEqual([]);
    expect(collisionCount).toBe(0);
  });

  it('reports zero collisions when all are far apart', () => {
    const input = [
      new Date('2026-01-01T00:00:00Z'),
      new Date('2026-01-01T01:00:00Z'),
      new Date('2026-01-01T02:00:00Z'),
    ];
    const { resolved, collisionCount } = detectCollisions(input);
    expect(collisionCount).toBe(0);
    expect(resolved).toHaveLength(3);
  });

  it('shifts colliding timestamps and counts them', () => {
    const dup = new Date('2026-01-01T00:00:00Z');
    const { resolved, collisionCount } = detectCollisions([
      dup,
      new Date(dup.getTime()),
      new Date(dup.getTime()),
    ]);
    expect(collisionCount).toBe(2);
    const times = resolved.map((d) => d.getTime());
    expect(new Set(times).size).toBe(3);
  });
});

describe('gap-finder', () => {
  it('returns no gaps for empty or single input', () => {
    expect(findGaps([], 7)).toEqual([]);
    expect(findGaps([new Date('2026-01-01T00:00:00Z')], 7)).toEqual([]);
  });

  it('finds gaps larger than the threshold', () => {
    const gaps = findGaps(
      [new Date('2026-01-01T00:00:00Z'), new Date('2026-01-20T00:00:00Z')],
      7,
    );
    expect(gaps).toHaveLength(1);
    expect(gaps[0].durationMs).toBeGreaterThan(0);
    expect(typeof gaps[0].start).toBe('string');
  });

  it('ignores gaps within the threshold', () => {
    const gaps = findGaps(
      [new Date('2026-01-01T00:00:00Z'), new Date('2026-01-03T00:00:00Z')],
      7,
    );
    expect(gaps).toEqual([]);
  });
});

describe('linearStrategy', () => {
  it('returns empty for zero commits', () => {
    expect(linearStrategy(base({ totalCommits: 0 }))).toEqual([]);
  });

  it('produces a single commit', () => {
    expect(linearStrategy(base({ totalCommits: 1 }))).toHaveLength(1);
  });

  it('produces 50 commits across 6 months', () => {
    expect(linearStrategy(base({ totalCommits: 50 }))).toHaveLength(50);
  });

  it('is deterministic for the same seed', () => {
    const a = linearStrategy(base()).map((d) => d.toISOString());
    const b = linearStrategy(base()).map((d) => d.toISOString());
    expect(a).toEqual(b);
  });

  it('produces no weekend timestamps when workingDaysOnly', () => {
    expect(noWeekends(linearStrategy(base({ workingDaysOnly: true })))).toBe(true);
  });

  it('uses the default seed when none is provided', () => {
    expect(linearStrategy(base({ seed: undefined, totalCommits: 3 }))).toHaveLength(3);
  });
});

describe('randomStrategy', () => {
  it('returns empty for zero commits', () => {
    expect(randomStrategy(base({ mode: SchedulingMode.RANDOM, totalCommits: 0 }))).toEqual([]);
  });

  it('produces 50 commits and is deterministic', () => {
    const a = randomStrategy(base({ mode: SchedulingMode.RANDOM }));
    const b = randomStrategy(base({ mode: SchedulingMode.RANDOM }));
    expect(a).toHaveLength(50);
    expect(a.map((d) => d.toISOString())).toEqual(b.map((d) => d.toISOString()));
  });

  it('produces no weekend timestamps when workingDaysOnly', () => {
    const out = randomStrategy(base({ mode: SchedulingMode.RANDOM, workingDaysOnly: true }));
    expect(noWeekends(out)).toBe(true);
  });

  it('stops at max attempts for a weekend-only range', () => {
    const out = randomStrategy(
      base({
        mode: SchedulingMode.RANDOM,
        startDate: '2026-01-03', // Saturday
        endDate: '2026-01-04', // Sunday
        workingDaysOnly: true,
        totalCommits: 5,
      }),
    );
    expect(out.length).toBeLessThan(5);
  });
});

describe('humanStrategy', () => {
  it('returns empty for zero commits', () => {
    expect(humanStrategy(base({ mode: SchedulingMode.HUMAN_LIKE, totalCommits: 0 }))).toEqual([]);
  });

  it('produces 50 commits and is deterministic', () => {
    const a = humanStrategy(base({ mode: SchedulingMode.HUMAN_LIKE }));
    const b = humanStrategy(base({ mode: SchedulingMode.HUMAN_LIKE }));
    expect(a).toHaveLength(50);
    expect(a.map((d) => d.toISOString())).toEqual(b.map((d) => d.toISOString()));
  });

  it('honors explicit preferred hours', () => {
    const out = humanStrategy(base({ mode: SchedulingMode.HUMAN_LIKE, preferredHours: [9, 17] }));
    expect(out).toHaveLength(50);
  });

  it('falls back to default hours for empty preferredHours', () => {
    const out = humanStrategy(base({ mode: SchedulingMode.HUMAN_LIKE, preferredHours: [] }));
    expect(out).toHaveLength(50);
  });

  it('produces no weekend timestamps when workingDaysOnly', () => {
    const out = humanStrategy(base({ mode: SchedulingMode.HUMAN_LIKE, workingDaysOnly: true }));
    expect(noWeekends(out)).toBe(true);
  });

  it('returns empty when workingDaysOnly filters out every day', () => {
    const out = humanStrategy(
      base({
        mode: SchedulingMode.HUMAN_LIKE,
        startDate: '2026-01-03', // Saturday
        endDate: '2026-01-04', // Sunday
        workingDaysOnly: true,
      }),
    );
    expect(out).toEqual([]);
  });

  it('handles a weekend-only range with zero total weight', () => {
    const out = humanStrategy(
      base({
        mode: SchedulingMode.HUMAN_LIKE,
        startDate: '2026-01-03', // Saturday
        endDate: '2026-01-04', // Sunday
        totalCommits: 3,
      }),
    );
    expect(out).toHaveLength(3);
  });
});

describe('sprintStrategy', () => {
  it('returns empty for zero commits', () => {
    expect(sprintStrategy(base({ mode: SchedulingMode.SPRINT, totalCommits: 0 }))).toEqual([]);
  });

  it('produces commits with an explicit sprint config', () => {
    const out = sprintStrategy(
      base({
        mode: SchedulingMode.SPRINT,
        totalCommits: 50,
        sprint: { sprintDays: 5, quietDays: 2, commitsPerSprint: 10 },
      }),
    );
    expect(out.length).toBeGreaterThan(0);
    expect(out.length).toBeLessThanOrEqual(50);
  });

  it('uses the default config when none is provided', () => {
    const out = sprintStrategy(base({ mode: SchedulingMode.SPRINT, totalCommits: 20 }));
    expect(out.length).toBeGreaterThan(0);
  });

  it('produces no weekend timestamps when workingDaysOnly', () => {
    const out = sprintStrategy(
      base({ mode: SchedulingMode.SPRINT, workingDaysOnly: true, totalCommits: 30 }),
    );
    expect(noWeekends(out)).toBe(true);
  });

  it('drops commits that fall past the end date', () => {
    const out = sprintStrategy(
      base({
        mode: SchedulingMode.SPRINT,
        startDate: '2026-01-01',
        endDate: '2026-01-03',
        totalCommits: 10,
        sprint: { sprintDays: 10, quietDays: 2, commitsPerSprint: 10 },
      }),
    );
    expect(out.length).toBeLessThan(10);
  });
});

describe('teamStrategy', () => {
  it('returns empty for zero commits', () => {
    expect(teamStrategy(base({ mode: SchedulingMode.TEAM, totalCommits: 0 }))).toEqual([]);
  });

  it('offsets a human base when preferred hours are given', () => {
    const out = teamStrategy(
      base({
        mode: SchedulingMode.TEAM,
        preferredHours: [10, 14],
        team: { teamSize: 4, userIndex: 2, spreadHours: 8 },
      }),
    );
    expect(out).toHaveLength(50);
  });

  it('offsets a linear base when no preferred hours are given', () => {
    const out = teamStrategy(
      base({ mode: SchedulingMode.TEAM, team: { teamSize: 4, userIndex: 1, spreadHours: 8 } }),
    );
    expect(out).toHaveLength(50);
  });

  it('uses the default team config when none is provided', () => {
    expect(teamStrategy(base({ mode: SchedulingMode.TEAM }))).toHaveLength(50);
  });

  it('avoids division by zero for a zero team size', () => {
    const out = teamStrategy(
      base({ mode: SchedulingMode.TEAM, team: { teamSize: 0, userIndex: 0, spreadHours: 8 } }),
    );
    expect(out.every((d) => !Number.isNaN(d.getTime()))).toBe(true);
  });
});

describe('generateSchedule', () => {
  const modes = [
    SchedulingMode.LINEAR,
    SchedulingMode.RANDOM,
    SchedulingMode.SPRINT,
    SchedulingMode.HUMAN_LIKE,
    SchedulingMode.TEAM,
  ];

  it.each(modes)('produces sorted, collision-free output for %s', (mode) => {
    const out = generateSchedule(base({ mode }));
    expect(out.mode).toBe(mode);
    expect(out.totalGenerated).toBe(out.timestamps.length);
    expect(uniqueIso(out.timestamps)).toBe(true);
    const times = out.timestamps.map((t) => new Date(t).getTime());
    const sorted = [...times].sort((a, b) => a - b);
    expect(times).toEqual(sorted);
    expect(typeof out.collisionCount).toBe('number');
    expect(Array.isArray(out.gaps)).toBe(true);
  });

  it('is deterministic for the same seed', () => {
    const a = generateSchedule(base({ mode: SchedulingMode.HUMAN_LIKE }));
    const b = generateSchedule(base({ mode: SchedulingMode.HUMAN_LIKE }));
    expect(a).toEqual(b);
  });

  it('handles zero commits', () => {
    const out = generateSchedule(base({ totalCommits: 0 }));
    expect(out.timestamps).toEqual([]);
    expect(out.totalGenerated).toBe(0);
  });

  it('honors workingDaysOnly (no weekend timestamps)', () => {
    const out = generateSchedule(base({ mode: SchedulingMode.LINEAR, workingDaysOnly: true }));
    const weekend = out.timestamps.filter((t) => isoDay(t) === 0 || isoDay(t) === 6);
    expect(weekend).toEqual([]);
  });

  it('throws for an unknown scheduling mode', () => {
    expect(() =>
      generateSchedule(base({ mode: 'bogus' as unknown as SchedulingMode })),
    ).toThrow(/Unknown scheduling mode/);
  });
});
