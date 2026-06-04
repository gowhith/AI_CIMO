<div align="center">

# AI-CIMO

### AI-Powered Cloud Incident Management & Observability Platform

Detect outages from log streams · Generate plain-language root-cause summaries · Triage incidents from a single dashboard.

Built with **React · FastAPI · PostgreSQL · Redis · Celery · Docker · Kubernetes · IBM watsonx.ai**

![Dashboard](docs/images/dashboard.png)

</div>

---

## What it does

AI-CIMO is a web platform that watches your fleet of microservices and turns the chaos of incident response into a one-click workflow:

1. **Microservices ship logs** to a single ingestion endpoint.
2. **The detector** scans the stream every 30 s and creates a Critical incident when error rate crosses a service's threshold.
3. **The AI engine** (IBM watsonx.ai Granite-3-8b, with a rule-based fallback) writes the incident summary, names the likely root cause, and produces a numbered debugging checklist.
4. **Engineers triage** from one dashboard — correlated deployments, logs, and incident status update without tab-switching.
5. **Notifications** fire on Slack + email; WebSocket pushes live updates to every open dashboard.

### Targeted users

| Audience | Why they use it |
| --- | --- |
| **DevOps / SRE** | Cut MTTR by replacing manual log-digging with an AI-generated RCA |
| **Backend engineers** | Debug API failures, DB issues, and crashes without leaving one tab |
| **Engineering managers** | Track reliability + incident history per service |
| **Cloud / Kubernetes admins** | Per-service health from a single pane of glass + Prometheus metrics |
| **Support teams** | Plain-language incident summaries to quote to customers |
| **CI/CD pipelines** (machine) | `POST /deployments` after every release for correlation |
| **Microservices** (machine) | `POST /logs` (batched) from log shippers / OTel exporters |

---

## Screenshots

### Landing — public marketing page

![Landing page](docs/images/landing.png)

### Operations dashboard — live KPIs with sparklines + auto-refresh + WebSocket toasts

![Dashboard](docs/images/dashboard.png)

### Service health — per-service status with owners, thresholds, environments

![Services page](docs/images/services.png)

### Logs — filterable by service, level, trace ID, and full-text search

![Logs page](docs/images/logs.png)

### Incidents — sortable list with severity + status + AI summary on click-through

![Incidents page](docs/images/incidents.png)

---

## Features

### Core MVP
- 🔐 **JWT auth + RBAC** — admin / engineer roles
- 📦 **Service registry** — register a service, set its alert threshold (default ≥ 5 errors in 60 s)
- 📥 **Log ingestion** — single + batch endpoints, target throughput ≥ 1 k logs/sec
- 🔍 **Log search** — filter by service / level / trace ID + full-text search
- 🚨 **Incident detection** — windowed rule engine running on Celery beat every 30 s
- 🧠 **AI Root-Cause Analysis** — watsonx.ai (Granite-3-8b) with a deterministic rule-based fallback so the system runs out-of-the-box
- 📊 **Live dashboard** — animated KPI sparklines, auto-refresh every 5 s, WebSocket push on new incidents
- 🚀 **Deployment correlation** — CI posts to `/deployments`, the UI flags incidents that follow recent releases
- 📧 **Notifications** — Slack webhook + SMTP email on Critical incidents
- 👍 **Engineer feedback** — thumbs up/down on every AI summary, stored for future fine-tuning data
- 🧪 **Live demo simulator** — Celery beat job that generates realistic traffic across 8 sample services, with a one-click error-spike to drive the full incident → RCA → notification pipeline end-to-end

