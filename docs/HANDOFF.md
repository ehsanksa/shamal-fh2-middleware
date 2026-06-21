# Handoff package — Marafiq CAFM integrators

Shamal owns the drones and DJI FlightHub 2 account. Marafiq’s CAFM consumes **Shamal’s** operational records via this middleware (read-only). The `/v1/marafiq/*` routes are named for the integrator audience, not device ownership.

## Deliverables

| Item | Location |
|------|----------|
| REST API (running) | `docker compose up` → port 8080 |
| OpenAPI spec | `/openapi.yaml` or `openapi/shamal-marafiq-v1.yaml` |
| Swagger UI | `http://localhost:8080/docs` |
| Postman collection | `postman/Shamal-Marafiq-Middleware.postman_collection.json` |
| FH2 credential setup | `docs/FH2_SETUP.md` |
| Security brief | `docs/CYBERSECURITY.md` |
| Demo script | `docs/DEMO_SCRIPT.md` |

## Marafiq-facing endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/v1/marafiq/devices` | Fleet list |
| GET | `/v1/marafiq/devices/{sn}` | Device + HMS |
| GET | `/v1/marafiq/devices/{sn}/telemetry/latest` | Position/battery snapshot |
| GET | `/v1/marafiq/tasks` | Inspection jobs |
| GET | `/v1/marafiq/tasks/{id}` | Task detail |
| GET | `/v1/marafiq/tasks/{id}/media` | Photos/videos |
| GET | `/v1/marafiq/tasks/{id}/trajectory` | Flight path |
| GET | `/v1/marafiq/events` | Alert feed |

### Phase 2 (added)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/v1/marafiq/capabilities` | Feature list |
| GET | `/v1/marafiq/fleet/summary` | Fleet dashboard |
| GET | `/v1/marafiq/docks` | Dock list |
| GET | `/v1/marafiq/docks/{sn}` | Dock detail |
| GET | `/v1/marafiq/devices/{sn}/live-stream` | Live video info |
| GET | `/v1/marafiq/devices/{sn}/telemetry/stream` | SSE telemetry |
| GET | `/v1/marafiq/mapping/models` | Mapping jobs |
| GET | `/v1/marafiq/mapping/models/{id}` | Model detail |
| GET | `/v1/marafiq/tasks/{id}/trajectory.geojson` | GeoJSON path |
| GET | `/v1/marafiq/tasks/{id}/trajectory.kml` | KML path |

See [PHASE2.md](PHASE2.md).

Auth header: `X-Api-Key: <issued-by-shamal>`

## FlightHub 2 APIs wrapped (internal)

- Organization & Project
- Device Management / State / HMS
- Task Management (list, detail, media, trajectory)
- Webhook ingestion

## Go-live checklist

- [ ] FlightHub Sync enabled; `FH2_MODE=live`
- [ ] Production TLS + domain
- [ ] Marafiq API keys issued
- [ ] IP allowlist (if required)
- [ ] FH2 webhooks → `https://<shamal-host>/webhooks/fh2`
- [ ] Marafiq technical contact for integration testing

## Support

Shamal Technologies — authorized DJI dealer. Integration questions: Shamal engineering lead.
