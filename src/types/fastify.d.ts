import type { CcRole } from "./commandCenterAuth.js";
import type { ViewerApiScope } from "./viewerScopes.js";

declare module "fastify" {
  interface FastifyRequest {
    ccRole?: CcRole;
    ccUsername?: string;
    viewerIntegration?: {
      viewerId: string;
      scopes: ViewerApiScope[];
    };
  }
}
