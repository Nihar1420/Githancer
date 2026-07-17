# Functional Specification — Git Timeline Manager
# Version 1.0 — July 2026

> STACK: NestJS 10 (backend) + Next.js 14 App Router (dashboard) + Node.js CLI. PNPM monorepo.
> See `02_TECHNICAL_SPEC.md` for full stack and project structure.

---

## 1. Context & Goal

Developers contributing to client-owned private repositories accumulate real engineering experience that never appears on their public GitHub profiles. Their contribution graphs remain empty despite active daily work.

Git Timeline Manager is an internal developer platform that solves this by letting developers configure project timelines and scheduling rules once, then use a companion CLI to commit with pre-planned timestamps whenever they push code to their personal repositories. The result is a realistic, self-consistent contribution history across multiple projects.

**Intended users:** Small trusted teams of developers (≤10) using this for personal GitHub profile management and experimentation with Git history mechanics.

---

## 2. Functional Scope

### In Scope (Launch)
- GitHub OAuth authentication
- Repository management (link personal GitHub repos to projects)
- Timeline configuration (start/end dates, commit count, scheduling mode)
- Commit queue generation and management
- Node.js CLI for local commit workflow
- Offline support (cached timestamps)
- Dashboard with heatmap preview and project analytics
- AI commit message suggestions
- Timeline editor (drag-and-drop commit reschedule)

### Out of Scope (Launch)
- Public API / third-party integrations
- Mobile app
- Multi-organization GitHub support
- Automated push (CLI always requires human to run `timeline commit`)
- Billing or subscription model (internal tool only)

---

## 3. User Roles

| Role | Access |
|------|--------|
| **Developer** | Full access to their own projects, timelines, commit queues, analytics |

Single-role system — no admin panel needed. Each developer only sees their own data.

---

## 4. Page Structure (Dashboard)

```
/                          ← Root: redirect to /dashboard (authed) or login (unauthed)
/auth/callback             ← GitHub OAuth callback (internal)
/dashboard                 ← Project cards overview
/projects/new              ← Create project form
/projects/[id]             ← Project detail: timeline editor, heatmap, queue status
/projects/[id]/analytics   ← Project analytics: daily commits, streak, active hours
```

---

## 5. User Flows

### 5.1 Onboarding — First Login
```
1. Developer visits the dashboard URL
2. Clicks "Sign in with GitHub"
3. GitHub OAuth redirects to /auth/callback
4. Session created, user record created/updated
5. Redirected to /dashboard (empty state on first visit)
6. Prompted to create their first project
```

### 5.2 Create Project
```
1. Developer clicks "New Project" on dashboard
2. Selects a GitHub repository from their account (fetched via Octokit)
3. Selects branch (default: main)
4. Sets timeline configuration:
   - Start date
   - End date
   - Total number of commits
   - Scheduling mode (Linear / Random / Sprint / Human-like / Team)
   - Preferred working hours (for Human-like mode)
   - Timezone (auto-detected, overridable)
   - Working days only (checkbox)
5. System generates the full commit queue (ordered timestamps)
6. Heatmap preview renders the projected contribution graph
7. Developer reviews and clicks "Create Project"
8. Project created, commit queue saved to DB
```

### 5.3 CLI Workflow — Daily Development
```
1. Developer edits code on their local repo
2. Runs: timeline commit -m "Add feature X"
3. CLI reads .timeline-cache.json for next timestamp
4. CLI performs: git add -A && git commit with backdated timestamp
5. CommitQueue entry marked as executed (via API)
6. Developer continues coding
7. When ready to push: timeline push
8. Changes pushed to GitHub remote
```

### 5.4 CLI Setup (First Time)
```
1. Developer runs: timeline init (in their local repo)
2. CLI prompts for Project ID (found on dashboard) and branch
3. .timeline.json created at project root
4. Developer runs: timeline login
5. CLI opens GitHub OAuth in browser → token stored in .timeline.json
6. Developer runs: timeline sync
7. 20+ upcoming timestamps cached to .timeline-cache.json
```

