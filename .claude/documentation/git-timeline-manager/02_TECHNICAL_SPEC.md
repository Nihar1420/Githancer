# Technical Specification — Git Timeline Manager
# Version 1.0 — July 2026

> STACK: NestJS 10 + Next.js 14 + Node.js CLI. PNPM monorepo. PostgreSQL via TypeORM.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS 10, TypeScript |
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| CLI | Node.js 20, Commander.js, simple-git, Execa |
| Database | PostgreSQL 16 |
| ORM | TypeORM (entities + migrations) |
| Auth | GitHub OAuth 2.0 (Passport.js) + JWT |
| GitHub API | Octokit (`@octokit/rest`) |
| Scheduler | Custom pure-function library (`packages/scheduler`) |
| Package Manager | PNPM 9 (monorepo workspace) |
| Deployment | Railway (backend + DB), Vercel (frontend) |
| CI/CD | GitHub Actions |
| Containerization | Docker (multi-stage builds) |

---

## Monorepo Structure

```
git-timeline-manager/
├── apps/
│   ├── backend/                    ← NestJS API
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── auth/
│   │   │   │   ├── auth.module.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── github.strategy.ts
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── guards/
│   │   │   │       ├── jwt-auth.guard.ts
│   │   │   │       └── github-oauth.guard.ts
│   │   │   ├── users/
│   │   │   │   ├── user.entity.ts
│   │   │   │   ├── users.module.ts
│   │   │   │   ├── users.controller.ts
│   │   │   │   └── users.service.ts
│   │   │   ├── projects/
│   │   │   │   ├── project.entity.ts
│   │   │   │   ├── projects.module.ts
│   │   │   │   ├── projects.controller.ts
│   │   │   │   └── projects.service.ts
│   │   │   ├── commit-queue/
│   │   │   │   ├── commit-queue.entity.ts
│   │   │   │   ├── commit-queue.module.ts
│   │   │   │   ├── commit-queue.controller.ts
│   │   │   │   └── commit-queue.service.ts
│   │   │   ├── cli-sessions/
│   │   │   │   ├── cli-session.entity.ts
│   │   │   │   ├── cli-sessions.module.ts
│   │   │   │   └── cli-sessions.service.ts
│   │   │   ├── github/
│   │   │   │   ├── github.module.ts
│   │   │   │   └── github.service.ts
│   │   │   ├── analytics/
│   │   │   │   ├── analytics.module.ts
│   │   │   │   ├── analytics.controller.ts
│   │   │   │   └── analytics.service.ts
│   │   │   └── database/
│   │   │       └── migrations/
│   │   ├── test/
│   │   └── package.json
│   │
│   ├── frontend/                   ← Next.js Dashboard
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   ├── auth/callback/page.tsx
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   └── projects/
│   │   │   │       ├── new/page.tsx
│   │   │   │       └── [id]/
│   │   │   │           ├── page.tsx
│   │   │   │           └── analytics/page.tsx
│   │   │   ├── components/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── timeline/
│   │   │   │   ├── analytics/
│   │   │   │   └── ui/
│   │   │   ├── hooks/
│   │   │   └── lib/
│   │   │       ├── api.ts
│   │   │       └── auth.ts
│   │   └── package.json
│   │
│   └── cli/                        ← Node.js CLI
│       ├── src/
│       │   ├── index.ts
│       │   ├── commands/
│       │   │   ├── init.ts
│       │   │   ├── login.ts
│       │   │   ├── sync.ts
│       │   │   ├── commit.ts
│       │   │   ├── push.ts
│       │   │   └── status.ts
│       │   ├── git/
│       │   ├── cache/
│       │   └── config/
│       └── package.json
│
├── packages/
│   ├── common/                     ← Shared types + DTOs
│   │   └── src/
│   │       ├── types/
│   │       │   ├── scheduler.ts
│   │       │   ├── project.ts
│   │       │   └── api.ts
│   │       └── index.ts
│   │
│   └── scheduler/                  ← Scheduling algorithm library
│       └── src/
│           ├── strategies/
│           │   ├── linear.strategy.ts
│           │   ├── random.strategy.ts
│           │   ├── sprint.strategy.ts
│           │   ├── human.strategy.ts
│           │   └── team.strategy.ts
│           ├── utils/
│           │   ├── collision-detector.ts
│           │   └── gap-finder.ts
│           ├── __tests__/
│           └── index.ts
│
├── infra/
│   ├── docker/
│   └── railway/
│
├── .github/workflows/
├── .claude/
├── pnpm-workspace.yaml
└── package.json
```

