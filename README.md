# Githancer

[![npm](https://img.shields.io/npm/v/githancer-cli?color=CB3837&logo=npm&style=flat-square)](https://www.npmjs.com/package/githancer-cli)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?logo=nestjs&logoColor=white&style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-000000?logo=nextdotjs&logoColor=white&style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white&style=flat-square)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white&style=flat-square)

> Plan a repository's commit history across a date range, then lay commits down on that timeline - from your terminal.

Githancer is a **Git timeline manager**. You define a repository, a date window, a commit count, and a scheduling strategy; the backend generates a deterministic queue of timestamps; and the CLI writes commits from that queue. A dashboard visualises the plan and progress, and optional AI drafts commit messages.

> ⚠️ Githancer creates **backdated commits**. Use it on your own repositories and be aware of your platform's and employer's policies around commit history.

## Install

```bash
npx githancer-cli --help      # zero-install
# or
npm i -g githancer-cli
```

## Architecture

Turborepo-style **pnpm monorepo**:

```
apps/
  backend/    NestJS 10 API (timeline generation, auth)      :3001
  frontend/   Next.js 14 (App Router) + Tailwind dashboard
  cli/        Node + Commander - the published githancer-cli
packages/
  scheduler/  deterministic timestamp-queue engine (shared)
  common/     shared types & utilities
infra/        Docker Compose (Postgres + services)
```

| Layer | Technology |
|-------|-----------|
| Backend | NestJS 10, TypeScript |
| Frontend | Next.js 14 (App Router), Tailwind CSS |
| CLI | Node.js + Commander, published to npm |
| Database | PostgreSQL 16 · TypeORM (migrations) |
| Auth | GitHub OAuth 2.0 + JWT (httpOnly cookie) |
| AI | Anthropic Claude API (optional commit messages) |
| Deploy | Docker · Railway (API + DB) · Vercel (dashboard) · CI/CD |

## Quick start (local)

**Prereqs:** Node 20+, pnpm 9 (`corepack enable`), Docker, Git.

```bash
pnpm install
cp apps/backend/.env.example apps/backend/.env        # set JWT_SECRET, ENCRYPTION_KEY
cp apps/frontend/.env.local.example apps/frontend/.env.local
cd infra/docker && docker compose up -d               # Postgres + backend + frontend
```

## How it works

1. **Define** - repo, date range, commit count, strategy (uniform, weighted, business-hours…).
2. **Generate** - the scheduler produces a reproducible queue of timestamps.
3. **Apply** - the CLI creates commits at those timestamps, online or offline.
4. **Track** - the dashboard shows the planned vs. realised timeline.

## License

MIT