### 5.5 Reschedule Commits (Timeline Editor)
```
1. Developer opens /projects/[id] on dashboard
2. Sees calendar-style queue view with all scheduled commits
3. Drags a commit to a different date/time slot
4. Collision detection prevents placing two commits at same timestamp
5. Saves updated queue
6. Runs timeline sync on CLI to pull updated cache
```

### 5.6 View Analytics
```
1. Developer opens /projects/[id]/analytics
2. Views: daily commit chart, weekly trends, longest streak, active hours heatmap
3. Optionally exports analytics data
```

---

## 6. Functional Requirements

### 6.1 Authentication

| ID | Requirement |
|----|-------------|
| AUTH-01 | Sign in via GitHub OAuth 2.0 only |
| AUTH-02 | On first login, create User record with GitHub ID, username, avatar, timezone |
| AUTH-03 | On repeat login, update access token |
| AUTH-04 | JWT issued after OAuth for dashboard session |
| AUTH-05 | Separate CLI API key generated on demand (revocable) |
| AUTH-06 | All dashboard routes redirect to login if unauthenticated |
| AUTH-07 | Logout clears session and revokes JWT |

### 6.2 Repository Management

| ID | Requirement |
|----|-------------|
| REPO-01 | Fetch list of user's GitHub repos via Octokit on project creation |
| REPO-02 | Show repo name, visibility (public/private), last push date |
| REPO-03 | Allow selecting any repo (public or private) |
| REPO-04 | Validate selected branch exists before saving |
| REPO-05 | Store repo full name (e.g. `nihar/my-project`) and branch on Project |

### 6.3 Timeline Configuration

| ID | Requirement |
|----|-------------|
| CONF-01 | Start date must be in the past or present (future projects not supported at launch) |
| CONF-02 | End date must be after start date |
| CONF-03 | Total commits: minimum 1, maximum 365 per project |
| CONF-04 | Scheduling mode: Linear, Random, Sprint, Human-like, Team |
| CONF-05 | Preferred hours: select 1–8 hour slots per day (for Human-like mode) |
| CONF-06 | Timezone: IANA timezone string, auto-detected from browser |
| CONF-07 | Working days only: exclude Saturday and Sunday when checked |

### 6.4 Commit Queue

| ID | Requirement |
|----|-------------|
| QUEUE-01 | On project creation, generate full ordered timestamp list via scheduler package |
| QUEUE-02 | Store each timestamp as a CommitQueue row with status: pending / executed / skipped |
| QUEUE-03 | GET /api/v1/projects/:id/next-commit returns the next pending timestamp and marks it as "in-flight" |
| QUEUE-04 | PATCH /api/v1/commit-queue/:id marks entry as executed with commit hash and executed time |
| QUEUE-05 | No two CommitQueue entries for the same project may share identical timestamps |
| QUEUE-06 | Queue entries can be reordered via timeline editor (drag-and-drop) |
| QUEUE-07 | Individual queue entries can be deleted (marked skipped) |

### 6.5 CLI

| ID | Requirement |
|----|-------------|
| CLI-01 | `timeline init` — creates .timeline.json, prompts for projectId and branch |
| CLI-02 | `timeline login` — initiates GitHub OAuth, stores API key in .timeline.json |
| CLI-03 | `timeline sync` — fetches ≥20 upcoming timestamps from API, writes .timeline-cache.json |
| CLI-04 | `timeline commit` — pops next timestamp from cache, commits with that date; accepts `-m` flag |
| CLI-05 | `timeline commit` — if no `-m` flag, prompts for commit message interactively |
| CLI-06 | `timeline push` — pushes current branch to GitHub remote |
| CLI-07 | `timeline status` — shows completed/remaining/next scheduled timestamp |
| CLI-08 | Offline mode: `timeline commit` works without internet if cache is non-empty |
| CLI-09 | On reconnect, `timeline sync` reconciles local cache with server state |
| CLI-10 | Both .timeline.json and .timeline-cache.json are added to .gitignore by `timeline init` |

