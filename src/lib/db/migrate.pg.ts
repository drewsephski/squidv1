import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { join } from "path";
import { pgDb } from "lib/db/db.sqlite";

export const runMigrate = async () => {
  console.log("⏳ Running SQLite migrations...");

  const start = Date.now();
  const result = await migrate(pgDb, {
    migrationsFolder: join(process.cwd(), "src/lib/db/migrations/pg"),
  });
  const end = Date.now();

  console.log("✅ SQLite migrations completed in", end - start, "ms");
  return result;
};
