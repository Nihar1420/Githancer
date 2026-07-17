import { MS_PER_MINUTE } from './date.util';

export interface CollisionResult {
  /** Input timestamps, sorted ascending, with all collisions resolved. */
  resolved: Date[];
  /** How many timestamps had to be shifted to remove a collision. */
  collisionCount: number;
}

/**
 * Resolve timestamps that are equal or closer than `minGapMs` by shifting the
 * later one forward, cascading as needed so every result is at least
 * `minGapMs` apart. Pure — does not mutate the input.
 */
export function detectCollisions(
  timestamps: Date[],
  minGapMs: number = MS_PER_MINUTE,
): CollisionResult {
  const sorted = [...timestamps].sort((a, b) => a.getTime() - b.getTime());
  const resolved: Date[] = [];
  let collisionCount = 0;

  for (const ts of sorted) {
    if (resolved.length === 0) {
      resolved.push(new Date(ts.getTime()));
      continue;
    }
    const prev = resolved[resolved.length - 1];
    if (ts.getTime() - prev.getTime() < minGapMs) {
      collisionCount++;
      resolved.push(new Date(prev.getTime() + minGapMs));
    } else {
      resolved.push(new Date(ts.getTime()));
    }
  }

  return { resolved, collisionCount };
}
