import type { CcRole } from "../services/commandCenterAuth.js";

declare module "fastify" {
  interface FastifyRequest {
    ccRole?: CcRole;
    ccUsername?: string;
  }
}
