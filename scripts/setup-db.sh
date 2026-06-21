#!/usr/bin/env bash
# Local PostgreSQL for webhook events / alerts (optional but recommended)
set -euo pipefail

PG_PORT="${PG_PORT:-5433}"
export PATH="/opt/homebrew/opt/postgresql@16/bin:${PATH:-}"

echo "==> Checking PostgreSQL on port $PG_PORT..."
if ! pg_isready -h 127.0.0.1 -p "$PG_PORT" >/dev/null 2>&1; then
  echo "PostgreSQL not running. Start it with:"
  echo "  brew services start postgresql@16"
  echo ""
  echo "If port 5432 is already in use on your Mac, Homebrew Postgres uses 5433."
  echo "See docs/DATABASE.md"
  exit 1
fi

echo "==> Creating user/database (if missing)..."
psql -h 127.0.0.1 -p "$PG_PORT" -d postgres -v ON_ERROR_STOP=1 <<'SQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'shamal') THEN
    CREATE USER shamal WITH PASSWORD 'shamal' CREATEDB;
  END IF;
END
$$;
SELECT 'CREATE DATABASE shamal_middleware OWNER shamal'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'shamal_middleware')\gexec
SQL

echo "==> Running migrations..."
cd "$(dirname "$0")/.."
export DATABASE_URL="postgres://shamal:shamal@127.0.0.1:${PG_PORT}/shamal_middleware"
npm run db:migrate

echo ""
echo "Done. Set in .env:"
echo "  DATABASE_URL=postgres://shamal:shamal@localhost:${PG_PORT}/shamal_middleware"
echo "Then restart: npm run dev"
