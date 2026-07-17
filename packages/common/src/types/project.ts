/** Lifecycle status of a project. */
export enum ProjectStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
}

/** Status of a single entry in a project's commit queue. */
export enum CommitStatus {
  PENDING = 'pending',
  /** Popped by the CLI, not yet confirmed executed. */
  IN_FLIGHT = 'in_flight',
  EXECUTED = 'executed',
  SKIPPED = 'skipped',
}
