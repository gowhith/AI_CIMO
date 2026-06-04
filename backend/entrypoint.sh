#!/bin/sh
set -e

wait_for_postgres() {
  echo "Waiting for postgres..."
  python - <<'PY'
import os, time, sys
import psycopg
url = os.environ.get("DATABASE_URL", "postgresql://cimo:cimo@postgres:5432/cimo").replace("+psycopg", "")
for i in range(60):
    try:
        with psycopg.connect(url, connect_timeout=2):
            print("postgres up")
            sys.exit(0)
    except Exception as e:
        print(f"postgres not ready yet ({e}); retry {i+1}/60")
        time.sleep(1)
sys.exit("postgres never came up")
PY
}

case "$1" in
  api)
    wait_for_postgres
    echo "Running alembic migrations..."
    alembic upgrade head
    if [ "${SEED_ON_STARTUP:-true}" = "true" ]; then
      echo "Seeding demo data..."
      python -m app.seed || true
    fi
    echo "Starting uvicorn..."
    exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers
    ;;
  worker)
    wait_for_postgres
    exec celery -A app.core.celery_app:celery_app worker --loglevel=info --concurrency=2
    ;;
  beat)
    wait_for_postgres
    exec celery -A app.core.celery_app:celery_app beat --loglevel=info
    ;;
  *)
    exec "$@"
    ;;
esac