---

## TypeORM Entities

### User (`user.entity.ts`)
```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  githubId: string;

  @Column()
  username: string;

  @Column()
  avatarUrl: string;

  @Column({ select: false })           // Never returned in queries by default
  accessTokenEncrypted: string;

  @Column({ nullable: true, select: false })
  cliApiKeyHash: string;               // bcrypt hash of CLI API key

  @Column({ default: 'UTC' })
  timezone: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Project, project => project.owner)
  projects: Project[];
}
```

### Project (`project.entity.ts`)
```typescript
export enum ProjectStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
}

export enum SchedulingMode {
  LINEAR = 'linear',
  RANDOM = 'random',
  SPRINT = 'sprint',
  HUMAN_LIKE = 'human_like',
  TEAM = 'team',
}

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, user => user.projects)
  owner: User;

  @Column()
  repoFullName: string;          // e.g. "nihar/my-project"

  @Column()
  branch: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column()
  totalCommits: number;

  @Column({ type: 'enum', enum: SchedulingMode })
  schedulingMode: SchedulingMode;

  @Column({ type: 'enum', enum: ProjectStatus, default: ProjectStatus.ACTIVE })
  status: ProjectStatus;

  @Column({ type: 'jsonb', nullable: true })
  schedulerConfig: Record<string, unknown>;  // Mode-specific config

  @Column({ default: false })
  workingDaysOnly: boolean;

  @Column('int', { array: true, nullable: true })
  preferredHours: number[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => CommitQueue, entry => entry.project)
  commitQueue: CommitQueue[];
}
```

### CommitQueue (`commit-queue.entity.ts`)
```typescript
export enum CommitStatus {
  PENDING = 'pending',
  IN_FLIGHT = 'in_flight',    // popped by CLI, not yet confirmed
  EXECUTED = 'executed',
  SKIPPED = 'skipped',
}

@Entity('commit_queue')
export class CommitQueue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Project, project => project.commitQueue)
  project: Project;

  @Column({ type: 'timestamptz' })
  scheduledAt: Date;              // UTC timestamp to use for commit

  @Column({ type: 'enum', enum: CommitStatus, default: CommitStatus.PENDING })
  status: CommitStatus;

  @Column({ nullable: true })
  commitHash: string;

  @Column({ type: 'timestamptz', nullable: true })
  executedAt: Date;

  @Column({ type: 'int' })
  queueIndex: number;            // Ordering within project (0-based)

  @CreateDateColumn()
  createdAt: Date;
}
```

### CliSession (`cli-session.entity.ts`)
```typescript
@Entity('cli_sessions')
export class CliSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Project)
  currentProject: Project;

  @Column()
  machineId: string;             // Fingerprint: hostname + platform hash

  @Column({ type: 'timestamptz', nullable: true })
  lastSyncAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
```

---

## API Routes

All routes prefixed `/api/v1/`. Auth required unless marked public.

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/health` | Health check (public) |
| GET | `/api/v1/auth/github` | Initiate GitHub OAuth (public) |
| GET | `/api/v1/auth/github/callback` | GitHub OAuth callback (public) |
| POST | `/api/v1/auth/cli-token` | Generate CLI API key |
| DELETE | `/api/v1/auth/cli-token` | Revoke CLI API key |
| GET | `/api/v1/users/me` | Get current user profile |
| PATCH | `/api/v1/users/me` | Update timezone |
| GET | `/api/v1/projects` | List user projects |
| POST | `/api/v1/projects` | Create project + generate queue |
| GET | `/api/v1/projects/:id` | Project detail + queue stats |
| DELETE | `/api/v1/projects/:id` | Delete project + queue |
| GET | `/api/v1/projects/:id/next-commit` | Pop next pending timestamp (CLI) |
| GET | `/api/v1/projects/:id/queue` | Paginated queue list (dashboard) |
| PATCH | `/api/v1/commit-queue/:id` | Mark executed (CLI) or skipped |
| PUT | `/api/v1/projects/:id/queue/reorder` | Reorder queue (drag-and-drop) |
| GET | `/api/v1/analytics/:id` | Full analytics data for project |
| GET | `/api/v1/github/repos` | List user's GitHub repos (Octokit) |
| GET | `/api/v1/github/repos/:owner/:repo/branches` | List branches |

---

## Scheduler Package Contract

```typescript
// packages/scheduler/src/index.ts
export function generateSchedule(input: SchedulerInput): SchedulerOutput;

