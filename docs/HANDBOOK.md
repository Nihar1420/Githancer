# Githancer User Handbook

A complete guide to the Githancer web app, the `timeline` CLI, and using
Githancer as a team.

---

## 1. What is Githancer

Githancer helps you shape a repository's commit history across a stretch of
time. Instead of every commit landing at the exact moment you happen to run
`git commit`, you decide *up front* how a project's commits should be spread —
a date range, how many commits, and a rhythm (evenly, in bursts, or in a
natural human pattern) — and Githancer lays them down on that timeline for you.

Under the hood, Githancer turns your plan into a **queue of scheduled
timestamps**. The web dashboard is where you create projects and watch progress;
the `timeline` CLI is what you run in your repo to actually create each commit,
stamped with the next scheduled date from the queue. Because the CLI caches
upcoming timestamps locally, you can keep committing even with no internet.

You never lose your normal Git workflow — you still write real code and real
commit messages. Githancer only controls *when* each commit is dated and keeps a
tidy record of what's been done and what's still scheduled.

---

## 2. Web App Guide

### 2.1 Signing in

1. Open your Githancer URL in a browser (e.g. `https://githancer.vercel.app` —
   your team's deployment).
2. Click **Sign in with GitHub**.
3. GitHub asks you to authorize Githancer. Approve it.
4. You land on the **Dashboard** — a grid of your project cards (empty the first
   time, with a "Create your first project" button).

Your session is kept in a secure, httpOnly cookie. If you refresh, your avatar
and name reload automatically.

### 2.2 Creating your first project

Click **New Project**. The form has three steps.

**Step 1 — Repository**
- Search your GitHub repositories and pick one.
- Each row shows the repo name, a public/private badge, and when it was last
  pushed.
- After you select a repo, choose the **branch** (defaults to the repo's default
  branch, usually `main`).

**Step 2 — Timeline configuration**
- **Start date / End date** — the window your commits will be spread across.
  The end date must be after the start date.
- **Total commits** — how many commits to schedule (1–365).
- **Scheduling mode** — how the commits are distributed. In plain English:
  - **Linear** — evenly spaced across the whole range.
  - **Random** — scattered, but reproducible: the same settings always produce
    the same schedule.
  - **Sprint** — busy bursts followed by quiet stretches.
  - **Human-like** — mimics a real developer's rhythm (more mid-week and around
    your preferred hours, quieter on Fridays, nothing on weekends if you choose
    working-days-only).
  - **Team** — offsets your commits so several teammates aren't all committing at
    the same instant.
  - (Full descriptions in [Section 4](#4-scheduling-modes-explained).)
- **Working days only** — tick this to skip Saturdays and Sundays.
- **Preferred hours** — shown for **Human-like** mode: pick the times of day you
  usually commit (e.g. 10am, 2pm, 4pm). Commits cluster around these.
- **Timezone** — auto-detected from your browser and shown for reference.

**Step 3 — Review & create**
- You see a summary of every choice.
- Click **Create Project**. Githancer validates the repo/branch, generates the
  full commit queue, and takes you to the project's detail page.

After creating, a **project card** appears on your dashboard and the detail page
shows a **heatmap preview** of the whole schedule.

### 2.3 Understanding the dashboard

Each **project card** shows:
- **Repo name + branch** (branch shown as a small pill).
- **Status badge** — `active` (indigo), `paused` (amber), or `completed` (green).
- **Progress ring** — the percentage of commits already executed vs. the total.
- **Stats line** — "N completed · N remaining".
- **Next commit** — the date of the next scheduled commit (or "Queue complete").

Click any card to open its **detail page**.

### 2.4 Project detail page

- **Progress bar** — executed / total, plus the next scheduled date.
- **Heatmap preview** — a GitHub-style grid of 52 weeks × 7 days. Each square is
  a day; darker/brighter squares mean more commits that day. Scheduled commits
  use an indigo scale; executed commits use a green scale. Hover a square to see
  the exact count and date.
- **Timeline editor** — a draggable list of queue entries. Grab the handle on
  the left of a row and **drag to reschedule** its position in the queue; the new
  order saves automatically. Each row also has a **skip** action.
- **Commit queue table** — a paginated table. Columns:
  - **#** — the entry's position in the queue.
  - **Scheduled** — the date/time it will be (or was) committed.
  - **Status** — pending / in_flight / executed / skipped.
  - **Hash** — the Git commit hash once executed (short form).
  - **AI** — a "Suggest" button on pending rows (see [3.6](#36-ai-commit-messages)).
- **Delete project** — top-right; asks for confirmation, then removes the project
  and its entire queue.

### 2.5 Analytics page

Open a project, then click **View analytics →**.

- **Metric cards** — Total commits, Completed, Longest streak (most consecutive
  days with a commit), and Peak hour (your busiest time of day).
- **Daily commits** — a bar chart of executed commits per day.
- **Active hours** — a grid of weekday × hour, shaded by how often you commit in
  each slot, so you can see your real pattern at a glance.

---

## 3. CLI Guide

### 3.1 Installation

**Prerequisites:** Node.js 20+ and Git.

```bash
npm install -g githancer-cli
timeline --help      # verify — lists all 6 commands
```

### 3.2 First-time setup (per repo)

Run these once inside each repository you want to manage.

**Step 1 — `timeline init`**
```bash
timeline init
```
It prompts for:
- **API URL** (default `https://api.githancer.com` — your team's backend URL)
- **Project ID** (required) — find it in the dashboard: open the project, and
  it's the id in the URL `…/projects/<PROJECT_ID>`
- **Branch** (default `main`)

It writes a **`.timeline.json`** config file in the repo and adds
`.timeline.json` + `.timeline-cache.json` to your `.gitignore`.

**Step 2 — `timeline login`**
```bash
timeline login
```
It asks for your **User ID** and obtains an **API key**, storing it in
`.timeline.json`. Generate/copy the CLI API key from the dashboard's CLI-token
option if prompted to paste one. The key authenticates the CLI to the backend.

**Step 3 — `timeline sync`**
```bash
timeline sync
```
It downloads your upcoming scheduled timestamps and caches them locally in
**`.timeline-cache.json`** (buffering a healthy batch so you can work offline).
It warns you if fewer than 5 remain after syncing.

### 3.3 Daily workflow

The loop most developers follow:

```bash
# 1. Write code as you normally would, then stage-and-commit via the CLI:
timeline commit -m "feat: add search endpoint"
#   ✓ Committed 3f9ac21 as of Mar 4, 2026, 10:14 AM

# 2. Do more work, commit again:
timeline commit -m "test: cover search edge cases"
#   ✓ Committed a12bd44 as of Mar 5, 2026, 2:31 PM

# 3. When you're ready to publish:
timeline push
#   ✓ Pushed to main
```

Each `timeline commit` consumes the next scheduled timestamp and backdates the
commit to it. `timeline push` sends them to GitHub.

### 3.4 All 6 commands reference

**`timeline init`**
- *What:* creates `.timeline.json` and gitignores the CLI files.
- *Syntax:* `timeline init`
- *Example:* `timeline init` → answer the three prompts.
- *Common error:* nothing to authenticate yet — run `timeline login` next.

**`timeline login`**
- *What:* authenticates the CLI and stores your API key.
- *Syntax:* `timeline login`
- *Example:* `timeline login` → enter User ID (and paste an API key if asked).
- *Common error:* `.timeline.json not found` → run `timeline init` first.

**`timeline sync`**
- *What:* fetches and caches upcoming timestamps.
- *Syntax:* `timeline sync`
- *Example:* `timeline sync` → `✓ Synced 20 timestamps. Next: 2026-03-04T09:30:00.000Z`
- *Common error:* `Run "timeline login" to re-authenticate` → your key expired
  or is missing.

**`timeline commit [-m "message"]`**
- *What:* creates a backdated commit using the next scheduled timestamp.
- *Syntax:* `timeline commit -m "your message"`
- *Example:* `timeline commit -m "fix: null guard"` → `✓ Committed 3f9ac21 as of …`
- *Notes:* omit `-m` to be prompted (with an AI suggestion if configured).
- *Common errors:* `Not a git repository.`; `No cached timestamps. Run "timeline
  sync" first.`

**`timeline push`**
- *What:* pushes the configured branch to `origin`.
- *Syntax:* `timeline push`
- *Example:* `timeline push` → `✓ Pushed to main`
- *Common error:* standard Git push errors (auth, non-fast-forward) surface here.

**`timeline status`**
- *What:* shows queue progress.
- *Syntax:* `timeline status`
- *Example:*
  ```
  Completed:  12
  Remaining:  28
  Next:       Mar 4, 2026, 9:30 AM
  ```
- *Notes:* works offline using the local cache; shows a note when offline.

### 3.5 Offline mode

`timeline sync` caches a batch of upcoming timestamps in `.timeline-cache.json`.
While that cache has entries, `timeline commit` works **with no internet** — it
takes the next cached timestamp, makes the backdated commit, and records it
locally.

- When the cache runs low (the CLI warns under 5), run `timeline sync` while
  online to top it up.
- When you reconnect, the next `timeline sync` reconciles your local activity
  with the backend automatically.

### 3.6 AI commit messages

If the backend has `ANTHROPIC_API_KEY` configured, running `timeline commit`
**without** `-m` will offer an AI-suggested message:

```
AI suggests: feat: add pagination to project queue endpoint
[A]ccept / [E]dit / [S]kip (manual):
```
- **A** (or Enter) — use the suggestion as-is.
- **E** — edit the suggestion before committing.
- **S** — ignore it and type your own message.

The suggestion is generated from your repository name, branch, and your most
recent commit messages. If AI isn't configured (or you're offline), the CLI
quietly falls back to a normal manual prompt.

---

## 4. Scheduling Modes Explained

- **Linear** — like evenly slicing a loaf of bread: your commits are spaced out
  at regular intervals across the whole date range.
- **Random** — scattered across the range, but *reproducible*: the same project
  settings always produce the exact same schedule, so it's never truly chaotic.
- **Sprint** — intense bursts of commits followed by rest periods, mirroring real
  sprint cycles (heads-down weeks, then a lull).
- **Human-like** — mimics how a real developer actually commits: more in the
  morning and around your preferred hours, a bit more Monday–Thursday, lighter on
  Fridays, and (optionally) nothing on weekends.
- **Team** — spreads commits across team members by offsetting each person's
  times, so a whole team doesn't land commits at the same moment.

---

## 5. Team Usage Guide

### 5.1 How multiple team members use Githancer

- Every person signs in with **their own GitHub account** (their own Githancer
  account).
- Each person creates and owns **their own projects** — you only ever see your
  own.
- **Team mode** scheduling coordinates timestamps across members so activity is
  spread out rather than clustered.

### 5.2 Recommended workflow for a team of 3–5

- One Githancer project per personal repository per person.
- Aim for roughly **1–3 commits per working day**.
- Use **Human-like** mode for individual repos (natural personal rhythm), and
  **Team** mode where you want members' activity deliberately coordinated.
- Turn on **working days only** for a realistic weekday pattern.

### 5.3 What NOT to do

- **Don't share API keys** between team members — each person logs in with their
  own.
- **Don't commit `.timeline.json` or `.timeline-cache.json`** to Git (they're
  gitignored by `timeline init` — leave it that way; they hold your key and
  cache).
- **Don't reuse one project for different repos** — one project maps to one repo
  + branch.
- **Don't run `timeline commit` with nothing to commit** — make real code changes
  first, then commit.

---

## 6. Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Cache is empty. Run "timeline sync".` | Run `timeline sync` while online to refill the local cache. |
| `Run "timeline login" to re-authenticate` | Your API key is missing/expired — run `timeline login` again. |
| `.timeline.json not found. Run "timeline init" first.` | You're in a repo that hasn't been set up — run `timeline init`. |
| Dashboard shows the login page after refresh | Your session cookie was cleared or blocked — clear cookies for the site and sign in again. |
| Repos don't load in the New Project form | Your GitHub token needs a refresh — sign out and sign back in. |
| Commits aren't showing on GitHub | Confirm the `repo` and `branch` in `.timeline.json`, then run `timeline push`. |

---

## 7. Quick Reference Card

**Web app:** your Githancer URL (e.g. `https://githancer.vercel.app`)

**CLI commands**

| Command | Does |
|---------|------|
| `timeline init` | Set up `.timeline.json` for a repo |
| `timeline login` | Authenticate and store your API key |
| `timeline sync` | Cache upcoming scheduled timestamps |
| `timeline commit -m "msg"` | Backdated commit from the next timestamp |
| `timeline push` | Push the configured branch to origin |
| `timeline status` | Show completed / remaining / next |

**Scheduling modes**

| Mode | In one line |
|------|-------------|
| Linear | Evenly spaced across the range |
| Random | Scattered but reproducible |
| Sprint | Bursts, then quiet periods |
| Human-like | Natural developer rhythm |
| Team | Coordinated spread across teammates |

**Files created by the CLI** (both gitignored)

| File | What it holds |
|------|---------------|
| `.timeline.json` | Project id, branch, API URL, API key |
| `.timeline-cache.json` | Buffered upcoming timestamps for offline use |

**Support:** open an issue on the project's GitHub repository.
