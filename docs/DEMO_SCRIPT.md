# 5–7 minute demo script (Marafiq)

**Prerequisites:** Middleware running (`docker compose up` or `npm run dev`). API key: value from `MARAFIQ_API_KEYS`.

```bash
export BASE=http://localhost:8080
export KEY=demo-marafiq-key-change-me
```

## 1. Health (30s)

```bash
curl -s "$BASE/health" | jq .
```

Point out: `fh2Mode: mock` until FlightHub Sync org key is configured.

## 2. Fleet (1 min)

```bash
curl -s -H "X-Api-Key: $KEY" "$BASE/v1/marafiq/devices" | jq .
```

Show normalized drones/docks for CAFM asset linking (phase 2).

## 3. Device + telemetry (1 min)

```bash
SN=1581F6QAD23B00TEST01
curl -s -H "X-Api-Key: $KEY" "$BASE/v1/marafiq/devices/$SN" | jq .
curl -s -H "X-Api-Key: $KEY" "$BASE/v1/marafiq/devices/$SN/telemetry/latest" | jq .
```

Explain: snapshot polling every 10–15s in CAFM; live stream is phase 2 / FH2 UI.

## 4. Inspection tasks (2 min)

```bash
curl -s -H "X-Api-Key: $KEY" "$BASE/v1/marafiq/tasks" | jq .
TASK=0bbc74b4-5e5a-4390-9256-8e4ee08a241b
curl -s -H "X-Api-Key: $KEY" "$BASE/v1/marafiq/tasks/$TASK" | jq .
curl -s -H "X-Api-Key: $KEY" "$BASE/v1/marafiq/tasks/$TASK/media" | jq .
curl -s -H "X-Api-Key: $KEY" "$BASE/v1/marafiq/tasks/$TASK/trajectory" | jq .
```

## 5. Events / alerts (1 min)

```bash
npm run seed:demo-event
curl -s -H "X-Api-Key: $KEY" "$BASE/v1/marafiq/events" | jq .
```

## 6. Swagger (30s)

Open `http://localhost:8080/docs` — contract for Marafiq developers without CAFM code.

## Talking points

- Shamal normalizes FlightHub 2; Marafiq never holds DJI keys.
- Phase 1: read-only operational data.
- Phase 2: work orders, asset mapping, AI defects (Shamal-built, not DJI).
