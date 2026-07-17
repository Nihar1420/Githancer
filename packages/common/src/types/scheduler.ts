/**
 * ISO-8601 UTC timestamp string, e.g. "2026-07-20T09:30:00.000Z".
 * The scheduler emits these; the CLI applies them as commit dates.
 */
export type Timestamp = string;

/** Supported scheduling strategies. */
export enum SchedulingMode {
  LINEAR = 'linear',
  RANDOM = 'random',
  SPRINT = 'sprint',
  HUMAN_LIKE = 'human_like',
  TEAM = 'team',
}

/** Config for the SPRINT strategy — burst periods followed by quiet periods. */
export interface SprintConfig {
  /** Active days per sprint cycle. */
  sprintDays: number;
  /** Idle days per sprint cycle. */
  quietDays: number;
  /** Commits distributed across each active window. */
  commitsPerSprint: number;
}

/** Config for the TEAM strategy — coordinated multi-user spread. */
export interface TeamConfig {
  /** Number of collaborators in the team. */
  teamSize: number;
  /** 0-based index of the current user within the team. */
  userIndex: number;
  /** Total spread window (hours) across which the team is offset. */
  spreadHours: number;
}

/** Input contract for `generateSchedule`. */
export interface SchedulerInput {
  mode: SchedulingMode;
  /** Inclusive range start (ISO date, YYYY-MM-DD). */
  startDate: string;
  /** Inclusive range end (ISO date, YYYY-MM-DD). */
  endDate: string;
  totalCommits: number;
  /** Required for deterministic RANDOM / HUMAN_LIKE output. */
  seed?: string;
  /** Skip weekends when true. */
  workingDaysOnly?: boolean;
  /** Preferred hours-of-day (0-23) for HUMAN_LIKE distribution. */
  preferredHours?: number[];
  /** Present when mode === SPRINT. */
  sprint?: SprintConfig;
  /** Present when mode === TEAM. */
  team?: TeamConfig;
}

/** Output contract for `generateSchedule` — ordered ascending. */
export interface SchedulerOutput {
  timestamps: Timestamp[];
  mode: SchedulingMode;
  totalGenerated: number;
}

/** A gap between two consecutive scheduled timestamps. */
export interface GapInfo {
  start: Timestamp;
  end: Timestamp;
  durationMs: number;
}
