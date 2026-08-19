#!/usr/bin/env node
// Pushes Prisma schema DDL to Turso at build time
// Only adds missing columns/tables — won't break existing data
const { createClient } = require("@libsql/client");

const NEW_COLUMNS = {
  User: [
    { name: "firstName", type: "TEXT" },
    { name: "lastName", type: "TEXT" },
    { name: "phone", type: "TEXT" },
    { name: "gender", type: "TEXT" },
    { name: "address", type: "TEXT" },
  ],
};

async function main() {
  const TURSO_URL = process.env.DATABASE_URL;
  const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

  if (!TURSO_URL || !TURSO_TOKEN || !TURSO_URL.startsWith("libsql://")) {
    console.log("[push-schema] Skipping — not a Turso environment");
    return;
  }

  const turso = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

  // Get existing columns per table
  const existing = await turso.execute(
    "SELECT name, tbl_name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%'"
  );

  const tableColumns = {};
  for (const row of existing.rows) {
    const table = row.tbl_name;
    if (!tableColumns[table]) tableColumns[table] = new Set();
    tableColumns[table].add(row.name);
  }

  let added = 0;
  for (const [table, columns] of Object.entries(NEW_COLUMNS)) {
    const existingCols = tableColumns[table] || new Set();
    for (const col of columns) {
      if (!existingCols.has(col.name)) {
        try {
          await turso.execute(
            `ALTER TABLE "${table}" ADD COLUMN "${col.name}" ${col.type}`
          );
          console.log(`[push-schema] Added ${table}.${col.name}`);
          added++;
        } catch (e) {
          console.error(`[push-schema] Error adding ${table}.${col.name}: ${e.message}`);
        }
      }
    }
  }

  console.log(`[push-schema] Done — added ${added} columns`);
}

main().catch((e) => {
  console.error("[push-schema] Fatal:", e);
  process.exit(1);
});
