import { existsSync, readFileSync, writeFileSync, renameSync } from 'fs';
import { join } from 'path';

interface CacheShape {
  projectId?: string;
  cachedAt?: string;
  timestamps: string[];
}

const CACHE_FILE = '.timeline-cache.json';

export class CacheService {
  private readonly path = join(process.cwd(), CACHE_FILE);
  private readonly tmpPath = join(process.cwd(), `${CACHE_FILE}.tmp`);

  private load(): CacheShape {
    if (!existsSync(this.path)) {
      return { timestamps: [] };
    }
    return JSON.parse(readFileSync(this.path, 'utf8')) as CacheShape;
  }

  /** Atomic write: write to a temp file, then rename over the target. */
  private persist(data: CacheShape): void {
    writeFileSync(this.tmpPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
    renameSync(this.tmpPath, this.path);
  }

  hasTimestamps(): boolean {
    return this.load().timestamps.length > 0;
  }

  peekNext(): string | null {
    const { timestamps } = this.load();
    return timestamps.length > 0 ? timestamps[0] : null;
  }

  popNext(): string {
    const data = this.load();
    if (data.timestamps.length === 0) {
      throw new Error('Cache is empty. Run "timeline sync".');
    }
    const next = data.timestamps.shift() as string;
    this.persist(data);
    return next;
  }

  remaining(): number {
    return this.load().timestamps.length;
  }

  save(timestamps: string[]): void {
    this.persist({
      ...this.load(),
      timestamps: [...timestamps].sort(),
      cachedAt: new Date().toISOString(),
    });
  }

  /** Merge new timestamps in, de-duplicating by value and sorting ascending. */
  merge(newTimestamps: string[]): void {
    const current = this.load();
    const deduped = Array.from(new Set([...current.timestamps, ...newTimestamps])).sort();
    this.persist({ ...current, timestamps: deduped, cachedAt: new Date().toISOString() });
  }
}
