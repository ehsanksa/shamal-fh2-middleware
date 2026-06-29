import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { readCcCredentialEnv } from "../config.js";
import {
  getCcUsers,
  getEnvViewerUsernames,
  hasMinRole,
} from "../services/commandCenterAuth.js";
import {
  deleteViewerDashboardPermissions,
  getViewerDashboardPermissions,
  mergeViewerPermissions,
  updateViewerDashboardPermissions,
} from "../services/viewerDashboardPermissions.js";
import {
  deleteViewerIntegration,
  generateViewerIntegrationToken,
  getAdminIntegrationView,
  regenerateViewerIntegrationToken,
  resolveApiBaseUrl,
  revokeViewerIntegrationToken,
  setViewerIntegrationEnabled,
} from "../services/viewerIntegration.js";
import {
  createManagedViewer,
  createViewerSchema,
  deleteManagedViewer,
  isManagedViewer,
} from "../services/viewerUsers.js";

const integrationPatchSchema = z.object({
  enabled: z.boolean(),
});

const patchSchema = z.object({
  fleetOverview: z.boolean().optional(),
  droneTelemetry: z.boolean().optional(),
  dockTelemetry: z.boolean().optional(),
  batteryStatus: z.boolean().optional(),
  gpsLocation: z.boolean().optional(),
  onlineOffline: z.boolean().optional(),
  liveCamera: z.boolean().optional(),
  droneFpv: z.boolean().optional(),
  alertsEvents: z.boolean().optional(),
  missionMediaHistory: z.boolean().optional(),
  refreshButton: z.boolean().optional(),
  getApiButtons: z.boolean().optional(),
});

function requireAdmin(
  role: string | undefined,
): { ok: true } | { ok: false; message: string } {
  if (!role || !hasMinRole(role as "viewer" | "operator" | "admin", "admin")) {
    return {
      ok: false,
      message: "Admin role required for this endpoint.",
    };
  }
  return { ok: true };
}

function listViewerAccounts() {
  const envNames = getEnvViewerUsernames();
  return getCcUsers()
    .filter((u) => u.role === "viewer")
    .map((u) => ({
      viewerId: u.username,
      displayName: u.displayName,
      source: isManagedViewer(u.username)
        ? ("admin" as const)
        : envNames.has(u.username)
          ? ("env" as const)
          : ("admin" as const),
      deletable: isManagedViewer(u.username),
      permissions: getViewerDashboardPermissions(u.username),
    }));
}

