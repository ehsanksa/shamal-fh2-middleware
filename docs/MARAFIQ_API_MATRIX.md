# Shamal Middleware ↔ DJI FlightHub 2 ↔ Marafiq CAFM

## How Marafiq gets API keys and values (simple)

Marafiq receives **one connection package from Shamal**. They never get DJI login or FlightHub keys.

| What Marafiq gets from Shamal | Example | Used for |
|------------------------------|---------|----------|
| **Base URL** | `https://api.shamal.com` | All API calls |
| **API key** | `marafiq-ro-26` | Header `X-Api-Key` on every `/v1/marafiq/*` call |
| **Swagger / OpenAPI** | `/docs`, `/openapi.yaml` | Developers build CAFM integration |
| **IDs in responses** | `serialNumber`, task `id` | Copy from list APIs into detail APIs |

**Shamal keeps secret (never send to Marafiq):**

| Shamal only | In `.env` |
|-------------|-----------|
| DJI OpenAPI JWT | `FH2_ORG_TOKEN` |
| FlightHub project | `FH2_PROJECT_UUID` |
| Webhook secret | `WEBHOOK_SECRET` |

**Flow:**

```text
Marafiq CAFM  --X-Api-Key-->  Shamal Middleware  --FH2_ORG_TOKEN-->  DJI FlightHub 2
```

Marafiq developers:

1. Call `GET /v1/marafiq/devices` → copy `serialNumber`
2. Call `GET /v1/marafiq/tasks` → copy `data[].id` (when tasks exist)
3. Poll telemetry/events on a schedule in CAFM

---

## Full API list — status for Marafiq integration

Legend:

- **Live** = available now via Shamal middleware (read-only)
- **Partial** = partly covered by existing endpoints
- **Phase 2** = planned Shamal middleware extension
- **DJI direct** = Shamal backend only; not exposed to Marafiq in phase 1
- **N/A read-only** = command/stream APIs; not suitable for Marafiq read-only CAFM

| DJI / industry API name | Marafiq CAFM use | Shamal middleware today | Shamal endpoint (if any) |
|-------------------------|------------------|-------------------------|-------------------------|
| **Device Management API** | Fleet list | **Live** | `GET /v1/marafiq/devices` |
| **Fleet Management API** | Same as above | **Live** | `GET /v1/marafiq/devices` |
| **Dock Management API** | Dock status in CAFM | **Partial** | Dock appears in `devices`; detail via `GET /v1/marafiq/devices/{sn}` |
| **Device Health API** | Alerts / HMS | **Partial** | `GET /v1/marafiq/devices/{sn}` → `health` |
| **Device Status API** | Online/offline | **Live** | `devices` → `online`; detail in `devices/{sn}` |
| **Aircraft Telemetry API** | Map, battery | **Partial** | `GET /v1/marafiq/devices/{sn}/telemetry/latest` (REST snapshot, poll 10–15s) |
| **Live Flight Status API** | Mission state | **Partial** | `GET /v1/marafiq/tasks`, `tasks/{id}` |
| **MQTT Real-Time Data API** | Live stream | **Phase 2** | `GET /v1/marafiq/devices/{sn}/telemetry/stream` (SSE) |
| **Live Video Streaming API** | Live view in CAFM | **Phase 2** | `GET /v1/marafiq/devices/{sn}/live-stream` |
| **RTMP/WebRTC Stream API** | Video player | **Phase 2** | Same as live-stream (capacity + FH2 session URLs when active) |
| **Flight Mission API** | Inspection jobs | **Live** | `GET /v1/marafiq/tasks` |
| **Flight Task API** | Same | **Live** | `GET /v1/marafiq/tasks`, `tasks/{id}` |
| **Waypoint Mission API** | Route metadata | **Partial** | Task detail / trajectory |
| **Mission Execution API** | Progress | **Partial** | `tasks/{id}` → status, waypoint progress |
| **Flight Record API** | History | **Live** | `GET /v1/marafiq/tasks` (time range query) |
| **Media File API** | Evidence | **Live** | `GET /v1/marafiq/tasks/{id}/media` |
| **Photo & Video Retrieval API** | Attachments | **Live** | `tasks/{id}/media` → `downloadUrl`, `previewUrl` |
| **Cloud Mapping API** | Maps / ortho | **Phase 2** | `GET /v1/marafiq/mapping/models` |
| **2D/3D Reconstruction API** | Digital twin | **Phase 2** | `GET /v1/marafiq/mapping/models/{id}` |
| **Map/GIS Data API** | Layers on map | **Phase 2** | Mapping models + trajectory exports |
| **GeoJSON/KML API** | GIS import | **Live** | `GET /v1/marafiq/tasks/{id}/trajectory.geojson` / `.kml` |
| **Event Notification API** | CAFM alerts | **Live** | `GET /v1/marafiq/events` |
| **Webhook Push API** | Real-time push | **Live** | FH2 → Shamal webhook; optional `MARAFIQ_EVENT_CALLBACK_URL` |
| **Remote Control Command API** | Fly drone | **N/A read-only** | Not for Marafiq; Shamal operators only |
| **Camera/Gimbal Control API** | Control camera | **N/A read-only** | Not for Marafiq |
| **Payload Control API** | Payload | **N/A read-only** | Not for Marafiq |
| **Firmware Upgrade API** | OTA | **DJI direct** | Shamal ops only |
| **User & Organization Management API** | Accounts | **DJI direct** | Shamal admin only |
| **Workspace Management API** | Projects | **DJI direct** | Shamal sets `FH2_PROJECT_UUID` |
| **Storage/File Management API** | Files | **Partial** | Via `tasks/{id}/media` |
| **Data Synchronization API** | Bulk sync | **Partial** | Marafiq polls REST endpoints |

