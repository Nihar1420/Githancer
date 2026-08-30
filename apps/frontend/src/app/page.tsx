import Link from 'next/link';
import { LandingNav } from '@/components/landing/LandingNav';
import { ContributionHeatmap } from '@/components/landing/ContributionHeatmap';
import { SchedulingModes } from '@/components/landing/SchedulingModes';
import {
  IconBrandGithub,
  IconCalendarEvent,
  IconChartDots,
  IconClock,
  IconDragDrop,
  IconEyeOff,
  IconRobot,
  IconShieldCheck,
  IconTerminal2,
  IconUsers,
} from '@/components/landing/icons';

const GITHUB_URL = 'https://github.com/Nihar1420/Githancer';
const README_URL = 'https://github.com/Nihar1420/Githancer#readme';

const PROBLEM_CARDS = [
  {
    Icon: IconEyeOff,
    title: 'Hidden work',
    body: "Private repos don't show on your profile, even when the work is your best.",
  },
  {
    Icon: IconClock,
    title: 'Lost history',
    body: 'Offline work, deleted accounts, and migrated repos leave gaps that are hard to explain.',
  },
  {
    Icon: IconUsers,
    title: 'Team disconnect',
    body: 'Distributed teams committing at different times create inconsistent project timelines.',
  },
];

const STEPS = [
  {
    title: 'Create a project',
    body: 'Connect a GitHub repo, set your date range and commit count, choose a scheduling mode.',
  },
  {
    title: 'Configure your timeline',
    body: 'The scheduler generates a realistic commit queue — linear, random, sprint-based, or human-like.',
  },
  {
    title: 'Commit as you work',
    body: 'Run timeline commit instead of git commit. One command. Your work lands on the right date.',
  },
  {
    title: 'Track your progress',
    body: 'The dashboard shows your heatmap preview, queue status, and analytics in real time.',
  },
];

const FEATURES = [
  {
    Icon: IconCalendarEvent,
    title: 'Flexible scheduling',
    body: 'Linear, random, sprint, human-like, or team-coordinated commit distribution.',
  },
  {
    Icon: IconTerminal2,
    title: 'One-command CLI',
    body: 'timeline commit replaces git commit. Auto-pushes. Works offline with cached timestamps.',
  },
  {
    Icon: IconChartDots,
    title: 'Visual heatmap',
    body: 'See your projected contribution graph before a single commit is made.',
  },
  {
    Icon: IconDragDrop,
    title: 'Drag-and-drop editor',
    body: 'Reschedule commits on a visual timeline. Collision detection prevents overlaps.',
  },
  {
    Icon: IconRobot,
    title: 'AI-assisted commits',
    body: 'Optional AI commit message suggestions based on your repo context.',
  },
  {
    Icon: IconShieldCheck,
    title: 'Team-ready',
    body: 'Each developer has their own account. Team mode coordinates timestamps across members.',
  },
];

const STATS = [
  { value: '5 scheduling modes', label: 'Linear, Random, Sprint, Human-like, Team' },
  { value: '6 CLI commands', label: 'init, sync, commit, push, status, update-rules' },
  { value: '100%', label: 'Scheduler test coverage' },
  { value: '1 command', label: 'Full setup with timeline init' },
];

const TECH = [
  'NestJS',
  'Next.js',
  'TypeScript',
  'PostgreSQL',
  'Railway',
  'Vercel',
  'GitHub Actions',
  'Docker',
];

const FOOTER_LINKS = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'CLI Setup', href: '/cli-setup' },
  { label: 'GitHub', href: GITHUB_URL },
  { label: 'Handbook', href: `${GITHUB_URL}/blob/main/docs/HANDBOOK.md` },
];

