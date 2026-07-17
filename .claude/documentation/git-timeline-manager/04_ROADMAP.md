# Git Timeline Manager — Project Roadmap
# Version 1.0 — July 2026

---

## Overview

| Phase | Focus | Status |
|-------|-------|--------|
| 1 | Foundation: monorepo scaffold, DB, auth | ⏳ Pending |
| 2 | Core Engine: scheduler package + project/queue backend | ⏳ Pending |
| 3 | API & CLI: REST layer + Node.js CLI tool | ⏳ Pending |
| 4 | Dashboard UI: Next.js frontend, heatmap, timeline editor | ⏳ Pending |
| 5 | AI & Analytics: commit suggestions, charts | ⏳ Pending |
| 6 | DevOps & Launch: Docker, Railway, Vercel, CI/CD | ⏳ Pending |

---

## Phase 1 — Foundation

**Goal:** Working monorepo with auth, database, and local dev environment.

- [ ] Initialize PNPM monorepo (`pnpm-workspace.yaml`)
- [ ] Scaffold NestJS app (`apps/backend`)
- [ ] Scaffold Next.js app (`apps/frontend`)
- [ ] Scaffold CLI package (`apps/cli`)
- [ ] Create `packages/common` with shared types
- [ ] Create `packages/scheduler` skeleton
- [ ] PostgreSQL local setup via Docker Compose
- [ ] TypeORM config + initial migrations (Users, Projects, CommitQueue, CliSessions tables)
- [ ] GitHub OAuth App created (dev)
- [ ] GitHub OAuth flow in NestJS (Passport.js strategy)
- [ ] JWT issue + verify (guards)
- [ ] CLI API key generation + verification
- [ ] GitHub OAuth callback page in Next.js frontend
- [ ] `GET /api/v1/health` endpoint
- [ ] `.env` templates created for backend and frontend

**Exit criteria:** `pnpm dev` starts all apps; developer can log in with GitHub and receive a JWT.

---

## Phase 2 — Core Engine

**Goal:** Scheduler package fully implemented and tested; project + queue management working end-to-end.

### Scheduler Package (`packages/scheduler`)

- [ ] Define `SchedulerInput` / `SchedulerOutput` types in `packages/common`
- [ ] Implement Linear strategy
- [ ] Implement Random strategy (seeded PRNG via `seedrandom`)
- [ ] Implement Sprint strategy
- [ ] Implement Human-like strategy (Gaussian distribution)
- [ ] Implement Team Mode strategy
- [ ] Implement Collision Detector utility
- [ ] Implement Gap Finder utility
- [ ] Unit tests for all strategies (100% branch coverage)
- [ ] Integration test: `generateSchedule()` with each mode

### Backend — Projects & Queue

- [ ] `ProjectsModule`: CRUD + queue generation on create
- [ ] `CommitQueueModule`: next-commit pop, mark-executed, reorder
- [ ] `UsersModule`: profile + timezone update
- [ ] `GithubModule`: Octokit wrapper — list repos, list branches
- [ ] GitHub access token encryption/decryption utility
- [ ] TypeORM migrations for all entities

**Exit criteria:** `POST /api/v1/projects` creates a project and generates a full commit queue with correct timestamps.

---

## Phase 3 — API & CLI

**Goal:** Full REST API implemented; CLI tool usable for daily workflow.

### Backend — Remaining API Routes

- [ ] `GET /api/v1/projects/:id/next-commit` (with IN_FLIGHT locking)
- [ ] `PATCH /api/v1/commit-queue/:id` (mark executed + commit hash)
- [ ] `PUT /api/v1/projects/:id/queue/reorder`
- [ ] `GET /api/v1/analytics/:id`
- [ ] Rate limiting on all endpoints
- [ ] Request validation (class-validator DTOs)
- [ ] Global error filter + exception handling
- [ ] Backend unit tests (services)

### CLI (`apps/cli`)

- [ ] Commander.js CLI scaffold with `timeline` root command
- [ ] `timeline init` — create `.timeline.json`, add to `.gitignore`
- [ ] `timeline login` — open OAuth URL, store API key
- [ ] `timeline sync` — fetch + cache 20+ timestamps
- [ ] `timeline commit` — pop timestamp, backdated git commit
- [ ] `timeline push` — git push to remote
- [ ] `timeline status` — show queue progress
- [ ] Offline mode: cache-first commit with graceful degradation
- [ ] Atomic cache file writes (temp file + rename)
- [ ] CLI build: TypeScript → `dist/`, `bin` entry in `package.json`

**Exit criteria:** Developer can run the full workflow: `timeline init && timeline login && timeline sync && timeline commit -m "test" && timeline push`.

---

## Phase 4 — Dashboard UI

**Goal:** Next.js dashboard fully functional — create projects, view queue, edit timeline.