### Production-ready
- 🐳 **Docker Compose** for local dev with health-checked services
- ☸️ **Kubernetes** — Kustomize base + dev/prod overlays (Deployments, Services, HPA, Ingress + TLS)
- 🔄 **CI/CD** — GitHub Actions for backend tests, frontend build, and IBM Cloud / IKS deploy
- 📈 **Observability** — Prometheus metrics at `/metrics`, structured JSON logs (structlog)
- ✅ **Tests** — 15 + pytest tests with 71 % backend coverage
- 🔒 **Security** — bcrypt passwords, RBAC on every mutating route, CORS allowlist, dependency scans
- 🎨 **Modern dark UI** — IBM Carbon-inspired tokens, animated KPI counters, skeleton loaders, live status indicators, WCAG-AA contrast

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS · TanStack Query · Zustand · Recharts · lucide-react |
| Backend | FastAPI · Pydantic v2 · SQLAlchemy 2.x · Alembic |
| Database | PostgreSQL 16 |
| Cache / Queue | Redis 7 |
| Workers | Celery 5 (worker + beat) |
| AI | IBM watsonx.ai (`ibm-watsonx-ai` SDK, Granite-3-8b-instruct) + rule-based fallback |
| Containers | Docker, docker-compose for local |
| Orchestration | Kubernetes (Kustomize manifests, IBM Cloud IKS-ready) |
| CI / CD | GitHub Actions |
| Monitoring | Prometheus + Grafana (manifests included) |
| Testing | Pytest · httpx · React Testing Library · Vitest |

---

## Architecture

![Architecture](docs/images/architecture-overview.png)

```
                 ┌────────────────────────────┐
                 │  React + TS + Tailwind     │
                 │  Dashboard / Logs / RCA UI │
                 └─────────────┬──────────────┘
                               │ HTTPS / WSS
                 ┌─────────────▼──────────────┐
                 │   FastAPI Gateway (uvicorn)│
                 │   REST + /ws/incidents     │
                 └──┬──────┬──────┬──────┬────┘
       Auth Module │      │ Svc  │ Log  │ Incident
                   │      │ Reg  │ Ing  │ Detect
                   ▼      ▼      ▼      ▼
                 ┌─────────────────────────────┐
                 │   PostgreSQL (IBM Cloud DB) │
                 └─────────────────────────────┘
                               ▲
                 ┌─────────────┴──────────────┐
                 │ Redis  ──►  Celery Worker  │──► watsonx.ai (AI Analyzer)
                 │ (queue + cache)            │──► SMTP / Slack (Notifier)
                 └────────────────────────────┘
                               ▲
                 ┌─────────────┴──────────────┐
                 │ Prometheus + Grafana       │
                 └────────────────────────────┘
```

---

## Quick start

### Prerequisites
- **Docker Desktop** (or Docker Engine + Compose v2)
- 4 GB RAM available to Docker
- Ports `5180` (frontend), `8050` (API), `5440` (Postgres), `6390` (Redis) free

### Run the full stack — one command

```bash
git clone <this-repo> ai-cimo
cd ai-cimo
docker compose up --build -d
```

Wait ~30 seconds. Then:

| Service | URL |
| --- | --- |
| **Frontend** | http://localhost:5180 |
| **API** | http://localhost:8050 |
| **Swagger UI** | http://localhost:8050/docs |
| **Health** | http://localhost:8050/health |
| **Prometheus metrics** | http://localhost:8050/metrics |

A **demo admin user is pre-seeded**, so you can sign in immediately:

```
email:    demo@aicimo.io
password: demo1234
```

The seeder also creates 8 sample services (auth-service, payment-service, …), three deployment records each, and 640 historical log entries — so the dashboard isn't empty on first load.

### 5-minute end-to-end demo

1. Open http://localhost:5180 → click **Sign in** (the demo credentials are pre-filled).
2. **Dashboard** — watch the 8 KPI sparklines refresh every 5 s.
3. Navigate to **Admin** → click **Spike errors** next to `payment-service`.
4. Within 30 seconds an incident appears, and a 🚨 toast pops up on every open tab via WebSocket.
5. Click into **Incidents → #1** — the AI panel shows the auto-generated summary, root cause, and 5 debugging steps.
6. Hit 👍 *Useful*, then **Mark resolved**. The dashboard KPIs update in real-time.

### Stop the stack

```bash
docker compose down            # stop containers, keep data
docker compose down -v         # also wipe the Postgres volume
```

---

## Configuration

All settings live in `.env` at the project root (copied from `.env.example`).

