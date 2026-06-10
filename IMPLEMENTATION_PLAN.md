# Abibas WMS — Implementation Plan

> Tick each box as you complete it. This file is the source of truth when switching between Claude Code and Cursor.
> Both AIs should read this file at the start of every session for full context.

---

## Context

Building an Electronics & Hardware **B2B Warehouse Management System** from scratch as a cloud-native full-stack project.

**Business domain:** A distributor of electronic components (resistors, capacitors, ICs, tools) manages stock across multiple warehouse zones and bin locations. The system tracks procurement from suppliers via Purchase Orders, quality control inspections, bin-level inventory, and outbound sales orders.

**Scope:** Procurement-first WMS with bin/zone tracking, QC inspection workflow, and supplier management — deployed on AWS EC2 + ALB + Auto Scaling.

During development, Neon PostgreSQL is the database. When AWS is ready, swap the `DATABASE_URL` for RDS — Alembic migrations make this seamless.

**Database (dev — Neon pooler URL):**
> Add your Neon DATABASE_URL to `backend/.env` before running migrations.
> Use `?sslmode=require` — do NOT include `channel_binding=require`.

---

## Progress at a Glance

| Phase | Description | Status |
|---|---|---|
| 1 | uv init & FastAPI skeleton | ✅ Complete |
| 2 | SQLModel models + Alembic | ✅ Complete |
| 3 | Seed data | ✅ Complete |
| 4 | FastAPI routers (10 routers, 39 routes) | ✅ Complete |
| 5 | Next.js frontend (13 pages, production build OK) | ✅ Complete |
| 5+ | Product `image_url` field + migration | ✅ Complete |
| **6** | **Docker + docker-compose** | ✅ Files created — verify with `docker compose up --build` |
| 7 | GitHub Actions CI/CD | ✅ Workflow file created — secrets + push pending |
| 8 | AWS (VPC, RDS, EC2, ALB, ASG) | ❌ Not started |
| 9 | k6 performance tests + evidence | ❌ Not started |

---

## Pre-Deployment — Local Work Remaining

Complete these **before** AWS (Phase 8). Nothing in Phase 8 should be started until Phase 6 passes locally.

### Priority 1 — Docker (Phase 6) — files ready, verify on server

| Item | Status | Notes |
|---|---|---|
| `backend/Dockerfile` | ✅ Created | uv-based Python 3.12, port **8000** |
| `frontend/Dockerfile` | ✅ Created | Multi-stage standalone build |
| `docker-compose.yml` (repo root) | ✅ Created | Backend 8000, frontend 3000 |
| `backend/.dockerignore` | ✅ Created | |
| `frontend/.dockerignore` | ✅ Created | |
| `frontend/next.config.ts` → `output: 'standalone'` | ✅ Done | API rewrites to backend |
| `docker compose up --build` smoke test | ⏳ Run on server | See DEPLOYMENT.md Step 7 |

### Priority 2 — Local verification tooling

| Item | Status | Notes |
|---|---|---|
| `scripts/test-stack.sh` | ✅ Created | Port 8000, Abibas credentials |
| Root `README.md` | ✅ Created | Dev + Docker quick start |
| `DEPLOYMENT.md` | ✅ Created | Full Nginx + HTTPS server guide |

### Priority 3 — CI/CD prep (Phase 7)

| Item | Status |
|---|---|
| `.github/workflows/deploy.yml` | ✅ Created |
| GitHub remote + secrets | ⏳ Configure on server (DEPLOYMENT.md Step 4) |
| Push to `main` → Actions green | ⏳ Pending |

### Already done locally (no action needed)

- Backend: 10 routers, `/health`, JWT auth, Neon DB seeded
- Frontend: all dashboard pages, auth flow, `npm run build` passes (15 routes)
- Git repo initialized at `abibas/` root
- `backend/.env.example` present

### Deferred until after deploy (Phase 9)

- k6 load test script + before/after index comparison
- Assignment evidence screenshots
- `CREATE INDEX idx_inv_product ON inventory_batches(product_id)`

---

