import type { SVGProps } from 'react';

/**
 * Inline Tabler-style icons (outline, 24×24, stroke=currentColor).
 * Kept local so the landing page stays self-contained — no icon dependency.
 */
function Base({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconBrandGithub(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M9 19c-4.3 1.4 -4.3 -2.5 -6 -3m12 5v-3.5c0 -1 .1 -1.4 -.5 -2c2.8 -.3 5.5 -1.4 5.5 -6.1a4.6 4.6 0 0 0 -1.3 -3.2a4.2 4.2 0 0 0 -.1 -3.2s-1.1 -.3 -3.5 1.3a12.3 12.3 0 0 0 -6.2 0c-2.4 -1.6 -3.5 -1.3 -3.5 -1.3a4.2 4.2 0 0 0 -.1 3.2a4.6 4.6 0 0 0 -1.3 3.2c0 4.6 2.7 5.7 5.5 6.1c-.6 .6 -.6 1.2 -.5 2v3.5" />
    </Base>
  );
}

export function IconEyeOff(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M10.585 10.587a2 2 0 0 0 2.829 2.828" />
      <path d="M16.681 16.673a8.717 8.717 0 0 1 -4.681 1.327c-3.6 0 -6.6 -2 -9 -6c1.272 -2.12 2.712 -3.678 4.32 -4.674m2.86 -1.146a9.055 9.055 0 0 1 1.82 -.18c3.6 0 6.6 2 9 6c-.666 1.11 -1.379 2.067 -2.138 2.87" />
      <path d="M3 3l18 18" />
    </Base>
  );
}

export function IconClock(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
      <path d="M12 7v5l3 3" />
    </Base>
  );
}

export function IconUsers(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
      <path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      <path d="M21 21v-2a4 4 0 0 0 -3 -3.85" />
    </Base>
  );
}

export function IconCalendarEvent(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M4 5m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" />
      <path d="M16 3v4" />
      <path d="M8 3v4" />
      <path d="M4 11h16" />
      <path d="M8 15h2v2h-2z" />
    </Base>
  );
}

export function IconTerminal2(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M8 9l3 3l-3 3" />
      <path d="M13 15l3 0" />
      <path d="M3 4m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z" />
    </Base>
  );
}

export function IconChartDots(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M3 3v18h18" />
      <path d="M9 9m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
      <path d="M19 7m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
      <path d="M14 15m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
      <path d="M10.16 10.62l2.34 2.88" />
      <path d="M15.088 13.328l2.837 -4.586" />
    </Base>
  );
}

export function IconDragDrop(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M18 9l3 3l-3 3" />
      <path d="M15 12h6" />
      <path d="M6 9l-3 3l3 3" />
      <path d="M3 12h6" />
      <path d="M9 18l3 3l3 -3" />
      <path d="M12 15v6" />
      <path d="M9 6l3 -3l3 3" />
      <path d="M12 3v6" />
      <path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
    </Base>
  );
}

export function IconRobot(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M6 4m0 2a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v4a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2z" />
      <path d="M12 2v2" />
      <path d="M9 12v9" />
      <path d="M15 12v9" />
      <path d="M5 16l4 -2" />
      <path d="M15 14l4 2" />
      <path d="M9 18h6" />
      <path d="M10 8v.01" />
      <path d="M14 8v.01" />
    </Base>
  );
}

export function IconShieldCheck(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M11.46 20.846a12 12 0 0 1 -7.96 -14.846a12 12 0 0 0 8.5 -3a12 12 0 0 0 8.5 3a12 12 0 0 1 -.09 7.06" />
      <path d="M15 19l2 2l4 -4" />
    </Base>
  );
}
