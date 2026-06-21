# Phase 2 — Marafiq CAFM extensions

Phase 2 builds on Phase 1 (read-only fleet, tasks, media, events).

## New endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /v1/marafiq/capabilities` | Lists phase 1 + 2 features |
| `GET /v1/marafiq/fleet/summary` | Dashboard counts (drones, docks, online) |
| `GET /v1/marafiq/docks` | Dock list only |
| `GET /v1/marafiq/docks/{sn}` | Dock detail + linked drone |
| `GET /v1/marafiq/devices/{sn}/live-stream` | Live video capacity (RTMP/WebRTC readiness) |
| `GET /v1/marafiq/devices/{sn}/telemetry/stream` | SSE telemetry (MQTT-style for CAFM) |
| `GET /v1/marafiq/mapping/models` | 2D/3D reconstruction jobs |
| `GET /v1/marafiq/mapping/models/{id}` | Model detail + download URL |
| `GET /v1/marafiq/tasks/{id}/trajectory.geojson` | GIS import |
| `GET /v1/marafiq/tasks/{id}/trajectory.kml` | GIS import |

## Marafiq event push (optional)

When FlightHub sends webhooks to Shamal, Shamal can **forward** events to Marafiq:

```env
MARAFIQ_EVENT_CALLBACK_URL=https://marafiq-cafm.example.com/api/shamal/events
MARAFIQ_EVENT_CALLBACK_SECRET=shared-secret
```

Flow:

```text
FlightHub 2  →  POST /webhooks/fh2  →  Shamal  →  POST Marafiq callback URL
```

Marafiq can still poll `GET /v1/marafiq/events` if they prefer pull mode.

## Not included (Shamal operations only)

- Remote control (takeoff, gimbal, payload)
- Firmware upgrade commands
- Direct MQTT broker access for Marafiq

## Restart after update

```bash
npm run dev
```

Open Swagger: http://localhost:8080/docs