## Tech Stack Summary

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), Tailwind CSS |
| Backend | FastAPI (Python 3.12) |
| ORM | SQLModel (SQLAlchemy + Pydantic in one) |
| Migrations | Alembic (auto-generate from SQLModel models) |
| Package manager | uv (replaces pip/poetry — `pyproject.toml` = `package.json`) |
| API docs | FastAPI built-in Swagger UI at `/docs` (no extra setup) |
| Auth | JWT (`python-jose`) + bcrypt (`passlib[bcrypt]`) |
| Database (dev) | Neon PostgreSQL |
| Database (prod) | AWS RDS PostgreSQL |
| Containerisation | Docker + Docker Compose |
| CI/CD | GitHub Actions + AWS ECR |
| Cloud | AWS EC2, ALB, Auto Scaling, VPC, RDS, ECR, Route 53 |
| Load testing | k6 |

---

## Project Structure

```
abibas/
├── backend/
│   ├── pyproject.toml              ← uv project manifest
│   ├── uv.lock
│   ├── .env                        ← DATABASE_URL, SECRET_KEY, etc.
│   ├── alembic.ini
│   ├── alembic/
│   │   ├── env.py                  ← points to SQLModel metadata
│   │   └── versions/               ← auto-generated migration files
│   └── app/
│       ├── main.py                 ← FastAPI app, routers, CORS, /health
│       ├── core/
│       │   ├── config.py           ← pydantic-settings reads .env
│       │   ├── security.py         ← JWT + bcrypt helpers
│       │   └── deps.py             ← get_db (SessionDep), get_current_user
│       ├── db/
│       │   ├── session.py          ← create_engine, SessionLocal
│       │   └── seed.py             ← seed script
│       ├── models/                 ← SQLModel table=True models (≈ Prisma schema)
│       │   ├── __init__.py
│       │   ├── user.py
│       │   ├── warehouse.py        ← Warehouse + Zone + Bin
│       │   ├── product.py          ← Category + Supplier + Product + ProductSpec
│       │   ├── inventory.py        ← InventoryBatch
│       │   ├── purchase_order.py   ← PurchaseOrder + POItem
│       │   ├── sales_order.py      ← SalesOrder + SOItem
│       │   └── movement.py         ← StockMovement
│       └── routers/
│           ├── auth.py
│           ├── users.py
│           ├── warehouses.py
│           ├── products.py
│           ├── suppliers.py
│           ├── inventory.py
│           ├── purchase_orders.py
│           ├── sales_orders.py
│           ├── movements.py
│           └── dashboard.py
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── (auth)/login/page.tsx
│   │   │   └── (dashboard)/
│   │   │       ├── layout.tsx
│   │   │       ├── dashboard/page.tsx
│   │   │       ├── products/page.tsx
│   │   │       ├── inventory/page.tsx
│   │   │       ├── suppliers/page.tsx
│   │   │       ├── purchase-orders/page.tsx
│   │   │       ├── sales-orders/page.tsx
│   │   │       ├── movements/page.tsx
│   │   │       ├── quality/page.tsx
│   │   │       ├── alerts/page.tsx
│   │   │       └── users/page.tsx
│   │   ├── components/
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   └── auth.tsx
│   │   └── types/index.ts
│   ├── .env.local
│   ├── package.json
│   └── next.config.ts
├── docker-compose.yml
├── .github/workflows/deploy.yml
└── IMPLEMENTATION_PLAN.md          ← this file
```

---

## Enums & Roles

```
UserRole:       ADMIN | WAREHOUSE_OPERATOR | PROCUREMENT | QC_INSPECTOR | MANAGER
MovementType:   RECEIVE | SHIP | TRANSFER | ADJUSTMENT | RETURN
POStatus:       DRAFT | SENT | PARTIALLY_RECEIVED | RECEIVED | CANCELLED
SOStatus:       PENDING | PROCESSING | SHIPPED | DELIVERED | CANCELLED
QualityStatus:  QUARANTINE | PASSED | FAILED | RELEASED
ZoneType:       RECEIVING | STORAGE | SHIPPING | QUARANTINE
```

---

## API Route Table

