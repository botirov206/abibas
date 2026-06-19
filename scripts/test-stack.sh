#!/usr/bin/env bash
set -uo pipefail

FE="${FE_URL:-http://127.0.0.1:3010}"
PASS=0
FAIL=0

# Production: backend has no host port — route API through the frontend proxy.
if [ -n "${API_URL:-}" ]; then
  API="$API_URL"
elif curl -sf --connect-timeout 2 "http://127.0.0.1:8010/health" 2>/dev/null | grep -q 'Abibas WMS'; then
  API="http://127.0.0.1:8010"
else
  API="$FE"
fi

check() {
  local name="$1"
  shift
  if bash -c "$*"; then
    echo "✓ $name"
    PASS=$((PASS + 1))
  else
    echo "✗ $name"
    FAIL=$((FAIL + 1))
  fi
}

# Parse access_token from JSON (python3 on servers; node on dev machines)
extract_token() {
  local body="$1"
  if command -v python3 >/dev/null 2>&1; then
    echo "$body" | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])"
  elif command -v node >/dev/null 2>&1; then
    echo "$body" | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).access_token"
  else
    echo "$body" | grep -o '"access_token":"[^"]*"' | head -1 | sed 's/"access_token":"//;s/"$//'
  fi
}

# POST /auth/login and print access_token, or explain failure on stderr
get_token() {
  local email="$1"
  local password="$2"
  local resp code body token

  resp=$(curl -s -w $'\n%{http_code}' -X POST "$API/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$password\"}")
  code=$(echo "$resp" | tail -n1)
  body=$(echo "$resp" | sed '$d')

  if [ "$code" != "200" ]; then
    echo "  login $email failed: HTTP $code — ${body:-<empty>}" >&2
    if [ "$code" = "500" ]; then
      echo "  hint: set a real DATABASE_URL in backend/.env, then run:" >&2
      echo "    docker compose exec backend uv run alembic upgrade head" >&2
      echo "    docker compose exec backend uv run python -m app.db.seed" >&2
    elif [ "$code" = "401" ]; then
      echo "  hint: run seed if the database is empty:" >&2
      echo "    docker compose exec backend uv run python -m app.db.seed" >&2
    fi
    return 1
  fi

  token=$(extract_token "$body") || {
    echo "  login $email: could not parse access_token — $body" >&2
    return 1
  }
  echo "$token"
}

echo "=== Abibas WMS Stack Test ==="
echo "API: $API | Frontend: $FE"
echo ""

# Health — direct /health in dev; via login proxy in production
if [ "$API" = "$FE" ]; then
  check "Backend health (via frontend proxy)" "curl -sf -X POST '$API/api/v1/auth/login' -H 'Content-Type: application/json' -d '{\"email\":\"admin@abibas.com\",\"password\":\"pass1234\"}' | grep -q 'access_token'"
else
  check "Backend health" "curl -sf '$API/health' | grep -q 'Abibas WMS'"
fi

# Login (FastAPI returns access_token at top level)
TOKEN=""
if TOKEN=$(get_token "admin@abibas.com" "pass1234"); then
  check "Admin login returns JWT" "test -n '$TOKEN'"
else
  echo "✗ Admin login returns JWT"
  FAIL=$((FAIL + 1))
fi

# Core endpoints + role-based access (skip if admin login failed)
if [ -n "${TOKEN:-}" ]; then
  AUTH="Authorization: Bearer $TOKEN"

  check "GET /auth/me" "curl -sf -H '$AUTH' '$API/api/v1/auth/me' | grep -q 'admin@abibas.com'"
  check "GET /products" "curl -sf -H '$AUTH' '$API/api/v1/products' | grep -q 'NK-AF1'"
  check "GET /dashboard" "curl -sf -H '$AUTH' '$API/api/v1/dashboard' | grep -q 'total_products'"
  check "GET /inventory" "curl -sf -H '$AUTH' '$API/api/v1/inventory' | grep -q 'quantity'"
  check "GET /inventory/alerts" "curl -sf -H '$AUTH' '$API/api/v1/inventory/alerts' | grep -qE '^\\[.*\\]$'"
  check "GET /quality" "curl -sf -H '$AUTH' '$API/api/v1/quality' | grep -q 'QUARANTINE'"
  check "GET /purchase-orders" "curl -sf -H '$AUTH' '$API/api/v1/purchase-orders' | grep -q 'DRAFT'"
  check "GET /sales-orders" "curl -sf -H '$AUTH' '$API/api/v1/sales-orders' | grep -q 'PENDING'"
  check "GET /movements" "curl -sf -H '$AUTH' '$API/api/v1/movements' | grep -q 'RECEIVE'"
  check "GET /warehouses" "curl -sf -H '$AUTH' '$API/api/v1/warehouses' | grep -q 'London'"
  check "GET /suppliers" "curl -sf -H '$AUTH' '$API/api/v1/suppliers' | grep -q 'Nike'"

  # Role-based access
  if OP_TOKEN=$(get_token "operator@abibas.com" "pass1234"); then
    check "Operator can access inventory" "curl -sf -H 'Authorization: Bearer $OP_TOKEN' '$API/api/v1/inventory' | grep -q 'quantity'"
    check "Operator blocked from users" "test \$(curl -s -o /dev/null -w '%{http_code}' -H 'Authorization: Bearer $OP_TOKEN' '$API/api/v1/users') = '403'"
  else
    echo "✗ Operator login"
    FAIL=$((FAIL + 2))
  fi

  if PROC_TOKEN=$(get_token "procurement@abibas.com" "pass1234"); then
    check "Procurement can access suppliers" "curl -sf -H 'Authorization: Bearer $PROC_TOKEN' '$API/api/v1/suppliers' | grep -q 'Nike'"
    check "Procurement can access purchase-orders" "curl -sf -H 'Authorization: Bearer $PROC_TOKEN' '$API/api/v1/purchase-orders' | grep -q 'status'"
  else
    echo "✗ Procurement login"
    FAIL=$((FAIL + 2))
  fi
else
  echo "⊘ Skipping authenticated API tests (login failed)"
  FAIL=$((FAIL + 15))
fi

# Frontend proxy (via Next.js rewrites)
check "Frontend login page" "curl -sf -o /dev/null '$FE/login'"
if [ -n "${TOKEN:-}" ]; then
  check "Frontend API proxy /auth/me" "test \$(curl -s -o /dev/null -w '%{http_code}' -H 'Authorization: Bearer $TOKEN' '$FE/api/v1/auth/me') = '200'"
  check "Frontend API proxy /dashboard" "test \$(curl -s -o /dev/null -w '%{http_code}' -H 'Authorization: Bearer $TOKEN' '$FE/api/v1/dashboard') = '200'"
else
  echo "⊘ Skipping frontend API proxy tests (login failed)"
  FAIL=$((FAIL + 2))
fi

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
test "$FAIL" -eq 0
