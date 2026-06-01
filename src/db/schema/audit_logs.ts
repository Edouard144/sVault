import { pgTable, uuid, varchar, timestamp, pgEnum, text, jsonb } from "drizzle-orm/pg-core";

export const auditActorEnum = pgEnum("audit_actor", [
  "parent",
  "staff",
  "admin",
  "system",
]);

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorType: auditActorEnum("actor_type").notNull(),
  actorId: uuid("actor_id").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  targetType: varchar("target_type", { length: 50 }),
  targetId: uuid("target_id"),
  metadata: jsonb("metadata"),
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
