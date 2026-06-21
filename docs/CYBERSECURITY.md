# Cybersecurity brief — Shamal Middleware for Marafiq

## Architecture

- Marafiq CAFM → **Shamal Middleware** (HTTPS) → DJI FlightHub 2 OpenAPI
- DJI organization key stays on Shamal infrastructure only.

## Transport

- TLS 1.2+ required in production.
- No plain HTTP except local development.

## Authentication

| Actor | Credential | Scope |
|-------|------------|-------|
| Marafiq integrators | `X-Api-Key` (rotatable per client) | Shamal `/v1/marafiq/*` only |
| Shamal backend | `FH2_ORG_TOKEN` + `FH2_PROJECT_UUID` | FlightHub 2 OpenAPI |
| FH2 webhooks | HMAC `X-Webhook-Signature` | `POST /webhooks/fh2` only |

Optional: `MARAFIQ_IP_ALLOWLIST` for source IP restriction.

## Data handling

- Media URLs from DJI are **time-limited signed links**; middleware returns metadata and URLs, not permanent storage of imagery unless agreed separately.
- Webhook payloads stored in PostgreSQL for audit and `GET /events` (retention policy: configure per contract, default 90 days recommended).

## Access control

- Read-only Marafiq API surface in phase 1 (no mission control, no device commands).
- Rate limiting: 100 requests/minute per instance (configurable).

## Audit

- Request IDs propagated via `X-Request-Id`.
- Application logs include correlation ID, route, status (no FH2 tokens in logs).

## Residency

- Week-1 demo: Shamal-hosted VPS recommended (fastest).
- Production: align host region with Marafiq KSA data requirements before go-live.

## Incident response

- Rotate `MARAFIQ_API_KEYS` and `FH2_ORG_TOKEN` independently.
- Disable Marafiq keys without affecting Shamal FH2 operations.
