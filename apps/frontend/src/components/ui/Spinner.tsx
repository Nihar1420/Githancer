type Size = 'sm' | 'md' | 'lg';

const dims: Record<Size, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-4',
};

export function Spinner({ size = 'md', className = '' }: { size?: Size; className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block animate-spin rounded-full border-gtm-accent border-t-transparent ${dims[size]} ${className}`}
    />
  );
}
