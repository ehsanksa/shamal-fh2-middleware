import type {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { config } from "../config.js";
import {
  hasMinRole,
  resolveRequestRole,
} from "../services/commandCenterAuth.js";
import { assertRoleAccess } from "../services/apiAccess.js";

function clientIp(request: FastifyRequest): string {
  const forwarded = request.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0]!.trim();
  }
  return request.ip;
}

function requestPath(url: string): string {
  return url.split("?")[0] ?? url;
}

function requiresOperatorRole(path: string, method: string): boolean {
  if (method === "POST" && path.startsWith("/v1/marafiq/ops/")) return true;
  if (method === "POST" && /^\/v1\/marafiq\/events\/[^/]+\/ack$/.test(path)) return true;
  return false;
}

/** Register on the root Fastify instance (not as an encapsulated plugin). */
export async function registerMarafiqAuth(app: FastifyInstance): Promise<void> {
  app.addHook("onRequest", async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.method === "OPTIONS") {
      return;
    }

    if (
      request.url.startsWith("/health") ||
      request.url.startsWith("/docs") ||
      request.url.startsWith("/webhooks/fh2") ||
      requestPath(request.url) === "/" ||
      request.url.startsWith("/platform") ||
      request.url.startsWith("/command-center")
    ) {
      return;
    }

    if (!request.url.startsWith("/v1/marafiq")) {
      return;
    }

    const path = requestPath(request.url);
    if (path === "/v1/marafiq/auth/login") {
      return;
    }

    const apiKeyHeader = request.headers["x-api-key"];
    const apiKey =
      typeof apiKeyHeader === "string"
        ? apiKeyHeader
        : typeof request.headers.authorization === "string" &&
            request.headers.authorization.startsWith("Bearer ")
          ? request.headers.authorization.slice(7)
          : undefined;

    if (!apiKey || !config.marafiqApiKeys.includes(apiKey)) {
      return reply.status(401).send({
        error: "unauthorized",
        message: "Valid X-Api-Key or Bearer token required",
      });
    }

    const sessionHeader = request.headers["x-cc-session"];
    const sessionToken =
      typeof sessionHeader === "string" ? sessionHeader : undefined;

    const role = resolveRequestRole(apiKey, sessionToken);
    if (!role) {
      return reply.status(401).send({
        error: "invalid_session",
        message: "Invalid or expired Shamal Platform session. Sign in again.",
      });
    }

    request.ccRole = role;

    const access = assertRoleAccess(role, request.method, path);
    if (!access.allowed) {
      return reply.status(403).send({
        error: "forbidden",
        message: access.message,
        requiredRole: access.requiredRole,
      });
    }

    if (requiresOperatorRole(path, request.method)) {
      if (!hasMinRole(role, "operator")) {
        return reply.status(403).send({
          error: "forbidden",
          message: `Role "${role}" cannot perform this action. Operator or admin required.`,
          requiredRole: "operator",
        });
      }
    }

    if (config.marafiqIpAllowlist.length > 0) {
      const ip = clientIp(request);
      if (!config.marafiqIpAllowlist.includes(ip)) {
        return reply.status(403).send({
          error: "forbidden",
          message: "IP address not allowlisted",
        });
      }
    }
  });
}

/** @deprecated Use registerMarafiqAuth on the root instance */
export const marafiqAuthPlugin: FastifyPluginAsync = registerMarafiqAuth;