| Method | Path | Auth | Roles |
|---|---|---|---|
| GET | /health | No | — |
| POST | /api/v1/auth/login | No | — |
| GET | /api/v1/auth/me | Yes | Any |
| GET | /api/v1/users | Yes | ADMIN |
| POST | /api/v1/users | Yes | ADMIN |
| GET | /api/v1/warehouses | Yes | Any |
| POST | /api/v1/warehouses | Yes | ADMIN |
| GET | /api/v1/warehouses/{id}/zones | Yes | Any |
| POST | /api/v1/warehouses/{id}/zones | Yes | ADMIN, WAREHOUSE_OPERATOR |
| GET | /api/v1/zones/{zone_id}/bins | Yes | Any |
| POST | /api/v1/zones/{zone_id}/bins | Yes | ADMIN, WAREHOUSE_OPERATOR |
| GET | /api/v1/categories | Yes | Any |
| POST | /api/v1/categories | Yes | ADMIN |
| GET | /api/v1/products | Yes | Any |
| POST | /api/v1/products | Yes | ADMIN, PROCUREMENT |
| GET | /api/v1/products/{id} | Yes | Any |
| POST | /api/v1/products/{id}/specs | Yes | ADMIN |
| GET | /api/v1/suppliers | Yes | PROCUREMENT, ADMIN, MANAGER |
| POST | /api/v1/suppliers | Yes | PROCUREMENT, ADMIN |
| GET | /api/v1/suppliers/{id} | Yes | PROCUREMENT, ADMIN, MANAGER |
| GET | /api/v1/inventory | Yes | Any |
| GET | /api/v1/inventory/alerts | Yes | Any |
| POST | /api/v1/inventory/adjust | Yes | WAREHOUSE_OPERATOR, ADMIN |
| GET | /api/v1/quality | Yes | QC_INSPECTOR, ADMIN, MANAGER |
| PATCH | /api/v1/quality/{batch_id} | Yes | QC_INSPECTOR, ADMIN |
| GET | /api/v1/purchase-orders | Yes | PROCUREMENT, ADMIN, MANAGER |
| POST | /api/v1/purchase-orders | Yes | PROCUREMENT, ADMIN |
| GET | /api/v1/purchase-orders/{id} | Yes | PROCUREMENT, ADMIN, MANAGER |
| POST | /api/v1/purchase-orders/{id}/receive | Yes | WAREHOUSE_OPERATOR, ADMIN |
| GET | /api/v1/sales-orders | Yes | ADMIN, MANAGER |
| POST | /api/v1/sales-orders | Yes | ADMIN |
| PATCH | /api/v1/sales-orders/{id}/status | Yes | ADMIN |
| GET | /api/v1/movements | Yes | Any |
| POST | /api/v1/movements | Yes | WAREHOUSE_OPERATOR, ADMIN |
| GET | /api/v1/dashboard | Yes | Any |

---

## Phase 1 — uv Init & FastAPI Skeleton

### 1.1 Scaffold backend with uv
```bash
cd abibas
uv init backend --python 3.12
cd backend
uv add fastapi "uvicorn[standard]" sqlmodel alembic psycopg2-binary \
    "python-jose[cryptography]" "passlib[bcrypt]" python-dotenv pydantic-settings
uv add --dev pytest httpx
```

### 1.2 Create folder structure
```bash
mkdir -p app/core app/db app/models app/routers
touch app/__init__.py app/core/__init__.py app/db/__init__.py
touch app/models/__init__.py app/routers/__init__.py
```

### 1.3 Files to create
- [x] `backend/.env` — DATABASE_URL, SECRET_KEY, ALGORITHM=HS256, ACCESS_TOKEN_EXPIRE_MINUTES=1440, PORT=8000
- [x] `app/core/config.py` — `Settings` class using `pydantic-settings`
- [x] `app/db/session.py` — `engine`, `get_db`, `SessionLocal`
- [x] `app/main.py` — FastAPI app with CORS, `/health` endpoint

### 1.4 Verify
- [x] `uv run uvicorn app.main:app --reload --port 8000`
- [x] `curl http://localhost:8000/health` → `{"status":"ok","service":"Abibas WMS"}`
- [x] `http://localhost:8000/docs` → Swagger UI loads

---

## Phase 2 — SQLModel Models (≈ Prisma Schema)

### SQLModel vs Prisma reference
| Prisma | SQLModel + Alembic |
|---|---|
| `schema.prisma` | `app/models/*.py` |
| `npx prisma generate` | (no step needed — SQLModel is direct) |
| `npx prisma migrate dev` | `alembic revision --autogenerate -m "msg"` → `alembic upgrade head` |
| `npx prisma migrate deploy` | `alembic upgrade head` |
| `npx prisma db seed` | `uv run python -m app.db.seed` |
| `PrismaClient` | `Session` from sqlmodel |
| `prisma.user.findMany()` | `session.exec(select(User)).all()` |
| `session.add(obj); session.commit()` | same pattern |

