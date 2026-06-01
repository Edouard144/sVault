import { pgTable, uuid, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { schools } from "./schools";

export const students = pgTable("students", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id, { onDelete: "restrict" }),
  fullName: varchar("full_name", { length: 100 }).notNull(),
  class: varchar("class", { length: 50 }).notNull(),
  admissionNumber: varchar("admission_number", { length: 50 }).notNull().unique(),
  studentToken: varchar("student_token", { length: 30 }).notNull().unique(),
  linkCode: varchar("link_code", { length: 15 }).notNull(),
  pinHash: varchar("pin_hash", { length: 255 }).notNull(),
  balance: integer("balance").default(0).notNull(),
  isFrozen: boolean("is_frozen").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;