// Must be:
// - Pure function (no side effects)
// - Deterministic (same input + seed = same output, always)
// - Tested with 100% branch coverage
```

See `packages/common/src/types/scheduler.ts` for full type definitions (also in 01_FUNCTIONAL_SPEC.md section 5.2).

---

## Authentication Flow

### GitHub OAuth (Dashboard)
```
1. User → GET /api/v1/auth/github
2. Backend → redirect to github.com/login/oauth/authorize
3. GitHub → redirect to /api/v1/auth/github/callback?code=X
4. Backend exchanges code → access token (via Passport GitHub strategy)
5. Backend encrypts access token → stores in User.accessTokenEncrypted
6. Backend issues JWT (24h expiry) → sets httpOnly cookie
7. Backend redirects to /auth/callback on frontend
8. Frontend reads JWT from cookie → stores in Zustand (not localStorage)
```

### CLI API Key
```
1. CLI opens: {FRONTEND_URL}/auth/cli?machine={machineId}
2. User authenticates (reuses dashboard session)
3. Backend generates: crypto.randomBytes(32).toString('hex')
4. Backend stores: bcrypt.hash(key, 10) → User.cliApiKeyHash
5. Backend returns: raw key (shown ONCE to user, never again)
6. CLI stores: key in .timeline.json
7. CLI sends: Authorization: Bearer {key} on all API requests
8. Backend verifies: bcrypt.compare(incomingKey, User.cliApiKeyHash)
```

---

## Environment Variables

See `03_ENV_AND_KEYS.md` for full list. Key vars:

| Variable | Used By | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | Backend | PostgreSQL connection string |
| `GITHUB_CLIENT_ID` | Backend | OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | Backend | OAuth app client secret |
| `JWT_SECRET` | Backend | JWT signing secret (≥32 chars) |
| `ENCRYPTION_KEY` | Backend | AES-256 key for token encryption (32 bytes hex) |
| `FRONTEND_URL` | Backend | CORS origin + OAuth callback base |
| `NEXT_PUBLIC_API_URL` | Frontend | Backend API base URL |
| `PORT` | Backend | Server port (default 3001) |

---

## TypeORM Migration Strategy

- `synchronize: false` in all environments (dev, staging, prod)
- Migrations live in `apps/backend/src/database/migrations/`
- Migration naming: `{timestamp}-{description}.ts`
- Run via: `pnpm --filter backend migration:run`
- Generate via: `pnpm --filter backend migration:generate -- -n <name>`

---

## Rate Limiting

Apply `@nestjs/throttler` on these endpoints:

| Endpoint | Limit |
|----------|-------|
| `GET /api/v1/projects/:id/next-commit` | 10 req/min per project |
| `POST /api/v1/auth/cli-token` | 5 req/hour per user |
| `GET /api/v1/github/repos` | 10 req/min per user |

---

## Testing Strategy

| Layer | Framework | Coverage Target |
|-------|-----------|----------------|
| Scheduler package | Jest | 100% branch coverage (pure functions) |
| Backend services | Jest + NestJS testing utilities | 80%+ |
| Backend controllers | Jest (unit) | 70%+ |
| Frontend hooks | Vitest + React Testing Library | 70%+ |
| E2E | Playwright | Full CLI workflow + key dashboard flows |

---

## CLI Package Config (`apps/cli/package.json`)

```json
{
  "name": "git-timeline-manager-cli",
  "version": "1.0.0",
  "bin": {
    "timeline": "./dist/index.js"
  },
  "main": "./dist/index.js",
  "scripts": {
    "build": "tsc",
    "dev": "ts-node src/index.ts"
  }
}
```

---

## Open Technical Decisions

1. **Token encryption:** AES-256-GCM with random IV stored alongside ciphertext? Or use a KMS service? → Default to AES-256-GCM with env key for now, note KMS as future upgrade
2. **Seeded PRNG for scheduler:** Use `seedrandom` npm package or implement LCG? → Use `seedrandom` (well-tested, deterministic)
3. **CLI OAuth flow:** Open browser automatically (`open` package) or print URL? → Print URL + open automatically if `open` succeeds
4. **Database hosting on Railway:** Use Railway PostgreSQL add-on or Supabase? → Default to Railway add-on (simpler setup, co-located with backend)
5. **Frontend auth storage:** httpOnly cookie (SSR-safe) or Zustand memory only? → httpOnly cookie for JWT, Zustand for decoded user profile
