import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HeatmapPreview } from '@/components/timeline/HeatmapPreview';

describe('HeatmapPreview', () => {
  it('renders 364 day cells (52 weeks x 7 days)', () => {
    render(<HeatmapPreview commitQueue={[{ scheduledAt: '2026-03-01T10:00:00Z', status: 'pending' }]} />);
    expect(screen.getAllByTestId('heatmap-cell')).toHaveLength(364);
  });

  it('applies an indigo color class for a day that has pending commits', () => {
    const { container } = render(
      <HeatmapPreview commitQueue={[{ scheduledAt: '2026-03-01T10:00:00Z', status: 'pending' }]} />,
    );
    expect(container.querySelectorAll('[class*="bg-indigo"]').length).toBeGreaterThan(0);
  });

  it('applies a green color class for executed commits', () => {
    const { container } = render(
      <HeatmapPreview commitQueue={[{ scheduledAt: '2026-03-01T10:00:00Z', status: 'executed' }]} />,
    );
    expect(container.querySelectorAll('[class*="bg-green"]').length).toBeGreaterThan(0);
  });
});