### 2.1 Write models
- [x] `app/models/user.py` — User (id, name, email, password_hash, role enum, is_active, created_at)
- [x] `app/models/warehouse.py` — Warehouse, Zone (zone_type enum), Bin (code, max_capacity, current_fill)
- [x] `app/models/product.py` — Category (parent_id self-ref), Supplier, Product (part_number unique, reorder_point, reorder_qty), ProductSpec (spec_name, spec_value)
- [x] `app/models/inventory.py` — InventoryBatch (product_id, bin_id, quantity, lot_number, received_date, expiry_date nullable, quality_status enum)
- [x] `app/models/purchase_order.py` — PurchaseOrder (supplier_id, status enum, expected_date, notes, created_by_id), POItem (po_id, product_id, qty_ordered, qty_received, unit_cost)
- [x] `app/models/sales_order.py` — SalesOrder (customer_ref, customer_email, status enum, ship_by_date, created_by_id), SOItem (so_id, product_id, quantity, unit_price)
- [x] `app/models/movement.py` — StockMovement (product_id, from_bin_id nullable, to_bin_id nullable, quantity, movement_type enum, reference_po_id nullable, reference_so_id nullable, performed_by_id, notes, created_at)
- [x] `app/models/__init__.py` — import all models so Alembic discovers metadata

### 2.2 Alembic setup
```bash
cd backend
uv run alembic init alembic
# Edit alembic/env.py:
#   from app.db.session import engine
#   from app.models import *   ← imports SQLModel metadata
#   from sqlmodel import SQLModel
#   target_metadata = SQLModel.metadata
uv run alembic revision --autogenerate -m "initial_schema"
uv run alembic upgrade head
```
- [x] `alembic/env.py` edited to use SQLModel metadata
- [x] Migration file generated in `alembic/versions/` (`b74e89a30e54_initial_schema`)
- [x] `alembic upgrade head` runs without error
- [x] Neon console: all tables visible

---

## Phase 3 — Seed Data

- [x] Write `app/db/seed.py`:
  - **5 users:** admin, operator, procurement, qc, manager — password `pass1234`
  - **2 warehouses:** London Depot, Birmingham Hub
  - **4 zones each:** RECEIVING, STORAGE, SHIPPING, QUARANTINE
  - **12 bins** across zones (e.g. A-01-01, A-01-02, B-02-01...)
  - **3 categories:** Passive Components, Active Components, Tools & Equipment
  - **4 suppliers:** UK-based electronics distributors (RS Components UK, Farnell UK, Mouser UK, DigiKey UK)
  - **10 products** with 2–3 specs each (e.g. 100Ω Resistor, 10µF Capacitor, Arduino Uno, Raspberry Pi 4, Digital Multimeter...)
  - **20 inventory batches** across bins, some with QualityStatus=QUARANTINE
  - **3 purchase orders** (1 RECEIVED, 1 PARTIALLY_RECEIVED, 1 DRAFT)
  - **2 sales orders** (1 PROCESSING, 1 PENDING)
  - **15 stock movements** (RECEIVE, SHIP, TRANSFER, ADJUSTMENT)
- [x] Run: `uv run python -m app.db.seed`
- [x] Verify row counts in Neon console

---

## Phase 4 — FastAPI Routers

### 4.1 Auth & security utilities
- [x] `app/core/security.py` — `hash_password(plain)`, `verify_password(plain, hashed)`, `create_access_token(data)`, `decode_token(token)`
- [x] `app/core/deps.py` — `SessionDep`, `CurrentUser`, `require_roles(*roles)` dependency factory

### 4.2 Router files (each uses `APIRouter`, `SessionDep`, `CurrentUser`)
- [x] `app/routers/auth.py` — POST /login (returns access_token + user), GET /me
- [x] `app/routers/users.py` — GET /users, POST /users (ADMIN only)
- [x] `app/routers/warehouses.py` — warehouses CRUD + zones + bins sub-routes
- [x] `app/routers/products.py` — products CRUD + specs + categories
- [x] `app/routers/suppliers.py` — suppliers CRUD
- [x] `app/routers/inventory.py` — GET inventory (with filters), GET /alerts, POST /adjust, GET /quality, PATCH /quality/{batch_id}
- [x] `app/routers/purchase_orders.py` — PO CRUD + POST /{id}/receive
- [x] `app/routers/sales_orders.py` — SO CRUD + PATCH /{id}/status
- [x] `app/routers/movements.py` — GET movements (paginated), POST movement
- [x] `app/routers/dashboard.py` — KPI aggregates (total products, total stock, open POs, low-stock count, recent movements)

