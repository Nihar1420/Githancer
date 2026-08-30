'use client';

const COLS = 52;
const ROWS = 7;

/** Deterministic pseudo-random in [0,1) so the pattern is stable per cell. */
function rand(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

type Cell = { kind: 'empty' | 'scheduled' | 'executed'; level: number };

function buildGrid(): Cell[][] {
  const grid: Cell[][] = [];
  for (let c = 0; c < COLS; c++) {
    const col: Cell[] = [];
    for (let r = 0; r < ROWS; r++) {
      const seed = c * 7 + r + 1;
      const roll = rand(seed);
      const isWeekend = r === 0 || r === 6;
      // Earlier weeks read as "executed" (green), later weeks as "scheduled" (indigo).
      const executedBias = c < COLS * 0.55;
      if (roll < (isWeekend ? 0.55 : 0.28)) {
        col.push({ kind: 'empty', level: 0 });
      } else {
        const level = Math.min(4, 1 + Math.floor(rand(seed * 1.7) * 4));
        col.push({ kind: executedBias ? 'executed' : 'scheduled', level });
      }
    }
    grid.push(col);
  }
  return grid;
}

const GRID = buildGrid();

const EXECUTED = ['', 'bg-green-900', 'bg-green-700', 'bg-green-500', 'bg-green-400'];
const SCHEDULED = ['', 'bg-indigo-900', 'bg-indigo-700', 'bg-indigo-500', 'bg-indigo-400'];

function cellClass(cell: Cell): string {
  if (cell.kind === 'empty') return 'bg-slate-800';
  return cell.kind === 'executed' ? EXECUTED[cell.level] : SCHEDULED[cell.level];
}

export function ContributionHeatmap() {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 shadow-2xl">
      <div className="flex gap-[3px] overflow-hidden">
        {GRID.map((col, c) => (
          <div key={c} className="flex flex-col gap-[3px]">
            {col.map((cell, r) => {
              const index = c * ROWS + r;
              return (
                <span
                  key={r}
                  className={`gtm-cell h-2.5 w-2.5 rounded-[2px] sm:h-3 sm:w-3 ${cellClass(cell)}`}
                  style={{ animationDelay: `${index * 3}ms` }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-end gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[2px] bg-green-500" /> Executed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[2px] bg-indigo-500" /> Scheduled
        </span>
      </div>
    </div>
  );
}