- [ ] Next.js app router setup with Tailwind CSS (dark theme configured)
- [ ] Auth middleware (redirect unauthed to login)
- [ ] Login page with "Sign in with GitHub" button
- [ ] `/dashboard` — project cards grid with progress rings
- [ ] `/projects/new` — create project form + repo picker (fetches from GitHub API)
- [ ] `/projects/[id]` — project detail with:
  - [ ] Queue status bar (executed / remaining)
  - [ ] HeatmapPreview component (GitHub-style contribution grid)
  - [ ] CommitQueueTable with pagination
  - [ ] TimelineEditor with drag-and-drop (dnd-kit)
  - [ ] SchedulingModeSelector
- [ ] React Query integration (data fetching hooks)
- [ ] Zustand auth store
- [ ] Error boundary + loading states on all pages
- [ ] Frontend unit tests (hooks)

**Exit criteria:** Developer can create a project, see the heatmap preview, and drag-and-drop commits to reschedule them.

---

## Phase 5 — AI & Analytics

**Goal:** Analytics charts working; AI commit message suggestions integrated.

### Analytics

- [ ] `GET /api/v1/analytics/:id` returns: daily commits, weekly trends, streak, active hours
- [ ] `/projects/[id]/analytics` page with recharts:
  - [ ] Daily commits bar chart
  - [ ] Weekly trends line chart
  - [ ] Active hours heatmap (hour × weekday matrix)
  - [ ] Longest streak metric card

### AI Commit Messages

- [ ] Anthropic API integration in backend (`POST /api/v1/ai/suggest-commit`)
- [ ] Context: repo name, recent executed commit messages, diff summary (optional)
- [ ] CLI: `timeline commit` offers AI suggestion when `ANTHROPIC_API_KEY` is set
- [ ] Dashboard: AI suggestion button on CommitQueueTable rows
- [ ] Graceful degradation: works fine without AI API key

**Exit criteria:** Analytics page loads with real data; running `timeline commit` prompts with an AI-suggested message.

---

## Phase 6 — DevOps & Launch

**Goal:** Fully containerized, deployed, with automated CI/CD.

- [ ] `Dockerfile.backend` (multi-stage, non-root user)
- [ ] `Dockerfile.frontend` (multi-stage)
- [ ] `docker-compose.yml` for local full-stack dev
- [ ] GitHub Actions: `ci.yml` (lint + test + build on PR)
- [ ] GitHub Actions: `deploy-backend.yml` (Railway on main push)
- [ ] GitHub Actions: `deploy-frontend.yml` (Vercel on main push)
- [ ] Railway project setup + PostgreSQL add-on
- [ ] Backend env vars set in Railway
- [ ] TypeORM migration run on deploy
- [ ] Vercel project setup + env vars
- [ ] GitHub OAuth App (production) created
- [ ] End-to-end smoke test on production URLs
- [ ] README.md with setup instructions

**Exit criteria:** Push to `main` automatically deploys backend to Railway and frontend to Vercel. Full workflow works on production URLs.

---

## Scheduler Algorithm Detail

For Phase 2 implementation reference:

### Linear Strategy
```
interval = (endDate - startDate) / totalCommits
timestamps = [startDate + (i * interval) + jitter(±30min) for i in range(totalCommits)]
```

### Random Strategy (seeded)
```
prng = seedrandom(seed)
timestamps = sort([randomDate(startDate, endDate, prng) for _ in range(totalCommits)])
```

### Sprint Strategy
```
sprintLen = sprintDays + quietDays
for each sprint cycle:
  activeStart = cycleStart
  activeEnd = cycleStart + sprintDays
  place commitsPerSprint timestamps within [activeStart, activeEnd]
  next cycle: cycleStart += sprintLen
```

### Human-like Strategy
```
for each day in [startDate, endDate] (skip weekends if workingDaysOnly):
  commitsThisDay = distribution.sample()
  for each commit:
    hour = gaussian(mean=preferredHours.sample(), σ=1.5)
    minute = prng() * 60
    timestamp = day + hour + minute
```

### Team Mode
```
offset = userIndex * (spreadHours / teamSize) * 60 minutes
apply offset to all timestamps generated by Linear/Human strategy
```

---

## Key Dependencies (All Apps)

```json
{
  "backend": {
    "@nestjs/core": "^10",
    "@nestjs/typeorm": "^10",
    "typeorm": "^0.3",
    "pg": "^8",
    "passport": "^0.7",
    "passport-github2": "^0.1",
    "@nestjs/passport": "^10",
    "@nestjs/jwt": "^10",
    "@octokit/rest": "^20",
    "@nestjs/throttler": "^5",
    "class-validator": "^0.14",
    "bcryptjs": "^2"
  },
  "frontend": {
    "next": "14",
    "react": "^18",
    "@tanstack/react-query": "^5",
    "zustand": "^4",
    "@dnd-kit/core": "^6",
    "recharts": "^2",
    "date-fns": "^3",
    "tailwindcss": "^3"
  },
  "cli": {
    "commander": "^12",
    "simple-git": "^3",
    "execa": "^8",
    "axios": "^1",
    "chalk": "^5",
    "ora": "^8",
    "seedrandom": "^3"
  },
  "scheduler": {
    "seedrandom": "^3"
  }
}
```
