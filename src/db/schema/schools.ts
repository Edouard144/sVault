import { pgTable, uuid, varchar, boolean, timestamp } from "drizzle-orm/pg-core";

export const schools = pgTable("schools", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 150 }).notNull(),
  prefix: varchar("prefix", { length: 10 }).notNull().unique(),
  address: varchar("address", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  isFrozen: boolean("is_frozen").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type School = typeof schools.$inferSelect;
export type NewSchool = typeof schools.$inferInsert;
