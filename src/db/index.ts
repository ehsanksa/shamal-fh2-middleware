import { randomUUID } from "node:crypto";
import pg from "pg";
import { config } from "../config.js";

export interface WebhookEventRow {
  id: string;
  source: string;
  event_type: string;
  payload: Record<string, unknown>;
  received_at: Date;
}

const memoryEvents: WebhookEventRow[] = [];
let useMemory = false;

export const pool = new pg.Pool({ connectionString: config.DATABASE_URL });

pool.on("error", () => {
  useMemory = true;
});

export async function initDatabase(): Promise<void> {
  try {
    const { readFileSync } = await import("node:fs");
    const { dirname, join } = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const schemaPath = join(
      dirname(fileURLToPath(import.meta.url)),
      "schema.sql",
    );
    const sql = readFileSync(schemaPath, "utf-8");
    await pool.query(sql);
    useMemory = false;
  } catch (err) {
    console.warn(
      "[db] PostgreSQL unavailable — using in-memory event store for demo:",
      (err as Error).message,
    );
    useMemory = true;
  }
}

export async function insertWebhookEvent(
  eventType: string,
  payload: Record<string, unknown>,
  source = "fh2",
): Promise<WebhookEventRow> {
  const row: WebhookEventRow = {
    id: randomUUID(),
    source,
    event_type: eventType,
    payload,
    received_at: new Date(),
  };

  if (useMemory) {
    memoryEvents.unshift(row);
    return row;
  }

  try {
    const result = await pool.query<WebhookEventRow>(
      `INSERT INTO webhook_events (id, source, event_type, payload)
       VALUES ($1, $2, $3, $4)
       RETURNING id, source, event_type, payload, received_at`,
      [row.id, source, eventType, payload],
    );
    return result.rows[0]!;
  } catch {
    useMemory = true;
    memoryEvents.unshift(row);
    return row;
  }
}

export async function listWebhookEvents(
  since?: string,
  limit = 50,
): Promise<WebhookEventRow[]> {
  if (useMemory) {
    let rows = [...memoryEvents];
    if (since) {
      const sinceDate = new Date(since);
      rows = rows.filter((r) => r.received_at > sinceDate);
    }
    return rows.slice(0, limit);
  }

  try {
    if (since) {
      const result = await pool.query<WebhookEventRow>(
        `SELECT id, source, event_type, payload, received_at
         FROM webhook_events
         WHERE received_at > $1::timestamptz
         ORDER BY received_at DESC
         LIMIT $2`,
        [since, limit],
      );
      return result.rows;
    }

    const result = await pool.query<WebhookEventRow>(
      `SELECT id, source, event_type, payload, received_at
       FROM webhook_events
       ORDER BY received_at DESC
       LIMIT $1`,
      [limit],
    );
    return result.rows;
  } catch {
    useMemory = true;
    return listWebhookEvents(since, limit);
  }
}

export function mapFh2PayloadToEventType(payload: Record<string, unknown>): string {
  const raw =
    (payload.event_type as string | undefined) ??
    (payload.type as string | undefined) ??
    (payload.event as string | undefined);

  if (!raw) {
    if (payload.task_uuid && payload.status === "success") return "mission_completed";
    if (payload.task_uuid) return "mission_updated";
    if (payload.device_sn) return "device_event";
    return "unknown";
  }

  const normalized = raw.toLowerCase().replace(/\s+/g, "_");
  const mapping: Record<string, string> = {
    task_success: "mission_completed",
    flight_task_success: "mission_completed",
    media_ready: "media_ready",
    media_upload_finished: "media_ready",
    device_offline: "device_offline",
    device_online: "device_online",
    battery_low: "battery_low",
    mission_failed: "mission_failed",
  };
  return mapping[normalized] ?? normalized;
}
