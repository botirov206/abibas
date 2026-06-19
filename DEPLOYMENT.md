# Abibas WMS — Docker Deployment

Deploy with **Docker Compose**. **Nginx** and **Certbot** run on the **host**. PostgreSQL is external (Neon or AWS RDS).

Replace `abibas.kindycloud.uz` with your domain throughout.

## Ports

| Where | Host port | Container port | Notes |
| ----- | --------- | -------------- | ----- |
| Frontend (local) | **3000** | 3000 | `docker-compose.yml` |
| Backend (local) | **8000** | 8000 | `docker-compose.yml` |
| Frontend (production) | **3000** | 3000 | `127.0.0.1:3000` — Nginx proxies here |
| Backend (production) | — | 8000 | Not exposed on host; reached as `backend:8000` inside Docker |

---

## Architecture

```text
Internet → Nginx (:80 / :443) → 127.0.0.1:3000 (frontend container)
                                      ↓
                              backend:8000 (Docker network) → PostgreSQL
```

- Do **not** set `NEXT_PUBLIC_API_URL` for Docker builds — the browser uses same-origin `/api/v1/*`.
- Production: `docker compose -f docker-compose.prod.yml up --build -d`
- Do **not** open 3000 or 8000 to the internet — only Nginx ports 80 and 443.

---

## Prerequisites

- Ubuntu VPS, **20+ GB** disk, SSH as `ubuntu`
- Domain **A record** → server public IP
- PostgreSQL URL with `?sslmode=require`
- Docker Engine + Compose on server

---

## Local test

```bash
cd abibas
cp backend/.env.example backend/.env   # set DATABASE_URL, SECRET_KEY
docker compose up --build -d
docker compose exec backend uv run alembic upgrade head
docker compose exec backend uv run python -m app.db.seed   # once only
bash scripts/test-stack.sh
```

| Check | URL |
| ----- | --- |
| Frontend | http://localhost:3000 |
| Backend health | http://localhost:8000/health |
| Login | `admin@Abibas.com` / `pass1234` |

Stop: `docker compose down`

---

## Production deploy

### 1. DNS

Add an **A record**: subdomain → server public IP.

```bash
dig abibas.kindycloud.uz +short          # from your PC
curl -4 ifconfig.me                      # on the server
```

Both must show the **same IP**.

### 2. Server setup

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io git nginx certbot python3-certbot-nginx curl
sudo apt install -y docker-compose-v2 || sudo apt install -y docker-compose-plugin || sudo apt install -y docker-compose
sudo usermod -aG docker ubuntu   # log out and SSH back in

sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

Open **22, 80, 443** in your cloud security group. Do **not** open 3000 or 8000 publicly.

### 3. Clone and configure

```bash
sudo mkdir -p /var/www && sudo chown ubuntu:ubuntu /var/www
cd /var/www
git clone git@github.com:YOUR_USERNAME/abibas.git abibas
cd abibas
cp backend/.env.example backend/.env
nano backend/.env
```

Required in `backend/.env`:

```env
DATABASE_URL=postgresql://USER:PASS@HOST/DB?sslmode=require
SECRET_KEY=<random 32+ chars>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
PORT=8000
```

Generate a key:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(48))"
```

For a **private GitHub repo**, add a deploy key on the server (`~/.ssh/github_repo`) and use the SSH clone URL.

### 4. Start the stack

```bash
cd /var/www/abibas
docker compose -f docker-compose.prod.yml up --build -d

# First deploy only
docker compose exec backend uv run alembic upgrade head
docker compose exec backend uv run python -m app.db.seed

docker compose ps
curl -I http://127.0.0.1:3000
bash scripts/test-stack.sh
```

### 5. Nginx (HTTP)

Create `/etc/nginx/sites-available/abibas.kindycloud.uz`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name abibas.kindycloud.uz;

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

Enable and test:

```bash
sudo ln -sf /etc/nginx/sites-available/abibas.kindycloud.uz /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx
```

Open `http://abibas.kindycloud.uz` — you should see the login page.

### 6. HTTPS

```bash
sudo certbot --nginx -d abibas.kindycloud.uz
sudo certbot renew --dry-run
```

Choose **redirect HTTP → HTTPS** when prompted.

---

## Day-to-day

| Action | Command |
| ------ | ------- |
| Update deploy | `git pull && docker compose -f docker-compose.prod.yml up --build -d` |
| Migrate DB | `docker compose exec backend uv run alembic upgrade head` |
| Logs | `docker compose logs -f` |
| Restart service | `docker compose restart backend` or `frontend` |
| Stop stack | `docker compose down` |
| Stack test | `bash scripts/test-stack.sh` |

Optional CI/CD: configure GitHub Actions secrets (`SSH_HOST`, `SSH_USER`, `SSH_KEY`, `DEPLOY_PATH`) — see `.github/workflows/ci-cd.yml`.

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Notes |
| -------- | -------- | ----- |
| `DATABASE_URL` | Yes | Include `?sslmode=require` for Neon/RDS |
| `SECRET_KEY` | Yes | 32+ random characters |
| `PORT` | No | Default `8000` (inside container) |

### Frontend (Docker)

| Variable | Notes |
| -------- | ----- |
| `API_URL` | Set by compose: `http://backend:8000` (Docker network) |
| `NEXT_PUBLIC_API_URL` | **Do not set** in Docker |

---

## Troubleshooting

**Port already in use**

```bash
sudo ss -tlnp | grep -E ':3000|:8000'
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up --build -d
```

Stop whatever else is bound to 3000 or 8000 before starting the stack.

**Build fails — no space**

Need **20+ GB** disk. Run `docker system prune -af` and expand the volume if needed.

**Backend unhealthy**

```bash
docker compose logs backend
```

Check `DATABASE_URL` is reachable from the server and includes `?sslmode=require`.

**502 from Nginx**

```bash
docker compose ps
curl -I http://127.0.0.1:3000
sudo tail -20 /var/log/nginx/error.log
```

**Login page loads but no data**

```bash
docker compose exec backend uv run alembic upgrade head
docker compose logs backend
```

**Certbot timeout**

Fix HTTP first. Ensure port **80** is open in UFW and the cloud security group.

**API 404 via domain**

Rebuild frontend — `API_URL=http://backend:8000` must be set at build time (already in compose files):

```bash
docker compose -f docker-compose.prod.yml build --no-cache frontend
docker compose -f docker-compose.prod.yml up -d
```

---

## Quick reference

| What | Value |
| ---- | ----- |
| Admin login | `admin@Abibas.com` / `pass1234` |
| Local frontend | http://localhost:3000 |
| Local backend | http://localhost:8000/health |
| Prod frontend (host) | http://127.0.0.1:3000 |
| Local start | `docker compose up --build -d` |
| Prod start | `docker compose -f docker-compose.prod.yml up --build -d` |
| Nginx config | `/etc/nginx/sites-available/abibas.kindycloud.uz` |
