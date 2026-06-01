import { pgTable, uuid, varchar, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { parents } from "./parents";
import { students } from "./students";

export const depositStatusEnum = pgEnum("deposit_status", [
  "pending",
  "completed",
  "failed",
]);

export const deposits = pgTable("deposits", {
  id: uuid("id").primaryKey().defaultRandom(),
  parentId: uuid("parent_id")
    .notNull()
    .references(() => parents.id, { onDelete: "restrict" }),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "restrict" }),
  amount: integer("amount").notNull(),
  status: depositStatusEnum("status").default("pending").notNull(),
  momoTransactionId: varchar("momo_transaction_id", { length: 100 }),
  payerPhone: varchar("payer_phone", { length: 20 }),
  confirmedAt: timestamp("confirmed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Deposit = typeof deposits.$inferSelect;
export type NewDeposit = typeof deposits.$inferInsert;