### 4.3 Wire up in main.py
- [x] All routers included with prefix `/api/v1`
- [x] CORS configured (allow localhost:3000 in dev)
- [x] `/health` inline route

### 4.4 Verify
- [x] `curl http://localhost:8000/health` → `{"status":"ok","service":"Abibas WMS"}`
- [x] `POST /api/v1/auth/login` (admin@Abibas.com / pass1234) → JWT ✓
- [x] `GET /api/v1/inventory/alerts` with JWT → low-stock batches
- [x] `GET /api/v1/quality` with JWT → quarantine batches
- [x] `GET /api/v1/dashboard` → KPI totals
- [x] `http://localhost:8000/docs` → Swagger UI, all routes visible

---

## Phase 5 — Next.js Frontend

### 5.1 Initialize
```bash
cd abibas
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir
cd frontend
npm install axios @tanstack/react-query recharts lucide-react
```
- [x] `frontend/.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:8000`
- [x] `next.config.ts`: `output: 'standalone'` + API rewrites for Docker proxy

### 5.2 Shared setup
- [x] `src/lib/api.ts` — axios instance with Bearer token header + 401 interceptor → redirect to /login
- [x] `src/lib/auth.tsx` — AuthProvider + useAuth() (user, login, logout, token)
- [x] `src/components/Providers.tsx` — wraps QueryClientProvider + AuthProvider
- [x] `src/types/index.ts` — TypeScript types matching FastAPI response shapes

### 5.3 Pages

**Color theme:** Plus Jakarta Sans, lime-400 / slate-950 (InventiEase design system — not original slate/blue)

- [x] `/login` — email + password form, JWT stored in localStorage, redirect to /dashboard
- [x] `(dashboard)/layout.tsx` — sidebar with role-based nav icons, auth guard (redirect if no token)
- [x] `/dashboard` — KPI cards (Products, Total Stock Units, Open POs, Low-Stock Items) + recharts BarChart (movements by type) + recent movements table
- [x] `/products` — searchable table by part_number/name, expandable specs panel, Add product modal (ADMIN/PROCUREMENT)
- [x] `/suppliers` — supplier table with lead_time_days badge + Add supplier form (PROCUREMENT/ADMIN)
- [x] `/purchase-orders` — PO table with status badges + Create PO modal + Receive Items modal (marks POItem.qty_received)
- [x] `/sales-orders` — SO table + Create SO modal + status update dropdown (ADMIN)
- [x] `/inventory` — bin-level inventory table (product / bin / lot / qty / quality_status) with color coding (QUARANTINE=amber, FAILED=red, RELEASED=green)
- [x] `/quality` — quarantine batch list + Approve / Reject buttons (QC_INSPECTOR/ADMIN)
- [x] `/movements` — movement log table (type / product / from→to bin / qty / date) + manual ADJUSTMENT form (WAREHOUSE_OPERATOR/ADMIN)
- [x] `/alerts` — products where total_stock < reorder_point, shows deficit + "Suggest PO" shortcut to pre-fill a new PO
- [x] `/users` — admin-only user table + Add user form

- [x] Test: `npm run dev` in frontend/ — loads at localhost:3000
- [x] Test: `npm run build` — 15 routes, zero errors (verified 2026-06-06)
- [ ] Test: full login → dashboard flow in **Docker** (run after `docker compose up --build`)

---

## Phase 5+ — Product Images (post-frontend addition)

- [x] Add `image_url` column to `Product` model (`app/models/product.py`)
- [x] Alembic migration `a1b2c3d4e5f6_add_image_url_to_products.py`
- [ ] Frontend products page displays product images (optional polish)

---

## Phase 6 — Docker Setup ✅ COMPLETE (verify with `docker compose up --build`)

