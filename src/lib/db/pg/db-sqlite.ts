/**
 * db.sqlite.ts  (replaces db.pg.ts)
 *
 * Drop-in Drizzle client backed by better-sqlite3.
 * The database file lives in the Electron userData directory on desktop,
 * or falls back to a local path for web/dev.
 *
 * Usage: swap every `import { pgDb } from "./db.pg"` →
 *             `import { db }    from "./db.sqlite"`
 */
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

function getDbPath(): string {
  // In Electron, SQUID_USERDATA is set by the main process before Next.js boots.
  // In plain Next.js dev (non-desktop), fall back to a local .sqlite file.
  const userDataDir =
    process.env.SQUID_USERDATA ?? path.join(process.cwd(), ".squid-dev-data");

  // Ensure the directory exists
  fs.mkdirSync(userDataDir, { recursive: true });

  return path.join(userDataDir, "squid.db");
}

const sqlite = new Database(getDbPath());

// Performance pragmas — safe for a single-writer desktop app
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("synchronous = NORMAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite);

// Named export matching the old pgDb name so find-replace is easy
export const pgDb = db;
