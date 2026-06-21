/**
 * Record a browser UI check result into the active test session.
 * Usage: npx tsx scripts/record-browser-check.ts <url> <ok|fail> [note]
 */
import { appendFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const url = process.argv[2];
const okArg = process.argv[3];
const note = process.argv.slice(4).join(" ") || undefined;

if (!url || !okArg) {
  console.error("Usage: record-browser-check.ts <url> <ok|fail> [note]");
  process.exit(1);
}

const sessionBase = "test-results";
let sessionDir = process.env.OUT_DIR;

if (!sessionDir) {
  const sessions = existsSync(sessionBase)
    ? readdirSync(sessionBase)
        .filter((d) => d.startsWith("session-"))
        .sort()
        .reverse()
    : [];
  sessionDir = sessions[0] ? join(sessionBase, sessions[0]) : join(sessionBase, `session-${new Date().toISOString().replace(/[:.]/g, "-")}`);
}

mkdirSync(sessionDir, { recursive: true });

const entry = {
  at: new Date().toISOString(),
  url,
  ok: okArg === "ok" || okArg === "true",
  note,
};

appendFileSync(join(sessionDir, "browser-checks.jsonl"), `${JSON.stringify(entry)}\n`);
console.log(JSON.stringify({ sessionDir, entry }));
