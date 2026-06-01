import { eq, count, sql } from "drizzle-orm";
import { db } from "../../config/db";
import {
  schools,
  staff,
  students,
  parents,
  deposits,
  withdrawals,
} from "../../db/schema/index";
import { AppError } from "../../middleware/error.middleware";
import type { StaffRole } from "../../types/index";

// ─────────────────────────────────────────
// System overview — all key counts
// ─────────────────────────────────────────
export const getSystemOverviewService = async () => {
  const [schoolCount] = await db.select({ count: count() }).from(schools);
  const [staffCount] = await db.select({ count: count() }).from(staff);
  const [studentCount] = await db.select({ count: count() }).from(students);
  const [parentCount] = await db.select({ count: count() }).from(parents);

  return {
    schools: schoolCount.count,
    staff: staffCount.count,
    students: studentCount.count,
    parents: parentCount.count,
  };
};

// ─────────────────────────────────────────
// School-specific overview
// ─────────────────────────────────────────
export const getSchoolOverviewService = async (
  schoolId: string
) => {
  const school = await db.query.schools.findFirst({
    where: eq(schools.id, schoolId),
  });

  if (!school) {
    throw new AppError("School not found", 404);
  }

  const [studentCount] = await db
    .select({ count: count() })
    .from(students)
    .where(eq(students.schoolId, schoolId));

  const [staffCount] = await db
    .select({ count: count() })
    .from(staff)
    .where(eq(staff.schoolId, schoolId));

  const [depositStats] = await db
    .select({
      count: count(),
      total: sql<number>`SUM(amount)`,
    })
    .from(deposits)
    .innerJoin(students, eq(deposits.studentId, students.id))
    .where(eq(students.schoolId, schoolId));

  const [withdrawalStats] = await db
    .select({
      count: count(),
      total: sql<number>`SUM(amount)`,
    })
    .from(withdrawals)
    .innerJoin(students, eq(withdrawals.studentId, students.id))
    .where(eq(students.schoolId, schoolId));

  return {
    school: {
      id: school.id,
      name: school.name,
      prefix: school.prefix,
      isFrozen: school.isFrozen,
    },
    stats: {
      students: studentCount.count,
      staff: staffCount.count,
      totalDeposits: Number(depositStats.total) || 0,
      depositCount: depositStats.count,
      totalWithdrawals: Number(withdrawalStats.total) || 0,
      withdrawalCount: withdrawalStats.count,
    },
  };
};

// ─────────────────────────────────────────
// Freeze / unfreeze a school
// ─────────────────────────────────────────
export const toggleSchoolFreezeService = async (
  schoolId: string,
  _staffId: string,
  _staffRole: StaffRole
) => {
  const school = await db.query.schools.findFirst({
    where: eq(schools.id, schoolId),
  });

  if (!school) {
    throw new AppError("School not found", 404);
  }

  const [updated] = await db
    .update(schools)
    .set({ isFrozen: !school.isFrozen, updatedAt: new Date() })
    .where(eq(schools.id, schoolId))
    .returning();

  return {
    id: updated.id,
    name: updated.name,
    isFrozen: updated.isFrozen,
    message: updated.isFrozen
      ? "School has been frozen. All transactions blocked."
      : "School has been unfrozen. Transactions can resume.",
  };
};

// ─────────────────────────────────────────
// Freeze / unfreeze a student
// ─────────────────────────────────────────
export const toggleStudentFreezeService = async (
  studentId: string,
  _schoolId: string
) => {
  const student = await db.query.students.findFirst({
    where: eq(students.id, studentId),
  });

  if (!student) {
    throw new AppError("Student not found", 404);
  }

  const [updated] = await db
    .update(students)
    .set({ isFrozen: !student.isFrozen, updatedAt: new Date() })
    .where(eq(students.id, studentId))
    .returning();

  return {
    id: updated.id,
    fullName: updated.fullName,
    isFrozen: updated.isFrozen,
    message: updated.isFrozen
      ? "Student account frozen. No withdrawals allowed."
      : "Student account unfrozen.",
  };
};
