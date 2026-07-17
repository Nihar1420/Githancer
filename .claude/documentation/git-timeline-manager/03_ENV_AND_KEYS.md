# Git Timeline Manager — Environment Variables & Integration Reference
# Version 1.0 — July 2026

---

## Backend Environment Variables (`apps/backend/.env`)

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://gtm_user:localpass@localhost:5432/git_timeline_manager

# GitHub OAuth App
GITHUB_CLIENT_ID=           # ⏳ Create OAuth App at github.com/settings/developers
GITHUB_CLIENT_SECRET=       # ⏳ From GitHub OAuth App settings

# JWT
JWT_SECRET=                 # Generate: openssl rand -base64 48
JWT_EXPIRES_IN=24h

# Encryption (for GitHub access tokens at rest)
ENCRYPTION_KEY=             # Generate: openssl rand -hex 32 (must be exactly 32 bytes = 64 hex chars)
ENCRYPTION_IV_LENGTH=16

# Frontend (for CORS + OAuth callback redirect)
FRONTEND_URL=http://localhost:3000

# GitHub OAuth callback (must match GitHub App settings)
GITHUB_CALLBACK_URL=http://localhost:3001/api/v1/auth/github/callback

# Rate limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=10

# AI commit suggestions (optional)
ANTHROPIC_API_KEY=          # ⏳ Optional — only needed for AI commit message feature
```

---

## Frontend Environment Variables (`apps/frontend/.env.local`)

```env
# API
NEXT_PUBLIC_API_URL=http://localhost:3001

# GitHub OAuth (needed if frontend initiates OAuth redirect)
NEXT_PUBLIC_GITHUB_CLIENT_ID=   # Same as backend GITHUB_CLIENT_ID
```

---

## CLI Config Files (not environment variables)

`.timeline.json` — per-project config, stored in repo root, **gitignored**:
```json
{
  "projectId": "uuid-from-dashboard",
  "userId": "uuid-from-dashboard",
  "branch": "main",
  "apiUrl": "https://api.git-timeline-manager.com",
  "apiKey": "hex-api-key-from-timeline-login"
}
```

`.timeline-cache.json` — offline timestamp cache, **gitignored**:
```json
{
  "projectId": "uuid",
  "cachedAt": "2026-07-18T10:00:00.000Z",
  "timestamps": [
    "2026-07-20T09:30:00.000Z",
    "2026-07-21T14:15:00.000Z"
  ]
}
```

---

## GitHub OAuth App Setup

1. Go to: `github.com/settings/developers` → OAuth Apps → New OAuth App
2. Application name: `Git Timeline Manager (local)` (or prod name)
3. Homepage URL: `http://localhost:3000` (or `https://your-domain.com`)
4. Authorization callback URL: `http://localhost:3001/api/v1/auth/github/callback`
5. Click **Register application**
6. Copy **Client ID** → `GITHUB_CLIENT_ID`
7. Click **Generate a new client secret** → `GITHUB_CLIENT_SECRET`

**For production:** Create a second OAuth App with prod URLs. Never use the same OAuth App for dev and prod.

---

## Railway Deployment (Backend + PostgreSQL)

### Initial Setup
1. Install Railway CLI: `npm i -g @railway/cli`
2. `railway login`
3. `railway init` in project root (select existing project or create new)
4. Add PostgreSQL: Railway dashboard → New → Database → PostgreSQL

### Environment Variables in Railway
Set these in Railway dashboard → Variables tab:
- All variables from `Backend Environment Variables` above
- Set `NODE_ENV=production`
- Set `DATABASE_URL` to Railway's auto-provided PostgreSQL URL
- Set `FRONTEND_URL` to Vercel production URL

### Deploy Command
Railway auto-deploys on push to main. Configure in `railway.json`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "infra/docker/Dockerfile.backend"
  },
  "deploy": {
    "startCommand": "node dist/main.js",
    "healthcheckPath": "/api/v1/health",
    "healthcheckTimeout": 300
  }
}
```

### Run Migrations After Deploy
Add a Railway deploy hook or GitHub Actions step:
```bash
pnpm --filter backend migration:run
```

---

## Vercel Deployment (Frontend)

1. Connect GitHub repo to Vercel
2. Set framework preset: Next.js
3. Root directory: `apps/frontend`
4. Build command: `pnpm build` (from monorepo root, or `cd apps/frontend && pnpm build`)
5. Environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_API_URL=https://your-railway-backend-url.railway.app`
   - `NEXT_PUBLIC_GITHUB_CLIENT_ID=<your-github-client-id>`

---

## CLI npm Publish (Future)

When ready to distribute CLI:
```bash
cd apps/cli
pnpm build        # compiles TypeScript to dist/
npm publish       # publishes as git-timeline-manager-cli
```

Install: `npm install -g git-timeline-manager-cli`

---

## Key Generation Commands

```bash
# JWT secret (≥48 chars recommended)
openssl rand -base64 48

# Encryption key (must be exactly 64 hex chars = 32 bytes for AES-256)
openssl rand -hex 32

# Check key length
echo -n "your-key-here" | wc -c
```

---

## Pending Items

| Item | Status |
|------|--------|
| GitHub OAuth App — create dev app | ⏳ Create at github.com/settings/developers |
| GitHub OAuth App — create prod app | ⏳ After Railway URL is known |
| Railway account + project setup | ⏳ Set up before Phase 6 |
| Vercel account + project setup | ⏳ Set up before Phase 6 |
| Anthropic API key (for AI commit messages) | ⏳ Optional — needed only for AI feature |
| Production domain (if desired) | ⏳ Optional — Railway provides subdomain by default |