### backend/Dockerfile
```dockerfile
FROM python:3.12-slim
WORKDIR /app
RUN pip install uv
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev
COPY . .
EXPOSE 8000
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### frontend/Dockerfile (multi-stage)
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

### docker-compose.yml
```yaml
version: "3.9"
services:
  backend:
    build: ./backend
    ports: ["8000:8000"]
    env_file: ./backend/.env

  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    environment:
      NEXT_PUBLIC_API_URL: http://backend:8000
    depends_on: [backend]
```

- [x] Write `backend/.dockerignore` (exclude `.env`, `__pycache__`, `.venv`)
- [x] Write `frontend/.dockerignore` (exclude `node_modules`, `.env.local`, `.next`)
- [x] Write `backend/Dockerfile`, `frontend/Dockerfile`, root `docker-compose.yml`
- [x] Write `scripts/test-stack.sh`, `README.md`, `DEPLOYMENT.md`
- [x] Write `.github/workflows/deploy.yml`
- [ ] `docker compose up --build` from root — both containers start (run on server or locally)
- [ ] `curl http://localhost:8000/health` ✓ and `localhost:3000` in browser ✓

---

## Phase 7 — GitHub Actions CI/CD

- [ ] Create GitHub repo `Abibas-wms` (or `abibas`)
- [ ] Write `.github/workflows/deploy.yml`:
  - Trigger: push to `main`
  - Steps: checkout → AWS credentials → ECR login → build+push backend image → build+push frontend image → SSH into EC2 → `docker compose pull && docker compose up -d`
- [ ] Add GitHub Secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `ECR_REGISTRY`, `EC2_HOST`, `EC2_SSH_KEY`
- [ ] Push to main → verify Actions run succeeds

---

## Phase 8 — AWS Deployment

Backend port is **8000** (not 5000 — key difference from FashionFlow).

- [ ] Create VPC `10.0.0.0/16`
- [ ] 2 public subnets (AZ-a `10.0.1.0/24`, AZ-b `10.0.2.0/24`)
- [ ] 2 private subnets (AZ-a `10.0.3.0/24`, AZ-b `10.0.4.0/24`)
- [ ] Internet Gateway + NAT Gateway (Elastic IP)
- [ ] Route tables: public (→ IGW), private (→ NAT)
- [ ] Security groups:
  - **ALB SG:** inbound 80 + 443 from `0.0.0.0/0`
  - **EC2 App SG:** inbound 3000 + 8000 from ALB SG; SSH 22 from your IP
  - **RDS SG:** inbound 5432 from EC2 App SG
- [ ] RDS PostgreSQL (db.t3.micro) in private subnets → update `DATABASE_URL` in EC2 `.env`
- [ ] Run on EC2: `uv run alembic upgrade head` + `uv run python -m app.db.seed`
- [ ] EC2 Launch Template (Amazon Linux 2, Docker + Compose in user-data, pull ECR images, run docker compose)
- [ ] Auto Scaling Group (min 1, desired 1, max 3, CPU target 60%)
- [ ] Application Load Balancer (internet-facing, public subnets)
- [ ] Target Group health check: `GET /health` on port **8000**
- [ ] (Optional) Route 53 DNS + ACM HTTPS

---

## Phase 9 — Performance Testing & Evidence

```js
// k6-test.js
import http from 'k6/http';
import { check } from 'k6';
export const options = { vus: 20, duration: '30s' };
export default function () {
  const res = http.get('http://<ALB_DNS>/api/v1/inventory');
  check(res, { 'status 200': (r) => r.status === 200 });
}
```

- [ ] Run baseline: `k6 run k6-test.js` → screenshot results
- [ ] Add index: `CREATE INDEX idx_inv_product ON inventory_batches(product_id);`
- [ ] Run after test → compare p95 latency and RPS (before vs after)

### Assignment Evidence Checklist
- [ ] AWS VPC console screenshot (subnets, route tables, IGW, NAT)
- [ ] Security groups screenshot (ALB, EC2, RDS rules)
- [ ] ALB target group health screenshot (targets healthy on port 8000)
- [ ] Auto Scaling Group activity history screenshot
- [ ] RDS instance screenshot (private subnet)
- [ ] Route 53 / DNS screenshot
- [ ] EC2 SSH session: `docker ps`, `docker logs backend`, `curl localhost:8000/health`
- [ ] GitHub Actions successful deploy run screenshot
- [ ] k6 before/after performance comparison screenshot
- [ ] Architecture diagram

---

## User Roles & Screens

