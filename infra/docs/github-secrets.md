# GitHub Actions Secrets

The CI/CD workflows in `.github/workflows/` require these repository secrets.
Add them under **Settings → Secrets and variables → Actions → New repository secret**.

| Secret | Used by | Where to find it |
|--------|---------|------------------|
| `RAILWAY_TOKEN` | `deploy-backend.yml` | Railway → Account Settings → Tokens → **Create Token** (or a project token). Grants deploy access to the backend service. |
| `VERCEL_TOKEN` | `deploy-frontend.yml` | Vercel → Account Settings → Tokens → **Create Token**. |
| `VERCEL_ORG_ID` | `deploy-frontend.yml` | Vercel → Project → Settings → General, or run `vercel link` and read `.vercel/project.json` (`orgId`). |
| `VERCEL_PROJECT_ID` | `deploy-frontend.yml` | Same as above — `.vercel/project.json` (`projectId`), or Project → Settings → General. |
| `NEXT_PUBLIC_API_URL` | `deploy-frontend.yml` | The production backend URL from Railway (e.g. `https://githancer-backend.up.railway.app`). Baked into the frontend build at deploy time. |

## Notes

- `ci.yml` needs **no secrets** — it runs entirely on mock data (`NEXT_PUBLIC_USE_MOCK=true`).
- The Railway deploy step targets the service named **`githancer-backend`** — create that service in Railway first (see `docs/git-timeline-manager/03_ENV_AND_KEYS.md`).
- Backend runtime env vars (`DATABASE_URL`, `JWT_SECRET`, `ENCRYPTION_KEY`, GitHub OAuth, `ANTHROPIC_API_KEY`, …) are set in the **Railway dashboard**, not as GitHub secrets.
- Recommended: enable branch protection on `main` so `ci.yml` must pass before merge; the deploy workflows then only run on merged code.
