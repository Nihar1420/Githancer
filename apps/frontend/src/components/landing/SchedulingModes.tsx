'use client';

import { useState } from 'react';

const MODES = [
  {
    name: 'Linear',
    description: 'Evenly spaced commits across your date range — steady, predictable cadence.',
  },
  {
    name: 'Random',
    description: 'Naturally scattered commits with organic gaps and bursts.',
  },
  {
    name: 'Sprint',
    description: 'Concentrated activity in sprint windows with quieter stretches between.',
  },
  {
    name: 'Human-like',
    description: 'Weighted toward working hours and weekdays — mirrors real developer rhythm.',
  },
  {
    name: 'Team',
    description: 'Coordinated timestamps across team members for consistent project timelines.',
  },
];

export function SchedulingModes() {
  const [selected, setSelected] = useState(3);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {MODES.map((mode, i) => {
        const isSelected = i === selected;
        return (
          <button
            key={mode.name}
            type="button"
            onClick={() => setSelected(i)}
            aria-pressed={isSelected}
            className={`rounded-xl border p-5 text-left transition-colors ${
              isSelected
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-slate-700 bg-slate-800 hover:border-slate-600'
            }`}
          >
            <h3
              className={`font-semibold ${isSelected ? 'text-indigo-300' : 'text-slate-100'}`}
            >
              {mode.name}
            </h3>
            <p className="mt-2 text-sm text-slate-400">{mode.description}</p>
          </button>
        );
      })}
    </div>
  );
}
