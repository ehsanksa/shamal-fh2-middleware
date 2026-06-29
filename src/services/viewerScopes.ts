import type { ViewerDashboardPermissions } from "./viewerDashboardPermissions.js";

export type ViewerApiScope =
  | "fleet:read"
  | "drone:read"
  | "dock:read"
  | "battery:read"
  | "gps:read"
  | "status:read"
  | "camera:read"
  | "fpv:read"
  | "events:read"
  | "media:read";

const PERMISSION_SCOPE_MAP: Partial<
  Record<keyof ViewerDashboardPermissions, ViewerApiScope>
> = {
  fleetOverview: "fleet:read",
  droneTelemetry: "drone:read",
  dockTelemetry: "dock:read",
  batteryStatus: "battery:read",
  gpsLocation: "gps:read",
  onlineOffline: "status:read",
  liveCamera: "camera:read",
  droneFpv: "fpv:read",
  alertsEvents: "events:read",
  missionMediaHistory: "media:read",
};

export const VIEWER_ROUTE_SCOPES: Record<string, ViewerApiScope> = {
  "/v1/marafiq/viewer/fleet": "fleet:read",
  "/v1/marafiq/viewer/drone-telemetry": "drone:read",
  "/v1/marafiq/viewer/dock-telemetry": "dock:read",
  "/v1/marafiq/viewer/battery-status": "battery:read",
  "/v1/marafiq/viewer/gps-location": "gps:read",
  "/v1/marafiq/viewer/online-status": "status:read",
  "/v1/marafiq/viewer/camera": "camera:read",
  "/v1/marafiq/viewer/fpv": "fpv:read",
  "/v1/marafiq/viewer/alerts-events": "events:read",
  "/v1/marafiq/viewer/media-history": "media:read",
};

export const VIEWER_ROUTE_SLUGS: Record<string, string> = {
  fleet: "/v1/marafiq/viewer/fleet",
  "drone-telemetry": "/v1/marafiq/viewer/drone-telemetry",
  "dock-telemetry": "/v1/marafiq/viewer/dock-telemetry",
  battery: "/v1/marafiq/viewer/battery-status",
  gps: "/v1/marafiq/viewer/gps-location",
  online: "/v1/marafiq/viewer/online-status",
  camera: "/v1/marafiq/viewer/camera",
  "drone-fpv": "/v1/marafiq/viewer/fpv",
  alerts: "/v1/marafiq/viewer/alerts-events",
  missions: "/v1/marafiq/viewer/media-history",
};

export function deriveViewerScopes(
  permissions: ViewerDashboardPermissions,
): ViewerApiScope[] {
  const scopes = new Set<ViewerApiScope>();
  for (const [perm, scope] of Object.entries(PERMISSION_SCOPE_MAP)) {
    if (permissions[perm as keyof ViewerDashboardPermissions] === true && scope) {
      scopes.add(scope);
    }
  }
  return [...scopes];
}

export function hasViewerScope(
  scopes: ViewerApiScope[],
  required: ViewerApiScope,
): boolean {
  return scopes.includes(required);
}

export function scopeForViewerPath(path: string): ViewerApiScope | null {
  return VIEWER_ROUTE_SCOPES[path] ?? null;
}
