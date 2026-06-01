import { drizzle } from "drizzle-orm/postgres-js";
import * as postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;
const sql = postgres(connectionString, { prepare: false });
export const db = drizzle(sql);
