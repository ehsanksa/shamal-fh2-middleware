# Read-only API test report — Shamal FH2 Middleware

Generated: 2026-06-21T12:35:25.317Z
Session: `test-results/session-2026-06-21T10-59-28Z`
Runs: 12
Duration: 2026-06-21T10:59:28.892Z → 2026-06-21T12:31:32.934Z

## Environment

- Base URL: http://localhost:8080
- FH2 mode: live
- FH2 live ready: true
- Devices discovered: 2 (1 drones, 1 docks)
- Online / offline (last run): 1 / 1
- Tasks in range: 0

## Executive summary

Some endpoints failed at least once. See tables below.



## API test matrix

| Test | Pass runs | Fail runs | Last note / error |
|------|-----------|-----------|-------------------|
| capabilities | 12/12 | 0/12 | PASS: — |
| device-detail | 4/12 | 8/12 | FLAKY: — |
| devices-list | 12/12 | 0/12 | PASS: 2 devices |
| dock-detail | 0/12 | 12/12 | FAIL: HTTP 500 |
| docks-list | 12/12 | 0/12 | PASS: 1 docks |
| events-list | 12/12 | 0/12 | PASS: — |
| fleet-summary | 12/12 | 0/12 | PASS: — |
| health | 12/12 | 0/12 | PASS: — |
| live-stream-info | 4/12 | 8/12 | FLAKY: — |
| mapping-models | 12/12 | 0/12 | PASS: no models |
| openapi-yaml | 12/12 | 0/12 | PASS: — |
| ops-catalog | 12/12 | 0/12 | PASS: — |
| ops-log | 12/12 | 0/12 | PASS: — |
| ops-readiness | 4/12 | 8/12 | FLAKY: online=false commandReady=false |
| tasks-list | 0/12 | 12/12 | FAIL: no tasks in range |
| telemetry-latest | 4/12 | 8/12 | FLAKY: telemetry present |

## Flaky tests

- **device-detail**: 4 pass, 8 fail
- **telemetry-latest**: 4 pass, 8 fail
- **live-stream-info**: 4 pass, 8 fail
- **ops-readiness**: 4 pass, 8 fail

## Consistently failing

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

## Browser checks

| Time | URL | Result | Note |
|------|-----|--------|------|
| 2026-06-21T11:00:18.946Z | https://fh.dji.com/login | OK | FH2 login page ready — user to complete SSO |
| 2026-06-21T11:00:19.406Z | http://localhost:8080/docs | OK | Swagger UI loaded |
| 2026-06-21T11:00:19.886Z | http://localhost:8080/ | OK | Shamal Platform login page loaded |
| 2026-06-21T11:00:59.622Z | http://localhost:8080/ (fleet tab) | OK | 2 devices listed, 0 online — Matrice 4TD + DJI Dock 3 |
| 2026-06-21T11:01:00.123Z | http://localhost:8080/ (viewer login) | OK | marafiq1 viewer session — read-only ops disabled |
| 2026-06-21T11:01:24.013Z | http://localhost:8080/ (missions tab) | FAIL | Load Tasks — FH2 403 (devices offline / org token scope) |
| 2026-06-21T11:06:26.786Z | https://fh.dji.com (org project list) | OK | Logged in as s.ehsan@shamal.sa — Shamal org, Marafiq Kaust Test project visible |

## Device serials (last run)

- `8UUXN6300A09XS`
- `1581F8HGX254W00A0CHR`

## Recommendations

- Task endpoints may need a wider date range or completed flights in FH2.
- Share this report with Marafiq integrators; read-only contract is validated.