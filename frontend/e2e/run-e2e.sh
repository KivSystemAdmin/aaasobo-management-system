#!/usr/bin/env bash
set -euo pipefail

frontend_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
repo_dir="$(cd "$frontend_dir/.." && pwd)"
e2e_target="${E2E_TARGET:-local}"
if [[ "$e2e_target" != "local" && "$e2e_target" != "deployed" ]]; then
  echo "E2E_TARGET must be 'local' or 'deployed'." >&2
  exit 1
fi
runtime_dir="$frontend_dir/e2e/.runtime"
fixture_dir="$frontend_dir/e2e/.fixture"
mkdir -p "$runtime_dir" "$fixture_dir"
postgres_container="" backend_pid="" frontend_pid=""

cleanup() {
  [[ -z "$frontend_pid" ]] || kill "$frontend_pid" 2>/dev/null || true
  [[ -z "$backend_pid" ]] || kill "$backend_pid" 2>/dev/null || true
  [[ -z "$postgres_container" ]] || docker rm -f "$postgres_container" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

if [[ "$e2e_target" == "local" && -z "${E2E_DATABASE_URL:-}" ]]; then
  command -v docker >/dev/null 2>&1 || { echo "Docker is required locally, or set E2E_DATABASE_URL to an ephemeral PostgreSQL database." >&2; exit 1; }
  postgres_container="aaasobo-e2e-${RANDOM}-$$"
  docker run --rm -d --name "$postgres_container" -e POSTGRES_PASSWORD=summer -e POSTGRES_DB=aaasobo_e2e -p 127.0.0.1::5432 postgres:16-alpine >/dev/null
  postgres_port="$(docker inspect -f '{{(index (index .NetworkSettings.Ports "5432/tcp") 0).HostPort}}' "$postgres_container")"
  export E2E_DATABASE_URL="postgresql://postgres:summer@127.0.0.1:${postgres_port}/aaasobo_e2e?schema=public"
  for _ in $(seq 1 30); do docker exec "$postgres_container" pg_isready -U postgres >/dev/null 2>&1 && break; sleep 1; done
fi

if [[ "$e2e_target" == "deployed" ]]; then
  : "${E2E_BASE_URL:?E2E_BASE_URL is required for E2E_TARGET=deployed}"
  : "${E2E_ADMIN_EMAIL:?E2E_ADMIN_EMAIL is required for E2E_TARGET=deployed}"
  : "${E2E_ADMIN_PASSWORD:?E2E_ADMIN_PASSWORD is required for E2E_TARGET=deployed}"
else
  export E2E_BASE_URL="${E2E_BASE_URL:-http://127.0.0.1:3000}"
  export POSTGRES_PRISMA_URL="$E2E_DATABASE_URL" DATABASE_URL="$E2E_DATABASE_URL"
  export FRONTEND_ORIGIN="$E2E_BASE_URL" NEXT_PUBLIC_FRONTEND_ORIGIN="$E2E_BASE_URL"
  export BACKEND_ORIGIN="http://127.0.0.1:4000" NEXT_PUBLIC_BACKEND_ORIGIN="http://127.0.0.1:4000"
  export AUTH_SECRET="${AUTH_SECRET:-e2e-only-auth-secret-at-least-32-bytes}" AUTH_SALT="${AUTH_SALT:-next-auth.session-token}"
  export AUTH_TRUST_HOST=true
  export E2E_ADMIN_EMAIL="${E2E_ADMIN_EMAIL:-e2e-admin@example.com}"
  export E2E_ADMIN_PASSWORD="${E2E_ADMIN_PASSWORD:-E2e-Admin-Password!}"
  export BOOTSTRAP_ADMIN_EMAIL="$E2E_ADMIN_EMAIL" BOOTSTRAP_ADMIN_PASSWORD="$E2E_ADMIN_PASSWORD" BOOTSTRAP_ADMIN_NAME="E2E Admin"
  export RESEND_API_KEY="re_test_dummy" PORT=4000
fi

today_jst="$(TZ=Asia/Tokyo date +%F)"
from_jst="$(TZ=Asia/Tokyo date -d "$today_jst - 3 months" +%F)"
to_jst="$(TZ=Asia/Tokyo date -d "$today_jst + 7 months" +%F)"
export E2E_FIXTURE_ZIP="$fixture_dir/normalized-import-${from_jst}_to_${to_jst}.zip"
rm -rf "$fixture_dir"/*
(cd "$repo_dir/backend" && npm run fixture:generate:normalized-import -- --from "$from_jst" --completed-until "$today_jst" --to "$to_jst" --instructors 10 --out-dir "$fixture_dir")

if [[ "$e2e_target" == "local" ]]; then
  (cd "$repo_dir/backend" && npx prisma generate && npx prisma migrate deploy && npm run db:bootstrap)
  (cd "$repo_dir/backend" && exec node -r ts-node/register ./api/app.ts >"$runtime_dir/backend.log" 2>&1) &
  backend_pid=$!
  for _ in $(seq 1 60); do curl -fsS http://127.0.0.1:4000/openapi.json >/dev/null 2>&1 && break; kill -0 "$backend_pid" 2>/dev/null || { cat "$runtime_dir/backend.log"; exit 1; }; sleep 1; done
  (cd "$frontend_dir" && npm run build >"$runtime_dir/frontend-build.log" 2>&1)
  (cd "$frontend_dir" && exec node ./node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3000 >"$runtime_dir/frontend.log" 2>&1) &
  frontend_pid=$!
  for _ in $(seq 1 120); do curl -fsS "$E2E_BASE_URL/admins/login" >/dev/null 2>&1 && break; kill -0 "$frontend_pid" 2>/dev/null || { cat "$runtime_dir"/*.log 2>/dev/null; exit 1; }; sleep 1; done
fi

cd "$frontend_dir"
npx playwright install chromium
npx playwright test "$@"
