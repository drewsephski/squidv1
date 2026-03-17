import { pgDb } from "./src/lib/db/pg/db.pg";
import { UserTable } from "./src/lib/db/pg/schema.pg";

async function checkUsers() {
  try {
    const users = await pgDb.select().from(UserTable);
    console.log(`Total users: ${users.length}`);
    if (users.length > 0) {
      console.log(
        "Users:",
        users.map((u) => ({ id: u.id, email: u.email, role: u.role })),
      );
    }
  } catch (error) {
    console.error("Error checking users:", error);
  } finally {
    process.exit(0);
  }
}

checkUsers();
