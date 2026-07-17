export const MS_PER_MINUTE = 60_000;
export const MS_PER_DAY = 86_400_000;

/** True for Saturday (6) or Sunday (0) in UTC. */
export function isWeekend(d: Date): boolean {
  const day = d.getUTCDay();
  return day === 0 || day === 6;
}

/** Return a new Date shifted by `minutes` (may be fractional/negative). */
export function addMinutes(d: Date, minutes: number): Date {
  return new Date(d.getTime() + minutes * MS_PER_MINUTE);
}

/** Return a new Date shifted by whole `days`. */
export function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * MS_PER_DAY);
}

/** Midnight UTC of the given date. */
export function startOfDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Move a date forward to the next weekday if it lands on a weekend. */
export function adjustToWeekday(d: Date): Date {
  let x = new Date(d.getTime());
  while (isWeekend(x)) {
    x = addDays(x, 1);
  }
  return x;
}
