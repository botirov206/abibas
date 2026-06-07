# StockPilot WMS (abibas) — Docker Deployment Guide

Deploy **StockPilot WMS** using **Docker Compose** on an Ubuntu VPS, with **Nginx** and **Let's Encrypt HTTPS** on the host.

> **Deployment method:** Docker only. Do not use PM2 or bare-metal Node/Python on the server — the stack is designed to run entirely in containers.

Replace `abibas.kindycloud.uz` with your actual subdomain throughout this guide.

---

## Table of contents

1. [Architecture](#architecture)
2. [Before you start](#before-you-start--checklist)
3. [Part A — Local Docker smoke test](#part-a--local-docker-smoke-test)
4. [Part B — Production VPS deploy](#part-b--production-vps-deploy)
   - [Step 0 — DNS](#step-0--dns-setup-domain-panel)
   - [Step 1 — Clean slate](#step-1--start-fresh-if-you-tried-before)
   - [Step 2 — Install Docker](#step-2--install-docker-nginx-and-certbot)
   - [Step 3 — Firewall](#step-3--open-firewall-ports)
   - [Step 4 — SSH keys](#step-4--ssh-keys-for-private-github-repo)
   - [Step 5 — Clone project](#step-5--clone-the-project)
   - [Step 6 — Backend env](#step-6--configure-backend-environment)
   - [Step 7 — Start Docker stack](#step-7--start-the-docker-stack)
   - [Step 8 — Nginx](#step-8--configure-nginx-http-reverse-proxy)
   - [Step 9 — Test HTTP](#step-9--test-http-before-https)
   - [Step 10 — HTTPS](#step-10--https-with-lets-encrypt-certbot)
   - [Step 11 — CI/CD](#step-11--github-actions-auto-deploy-optional)
   - [Step 12 — Operations](#step-12--day-to-day-operations)
5. [Environment variables](#environment-variables-reference)
6. [Docker Compose reference](#docker-compose-reference)
7. [Troubleshooting](#troubleshooting)
8. [Final checklist](#final-checklist)
9. [Quick reference](#quick-reference)

---

## Architecture

```text
Internet
   │
   ▼
DNS  abibas.kindycloud.uz  →  your server public IP
   │
   ▼
Nginx (:80 HTTP, :443 HTTPS)          ← installed on the HOST (not in Docker)
   │
   ▼
Docker: frontend container (:3000)    ← Next.js 16 (standalone build)
   │
   │  /api/v1/* proxied inside Next.js (server-side rewrite)
   ▼
Docker: backend container (:8000)     ← FastAPI + SQLModel + Alembic
   │
   └── Neon PostgreSQL (cloud) or AWS RDS (external — not in Docker)
```

### How traffic flows

| Path                                                | What happens                                                                            |
| --------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Browser → `https://abibas.kindycloud.uz`            | Nginx forwards to `127.0.0.1:3000` (frontend container)                                 |
| Browser → `https://abibas.kindycloud.uz/api/v1/...` | Frontend Next.js rewrites to `http://backend:8000/api/v1/...` inside the Docker network |
| Backend → PostgreSQL                                | Direct connection using `DATABASE_URL` from `backend/.env`                              |

**Important:**

- Nginx sits **in front of** Docker. Users never hit ports 3000/8000 from the internet — only Nginx ports 80 and 443.
- In production, use `docker-compose.prod.yml` to bind container ports to `127.0.0.1` so they are not reachable from outside the server.
- Do **not** set `NEXT_PUBLIC_API_URL` for the Docker frontend build. The browser calls same-origin `/api/v1/*`; Next.js proxies to the backend container.

### Docker network

Both containers share the `app` network defined in `docker-compose.yml`. The frontend build receives `API_URL=http://backend:8000` — `backend` is the Docker service hostname.

```text
┌─────────────────────────────────────────────────────┐
│  Docker network: app                                │
│                                                     │
│   frontend:3000  ──rewrite──►  backend:8000         │
│                                                     │
└─────────────────────────────────────────────────────┘
         ▲                              │
         │ 127.0.0.1:3000               │ DATABASE_URL
         │ (host)                       ▼
    Nginx (host)                   Neon / RDS (cloud)
```

---

## Before you start — checklist

| Requirement | Details                                                     |
| ----------- | ----------------------------------------------------------- |
| Server      | Ubuntu VPS (e.g. AWS EC2). SSH as **`ubuntu`**.             |
| Disk        | **At least 20 GB** — Python + Node Docker builds need space |
| Domain      | Subdomain with an **A record** → server public IP           |
| Database    | Neon PostgreSQL (dev/staging) or AWS RDS (production)       |
| GitHub      | Private repo — needs SSH deploy key on server               |
| Docker      | Docker Engine + Compose plugin on server (Step 2)           |
| Time        | ~30–45 minutes for first production deploy                  |

---

## Part A — Local Docker smoke test

Run this on your **development machine** (Windows, macOS, or Linux) before deploying to a VPS. Confirms the Docker stack builds and runs correctly.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/macOS) or Docker Engine (Linux)
- A reachable PostgreSQL database (Neon free tier works)

### Steps

```bash
# Clone the repo (or use your existing local copy)
cd abibas

# Configure backend environment
cp backend/.env.example backend/.env
# Edit backend/.env — set DATABASE_URL and SECRET_KEY

# Build and start both containers
docker compose up --build -d

# Wait ~30s for health checks, then check status
docker compose ps
```

Expected: both `backend` and `frontend` show **Up (healthy)**.

### First run — migrations and seed

```bash
docker compose exec backend uv run alembic upgrade head
docker compose exec backend uv run python -m app.db.seed
```

> Run seed **once**. Re-running on a populated database may fail on duplicate data.

### Verify locally

```bash
# Backend health
curl http://localhost:8000/health
# Expected: {"status":"ok","service":"StockPilot WMS"}

# Frontend
curl -I http://localhost:3000
# Expected: HTTP/1.1 200 or 307

# Full integration test
bash scripts/test-stack.sh
```

Open `http://localhost:3000` and log in with `admin@stockpilot.com` / `pass1234`.

### Stop local stack

```bash
docker compose down
```

---

## Part B — Production VPS deploy

### Step 0 — DNS setup (domain panel)

In your domain host, add:

| Field           | Value                                   |
| --------------- | --------------------------------------- |
| **Host / Name** | `stockpilot` (or your chosen subdomain) |
| **Type**        | `A`                                     |
| **Value**       | Your server **public** IP               |
| **TTL**         | `300`                                   |

Verify from your PC (wait 5–10 min after saving):

```bash
dig abibas.kindycloud.uz +short
```

On the server, your public IP should match:

```bash
curl -4 ifconfig.me
```

Both must show the **same IP**.

---

### Step 1 — Start fresh (if you tried before)

SSH in as `ubuntu`. If you used PM2 or a broken Nginx/Certbot setup, clean up:

```bash
# Stop old PM2 processes (if any) — PM2 is NOT used for this project
pm2 delete all 2>/dev/null || true
pm2 save 2>/dev/null || true

# Stop old Docker stack (if any)
cd /var/www/abibas 2>/dev/null && docker compose down || true

# Remove old Nginx site
sudo rm -f /etc/nginx/sites-enabled/abibas.kindycloud.uz
sudo rm -f /etc/nginx/sites-available/abibas.kindycloud.uz
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# Remove failed SSL cert (if Certbot was attempted)
sudo certbot delete --cert-name abibas.kindycloud.uz 2>/dev/null || true
```

---

### Step 2 — Install Docker, Nginx, and Certbot

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io git nginx certbot python3-certbot-nginx curl
```

Install Docker Compose (package name varies by Ubuntu version):

```bash
# Ubuntu 24.04 / 22.04 — usually works:
sudo apt install -y docker-compose-plugin 2>/dev/null || true

# Ubuntu 26.04+ (your server) — plugin package is named differently:
sudo apt install -y docker-compose-v2 2>/dev/null || true

# Fallback — legacy standalone binary (always works):
sudo apt install -y docker-compose 2>/dev/null || true
```

Add your user to the Docker group (required so `ubuntu` can run Docker without `sudo`):

```bash
sudo usermod -aG docker ubuntu
```

**Log out and SSH back in** for the group change to apply.

Verify:

```bash
docker --version
docker compose version    # v2 (space) — preferred
# OR
docker-compose --version  # v1 (hyphen) — also fine
nginx -v
```

> **Ubuntu 26.04 note:** `docker-compose-plugin` is not in apt on newer Ubuntu. Use **`docker-compose-v2`** instead — it provides the `docker compose` command. If only `docker-compose` (hyphen) is available, use that everywhere this guide says `docker compose` (e.g. `docker-compose up --build -d`).

---

### Step 3 — Open firewall ports

#### 3a. UFW (on the server)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'    # opens 80 and 443
sudo ufw enable
sudo ufw status
```

You should see `80` and `443` allowed. Ports **3000** and **8000** do **not** need to be open publicly — Nginx handles external traffic.

#### 3b. Cloud security group (AWS / VPS panel)

If you use **AWS EC2**, open the instance **Security Group**:

| Type  | Port | Source                   | Purpose           |
| ----- | ---- | ------------------------ | ----------------- |
| SSH   | 22   | Your IP (or `0.0.0.0/0`) | SSH access        |
| HTTP  | 80   | `0.0.0.0/0`              | Website + Certbot |
| HTTPS | 443  | `0.0.0.0/0`              | Secure website    |

**Do not** open 3000 or 8000 to the internet in production.

---

### Step 4 — SSH keys for private GitHub repo

You need **two separate keys**:

| Key                    | Purpose                              | Private key stored          | Public key added to             |
| ---------------------- | ------------------------------------ | --------------------------- | ------------------------------- |
| **Server git key**     | Server runs `git clone` / `git pull` | Server `~/.ssh/github_repo` | GitHub → repo → **Deploy keys** |
| **Actions deploy key** | GitHub Actions SSHs into server      | GitHub secret `SSH_KEY`     | Server `~/.ssh/authorized_keys` |

```text
GitHub (private repo)  ←—— server git key ———  Server
        │
        │  push to main
        ▼
GitHub Actions  —— Actions deploy key ——→  Server (git pull + docker compose up)
```

#### 4a. Server can pull from GitHub

Run as **`ubuntu`**:

```bash
ssh-keygen -t ed25519 -C "stockpilot-server-git" -f ~/.ssh/github_repo -N ""
cat ~/.ssh/github_repo.pub
```

1. GitHub → your **private repo** → **Settings** → **Deploy keys** → **Add deploy key**
2. Title: `stockpilot-server`
3. Paste the public key (one long line)
4. **Do not** enable write access
5. Save

Configure GitHub SSH on the server:

```bash
cat >> ~/.ssh/config << 'EOF'
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/github_repo
  IdentitiesOnly yes
EOF
chmod 600 ~/.ssh/config

ssh -T git@github.com
# Expected: "Hi USERNAME/REPO! You've successfully authenticated..."
```

#### 4b. GitHub Actions can SSH into the server

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions -N ""

cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh

ssh -i ~/.ssh/github_actions ubuntu@127.0.0.1
```

Add GitHub Actions secrets:

**GitHub → repo → Settings → Secrets and variables → Actions → New repository secret**

| Secret name   | Value                                                    |
| ------------- | -------------------------------------------------------- |
| `SSH_HOST`    | Server public IP                                         |
| `SSH_USER`    | **`ubuntu`**                                             |
| `SSH_KEY`     | Full output of `cat ~/.ssh/github_actions` (private key) |
| `DEPLOY_PATH` | `/var/www/abibas`                                        |

The deploy workflow (`.github/workflows/deploy.yml`) skips until all four secrets exist.

---

### Step 5 — Clone the project

```bash
sudo mkdir -p /var/www
sudo chown ubuntu:ubuntu /var/www
cd /var/www

git clone git@github.com:YOUR_USERNAME/abibas.git abibas
cd abibas
```

Use the **SSH** URL (`git@github.com:...`), not HTTPS.

---

### Step 6 — Configure backend environment

```bash
cd /var/www/abibas
cp backend/.env.example backend/.env
nano backend/.env
```

Fill in at minimum:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require
SECRET_KEY=use-a-long-random-string-here-at-least-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
PORT=8000
```

> Use your **Neon** connection string for dev/staging, or **AWS RDS** URL for production. Always include `?sslmode=require`.

Generate a strong `SECRET_KEY`:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(48))"
```

Ensure `ubuntu` owns the project:

```bash
sudo chown -R ubuntu:ubuntu /var/www/abibas
```

---

### Step 7 — Start the Docker stack

```bash
cd /var/www/abibas

# Stop anything else using ports 3000/8000
pm2 delete all 2>/dev/null || true
sudo ss -tlnp | grep -E ':3000|:8000' || true

# Build and start — production override binds ports to localhost only
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d

# Check status — both should be "Up (healthy)"
docker compose ps
```

#### First deploy only — run migrations and seed

```bash
docker compose exec backend uv run alembic upgrade head
docker compose exec backend uv run python -m app.db.seed
```

> Skip the seed command on subsequent deploys unless you want to reset demo data.

#### Verify on the server

```bash
# Backend health (inside container — prod does not expose :8000 on host)
docker compose exec backend curl -sf http://127.0.0.1:8000/health
# Expected: {"status":"ok","service":"StockPilot WMS"}

# Frontend responding
curl -I http://127.0.0.1:3000
# Expected: HTTP/1.1 200 or 307

# Integration tests
bash scripts/test-stack.sh
```

Check logs if something fails:

```bash
docker compose logs backend
docker compose logs frontend

# Follow live logs
docker compose logs -f
```

#### Container health checks

Both Dockerfiles define `HEALTHCHECK` probes:

| Service  | Probe                      | Interval |
| -------- | -------------------------- | -------- |
| Backend  | `GET /health` on port 8000 | 30s      |
| Frontend | `GET /` on port 3000       | 30s      |

```bash
docker inspect --format='{{.State.Health.Status}}' abibas-backend-1
docker inspect --format='{{.State.Health.Status}}' abibas-frontend-1
```

---

### Step 8 — Configure Nginx (HTTP reverse proxy)

Nginx receives traffic on port **80** and forwards it to the **frontend container** on `127.0.0.1:3000`.

The frontend internally proxies `/api/v1/*` to the backend — Nginx only needs to point at port 3000.

#### 8a. Create the site config

```bash
sudo nano /etc/nginx/sites-available/abibas.kindycloud.uz
```

Paste this entire block (replace the domain):

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name abibas.kindycloud.uz;

    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 8b. Enable the site

```bash
sudo ln -sf /etc/nginx/sites-available/abibas.kindycloud.uz /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

### Step 9 — Test HTTP before HTTPS

**Do not run Certbot until this works.**

#### On the server

```bash
curl -I http://127.0.0.1:3000
curl -I -H "Host: abibas.kindycloud.uz" http://127.0.0.1
bash scripts/test-stack.sh
```

#### In your browser (from your PC)

Open:

```text
http://abibas.kindycloud.uz
```

You should see the **StockPilot login page**.

Login with: `admin@stockpilot.com` / `pass1234`

#### If HTTP does not work

```bash
# 1. DNS correct?
curl -4 ifconfig.me
dig +short abibas.kindycloud.uz @8.8.8.8

# 2. Docker running?
docker compose ps
curl http://127.0.0.1:8000/health
curl -I http://127.0.0.1:3000

# 3. Nginx running?
sudo systemctl status nginx
sudo nginx -t
sudo ss -tlnp | grep ':80'

# 4. Firewall open?
sudo ufw status

# 5. Nginx errors
sudo tail -30 /var/log/nginx/error.log
```

Also check **AWS Security Group** allows inbound port **80**.

---

### Step 10 — HTTPS with Let's Encrypt (Certbot)

Once `http://abibas.kindycloud.uz` works in a browser:

```bash
sudo certbot --nginx -d abibas.kindycloud.uz
```

| Prompt                | Answer                           |
| --------------------- | -------------------------------- |
| Email address         | Your email (for expiry notices)  |
| Terms of Service      | `Y`                              |
| Share email with EFF  | `Y` or `N`                       |
| Redirect HTTP → HTTPS | **`2` (Redirect)** — recommended |

Verify HTTPS:

```bash
# In browser
https://abibas.kindycloud.uz
```

```bash
# Test auto-renewal (certificates expire every 90 days)
sudo certbot renew --dry-run
```

---

### Step 11 — GitHub Actions auto-deploy (optional)

After secrets from Step 4b are configured, pushes to `main` trigger `.github/workflows/deploy.yml`.

The workflow:

1. SSHs into the server as `ubuntu`
2. Runs `git pull origin main`
3. Rebuilds and restarts containers with `docker compose up --build -d`
4. Runs Alembic migrations

Trigger manually: GitHub → **Actions** → **Deploy** → **Run workflow**

#### Manual deploy (without Actions)

```bash
cd /var/www/abibas
git pull origin main
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
docker compose exec -T backend uv run alembic upgrade head
docker compose ps
```

> The workflow already uses `docker-compose.prod.yml` for production port binding.

---

### Step 12 — Day-to-day operations

#### View logs

```bash
cd /var/www/abibas
docker compose logs -f backend
docker compose logs -f frontend
```

#### Restart a single service

```bash
docker compose restart backend
docker compose restart frontend
```

#### Rebuild after code changes

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

#### Stop everything

```bash
docker compose down
```

#### Run integration tests

```bash
bash scripts/test-stack.sh
```

#### Database migrations

```bash
docker compose exec backend uv run alembic upgrade head
docker compose exec backend uv run alembic current
```

#### Swagger API docs

Not exposed through Nginx by default. Access via SSH tunnel:

```bash
# On your PC
ssh -L 8000:127.0.0.1:8000 ubuntu@YOUR_SERVER_IP
# Then open http://localhost:8000/docs
```

#### Shell into a container

```bash
docker compose exec backend bash
docker compose exec frontend sh
```

---

## Environment variables reference

### Backend (`backend/.env`)

| Variable                      | Required | Description                                                                |
| ----------------------------- | -------- | -------------------------------------------------------------------------- |
| `DATABASE_URL`                | Yes      | PostgreSQL connection string. Must include `?sslmode=require` for Neon/RDS |
| `SECRET_KEY`                  | Yes      | JWT signing key — use 32+ random characters                                |
| `ALGORITHM`                   | No       | Default `HS256`                                                            |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No       | Default `1440` (24 hours)                                                  |
| `PORT`                        | No       | Default `8000`. Overridden by `docker-compose.yml`                         |

### Frontend (Docker build)

| Variable              | Set by                         | Description                                                 |
| --------------------- | ------------------------------ | ----------------------------------------------------------- |
| `API_URL`             | `docker-compose.yml` build arg | `http://backend:8000` — internal Docker hostname            |
| `NEXT_PUBLIC_API_URL` | **Do not set**                 | Leave unset in Docker; browser uses same-origin `/api/v1/*` |

### Frontend (local dev only)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Docker Compose reference

### `docker-compose.yml` (base)

| Service    | Image / build                               | Port | Notes                           |
| ---------- | ------------------------------------------- | ---- | ------------------------------- |
| `backend`  | `backend/Dockerfile` (Python 3.12 + uv)     | 8000 | FastAPI, reads `backend/.env`   |
| `frontend` | `frontend/Dockerfile` (Node 20 multi-stage) | 3000 | Next.js standalone, proxies API |

### `docker-compose.prod.yml` (production override)

Binds ports to `127.0.0.1` only — containers are not reachable from the public internet.

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

### Dockerfiles

| File                  | Base               | Key details                                   |
| --------------------- | ------------------ | --------------------------------------------- |
| `backend/Dockerfile`  | `python:3.12-slim` | `uv sync --frozen`, health check on `/health` |
| `frontend/Dockerfile` | `node:20-alpine`   | Multi-stage build, `output: 'standalone'`     |

### Files excluded from builds

- `backend/.dockerignore` — excludes `.env`, `.venv`, `__pycache__`
- `frontend/.dockerignore` — excludes `node_modules`, `.next`, `.env.local`

---

## Troubleshooting

### `ENOSPC: no space left on device` during Docker build

**11 GB disks are too small** for building Python + Node Docker images. You need **at least 20 GB**.

#### Cleanup

```bash
cd /var/www/abibas
rm -rf backend/.venv frontend/node_modules
rm -rf ~/.npm/_cacache
docker system prune -af
docker builder prune -af
sudo journalctl --vacuum-size=50M
sudo apt clean && sudo apt autoremove -y
sudo chown -R ubuntu:ubuntu /var/www/abibas
df -h
```

#### Build in stages

```bash
cd /var/www/abibas
docker compose build backend
docker compose up -d backend
docker builder prune -af
docker compose build frontend
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
docker compose ps
```

#### Expand EBS volume (AWS EC2)

1. **AWS Console** → **EC2** → **Volumes** → **Modify volume** → 30 GiB
2. On the server:

```bash
lsblk
sudo growpart /dev/nvme0n1 1
sudo resize2fs /dev/nvme0n1p1
df -h
```

### Backend container exits — database connection failed

```bash
docker compose logs backend
cat backend/.env   # DATABASE_URL must be reachable from the server
```

Neon and RDS both require `?sslmode=require` in the URL. Test connectivity:

```bash
docker compose exec backend uv run python -c "
from sqlalchemy import create_engine, text
import os
e = create_engine(os.environ['DATABASE_URL'])
with e.connect() as c:
    print(c.execute(text('SELECT 1')).scalar())
"
```

### Container shows `unhealthy`

```bash
docker compose logs backend
docker compose logs frontend
curl http://127.0.0.1:8000/health
curl -I http://127.0.0.1:3000
```

Backend may still be starting (15s start period). Wait and retry.

### Alembic migration errors

```bash
docker compose exec backend uv run alembic current
docker compose exec backend uv run alembic upgrade head
```

If autogenerate migrations fail with `AutoString` errors, ensure migration files include `import sqlmodel` at the top.

### `git pull` → `Permission denied` on `.git/FETCH_HEAD`

```bash
sudo chown -R ubuntu:ubuntu /var/www/abibas
git pull origin main
```

### `git pull` asks for username/password

Repo was cloned with HTTPS. Switch to SSH:

```bash
cd /var/www/abibas
git remote set-url origin git@github.com:YOUR_USERNAME/abibas.git
git pull
```

### Login page loads but data does not appear

Backend is down or migrations not applied:

```bash
docker compose ps
docker compose logs backend
curl http://127.0.0.1:8000/health
docker compose exec backend uv run alembic upgrade head
```

### 502 Bad Gateway from Nginx

Frontend container is not running:

```bash
docker compose ps
docker compose up -d frontend
curl -I http://127.0.0.1:3000
sudo tail -20 /var/log/nginx/error.log
```

### `failed to bind host port` / `address already in use`

The backend failed to start, so `docker compose ps` shows **nothing** (containers are created then exit). Check stopped containers too:

```bash
docker compose ps -a          # shows Exited containers
sudo ss -tlnp | grep -E ':3000|:8000'
```

Something else is using the port (often PM2, a manual `uvicorn`, or a previous deploy):

```bash
pm2 list
pm2 delete all 2>/dev/null || true

# Remove failed/partial containers
docker compose -f docker-compose.yml -f docker-compose.prod.yml down

# Kill a stray process on 8000 if needed (note the PID from ss output):
# sudo kill <PID>

docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
docker compose ps
```

> **Production note:** `docker-compose.prod.yml` does **not** bind backend port 8000 on the host — only `127.0.0.1:3000` for Nginx. Backend is reached internally via the Docker network. After `git pull`, port 8000 conflicts should no longer block startup.

Verify backend without a host port:

```bash
docker compose exec backend curl -sf http://127.0.0.1:8000/health
# OR through the frontend proxy:
curl -sf http://127.0.0.1:3000/api/v1/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@stockpilot.com","password":"pass1234"}'
```

### Certbot: `Timeout during connect (likely firewall problem)`

1. Fix `http://abibas.kindycloud.uz` in a browser first
2. Open port **80** in UFW and **AWS Security Group**
3. Confirm DNS points to this server

### `docker compose: command not found`

```bash
# Try in order — one of these will work on Ubuntu:
sudo apt install -y docker-compose-v2    # Ubuntu 26.04+
sudo apt install -y docker-compose-plugin  # Ubuntu 22.04 / 24.04
sudo apt install -y docker-compose         # legacy fallback

# Log out and back in, then verify:
docker compose version || docker-compose --version
```

If only `docker-compose` (hyphen) is installed, replace `docker compose` with `docker-compose` in all commands — same flags, same `docker-compose.yml` files.

### Docker permission denied

```bash
sudo usermod -aG docker ubuntu
# log out and SSH back in
```

### Frontend build fails — `npm ci` errors

```bash
docker compose build frontend --no-cache
```

Ensure `package-lock.json` is committed and in sync with `package.json`.

### API calls return 404 through the domain but work on localhost

Next.js rewrite may be misconfigured. Confirm `API_URL=http://backend:8000` was passed at build time:

```bash
docker compose config | grep -A2 API_URL
```

Rebuild frontend if the build arg was wrong:

```bash
docker compose build --no-cache frontend
docker compose up -d frontend
```

---

## Final checklist

- [ ] Local Docker smoke test passed (`docker compose up --build -d` + `scripts/test-stack.sh`)
- [ ] DNS A record → server public IP
- [ ] AWS / VPS security group: ports 22, 80, 443 open (not 3000/8000)
- [ ] UFW: `Nginx Full` allowed
- [ ] Docker installed, `ubuntu` in `docker` group
- [ ] GitHub deploy key → server can `git clone` / `git pull`
- [ ] `backend/.env` configured (`DATABASE_URL`, `SECRET_KEY`)
- [ ] `docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d` — both containers Up (healthy)
- [ ] `docker compose exec backend uv run alembic upgrade head` succeeded
- [ ] `docker compose exec backend uv run python -m app.db.seed` (first deploy only)
- [ ] `curl http://127.0.0.1:8000/health` returns StockPilot WMS ok
- [ ] `bash scripts/test-stack.sh` passes
- [ ] Nginx site enabled, default site removed
- [ ] `http://abibas.kindycloud.uz` shows login page
- [ ] `sudo certbot --nginx -d abibas.kindycloud.uz` succeeded
- [ ] `https://abibas.kindycloud.uz` works with padlock
- [ ] `sudo certbot renew --dry-run` passes
- [ ] (Optional) GitHub Actions secrets: `SSH_HOST`, `SSH_USER`, `SSH_KEY`, `DEPLOY_PATH`

---

## Quick reference

| What             | Command / URL                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------- |
| Admin login      | `admin@stockpilot.com` / `pass1234`                                                         |
| Local start      | `docker compose up --build -d`                                                              |
| Production start | `docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d`             |
| Stop stack       | `docker compose down`                                                                       |
| Logs             | `docker compose logs -f`                                                                    |
| Migrate DB       | `docker compose exec backend uv run alembic upgrade head`                                   |
| Deploy update    | `git pull && docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d` |
| Stack test       | `bash scripts/test-stack.sh`                                                                |
| Nginx config     | `/etc/nginx/sites-available/abibas.kindycloud.uz`                                           |
| SSL certs        | `/etc/letsencrypt/live/abibas.kindycloud.uz/`                                               |
| Swagger (tunnel) | `ssh -L 8000:127.0.0.1:8000 ubuntu@SERVER` → `http://localhost:8000/docs`                   |
