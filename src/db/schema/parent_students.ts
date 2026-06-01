import { pgTable, uuid, timestamp, unique } from "drizzle-orm/pg-core";
import { parents } from "./parents";
import { students } from "./students";

export const parentStudents = pgTable(
  "parent_students",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    parentId: uuid("parent_id")
      .notNull()
      .references(() => parents.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    linkedAt: timestamp("linked_at").defaultNow().notNull(),
  },
  (table) => ({
    uniqueParentStudent: unique().on(table.parentId, table.studentId),
  })
);

export type ParentStudent = typeof parentStudents.$inferSelect;
export type NewParentStudent = typeof parentStudents.$inferInsert;
