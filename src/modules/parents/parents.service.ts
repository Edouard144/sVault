import { eq } from "drizzle-orm";
import { db } from "../../config/db";
import { parents, parentStudents, students } from "../../db/schema/index";
import { AppError } from "../../middleware/error.middleware";
import type { UpdateParentInput } from "./parents.schema";

export const getMyProfileService = async (parentId: string) => {
  const parent = await db.query.parents.findFirst({
    where: eq(parents.id, parentId),
  });

  if (!parent) {
    throw new AppError("Parent not found", 404);
  }

  const linkedStudents = await db
    .select({
      id: students.id,
      fullName: students.fullName,
      class: students.class,
      admissionNumber: students.admissionNumber,
      studentToken: students.studentToken,
      balance: students.balance,
      isFrozen: students.isFrozen,
      linkedAt: parentStudents.linkedAt,
    })
    .from(parentStudents)
    .innerJoin(students, eq(parentStudents.studentId, students.id))
    .where(eq(parentStudents.parentId, parentId));

  return {
    id: parent.id,
    fullName: parent.fullName,
    phone: parent.phone,
    isFrozen: parent.isFrozen,
    createdAt: parent.createdAt,
    students: linkedStudents,
  };
};

export const updateMyProfileService = async (
  parentId: string,
  input: UpdateParentInput
) => {
  const parent = await db.query.parents.findFirst({
    where: eq(parents.id, parentId),
  });

  if (!parent) {
    throw new AppError("Parent not found", 404);
  }

  const [updated] = await db
    .update(parents)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(parents.id, parentId))
    .returning();

  return {
    id: updated.id,
    fullName: updated.fullName,
    phone: updated.phone,
    updatedAt: updated.updatedAt,
  };
};
