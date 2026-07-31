#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: aaasobo_pipeline.sh [all|frontend|backend|shared]

Run CI-equivalent local checks for the aaasobo-management-system repo.
The default scope is all. The shared scope includes both consuming applications.
EOF
}

scope="${1:-all}"
case "$scope" in
  all|frontend|backend|shared) ;;
  -h|--help)
    usage
    exit 0
    ;;
  *)
    usage >&2
    exit 2
    ;;
esac

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

run_shared=false
run_frontend=false
run_backend=false

case "$scope" in
  all)
    run_shared=true
    run_frontend=true
    run_backend=true
    ;;
  frontend)
    run_frontend=true
    ;;
  backend)
    run_backend=true
    ;;
  shared)
    run_shared=true
    run_frontend=true
    run_backend=true
    ;;
esac

if [[ "$run_shared" == true ]]; then
  echo "==> shared: format-check"
  (cd shared && npm run format-check)
else
  echo "==> shared: skipped"
fi

if [[ "$run_frontend" == true ]]; then
  echo "==> frontend: format-check"
  (cd frontend && npm run format-check)
  echo "==> frontend: lint -- --max-warnings 0"
  (cd frontend && npm run lint -- --max-warnings 0)
  echo "==> frontend: lint:unused"
  (cd frontend && npm run lint:unused)
  echo "==> frontend: build"
  (cd frontend && npm run build)
else
  echo "==> frontend: skipped"
fi

if [[ "$run_backend" == true ]]; then
  echo "==> backend: format-check"
  (cd backend && npm run format-check)
  echo "==> backend: lint:unused"
  (cd backend && npm run lint:unused)
  echo "==> backend: test (disposable Testcontainers database)"
  (
    cd backend
    npx prisma generate
    TEST_DATABASE_URL='' POSTGRES_PRISMA_URL='' DATABASE_URL='' \
      npx vitest run src/test/api
  )
else
  echo "==> backend: skipped"
fi

echo "Pipeline gate completed."