---

## What Marafiq will mostly use (your priority list)

| Marafiq need | Shamal gives them | How |
|--------------|-------------------|-----|
| **Telemetry API** | Latest position/battery snapshot | `GET /v1/marafiq/devices/{sn}/telemetry/latest` |
| **Live Video API** | Live capacity | `GET /v1/marafiq/devices/{sn}/live-stream` |
| **Mission API** | Flight / inspection tasks | `GET /v1/marafiq/tasks`, `tasks/{id}` |
| **Media API** | Photos/videos per task | `GET /v1/marafiq/tasks/{id}/media` |
| **Event/Webhook API** | Alerts | `GET /v1/marafiq/events` + optional callback URL |
| **GIS/Mapping API** | Ortho + paths | `mapping/models`, `trajectory.geojson` |
| **Device Status API** | Fleet online + detail | `GET /v1/marafiq/devices`, `fleet/summary` |
| **Dock API** | Dock operations | `GET /v1/marafiq/docks`, `docks/{sn}` |

---

## Copy-paste: give Marafiq (connection sheet)

```text
Base URL:     https://YOUR-SHAMAL-SERVER.com
Docs:         https://YOUR-SHAMAL-SERVER.com/docs
OpenAPI:      https://YOUR-SHAMAL-SERVER.com/openapi.yaml

Auth header:  X-Api-Key
API key:      marafiq-ro-26          ← you issue this; change per client

Read APIs:
  GET /health
  GET /v1/marafiq/devices
  GET /v1/marafiq/devices/{serialNumber}
  GET /v1/marafiq/devices/{serialNumber}/telemetry/latest
  GET /v1/marafiq/tasks
  GET /v1/marafiq/tasks/{taskId}
  GET /v1/marafiq/tasks/{taskId}/media
  GET /v1/marafiq/tasks/{taskId}/trajectory
  GET /v1/marafiq/events

Where to get IDs:
  serialNumber  → from GET /v1/marafiq/devices → data[].serialNumber
  taskId        → from GET /v1/marafiq/tasks → data[].id

DJI credentials: NOT provided to Marafiq.
```

---

## Phase 1 vs Phase 2 (for manager)

**Phase 1 (built now):** Read-only REST for fleet, telemetry snapshot, tasks, media, trajectory, events.

**Phase 2 (implemented):** Fleet summary, docks, live-stream info, SSE telemetry, mapping models, GeoJSON/KML, optional event callback to Marafiq.

Commands (takeoff, gimbal, firmware) stay **Shamal operations only**, not Marafiq CAFM.