function SectionLabel({ children }: { children: string }) {
  return (
    <span className="text-sm font-semibold uppercase tracking-wider text-indigo-400">
      {children}
    </span>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <LandingNav />

      {/* SECTION 2 — Hero */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="inline-block rounded-full border border-indigo-500 px-3 py-1 text-xs font-medium text-indigo-400">
              Open source · Built for developers
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-tight text-white sm:text-5xl">
              Your Git history,
              <br />
              managed with intention.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-400">
              Githancer helps development teams schedule and manage commit timelines across
              repositories — so your contribution history reflects the work you actually did, when
              you did it.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/login"
                className="rounded-lg bg-indigo-500 px-6 py-3 font-medium text-white transition-colors hover:bg-indigo-600"
              >
                Get started free
              </Link>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-6 py-3 font-medium text-slate-200 transition-colors hover:bg-slate-800"
              >
                <IconBrandGithub className="h-5 w-5" />
                View on GitHub
              </a>
            </div>
            <p className="mt-6 text-sm text-slate-500">
              Used by developers working on private client projects, offline codebases, and
              distributed teams.
            </p>
          </div>
          <ContributionHeatmap />
        </div>
      </section>

      {/* SECTION 3 — Problem */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionLabel>The problem</SectionLabel>
        <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          Great work shouldn&apos;t be invisible.
        </h2>
        <div className="mt-6 grid max-w-3xl gap-4 text-slate-400">
          <p>
            Most developers spend the majority of their time contributing to client-owned private
            repositories. The work is real, the impact is significant — but the public GitHub
            profile stays empty. Recruiters and clients see a blank contribution graph and draw the
            wrong conclusions.
          </p>
          <p>
            Githancer was built to solve this. It gives development teams a structured way to
            maintain their own repositories alongside client work — with commit histories that
            honestly reflect the cadence and volume of real development activity.
          </p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {PROBLEM_CARDS.map(({ Icon, title, body }) => (
            <div
              key={title}
              className="rounded-xl border border-slate-700 bg-slate-800 p-6"
            >
              <Icon className="h-8 w-8 text-indigo-400" />
              <h3 className="mt-4 text-lg font-semibold text-slate-100">{title}</h3>
              <p className="mt-2 text-sm text-slate-400">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4 — How it works */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-16">
        <SectionLabel>How it works</SectionLabel>
        <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          Schedule once. Commit naturally.
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <div key={step.title} className="rounded-xl border border-slate-700 bg-slate-800 p-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/20 font-bold text-indigo-300">
                {i + 1}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-slate-100">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{step.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 overflow-x-auto rounded-xl border border-slate-700 bg-slate-950 p-6 font-mono text-sm">
          <pre className="whitespace-pre">
            <span className="text-slate-400">$ </span>
            <span className="text-white">npm install -g githancer-cli</span>
            {'\n'}
            <span className="text-slate-400">$ </span>
            <span className="text-white">timeline init</span>
            {'\n'}
            <span className="text-green-400">✓ Opening Githancer in your browser...</span>
            {'\n'}
            <span className="text-green-400">✓ Configured successfully!</span>
            {'\n'}
            <span className="text-slate-400">{'  Project: Nihar1420/my-project'}</span>
            {'\n'}
            <span className="text-slate-400">{'  Branch:  main'}</span>
            {'\n'}
            <span className="text-slate-400">$ </span>
            <span className="text-white">timeline commit -m &quot;feat: add search endpoint&quot;</span>
            {'\n'}
            <span className="text-green-400">✓ Committed 3f9ac21 as of Mar 4, 2026, 10:14 AM</span>
            {'\n'}
            <span className="text-green-400">✓ Pushed to main</span>
          </pre>
        </div>
      </section>

      {/* SECTION 5 — Features */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionLabel>Features</SectionLabel>
        <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          Everything your team needs.
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ Icon, title, body }) => (
            <div key={title} className="rounded-xl border border-slate-700 bg-slate-800 p-6">
              <Icon className="h-8 w-8 text-indigo-400" />
              <h3 className="mt-4 text-lg font-semibold text-slate-100">{title}</h3>
              <p className="mt-2 text-sm text-slate-400">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 6 — Scheduling modes */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionLabel>Scheduling modes</SectionLabel>
        <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          Built for how developers actually work.
        </h2>
        <div className="mt-10">
          <SchedulingModes />
        </div>
      </section>

      {/* SECTION 7 — Stats */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionLabel>By the numbers</SectionLabel>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat) => (
            <div
              key={stat.value}
              className="rounded-xl border border-slate-700 bg-slate-800 p-6 text-center"
            >
              <p className="text-2xl font-bold text-indigo-400">{stat.value}</p>
              <p className="mt-2 text-sm text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 8 — Tech stack */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionLabel>Built with</SectionLabel>
        <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          Modern stack, production-ready.
        </h2>
        <div className="mt-8 flex flex-wrap gap-3">
          {TECH.map((tech) => (
            <span
              key={tech}
              className="rounded-full border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-300"
            >
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* SECTION 9 — CTA banner */}
      <section className="border-y border-indigo-800 bg-indigo-950">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to manage your Git timeline?
          </h2>
          <p className="mt-4 text-lg text-indigo-200">
            Set up in under 2 minutes. No credit card required.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/login"
              className="rounded-lg bg-indigo-500 px-8 py-3 text-lg font-medium text-white transition-colors hover:bg-indigo-600"
            >
              Get started free
            </Link>
            <a
              href={README_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-indigo-700 px-8 py-3 text-lg font-medium text-indigo-100 transition-colors hover:bg-indigo-900"
            >
              Read the docs
            </a>
          </div>
        </div>
      </section>

      {/* SECTION 10 — Footer */}
      <footer className="border-t border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-bold text-slate-300">Githancer</p>
            <p className="mt-1">Built by Nihar Ranjan Hota</p>
          </div>
          <div className="flex flex-wrap gap-4">
            {FOOTER_LINKS.map((link) =>
              link.href.startsWith('/') ? (
                <Link
                  key={link.label}
                  href={link.href}
                  className="transition-colors hover:text-slate-300"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-slate-300"
                >
                  {link.label}
                </a>
              ),
            )}
          </div>
          <a
            href="https://www.npmjs.com/package/githancer-cli"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-slate-300"
          >
            githancer-cli on npm
          </a>
        </div>
      </footer>
    </div>
  );
}
