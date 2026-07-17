import type { Timestamp } from '@gtm/common';

/** Return timestamps that fall within `minGapMs` of a neighbour. Phase 2. */
export function detectCollisions(_timestamps: Timestamp[], _minGapMs: number): Timestamp[] {
  throw new Error('detectCollisions not implemented — Phase 2');
}