### 6.6 Heatmap Preview

| ID | Requirement |
|----|-------------|
| HMAP-01 | Show GitHub-style contribution grid for the project's date range |
| HMAP-02 | Color intensity based on number of commits per day (0 = gray, 4+ = darkest green) |
| HMAP-03 | Preview reflects current queue state — updates when queue is edited |
| HMAP-04 | Show on project detail page before any commits are made |

### 6.7 Analytics

| ID | Requirement |
|----|-------------|
| ANAL-01 | Daily commits bar chart (actual executed commits over time) |
| ANAL-02 | Weekly trends line chart |
| ANAL-03 | Longest streak metric (consecutive days with ≥1 commit) |
| ANAL-04 | Active hours heatmap (hour × day-of-week matrix) |
| ANAL-05 | Progress: executed / total commits percentage |

### 6.8 AI Commit Messages

| ID | Requirement |
|----|-------------|
| AI-01 | `timeline commit` optionally suggests a commit message via AI |
| AI-02 | Suggestion uses context: repo name, project description, recent commit messages |
| AI-03 | Developer can accept, edit, or reject the suggestion |
| AI-04 | AI feature is optional — works without it if API key not configured |

---

## 7. Business Rules

1. A developer can have unlimited projects, each linked to one GitHub repo + branch
2. A project's timeline cannot be modified after any commits have been executed (create new project instead)
3. Timestamps are always stored in UTC; displayed in user's configured timezone
4. The scheduler must be deterministic — same config always produces the same queue
5. Collision detection is enforced at queue generation time and again at commit time
6. Offline cache file (`.timeline-cache.json`) must never be committed to git

---

## 8. Edge Cases & Error Handling

| Scenario | Expected Behavior |
|----------|------------------|
| Cache empty when `timeline commit` runs | Exit with code 1, message: "Cache empty — run `timeline sync` first" |
| Next timestamp is in the future | Allow commit anyway (future backdating is valid for planning ahead) |
| GitHub API rate limit hit during repo fetch | Show error, cache previous repo list, retry button |
| Collision detected during queue generation | Shift colliding timestamp by +1 minute, log collision count in metadata |
| User revokes GitHub OAuth access | On next API call, return 401, CLI prompts to run `timeline login` |
| Project deleted while commits still pending | Mark all pending queue entries as skipped |

---

## 9. Acceptance Criteria

**AUTH:**
- Given a new user visits the dashboard, when they click "Sign in with GitHub", then they are authenticated and redirected to /dashboard within 5 seconds

**PROJECT CREATION:**
- Given a logged-in user creates a project with 50 commits, linear mode, Jan 1–Dec 31, then 50 CommitQueue entries are created with no duplicate timestamps

**CLI COMMIT:**
- Given a developer has a non-empty cache, when they run `timeline commit -m "test"`, then a Git commit is created in their local repo with the backdated timestamp and the CommitQueue entry is marked executed

**OFFLINE MODE:**
- Given the developer is offline and has a cached timestamp, when they run `timeline commit`, then the commit succeeds without any network call

**HEATMAP:**
- Given a project with 100 commits over 6 months, when the developer views the project detail page, then a GitHub-style grid renders showing projected commit density

---

## 10. Open Questions

1. Should the timeline editor support bulk reschedule (e.g. "shift all commits after date X by 7 days")? ⏳
2. Team Mode — how are team members discovered? Manual entry of team size or invite via dashboard? ⏳
3. AI commit messages — use Anthropic API or local model? What context window to provide? ⏳
4. Should CLI be published to npm publicly or remain a private install? ⏳
5. Gap finder threshold — what default gap length triggers a warning? (7 days? 14 days?) ⏳
