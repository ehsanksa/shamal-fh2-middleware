# Shamal FH2 Middleware (Marafiq demo)

Read-only integration middleware between **DJI FlightHub 2 OpenAPI V1.0** and **Marafiq CAFM** integrators.

## Quick start

```bash
cp .env.example .env
docker compose up --build
```

- API: http://localhost:8080
- Swagger: http://localhost:8080/docs
- Default Marafiq API key: `demo-marafiq-key-change-me` (set in `.env`)

## Local development (without Docker)

```bash
npm install
./scripts/setup-db.sh   # optional — persists alerts/events (see docs/DATABASE.md)
npm run dev
```

## Modes

| `FH2_MODE` | Behavior |
|------------|----------|
| `mock` | Fixture data (default) |
| `live` | Calls FlightHub 2 when `FH2_ORG_TOKEN` + `FH2_PROJECT_UUID` are set |

See [docs/FH2_SETUP.md](docs/FH2_SETUP.md) for Organization Key setup.

## Demo

```bash
chmod +x scripts/demo.sh
./scripts/demo.sh
npm run seed:demo-event   # optional: populate events table
```

## Documentation

- [PHASE2.md](docs/PHASE2.md) — Phase 2 endpoints (GIS, docks, streams, mapping)
- [MARAFIQ_API_MATRIX.md](docs/MARAFIQ_API_MATRIX.md)
- [FH2_SETUP.md](docs/FH2_SETUP.md)
- [CYBERSECURITY.md](docs/CYBERSECURITY.md)
- [DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md)
- [HANDOFF.md](docs/HANDOFF.md)
- Postman: `postman/Shamal-Marafiq-Middleware.postman_collection.json`

## License

Proprietary — Shamal Technologies.
