import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

export default {
  // ─── Where your schema tables are defined ───
  schema: "./src/db/schema/index.ts",

  // ─── Where drizzle puts generated migration files ───
  out: "./src/db/migrations",

  // ─── Neon uses PostgreSQL ───
  dialect: "postgresql",

  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },

  // ─── Log every SQL query drizzle generates ───
  verbose: true,
  strict: true,
} satisfies Config;