| Variable | Default | Required? | What it does |
| --- | --- | --- | --- |
| `JWT_SECRET_KEY` | `dev-secret-change-me` | **production** | JWT signing secret |
| `WATSONX_ENABLED` | `false` | optional | Set `true` to enable live IBM watsonx.ai calls |
| `WATSONX_API_KEY` | — | watsonx | Your IBM Cloud API key value (not the "ApiKey-…" identifier) |
| `WATSONX_PROJECT_ID` | — | watsonx | watsonx project UUID from dataplatform.cloud.ibm.com |
| `WATSONX_URL` | `https://us-south.ml.cloud.ibm.com` | watsonx | Region URL |
| `WATSONX_MODEL_ID` | `ibm/granite-3-8b-instruct` | optional | Override model |
| `SLACK_WEBHOOK_URL` | — | optional | Webhook URL for Slack alerts |
| `SMTP_HOST` / `_PORT` / `_USER` / `_PASSWORD` / `_FROM` | — | optional | Email alert configuration |
| `SIMULATOR_ENABLED` | `true` | optional | Generate live demo traffic |
| `SEED_ON_STARTUP` | `true` | optional | Seed demo data on first run |

After editing `.env`:

```bash
docker compose up -d --force-recreate api worker beat
```

A complete credentials guide lives in [docs/API_KEYS.md](docs/API_KEYS.md).

### Enabling live IBM watsonx.ai

1. Sign up at https://cloud.ibm.com/registration (free, no card)
2. Provision **watsonx.ai Runtime** (Lite plan, ~50k tokens/month free)
3. At https://dataplatform.cloud.ibm.com → **New project** → grab the **Project ID** from the *Manage* tab
4. At https://cloud.ibm.com/iam/apikeys → **Create** → **copy the actual key value immediately** (shown only once)
5. Drop both into `.env` and set `WATSONX_ENABLED=true`
6. `docker compose up -d --force-recreate api worker`
7. Sign in as admin → **Admin** → the *AI Engine* card flips from yellow "stub mode" to green "watsonx live"

> **Without watsonx credentials, AI-CIMO still produces RCA summaries** — a deterministic rule-based engine pattern-matches log content (DB pool exhaustion, OOM, 4xx/5xx, etc.) so every incident has a useful diagnosis out-of-the-box.

---

## Running each piece without Docker

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
export DATABASE_URL=postgresql+psycopg://cimo:cimo@localhost:5432/cimo
export REDIS_URL=redis://localhost:6379/0
alembic upgrade head
python -m app.seed                                    # one-time demo data
uvicorn app.main:app --reload

# Celery worker + beat (in separate terminals)
celery -A app.core.celery_app:celery_app worker --loglevel=info
celery -A app.core.celery_app:celery_app beat   --loglevel=info

# Frontend
cd frontend
npm install
npm run dev
```

---

## API reference

Full OpenAPI schema is available at **http://localhost:8050/docs** when the stack is running.

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/register` | — | Create a user |
| `POST` | `/api/v1/auth/login` | — | Get a JWT pair |
| `GET` | `/api/v1/auth/me` | user | Current user info |
| `GET` | `/api/v1/services` | user | List services |
| `POST` | `/api/v1/services` | **admin** | Create a service |
| `PATCH` | `/api/v1/services/{id}` | **admin** | Update service |
| `DELETE` | `/api/v1/services/{id}` | **admin** | Delete service |
| `POST` | `/api/v1/logs` | — | Ingest a single log |
| `POST` | `/api/v1/logs/batch` | — | Ingest a batch (bulk insert) |
| `GET` | `/api/v1/logs` | user | Filter + search logs |
| `GET/POST/PATCH` | `/api/v1/incidents…` | user | Incident CRUD + workflow |
| `GET` | `/api/v1/incidents/{id}/summary` | user | Get AI RCA |
| `POST` | `/api/v1/incidents/{id}/analyze` | user | Trigger fresh RCA |
| `POST` | `/api/v1/incidents/{id}/feedback` | user | 👍 / 👎 on AI summary |
| `GET/POST` | `/api/v1/deployments` | user / CI | Release tracking |
| `GET` | `/api/v1/notifications` | user | Notification audit log |
| `GET` | `/api/v1/dashboard/summary` | user | KPI aggregations |
| `GET` | `/api/v1/ai/health` | user | watsonx connectivity probe |
| `POST` | `/api/v1/simulator/toggle?enabled=…` | **admin** | Start / stop demo simulator |
| `POST` | `/api/v1/simulator/spike/{service_id}` | **admin** | Queue an error burst |
| `WS` | `/ws/incidents` | — | Live incident push |

