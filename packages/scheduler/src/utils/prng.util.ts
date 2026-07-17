import seedrandom from 'seedrandom';

/** A seeded pseudo-random generator returning a float in [0, 1). */
export type Prng = () => number;

const DEFAULT_SEED = 'gtm-default-seed';

/** Create a deterministic PRNG. Same seed always yields the same sequence. */
export function createPrng(seed?: string): Prng {
  return seedrandom(seed ?? DEFAULT_SEED);
}

/**
 * Draw a normally-distributed value via the Box-Muller transform.
 * Deterministic for a given PRNG state.
 */
export function gaussian(prng: Prng, mean: number, stddev: number): number {
  const u1 = 1 - prng(); // (0, 1] — avoids log(0)
  const u2 = prng();
  const magnitude = Math.sqrt(-2 * Math.log(u1));
  return mean + stddev * magnitude * Math.cos(2 * Math.PI * u2);
}
