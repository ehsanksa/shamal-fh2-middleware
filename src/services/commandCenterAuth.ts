import { createHmac, timingSafeEqual } from "node:crypto";
import { config, readCcCredentialEnv } from "../config.js";

export type CcRole = "viewer" | "operator" | "admin";

export interface CcUser {
  username: string;
  password: string;
  role: CcRole;
  apiKey: string;
}

const ROLE_RANK: Record<CcRole, number> = {
  viewer: 1,
  operator: 2,
  admin: 3,
};

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

function parseUsers(raw: string): CcUser[] {
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [username, password, role, apiKey] = part.split(":");
      if (!username || !password || !role || !apiKey) {
        throw new Error(`Invalid CC_USERS entry: ${part}`);
      }
      const normalizedRole = role.toLowerCase() as CcRole;
      if (!["viewer", "operator", "admin"].includes(normalizedRole)) {
        throw new Error(`Invalid role in CC_USERS: ${role}`);
      }
      return {
        username,
        password,
        role: normalizedRole,
        apiKey,
      };
    });
}

function parseApiKeyRoles(raw: string): Map<string, CcRole> {
  const map = new Map<string, CcRole>();
  for (const part of raw.split(",").map((p) => p.trim()).filter(Boolean)) {
    const [apiKey, role] = part.split(":");
    if (!apiKey || !role) continue;
    const normalizedRole = role.toLowerCase() as CcRole;
    if (["viewer", "operator", "admin"].includes(normalizedRole)) {
      map.set(apiKey, normalizedRole);
    }
  }
  return map;
}

interface CcCredentialEnv {
  ccUsers?: string;
  ccAdminId?: string;
  ccAdminPassword?: string;
  ccOperatorId?: string;
  ccOperatorPassword?: string;
  ccViewerId?: string;
  ccViewerPassword?: string;
  marafiqApiKeys: string[];
}

function buildCcUsersFromEnv(creds: CcCredentialEnv = {
  ccUsers: config.CC_USERS,
  ccAdminId: config.ccAdminId,
  ccAdminPassword: config.ccAdminPassword,
  ccOperatorId: config.ccOperatorId,
  ccOperatorPassword: config.ccOperatorPassword,
  ccViewerId: config.ccViewerId,
  ccViewerPassword: config.ccViewerPassword,
  marafiqApiKeys: config.marafiqApiKeys,
}): CcUser[] {
  const apiKey = creds.marafiqApiKeys[0] ?? "demo-marafiq-key";
  const users: CcUser[] = [];

  if (creds.ccAdminId && creds.ccAdminPassword) {
    users.push({
      username: creds.ccAdminId,
      password: creds.ccAdminPassword,
      role: "admin",
      apiKey,
    });
  }

  if (creds.ccOperatorId && creds.ccOperatorPassword) {
    users.push({
      username: creds.ccOperatorId,
      password: creds.ccOperatorPassword,
      role: "operator",
      apiKey,
    });
  }

  if (creds.ccViewerId && creds.ccViewerPassword) {
    users.push({
      username: creds.ccViewerId,
      password: creds.ccViewerPassword,
      role: "viewer",
      apiKey,
    });
  }

  if (users.length > 0) return users;

  return [
    {
      username: "admin",
      password: "admin2026",
      role: "admin",
      apiKey,
    },
    {
      username: "operator",
      password: "ops2026",
      role: "operator",
      apiKey,
    },
    {
      username: "viewer",
      password: "view2026",
      role: "viewer",
      apiKey,
    },
  ];
}

/** Loads platform users from .env (re-reads .env on each call for login). */
export function getCcUsers(): CcUser[] {
  const creds = readCcCredentialEnv();
  if (creds.ccUsers) return parseUsers(creds.ccUsers);
  return buildCcUsersFromEnv(creds);
}

export const ccUsers: CcUser[] = getCcUsers();

/** Default role for headless Marafiq API clients (no X-CC-Session). */
export const apiKeyRoleMap: Map<string, CcRole> = config.MARAFIQ_API_KEY_ROLES
  ? parseApiKeyRoles(config.MARAFIQ_API_KEY_ROLES)
  : new Map(config.marafiqApiKeys.map((key) => [key, "operator" as CcRole]));

export function createSessionToken(user: CcUser): string {
  const exp = Date.now() + SESSION_TTL_MS;
  const payload = `${user.username}|${user.role}|${user.apiKey}|${exp}`;
  const sig = createHmac("sha256", config.CC_SESSION_SECRET)
    .update(payload)
    .digest("hex");
  return Buffer.from(`${payload}|${sig}`).toString("base64url");
}

export function verifySessionToken(
  token: string,
  apiKey: string,
): { role: CcRole; username: string } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const parts = decoded.split("|");
    if (parts.length !== 5) return null;
    const [username, role, tokenApiKey, expStr, sig] = parts;
    if (!username || !role || !tokenApiKey || !expStr || !sig) return null;
    if (tokenApiKey !== apiKey) return null;
    if (Date.now() > Number(expStr)) return null;

    const payload = `${username}|${role}|${tokenApiKey}|${expStr}`;
    const expected = createHmac("sha256", config.CC_SESSION_SECRET)
      .update(payload)
      .digest("hex");
    if (!safeEqual(sig, expected)) return null;

    const normalizedRole = role.toLowerCase() as CcRole;
    if (!["viewer", "operator", "admin"].includes(normalizedRole)) return null;

    return { role: normalizedRole, username };
  } catch {
    return null;
  }
}

export function login(username: string, password: string): {
  apiKey: string;
  role: CcRole;
  displayName: string;
  sessionToken: string;
} | null {
  const normalizedUsername = username.trim();
  const users = getCcUsers();
  const user = users.find(
    (u) => u.username === normalizedUsername && safeEqual(u.password, password),
  );
  if (!user) return null;

  const apiKeys = readCcCredentialEnv().marafiqApiKeys;
  if (!apiKeys.includes(user.apiKey)) {
    throw new Error(
      `User api key "${user.apiKey}" is not listed in MARAFIQ_API_KEYS`,
    );
  }

  return {
    apiKey: user.apiKey,
    role: user.role,
    displayName: user.username,
    sessionToken: createSessionToken(user),
  };
}

export function roleFromApiKey(apiKey: string): CcRole {
  return apiKeyRoleMap.get(apiKey) ?? "viewer";
}

export function resolveRequestRole(
  apiKey: string,
  sessionToken?: string,
): CcRole | null {
  if (sessionToken) {
    const verified = verifySessionToken(sessionToken, apiKey);
    if (verified) return verified.role;
    return null;
  }
  return roleFromApiKey(apiKey);
}

export function hasMinRole(actual: CcRole, required: CcRole): boolean {
  return ROLE_RANK[actual] >= ROLE_RANK[required];
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}
