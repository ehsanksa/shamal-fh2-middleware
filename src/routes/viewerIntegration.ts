import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import {
  getViewerIntegrationPublic,
  resolveApiBaseUrl,
  revealViewerToken,
} from "../services/viewerIntegration.js";
import {
  hasViewerScope,
  scopeForViewerPath,
  type ViewerApiScope,
} from "../services/viewerScopes.js";
import {
  fetchViewerAlertsEvents,
  fetchViewerBatteryStatus,
  fetchViewerCameraStream,
  fetchViewerDockTelemetry,
  fetchViewerDroneTelemetry,
  fetchViewerFleet,
  fetchViewerGpsLocation,
  fetchViewerMediaHistory,
  fetchViewerOnlineStatus,
} from "../services/viewerApiData.js";

function apiBaseFromRequest(request: FastifyRequest): string {
  const host = request.headers.host;
  return resolveApiBaseUrl(host);
}

function requireViewerIntegration(
  request: FastifyRequest,
  reply: FastifyReply,
  requiredScope: ViewerApiScope,
): boolean {
  const ctx = request.viewerIntegration;
  if (!ctx) {
    reply.status(401).send({
      error: "unauthorized",
      message: "Valid viewer integration Bearer token required",
    });
    return false;
  }
  if (!hasViewerScope(ctx.scopes, requiredScope)) {
    reply.status(403).send({
      error: "forbidden",
      message: `Missing required scope: ${requiredScope}`,
      requiredScope,
    });
    return false;
  }
  return true;
}

function scopedHandler(
  path: string,
  handler: () => Promise<unknown>,
) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const scope = scopeForViewerPath(path);
    if (!scope || !requireViewerIntegration(request, reply, scope)) return;
    const payload = await handler();
    return reply.send(payload);
  };
}

export const viewerIntegrationRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/v1/marafiq/viewer/integration",
    {
      schema: {
        summary: "Viewer integration access details (session auth)",
        tags: ["Viewer Integration"],
      },
    },
    async (request, reply) => {
      if (request.ccRole !== "viewer" || !request.ccUsername) {
        return reply.status(403).send({
          error: "forbidden",
          message: "Viewer session required",
        });
      }

      const apiBaseUrl = apiBaseFromRequest(request);
      const info = getViewerIntegrationPublic(request.ccUsername, apiBaseUrl);
      return reply.send({ data: info, meta: { source: "shamal-platform" } });
    },
  );

  app.get(
    "/v1/marafiq/viewer/integration/token",
    {
      schema: {
        summary: "Reveal viewer API key for clipboard copy (session auth)",
        tags: ["Viewer Integration"],
      },
    },
    async (request, reply) => {
      if (request.ccRole !== "viewer" || !request.ccUsername) {
        return reply.status(403).send({
          error: "forbidden",
          message: "Viewer session required",
        });
      }

      const token = revealViewerToken(request.ccUsername);
      if (!token) {
        return reply.status(404).send({
          error: "not_available",
          message:
            "API integration is not enabled or no active token exists for your account.",
        });
      }

      return reply.send({
        data: { apiKey: token },
        meta: { source: "shamal-platform" },
      });
    },
  );

  app.get(
    "/v1/marafiq/viewer/fleet",
    { schema: { summary: "Viewer fleet overview", tags: ["Viewer Integration"] } },
    scopedHandler("/v1/marafiq/viewer/fleet", async () => {
      const fleet = await fetchViewerFleet();
      return { data: fleet, meta: { source: "flighthub2" } };
    }),
  );

  app.get(
    "/v1/marafiq/viewer/drone-telemetry",
    { schema: { summary: "Viewer drone telemetry", tags: ["Viewer Integration"] } },
    scopedHandler("/v1/marafiq/viewer/drone-telemetry", async () => {
      const result = await fetchViewerDroneTelemetry();
      return result;
    }),
  );

  app.get(
    "/v1/marafiq/viewer/dock-telemetry",
    { schema: { summary: "Viewer dock telemetry", tags: ["Viewer Integration"] } },
    scopedHandler("/v1/marafiq/viewer/dock-telemetry", async () => {
      const result = await fetchViewerDockTelemetry();
      return result;
    }),
  );

  app.get(
    "/v1/marafiq/viewer/battery-status",
    { schema: { summary: "Viewer battery status", tags: ["Viewer Integration"] } },
    scopedHandler("/v1/marafiq/viewer/battery-status", async () => {
      const result = await fetchViewerBatteryStatus();
      return result;
    }),
  );

  app.get(
    "/v1/marafiq/viewer/gps-location",
    { schema: { summary: "Viewer GPS locations", tags: ["Viewer Integration"] } },
    scopedHandler("/v1/marafiq/viewer/gps-location", async () => {
      const result = await fetchViewerGpsLocation();
      return result;
    }),
  );

  app.get(
    "/v1/marafiq/viewer/online-status",
    { schema: { summary: "Viewer online/offline status", tags: ["Viewer Integration"] } },
    scopedHandler("/v1/marafiq/viewer/online-status", async () => {
      const result = await fetchViewerOnlineStatus();
      return result;
    }),
  );

  app.get(
    "/v1/marafiq/viewer/camera",
    { schema: { summary: "Viewer dock live camera info", tags: ["Viewer Integration"] } },
    scopedHandler("/v1/marafiq/viewer/camera", async () => {
      const result = await fetchViewerCameraStream("dock");
      return result;
    }),
  );

  app.get(
    "/v1/marafiq/viewer/fpv",
    { schema: { summary: "Viewer drone FPV stream info", tags: ["Viewer Integration"] } },
    scopedHandler("/v1/marafiq/viewer/fpv", async () => {
      const result = await fetchViewerCameraStream("drone");
      return result;
    }),
  );

  app.get(
    "/v1/marafiq/viewer/alerts-events",
    { schema: { summary: "Viewer alerts and events", tags: ["Viewer Integration"] } },
    scopedHandler("/v1/marafiq/viewer/alerts-events", async () => {
      const result = await fetchViewerAlertsEvents();
      return result;
    }),
  );

  app.get(
    "/v1/marafiq/viewer/media-history",
    { schema: { summary: "Viewer mission and media history", tags: ["Viewer Integration"] } },
    scopedHandler("/v1/marafiq/viewer/media-history", async () => {
      const result = await fetchViewerMediaHistory();
      return result;
    }),
  );
};
