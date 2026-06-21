import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { login } from "../services/commandCenterAuth.js";

const loginSchema = z.object({
  username: z.string().min(2),
  password: z.string().min(4),
});

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/v1/marafiq/auth/login",
    {
      schema: {
        summary: "Shamal Platform login (viewer/operator/admin)",
        tags: ["Auth"],
        security: [],
      },
    },
    async (request, reply) => {
      const parsed = loginSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "validation_error",
          details: parsed.error.flatten(),
        });
      }

      try {
        const session = login(parsed.data.username, parsed.data.password);
        if (!session) {
          return reply.status(401).send({
            error: "invalid_credentials",
            message: "Invalid username or password",
          });
        }

        return reply.send({
          data: {
            apiKey: session.apiKey,
            role: session.role,
            displayName: session.displayName,
            sessionToken: session.sessionToken,
            permissions: {
              canView: true,
              canOperate: session.role === "operator" || session.role === "admin",
              canAdmin: session.role === "admin",
            },
          },
          meta: { source: "shamal-platform" },
        });
      } catch (err) {
        return reply.status(500).send({
          error: "auth_config_error",
          message: (err as Error).message,
        });
      }
    },
  );
};
