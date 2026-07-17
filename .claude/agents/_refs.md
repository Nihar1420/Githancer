# Shared References — Git Timeline Manager

## Specification Files

```
.claude/documentation/git-timeline-manager/
├── 01_FUNCTIONAL_SPEC.md   ← User flows, functional requirements, feature scope
├── 02_TECHNICAL_SPEC.md    ← Stack, monorepo structure, entity schemas, API contracts
├── 03_ENV_AND_KEYS.md      ← Environment variables, GitHub OAuth setup, Railway/Vercel config
└── 04_ROADMAP.md           ← Phase-by-phase plan, scheduler algorithm breakdown, milestones
```

## Key File Paths (Monorepo)

```
apps/
├── backend/
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── auth/                          ← GitHub OAuth + JWT
│       │   ├── auth.module.ts
│       │   ├── auth.service.ts
│       │   ├── github.strategy.ts
│       │   ├── jwt.strategy.ts
│       │   └── guards/
│       ├── users/
│       │   ├── user.entity.ts
│       │   ├── users.module.ts
│       │   └── users.service.ts
│       ├── projects/
│       │   ├── project.entity.ts
│       │   ├── projects.module.ts
│       │   ├── projects.controller.ts
│       │   └── projects.service.ts
│       ├── commit-queue/
│       │   ├── commit-queue.entity.ts
│       │   ├── commit-queue.module.ts
│       │   ├── commit-queue.controller.ts
│       │   └── commit-queue.service.ts
│       ├── cli-sessions/
│       │   ├── cli-session.entity.ts
│       │   └── cli-sessions.service.ts
│       ├── github/
│       │   ├── github.module.ts
│       │   └── github.service.ts          ← Octokit wrapper
│       └── analytics/
│           ├── analytics.module.ts
│           ├── analytics.controller.ts
│           └── analytics.service.ts
│
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx                   ← Dashboard home (redirect if unauthed)
│       │   ├── auth/
│       │   │   └── callback/page.tsx      ← GitHub OAuth callback handler
│       │   ├── dashboard/
│       │   │   └── page.tsx              ← Main dashboard (project cards)
│       │   ├── projects/
│       │   │   ├── new/page.tsx          ← Create project
│       │   │   └── [id]/
│       │   │       ├── page.tsx          ← Project detail + timeline editor
│       │   │       └── analytics/page.tsx
│       │   └── api/                       ← Next.js API routes (auth proxy only)
│       ├── components/
│       │   ├── dashboard/
│       │   ├── timeline/
│       │   │   ├── HeatmapPreview.tsx
│       │   │   ├── TimelineEditor.tsx
│       │   │   └── SchedulingModeSelector.tsx
│       │   └── ui/                        ← Base UI primitives
│       ├── hooks/
│       │   ├── useProjects.ts
│       │   ├── useCommitQueue.ts
│       │   └── useAnalytics.ts
│       └── lib/
│           ├── api.ts                     ← API client (fetch wrapper)
│           └── auth.ts                    ← Session utilities
│
└── cli/
    └── src/
        ├── index.ts                       ← CLI entry point (Commander root)
        ├── commands/
        │   ├── init.ts                    ← timeline init
        │   ├── login.ts                   ← timeline login
        │   ├── sync.ts                    ← timeline sync
        │   ├── commit.ts                  ← timeline commit
        │   ├── push.ts                    ← timeline push
        │   └── status.ts                  ← timeline status
        ├── git/
        │   └── git.service.ts             ← simple-git wrapper
        ├── cache/
        │   └── cache.service.ts           ← .timeline-cache.json manager
        └── config/
            └── config.service.ts          ← .timeline.json reader/writer

packages/
├── common/
│   └── src/
│       ├── types/
│       │   ├── scheduler.ts               ← SchedulerInput, SchedulerOutput, Timestamp
│       │   ├── project.ts                 ← ProjectStatus, SchedulingMode enums
│       │   └── api.ts                     ← API request/response DTOs
│       └── index.ts
└── scheduler/
    └── src/
        ├── strategies/
        │   ├── linear.strategy.ts
        │   ├── random.strategy.ts
        │   ├── sprint.strategy.ts
        │   ├── human.strategy.ts
        │   └── team.strategy.ts
        ├── utils/
        │   ├── collision-detector.ts
        │   └── gap-finder.ts
        └── index.ts

infra/
├── docker/
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── docker-compose.yml
└── railway/
    └── railway.json
```

## Common Input Patterns

### STOP_MISSING
> Missing required input → **STOP and ASK**

### STOP_UNCLEAR
> Behavior/scope unclear → **STOP and ASK**

### STOP_CONTEXT
> Context missing → **STOP and ASK**

## Common Forbidden Patterns

### NO_FEATURE
- Feature invention / scope creep

### NO_SILENT
- Silent assumptions
- Guessing scheduler business logic

### NO_SECRETS
- Secrets in code or logs
- GitHub OAuth tokens exposed to frontend/CLI
- JWT secrets hardcoded

### NO_IMPURE_SCHEDULER
- Scheduler functions with side effects
- Non-deterministic timestamp generation (must be seeded/reproducible)

### NO_STYLE_ONLY
- Cosmetic-only changes without justification
- Inline styles when Tailwind utility exists
