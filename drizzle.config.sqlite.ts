/**
 * drizzle.config.sqlite.ts
 *
 * Replace your existing drizzle.config.ts with this when running in desktop mode.
 * Or, conditionally switch based on an env var (see comment below).
 *
 * Usage:
 *   pnpm drizzle-kit push --config drizzle.config.sqlite.ts
 *   pnpm drizzle-kit studio --config drizzle.config.sqlite.ts
 */
import type { Config } from "drizzle-kit";
import path from "path";
import os from "os";

// Resolve the same path that db.sqlite.ts uses at runtime
const userDataDir =
  process.env.SQUID_USERDATA ?? path.join(process.cwd(), ".squid-dev-data");

const dbPath = path.join(userDataDir, "squid.db");

export default {
  schema: "./src/lib/db/schema.sqlite.ts", // ← rename schema.sqlite.ts → schema.ts when ready
  out: "./drizzle/migrations-sqlite",
  dialect: "sqlite",
  dbCredentials: {
    url: dbPath,
  },
} satisfies Config;
