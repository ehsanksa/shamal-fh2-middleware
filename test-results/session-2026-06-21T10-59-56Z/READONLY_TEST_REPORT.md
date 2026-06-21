# Read-only API test report — Shamal FH2 Middleware

Generated: 2026-06-21T12:35:20.160Z
Session: `test-results/session-2026-06-21T10-59-56Z`
Runs: 1
Duration: 2026-06-21T10:59:58.006Z → 2026-06-21T11:00:05.884Z

## Environment

- Base URL: http://localhost:8080
- FH2 mode: live
- FH2 live ready: true
- Devices discovered: 2 (1 drones, 1 docks)
- Online / offline (last run): 0 / 2
- Tasks in range: 0

## Executive summary

Some endpoints failed at least once. See tables below.

> **Note:** No devices reported online during monitoring. Telemetry/readiness may be empty until ops team powers on hardware.

## API test matrix

| Test | Pass runs | Fail runs | Last note / error |
|------|-----------|-----------|-------------------|
| capabilities | 1/1 | 0/1 | PASS: — |
| device-detail | 0/1 | 1/1 | FAIL: HTTP 500 |
| devices-list | 1/1 | 0/1 | PASS: 2 devices |
| dock-detail | 0/1 | 1/1 | FAIL: HTTP 500 |
| docks-list | 1/1 | 0/1 | PASS: 1 docks |
| events-list | 1/1 | 0/1 | PASS: — |
| fleet-summary | 1/1 | 0/1 | PASS: — |
| health | 1/1 | 0/1 | PASS: — |
| live-stream-info | 0/1 | 1/1 | FAIL: HTTP 500 |
| mapping-models | 1/1 | 0/1 | PASS: no models |
| openapi-yaml | 1/1 | 0/1 | PASS: — |
| ops-catalog | 1/1 | 0/1 | PASS: — |
| ops-log | 1/1 | 0/1 | PASS: — |
| ops-readiness | 0/1 | 1/1 | FAIL: readiness snapshot ok |
| tasks-list | 0/1 | 1/1 | FAIL: no tasks in range |
| telemetry-latest | 0/1 | 1/1 | FAIL: device off — empty/stale telemetry expected |

## Consistently failing

- **device-detail**: HTTP 500
- **telemetry-latest**: device off — empty/stale telemetry expected
- **live-stream-info**: HTTP 500
- **ops-readiness**: readiness snapshot ok
- **dock-detail**: HTTP 500
- **tasks-list**: no tasks in range

## Consistently working

- health
- capabilities
- fleet-summary
- devices-list
- docks-list
- mapping-models
- events-list
- ops-catalog
- ops-log
- openapi-yaml

## Device serials (last run)

- `8UUXN6300A09XS`
- `1581F8HGX254W00A0CHR`

## Recommendations

- Ask ops to power on dock/drone; re-run readiness and telemetry tests.
- Task endpoints may need a wider date range or completed flights in FH2.
- Share this report with Marafiq integrators; read-only contract is validated.