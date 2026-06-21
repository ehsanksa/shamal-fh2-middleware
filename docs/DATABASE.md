# PostgreSQL — why and how

## Do you need it?

| Data | Where it comes from |
|------|---------------------|
| Fleet, tasks, telemetry, media | **DJI FlightHub 2** (live API) — works without Postgres |
| **Alerts / events** (`GET /v1/marafiq/events`, webhooks) | **PostgreSQL** (or temporary in-memory if DB is off) |

Without Postgres, the app still runs. You will see:

```text
[db] PostgreSQL unavailable — using in-memory event store for demo
```

That means alerts are kept **only until you restart the server**. For Marafiq to see a **history of alerts**, use Postgres.

## Local setup (Mac, Homebrew)

Port **5432** is often already used by another Postgres app. This project uses **5433** for Homebrew.

```bash
brew install postgresql@16
brew services start postgresql@16
chmod +x scripts/setup-db.sh
./scripts/setup-db.sh
```

In `.env`:

```env
DATABASE_URL=postgres://shamal:shamal@localhost:5433/shamal_middleware
```

Restart the API:

```bash
npm run dev
```

You should **not** see the PostgreSQL warning.

## Docker (if Docker Desktop is installed)

```bash
docker compose up postgres -d
npm run db:migrate
```

Use `DATABASE_URL=postgres://shamal:shamal@localhost:5432/shamal_middleware` when only the Docker Postgres container is on 5432.

## Verify

```bash
curl -s -H "X-Api-Key: demo-marafiq-key-change-me" http://localhost:8080/v1/marafiq/events | jq .
```

After `POST /webhooks/fh2`, events should still appear after an API restart if Postgres is enabled.
