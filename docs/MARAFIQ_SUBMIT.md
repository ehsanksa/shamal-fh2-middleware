# Shamal Drone API — Marafiq integration (copy & paste)

**From:** Shamal Technologies  
**To:** Marafiq CAFM integration team  
**Phase:** 1 — read-only

## Who owns what

| Party | Role |
|-------|------|
| **Shamal** | Owns drones, docks, and DJI FlightHub 2 account. Operates flights and inspections. |
| **DJI FlightHub 2** | Source system for fleet, missions, media, and alerts. |
| **Shamal Middleware** | Reads Shamal’s FlightHub 2 data and exposes a simple REST API. |
| **Marafiq CAFM** | Displays **Shamal’s** operational records inside their platform (read-only). |

The `/v1/marafiq/*` path name means “API for Marafiq integrators” — **not** “Marafiq-owned devices.”

---

## 1) Connection values (give Marafiq these)

```
API Name:        Shamal FlightHub Middleware (Shamal fleet data for CAFM)

Data owner:      Shamal Technologies (drones & docks operated via DJI FlightHub 2)
Data shown:      Shamal fleet, flight tasks, inspection media, telemetry, events

Base URL:        http://localhost:8080
                 (Production: replace with https://YOUR-SHAMAL-SERVER.com)

Swagger UI:      http://localhost:8080/docs
OpenAPI file:    http://localhost:8080/openapi.yaml

API Key:         demo-marafiq-key-change-me
Auth header:     X-Api-Key
Auth value:      demo-marafiq-key-change-me

Example Shamal drone SN:  1581F8HGX254W00A0CHR   (Matrice 4TD)
Example Shamal dock SN:   8UUXN6300A09XS         (DJI Dock 3)
FlightHub project:        madden RAK
```

> **Note for Shamal:** Before sending to Marafiq, change the API key in `.env` (`MARAFIQ_API_KEYS`) and update the key above. Never send DJI / FlightHub keys to Marafiq.

---

## 2) Email text (copy & paste to Marafiq)

```
Subject: Shamal Drone Operations API — display FlightHub records in Marafiq CAFM

Dear Marafiq team,

Shamal Technologies operates our own drone fleet using DJI FlightHub 2. We are
providing a read-only API so your CAFM platform can display our operational
records (fleet status, inspections, media, telemetry, and alerts) — without
Marafiq needing DJI accounts or credentials.

Ownership:
  • Drones, docks, and FlightHub data: Shamal Technologies
  • CAFM display / integration: Marafiq
  • DJI FlightHub login & API keys: Shamal only (not shared)

Connection:
  Base URL:      http://localhost:8080
                 (Production HTTPS URL will be shared before go-live.)
  Documentation: http://localhost:8080/docs
  OpenAPI spec:  http://localhost:8080/openapi.yaml

Authentication:
  Header:  X-Api-Key
  Value:   demo-marafiq-key-change-me

Endpoints (GET, read-only — Shamal FlightHub data):
  /health
  /v1/marafiq/devices                              → Shamal fleet list
  /v1/marafiq/devices/{serialNumber}               → Shamal device detail
  /v1/marafiq/devices/{serialNumber}/telemetry/latest
  /v1/marafiq/tasks                                → Shamal flight / inspection jobs
  /v1/marafiq/tasks/{taskId}
  /v1/marafiq/tasks/{taskId}/media
  /v1/marafiq/tasks/{taskId}/trajectory
  /v1/marafiq/events                               → Shamal alerts / events

Attached: OpenAPI YAML, Postman collection.

Regards,
Shamal Technologies
Authorized DJI dealer — FlightHub 2 operations
```

---

## 3) All API URLs (copy one line = one API)

Replace `{BASE}` with `http://localhost:8080`  
Replace `{KEY}` with `demo-marafiq-key-change-me`  
Replace `{SN}` with a device serial (e.g. `1581F8HGX254W00A0CHR`)  
Replace `{TASK}` with a task UUID from `/v1/marafiq/tasks`

| # | API | Full URL |
|---|-----|----------|
| 1 | Health | `http://localhost:8080/health` |
| 2 | Shamal fleet list | `http://localhost:8080/v1/marafiq/devices` |
| 3 | Shamal device detail | `http://localhost:8080/v1/marafiq/devices/1581F8HGX254W00A0CHR` |
| 4 | Shamal drone telemetry | `http://localhost:8080/v1/marafiq/devices/1581F8HGX254W00A0CHR/telemetry/latest` |
| 5 | Shamal flight / inspection tasks | `http://localhost:8080/v1/marafiq/tasks` |
| 6 | Task detail | `http://localhost:8080/v1/marafiq/tasks/{TASK}` |
| 7 | Task media | `http://localhost:8080/v1/marafiq/tasks/{TASK}/media` |
| 8 | Task trajectory | `http://localhost:8080/v1/marafiq/tasks/{TASK}/trajectory` |
| 9 | Events / alerts | `http://localhost:8080/v1/marafiq/events` |

**Header for rows 2–9:**

```
X-Api-Key: demo-marafiq-key-change-me
```

---

## 4) cURL commands (copy & paste in Terminal)

```bash
BASE="http://localhost:8080"
KEY="demo-marafiq-key-change-me"
SN="1581F8HGX254W00A0CHR"
```

### Health (no key)

```bash
curl -s "$BASE/health"
```

### Devices

```bash
curl -s -H "X-Api-Key: $KEY" "$BASE/v1/marafiq/devices"
```

```bash
curl -s -H "X-Api-Key: $KEY" "$BASE/v1/marafiq/devices/$SN"
```

```bash
curl -s -H "X-Api-Key: $KEY" "$BASE/v1/marafiq/devices/$SN/telemetry/latest"
```

### Tasks (use task id from tasks list when available)

```bash
curl -s -H "X-Api-Key: $KEY" "$BASE/v1/marafiq/tasks"
```

```bash
TASK="PASTE-TASK-UUID-HERE"
curl -s -H "X-Api-Key: $KEY" "$BASE/v1/marafiq/tasks/$TASK"
curl -s -H "X-Api-Key: $KEY" "$BASE/v1/marafiq/tasks/$TASK/media"
curl -s -H "X-Api-Key: $KEY" "$BASE/v1/marafiq/tasks/$TASK/trajectory"
```

### Events

```bash
curl -s -H "X-Api-Key: $KEY" "$BASE/v1/marafiq/events"
```

---

## 5) Swagger (for Marafiq developers)

1. Open: http://localhost:8080/docs  
2. Click **Authorize**  
3. In **Value**, paste exactly:

```
demo-marafiq-key-change-me
```

4. Click **Authorize** → **Close**  
5. Open any `GET /v1/marafiq/...` → **Try it out** → **Execute**

---

## 6) Files to attach when emailing Marafiq

| File | Path in repo |
|------|----------------|
| OpenAPI spec | `openapi/shamal-marafiq-v1.yaml` |
| Postman | `postman/Shamal-Marafiq-Middleware.postman_collection.json` |
| Security brief | `docs/CYBERSECURITY.md` |
| This sheet | `docs/MARAFIQ_SUBMIT.md` |

---

## 7) Do NOT send to Marafiq

- DJI OpenAPI key (`FH2_ORG_TOKEN`)
- FlightHub project UUID (`FH2_PROJECT_UUID`)
- Org ID `WJZ9AG`
- Webhook secret
