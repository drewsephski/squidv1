import { migrate } from "drizzle-orm/postgres-js/migrator";
import { join } from "path";
import { pgDb } from "lib/db/pg/db.pg";

export const runMigrate = async () => {
  console.log("⏳ Running PostgreSQL migrations...");

  const start = Date.now();
  const result = await migrate(pgDb, {
    migrationsFolder: join(process.cwd(), "src/lib/db/migrations/pg"),
  });
  const end = Date.now();

  console.log("✅ PostgreSQL migrations completed in", end - start, "ms");
  return result;
};
