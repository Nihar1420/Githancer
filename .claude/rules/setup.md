# Setup Guide — Git Timeline Manager

## Prerequisites

- Node.js >= 20
- PNPM 9+ (`npm i -g pnpm`)
- Claude Code CLI installed
- GitHub CLI (`gh`) authenticated
- Docker + Docker Compose (for local PostgreSQL)
- Git

---

## 1. Local Development Setup

### Clone and install
```bash
git clone <repo-url> git-timeline-manager
cd git-timeline-manager
pnpm install
```

### Environment variables

Copy templates and fill in values:
```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.local.example apps/frontend/.env.local
```

See `.claude/documentation/git-timeline-manager/03_ENV_AND_KEYS.md` for all variable descriptions.

### Start local PostgreSQL
```bash
docker-compose -f infra/docker/docker-compose.yml up -d postgres
```

### Run TypeORM migrations
```bash
pnpm --filter backend migration:run
```

### Start all apps
```bash
pnpm dev
# or individually:
pnpm --filter backend dev     # NestJS on :3001
pnpm --filter frontend dev    # Next.js on :3000
pnpm --filter cli dev         # CLI in watch mode
```

---

## 2. GitHub OAuth App Setup

1. Go to `github.com/settings/developers` → OAuth Apps → New OAuth App
2. Fill in:
   - Application name: `Git Timeline Manager (dev)`
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3001/api/v1/auth/github/callback`
3. Copy Client ID → `GITHUB_CLIENT_ID`
4. Generate secret → `GITHUB_CLIENT_SECRET`

---

## 3. MCP Servers

| Server | Package | Purpose |
|--------|---------|---------|
| `claude-flow` | `@claude-flow/cli@latest` | Multi-agent orchestration |
| `github` | `@anthropic/github-mcp@latest` | GitHub repo access for agents |

Configured in `.claude/settings.local.json` under `enabledMcpjsonServers`.

---

## 4. Project Structure

```
apps/backend/       NestJS API (port 3001)
apps/frontend/      Next.js Dashboard (port 3000)
apps/cli/           Node.js CLI (timeline commands)
packages/common/    Shared TypeScript types + DTOs
packages/scheduler/ Scheduling algorithm library
infra/              Docker, Railway, GitHub Actions
.claude/            Agents, specs, rules
```

---

## 5. Pipelines

| Pipeline | Use when | Input |
|----------|----------|-------|
| SPEC | Have a spec, want agents to implement | Spec doc path |
| BACKEND-ONLY | NestJS changes only | Description |
| FRONTEND-ONLY | Next.js changes only | Description |
| CLI-ONLY | CLI command changes only | Description |
| FEATURE | Full-stack feature | Feature description |
| PUSH | Wrote code manually, want tests + push | Code on branch |
| PR-REVIEW | Review a PR | PR number |
| IDEATION | Explore idea before building | Free text |

### Quick start
```
Activate ORCHESTRATOR
Task: Implement the linear and random scheduling strategies in packages/scheduler
Mode: AUTO
Scope: backend
```

---

## 6. Agent Quick Reference

| Agent | Role |
|-------|------|
| `ORCHESTRATOR` | Pipeline coordinator — start here |
| `BACKEND` | NestJS — routes, services, entities |
| `FRONTEND` | Next.js — pages, components, hooks |
| `CLI` | Node.js CLI — timeline commands |
| `SCHEDULER-ENGINE` | Scheduling algorithm strategies |
| `INFRA` | Docker + Railway + CI/CD |
| `FUNC-SPEC-WRITER` | Write functional specs |
| `FUNC-TO-TECH-SPEC` | Write technical specs |
| `CRITICAL-THINKER` | Challenge assumptions |
| `BACKEND-TESTS` | NestJS unit tests |
| `FRONTEND-TESTS` | React tests |
| `E2E` | Playwright end-to-end |

---

## 7. Troubleshooting

| Problem | Solution |
|---------|----------|
| PostgreSQL not starting | Check Docker: `docker ps` |
| TypeORM migration fails | Check `DATABASE_URL` in `.env` |
| GitHub OAuth redirect mismatch | Verify callback URL in GitHub App settings |
| `timeline login` fails | Check `apiUrl` in `.timeline.json` |
| Scheduler tests non-deterministic | Ensure `seed` param is provided |
| `pnpm install` fails | Node.js must be >=20 |
