# Project Rules — Git Timeline Manager

> Refs: [_refs.md](_refs.md)
> Full specs: [documentation/git-timeline-manager/](../documentation/git-timeline-manager/)

## Stack

| Layer | Tech | Path |
|-------|------|------|
| Backend Framework | NestJS 10 (TypeScript) | `apps/backend/src/` |
| Frontend Framework | Next.js 14 (App Router) | `apps/frontend/src/` |
| CLI | Node.js + Commander.js | `apps/cli/src/` |
| Language | TypeScript | Throughout |
| Styling | Tailwind CSS | `apps/frontend/src/app/globals.css` |
| Database | PostgreSQL via TypeORM | `apps/backend/src/database/` |
| Auth | GitHub OAuth 2.0 + JWT | `apps/backend/src/auth/` |
| GitHub API | Octokit | `apps/backend/src/github/` |
| Git Operations (CLI) | simple-git | `apps/cli/src/git/` |
| CLI Framework | Commander.js | `apps/cli/src/commands/` |
| Process Runner (CLI) | Execa | `apps/cli/src/utils/` |
| Deployment | Docker + Railway (backend) + Vercel (frontend) | `infra/` |
| Package Manager | PNPM (monorepo) | `pnpm-workspace.yaml` |

## Monorepo Structure

```
git-timeline-manager/
├── apps/
│   ├── backend/          ← NestJS API + Scheduler Engine
│   ├── frontend/         ← Next.js Dashboard
│   └── cli/              ← Node.js CLI (timeline init/login/sync/commit/push/status)
├── packages/
│   ├── common/           ← Shared types, DTOs, constants
│   └── scheduler/        ← Scheduling algorithm library (imported by backend)
├── infra/
│   ├── docker/           ← Dockerfiles
│   └── railway/          ← Railway deploy config
├── .claude/              ← This folder
└── pnpm-workspace.yaml
```

## Architecture

- NestJS backend exposes REST API consumed by both Next.js frontend and CLI
- CLI caches timestamps locally (`.timeline-cache.json`) for offline support
- Scheduler Engine lives in `packages/scheduler/` — pure functions, no side effects, easily testable
- Frontend is purely a dashboard (no SSR business logic) — all data via API
- GitHub OAuth flow handled by backend; JWT issued to both frontend sessions and CLI API keys
- All API routes prefixed `/api/v1/`

## Database Schema (TypeORM Entities)

| Entity | File |
|--------|------|
| User | `apps/backend/src/users/user.entity.ts` |
| Project | `apps/backend/src/projects/project.entity.ts` |
| CommitQueue | `apps/backend/src/commit-queue/commit-queue.entity.ts` |
| CliSession | `apps/backend/src/cli-sessions/cli-session.entity.ts` |

## API Route Convention

```
GET    /api/v1/projects                     ← List user projects
POST   /api/v1/projects                     ← Create project + generate queue
GET    /api/v1/projects/:id                 ← Project detail + stats
DELETE /api/v1/projects/:id                 ← Delete project
GET    /api/v1/projects/:id/next-commit     ← Pop next scheduled timestamp (CLI)
PATCH  /api/v1/commit-queue/:id             ← Mark commit executed (CLI)
GET    /api/v1/projects/:id/status          ← Queue progress stats
GET    /api/v1/analytics/:id                ← Project analytics data
POST   /api/v1/auth/github                  ← GitHub OAuth callback
POST   /api/v1/auth/cli-token              ← Generate CLI API key
```

## Scheduler Strategies

All strategies live in `packages/scheduler/src/strategies/`:

| Strategy | File | Description |
|----------|------|-------------|
| Linear | `linear.strategy.ts` | Even spread across date range |
| Random | `random.strategy.ts` | Randomly distributed, seeded |
| Sprint | `sprint.strategy.ts` | Burst periods + quiet periods |
| Human-like | `human.strategy.ts` | Gaussian spread around preferred hours |
| Team Mode | `team.strategy.ts` | Multi-user coordinated spread |

Scheduler input/output contract: `SchedulerInput` → `Timestamp[]` (ordered). See `packages/common/src/types/scheduler.ts`.

## CLI Config

Local config stored at project root as `.timeline.json`:

```json
{
  "projectId": "string",
  "userId": "string",
  "branch": "string",
  "apiUrl": "string",
  "apiKey": "string"
}
```

Cache stored at `.timeline-cache.json` (20+ upcoming timestamps buffered).

## Code Quality

- No `any` — all types explicit
- No logic in NestJS controllers — business logic in services
- No logic in Next.js pages/components — in hooks and API layer
- Scheduler functions must be pure (no side effects, deterministic)
- TypeORM entities via TypeORM decorators — no raw SQL
- All environment variables validated via `@nestjs/config` + Joi schema

## Security

- GitHub OAuth access tokens encrypted at rest (AES-256) — never logged
- JWT secret from environment only
- CLI API keys: scoped, revocable, stored hashed
- All `/api/v1/` routes require valid JWT (guard via `@UseGuards(JwtAuthGuard)`)
- GitHub token only used server-side (backend), never exposed to frontend or CLI directly
- Rate limiting on commit queue endpoints (max 10 req/min per project)

## Design System — Dashboard UI

All frontend UI uses Tailwind CSS utility classes. No custom CSS unless Tailwind cannot express it.

```
Colors:
  Primary bg:    #0f172a  (slate-900)  — dark theme base
  Surface:       #1e293b  (slate-800)  — cards, panels
  Border:        #334155  (slate-700)  — dividers
  Accent:        #6366f1  (indigo-500) — primary actions, highlights
  Accent hover:  #4f46e5  (indigo-600)
  Success:       #22c55e  (green-500)  — completed states
  Warning:       #f59e0b  (amber-500)  — in-progress states
  Danger:        #ef4444  (red-500)    — errors, blocked states
  Text primary:  #f1f5f9  (slate-100)
  Text muted:    #94a3b8  (slate-400)

Fonts:
  UI:    Inter (system fallback: sans-serif)
  Mono:  JetBrains Mono (commit hashes, timestamps, code)
```

## Model Routing

| Tier | Model | Agents |
|------|-------|--------|
| Routing | `opus` | ORCHESTRATOR |
| Reasoning | `opus` | CRITICAL-THINKER, MONOREPO-ARCHITECT |
| Implementation | `sonnet` | BACKEND, FRONTEND, CLI, SCHEDULER-ENGINE, INFRA, PIPELINE-EXECUTOR |
| Extraction | `haiku` | STORYBOOK |

## Forbidden (Universal)

- Feature invention (unless role permits)
- Silent assumptions — STOP and ASK if unclear
- Spec deviation "for improvement"
- Unjustified rewrites
- Hardcoded colors outside the design token system above
- Any `any` type
- Secrets committed to git
- Raw SQL (use TypeORM query builder or repository methods)
- Mutable scheduler functions (must be pure/deterministic)
