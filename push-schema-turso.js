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
    { name: "usernameChangedAt", type: "DATETIME" },
  ],
  CalendarEvent: [
    { name: "visibility", type: "TEXT DEFAULT 'private'" },
  ],
};

const NEW_TABLES = [
  `CREATE TABLE IF NOT EXISTS "EventVisibility" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    UNIQUE("eventId", "userId")
  )`,
  `CREATE TABLE IF NOT EXISTS "Group" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "avatar" TEXT,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "creatorId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("creatorId") REFERENCES "User"("id"),
    FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "GroupMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    UNIQUE("groupId", "userId")
  )`,
  `CREATE TABLE IF NOT EXISTS "GroupInvitation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "invitedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    FOREIGN KEY ("invitedById") REFERENCES "User"("id"),
    UNIQUE("groupId", "userId")
  )`,
  `CREATE TABLE IF NOT EXISTS "DMMute" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "mutedUserId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    FOREIGN KEY ("mutedUserId") REFERENCES "User"("id") ON DELETE CASCADE,
    FOREIGN KEY ("conversationId") REFERENCES "DMConversation"("id") ON DELETE CASCADE,
    UNIQUE("userId", "mutedUserId", "conversationId")
  )`,
  `CREATE TABLE IF NOT EXISTS "DMBlock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "blockedUserId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    FOREIGN KEY ("blockedUserId") REFERENCES "User"("id") ON DELETE CASCADE,
    FOREIGN KEY ("conversationId") REFERENCES "DMConversation"("id") ON DELETE CASCADE,
    UNIQUE("userId", "blockedUserId", "conversationId")
  )`,
];

async function main() {
  const TURSO_URL = process.env.DATABASE_URL;
  const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

  if (!TURSO_URL || !TURSO_TOKEN || !TURSO_URL.startsWith("libsql://")) {
    console.log("[push-schema] Skipping — not a Turso environment");
    return;
  }

  const turso = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

  // Get existing tables
  const existingTables = await turso.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%'"
  );
  const existingTableNames = new Set(existingTables.rows.map(r => r.name));

  // Create new tables
  let tablesCreated = 0;
  for (const ddl of NEW_TABLES) {
    const match = ddl.match(/CREATE TABLE IF NOT EXISTS "(\w+)"/);
    if (match && !existingTableNames.has(match[1])) {
      try {
        await turso.execute(ddl);
        console.log(`[push-schema] Created table ${match[1]}`);
        tablesCreated++;
      } catch (e) {
        console.error(`[push-schema] Error creating table ${match[1]}: ${e.message}`);
      }
    }
  }

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

  console.log(`[push-schema] Done — ${tablesCreated} tables, ${added} columns`);
}

main().catch((e) => {
  console.error("[push-schema] Fatal:", e);
  process.exit(1);
});
