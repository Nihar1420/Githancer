# Githancer

> Git timeline management for developers.

Githancer lets you plan a project's commit history across a date range and then
lay commits down on that timeline. You define a repository, a window, a commit
count, and a scheduling strategy; the backend generates a deterministic queue of
timestamps; and the CLI creates backdated commits from that queue — online or
offline. A dashboard visualises progress, and optional AI suggests commit
messages.

## Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS 10, TypeScript, port 3001 |
| Frontend | Next.js 14 (App Router), Tailwind CSS |
| CLI | Node.js + Commander (`timeline`) |
| Database | PostgreSQL 16 via TypeORM (migrations) |
| Auth | GitHub OAuth 2.0 + JWT (httpOnly cookie) |
| AI | Anthropic API (optional) |
| Deploy | Docker · Railway (backend + DB) · Vercel (frontend) |

## Quick Start (Local)

**Prerequisites:** Node 20+, pnpm 9 (`corepack enable`), Docker + Docker Compose, Git.

```bash
# 1. Install
pnpm install

# 2. Configure env
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.local.example apps/frontend/.env.local
# Fill in JWT_SECRET (openssl rand -base64 48) and
# ENCRYPTION_KEY (openssl rand -hex 32) in apps/backend/.env

# 3. Bring up Postgres + backend + frontend
cd infra/docker && docker compose up -d

# 4. Run migrations (first time)
sh infra/scripts/migrate.sh
```

Backend: http://localhost:3001/api/v1/health · Frontend: http://localhost:3000

To develop the frontend against fixtures (no backend needed), set
`NEXT_PUBLIC_USE_MOCK=true` in `apps/frontend/.env.local`.

## CLI Usage

```bash
timeline init      # create .timeline.json (project id, branch, API url)
timeline login     # authenticate and store the CLI API key
timeline sync      # fetch + cache upcoming commit timestamps
timeline commit    # backdated commit from the next timestamp (-m or AI suggestion)
timeline push      # push the configured branch to origin
timeline status    # show queue progress (completed / remaining / next)
```

## Project Structure

```
githancer/
├── apps/
│   ├── backend/     NestJS API + auth + analytics + AI
│   ├── frontend/    Next.js dashboard
│   └── cli/         timeline CLI
├── packages/
│   ├── common/      shared types (scheduler, analytics, DTOs)
│   └── scheduler/   deterministic scheduling strategies
├── infra/
│   ├── docker/      Dockerfiles + docker-compose
│   ├── railway/     Railway deploy config
│   ├── scripts/     migrate.sh, seed-check.sh
│   └── docs/        CI/CD secrets reference
└── .github/workflows/  CI + deploy pipelines
```

## Development

```bash
pnpm --filter backend dev            # NestJS watch (:3001)
pnpm --filter frontend dev           # Next.js dev (:3000)
pnpm --filter git-timeline-manager-cli dev

pnpm --filter @gtm/scheduler test    # scheduler unit tests (100% branch)
pnpm --filter backend test           # backend unit tests
pnpm --filter frontend test          # frontend (Vitest)

pnpm --filter backend migration:generate   # after entity changes
pnpm --filter backend migration:run
```

## Deployment

- **Backend → Railway** (Dockerfile-based, `infra/railway/railway.json`) with a
  PostgreSQL add-on. Pushes to `main` touching `apps/backend/**` or `packages/**`
  trigger `deploy-backend.yml`.
- **Frontend → Vercel** — pushes touching `apps/frontend/**` trigger
  `deploy-frontend.yml`.
- Required env vars and CI/CD secrets: see
  `.claude/documentation/git-timeline-manager/03_ENV_AND_KEYS.md` and
  `infra/docs/github-secrets.md`.
