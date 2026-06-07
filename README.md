# StockPilot WMS (abibas)

Cloud-native Warehouse Management System for electronics and hardware distribution — procurement, bin-level inventory, QC inspections, and supplier management.

| Layer | Stack |
|-------|-------|
| Frontend | Next.js 16, Tailwind CSS, React Query |
| Backend | FastAPI, SQLModel, Alembic |
| Database | PostgreSQL (Neon for dev, RDS for prod) |
| Auth | JWT + role-based access control |
| Containerisation | Docker + Docker Compose |

## Project structure

```text
abibas/
├── backend/          FastAPI API + SQLModel + Alembic
├── frontend/         Next.js App Router UI
├── docker-compose.yml
├── DEPLOYMENT.md     Server deployment guide
├── scripts/test-stack.sh
└── README.md
```

## Quick start (local)

### 1. Backend

```bash
cd backend
cp .env.example .env   # fill in DATABASE_URL and SECRET_KEY
uv sync
uv run alembic upgrade head
uv run python -m app.db.seed
uv run uvicorn app.main:app --reload --port 8000
```

API: `http://localhost:8000`  
Swagger: `http://localhost:8000/docs`

### 2. Frontend

```bash
cd frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
npm install
npm run dev
```

App: `http://localhost:3000`

### Demo logins

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@stockpilot.com | pass1234 |
| Warehouse Operator | operator@stockpilot.com | pass1234 |
| Procurement | procurement@stockpilot.com | pass1234 |
| QC Inspector | qc@stockpilot.com | pass1234 |
| Manager | manager@stockpilot.com | pass1234 |

## Test the full stack

```bash
# Terminal 1 — backend
cd backend && uv run uvicorn app.main:app --reload --port 8000

# Terminal 2 — frontend
cd frontend && npm run dev

# Terminal 3 — integration tests
bash scripts/test-stack.sh
```

## Docker (full stack)

```bash
# Copy and configure backend env first
cp backend/.env.example backend/.env
# Edit backend/.env — set DATABASE_URL and SECRET_KEY

docker compose up --build -d          # local
# Production server:
# docker compose -f docker-compose.prod.yml up --build -d

# First deploy only — run migrations + seed inside the backend container
docker compose exec backend uv run alembic upgrade head
docker compose exec backend uv run python -m app.db.seed

# Verify
curl http://localhost:8000/health
bash scripts/test-stack.sh
```

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:8000/health`
- Swagger (direct): `http://localhost:8000/docs`

> In Docker, the frontend proxies `/api/v1/*` to the backend via Next.js rewrites. Do **not** set `NEXT_PUBLIC_API_URL` in the frontend Docker build.

## Deploy to server

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** — Docker + Nginx + HTTPS on Ubuntu VPS (same pattern as FashionFlow WMS).

## API overview

| Area | Endpoints |
|------|-----------|
| Auth | `POST /api/v1/auth/login`, `GET /api/v1/auth/me` |
| Users | `GET/POST /api/v1/users` (ADMIN) |
| Warehouses | zones, bins |
| Products | categories, specs, suppliers |
| Inventory | batches, alerts, adjustments, quality |
| Orders | purchase orders, sales orders |
| Movements | stock movement log |
| Dashboard | `GET /api/v1/dashboard` |

Full interactive docs at `/docs` on the backend (port 8000).
