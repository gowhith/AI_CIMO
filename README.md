<div align="center">

<h1>
  <img src="docs/images/project-overview.png" alt="AI-CIMO" width="64" align="top" />
  &nbsp;AI-CIMO
</h1>

### AI-Powered Cloud Incident Management & Observability Platform

**Detect outages from log streams · Generate plain-language root-cause summaries with IBM watsonx.ai · Triage incidents from a single real-time dashboard.**

<br />

![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-blue?style=flat-square&logo=docker&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?style=flat-square&logo=kubernetes&logoColor=white)
![IBM watsonx.ai](https://img.shields.io/badge/IBM_watsonx.ai-0F62FE?style=flat-square&logo=ibm&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)

[🚀 Quick Start](#-quick-start) · [✨ Features](#-features) · [📸 Screenshots](#-screenshots) · [🏗️ Architecture](#%EF%B8%8F-architecture) · [📖 API](#-api-reference) · [☁️ Deploy](#%EF%B8%8F-deploy-to-production)

<br />

<img src="docs/images/dashboard.png" alt="AI-CIMO Operations Dashboard" />

</div>

---

## 💡 Why AI-CIMO?

Modern engineering teams run dozens of microservices — `auth-service`, `payment-service`, `user-service`, `order-service`, `notification-service`, …. When something breaks, on-call engineers waste precious minutes manually digging through:

❌ logs scattered across services · ❌ metrics buried in dashboards · ❌ deployment history in different tools · ❌ incident status in chat threads

Every minute of delay = lost revenue, eroded customer trust, exhausted engineers.

✅ **AI-CIMO consolidates everything into one AI-powered dashboard** that *detects* incidents the moment they happen, *diagnoses* the root cause with IBM watsonx.ai, and helps engineers *resolve* them — all without leaving the page.

---

## ✨ Features

<table>
<tr>
<td width="33%" valign="top">

### 🚨 Detect
- Rule-based detector watches log streams
- Configurable per-service thresholds
- Celery-beat scan every 30 s
- Real-time WebSocket push on new incidents
- Auto-correlates with recent deployments

</td>
<td width="33%" valign="top">

### 🧠 Diagnose
- **IBM watsonx.ai (Granite-3-8b)** writes the incident summary
- Names the likely root cause
- Produces a numbered debugging checklist
- Confidence score on every analysis
- Deterministic rule-based fallback so it works without credentials

</td>
<td width="33%" valign="top">

### ⚡ Resolve
- One dashboard for logs, metrics, incidents
- Correlated deployment history
- Status workflow: Open → Investigating → Resolved
- Slack + email notifications
- Engineer 👍 / 👎 feedback on every AI summary

</td>
</tr>
</table>

<details>
<summary><b>👉 See all features (MVP + production-ready)</b></summary>

### Core MVP
- 🔐 JWT auth + RBAC (admin / engineer roles)
- 📦 Service registry with per-service alert thresholds
- 📥 Log ingestion endpoints (single + batch, ≥ 1 k logs/sec target)
- 🔍 Log search — filter by service / level / trace ID + full-text
- 🚨 Incident detection — windowed rule engine, Celery beat every 30 s
- 🧠 AI Root-Cause Analysis — watsonx.ai with rule-based fallback
- 📊 Live dashboard — animated KPI sparklines, auto-refresh 5 s, WebSocket toasts
- 🚀 Deployment correlation — CI posts to `/deployments`
- 📧 Notifications — Slack webhook + SMTP email on Critical
- 👍 Engineer feedback — thumbs up/down on every AI summary
- 🧪 Live demo simulator — Celery task generates realistic traffic + one-click error spikes

### Production-ready
- 🐳 Docker Compose for local dev with health-checked services
- ☸️ Kubernetes — Kustomize base + dev/prod overlays (Deployments, Services, HPA, Ingress + TLS)
- 🔄 CI/CD — GitHub Actions for backend tests, frontend build, IBM Cloud / IKS deploy
- 📈 Observability — Prometheus metrics at `/metrics`, structured JSON logs
- ✅ Tests — 15+ pytest tests with 71% backend coverage
- 🔒 Security — bcrypt passwords, RBAC on every mutating route, CORS allowlist, dependency scans
- 🎨 Modern dark UI — IBM Carbon tokens, animated KPI counters, skeleton loaders, WCAG-AA contrast

</details>

---

## 📸 Screenshots

<div align="center">

### 🏠 Landing Page
*Public marketing page — what AI-CIMO is, who it's for*

<img src="docs/images/landing.png" alt="Landing page" width="100%" />

<br /><br />

### 📊 Operations Dashboard
*Live KPI cards with animated sparklines, auto-refresh every 5 s, sidebar navigation, real-time WebSocket toasts*

<img src="docs/images/dashboard.png" alt="Dashboard" width="100%" />

<br /><br />

### 🟢 Service Health
*Per-service status with owner, environment, alert thresholds — at-a-glance fleet view*

<img src="docs/images/services.png" alt="Services" width="100%" />

<br /><br />

### 📜 Logs Explorer
*Filter by service, level, trace ID; search messages with full-text; live tail from the simulator*

<img src="docs/images/logs.png" alt="Logs" width="100%" />

<br /><br />

### 🚨 Incidents Queue
*All detected service failures, sorted by recency. Click into an incident to see the AI-generated RCA.*

<img src="docs/images/incidents.png" alt="Incidents" width="100%" />

</div>

---

## 🚀 Quick Start

### Prerequisites
- **Docker Desktop** (or Docker Engine + Compose v2)
- 4 GB RAM available to Docker
- Free ports: `5180` (frontend), `8050` (API), `5440` (Postgres), `6390` (Redis)

### One-command run

```bash
git clone https://github.com/gowhith/AI_CIMO.git
cd AI_CIMO
cp .env.example .env
docker compose up --build -d
```

Wait ~30 seconds for migrations + seed, then:

| Component | URL |
| --- | --- |
| 🖥️ **Frontend** | http://localhost:5180 |
| 🔌 **API** | http://localhost:8050 |
| 📚 **Swagger UI** | http://localhost:8050/docs |
| ❤️ **Health check** | http://localhost:8050/health |
| 📈 **Prometheus metrics** | http://localhost:8050/metrics |

### Demo credentials (pre-seeded)

```
email:    demo@aicimo.io
password: demo1234
```

The seeder also creates:
- 🟢 **8 sample services** (auth, payment, user, order, notification, database, search, ml-inference)
- 📦 **24 deployment records**
- 📝 **640 historical log entries**

…so the dashboard isn't empty on first load.

### 🎬 5-Minute End-to-End Demo

1. Open http://localhost:5180 → click **Sign in** (credentials are pre-filled)
2. Watch the **Dashboard** — 8 KPI sparklines animate and refresh every 5 s
3. Navigate to **Admin** → click **Spike errors** next to `payment-service`
4. Within 30 s: an incident appears, a 🚨 toast pops up on every open tab via WebSocket
5. Click **Incidents → #1** — read the AI-generated summary, root cause, and 5 debugging steps
6. Hit 👍 *Useful*, then **Mark resolved** — dashboard KPIs update in real-time

### Stop the stack

```bash
docker compose down            # stop containers, keep data
docker compose down -v         # also wipe Postgres volume
```

---

## 🛠️ Tech Stack

<table>
<tr>
<td width="50%" valign="top">

**Frontend**
- React 18 · TypeScript · Vite
- Tailwind CSS (IBM Carbon-inspired tokens)
- TanStack Query · Zustand
- Recharts · lucide-react

**Backend**
- FastAPI · Pydantic v2
- SQLAlchemy 2.x · Alembic
- Celery 5 (worker + beat)
- structlog for JSON logging

</td>
<td width="50%" valign="top">

**Data / Infra**
- PostgreSQL 16 (Alembic migrations)
- Redis 7 (cache + Celery broker + pub/sub)
- Docker + docker-compose
- Kubernetes (Kustomize, IBM Cloud IKS-ready)

**AI / Observability / DevOps**
- IBM watsonx.ai (Granite-3-8b-instruct)
- Prometheus + Grafana manifests
- GitHub Actions CI/CD
- Pytest · Vitest · React Testing Library

</td>
</tr>
</table>

---

## 🏗️ Architecture

<div align="center">
<img src="docs/images/architecture-overview.png" alt="Architecture overview" width="90%" />
</div>

<details>
<summary><b>📐 ASCII view (for terminals)</b></summary>

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

</details>

<details>
<summary><b>⏱️ Runtime pipeline (incident → AI RCA → notification)</b></summary>

<div align="center">
<img src="docs/images/runtime-pipeline.png" alt="Runtime pipeline" width="90%" />
</div>

</details>

---

## ⚙️ Configuration

All settings live in `.env` at the project root. Copy from `.env.example`.

| Variable | Default | Required? | What it does |
| --- | --- | --- | --- |
| `JWT_SECRET_KEY` | `dev-secret-change-me` | **production** | JWT signing secret |
| `WATSONX_ENABLED` | `false` | optional | Set `true` to enable live IBM watsonx.ai calls |
| `WATSONX_API_KEY` | — | watsonx | Your IBM Cloud API key (the actual value, not the "ApiKey-…" ID) |
| `WATSONX_PROJECT_ID` | — | watsonx | watsonx project UUID from dataplatform.cloud.ibm.com |
| `WATSONX_URL` | `https://us-south.ml.cloud.ibm.com` | watsonx | Region URL |
| `WATSONX_MODEL_ID` | `ibm/granite-3-8b-instruct` | optional | Override the LLM |
| `SLACK_WEBHOOK_URL` | — | optional | Webhook URL for Slack alerts |
| `SMTP_*` | — | optional | Email alert configuration |
| `SIMULATOR_ENABLED` | `true` | optional | Generate live demo traffic |
| `SEED_ON_STARTUP` | `true` | optional | Seed demo data on first run |

After editing `.env`:

```bash
docker compose up -d --force-recreate api worker beat
```

📘 Complete credentials guide: [docs/API_KEYS.md](docs/API_KEYS.md)

<details>
<summary><b>🔑 Enabling live IBM watsonx.ai (free Lite plan)</b></summary>

1. Sign up at https://cloud.ibm.com/registration *(free, no card)*
2. Provision **watsonx.ai Runtime** *(Lite plan, ~50k tokens/month free)*
3. Go to https://dataplatform.cloud.ibm.com → **New project** → grab **Project ID** from the *Manage* tab
4. Go to https://cloud.ibm.com/iam/apikeys → **Create** → **copy the actual key value immediately** (shown only once)
5. Set both in `.env` and `WATSONX_ENABLED=true`
6. `docker compose up -d --force-recreate api worker`
7. Sign in as admin → **Admin** → *AI Engine* card flips from yellow "stub mode" to green "watsonx live"

> 💡 **Without watsonx credentials, AI-CIMO still produces RCA summaries** via a deterministic rule-based engine that pattern-matches log content (DB pool exhaustion, OOM, 4xx/5xx, etc.). The system works fully out-of-the-box.

</details>

---

## 🧰 Running each piece without Docker

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

# Celery worker + beat (separate terminals)
celery -A app.core.celery_app:celery_app worker --loglevel=info
celery -A app.core.celery_app:celery_app beat   --loglevel=info

# Frontend
cd frontend
npm install
npm run dev
```

---

## 📖 API Reference

Full interactive OpenAPI schema at **http://localhost:8050/docs** when running.

<details>
<summary><b>📋 All endpoints</b></summary>

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

</details>

---

## 📂 Repository Layout

<details>
<summary><b>Click to expand the full tree</b></summary>

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
│   │   ├── deployments/      FR-10 release tracking
│   │   ├── notifications/    FR-11 Slack + email
│   │   ├── dashboard/        FR-7  KPI aggregations
│   │   ├── ws/               FR-13 WebSocket broadcaster
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
│   ├── k8s/                  Kustomize base + dev/prod overlays
│   ├── terraform/            IBM Cloud IKS skeleton
│   └── grafana/              Pre-built dashboards
├── .github/workflows/        backend-ci, frontend-ci, deploy
├── docs/
│   ├── API_KEYS.md           Credentials reference
│   ├── images/               README screenshots + diagrams
│   └── adr/                  Architecture decision records
├── docker-compose.yml        Local dev stack
└── README.md
```

</details>

---

## ✅ Testing

```bash
# Backend (pytest + coverage)
cd backend
pytest -q

# In-container (no local Python needed)
docker compose run --rm api pytest -q
```

Current state: **15 passing tests, 71% backend coverage** across auth, services, logs, incidents, and the AI stub engine.

---

## ☁️ Deploy to Production

The repository ships with a deploy workflow at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) that:

1. 🏗️ Builds the backend + frontend Docker images
2. 📤 Pushes them to IBM Container Registry (`us.icr.io`)
3. 🔐 Logs into IBM Cloud + IKS, applies the Kustomize overlay, and rolls out
4. 🥪 **Dogfoods itself** — POSTs the release to `/api/v1/deployments` so AI-CIMO knows about every deploy of AI-CIMO

**Required GitHub secrets:** `IBM_CLOUD_API_KEY`, `AI_CIMO_DEPLOY_TOKEN`
**Required repo variables:** `IBM_REGION`, `IBM_RESOURCE_GROUP`, `IKS_CLUSTER_NAME`, `ICR_NAMESPACE`, `AI_CIMO_HOST`

For local Kubernetes (kind / minikube):

```bash
kubectl apply -k infra/k8s/overlays/dev
```

---

## 👥 Target Users

| Audience | Why they use it |
| --- | --- |
| 🛠️ **DevOps / SRE** | Cut MTTR by replacing manual log-digging with an AI-generated RCA |
| 💻 **Backend engineers** | Debug API failures, DB issues, and crashes without leaving one tab |
| 📊 **Engineering managers** | Track reliability + incident history per service |
| ☁️ **Cloud / Kubernetes admins** | Per-service health from a single pane of glass + Prometheus metrics |
| 🎧 **Support teams** | Plain-language incident summaries to quote to customers |
| 🤖 **CI/CD pipelines** | `POST /deployments` after every release for correlation |
| 📡 **Microservices** | `POST /logs` (batched) from log shippers / OTel exporters |

---

## 🤝 Contributing

1. Fork & clone
2. `docker compose up --build -d`
3. Make your changes — both backend and frontend support hot reload
4. Add tests for backend changes (`backend/tests/`)
5. Run `pytest -q` to make sure they pass
6. Open a PR

---

## 📜 License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE).

---

<div align="center">

**Built for the AI + Cloud + Observability intersection.**

⭐ Star this repo if you find it useful · 🐛 [Report a bug](https://github.com/gowhith/AI_CIMO/issues) · 💬 [Discussions](https://github.com/gowhith/AI_CIMO/discussions)

<sub>IBM watsonx.ai · Cloud-native · Production-grade</sub>

</div>
