# API Keys & Credentials Reference

Everything AI-CIMO can integrate with, what it's for, where to get it, and whether it's required.

| # | Service | Required? | What it unlocks | Env var(s) |
|---|---|---|---|---|
| 1 | **IBM watsonx.ai** | Optional (fallback stub) | LLM-powered incident root-cause summaries (Granite-3-8b-instruct) | `WATSONX_API_KEY`, `WATSONX_PROJECT_ID`, `WATSONX_URL`, `WATSONX_MODEL_ID` |
| 2 | **IBM Cloud API key** | Only for deploy | CI deploy to IKS, push to IBM Container Registry, Secrets Manager pulls | `IBM_CLOUD_API_KEY` (GitHub secret) |
| 3 | **Slack webhook** | Optional | Real Slack alerts on Critical incidents | `SLACK_WEBHOOK_URL` |
| 4 | **SMTP / SendGrid** | Optional | Real email alerts | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` |
| 5 | **PagerDuty** | Optional (not implemented) | Page on-call engineer for Critical | `PAGERDUTY_ROUTING_KEY` |
| 6 | **JWT signing secret** | ✅ Required for prod | Auth token signing — must be a strong random secret | `JWT_SECRET_KEY` |
| 7 | **PostgreSQL** | ✅ Required | Persistence | `DATABASE_URL` |
| 8 | **Redis** | ✅ Required | Cache + Celery broker + pub/sub | `REDIS_URL`, `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND` |
| 9 | **GitHub Actions deploy token** | Only for CI dogfood | CI posts to `/deployments` after each release | `AI_CIMO_DEPLOY_TOKEN` |
| 10 | **Container Registry login** | Only for deploy | Push built images to IBM Container Registry | `iamapikey` + `IBM_CLOUD_API_KEY` |
| 11 | **TLS / Let's Encrypt** | Auto (cert-manager) | HTTPS certs in K8s | — (no key, automated by cert-manager) |
| 12 | **DNS provider** | For prod domain | Route traffic to your ingress | (varies — Cloudflare/Route53/IBM CIS API tokens) |
| 13 | **OpenTelemetry collector** | Optional | Distributed traces | `OTEL_EXPORTER_OTLP_ENDPOINT` |

---

## 1. IBM watsonx.ai (the only AI integration)

**Where:** https://cloud.ibm.com + https://dataplatform.cloud.ibm.com

**Steps:**
1. Sign up at https://cloud.ibm.com/registration (free, no card required)
2. Provision watsonx.ai Runtime (Lite plan, free ~50k tokens/month): https://cloud.ibm.com/catalog/services/watsonxai-runtime
3. Open https://dataplatform.cloud.ibm.com → **New project** → name it → **Create**
4. Inside the project → **Manage** tab → copy the **Project ID** (UUID)
5. Inside the project → **Manage** → **Services & integrations** → **Associate service** → pick your watsonx.ai Runtime
6. Go to https://cloud.ibm.com/iam/apikeys → **Create** an API key → **Copy or Download immediately** (it's shown only once)
7. In `.env`:
   ```env
   WATSONX_ENABLED=true
   WATSONX_API_KEY=<the actual ~44-char value, NOT the "ApiKey-..." identifier>
   WATSONX_PROJECT_ID=<UUID from step 4>
   WATSONX_URL=https://us-south.ml.cloud.ibm.com   # match your region
   WATSONX_MODEL_ID=ibm/granite-3-8b-instruct
   ```
8. Verify: `curl /api/v1/ai/health` → `{"ok": true}`

**Why we need it:** generates the AI Root Cause Analysis on every incident. Without it, AI-CIMO falls back to a deterministic rule-based engine (pattern matches on logs and produces sensible summaries).

---

## 2. IBM Cloud API key (deploy-only)

**Where:** https://cloud.ibm.com/iam/apikeys

**Why we need it:** GitHub Actions uses it to (a) log in to IBM Container Registry to push images and (b) authenticate `ibmcloud ks cluster config` so it can `kubectl apply` to your IKS cluster.

**Set as a GitHub secret named `IBM_CLOUD_API_KEY`** in your repo's Settings → Secrets → Actions.

---

## 3. Slack webhook (notifications)

**Where:** https://api.slack.com/apps → **Create New App** → **Incoming Webhooks** → toggle on → **Add New Webhook to Workspace**

**Format:** `https://hooks.slack.com/services/T.../B.../...`

**In `.env`:**
```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T0000/B0000/xxxx
```

**Why:** when a Critical incident is detected, a Celery worker POSTs a Slack message to this URL.

---

## 4. SMTP / SendGrid (email notifications)

**Easiest option — SendGrid free tier:**
1. Sign up at https://signup.sendgrid.com (100 emails/day free)
2. **Settings** → **API Keys** → **Create** → **Full Access**
3. Verify a sender identity in **Sender Authentication**

**In `.env`:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey                       # literal word "apikey"
SMTP_PASSWORD=<your SendGrid API key>
SMTP_FROM=alerts@yourdomain.com        # must match verified sender
```

Alternatives: Mailgun, AWS SES, Postmark — any standard SMTP works.

---

## 5. PagerDuty (optional, not yet wired)

**Where:** https://app.pagerduty.com → **Services** → your service → **Integrations** → **Events API v2**

```env
PAGERDUTY_ROUTING_KEY=<32-char hex>
```

To enable: add a `notify_pagerduty` Celery task in `backend/app/notifications/tasks.py` that POSTs to `https://events.pagerduty.com/v2/enqueue`.

---

## 6. JWT secret (MUST change before prod)

Generate a strong random secret:

```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
# or
openssl rand -base64 64
```

Set in production via K8s Secret or IBM Cloud Secrets Manager — never commit. Default `dev-secret-change-me` in `.env` is for local dev only.

---

## 9. AI-CIMO deploy token (CI dogfood)

Create a permanent admin user, generate a long-lived JWT (extend `access_token_expire_minutes` for this user), and store as a GitHub Actions secret. The `deploy.yml` workflow uses it to POST every release to `/api/v1/deployments` so AI-CIMO can correlate deploys to subsequent incidents — automatic dogfooding.

---

## Putting it all together — order of priority

For a **local demo**: nothing required. Stack runs out of the box.

For an **AI demo**: just (1) watsonx.ai.

For **real notifications**: add (3) Slack and/or (4) SMTP.

For **production deploy to IBM Cloud**: add (2), (6), (10), (12) and configure (11) cert-manager in your cluster.

For **full observability stack**: add (13) OpenTelemetry collector and configure Prometheus scrape jobs (Grafana dashboards already committed under `infra/grafana/`).

---

## Where the keys actually live in the running system

```
docker compose             →  .env file at repo root (gitignored)
Kubernetes                 →  ai-cimo-secrets (see infra/k8s/base/secret.example.yaml)
GitHub Actions deploy CI   →  Repo Settings → Secrets → Actions
Production secret source   →  IBM Cloud Secrets Manager
                             → synced into K8s by External Secrets Operator
```

**Golden rule:** never commit a real key. If one ever lands in git history (or chat), rotate it immediately at the provider.
