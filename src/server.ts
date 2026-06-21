import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import Fastify from "fastify";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "./config.js";
import { registerMarafiqAuth } from "./plugins/auth.js";
import { authRoutes } from "./routes/auth.js";
import { capabilitiesRoutes } from "./routes/capabilities.js";
import { commandCenterRoutes } from "./routes/command-center.js";
import { deviceRoutes } from "./routes/devices.js";
import { dockRoutes } from "./routes/docks.js";
import { eventRoutes } from "./routes/events.js";
import { fleetRoutes } from "./routes/fleet.js";
import { gisRoutes } from "./routes/gis.js";
import { healthRoutes } from "./routes/health.js";
import { mappingRoutes } from "./routes/mapping.js";
import { operationRoutes } from "./routes/operations.js";
import { streamRoutes } from "./routes/streams.js";
import { taskRoutes } from "./routes/tasks.js";
import { telemetrySseRoutes } from "./routes/telemetry-sse.js";
import { webhookRoutes } from "./routes/webhooks.js";

const openapiPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../openapi/shamal-marafiq-v1.yaml",
);

export async function buildServer() {
  const app = Fastify({
    logger: { level: config.LOG_LEVEL },
    requestIdHeader: "x-request-id",
    genReqId: (req) =>
      (req.headers["x-request-id"] as string | undefined) ?? crypto.randomUUID(),
  });

  // Swagger "Try it out" from 127.0.0.1 → localhost (or vice versa) needs CORS in dev.
  await app.register(cors, {
    origin:
      config.NODE_ENV === "development"
        ? [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/]
        : false,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: [
      "X-Api-Key",
      "X-CC-Session",
      "Content-Type",
      "X-Request-Id",
      "Accept",
    ],
  });
  await app.register(rateLimit, {
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_WINDOW_MS,
  });

  const openapiSpec = readFileSync(openapiPath, "utf-8");
  await app.register(swagger, {
    openapi: {
      openapi: "3.1.0",
      info: {
        title: "Shamal Middleware API for Marafiq",
        version: "1.0.0",
        description:
          "Read-only integration layer between Shamal DJI FlightHub 2 operations and Marafiq CAFM. Phase 1: fleet, tasks, media. Phase 2: docks, GIS, live stream info, mapping, SSE telemetry.",
      },
      // Use same-origin by default so Swagger "Try it out" works regardless of
      // opening docs via localhost or 127.0.0.1.
      servers: [{ url: "/", description: "Same origin" }],
      components: {
        securitySchemes: {
          ApiKeyAuth: {
            type: "apiKey",
            in: "header",
            name: "X-Api-Key",
          },
        },
      },
      security: [{ ApiKeyAuth: [] }],
    },
  });
  await app.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: { docExpansion: "list" },
  });

  app.get("/openapi.yaml", async (_req, reply) => {
    reply.type("application/yaml").send(openapiSpec);
  });

  await registerMarafiqAuth(app);

  await app.register(commandCenterRoutes);
  await app.register(authRoutes);
  await app.register(healthRoutes);
  await app.register(capabilitiesRoutes);
  await app.register(deviceRoutes);
  await app.register(dockRoutes);
  await app.register(fleetRoutes);
  await app.register(streamRoutes);
  await app.register(mappingRoutes);
  await app.register(operationRoutes);
  await app.register(gisRoutes);
  await app.register(telemetrySseRoutes);
  await app.register(taskRoutes);
  await app.register(eventRoutes);
  await app.register(webhookRoutes);

  return app;
}