---

## Repository layout

```
ai-cimo/
├── backend/                  FastAPI application
│   ├── app/
│   │   ├── core/             config, db, security, redis, celery, logging
│   │   ├── auth/             FR-1  JWT + RBAC
│   │   ├── services/         FR-2  service registry
│   │   ├── logs/             FR-3, FR-4  ingestion + search
│   │   ├── incidents/        FR-5, FR-9  detector + workflow
│   │   ├── ai_analysis/      FR-6  watsonx client + Celery task
│   │   ├── deployments/      FR-10  release tracking
│   │   ├── notifications/    FR-11  Slack + email
│   │   ├── dashboard/        FR-7  KPI aggregations
│   │   ├── ws/               FR-13  WebSocket broadcaster
│   │   ├── simulator/        Demo traffic generator
│   │   └── seed.py           Idempotent demo-data seeder
│   ├── alembic/              Schema migrations (7 tables)
│   ├── tests/                Unit + integration (pytest)
│   └── Dockerfile
├── frontend/                 React + Vite + Tailwind
│   ├── src/
│   │   ├── pages/            Landing, Login, Signup, Dashboard, Services,
│   │   │                     Logs, Incidents, IncidentDetail, Deployments,
│   │   │                     Notifications, Admin
│   │   ├── components/       Layout, Toaster, StatusBadge, Stat, PageHeader,
│   │   │                     EmptyState, LiveDot, Skeleton, ProtectedRoute
│   │   ├── hooks/            useIncidentSocket, useCountUp
│   │   ├── api/              axios client
│   │   └── store/            zustand auth store
│   └── Dockerfile
├── infra/
│   ├── docker-compose.yml    (root-level — local dev)
│   ├── k8s/                  Kustomize base + dev/prod overlays
│   ├── terraform/            IBM Cloud IKS skeleton
│   └── grafana/              Pre-built dashboards
├── .github/workflows/        backend-ci, frontend-ci, deploy
├── docs/
│   ├── API_KEYS.md           Credentials reference
│   ├── images/               README screenshots
│   └── adr/                  Architecture decision records
└── README.md
```

---

## Testing

```bash
# Backend (pytest + coverage)
cd backend
pytest -q

# In-container (no local Python needed)
docker compose run --rm api pytest -q
```

Current state: **15 passing tests, 71 % backend coverage** across auth, services, logs, incidents, and the AI stub engine.

---

## Deploy to production

The repository ships with a **deploy workflow** (`.github/workflows/deploy.yml`) that:

1. Builds the backend + frontend Docker images
2. Pushes them to IBM Container Registry (`us.icr.io`)
3. Logs into IBM Cloud + IKS, applies the Kustomize overlay, and rolls out
4. **Dogfoods itself** — POSTs the release to `/api/v1/deployments` so AI-CIMO knows about every deploy of AI-CIMO

Required GitHub secrets: `IBM_CLOUD_API_KEY`, `AI_CIMO_DEPLOY_TOKEN`.
Required repo variables: `IBM_REGION`, `IBM_RESOURCE_GROUP`, `IKS_CLUSTER_NAME`, `ICR_NAMESPACE`, `AI_CIMO_HOST`.

For local Kubernetes (kind / minikube):

```bash
kubectl apply -k infra/k8s/overlays/dev
```

---

## License

MIT — see [LICENSE](LICENSE).

---

<div align="center">

Built for the **AI + Cloud + Observability** intersection.
IBM watsonx.ai · Cloud-native · Production-grade.

</div>