export const adminRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/v1/marafiq/admin/viewers",
    {
      schema: {
        summary: "List viewer accounts and their dashboard permissions (admin only)",
        tags: ["Admin"],
      },
    },
    async (request, reply) => {
      const gate = requireAdmin(request.ccRole);
      if (!gate.ok) {
        return reply.status(403).send({ error: "forbidden", message: gate.message });
      }

      return reply.send({
        data: listViewerAccounts(),
        meta: { source: "shamal-platform" },
      });
    },
  );

  app.post(
    "/v1/marafiq/admin/viewers",
    {
      schema: {
        summary: "Create a viewer account (admin only)",
        tags: ["Admin"],
      },
    },
    async (request, reply) => {
      const gate = requireAdmin(request.ccRole);
      if (!gate.ok) {
        return reply.status(403).send({ error: "forbidden", message: gate.message });
      }

      const parsed = createViewerSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "validation_error",
          details: parsed.error.flatten(),
        });
      }

      const apiKeys = readCcCredentialEnv().marafiqApiKeys;
      const apiKey = parsed.data.apiKey?.trim() || apiKeys[0];
      if (!apiKey || !apiKeys.includes(apiKey)) {
        return reply.status(400).send({
          error: "validation_error",
          message: `apiKey must be one of the configured MARAFIQ_API_KEYS values`,
        });
      }

      const taken = getCcUsers().some((u) => u.username === parsed.data.username);
      if (taken) {
        return reply.status(409).send({
          error: "conflict",
          message: `Username "${parsed.data.username}" is already in use`,
        });
      }

      try {
        const record = createManagedViewer({
          ...parsed.data,
          apiKey,
        });
        return reply.status(201).send({
          data: {
            viewerId: record.username,
            displayName: record.displayName,
            source: "admin" as const,
            deletable: true,
            permissions: mergeViewerPermissions(null),
          },
          meta: { source: "shamal-platform" },
        });
      } catch (err) {
        return reply.status(400).send({
          error: "validation_error",
          message: (err as Error).message,
        });
      }
    },
  );

  app.delete(
    "/v1/marafiq/admin/viewers/:viewerId",
    {
      schema: {
        summary: "Delete an admin-managed viewer account (admin only)",
        tags: ["Admin"],
      },
    },
    async (request, reply) => {
      const gate = requireAdmin(request.ccRole);
      if (!gate.ok) {
        return reply.status(403).send({ error: "forbidden", message: gate.message });
      }

      const { viewerId } = request.params as { viewerId: string };

      if (!isManagedViewer(viewerId)) {
        return reply.status(400).send({
          error: "not_deletable",
          message:
            `Viewer "${viewerId}" is configured in .env and cannot be deleted here. Remove it from the server environment instead.`,
        });
      }

      try {
        deleteManagedViewer(viewerId);
        deleteViewerDashboardPermissions(viewerId);
        deleteViewerIntegration(viewerId);
        return reply.send({
          data: { viewerId, deleted: true },
          meta: { source: "shamal-platform" },
        });
      } catch (err) {
        const message = (err as Error).message;
        if (message.includes("not found")) {
          return reply.status(404).send({ error: "not_found", message });
        }
        return reply.status(400).send({ error: "validation_error", message });
      }
    },
  );

  app.get(
    "/v1/marafiq/admin/viewer-settings/:viewerId",
    {
      schema: {
        summary: "Read viewer dashboard permissions (admin only)",
        tags: ["Admin"],
      },
    },
    async (request, reply) => {
      const gate = requireAdmin(request.ccRole);
      if (!gate.ok) {
        return reply.status(403).send({ error: "forbidden", message: gate.message });
      }

      const { viewerId } = request.params as { viewerId: string };
      const permissions = getViewerDashboardPermissions(viewerId);
      const viewer = listViewerAccounts().find((v) => v.viewerId === viewerId);
      if (!viewer) {
        return reply.status(404).send({
          error: "not_found",
          message: `Viewer account "${viewerId}" was not found.`,
        });
      }

      return reply.send({
        data: {
          viewerId,
          displayName: viewer.displayName,
          permissions,
        },
        meta: { source: "shamal-platform" },
      });
    },
  );

  app.patch(
    "/v1/marafiq/admin/viewer-settings/:viewerId",
    {
      schema: {
        summary: "Update viewer dashboard permissions (admin only)",
        tags: ["Admin"],
      },
    },
    async (request, reply) => {
      const gate = requireAdmin(request.ccRole);
      if (!gate.ok) {
        return reply.status(403).send({ error: "forbidden", message: gate.message });
      }

      const { viewerId } = request.params as { viewerId: string };
      const parsed = patchSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "validation_error",
          details: parsed.error.flatten(),
        });
      }

      try {
        const permissions = updateViewerDashboardPermissions(viewerId, parsed.data);
        const viewer = listViewerAccounts().find((v) => v.viewerId === viewerId)!;
        return reply.send({
          data: {
            viewerId,
            displayName: viewer.displayName,
            permissions,
          },
          meta: { source: "shamal-platform" },
        });
      } catch (err) {
        const message = (err as Error).message;
        if (message.startsWith("Unknown viewer")) {
          return reply.status(404).send({ error: "not_found", message });
        }
        return reply.status(400).send({ error: "validation_error", message });
      }
    },
  );

  app.get(
    "/v1/marafiq/admin/viewers/:viewerId/integration",
    {
      schema: {
        summary: "Read viewer API integration settings (admin only)",
        tags: ["Admin"],
      },
    },
    async (request, reply) => {
      const gate = requireAdmin(request.ccRole);
      if (!gate.ok) {
        return reply.status(403).send({ error: "forbidden", message: gate.message });
      }

      const { viewerId } = request.params as { viewerId: string };
      const viewer = listViewerAccounts().find((v) => v.viewerId === viewerId);
      if (!viewer) {
        return reply.status(404).send({
          error: "not_found",
          message: `Viewer account "${viewerId}" was not found.`,
        });
      }

      const host = request.headers.host;
      return reply.send({
        data: getAdminIntegrationView(viewerId, resolveApiBaseUrl(host)),
        meta: { source: "shamal-platform" },
      });
    },
  );

  app.patch(
    "/v1/marafiq/admin/viewers/:viewerId/integration",
    {
      schema: {
        summary: "Enable/disable viewer API integration (admin only)",
        tags: ["Admin"],
      },
    },
    async (request, reply) => {
      const gate = requireAdmin(request.ccRole);
      if (!gate.ok) {
        return reply.status(403).send({ error: "forbidden", message: gate.message });
      }

      const { viewerId } = request.params as { viewerId: string };
      const parsed = integrationPatchSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "validation_error",
          details: parsed.error.flatten(),
        });
      }

      try {
        setViewerIntegrationEnabled(viewerId, parsed.data.enabled);
        const host = request.headers.host;
        return reply.send({
          data: getAdminIntegrationView(viewerId, resolveApiBaseUrl(host)),
          meta: { source: "shamal-platform" },
        });
      } catch (err) {
        const message = (err as Error).message;
        if (message.startsWith("Unknown viewer")) {
          return reply.status(404).send({ error: "not_found", message });
        }
        return reply.status(400).send({ error: "validation_error", message });
      }
    },
  );

  app.post(
    "/v1/marafiq/admin/viewers/:viewerId/integration/generate",
    {
      schema: {
        summary: "Generate viewer API integration token (admin only)",
        tags: ["Admin"],
      },
    },
    async (request, reply) => {
      const gate = requireAdmin(request.ccRole);
      if (!gate.ok) {
        return reply.status(403).send({ error: "forbidden", message: gate.message });
      }

      const { viewerId } = request.params as { viewerId: string };
      try {
        const { token } = generateViewerIntegrationToken(viewerId);
        const host = request.headers.host;
        return reply.send({
          data: {
            ...getAdminIntegrationView(viewerId, resolveApiBaseUrl(host)),
            apiKey: token,
          },
          meta: {
            source: "shamal-platform",
            note: "Store this API key securely. It is shown in full only once.",
          },
        });
      } catch (err) {
        const message = (err as Error).message;
        if (message.startsWith("Unknown viewer")) {
          return reply.status(404).send({ error: "not_found", message });
        }
        return reply.status(400).send({ error: "validation_error", message });
      }
    },
  );

  app.post(
    "/v1/marafiq/admin/viewers/:viewerId/integration/regenerate",
    {
      schema: {
        summary: "Regenerate viewer API integration token (admin only)",
        tags: ["Admin"],
      },
    },
    async (request, reply) => {
      const gate = requireAdmin(request.ccRole);
      if (!gate.ok) {
        return reply.status(403).send({ error: "forbidden", message: gate.message });
      }

      const { viewerId } = request.params as { viewerId: string };
      try {
        const { token } = regenerateViewerIntegrationToken(viewerId);
        const host = request.headers.host;
        return reply.send({
          data: {
            ...getAdminIntegrationView(viewerId, resolveApiBaseUrl(host)),
            apiKey: token,
          },
          meta: {
            source: "shamal-platform",
            note: "Previous token is now invalid. Store this API key securely.",
          },
        });
      } catch (err) {
        const message = (err as Error).message;
        if (message.startsWith("Unknown viewer")) {
          return reply.status(404).send({ error: "not_found", message });
        }
        return reply.status(400).send({ error: "validation_error", message });
      }
    },
  );

  app.post(
    "/v1/marafiq/admin/viewers/:viewerId/integration/revoke",
    {
      schema: {
        summary: "Revoke viewer API integration token (admin only)",
        tags: ["Admin"],
      },
    },
    async (request, reply) => {
      const gate = requireAdmin(request.ccRole);
      if (!gate.ok) {
        return reply.status(403).send({ error: "forbidden", message: gate.message });
      }

      const { viewerId } = request.params as { viewerId: string };
      try {
        revokeViewerIntegrationToken(viewerId);
        const host = request.headers.host;
        return reply.send({
          data: getAdminIntegrationView(viewerId, resolveApiBaseUrl(host)),
          meta: { source: "shamal-platform" },
        });
      } catch (err) {
        const message = (err as Error).message;
        if (message.startsWith("Unknown viewer")) {
          return reply.status(404).send({ error: "not_found", message });
        }
        return reply.status(400).send({ error: "validation_error", message });
      }
    },
  );
};
