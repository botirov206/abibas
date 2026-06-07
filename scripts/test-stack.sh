#!/usr/bin/env bash
set -euo pipefail

API="${API_URL:-http://localhost:8000}"
FE="${FE_URL:-http://localhost:3000}"
PASS=0
FAIL=0

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

echo "=== StockPilot WMS Stack Test ==="
echo "API: $API | Frontend: $FE"
echo ""

# Health
check "Backend health" "curl -sf '$API/health' | grep -q 'StockPilot WMS'"

# Login (FastAPI returns access_token at top level)
TOKEN=$(curl -sf -X POST "$API/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@stockpilot.com","password":"pass1234"}' \
  | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).access_token")

check "Admin login returns JWT" "test -n '$TOKEN'"

AUTH="Authorization: Bearer $TOKEN"

# Core endpoints
check "GET /auth/me" "curl -sf -H '$AUTH' '$API/api/v1/auth/me' | grep -q 'admin@stockpilot.com'"
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
OP_TOKEN=$(curl -sf -X POST "$API/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"operator@stockpilot.com","password":"pass1234"}' \
  | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).access_token")
check "Operator can access inventory" "curl -sf -H 'Authorization: Bearer $OP_TOKEN' '$API/api/v1/inventory' | grep -q 'quantity'"
check "Operator blocked from users" "test \$(curl -s -o /dev/null -w '%{http_code}' -H 'Authorization: Bearer $OP_TOKEN' '$API/api/v1/users') = '403'"

PROC_TOKEN=$(curl -sf -X POST "$API/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"procurement@stockpilot.com","password":"pass1234"}' \
  | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).access_token")
check "Procurement can access suppliers" "curl -sf -H 'Authorization: Bearer $PROC_TOKEN' '$API/api/v1/suppliers' | grep -q 'Nike'"
check "Procurement can access purchase-orders" "curl -sf -H 'Authorization: Bearer $PROC_TOKEN' '$API/api/v1/purchase-orders' | grep -q 'status'"

# Frontend proxy (via Next.js rewrites)
check "Frontend login page" "curl -sf -o /dev/null '$FE/login'"
check "Frontend API proxy /auth/me" "test \$(curl -s -o /dev/null -w '%{http_code}' -H 'Authorization: Bearer $TOKEN' '$FE/api/v1/auth/me') = '200'"
check "Frontend API proxy /dashboard" "test \$(curl -s -o /dev/null -w '%{http_code}' -H 'Authorization: Bearer $TOKEN' '$FE/api/v1/dashboard') = '200'"

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
test "$FAIL" -eq 0
