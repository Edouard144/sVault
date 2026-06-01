import { pgTable, uuid, varchar, boolean, timestamp, pgEnum, text } from "drizzle-orm/pg-core";
import { parents } from "./parents";

export const notificationTypeEnum = pgEnum("notification_type", [
  "deposit_success",
  "withdrawal_success",
  "withdrawal_reversed",
  "low_balance",
  "account_frozen",
]);

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  parentId: uuid("parent_id")
    .notNull()
    .references(() => parents.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title", { length: 100 }).notNull(),
  body: text("body").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  isPushed: boolean("is_pushed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
