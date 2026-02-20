import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "career-sniper.db");
const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

console.log("Running migrations...");

migrate(db, { migrationsFolder: "./drizzle" });

console.log("Migrations completed!");

sqlite.close();
