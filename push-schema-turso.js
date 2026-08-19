#!/usr/bin/env node
// Pushes Prisma schema DDL to Turso at build time
const { createClient } = require("@libsql/client");
const { execSync } = require("child_process");

async function main() {
  const TURSO_URL = process.env.DATABASE_URL;
  const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

  if (!TURSO_URL || !TURSO_TOKEN || !TURSO_URL.startsWith("libsql://")) {
    console.log("[push-schema] Skipping — not a Turso environment");
    return;
  }

  console.log("[push-schema] Generating DDL from Prisma schema...");
  const raw = execSync(
    "npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script",
    { encoding: "utf-8", cwd: __dirname }
  );

  const stmts = raw
    .split("\n")
    .filter((line) => line.trim().length > 0 && !line.startsWith("--"))
    .join("\n")
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`[push-schema] Found ${stmts.length} statements`);

  const turso = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

  let pushed = 0;
  for (const sql of stmts) {
    try {
      await turso.execute(sql);
      pushed++;
    } catch (e) {
      const msg = String(e.message || "");
      if (!msg.includes("already exists") && !msg.includes("Duplicate")) {
        console.error(`[push-schema] Error: ${msg.substring(0, 200)}`);
      }
    }
  }

  console.log(`[push-schema] Done — pushed ${pushed}/${stmts.length}`);
}

main().catch((e) => {
  console.error("[push-schema] Fatal:", e);
  process.exit(1);
});
