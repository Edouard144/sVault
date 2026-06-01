import { pgTable, uuid, integer, timestamp, pgEnum, varchar } from "drizzle-orm/pg-core";
import { students } from "./students";
import { deposits } from "./deposits";
import { withdrawals } from "./withdrawals";

export const transactionTypeEnum = pgEnum("transaction_type", [
  "deposit",
  "withdrawal",
]);

export const transactionStatusEnum = pgEnum("transaction_status", [
  "completed",
  "reversed",
]);

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "restrict" }),
  type: transactionTypeEnum("type").notNull(),
  status: transactionStatusEnum("status").default("completed").notNull(),
  amount: integer("amount").notNull(),
  balanceAfter: integer("balance_after").notNull(),
  description: varchar("description", { length: 255 }),
  depositId: uuid("deposit_id").references(() => deposits.id),
  withdrawalId: uuid("withdrawal_id").references(() => withdrawals.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
