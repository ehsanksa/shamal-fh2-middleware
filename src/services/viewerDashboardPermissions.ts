import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { getCcUsers } from "./commandCenterAuth.js";

const permissionsSchema = z.object({
  fleetOverview: z.boolean(),
  droneTelemetry: z.boolean(),
  dockTelemetry: z.boolean(),
  batteryStatus: z.boolean(),
  gpsLocation: z.boolean(),
  onlineOffline: z.boolean(),
  liveCamera: z.boolean(),
  droneFpv: z.boolean(),
  alertsEvents: z.boolean(),
  missionMediaHistory: z.boolean(),
  refreshButton: z.boolean(),
  getApiButtons: z.boolean(),
});

export type ViewerDashboardPermissions = z.infer<typeof permissionsSchema>;

export const DEFAULT_VIEWER_DASHBOARD_PERMISSIONS: ViewerDashboardPermissions = {
  fleetOverview: true,
  droneTelemetry: true,
  dockTelemetry: true,
  batteryStatus: true,
  gpsLocation: true,
  onlineOffline: true,
  liveCamera: true,
  droneFpv: false,
  alertsEvents: false,
  missionMediaHistory: true,
  refreshButton: true,
  getApiButtons: false,
};

const storePath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../data/viewer-dashboard-permissions.json",
);

type PermissionStore = Record<string, Partial<ViewerDashboardPermissions>>;

function ensureStoreDir(): void {
  const dir = dirname(storePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function readStore(): PermissionStore {
  ensureStoreDir();
  if (!existsSync(storePath)) return {};
  try {
    const raw = readFileSync(storePath, "utf8");
    const parsed = JSON.parse(raw) as PermissionStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: PermissionStore): void {
  ensureStoreDir();
  writeFileSync(storePath, JSON.stringify(store, null, 2) + "\n", "utf8");
}

export function mergeViewerPermissions(
  overrides?: Partial<ViewerDashboardPermissions> | null,
): ViewerDashboardPermissions {
  return { ...DEFAULT_VIEWER_DASHBOARD_PERMISSIONS, ...overrides };
}

export function getViewerDashboardPermissions(
  viewerId: string,
): ViewerDashboardPermissions {
  const store = readStore();
  return mergeViewerPermissions(store[viewerId]);
}

export function listViewerDashboardPermissionUsers(): Array<{
  viewerId: string;
  displayName: string;
  permissions: ViewerDashboardPermissions;
}> {
  const viewers = getCcUsers().filter((u) => u.role === "viewer");
  const store = readStore();
  return viewers.map((u) => ({
    viewerId: u.username,
    displayName: u.displayName,
    permissions: mergeViewerPermissions(store[u.username]),
  }));
}

export function updateViewerDashboardPermissions(
  viewerId: string,
  patch: Partial<ViewerDashboardPermissions>,
): ViewerDashboardPermissions {
  const viewers = getCcUsers().filter((u) => u.role === "viewer");
  if (!viewers.some((u) => u.username === viewerId)) {
    throw new Error(`Unknown viewer account: ${viewerId}`);
  }

  const parsed = permissionsSchema.partial().safeParse(patch);
  if (!parsed.success) {
    throw new Error("Invalid viewer dashboard permissions payload");
  }

  const store = readStore();
  const next = mergeViewerPermissions({
    ...store[viewerId],
    ...parsed.data,
  });
  store[viewerId] = next;
  writeStore(store);
  return next;
}

export function deleteViewerDashboardPermissions(viewerId: string): void {
  const store = readStore();
  if (!(viewerId in store)) return;
  delete store[viewerId];
  writeStore(store);
}

export function getPermissionsStorePath(): string {
  return storePath;
}
