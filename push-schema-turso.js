#!/usr/bin/env node
// Pushes the local SQLite schema to Turso at build time
const { createClient } = require("@libsql/client");
const Database = require("better-sqlite3");
const path = require("path");

async function main() {
  const TURSO_URL = process.env.DATABASE_URL;
  const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

  if (!TURSO_URL || !TURSO_TOKEN || !TURSO_URL.startsWith("libsql://")) {
    console.log("[push-schema] Skipping — not a Turso environment");
    return;
  }

  console.log("[push-schema] Reading schema from local SQLite...");
  const dbPath = path.join(__dirname, "prisma", "dev.db");
  const sqlite = new Database(dbPath);

  const stmts = sqlite
    .prepare(
      "SELECT sql FROM sqlite_master WHERE type IN ('table','index') AND sql IS NOT NULL AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%'"
    )
    .all()
    .map((r) => r.sql);

  sqlite.close();
  console.log(`[push-schema] Found ${stmts.length} statements`);

  const turso = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

  let pushed = 0;
  for (const sql of stmts) {
    try {
      await turso.execute(sql);
      pushed++;
    } catch (e) {
      if (!String(e.message || "").includes("already exists")) {
        console.error(`[push-schema] Error: ${e.message}`);
      }
    }
  }

  console.log(`[push-schema] Done — pushed ${pushed}/${stmts.length}`);
}

main().catch((e) => {
  console.error("[push-schema] Fatal:", e);
  process.exit(1);
});
