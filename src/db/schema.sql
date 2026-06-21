CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,
  source VARCHAR(32) NOT NULL DEFAULT 'fh2',
  event_type VARCHAR(64) NOT NULL,
  payload JSONB NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_received_at
  ON webhook_events (received_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type
  ON webhook_events (event_type);