| Role | Access |
|---|---|
| ADMIN | Everything: users, products, inventory, movements, suppliers, POs, SOs, quality |
| WAREHOUSE_OPERATOR | Inventory, stock movements, bin management, receive PO items |
| PROCUREMENT | Suppliers, purchase orders, reorder alerts |
| QC_INSPECTOR | Quality inspections — approve/reject quarantine batches |
| MANAGER | Read-only dashboard and all reports |

---

## Seed Credentials

| Role | Email | Password |
|---|---|---|
| ADMIN | admin@Abibas.com | pass1234 |
| WAREHOUSE_OPERATOR | operator@Abibas.com | pass1234 |
| PROCUREMENT | procurement@Abibas.com | pass1234 |
| QC_INSPECTOR | qc@Abibas.com | pass1234 |
| MANAGER | manager@Abibas.com | pass1234 |

---

## Verification Checklist

### Local dev (Phases 1–5) — done
- [x] `curl http://localhost:8000/health` → `{"status":"ok","service":"Abibas WMS"}`
- [x] `POST /api/v1/auth/login` (admin@Abibas.com / pass1234) → JWT returned
- [x] `GET /api/v1/inventory/alerts` with JWT → low-stock items listed
- [x] `GET /api/v1/quality` with JWT → quarantine batches listed
- [x] `GET /api/v1/dashboard` → KPI totals
- [x] `http://localhost:8000/docs` → Swagger UI loads with all routes (automatic, no setup)
- [x] Frontend `npm run build` passes — 15 routes
- [x] Neon console: all tables created and seeded correctly

### Pre-deploy (Phase 6+) — run on server
- [x] `next.config.ts` has `output: 'standalone'`
- [ ] `docker compose up --build` → both containers healthy
- [ ] Frontend loads at `localhost:3000`, login works, dashboard KPIs show **via Docker**
- [ ] `scripts/test-stack.sh` passes against Docker stack

---

## Current Status

**Last updated:** 2026-06-06  
**Started:** 2026-06-05  
**Phase:** Phase 6 complete (files) → deploy to server using **DEPLOYMENT.md**

### Completed
- [x] Phase 1–5: Full stack (backend, frontend, seed, all pages)
- [x] Phase 6: Dockerfiles, docker-compose, .dockerignore, test-stack.sh, README, DEPLOYMENT.md
- [x] Phase 7 (partial): `.github/workflows/deploy.yml` created

### Verified endpoints (local dev, 2026-06-05)
  - `curl /health` → `{"status":"ok","service":"Abibas WMS"}` ✓
  - `POST /api/v1/auth/login` (admin@Abibas.com / pass1234) → JWT ✓
  - `GET /api/v1/dashboard` → 10 products, 6696 stock units, 3 quarantine batches ✓
  - `GET /api/v1/quality` → 3 quarantine batches (Arduino, RPI4, ESP32) ✓
  - `GET /api/v1/inventory/alerts` → 4 low-stock items ✓
  - `http://localhost:8000/docs` → Swagger UI auto-generated ✓
  - `npm run build` → 15 routes, compiled successfully ✓

### Next up (on the server)
1. Clone repo to `/var/www/abibas` and configure `backend/.env`
2. `docker compose up --build -d`
3. `docker compose exec backend uv run alembic upgrade head`
4. `docker compose exec backend uv run python -m app.db.seed` (first deploy only)
5. `bash scripts/test-stack.sh`
6. Configure Nginx + Certbot (DEPLOYMENT.md Steps 8–10)
7. Add GitHub Actions secrets for auto-deploy
8. Then Phase 8 (AWS VPC/RDS/ALB) if required by assignment

### Known gaps (non-blocking for Docker, but note)
- No pytest tests written (httpx dev dep installed but unused)
- Root `README.md` missing
- CORS in `main.py` only allows `localhost:3000` — will need production frontend URL before AWS
- `backend/` has its own nested `.git/` (separate from root `abibas/.git`) — consolidate if pushing to one remote

### Note on bcrypt
`passlib` is incompatible with `bcrypt>=4`. Use `bcrypt` directly (already implemented in `app/core/security.py`).

### Note on Alembic migrations
Auto-generated migration files need `import sqlmodel` added at the top — the autogenerate plugin uses `sqlmodel.sql.sqltypes.AutoString` but doesn't add the import automatically.
