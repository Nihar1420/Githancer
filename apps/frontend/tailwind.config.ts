import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'gtm-bg': '#0f172a', // slate-900
        'gtm-surface': '#1e293b', // slate-800
        'gtm-border': '#334155', // slate-700
        'gtm-accent': '#6366f1', // indigo-500
        'gtm-accent-hover': '#4f46e5', // indigo-600
        'gtm-success': '#22c55e', // green-500
        'gtm-warning': '#f59e0b', // amber-500
        'gtm-danger': '#ef4444', // red-500
        'gtm-text': '#f1f5f9', // slate-100
        'gtm-muted': '#94a3b8', // slate-400
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
