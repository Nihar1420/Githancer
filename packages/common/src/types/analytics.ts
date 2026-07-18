/** Executed-commit count for a single calendar day. */
export interface DailyCommit {
  date: string; // YYYY-MM-DD
  count: number;
}

/** Executed-commit count for a single week. */
export interface WeeklyTrend {
  weekStart: string; // YYYY-MM-DD (Monday, per DATE_TRUNC('week'))
  count: number;
}

/** Executed-commit count for a day-of-week / hour bucket. */
export interface ActiveHour {
  dayOfWeek: number; // 0 = Sunday .. 6 = Saturday (Postgres DOW convention)
  hour: number; // 0..23
  count: number;
}

export interface AnalyticsSummary {
  totalCommits: number;
  executedCommits: number;
  pendingCommits: number;
  longestStreak: number;
  peakHour: number;
  peakDay: number;
  completionPercentage: number;
}

export interface FullAnalytics {
  summary: AnalyticsSummary;
  dailyCommits: DailyCommit[];
  weeklyTrends: WeeklyTrend[];
  activeHours: ActiveHour[];
}

/** Commit-queue counts for a project. */
export interface QueueStats {
  total: number;
  executed: number;
  pending: number; // pending + in_flight
  skipped: number;
}
