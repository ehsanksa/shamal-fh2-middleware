import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { config } from "../config.js";

const schemaPath = join(dirname(fileURLToPath(import.meta.url)), "schema.sql");

async function migrate() {
  const pool = new pg.Pool({ connectionString: config.DATABASE_URL });
  const sql = readFileSync(schemaPath, "utf-8");
  await pool.query(sql);
  console.log("Database migration completed.");
  await pool.end();
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
