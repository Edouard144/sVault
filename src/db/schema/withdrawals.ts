import { pgTable, uuid, varchar, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { students } from "./students";
import { staff } from "./staff";

export const withdrawalStatusEnum = pgEnum("withdrawal_status", [
  "pending",
  "approved",
  "rejected",
  "reversed",
]);

export const withdrawals = pgTable("withdrawals", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "restrict" }),
  staffId: uuid("staff_id")
    .notNull()
    .references(() => staff.id, { onDelete: "restrict" }),
  amount: integer("amount").notNull(),
  reason: varchar("reason", { length: 255 }).notNull(),
  status: withdrawalStatusEnum("status").default("pending").notNull(),
  verifiedAt: timestamp("verified_at"),
  reversalReason: varchar("reversal_reason", { length: 255 }),
  reversedBy: uuid("reversed_by").references(() => staff.id),
  reversedAt: timestamp("reversed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Withdrawal = typeof withdrawals.$inferSelect;
export type NewWithdrawal = typeof withdrawals.$inferInsert;
