const { createClient } = require("@libsql/client");
const Database = require("better-sqlite3");
const path = require("path");

const TURSO_URL = process.argv[2];
const TURSO_TOKEN = process.argv[3];

if (!TURSO_URL || !TURSO_TOKEN) {
  console.error("Usage: node push-schema.js <TURSO_URL> <TURSO_TOKEN>");
  process.exit(1);
}

async function main() {
  // Read schema from SQLite
  const dbPath = path.join(__dirname, "prisma", "dev.db");
  const sqlite = new Database(dbPath);
  
  // Get all CREATE TABLE statements from sqlite_master
  const tables = sqlite.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND sql IS NOT NULL AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%'").all();
  
  // Get all CREATE INDEX statements
  const indexes = sqlite.prepare("SELECT sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%'").all();
  
  sqlite.close();

  // Connect to Turso
  const turso = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });
  
  // Execute all statements
  const statements = [...tables, ...indexes];
  console.log(`Pushing ${statements.length} statements to Turso...`);
  
  for (const { sql } of statements) {
    try {
      await turso.execute(sql);
    } catch (e) {
      // Ignore "already exists" errors
      if (!e.message?.includes("already exists")) {
        console.error(`Error executing: ${sql.substring(0, 100)}...`);
        console.error(e.message);
      }
    }
  }
  
  console.log("Schema push complete!");
}

main().catch(console.error);
