import { buildServer } from "./server.js";
import { config } from "./config.js";
import { initDatabase, insertWebhookEvent, listWebhookEvents } from "./db/index.js";
import { seedTelemetryFromEvents } from "./services/telemetryStore.js";

async function main() {
  await initDatabase();
  const seeded = await seedTelemetryFromEvents();
  if (seeded > 0) {
    console.info(`[telemetry] Seeded ${seeded} cached snapshot(s) from event history`);
  }

  if (config.FH2_MODE === "mock") {
    const existing = await listWebhookEvents(undefined, 1);
    if (existing.length === 0) {
      await insertWebhookEvent("mission_completed", {
        task_uuid: "0bbc74b4-5e5a-4390-9256-8e4ee08a241b",
        status: "success",
        name: "Facility Perimeter Inspection",
        message: "Auto-seeded demo event (mock mode)",
      });
    }
  }
  const app = await buildServer();
  await app.listen({ port: config.PORT, host: "0.0.0.0" });
  app.log.info(
    {
      port: config.PORT,
      fh2Mode: config.FH2_MODE,
      fh2LiveReady: config.fh2LiveReady,
      docs: `http://localhost:${config.PORT}/docs`,
    },
    "Shamal FH2 middleware started",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
